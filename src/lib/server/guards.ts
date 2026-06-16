import { redirect, error } from '@sveltejs/kit'
import { isStaff, atLeast, type Role } from '$lib/permissions'

type StaffUser = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: Role
  banned?: boolean
}

export function requireStaff(locals: App.Locals): StaffUser {
  const u = locals.user
  if (!u) redirect(303, '/login')
  if (!isStaff(u.role) || u.banned) redirect(303, '/login?error=forbidden')
  return u as StaffUser
}

export function requireRole(locals: App.Locals, min: Role): StaffUser {
  const u = requireStaff(locals)
  if (!atLeast(u.role, min)) error(403, 'Доступ заборонено')
  return u
}
