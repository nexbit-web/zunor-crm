<!-- src/routes/(app)/profile/+page.svelte -->
<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { LogOut } from '@lucide/svelte'
  import { enhance } from '$app/forms'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const dateFmt = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long' })

  function initials(name: string | null, email: string): string {
    return (name ?? email).trim().slice(0, 2).toUpperCase()
  }
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
  <h1 class="text-foreground text-2xl font-semibold">Профіль</h1>

  <div class="border-border bg-card flex flex-col gap-6 rounded-2xl border p-6">
    <div class="flex items-center gap-4">
      <Avatar.Root class="size-16">
        <Avatar.Image
          src={data.profile.avatar ?? ''}
          alt={data.profile.name ?? data.profile.email}
        />
        <Avatar.Fallback class="text-lg">
          {initials(data.profile.name, data.profile.email)}
        </Avatar.Fallback>
      </Avatar.Root>
      <div class="flex flex-col gap-1">
        <span class="text-foreground text-lg font-semibold"
          >{data.profile.name ?? '—'}</span
        >
        <Badge variant="secondary" class="w-fit">{data.profile.role}</Badge>
      </div>
    </div>

    <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div class="flex flex-col gap-0.5">
        <dt class="text-muted-foreground text-xs">Email</dt>
        <dd class="text-foreground text-sm">{data.profile.email}</dd>
      </div>
      <div class="flex flex-col gap-0.5">
        <dt class="text-muted-foreground text-xs">Username</dt>
        <dd class="text-foreground text-sm">
          {data.profile.username ? '@' + data.profile.username : '—'}
        </dd>
      </div>
      <div class="flex flex-col gap-0.5">
        <dt class="text-muted-foreground text-xs">Телефон</dt>
        <dd class="text-foreground text-sm">{data.profile.phone ?? '—'}</dd>
      </div>
      <div class="flex flex-col gap-0.5">
        <dt class="text-muted-foreground text-xs">У системі з</dt>
        <dd class="text-foreground text-sm">
          {dateFmt.format(data.profile.createdAt)}
        </dd>
      </div>
    </dl>
  </div>

  <form method="POST" action="?/logout" use:enhance class="flex justify-end">
    <Button type="submit" variant="destructive" class="gap-2">
      <LogOut size={16} aria-hidden="true" />
      Вийти
    </Button>
  </form>
</div>
