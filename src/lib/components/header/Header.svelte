<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { toggleMode } from 'mode-watcher';
	import {
		ChevronDown,
		Calendar,
		Search,
		Sun,
		Moon,
		Bell
	} from '@lucide/svelte';

	type Workspace = { id: string; name: string };

	// Презентаційні дані. Реальні прийдуть з +layout.server.ts (locals.user / БД).
	const workspaces: Workspace[] = [
		{ id: 'zunor', name: 'Zunor Market' },
		{ id: 'demo', name: 'Demo Workspace' }
	];

	let activeWorkspace = $state<Workspace>(workspaces[0]);
	let searchValue = $state('');
	let searchEl = $state<HTMLInputElement | null>(null);

	// ⌘K / Ctrl+K фокусує пошук — локальний ref, без стора.
	function handleShortcut(event: KeyboardEvent): void {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			searchEl?.focus();
		}
	}
</script>

<svelte:window onkeydown={handleShortcut} />

<header
	class="text-foreground flex h-14 w-full shrink-0 items-center gap-3 px-3"
>
	<!-- Ліворуч: перемикач воркспейсу -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" class="h-9 gap-2 px-2 text-sm font-semibold">
					<span
						class="from-primary to-primary/70 text-primary-foreground flex size-6 items-center justify-center rounded-md bg-gradient-to-tr text-xs font-bold"
						aria-hidden="true"
					>
						Z
					</span>
					{activeWorkspace.name}
					<ChevronDown size={16} aria-hidden="true" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-56">
			<DropdownMenu.Label>Воркспейси</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				{#each workspaces as ws (ws.id)}
					<DropdownMenu.Item onSelect={() => (activeWorkspace = ws)}>
						{ws.name}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<Separator orientation="vertical" class="h-6" />

	<!-- Контекст-айтем -->
	<button
		type="button"
		class="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
	>
		<Calendar size={16} aria-hidden="true" />
		<span class="text-foreground font-medium">All Hands</span>
		<span class="text-muted-foreground">за 13 хв</span>
	</button>

	<!-- Центр: пошук -->
	<div class="relative mx-auto flex w-full max-w-md items-center">
		<Search
			size={16}
			class="text-muted-foreground pointer-events-none absolute left-3"
			aria-hidden="true"
		/>
		<Input
			bind:ref={searchEl}
			bind:value={searchValue}
			type="search"
			placeholder="Пошук"
			aria-label="Пошук"
			class="h-9 pr-14 pl-9 text-sm"
		/>
		<kbd
			class="border-border bg-muted text-muted-foreground absolute right-3 rounded border px-1.5 py-0.5 text-[10px] font-medium"
			aria-hidden="true"
		>
			⌘K
		</kbd>
	</div>

	<!-- Праворуч: дії + тема + аватар -->
	<div class="flex items-center gap-1">
		<Button variant="ghost" size="icon" class="size-9" aria-label="Сповіщення">
			<Bell size={18} aria-hidden="true" />
		</Button>

		<Button variant="ghost" size="icon" class="size-9" onclick={toggleMode} aria-label="Перемкнути тему">
			<Sun size={18} class="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" aria-hidden="true" />
			<Moon size={18} class="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" aria-hidden="true" />
		</Button>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="focus-visible:ring-ring relative ml-1 rounded-full focus-visible:ring-2 focus-visible:outline-none"
						aria-label="Меню профілю"
					>
						<Avatar.Root class="size-8">
							<Avatar.Image src="" alt="" />
							<Avatar.Fallback class="text-xs">ZN</Avatar.Fallback>
						</Avatar.Root>
						<span
							class="border-background absolute right-0 bottom-0 size-2.5 rounded-full border-2 bg-emerald-500"
							aria-label="Онлайн"
						></span>
					</button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-48">
				<DropdownMenu.Label>Мій акаунт</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>Профіль</DropdownMenu.Item>
				<DropdownMenu.Item>Налаштування</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="text-destructive">Вийти</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>