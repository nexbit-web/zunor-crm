<!-- src/routes/(app)/statistics/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Chart from '$lib/components/ui/chart/index.js'
  import StatsSkeleton from '$lib/components/statistics/StatsSkeleton.svelte'
  import { LineChart, BarChart, PieChart } from 'layerchart'
  import { scaleBand } from 'd3-scale'
  import {
    Users,
    BadgeCheck,
    Wallet,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
  } from '@lucide/svelte'
  import { invalidate } from '$app/navigation'
  import { Button } from '$lib/components/ui/button'

  let { data }: { data: PageData } = $props()

  // ── Ручне оновлення: перезапуск захищеного load через depends('app:stats') ──
  let refreshing = $state(false)
  async function refresh(): Promise<void> {
    if (refreshing) return
    refreshing = true
    try {
      await invalidate('app:stats')
    } finally {
      refreshing = false
    }
  }

  const nf = new Intl.NumberFormat('uk-UA')
  function moneyShort(cents: number): string {
    const v = cents / 100
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.0', '') + ' млн ₴'
    if (v >= 1e3) return Math.round(v / 1e3) + ' тис ₴'
    return nf.format(v) + ' ₴'
  }
  function delta(s: number[]): number | null {
    if (s.length < 2) return null
    const prev = s[s.length - 2],
      cur = s[s.length - 1]
    if (!prev) return null
    return ((cur - prev) / prev) * 100
  }

  const usersSeries = $derived(data.growth.users.map((p) => p.value))
  const ordersSeries = $derived(data.growth.orders.map((p) => p.value))

  const kpis = $derived([
    {
      label: 'Користувачі',
      icon: Users,
      value: nf.format(data.users.total),
      unit: '',
      caption: '',
      delta: delta(usersSeries),
    },
    {
      label: 'Завершені замовлення',
      icon: BadgeCheck,
      value: nf.format(data.orders.completed),
      unit: '',
      caption: '',
      delta: delta(ordersSeries),
    },
    {
      label: 'GMV (завершені)',
      icon: Wallet,
      value: moneyShort(data.orders.gmvCents),
      unit: '',
      caption: '',
      delta: delta(ordersSeries),
    },
    {
      label: 'Середня оцінка',
      icon: Star,
      value: data.activity.avgReview.toFixed(1),
      unit: ' / 5',
      caption: nf.format(data.activity.reviews) + ' оцінок',
      delta: null,
    },
  ])

  const growthData = $derived(
    data.growth.users.map((u, i) => ({
      month: u.label,
      users: u.value,
      orders: data.growth.orders[i]?.value ?? 0,
    })),
  )
  const growthConfig = {
    orders: { label: 'Замовлення', color: 'var(--chart-1)' },
    users: { label: 'Нові користувачі', color: 'var(--chart-2)' },
  } satisfies Chart.ChartConfig

  const usersPie = $derived([
    { name: 'clients', value: data.users.clients, color: 'var(--chart-1)' },
    { name: 'masters', value: data.users.masters, color: 'var(--chart-2)' },
    { name: 'admins', value: data.users.admins, color: 'var(--chart-3)' },
  ])
  const usersConfig = {
    clients: { label: 'Клієнти', color: 'var(--chart-1)' },
    masters: { label: 'Майстри', color: 'var(--chart-2)' },
    admins: { label: 'Адміни', color: 'var(--chart-3)' },
  } satisfies Chart.ChartConfig
  const usersTotal = $derived(
    data.users.clients + data.users.masters + data.users.admins,
  )

  const jobsBars = $derived([
    { label: 'Відкриті', value: data.jobs.open },
    { label: 'В роботі', value: data.jobs.inProgress },
    { label: 'Завершені', value: data.jobs.completed },
    { label: 'Скасовані', value: data.jobs.cancelled },
    { label: 'Прострочені', value: data.jobs.expired },
  ])
  const ordersBars = $derived([
    { label: 'Створені', value: data.orders.created },
    { label: 'В роботі', value: data.orders.inProgress },
    { label: 'Завершені', value: data.orders.completed },
    { label: 'Скасовані', value: data.orders.cancelled },
  ])
  const mastersBars = $derived([
    { label: 'Верифіковані', value: data.masters.verified },
    { label: 'На перевірці', value: data.masters.pending },
    { label: 'Відхилені', value: data.masters.rejected },
    { label: 'Без статусу', value: data.masters.none },
  ])

  const activity = $derived([
    {
      label: 'Відгуки майстрів',
      value: nf.format(data.activity.proposals),
      small: '',
    },
    { label: 'Оцінки', value: nf.format(data.activity.reviews), small: '' },
    {
      label: 'Середня оцінка',
      value: data.activity.avgReview.toFixed(1),
      small: ' / 5',
    },
    { label: 'Чати', value: nf.format(data.activity.chats), small: '' },
    {
      label: 'Повідомлення',
      value: nf.format(data.activity.messages),
      small: '',
    },
  ])
</script>

{#snippet barCard(
  rows: { label: string; value: number }[],
  seriesLabel: string,
)}
  {@const cfg = {
    value: { label: seriesLabel, color: 'var(--chart-1)' },
  } satisfies Chart.ChartConfig}
  <Chart.Container config={cfg} class="aspect-auto h-55 w-full">
    <BarChart
      data={rows}
      xScale={scaleBand().padding(0.3)}
      x="label"
      axis="x"
      series={[{ key: 'value', label: seriesLabel, color: 'var(--chart-1)' }]}
    >
      {#snippet tooltip()}
        <Chart.Tooltip hideLabel />
      {/snippet}
    </BarChart>
  </Chart.Container>
{/snippet}

<div class="mx-auto flex max-w-310 flex-col gap-4">
  <div class="mb-2 flex items-start justify-between gap-4">
    <div>
      <h1
        class="text-foreground text-[clamp(24px,3vw,30px)] font-bold tracking-tight"
      >
        Статистика
      </h1>
      <p class="text-muted-foreground mt-1.5 text-sm">
        Повна аналітика платформи
      </p>
    </div>

    <Button
      variant="outline"
      onclick={refresh}
      disabled={refreshing}
      aria-label="Оновити дані"
      title="Оновити дані"
      class="border-border text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw
        size={17}
        strokeWidth={2}
        class={refreshing ? 'animate-spin' : ''}
      />
    </Button>
  </div>

  {#if refreshing}
    <StatsSkeleton />
  {:else}
    <!-- KPI -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each kpis as k (k.label)}
        <Card.Root class="p-5">
          <span
            class="text-muted-foreground flex items-center gap-2 text-[13px] font-medium"
          >
            <k.icon
              size={16}
              strokeWidth={1.9}
              class="text-foreground"
            />{k.label}
          </span>
          <div
            class="text-foreground mt-3 text-[clamp(28px,3.4vw,34px)] leading-none font-bold tracking-tight tabular-nums"
          >
            {k.value}{#if k.unit}<span
                class="text-muted-foreground text-[0.5em] font-semibold"
                >{k.unit}</span
              >{/if}
          </div>
          <div class="mt-3 flex items-center gap-2">
            {#if k.delta !== null}
              {@const up = k.delta >= 0}
              <span
                class="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold {up
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}"
              >
                {#if up}<ArrowUpRight
                    size={13}
                    strokeWidth={2.4}
                  />{:else}<ArrowDownRight size={13} strokeWidth={2.4} />{/if}
                {Math.abs(k.delta).toFixed(1)}%
              </span>
              <span class="text-muted-foreground text-xs">до минулого міс.</span
              >
            {:else if k.caption}
              <span class="text-muted-foreground text-xs">{k.caption}</span>
            {/if}
          </div>
        </Card.Root>
      {/each}
    </div>

    <!-- GROWTH + USERS PIE -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
      <Card.Root>
        <Card.Header
          ><Card.Title class="text-base"
            >Зростання за {growthData.length} міс.</Card.Title
          ></Card.Header
        >
        <Card.Content>
          <Chart.Container
            config={growthConfig}
            class="aspect-auto h-65 w-full"
          >
            <LineChart
              data={growthData}
              x="month"
              axis="x"
              legend
              series={[
                { key: 'orders', label: 'Замовлення', color: 'var(--chart-1)' },
                {
                  key: 'users',
                  label: 'Нові користувачі',
                  color: 'var(--chart-2)',
                },
              ]}
            >
              {#snippet tooltip()}
                <Chart.Tooltip />
              {/snippet}
            </LineChart>
          </Chart.Container>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header
          ><Card.Title class="text-base">Склад користувачів</Card.Title
          ></Card.Header
        >
        <Card.Content class="flex flex-col items-center gap-4">
          <Chart.Container
            config={usersConfig}
            class="mx-auto aspect-square w-full max-w-55"
          >
            <PieChart
              data={usersPie}
              key="name"
              value="value"
              c="color"
              cRange={usersPie.map((d) => d.color)}
              innerRadius={58}
            >
              {#snippet tooltip()}
                <Chart.Tooltip hideLabel nameKey="name" />
              {/snippet}
            </PieChart>
          </Chart.Container>

          <div class="flex w-full flex-col gap-2">
            {#each usersPie as s (s.name)}
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2">
                  <span
                    class="size-2.5 rounded-[3px]"
                    style:background={s.color}
                  ></span>
                  {usersConfig[s.name as keyof typeof usersConfig].label}
                </span>
                <span class="font-semibold tabular-nums">
                  {nf.format(s.value)}<span
                    class="text-muted-foreground ml-1.5 text-xs"
                    >{((s.value / (usersTotal || 1)) * 100).toFixed(0)}%</span
                  >
                </span>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- JOBS + ORDERS -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card.Root>
        <Card.Header
          ><div class="flex items-center justify-between">
            <Card.Title class="text-base">Заявки</Card.Title><span
              class="text-muted-foreground text-xs"
              >Усього {nf.format(data.jobs.total)}</span
            >
          </div></Card.Header
        >
        <Card.Content>{@render barCard(jobsBars, 'Заявки')}</Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Header
          ><div class="flex items-center justify-between">
            <Card.Title class="text-base">Замовлення</Card.Title><span
              class="text-muted-foreground text-xs"
              >Усього {nf.format(data.orders.total)}</span
            >
          </div></Card.Header
        >
        <Card.Content>{@render barCard(ordersBars, 'Замовлення')}</Card.Content>
      </Card.Root>
    </div>

    <!-- MASTERS + ACTIVITY -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
      <Card.Root>
        <Card.Header
          ><Card.Title class="text-base">Майстри за статусом</Card.Title
          ></Card.Header
        >
        <Card.Content>{@render barCard(mastersBars, 'Майстри')}</Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Header
          ><Card.Title class="text-base">Активність</Card.Title></Card.Header
        >
        <Card.Content>
          <div class="grid grid-cols-2 gap-y-5 sm:grid-cols-3">
            {#each activity as a, i (a.label)}
              <div
                class="px-5 {i % 3 === 0
                  ? 'border-l-0 pl-0'
                  : 'border-border border-l'}"
              >
                <div
                  class="text-[clamp(20px,2.4vw,26px)] font-bold tracking-tight tabular-nums"
                >
                  {a.value}{#if a.small}<small
                      class="text-muted-foreground text-sm font-semibold"
                      >{a.small}</small
                    >{/if}
                </div>
                <div class="text-muted-foreground mt-1 text-[13px]">
                  {a.label}
                </div>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
