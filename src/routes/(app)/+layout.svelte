<script lang="ts">
  import type { LayoutData } from './$types'
  import type { Snippet } from 'svelte'
  import { onMount } from 'svelte'
  import Sidebar from '$lib/components/sidebar/Sidebar.svelte'
  import { startAdminRealtime } from '$lib/realtime/admin-notifications'

  import NProgress from 'nprogress'
  import 'nprogress/nprogress.css'
  import { beforeNavigate, afterNavigate } from '$app/navigation'

  NProgress.configure({
    showSpinner: false,
  })

  beforeNavigate(() => {
    NProgress.start()
  })

  afterNavigate(() => {
    NProgress.done()
  })

  let { data, children }: { data: LayoutData; children: Snippet } = $props()

  onMount(() => startAdminRealtime())
</script>

<div class="flex h-screen gap-2 p-2">
  <Sidebar user={data.user} moderationPending={data.moderationPending} />
  <div
    class="border-border bg-card flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
  >
    <main class="bg-background min-h-0 flex-1 overflow-auto p-6">
      {@render children()}
    </main>
  </div>
</div>
