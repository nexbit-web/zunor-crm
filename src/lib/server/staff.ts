import { error } from '@sveltejs/kit'
import { auth } from '$lib/server/auth'
import { prisma } from '$lib/server/prisma'
import { STAFF_ROLES, atLeast, isStaff, type Role } from '$lib/permissions'

type Actor = { id: string; role: Role }

/** Кількість активних (не забанених) адмінів — для анти-локаут перевірок. */
async function activeAdminCount(): Promise<number> {
  return prisma.user.count({ where: { role: 'ADMIN', banned: false } })
}

async function targetRole(id: string): Promise<Role | string> {
  const u = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  })
  if (!u) error(404, 'Користувача не знайдено')
  return u.role
}

export async function createStaff(
  actor: Actor,
  headers: Headers,
  input: { email: string; name: string; password: string; role: Role },
): Promise<void> {
  if (actor.role !== 'ADMIN') error(403, 'Forbidden')
  if (!STAFF_ROLES.includes(input.role)) error(400, 'Невірна роль')

  // Better Auth: хешує пароль, створює account-рядок — без самописної криптографії
  await auth.api.createUser({
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
    },
    headers,
  })
  console.info('[staff] created', {
    by: actor.id,
    email: input.email,
    role: input.role,
  })
}

export async function setStaffRole(
  actor: Actor,
  targetId: string,
  role: Role,
): Promise<void> {
  if (actor.role !== 'ADMIN') error(403, 'Forbidden')
  if (!STAFF_ROLES.includes(role)) error(400, 'Невірна роль')
  if (actor.id === targetId) error(400, 'Не можна змінити власну роль')

  const current = await targetRole(targetId)
  // Зняти останнього адміна не можна (інакше система без адміністратора)
  if (
    current === 'ADMIN' &&
    role !== 'ADMIN' &&
    (await activeAdminCount()) <= 1
  ) {
    error(400, 'Не можна зняти останнього адміністратора')
  }

  await prisma.user.update({ where: { id: targetId }, data: { role } })
  console.info('[staff] role changed', { by: actor.id, target: targetId, role })
}

export async function blockUser(
  actor: Actor,
  headers: Headers,
  targetId: string,
  reason: string,
): Promise<void> {
  if (actor.id === targetId) error(400, 'Не можна заблокувати себе')

  const current = await targetRole(targetId)
  if (isStaff(current)) {
    // блок співробітника = дія рівня управління персоналом → лише ADMIN
    if (actor.role !== 'ADMIN') error(403, 'Forbidden')
    if (current === 'ADMIN' && (await activeAdminCount()) <= 1) {
      error(400, 'Не можна заблокувати останнього адміністратора')
    }
  } else if (!atLeast(actor.role, 'MANAGER')) {
    error(403, 'Forbidden')
  }

  // Better Auth: ставить banned + відкликає всі сесії юзера
  await auth.api.banUser({
    body: { userId: targetId, banReason: reason || 'Порушення правил' },
    headers,
  })
  console.info('[staff] blocked', { by: actor.id, target: targetId })
}

export async function unblockUser(
  actor: Actor,
  headers: Headers,
  targetId: string,
): Promise<void> {
  const current = await targetRole(targetId)
  if (isStaff(current)) {
    if (actor.role !== 'ADMIN') error(403, 'Forbidden')
  } else if (actor.role !== 'ADMIN' && actor.role !== 'MANAGER') {
    error(403, 'Forbidden')
  }
  await auth.api.unbanUser({ body: { userId: targetId }, headers })
  console.info('[staff] unblocked', { by: actor.id, target: targetId })
}

export async function removeStaff(
  actor: Actor,
  headers: Headers,
  targetId: string,
): Promise<void> {
  if (actor.role !== 'ADMIN') error(403, 'Forbidden')
  if (actor.id === targetId) error(400, 'Не можна видалити себе')

  const current = await targetRole(targetId)
  if (!isStaff(current)) error(400, 'Це не співробітник')
  if (current === 'ADMIN' && (await activeAdminCount()) <= 1) {
    error(400, 'Не можна видалити останнього адміністратора')
  }

  await auth.api.removeUser({ body: { userId: targetId }, headers })
  console.info('[staff] removed', { by: actor.id, target: targetId })
}
