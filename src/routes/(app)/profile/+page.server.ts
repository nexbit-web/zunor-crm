// src/routes/(app)/profile/+page.server.ts
import { requireStaff } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import { auth } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const current = requireStaff(locals)

  // Свіжі дані з БД, лише безпечні поля.
  const profile = await prisma.user.findUnique({
    where: { id: current.id },
    select: {
      name: true,
      email: true,
      username: true,
      phone: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  })

  if (!profile) redirect(303, '/login') // акаунт зник — розлогінюємо

  return { profile }
}

export const actions: Actions = {
  logout: async ({ request }) => {
    // Серверний вихід: Better Auth відкликає сесію, плагін чистить cookie.
    try {
      await auth.api.signOut({ headers: request.headers })
    } catch {
      // навіть якщо сесія вже померла — все одно ведемо на логін
    }
    redirect(303, '/login')
  },
}
