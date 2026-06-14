<!-- src/routes/(app)/clients/+page.svelte -->
<script lang="ts">
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as Pagination from '$lib/components/ui/pagination/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
  import { Search, X, Phone, ClipboardList, ChevronRight } from '@lucide/svelte'
  import { page, navigating } from '$app/state'
  import { goto } from '$app/navigation'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  // Скелетон показуємо лише під час переходів усередині /clients (пагінація/пошук).
  const loading = $derived(navigating.to?.url.pathname === '/clients')

  const dateFmt = new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  function pageHref(p: number): string {
    const params = new URLSearchParams(page.url.searchParams)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  function initials(name: string | null, email: string): string {
    return (name ?? email).trim().slice(0, 2).toUpperCase()
  }

  // Детермінований колір аватара (повні класи — Tailwind їх бачить у бандлі).
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
</script>

<div class="flex flex-col gap-5">
  <div>
    <h1 class="text-foreground text-2xl font-semibold">Клієнти</h1>
    <p class="text-muted-foreground mt-1 text-sm">Усього: {data.total}</p>
  </div>

  <!-- Повноширинний пошук, сабміт по Enter -->
  <form method="GET" class="relative w-full">
    <Search
      class="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
      aria-hidden="true"
    />
    <Input
      name="q"
      value={data.q}
      placeholder="Пошук за іменем, телефоном, email…"
      aria-label="Пошук клієнтів"
      class="bg-card h-12 w-full rounded-2xl pr-12 pl-12 text-base"
    />
    {#if data.q}
      <Button
        href="/clients"
        variant="ghost"
        size="icon"
        aria-label="Скинути пошук"
        class="absolute top-1/2 right-2 size-8 -translate-y-1/2"
      >
        <X class="size-4" aria-hidden="true" />
      </Button>
    {/if}
  </form>

  {#if !loading && data.clients.length === 0}
    <div
      class="border-border text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm"
    >
      {#if data.q}
        За запитом «{data.q}» клієнтів не знайдено.
      {:else}
        Клієнтів поки немає.
      {/if}
    </div>
  {:else}
    <div class="border-border bg-card overflow-hidden rounded-2xl border">
      <Table.Root>
        <Table.Header>
          <Table.Row class="bg-muted/50 hover:bg-muted/50">
            <Table.Head class="pl-5">Клієнт</Table.Head>
            <Table.Head>Телефон</Table.Head>
            <Table.Head>Email</Table.Head>
            <Table.Head class="text-center">Замовлень</Table.Head>
            <Table.Head>Дата реєстрації</Table.Head>
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
                <Table.Cell><Skeleton class="h-4 w-36" /></Table.Cell>
                <Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
                <Table.Cell class="text-center"
                  ><Skeleton class="mx-auto h-4 w-6" /></Table.Cell
                >
                <Table.Cell><Skeleton class="h-4 w-24" /></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            {/each}
          {:else}
            {#each data.clients as client (client.id)}
              <Table.Row class="group relative cursor-pointer">
                <Table.Cell class="pl-5">
                  <!-- Розтягнуте посилання: клікабельна вся строка, лишається справжнім <a> -->
                  <a
                    href={`/clients/${client.id}`}
                    aria-label={`Відкрити клієнта ${client.name ?? client.email}`}
                    class="focus-visible:ring-ring absolute inset-0 z-10 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  ></a>
                  <div class="flex items-center gap-3">
                    <Avatar.Root class="size-9">
                      <Avatar.Image src={client.avatar ?? ''} alt="" />
                      <Avatar.Fallback
                        class="text-xs font-semibold {avatarColor(client.id)}"
                      >
                        {initials(client.name, client.email)}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <span class="text-foreground font-medium"
                      >{client.name ?? '—'}</span
                    >
                  </div>
                </Table.Cell>

                <Table.Cell>
                  {#if client.phone}
                    <span
                      class="text-muted-foreground flex items-center gap-2 tabular-nums"
                    >
                      <Phone class="size-4 shrink-0" aria-hidden="true" />
                      {client.phone}
                    </span>
                  {:else}
                    <span class="text-muted-foreground">—</span>
                  {/if}
                </Table.Cell>

                <Table.Cell>
                  <span class="text-muted-foreground block max-w-44 truncate"
                    >{client.email}</span
                  >
                </Table.Cell>

                <Table.Cell>
                  <span
                    class="text-foreground flex items-center justify-center gap-1.5 tabular-nums"
                  >
                    <ClipboardList
                      class="text-muted-foreground size-4"
                      aria-hidden="true"
                    />
                    {client._count.clientOrders}
                  </span>
                </Table.Cell>

                <Table.Cell class="text-muted-foreground tabular-nums">
                  {dateFmt.format(client.createdAt)}
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
            <Pagination.Item>
              <Pagination.PrevButton />
            </Pagination.Item>
            {#each pages as p (p.key)}
              {#if p.type === 'ellipsis'}
                <Pagination.Item>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link page={p} isActive={currentPage === p.value}>
                    {p.value}
                  </Pagination.Link>
                </Pagination.Item>
              {/if}
            {/each}
            <Pagination.Item>
              <Pagination.NextButton />
            </Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
    {/if}
  {/if}
</div>
