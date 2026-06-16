// src/routes/(app)/admins/+page.server.ts
import { fail } from '@sveltejs/kit'
import { z } from 'zod'
import { requireRole } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import { rateLimit } from '$lib/server/rate-limit'
import { STAFF_ROLES } from '$lib/permissions'
import {
  createStaff,
  setStaffRole,
  blockUser,
  unblockUser,
  removeStaff,
} from '$lib/server/staff'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const me = requireRole(locals, 'ADMIN') // керування персоналом — лише ADMIN

  const staff = await prisma.user.findMany({
    where: { role: { in: [...STAFF_ROLES] } },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      banReason: true,
      createdAt: true,
    },
  })

  return { staff, meId: me.id, roles: STAFF_ROLES }
}

const RoleEnum = z.enum(['ADMIN', 'MANAGER', 'MODERATOR'])
const CreateSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(12).max(128),
  role: RoleEnum,
})
const IdSchema = z.object({ userId: z.string().min(1) })
const RoleSchema = z.object({ userId: z.string().min(1), role: RoleEnum })
const BlockSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().max(200).optional(),
})

/** Дістаємо безпечне повідомлення з нашого error(400, ...); інакше — загальне. */
function safeMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'body' in e) {
    const body = (e as { body?: { message?: string } }).body
    if (body?.message) return body.message
  }
  return fallback
}

export const actions: Actions = {
  create: async ({ locals, request }) => {
    const me = requireRole(locals, 'ADMIN')
    if (!rateLimit(`staff-create:${me.id}`, 10, 60_000).ok) {
      return fail(429, { error: 'Забагато спроб' })
    }
    const parsed = CreateSchema.safeParse(
      Object.fromEntries(await request.formData()),
    )
    if (!parsed.success) {
      return fail(400, { error: 'Перевірте поля (пароль ≥ 12 символів)' })
    }
    try {
      await createStaff(me, request.headers, parsed.data)
    } catch (e) {
      return fail(400, {
        error: safeMessage(e, 'Не вдалося створити (можливо, email зайнятий)'),
      })
    }
    return { success: 'Співробітника створено' }
  },

  setRole: async ({ locals, request }) => {
    const me = requireRole(locals, 'ADMIN')
    const parsed = RoleSchema.safeParse(
      Object.fromEntries(await request.formData()),
    )
    if (!parsed.success) return fail(400, { error: 'Невірні дані' })
    try {
      await setStaffRole(me, parsed.data.userId, parsed.data.role)
    } catch (e) {
      return fail(400, { error: safeMessage(e, 'Не вдалося змінити роль') })
    }
    return { success: 'Роль оновлено' }
  },

  block: async ({ locals, request }) => {
    const me = requireRole(locals, 'ADMIN')
    const parsed = BlockSchema.safeParse(
      Object.fromEntries(await request.formData()),
    )
    if (!parsed.success) return fail(400, { error: 'Невірні дані' })
    try {
      await blockUser(
        me,
        request.headers,
        parsed.data.userId,
        parsed.data.reason ?? '',
      )
    } catch (e) {
      return fail(400, { error: safeMessage(e, 'Не вдалося заблокувати') })
    }
    return { success: 'Заблоковано' }
  },

  unblock: async ({ locals, request }) => {
    const me = requireRole(locals, 'ADMIN')
    const parsed = IdSchema.safeParse(
      Object.fromEntries(await request.formData()),
    )
    if (!parsed.success) return fail(400, { error: 'Невірні дані' })
    try {
      await unblockUser(me, request.headers, parsed.data.userId)
    } catch (e) {
      return fail(400, { error: safeMessage(e, 'Не вдалося розблокувати') })
    }
    return { success: 'Розблоковано' }
  },

  remove: async ({ locals, request }) => {
    const me = requireRole(locals, 'ADMIN')
    const parsed = IdSchema.safeParse(
      Object.fromEntries(await request.formData()),
    )
    if (!parsed.success) return fail(400, { error: 'Невірні дані' })
    try {
      await removeStaff(me, request.headers, parsed.data.userId)
    } catch (e) {
      return fail(400, { error: safeMessage(e, 'Не вдалося видалити') })
    }
    return { success: 'Видалено' }
  },
}
