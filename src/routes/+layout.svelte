<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import './layout.css'
  import type { Snippet } from 'svelte'
  import { ModeWatcher } from 'mode-watcher'
  import favicon from '$lib/assets/favicon.svg'
  import { Toaster } from '$lib/components/toast'
  let { children }: { children: Snippet } = $props()
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster />
{@render children()}
