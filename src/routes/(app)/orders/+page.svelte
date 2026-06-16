<script lang="ts">
  import type { PageData } from './$types'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { enhance } from '$app/forms'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Chart from '$lib/components/ui/chart/index.js'
  import { BarChart } from 'layerchart'
  import { scaleBand } from 'd3-scale'
  import { toast } from '$lib/stores/toast-store.svelte'

  let { data }: { data: PageData } = $props()

  const nf = new Intl.NumberFormat('uk-UA')
  function money(cents: number, cur = 'UAH'): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }
  const dt = new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // Навігація фільтрами через URL (зберігаємо інші параметри)
  function nav(overrides: Record<string, string>) {
    const p = new URLSearchParams(page.url.search)
    for (const [k, v] of Object.entries(overrides))
      v ? p.set(k, v) : p.delete(k)
    if (!('page' in overrides)) p.set('page', '1') // зміна фільтра → на 1-у сторінку
    goto(`?${p.toString()}`, { keepFocus: true, noScroll: true })
  }

  const statusTabs = [
    { key: 'active', label: 'Активні' },
    { key: 'completed', label: 'Завершені' },
    { key: 'cancelled', label: 'Скасовані' },
    { key: 'all', label: 'Усі' },
    { key: 'removed', label: 'Видалені' },
  ]
  const periods = [
    { key: 'day', label: 'День' },
    { key: 'week', label: 'Тиждень' },
    { key: 'month', label: 'Місяць' },
  ]

  const statusBadge: Record<string, string> = {
    CREATED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    CANCELLED: 'bg-zinc-500/10 text-zinc-500',
  }
  const statusLabel: Record<string, string> = {
    CREATED: 'Створено',
    IN_PROGRESS: 'В роботі',
    COMPLETED: 'Завершено',
    CANCELLED: 'Скасовано',
  }

  const chartConfig = {
    value: { label: 'Замовлення', color: 'var(--chart-1)' },
  } satisfies Chart.ChartConfig

  let query = $state(data.q)

  function notify(fallback: string) {
    return async ({
      result,
      update,
    }: {
      result: { type: string; data?: { success?: string; error?: string } }
      update: () => Promise<void>
    }) => {
      if (result.type === 'success') {
        toast.success(result.data?.success ?? fallback)
        await update()
      } else if (result.type === 'failure')
        toast.error(result.data?.error ?? 'Помилка')
      else await update()
    }
  }
</script>

<div class="mx-auto flex max-w-[1100px] flex-col gap-4">
  <div>
    <h1
      class="text-foreground text-[clamp(22px,3vw,28px)] font-bold tracking-tight"
    >
      Замовлення
    </h1>
    <p class="text-muted-foreground mt-1 text-sm">
      Перегляд, статистика та модерація замовлень
    </p>
  </div>

  <!-- KPI -->
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {#each [{ label: 'Активні', value: nf.format(data.stats.active) }, { label: 'Завершені', value: nf.format(data.stats.completed) }, { label: 'GMV (завершені)', value: money(data.stats.gmvCents) }, { label: 'Сьогодні', value: nf.format(data.stats.today) }] as k (k.label)}
      <Card.Root class="p-4">
        <div class="text-muted-foreground text-[13px] font-medium">
          {k.label}
        </div>
        <div class="text-foreground mt-2 text-2xl font-bold tabular-nums">
          {k.value}
        </div>
      </Card.Root>
    {/each}
  </div>

  <!-- Графік об'єму -->
  <Card.Root>
    <Card.Header>
      <div class="flex items-center justify-between">
        <Card.Title class="text-base">Динаміка замовлень</Card.Title>
        <div class="flex gap-1">
          {#each periods as p (p.key)}
            <button
              type="button"
              onclick={() => nav({ period: p.key })}
              class="rounded-lg px-3 py-1 text-xs font-medium transition-colors {data.period ===
              p.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'}"
            >
              {p.label}
            </button>
          {/each}
        </div>
      </div>
    </Card.Header>
    <Card.Content>
      <Chart.Container
        config={chartConfig}
        class="aspect-auto h-[240px] w-full"
      >
        <BarChart
          data={data.chart}
          x="label"
          axis="x"
          xScale={scaleBand().padding(0.3)}
          series={[
            { key: 'value', label: 'Замовлення', color: 'var(--chart-1)' },
          ]}
        >
          {#snippet tooltip()}<Chart.Tooltip hideLabel />{/snippet}
        </BarChart>
      </Chart.Container>
    </Card.Content>
  </Card.Root>

  <!-- Фільтри -->
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex flex-wrap gap-1">
      {#each statusTabs as t (t.key)}
        <button
          type="button"
          onclick={() => nav({ status: t.key })}
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {data.status ===
          t.key
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-muted'}"
        >
          {t.label}
        </button>
      {/each}
    </div>
    <input
      value={query}
      oninput={(e) => (query = e.currentTarget.value)}
      onkeydown={(e) => e.key === 'Enter' && nav({ q: query })}
      placeholder="Пошук: послуга, клієнт, майстер…"
      class="border-border bg-background h-9 w-full max-w-xs rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:w-64"
    />
  </div>

  <!-- Таблиця -->
  <Card.Root class="overflow-hidden">
    {#if data.rows.length === 0}
      <div class="text-muted-foreground py-16 text-center text-sm">
        Замовлень не знайдено
      </div>
    {:else}
      <div class="divide-border divide-y">
        {#each data.rows as o (o.id)}
          <div class="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{o.title ?? 'Без назви'}</p>
              <p class="text-muted-foreground truncate text-xs">
                {o.client?.name ?? '—'} → {o.master?.name ?? '—'} · {dt.format(
                  o.createdAt,
                )}
                {#if o.removedAt}· <span class="text-rose-500"
                    >знято: {o.removedReason}</span
                  >{/if}
              </p>
            </div>
            <span class="font-semibold tabular-nums"
              >{money(o.priceCents, o.currency)}</span
            >
            {#if !o.removedAt}
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold {statusBadge[
                  o.status
                ] ?? 'bg-muted'}"
              >
                {statusLabel[o.status] ?? o.status}
              </span>
            {/if}

            {#if data.canRemove}
              {#if o.removedAt}
                <form
                  method="POST"
                  action="?/restore"
                  use:enhance={() => notify('Відновлено')}
                >
                  <input type="hidden" name="orderId" value={o.id} />
                  <button
                    type="submit"
                    class="border-border h-8 rounded-lg border px-3 text-xs hover:bg-muted"
                    >Відновити</button
                  >
                </form>
              {:else}
                <form
                  method="POST"
                  action="?/remove"
                  use:enhance={({ formData, cancel }) => {
                    const reason = prompt(
                      'Причина видалення (порушення правил):',
                    )?.trim()
                    if (!reason || reason.length < 5) {
                      cancel()
                      return
                    }
                    formData.set('reason', reason)
                    return notify('Замовлення приховано')
                  }}
                >
                  <input type="hidden" name="orderId" value={o.id} />
                  <button
                    type="submit"
                    class="h-8 rounded-lg border border-rose-500/40 px-3 text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                  >
                    Видалити
                  </button>
                </form>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </Card.Root>

  <!-- Пагінація -->
  {#if data.totalPages > 1}
    <div class="flex items-center justify-center gap-3 text-sm">
      <button
        type="button"
        disabled={data.page <= 1}
        onclick={() => nav({ page: String(data.page - 1) })}
        class="border-border h-8 rounded-lg border px-3 disabled:opacity-40 hover:bg-muted"
        >Назад</button
      >
      <span class="text-muted-foreground tabular-nums"
        >{data.page} / {data.totalPages}</span
      >
      <button
        type="button"
        disabled={data.page >= data.totalPages}
        onclick={() => nav({ page: String(data.page + 1) })}
        class="border-border h-8 rounded-lg border px-3 disabled:opacity-40 hover:bg-muted"
        >Далі</button
      >
    </div>
  {/if}
</div>
