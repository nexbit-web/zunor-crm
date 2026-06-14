<!-- src/routes/(app)/clients/[id]/+page.svelte -->
<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    AtSign,
    Star,
    CircleCheck,
  } from '@lucide/svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const c = $derived(data.client)

  const dateFmt = new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  function money(cents: number, currency: string): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  function initials(name: string | null, email: string): string {
    return (name ?? email).trim().slice(0, 2).toUpperCase()
  }

  const STATUS: Record<string, { label: string; class: string }> = {
    CREATED: { label: 'Створено', class: 'bg-sky-500/15 text-sky-400' },
    OPEN: { label: 'Відкрита', class: 'bg-sky-500/15 text-sky-400' },
    IN_PROGRESS: { label: 'В роботі', class: 'bg-amber-500/15 text-amber-400' },
    COMPLETED: {
      label: 'Завершено',
      class: 'bg-emerald-500/15 text-emerald-400',
    },
    CANCELLED: { label: 'Скасовано', class: 'bg-rose-500/15 text-rose-400' },
    EXPIRED: { label: 'Прострочена', class: 'bg-muted text-muted-foreground' },
  }
  const badge = (s: string) =>
    STATUS[s] ?? { label: s, class: 'bg-muted text-muted-foreground' }
</script>

<div class="mx-auto flex max-w-4xl flex-col gap-6">
  <a
    href="/clients"
    class="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
  >
    <ArrowLeft class="size-4" aria-hidden="true" />
    Клієнти
  </a>

  <!-- Профіль -->
  <div class="border-border bg-card flex flex-col gap-5 rounded-2xl border p-6">
    <div class="flex items-start gap-4">
      <Avatar.Root class="size-16">
        <Avatar.Image src={c.avatar ?? ''} alt={c.name ?? c.email} />
        <Avatar.Fallback class="text-lg font-semibold"
          >{initials(c.name, c.email)}</Avatar.Fallback
        >
      </Avatar.Root>
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-foreground text-xl font-semibold"
            >{c.name ?? '—'}</span
          >
          {#if c.emailVerified}
            <Badge variant="secondary" class="gap-1">
              <CircleCheck class="size-3.5" aria-hidden="true" /> Підтверджено
            </Badge>
          {/if}
          {#if c.isOnline}
            <span class="flex items-center gap-1.5 text-xs text-emerald-400">
              <span class="size-2 rounded-full bg-emerald-400"></span> Онлайн
            </span>
          {/if}
        </div>
        {#if c.reviewsCountAsClient > 0}
          <span class="text-muted-foreground flex items-center gap-1 text-sm">
            <Star
              class="size-4 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            {c.avgRatingAsClient.toFixed(1)} · {c.reviewsCountAsClient} відгуків
          </span>
        {/if}
      </div>
    </div>

    <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div class="flex items-center gap-2 text-sm">
        <Mail class="text-muted-foreground size-4" aria-hidden="true" />
        <span class="text-foreground">{c.email}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <Phone class="text-muted-foreground size-4" aria-hidden="true" />
        <span class="text-foreground">{c.phone ?? '—'}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <MapPin class="text-muted-foreground size-4" aria-hidden="true" />
        <span class="text-foreground">{c.city ?? '—'}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <AtSign class="text-muted-foreground size-4" aria-hidden="true" />
        <span class="text-foreground">{c.username ?? '—'}</span>
      </div>
    </dl>

    <p class="text-muted-foreground text-xs">
      У системі з {dateFmt.format(c.createdAt)}
    </p>
  </div>

  <!-- Лічильники -->
  <div class="grid grid-cols-3 gap-3">
    {#each [{ l: 'Замовлень', v: c._count.clientOrders }, { l: 'Заявок', v: c._count.jobs }, { l: 'Відгуків', v: c._count.authoredReviews }] as stat (stat.l)}
      <div
        class="border-border bg-card flex flex-col gap-1 rounded-xl border p-4"
      >
        <span class="text-muted-foreground text-xs">{stat.l}</span>
        <span class="text-foreground text-2xl font-semibold tabular-nums"
          >{stat.v}</span
        >
      </div>
    {/each}
  </div>

  <!-- Замовлення -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Останні замовлення</h2>
    {#if c.clientOrders.length === 0}
      <p
        class="text-muted-foreground border-border rounded-xl border border-dashed p-6 text-center text-sm"
      >
        Замовлень немає.
      </p>
    {:else}
      <div class="border-border bg-card overflow-hidden rounded-2xl border">
        <Table.Root>
          <Table.Header>
            <Table.Row class="bg-muted/50 hover:bg-muted/50">
              <Table.Head class="pl-5">Послуга</Table.Head>
              <Table.Head>Майстер</Table.Head>
              <Table.Head class="text-right">Сума</Table.Head>
              <Table.Head>Статус</Table.Head>
              <Table.Head>Дата</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each c.clientOrders as order (order.id)}
              <Table.Row>
                <Table.Cell class="text-foreground pl-5 font-medium"
                  >{order.title}</Table.Cell
                >
                <Table.Cell class="text-muted-foreground"
                  >{order.master.name ?? '—'}</Table.Cell
                >
                <Table.Cell class="text-right tabular-nums"
                  >{money(order.priceCents, order.currency)}</Table.Cell
                >
                <Table.Cell>
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {badge(
                      order.status,
                    ).class}"
                  >
                    {badge(order.status).label}
                  </span>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground tabular-nums"
                  >{dateFmt.format(order.createdAt)}</Table.Cell
                >
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  </section>

  <!-- Заявки -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Останні заявки</h2>
    {#if c.jobs.length === 0}
      <p
        class="text-muted-foreground border-border rounded-xl border border-dashed p-6 text-center text-sm"
      >
        Заявок немає.
      </p>
    {:else}
      <div class="border-border bg-card overflow-hidden rounded-2xl border">
        <Table.Root>
          <Table.Header>
            <Table.Row class="bg-muted/50 hover:bg-muted/50">
              <Table.Head class="pl-5">Заявка</Table.Head>
              <Table.Head>Категорія / Місто</Table.Head>
              <Table.Head>Статус</Table.Head>
              <Table.Head>Дата</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each c.jobs as job (job.id)}
              <Table.Row>
                <Table.Cell class="text-foreground pl-5 font-medium"
                  >{job.title}</Table.Cell
                >
                <Table.Cell class="text-muted-foreground"
                  >{job.category} · {job.city}</Table.Cell
                >
                <Table.Cell>
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {badge(
                      job.status,
                    ).class}"
                  >
                    {badge(job.status).label}
                  </span>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground tabular-nums"
                  >{dateFmt.format(job.createdAt)}</Table.Cell
                >
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  </section>
</div>
