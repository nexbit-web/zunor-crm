<!-- src/routes/(app)/masters/[id]/+page.svelte -->
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
    Clock,
  } from '@lucide/svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  const m = $derived(data.master)
  const mp = $derived(data.master.masterProfile)

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
  function fmtVal(v: unknown): string {
    return typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)
  }

  const categoryName = (slug: string): string => data.categoryMap[slug] ?? slug

  const VERIFICATION: Record<string, { label: string; class: string }> = {
    VERIFIED: {
      label: 'Верифіковано',
      class: 'bg-emerald-500/15 text-emerald-400',
    },
    PENDING: { label: 'На перевірці', class: 'bg-amber-500/15 text-amber-400' },
    REJECTED: { label: 'Відхилено', class: 'bg-rose-500/15 text-rose-400' },
    NONE: { label: 'Без статусу', class: 'bg-muted text-muted-foreground' },
  }
  const verif = $derived(
    mp
      ? (VERIFICATION[mp.verificationStatus] ?? VERIFICATION.NONE)
      : { label: 'Немає профілю', class: 'bg-muted text-muted-foreground' },
  )

  const STATUS: Record<string, { label: string; class: string }> = {
    CREATED: { label: 'Створено', class: 'bg-sky-500/15 text-sky-400' },
    IN_PROGRESS: { label: 'В роботі', class: 'bg-amber-500/15 text-amber-400' },
    COMPLETED: {
      label: 'Завершено',
      class: 'bg-emerald-500/15 text-emerald-400',
    },
    CANCELLED: { label: 'Скасовано', class: 'bg-rose-500/15 text-rose-400' },
  }
  const orderBadge = (s: string) =>
    STATUS[s] ?? { label: s, class: 'bg-muted text-muted-foreground' }

  const metaEntries = $derived.by(() => {
    const meta = mp?.metadata
    if (meta && typeof meta === 'object' && !Array.isArray(meta))
      return Object.entries(meta)
    return []
  })
</script>

<div class="mx-auto flex max-w-4xl flex-col gap-6">
  <a
    href="/masters"
    class="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
  >
    <ArrowLeft class="size-4" aria-hidden="true" />
    Майстри
  </a>

  <!-- Профіль -->
  <div class="border-border bg-card flex flex-col gap-5 rounded-2xl border p-6">
    <div class="flex flex-wrap items-start gap-4">
      <Avatar.Root class="size-20">
        <Avatar.Image src={m.avatar ?? ''} alt={m.name ?? m.email} />
        <Avatar.Fallback class="text-2xl font-semibold"
          >{initials(m.name, m.email)}</Avatar.Fallback
        >
      </Avatar.Root>
      <div class="flex flex-1 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-foreground text-xl font-semibold"
            >{m.name ?? 'Немає'}</span
          >
          {#if m.username}<span class="text-muted-foreground"
              >@{m.username}</span
            >{/if}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {verif.class}"
            >{verif.label}</span
          >
          {#if mp}
            <span
              class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {mp.isActive
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-muted text-muted-foreground'}"
            >
              {mp.isActive ? 'Активний' : 'Неактивний'}
            </span>
          {/if}
          {#if m.isOnline}
            <span class="flex items-center gap-1.5 text-xs text-emerald-400">
              <span class="size-2 rounded-full bg-emerald-400"></span> Онлайн
            </span>
          {/if}
        </div>
        <span class="text-muted-foreground flex items-center gap-1 text-sm">
          <Star
            class="size-4 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />
          {m.avgRatingAsMaster.toFixed(1)} · {m.reviewsCountAsMaster} відгуків
        </span>
      </div>
    </div>

    <!-- Деталі верифікації -->
    {#if mp?.verificationStatus === 'VERIFIED' && mp.verifiedAt}
      <p class="flex items-center gap-1.5 text-sm text-emerald-400">
        <CircleCheck class="size-4" aria-hidden="true" /> Верифіковано {dateFmt.format(
          mp.verifiedAt,
        )}
      </p>
    {:else if mp?.verificationStatus === 'REJECTED'}
      <p class="bg-rose-500/10 text-rose-400 rounded-md px-3 py-2 text-sm">
        Відхилено: {mp.verificationRejectReason ?? 'причина не вказана'}
      </p>
    {/if}

    <!-- Контакти -->
    <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div class="flex items-center gap-2 text-sm">
        <Mail class="text-muted-foreground size-4" aria-hidden="true" />
        <span class="text-foreground">{m.email}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <Phone class="text-muted-foreground size-4" aria-hidden="true" />
        <span class="text-foreground">{m.phone ?? 'Немає'}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <MapPin class="text-muted-foreground size-4" aria-hidden="true" />
        <span class="text-foreground">{m.city ?? 'Немає'}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <Clock class="text-muted-foreground size-4" aria-hidden="true" />
        <span class="text-foreground"
          >У системі з {dateFmt.format(m.createdAt)}</span
        >
      </div>
    </dl>
  </div>

  <!-- Лічильники -->
  <div class="grid grid-cols-3 gap-3">
    {#each [{ l: 'Виконано', v: mp?.completedOrders ?? 0 }, { l: 'Усього замовлень', v: mp?.totalOrders ?? 0 }, { l: 'Відгуків', v: m.reviewsCountAsMaster }] as stat (stat.l)}
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

  <!-- Опис -->
  <section class="flex flex-col gap-2">
    <h2 class="text-foreground text-lg font-semibold">Опис</h2>
    <p
      class="text-muted-foreground border-border bg-card rounded-2xl border p-5 text-sm whitespace-pre-line"
    >
      {mp?.description || m.bio || 'Опис відсутній'}
    </p>
  </section>

  <!-- Категорії -->
  <section class="flex flex-col gap-2">
    <h2 class="text-foreground text-lg font-semibold">Категорії</h2>
    {#if (mp?.categories?.length ?? 0) > 0}
      <div class="flex flex-wrap gap-2">
        {#each mp!.categories as cat (cat)}
          <Badge variant="secondary">{categoryName(cat)}</Badge>
        {/each}
      </div>
    {:else}
      <p class="text-muted-foreground text-sm">Немає</p>
    {/if}
  </section>

  <!-- Портфоліо -->
  <section class="flex flex-col gap-2">
    <h2 class="text-foreground text-lg font-semibold">Портфоліо</h2>
    {#if (mp?.portfolioImages?.length ?? 0) > 0}
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {#each mp!.portfolioImages as src, i (src)}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            class="border-border focus-visible:ring-ring block aspect-square overflow-hidden rounded-xl border outline-none focus-visible:ring-2"
            aria-label={`Фото портфоліо ${i + 1}`}
          >
            <img
              {src}
              alt={`Портфоліо ${i + 1}`}
              loading="lazy"
              class="size-full object-cover transition-transform hover:scale-105"
            />
          </a>
        {/each}
      </div>
    {:else}
      <p class="text-muted-foreground text-sm">Немає</p>
    {/if}
  </section>

  <!-- Метадані -->
  {#if metaEntries.length > 0}
    <section class="flex flex-col gap-2">
      <h2 class="text-foreground text-lg font-semibold">Додаткові дані</h2>
      <dl
        class="border-border bg-card grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border p-5 sm:grid-cols-2"
      >
        {#each metaEntries as [key, value] (key)}
          <div class="flex flex-col gap-0.5">
            <dt class="text-muted-foreground text-xs">{key}</dt>
            <dd class="text-foreground text-sm break-words">{fmtVal(value)}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}

  <!-- Відгуки про майстра -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Відгуки</h2>
    {#if data.reviews.length === 0}
      <p
        class="text-muted-foreground border-border rounded-xl border border-dashed p-6 text-center text-sm"
      >
        Відгуків немає.
      </p>
    {:else}
      <div class="flex flex-col gap-3">
        {#each data.reviews as review (review.id)}
          <div
            class="border-border bg-card flex flex-col gap-2 rounded-2xl border p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Avatar.Root class="size-7">
                  <Avatar.Image src={review.author.avatar ?? ''} alt="" />
                  <Avatar.Fallback class="text-[10px]"
                    >{initials(review.author.name, '')}</Avatar.Fallback
                  >
                </Avatar.Root>
                <span class="text-foreground text-sm font-medium"
                  >{review.author.name ?? 'Немає'}</span
                >
              </div>
              <div class="flex items-center gap-0.5">
                {#each Array.from({ length: 5 }) as _, idx (idx)}
                  <Star
                    class="size-3.5 {idx < review.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'}"
                    aria-hidden="true"
                  />
                {/each}
              </div>
            </div>
            {#if review.comment}
              <p class="text-muted-foreground text-sm">{review.comment}</p>
            {/if}
            <span class="text-muted-foreground/70 text-xs"
              >{dateFmt.format(review.createdAt)}</span
            >
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Останні замовлення -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Останні замовлення</h2>
    {#if m.masterOrders.length === 0}
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
              <Table.Head>Клієнт</Table.Head>
              <Table.Head class="text-right">Сума</Table.Head>
              <Table.Head>Статус</Table.Head>
              <Table.Head>Дата</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each m.masterOrders as order (order.id)}
              <Table.Row>
                <Table.Cell class="text-foreground pl-5 font-medium"
                  >{order.title}</Table.Cell
                >
                <Table.Cell class="text-muted-foreground"
                  >{order.client.name ?? 'Немає'}</Table.Cell
                >
                <Table.Cell class="text-right tabular-nums"
                  >{money(order.priceCents, order.currency)}</Table.Cell
                >
                <Table.Cell>
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {orderBadge(
                      order.status,
                    ).class}"
                  >
                    {orderBadge(order.status).label}
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
</div>
