// src/routes/(app)/statistics/+page.server.ts
import { requireStaff } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  requireStaff(locals)

  const now = new Date()
  const since = new Date(now.getFullYear(), now.getMonth() - 5, 1) // початок 6-місячного вікна

  const [
    usersByRole,
    emailVerified,
    mastersByStatus,
    mastersActive,
    jobsByStatus,
    ordersByStatus,
    gmv,
    proposals,
    reviewsAgg,
    chats,
    messages,
    growthUsers,
    growthOrders,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.masterProfile.groupBy({
      by: ['verificationStatus'],
      _count: { _all: true },
    }),
    prisma.masterProfile.count({ where: { isActive: true } }),
    prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { priceCents: true },
    }),
    prisma.proposal.count(),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, role: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ])

  const role = (r: string) =>
    usersByRole.find((x) => x.role === r)?._count._all ?? 0
  const verif = (s: string) =>
    mastersByStatus.find((x) => x.verificationStatus === s)?._count._all ?? 0
  const job = (s: string) =>
    jobsByStatus.find((x) => x.status === s)?._count._all ?? 0
  const order = (s: string) =>
    ordersByStatus.find((x) => x.status === s)?._count._all ?? 0

  // Бакети по місяцях (6 шт.)
  const labelFmt = new Intl.DateTimeFormat('uk-UA', { month: 'short' })
  const buckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: labelFmt.format(d),
    }
  })
  const idxOf = new Map(buckets.map((b, i) => [b.key, i]))
  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`

  const usersSeries = buckets.map((b) => ({ label: b.label, value: 0 }))
  const clientsSeries = buckets.map((b) => ({ label: b.label, value: 0 }))
  const mastersSeries = buckets.map((b) => ({ label: b.label, value: 0 }))
  for (const u of growthUsers) {
    const i = idxOf.get(keyOf(u.createdAt))
    if (i === undefined) continue
    usersSeries[i].value++
    if (u.role === 'CLIENT') clientsSeries[i].value++
    else if (u.role === 'MASTER') mastersSeries[i].value++
  }

  const ordersSeries = buckets.map((b) => ({ label: b.label, value: 0 }))
  for (const o of growthOrders) {
    const i = idxOf.get(keyOf(o.createdAt))
    if (i !== undefined) ordersSeries[i].value++
  }

  const sum = (arr: { _count: { _all: number } }[]) =>
    arr.reduce((s, x) => s + x._count._all, 0)

  return {
    users: {
      total: role('CLIENT') + role('MASTER') + role('ADMIN'),
      clients: role('CLIENT'),
      masters: role('MASTER'),
      admins: role('ADMIN'),
      emailVerified,
    },
    masters: {
      verified: verif('VERIFIED'),
      pending: verif('PENDING'),
      rejected: verif('REJECTED'),
      none: verif('NONE'),
      active: mastersActive,
    },
    jobs: {
      open: job('OPEN'),
      inProgress: job('IN_PROGRESS'),
      completed: job('COMPLETED'),
      cancelled: job('CANCELLED'),
      expired: job('EXPIRED'),
      total: sum(jobsByStatus),
    },
    orders: {
      created: order('CREATED'),
      inProgress: order('IN_PROGRESS'),
      completed: order('COMPLETED'),
      cancelled: order('CANCELLED'),
      total: sum(ordersByStatus),
      gmvCents: gmv._sum.priceCents ?? 0,
    },
    activity: {
      proposals,
      reviews: reviewsAgg._count._all,
      avgReview: reviewsAgg._avg.rating ?? 0,
      chats,
      messages,
    },
    growth: {
      users: usersSeries,
      clients: clientsSeries,
      masters: mastersSeries,
      orders: ordersSeries,
    },
  }
}
