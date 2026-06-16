import { z } from 'zod'
import { requireRole } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import type { PageServerLoad } from './$types'

const Period = z.enum(['7d', '30d', '90d', '12m'])
type Gran = 'day' | 'week' | 'month'

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate())
const weekStart = (d: Date) => {
  const x = startOfDay(d)
  return new Date(x.getTime() - ((x.getDay() + 6) % 7) * 864e5)
}
const fmtDay = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
})
const fmtMonth = new Intl.DateTimeFormat('uk-UA', { month: 'short' })

function bucketOf(d: Date, gran: Gran) {
  if (gran === 'day') {
    const s = startOfDay(d)
    return { key: s.toISOString().slice(0, 10), label: fmtDay.format(s) }
  }
  if (gran === 'week') {
    const s = weekStart(d)
    return { key: s.toISOString().slice(0, 10), label: fmtDay.format(s) }
  }
  const s = new Date(d.getFullYear(), d.getMonth(), 1)
  return {
    key: `${s.getFullYear()}-${s.getMonth()}`,
    label: fmtMonth.format(s),
  }
}

function windowFor(period: z.infer<typeof Period>) {
  const now = new Date()
  if (period === '12m') {
    const since = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const prevSince = new Date(since.getFullYear(), since.getMonth() - 12, 1)
    return { now, since, prevSince, gran: 'month' as Gran }
  }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const since = startOfDay(new Date(now.getTime() - (days - 1) * 864e5))
  const prevSince = startOfDay(new Date(since.getTime() - days * 864e5))
  return {
    now,
    since,
    prevSince,
    gran: (period === '90d' ? 'week' : 'day') as Gran,
  }
}

function pctDelta(cur: number, prev: number): number | null {
  if (!prev) return cur > 0 ? 100 : null
  return ((cur - prev) / prev) * 100
}

export const load: PageServerLoad = async ({ locals, url, depends }) => {
  requireRole(locals, 'MANAGER') // аналітика — MANAGER+
  depends('app:stats')

  const period = Period.catch('30d').parse(
    url.searchParams.get('period') ?? '30d',
  )
  const { now, since, prevSince, gran } = windowFor(period)

  const [
    users,
    ordersCreated,
    completed,
    comp,
    statusGroup,
    reviewAgg,
    chats,
    messages,
    proposals,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: prevSince } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: { removedAt: null, createdAt: { gte: prevSince } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: {
        removedAt: null,
        status: 'COMPLETED',
        completedAt: { gte: prevSince },
      },
      select: { completedAt: true, priceCents: true },
    }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.order.groupBy({
      by: ['status'],
      where: { removedAt: null },
      _count: true,
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.proposal.count(),
  ])

  // Series для головного графіка (нові за відрізок), з пре-сідом порожніх бакетів
  const seed = new Map<
    string,
    { label: string; users: number; orders: number }
  >()
  let cur =
    gran === 'day'
      ? startOfDay(since)
      : gran === 'week'
        ? weekStart(since)
        : new Date(since)
  while (cur <= now) {
    const { key, label } = bucketOf(cur, gran)
    seed.set(key, { label, users: 0, orders: 0 })
    cur =
      gran === 'day'
        ? new Date(cur.getTime() + 864e5)
        : gran === 'week'
          ? new Date(cur.getTime() + 7 * 864e5)
          : new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  for (const u of users)
    if (u.createdAt >= since) {
      const b = seed.get(bucketOf(u.createdAt, gran).key)
      if (b) b.users++
    }
  for (const o of ordersCreated)
    if (o.createdAt >= since) {
      const b = seed.get(bucketOf(o.createdAt, gran).key)
      if (b) b.orders++
    }
  const series = [...seed.values()]

  // KPI: поточне vs попереднє рівне вікно
  const inCur = (d: Date) => d >= since
  const inPrev = (d: Date) => d >= prevSince && d < since

  const newUsersCur = users.filter((u) => inCur(u.createdAt)).length
  const newUsersPrev = users.filter((u) => inPrev(u.createdAt)).length
  const newOrdersCur = ordersCreated.filter((o) => inCur(o.createdAt)).length
  const newOrdersPrev = ordersCreated.filter((o) => inPrev(o.createdAt)).length

  const gmvCur = completed
    .filter((o) => o.completedAt && inCur(o.completedAt))
    .reduce((s, o) => s + o.priceCents, 0)
  const gmvPrev = completed
    .filter((o) => o.completedAt && inPrev(o.completedAt))
    .reduce((s, o) => s + o.priceCents, 0)
  const completedCur = completed.filter(
    (o) => o.completedAt && inCur(o.completedAt),
  ).length

  const roleCount = Object.fromEntries(
    comp.map((c) => [c.role, c._count]),
  ) as Record<string, number>
  const statusCount = Object.fromEntries(
    statusGroup.map((s) => [s.status, s._count]),
  ) as Record<string, number>

  return {
    period,
    kpi: {
      newUsers: {
        value: newUsersCur,
        delta: pctDelta(newUsersCur, newUsersPrev),
      },
      newOrders: {
        value: newOrdersCur,
        delta: pctDelta(newOrdersCur, newOrdersPrev),
      },
      gmvCents: { value: gmvCur, delta: pctDelta(gmvCur, gmvPrev) },
      avgOrderCents: completedCur ? Math.round(gmvCur / completedCur) : 0,
    },
    series,
    composition: {
      clients: roleCount.CLIENT ?? 0,
      masters: roleCount.MASTER ?? 0,
    },
    orderStatus: {
      created: statusCount.CREATED ?? 0,
      inProgress: statusCount.IN_PROGRESS ?? 0,
      completed: statusCount.COMPLETED ?? 0,
      cancelled: statusCount.CANCELLED ?? 0,
    },
    activity: {
      reviews: reviewAgg._count,
      avgReview: reviewAgg._avg.rating ?? 0,
      chats,
      messages,
      proposals,
    },
  }
}
