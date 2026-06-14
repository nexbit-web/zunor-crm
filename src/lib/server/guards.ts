import { error, redirect } from '@sveltejs/kit'

export function requireStaff(locals: App.Locals) {
  const user = locals.user
  if (!user) throw redirect(303, '/login') // ← throw!
  if (user.role !== 'ADMIN') throw error(403, 'Доступ заборонено') // ← throw!
  return user
}
