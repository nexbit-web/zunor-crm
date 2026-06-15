<!-- src/routes/(app)/moderation/+page.svelte -->
<script lang="ts">
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as Pagination from '$lib/components/ui/pagination/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
  import { Search, X, Phone,  ChevronRight } from '@lucide/svelte'
  import { page, navigating } from '$app/state'
  import { goto } from '$app/navigation'
  import { onDestroy } from 'svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const loading = $derived(navigating.to?.url.pathname === '/moderation')

  let query = $state(data.q)
  let timer: ReturnType<typeof setTimeout> | undefined

  function runSearch(): void {
    const q = query.trim()
    if (q.length === 0) goto('/moderation', { keepFocus: true, noScroll: true })
    else if (q.length >= 3)
      goto(`/moderation?q=${encodeURIComponent(q)}`, {
        keepFocus: true,
        noScroll: true,
      })
  }
  function onInput(): void {
    clearTimeout(timer)
    timer = setTimeout(runSearch, 300)
  }
  function clearSearch(): void {
    clearTimeout(timer)
    query = ''
    goto('/moderation', { keepFocus: true, noScroll: true })
  }
  onDestroy(() => clearTimeout(timer))

  function pageHref(p: number): string {
    const params = new URLSearchParams(page.url.searchParams)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  function initials(name: string | null, email: string): string {
    return (name ?? email).trim().slice(0, 2).toUpperCase()
  }

  const AVATAR_COLORS = [
    'bg-emerald-500/15 text-emerald-400',
    'bg-sky-500/15 text-sky-400',
    'bg-violet-500/15 text-violet-400',
    'bg-amber-500/15 text-amber-400',
    'bg-rose-500/15 text-rose-400',
    'bg-teal-500/15 text-teal-400',
  ]
  function avatarColor(seed: string): string {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
  }

  const VERIFICATION: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'На перевірці', class: 'bg-amber-500/15 text-amber-400' },
    REJECTED: { label: 'Відхилено', class: 'bg-rose-500/15 text-rose-400' },
    NONE: { label: 'Без статусу', class: 'bg-muted text-muted-foreground' },
  }
  function verif(status: string | undefined): { label: string; class: string } {
    if (!status)
      return { label: 'Немає профілю', class: 'bg-muted text-muted-foreground' }
    return (
      VERIFICATION[status] ?? {
        label: status,
        class: 'bg-muted text-muted-foreground',
      }
    )
  }

  const categoryName = (slug: string): string => data.categoryMap[slug] ?? slug
</script>

<div class="flex flex-col gap-5">
  <div>
    <h1 class="text-foreground text-2xl font-semibold">Модерація</h1>
    <p class="text-muted-foreground mt-1 text-sm">
      Майстрів на розгляді: {data.total}
    </p>
  </div>

  <div class="relative w-full">
    <Search
      class="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
      aria-hidden="true"
    />
    <Input
      bind:value={query}
      oninput={onInput}
      placeholder="Пошук за іменем, телефоном, email, username…"
      aria-label="Пошук майстрів на модерації"
      class="bg-card h-12 w-full rounded-2xl pr-12 pl-12 text-base"
    />
    {#if query.length > 0}
      <button
        type="button"
        onclick={clearSearch}
        aria-label="Очистити пошук"
        class="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring absolute top-1/2 right-3 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
    {/if}
  </div>

  {#if !loading && data.masters.length === 0}
    <div
      class="border-border text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm"
    >
      {#if data.q}
        За запитом «{data.q}» нікого не знайдено.
      {:else}
        Немає майстрів, що очікують модерації.
      {/if}
    </div>
  {:else}
    <div class="border-border bg-card overflow-hidden rounded-2xl border">
      <Table.Root>
        <Table.Header>
          <Table.Row class="bg-muted/50 hover:bg-muted/50">
            <Table.Head class="pl-5">Майстер</Table.Head>
            <Table.Head>Телефон</Table.Head>
            <Table.Head>Місто</Table.Head>
            <Table.Head>Категорії</Table.Head>
            <Table.Head>Верифікація</Table.Head>
            <Table.Head class="w-10"></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#if loading}
            {#each Array.from({ length: 6 }) as _, i (i)}
              <Table.Row class="hover:bg-transparent">
                <Table.Cell class="pl-5">
                  <div class="flex items-center gap-3">
                    <Skeleton class="size-9 rounded-full" />
                    <Skeleton class="h-4 w-32" />
                  </div>
                </Table.Cell>
                <Table.Cell><Skeleton class="h-4 w-28" /></Table.Cell>
                <Table.Cell><Skeleton class="h-4 w-20" /></Table.Cell>
                <Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
                <Table.Cell class="text-right"
                  ><Skeleton class="ml-auto h-4 w-12" /></Table.Cell
                >
                <Table.Cell
                  ><Skeleton class="h-5 w-24 rounded-full" /></Table.Cell
                >
                <Table.Cell></Table.Cell>
              </Table.Row>
            {/each}
          {:else}
            {#each data.masters as master (master.id)}
              {@const v = verif(master.masterProfile?.verificationStatus)}
              {@const cats = master.masterProfile?.categories ?? []}
              <Table.Row class="group relative cursor-pointer">
                <Table.Cell class="pl-5">
                  <a
                    href={`/moderation/${master.id}`}
                    aria-label={`Розглянути майстра ${master.name ?? master.email}`}
                    class="focus-visible:ring-ring absolute inset-0 z-10 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  ></a>
                  <div class="flex items-center gap-3">
                    <Avatar.Root class="size-9">
                      <Avatar.Image src={master.avatar ?? ''} alt="" />
                      <Avatar.Fallback
                        class="text-xs font-semibold {avatarColor(master.id)}"
                      >
                        {initials(master.name, master.email)}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div class="flex flex-col">
                      <span class="text-foreground font-medium"
                        >{master.name ?? 'Немає'}</span
                      >
                      {#if master.username}
                        <span class="text-muted-foreground text-xs"
                          >@{master.username}</span
                        >
                      {/if}
                    </div>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <span
                    class="text-muted-foreground flex items-center gap-2 tabular-nums"
                  >
                    <Phone class="size-3.5 shrink-0" aria-hidden="true" />
                    {master.phone ?? 'Немає'}
                  </span>
                </Table.Cell>

                <Table.Cell class="text-muted-foreground"
                  >{master.city ?? 'Немає'}</Table.Cell
                >

                <Table.Cell>
                  {#if cats.length > 0}
                    <div class="flex flex-wrap items-center gap-1">
                      {#each cats.slice(0, 2) as cat (cat)}
                        <span
                          class="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-xs"
                        >
                          {categoryName(cat)}
                        </span>
                      {/each}
                      {#if cats.length > 2}
                        <span class="text-muted-foreground text-xs"
                          >+{cats.length - 2}</span
                        >
                      {/if}
                    </div>
                  {:else}
                    <span class="text-muted-foreground">Немає</span>
                  {/if}
                </Table.Cell>

                <Table.Cell>
                  <span
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {v.class}"
                    >{v.label}</span
                  >
                </Table.Cell>

                <Table.Cell class="pr-4 text-right">
                  <ChevronRight
                    class="text-muted-foreground/50 group-hover:text-foreground ml-auto size-4 transition-colors"
                    aria-hidden="true"
                  />
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        </Table.Body>
      </Table.Root>
    </div>

    {#if data.totalPages > 1}
      <Pagination.Root
        count={data.total}
        perPage={data.perPage}
        page={data.page}
        onPageChange={(p) =>
          goto(pageHref(p), { keepFocus: true, noScroll: true })}
      >
        {#snippet children({ pages, currentPage })}
          <Pagination.Content>
            <Pagination.Item><Pagination.PrevButton /></Pagination.Item>
            {#each pages as p (p.key)}
              {#if p.type === 'ellipsis'}
                <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link page={p} isActive={currentPage === p.value}
                    >{p.value}</Pagination.Link
                  >
                </Pagination.Item>
              {/if}
            {/each}
            <Pagination.Item><Pagination.NextButton /></Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    {/if}
  {/if}
</div>
