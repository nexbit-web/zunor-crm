// src/routes/(app)/masters/[id]/+page.server.ts
import { error } from '@sveltejs/kit'
import { requireStaff } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
  requireStaff(locals)

  const master = await prisma.user.findFirst({
    where: { id: params.id, role: 'MASTER' },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      avatar: true,
      bio: true,
      city: true,
      emailVerified: true,
      isOnline: true,
      lastSeen: true,
      createdAt: true,
      avgRatingAsMaster: true,
      reviewsCountAsMaster: true,
      masterProfile: {
        select: {
          description: true,
          categories: true,
          metadata: true,
          portfolioImages: true,
          verificationStatus: true,
          verificationRejectReason: true,
          verifiedAt: true,
          isActive: true,
          completedOrders: true,
          totalOrders: true,
          createdAt: true,
        },
      },
      masterOrders: {
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          priceCents: true,
          currency: true,
          createdAt: true,
          client: { select: { name: true } },
        },
      },
    },
  })

  if (!master) error(404, 'Майстра не знайдено')

  const cats = master.masterProfile?.categories ?? []

  const [categoryList, reviews] = await Promise.all([
    prisma.category.findMany({
      where: { slug: { in: cats } },
      select: { slug: true, name: true },
    }),
    // відгуки про майстра: через замовлення, де він майстер, напрям CLIENT_TO_MASTER
    prisma.review.findMany({
      where: { direction: 'CLIENT_TO_MASTER', order: { masterId: master.id } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { name: true, avatar: true } },
      },
    }),
  ])

  const categoryMap = Object.fromEntries(
    categoryList.map((c) => [c.slug, c.name]),
  )

  return { master, reviews, categoryMap }
}
