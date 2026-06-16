// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { APIError } from 'better-auth/api'
import { auth } from '$lib/server/auth'
import { prisma } from '$lib/server/prisma'
import { rateLimit } from '$lib/server/rate-limit'
import { isStaff, atLeast } from '$lib/permissions'
import type { Actions, PageServerLoad } from './$types'

const LoginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
  redirectTo: z.string().optional(),
})

/** Куди вести staff після входу: MODERATOR не має статистики → на модерацію. */
function landingFor(role: string): string {
  return atLeast(role, 'MANAGER') ? '/statistics' : '/moderation'
}

export const load: PageServerLoad = ({ locals }) => {
  // Вже залогінений співробітник — форма не потрібна.
  if (isStaff(locals.user?.role)) redirect(303, landingFor(locals.user!.role))
  return {}
}

export const actions: Actions = {
  default: async ({ request, getClientAddress, cookies }) => {
    const ip = getClientAddress()
    if (!rateLimit(`login:${ip}`, 5, 60_000).ok) {
      return fail(429, {
        error: 'Забагато спроб. Спробуйте за хвилину.',
        email: '',
      })
    }

    const raw = Object.fromEntries(await request.formData())
    const parsed = LoginSchema.safeParse(raw)
    const email = typeof raw.email === 'string' ? raw.email : ''
    // Клієнтська валідація — лише UX; рішення приймає сервер. Назовні — узагальнено.
    if (!parsed.success) {
      return fail(400, { error: 'Невірний email або пароль.', email })
    }

    let userRole = ''
    try {
      // Верифікація пароля + сесія. Cookie ставить плагін sveltekitCookies.
      const result = await auth.api.signInEmail({
        body: {
          email: parsed.data.email,
          password: parsed.data.password,
          rememberMe: true,
        },
        headers: request.headers,
      })

      // Авторизація: роль і бан читаємо з БД на сервері, ніколи з клієнта.
      const dbUser = await prisma.user.findUnique({
        where: { id: result.user.id },
        select: { role: true, banned: true },
      })

      // Пускаємо лише staff і не забанених. Інакше — відкликаємо щойно видану сесію.
      if (!dbUser || !isStaff(dbUser.role) || dbUser.banned) {
        await prisma.session.deleteMany({ where: { token: result.token } })
        cookies.delete('better-auth.session_token', { path: '/' })
        cookies.delete('__Secure-better-auth.session_token', { path: '/' })
        return fail(403, { error: 'Невірний email або пароль.', email })
      }

      userRole = dbUser.role
    } catch (err) {
      // APIError = невірні креди / бан / вимкнений акаунт. Деталі — в лог, користувачу — дженерик.
      if (err instanceof APIError)
        console.warn('login failed', { ip, status: err.status })
      else console.error('login error', err)
      return fail(400, { error: 'Невірний email або пароль.', email })
    }

    // Open-redirect guard: лише відносні same-site шляхи; інакше — ролевий лендинг.
    const to = parsed.data.redirectTo
    const dest =
      to && to.startsWith('/') && !to.startsWith('//')
        ? to
        : landingFor(userRole)
    redirect(303, dest)
  },
}
