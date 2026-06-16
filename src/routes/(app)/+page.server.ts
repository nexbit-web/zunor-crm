import { redirect } from '@sveltejs/kit'
import { requireStaff } from '$lib/server/guards'
import { atLeast } from '$lib/permissions'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => {
  const user = requireStaff(locals)
  redirect(303, atLeast(user.role, 'MANAGER') ? '/statistics' : '/moderation')
}
