import { requireStaff } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, depends }) => {
  const user = requireStaff(locals)
  depends('app:moderation') // ключ для invalidate('app:moderation')

  // «На модерацію» = подані й чекають рішення.
  const moderationPending = await prisma.masterProfile.count({
    where: { verificationStatus: 'PENDING' },
  })

  return {
    user: { name: user.name, email: user.email, image: user.image ?? null },
    moderationPending,
  }
}
