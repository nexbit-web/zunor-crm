// src/routes/(app)/moderation/[id]/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { requireStaff } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'

import type { Actions, PageServerLoad } from './$types'

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

const StatusSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  reason: z.string().trim().max(500).optional(),
})

export const actions: Actions = {
  setStatus: async ({ locals, params, request }) => {
    const admin = requireStaff(locals) // авторизація на дії

    const fd = await request.formData()
    const parsed = StatusSchema.safeParse({
      status: fd.get('status'),
      reason: fd.get('reason') ?? undefined,
    })
    if (!parsed.success) return fail(400, { error: 'Невірні дані рішення.' })

    const { status, reason } = parsed.data
    if (status === 'REJECTED' && (!reason || reason.length < 5)) {
      return fail(400, {
        error: 'Для відхилення вкажіть причину (мінімум 5 символів).',
      })
    }

    await prisma.masterProfile.updateMany({
      where: { userId: params.id },
      data: {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verificationRejectReason: status === 'REJECTED' ? reason! : null,
      },
    })

    console.info('moderation: status changed', {
      adminId: admin.id,
      masterId: params.id,
      status,
    })

    redirect(303, '/moderation')
  },
}
