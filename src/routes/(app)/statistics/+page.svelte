<script lang="ts">
  import type { PageData } from './$types'
  import { page } from '$app/state'
  import { goto, invalidate } from '$app/navigation'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Chart from '$lib/components/ui/chart/index.js'
  import { LineChart, PieChart } from 'layerchart'
  import {
    Users,
    ShoppingBag,
    Wallet,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
  } from '@lucide/svelte'

  let { data }: { data: PageData } = $props()

  const nf = new Intl.NumberFormat('uk-UA')
  function money(cents: number): string {
    const v = cents / 100
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.0', '') + ' млн ₴'
    if (v >= 1e3) return Math.round(v / 1e3) + ' тис ₴'
    return nf.format(Math.round(v)) + ' ₴'
  }

  const periods = [
    { key: '7d', label: '7 днів' },
    { key: '30d', label: '30 днів' },
    { key: '90d', label: '3 місяці' },
    { key: '12m', label: '12 місяців' },
  ]
  function setPeriod(p: string) {
    const s = new URLSearchParams(page.url.search)
    s.set('period', p)
    goto(`?${s.toString()}`, { keepFocus: true, noScroll: true })
  }

  let refreshing = $state(false)
  async function refresh() {
    if (refreshing) return
    refreshing = true
    try {
      await invalidate('app:stats')
    } finally {
      refreshing = false
    }
  }

  const kpis = $derived([
    {
      label: 'Нові користувачі',
      icon: Users,
      value: nf.format(data.kpi.newUsers.value),
      delta: data.kpi.newUsers.delta,
    },
    {
      label: 'Нові замовлення',
      icon: ShoppingBag,
      value: nf.format(data.kpi.newOrders.value),
      delta: data.kpi.newOrders.delta,
    },
    {
      label: 'Дохід',
      icon: Wallet,
      value: money(data.kpi.gmvCents.value),
      delta: data.kpi.gmvCents.delta,
    },
    {
      label: 'Середній чек',
      icon: Receipt,
      value: money(data.kpi.avgOrderCents),
      delta: null,
    },
  ])

  const lineConfig = {
    users: { label: 'Нові користувачі', color: 'var(--chart-1)' },
    orders: { label: 'Замовлення', color: 'var(--chart-2)' },
  } satisfies Chart.ChartConfig

  const compTotal = $derived(
    data.composition.clients + data.composition.masters,
  )
  const compPie = $derived([
    {
      name: 'clients',
      value: data.composition.clients,
      color: 'var(--chart-1)',
    },
    {
      name: 'masters',
      value: data.composition.masters,
      color: 'var(--chart-2)',
    },
  ])
  const compConfig = {
    clients: { label: 'Клієнти', color: 'var(--chart-1)' },
    masters: { label: 'Майстри', color: 'var(--chart-2)' },
  } satisfies Chart.ChartConfig

  // ── Баланс клієнти/майстри для аналітики попиту/пропозиції ──
  const clients = $derived(data.composition.clients)
  const masters = $derived(data.composition.masters)
  const compTotalSafe = $derived(clients + masters)
  const clientShare = $derived(compTotalSafe ? clients / compTotalSafe : 0)
  const clientPct = $derived(
    compTotalSafe ? (clients / compTotalSafe) * 100 : 0,
  )
  const masterPct = $derived(
    compTotalSafe ? (masters / compTotalSafe) * 100 : 0,
  )
  const perMasterLabel = $derived(
    !compTotalSafe
      ? 'Ще немає даних'
      : masters === 0
        ? 'Майстрів ще немає — потрібні майстри'
        : `${(clients / masters).toFixed(1)} клієнтів на 1 майстра`,
  )
  // Поріг 65/35 — евристика балансу маркетплейсу, підкрути під свою модель
  const balance = $derived.by(() => {
    if (!compTotalSafe) return { tone: 'muted', text: 'Недостатньо даних' }
    if (clientShare >= 0.65)
      return { tone: 'warn', text: 'Клієнтів більше — залучайте майстрів' }
    if (clientShare <= 0.35)
      return { tone: 'warn', text: 'Майстрів більше — залучайте клієнтів' }
    return { tone: 'ok', text: 'Баланс здоровий' }
  })

  const orderStatus = $derived([
    {
      label: 'Створені',
      value: data.orderStatus.created,
      color: 'bg-blue-500',
    },
    {
      label: 'В роботі',
      value: data.orderStatus.inProgress,
      color: 'bg-amber-500',
    },
    {
      label: 'Завершені',
      value: data.orderStatus.completed,
      color: 'bg-emerald-500',
    },
    {
      label: 'Скасовані',
      value: data.orderStatus.cancelled,
      color: 'bg-zinc-400',
    },
  ])
  const orderTotal = $derived(orderStatus.reduce((s, o) => s + o.value, 0) || 1)

  const activity = $derived([
    { label: 'Відгуки', value: nf.format(data.activity.reviews) },
    {
      label: 'Середня оцінка',
      value: data.activity.avgReview.toFixed(1) + ' / 5',
    },
    { label: 'Чати', value: nf.format(data.activity.chats) },
    { label: 'Повідомлення', value: nf.format(data.activity.messages) },
    { label: 'Пропозиції', value: nf.format(data.activity.proposals) },
  ])
</script>

<div class="mx-auto flex max-w-310 flex-col gap-5">
  <!-- Header + період -->
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1
        class="text-foreground text-[clamp(24px,3vw,30px)] font-bold tracking-tight"
      >
        Аналітика
      </h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Динаміка та ключові показники платформи
      </p>
    </div>
    <div class="flex items-center gap-2">
      <div class="bg-muted flex rounded-lg p-0.5">
        {#each periods as p (p.key)}
          <button
            type="button"
            onclick={() => setPeriod(p.key)}
            class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {data.period ===
            p.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'}"
          >
            {p.label}
          </button>
        {/each}
      </div>
      <button
        type="button"
        onclick={refresh}
        disabled={refreshing}
        aria-label="Оновити"
        title="Оновити"
        class="border-border text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-60"
      >
        <RefreshCw size={16} class={refreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  </div>

  <!-- KPI -->
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {#each kpis as k (k.label)}
      <Card.Root class="p-5">
        <div
          class="text-muted-foreground flex items-center gap-2 text-[13px] font-medium"
        >
          <k.icon size={15} strokeWidth={2} />{k.label}
        </div>
        <div
          class="text-foreground mt-3 text-[26px] leading-none font-bold tracking-tight tabular-nums"
        >
          {k.value}
        </div>
        {#if k.delta !== null}
          {@const up = k.delta >= 0}
          <div class="mt-3 flex items-center gap-1.5">
            <span
              class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold {up
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}"
            >
              {#if up}<ArrowUpRight
                  size={12}
                  strokeWidth={2.6}
                />{:else}<ArrowDownRight size={12} strokeWidth={2.6} />{/if}
              {Math.abs(k.delta).toFixed(0)}%
            </span>
            <span class="text-muted-foreground text-xs"
              >vs попередній період</span
            >
          </div>
        {/if}
      </Card.Root>
    {/each}
  </div>

  <!-- ГОЛОВНИЙ графік: зростання на всю ширину -->
  <Card.Root>
    <Card.Header
      ><Card.Title class="text-base">Динаміка зростання</Card.Title
      ></Card.Header
    >
    <Card.Content>
      <Chart.Container config={lineConfig} class="aspect-auto h-85 w-full">
        <LineChart
          data={data.series}
          x="label"
          axis="x"
          legend
          series={[
            {
              key: 'users',
              label: 'Нові користувачі',
              color: 'var(--chart-1)',
            },
            { key: 'orders', label: 'Замовлення', color: 'var(--chart-2)' },
          ]}
        >
          {#snippet tooltip()}<Chart.Tooltip />{/snippet}
        </LineChart>
      </Chart.Container>
    </Card.Content>
  </Card.Root>

  <!-- Склад користувачів + Замовлення за статусом -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <Card.Root>
      <Card.Header
        ><Card.Title class="text-base">Користувачі</Card.Title></Card.Header
      >
      <Card.Content class="flex items-center gap-6">
        {#if compTotalSafe > 0}
          <Chart.Container
            config={compConfig}
            class="aspect-square w-40 shrink-0"
          >
            <PieChart
              data={compPie}
              key="name"
              value="value"
              c="color"
              cRange={compPie.map((d) => d.color)}
              innerRadius={50}
            >
              {#snippet tooltip()}<Chart.Tooltip
                  hideLabel
                  nameKey="name"
                />{/snippet}
            </PieChart>
          </Chart.Container>
        {:else}
          <div
            class="flex aspect-square w-40 shrink-0 items-center justify-center"
          >
            <div
              class="border-border text-muted-foreground flex size-28 items-center justify-center rounded-full border-2 border-dashed text-xs"
            >
              Немає даних
            </div>
          </div>
        {/if}

        <div class="flex flex-1 flex-col gap-3">
          <div class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2">
              <span
                class="size-2.5 rounded-[3px]"
                style:background="var(--chart-1)"
              ></span>Клієнти
            </span>
            <span class="font-semibold tabular-nums"
              >{nf.format(clients)}
              <span class="text-muted-foreground ml-1 text-xs"
                >{clientPct.toFixed(0)}%</span
              >
            </span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2">
              <span
                class="size-2.5 rounded-[3px]"
                style:background="var(--chart-2)"
              ></span>Майстри
            </span>
            <span class="font-semibold tabular-nums"
              >{nf.format(masters)}
              <span class="text-muted-foreground ml-1 text-xs"
                >{masterPct.toFixed(0)}%</span
              >
            </span>
          </div>

          <div class="border-border mt-1 border-t pt-3">
            <div class="text-foreground text-sm font-semibold tabular-nums">
              {perMasterLabel}
            </div>
            <div
              class="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {balance.tone ===
              'ok'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : balance.tone === 'warn'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground'}"
            >
              {balance.text}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header
        ><Card.Title class="text-base">Замовлення за статусом</Card.Title
        ></Card.Header
      >
      <Card.Content class="flex flex-col gap-3">
        {#each orderStatus as o (o.label)}
          <div>
            <div class="mb-1 flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{o.label}</span>
              <span class="font-semibold tabular-nums"
                >{nf.format(o.value)}</span
              >
            </div>
            <div class="bg-muted h-2 overflow-hidden rounded-full">
              <div
                class="{o.color} h-full rounded-full"
                style:width="{(o.value / orderTotal) * 100}%"
              ></div>
            </div>
          </div>
        {/each}
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Активність -->
  <Card.Root>
    <Card.Header
      ><Card.Title class="text-base">Активність</Card.Title></Card.Header
    >
    <Card.Content>
      <div class="grid grid-cols-2 gap-y-5 sm:grid-cols-5">
        {#each activity as a, i (a.label)}
          <div
            class="px-5 {i % 5 === 0
              ? 'border-l-0 pl-0'
              : 'sm:border-border sm:border-l'}"
          >
            <div class="text-2xl font-bold tracking-tight tabular-nums">
              {a.value}
            </div>
            <div class="text-muted-foreground mt-1 text-[13px]">{a.label}</div>
          </div>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>
</div>
