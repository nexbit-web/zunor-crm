// src/routes/(app)/clients/[id]/+page.server.ts
import { error } from '@sveltejs/kit'
import { requireStaff } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
  requireStaff(locals)

  // findFirst — щоб одночасно фільтрувати по id та role.
  const client = await prisma.user.findFirst({
    where: { id: params.id, role: 'CLIENT' },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      city: true,
      avatar: true,
      bio: true,
      emailVerified: true,
      isOnline: true,
      createdAt: true,
      avgRatingAsClient: true,
      reviewsCountAsClient: true,
      _count: {
        select: { clientOrders: true, jobs: true, authoredReviews: true },
      },
      clientOrders: {
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          priceCents: true,
          currency: true,
          createdAt: true,
          master: { select: { name: true } },
        },
      },
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          category: true,
          city: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })

  if (!client) error(404, 'Клієнта не знайдено')

  return { client }
}
