import { fail } from '@sveltejs/kit'
import { z } from 'zod'
import { requireStaff, requireRole } from '$lib/server/guards'
import { prisma } from '$lib/server/prisma'
import type { Actions, PageServerLoad } from './$types'

const PER_PAGE = 15
// ⚠️ Звір значення з твоїм enum OrderStatus, якщо відрізняються.
const ACTIVE = ['CREATED', 'IN_PROGRESS'] as const

const Params = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().max(100).default(''),
  status: z
    .enum(['active', 'completed', 'cancelled', 'all', 'removed'])
    .default('active'),
  period: z.enum(['day', 'week', 'month']).default('day'),
})

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate())
const weekStart = (d: Date) => {
  const x = startOfDay(d)
  return new Date(x.getTime() - ((x.getDay() + 6) % 7) * 864e5) // понеділок
}
const fmtDay = new Intl.DateTimeFormat('uk-UA', {
  day: '2-digit',
  month: '2-digit',
})
const fmtMonth = new Intl.DateTimeFormat('uk-UA', { month: 'short' })

function bucketOf(d: Date, period: 'day' | 'week' | 'month') {
  if (period === 'day') {
    const s = startOfDay(d)
    return { key: s.toISOString().slice(0, 10), label: fmtDay.format(s) }
  }
  if (period === 'week') {
    const s = weekStart(d)
    return { key: s.toISOString().slice(0, 10), label: fmtDay.format(s) }
  }
  const s = new Date(d.getFullYear(), d.getMonth(), 1)
  return {
    key: `${s.getFullYear()}-${s.getMonth()}`,
    label: fmtMonth.format(s),
  }
}

async function ordersChart(period: 'day' | 'week' | 'month') {
  const now = new Date()
  const since =
    period === 'day'
      ? startOfDay(new Date(now.getTime() - 29 * 864e5))
      : period === 'week'
        ? weekStart(new Date(now.getTime() - 11 * 7 * 864e5))
        : new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const rows = await prisma.order.findMany({
    where: { removedAt: null, createdAt: { gte: since } },
    select: { createdAt: true },
  })

  // Пре-сідимо порожні відрізки, щоб графік не «провалювався»
  const buckets = new Map<string, { label: string; value: number }>()
  let cur =
    period === 'day'
      ? startOfDay(since)
      : period === 'week'
        ? weekStart(since)
        : new Date(since)
  while (cur <= now) {
    const { key, label } = bucketOf(cur, period)
    buckets.set(key, { label, value: 0 })
    cur =
      period === 'day'
        ? new Date(cur.getTime() + 864e5)
        : period === 'week'
          ? new Date(cur.getTime() + 7 * 864e5)
          : new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  for (const o of rows) {
    const b = buckets.get(bucketOf(o.createdAt, period).key)
    if (b) b.value++
  }
  return [...buckets.values()]
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const me = requireStaff(locals)
  const { page, q, status, period } = Params.parse(
    Object.fromEntries(url.searchParams),
  )

  const removedFilter =
    status === 'removed' ? { removedAt: { not: null } } : { removedAt: null }
  const statusFilter =
    status === 'active'
      ? { status: { in: [...ACTIVE] } }
      : status === 'completed'
        ? { status: 'COMPLETED' as const }
        : status === 'cancelled'
          ? { status: 'CANCELLED' as const }
          : {}
  const searchFilter = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { client: { name: { contains: q, mode: 'insensitive' as const } } },
          { master: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      }
    : {}
  const where = { ...removedFilter, ...statusFilter, ...searchFilter }

  const now = new Date()
  const [rows, total, byStatus, gmv, today, chart] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        status: true,
        priceCents: true,
        currency: true,
        createdAt: true,
        removedAt: true,
        removedReason: true,
        client: { select: { name: true } },
        master: { select: { name: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      where: { removedAt: null },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { removedAt: null, status: 'COMPLETED' },
      _sum: { priceCents: true },
    }),
    prisma.order.count({
      where: { removedAt: null, createdAt: { gte: startOfDay(now) } },
    }),
    ordersChart(period),
  ])

  const cnt = Object.fromEntries(
    byStatus.map((s) => [s.status, s._count]),
  ) as Record<string, number>
  const stats = {
    active: (cnt.CREATED ?? 0) + (cnt.IN_PROGRESS ?? 0),
    completed: cnt.COMPLETED ?? 0,
    gmvCents: gmv._sum.priceCents ?? 0,
    today,
  }

  return {
    rows,
    total,
    page,
    perPage: PER_PAGE,
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
    q,
    status,
    period,
    stats,
    chart,
    canRemove: me.role === 'ADMIN', // видалення — лише ADMIN
  }
}

const RemoveSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(5).max(300),
})
const RestoreSchema = z.object({ orderId: z.string().min(1) })

export const actions: Actions = {
  // М'яке видалення: ховаємо + причина + хто + коли. Запис лишається для аудиту/спорів.
  remove: async ({ locals, request }) => {
    const me = requireRole(locals, 'ADMIN')
    const parsed = RemoveSchema.safeParse(
      Object.fromEntries(await request.formData()),
    )
    if (!parsed.success)
      return fail(400, { error: 'Вкажіть причину (мін. 5 символів)' })

    const r = await prisma.order.updateMany({
      where: { id: parsed.data.orderId, removedAt: null },
      data: {
        removedAt: new Date(),
        removedReason: parsed.data.reason,
        removedById: me.id,
      },
    })
    if (r.count === 0) return fail(404, { error: 'Замовлення не знайдено' })
    console.info('[orders] removed', {
      by: me.id,
      orderId: parsed.data.orderId,
      reason: parsed.data.reason,
    })
    return { success: 'Замовлення приховано' }
  },

  restore: async ({ locals, request }) => {
    const me = requireRole(locals, 'ADMIN')
    const parsed = RestoreSchema.safeParse(
      Object.fromEntries(await request.formData()),
    )
    if (!parsed.success) return fail(400, { error: 'Невірні дані' })

    const r = await prisma.order.updateMany({
      where: { id: parsed.data.orderId, removedAt: { not: null } },
      data: { removedAt: null, removedReason: null, removedById: null },
    })
    if (r.count === 0) return fail(404, { error: 'Замовлення не знайдено' })
    console.info('[orders] restored', {
      by: me.id,
      orderId: parsed.data.orderId,
    })
    return { success: 'Замовлення відновлено' }
  },
}
