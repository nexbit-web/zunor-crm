<script lang="ts">
	import './layout.css';
	import type { Snippet } from 'svelte';
	import { ModeWatcher } from 'mode-watcher';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/sidebar/Sidebar.svelte';
	import Header from '$lib/components/header/Header.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- ModeWatcher writes the .dark class before paint → no theme flash, persists to localStorage. -->
<ModeWatcher />

<div class="bg-background flex h-screen w-screen flex-col overflow-hidden p-1">
	<Header />

	<div class="flex min-h-0 w-full flex-1 items-stretch gap-2">
		<Sidebar />

		<div
			class="border-border bg-card flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
		>
			<main class="bg-background min-h-0 flex-1 overflow-auto p-6">
				{@render children()}
			</main>
		</div>
	</div>
</div>