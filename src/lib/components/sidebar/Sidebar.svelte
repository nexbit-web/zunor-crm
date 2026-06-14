<script lang="ts">
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import { LayoutDashboard, Users, HelpCircle } from '@lucide/svelte';

	type NavItem = { href: string; label: string; icon: Component };

	const navItems: NavItem[] = [
		{ href: '/', label: 'Головна', icon: LayoutDashboard },
		{ href: '/users', label: 'Користувачі', icon: Users }
	];

	const pathname = $derived(page.url.pathname);

	function isActive(href: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname === href || pathname.startsWith(href + '/');
	}
</script>

<nav
	aria-label="Головна навігація"
	class="sidebar bg-sidebar text-sidebar-foreground flex h-full w-16 shrink-0 flex-col items-center rounded-2xl py-3"
>
	<div class="flex w-full flex-col items-center gap-1 px-1.5">
		{#each navItems as item (item.href)}
			{@const active = isActive(item.href)}
			<a
				href={item.href}
				aria-current={active ? 'page' : undefined}
				title={item.label}
				class="nav-item group relative flex w-full flex-col items-center gap-1 rounded-xl py-2 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)]"
				class:is-active={active}
			>
				<span class="glow" aria-hidden="true"></span>
				<span class="relative z-10 flex size-6 items-center justify-center">
					<item.icon size={20} strokeWidth={active ? 2 : 1.8} aria-hidden="true" />
				</span>
				<span class="relative z-10 text-[10px] leading-none font-medium tracking-tight">
					{item.label}
				</span>
			</a>
		{/each}
	</div>

	<div class="bg-sidebar-border my-2 h-px w-8"></div>

	<div class="mt-auto flex w-full flex-col items-center gap-1 px-1.5">
		<a
			href="/help"
			title="Допомога"
			class="nav-item group relative flex w-full flex-col items-center gap-1 rounded-xl py-2 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)]"
		>
			<span class="glow" aria-hidden="true"></span>
			<span class="relative z-10 flex size-6 items-center justify-center">
				<HelpCircle size={20} strokeWidth={1.8} aria-hidden="true" />
			</span>
			<span class="relative z-10 text-[10px] leading-none font-medium tracking-tight">
				Довідка
			</span>
		</a>
	</div>
</nav>

<style>
	.sidebar {
		--glow-from: #b5179e;
		--glow-via: #7209b7;
		--glow-to: #4cc9f0;
		--glow-size: 2.5rem;
		--glow-blur: 12px;
		--glow-opacity: 0.75;
	}

	.nav-item:not(.is-active) {
		opacity: 0.6;
	}
	.nav-item:hover,
	.nav-item.is-active {
		opacity: 1;
	}

	.glow {
		position: absolute;
		top: 0.25rem;
		left: 50%;
		transform: translateX(-50%);
		width: var(--glow-size);
		height: var(--glow-size);
		border-radius: 9999px;
		background: linear-gradient(to top right, var(--glow-from), var(--glow-via), var(--glow-to));
		filter: blur(var(--glow-blur));
		pointer-events: none;
		z-index: 0;
		opacity: 0;
		transition: opacity 0.2s;
	}
	.nav-item:hover .glow,
	.nav-item.is-active .glow {
		opacity: var(--glow-opacity);
	}
</style>