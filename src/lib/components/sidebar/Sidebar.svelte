<!-- src/lib/components/sidebar/Sidebar.svelte -->
<script lang="ts">
  import { page } from '$app/state'
  import type { Component } from 'svelte'
  import {
    ChevronsRight,
    LayoutDashboard,
    ContactRound,
    UsersRound,
    ShieldCheck,
    Package,
    MessageCircle,
    Star,
    ShieldUser,
    Settings,
  } from '@lucide/svelte'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import { atLeast, type Role } from '$lib/permissions'

  let {
    user,
    moderationPending = 0,
  }: {
    user: {
      name: string | null
      email: string
      image: string | null
      role: string
    }
    moderationPending?: number
  } = $props()

  // cap — право, потрібне щоб бачити пункт. Без cap → видно всім staff.
  type NavItem = { href: string; label: string; icon: Component; min?: Role }

  const nav: NavItem[] = [
    {
      href: '/statistics',
      label: 'Статистика',
      icon: LayoutDashboard,
      min: 'MANAGER',
    },
    { href: '/clients', label: 'Клієнти', icon: ContactRound },
    { href: '/masters', label: 'Майстри', icon: UsersRound },
    { href: '/moderation', label: 'Модерація', icon: ShieldCheck },
    { href: '/orders', label: 'Замовлення', icon: Package },
    // { href: '/chats', label: 'Чати', icon: MessageCircle },
    { href: '/reviews', label: 'Відгуки', icon: Star },
    { href: '/admins', label: 'Адмін', icon: ShieldUser, min: 'ADMIN' },
    { href: '/settings', label: 'Налаштування', icon: Settings },
  ]
  // Видимі пункти за роллю користувача
  const visibleNav = $derived(
    nav.filter((i) => atLeast(user.role, i.min ?? 'MODERATOR')),
  )

  let collapsed = $state(false)
  const pathname = $derived(page.url.pathname)
  const profileActive = $derived(isActive('/profile'))

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  function initials(name: string | null, email: string): string {
    return (name ?? email).trim().slice(0, 2).toUpperCase()
  }
</script>

{#snippet navLink(item: NavItem)}
  {@const active = isActive(item.href)}
  {@const badge = item.href === '/moderation' ? moderationPending : 0}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <a
          {...props}
          href={item.href}
          aria-current={active ? 'page' : undefined}
          aria-label={badge > 0
            ? `${item.label} — ${badge} на модерацію`
            : item.label}
          class="nav-item group relative flex w-full flex-col items-center gap-1 rounded-xl py-2 outline-none focus-visible:ring-2 focus-visible:ring-white/40 {active
            ? 'is-active'
            : ''}"
        >
          <span class="glow" aria-hidden="true"></span>
          <span class="relative z-10 flex size-6 items-center justify-center">
            <item.icon
              size={20}
              strokeWidth={active ? 2 : 1.8}
              aria-hidden="true"
            />
            {#if badge > 0}
              <span
                class="absolute -top-1.5 -right-2 z-20 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-[#0f0f12]"
                aria-hidden="true"
              >
                {badge > 9 ? '9+' : badge}
              </span>
            {/if}
          </span>
        </a>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content side="right">
      <p>
        {item.label}{#if badge > 0}&nbsp;({badge}){/if}
      </p>
    </Tooltip.Content>
  </Tooltip.Root>
{/snippet}

<Tooltip.Provider delayDuration={200}>
  <nav
    aria-label="Навігація CRM"
    class="sidebar flex h-full shrink-0 flex-col items-center rounded-2xl py-3 transition-[width] duration-200 ease-out"
    class:w-14={!collapsed}
    class:w-12={collapsed}
  >
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <a
            {...props}
            href="/profile"
            aria-current={profileActive ? 'page' : undefined}
            aria-label="Профіль"
            class="flex w-full items-center justify-center rounded-xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Avatar.Root
              class="size-8 transition-shadow {profileActive
                ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#0f0f12]'
                : ''}"
            >
              <Avatar.Image
                src={user.image ?? ''}
                alt={user.name ?? user.email}
              />
              <Avatar.Fallback class="bg-white/10 text-xs text-white"
                >{initials(user.name, user.email)}</Avatar.Fallback
              >
            </Avatar.Root>
          </a>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="right"><p>Профіль</p></Tooltip.Content>
    </Tooltip.Root>

    <div class="my-2 h-px w-8 bg-white/10"></div>

    <div class="flex w-full flex-col items-center gap-1 px-1.5">
      {#each visibleNav as item (item.href)}
        {@render navLink(item)}
      {/each}
    </div>

    <button
      type="button"
      onclick={() => (collapsed = !collapsed)}
      aria-label={collapsed ? 'Розгорнути меню' : 'Згорнути меню'}
      aria-expanded={!collapsed}
      class="mt-auto flex size-9 cursor-pointer items-center justify-center rounded-xl text-white/60 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <ChevronsRight
        size={18}
        class="transition-transform duration-200 {collapsed
          ? 'rotate-180'
          : ''}"
        aria-hidden="true"
      />
    </button>
  </nav>
</Tooltip.Provider>

<style>
  /* Сайдбар завжди темний — фіксований колір, незалежно від теми */
  .sidebar {
    background-color: #0f0f12;
    color: #e8e8ec;
    --glow-from: #b5179e;
    --glow-via: #7209b7;
    --glow-to: #4cc9f0;
    --glow-size: 2.25rem;
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
    background: linear-gradient(
      to top right,
      var(--glow-from),
      var(--glow-via),
      var(--glow-to)
    );
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
