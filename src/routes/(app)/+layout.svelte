<script lang="ts">
  import type { Snippet } from 'svelte'
  import Sidebar from '$lib/components/sidebar/Sidebar.svelte'

  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: Snippet } = $props()
</script>

<Tooltip.Provider delayDuration={200}>
  <div class="bg-background flex h-screen w-screen gap-2 overflow-hidden p-1">
    <Sidebar user={data.user} />
    <div
      class="border-border bg-card flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
    >
      <main class="bg-background min-h-0 flex-1 overflow-auto p-6">
        {@render children()}
      </main>
    </div>
  </div>
</Tooltip.Provider>
