// src/routes/(app)/clients/+page.server.ts
import { requireStaff } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import { z } from 'zod'
import type { PageServerLoad } from './$types'

const PER_PAGE = 12

const ParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().min(1).max(100).optional().catch(undefined),
})

export const load: PageServerLoad = async ({ locals, url }) => {
  requireStaff(locals)

  const params = ParamsSchema.parse({
    page: url.searchParams.get('page'),
    q: url.searchParams.get('q') ?? undefined,
  })

  const where = {
    role: 'CLIENT' as const,
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: 'insensitive' as const } },
            { email: { contains: params.q, mode: 'insensitive' as const } },
            { username: { contains: params.q, mode: 'insensitive' as const } },
            { phone: { contains: params.q } },
          ],
        }
      : {}),
  }

  const [total, clients] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        // кількість замовлень клієнта — для колонки «Замовлень»
        _count: { select: { clientOrders: true } },
      },
    }),
  ])

  return {
    clients,
    total,
    page: params.page,
    perPage: PER_PAGE,
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
    q: params.q ?? '',
  }
}
