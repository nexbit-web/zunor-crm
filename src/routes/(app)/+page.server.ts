import { redirect } from '@sveltejs/kit'
import { requireStaff } from '$lib/server/guards'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => {
  requireStaff(locals)
  redirect(303, '/statistics')
}
