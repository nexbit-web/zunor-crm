<script lang="ts">
  import { page } from '$app/stores';
  import type { ComponentType } from 'svelte';
  import { sidebarCollapsed } from '$lib/stores/sidebar';

  export let href: string;
  export let label: string;
  export let icon: ComponentType;
  export let badge: number | undefined = undefined;

  $: isActive = $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  $: collapsed = $sidebarCollapsed;
</script>

<a
  {href}
  class="
    group relative flex flex-col items-center gap-1 rounded-lg px-2 py-2
    transition-all duration-150
    {isActive
      ? 'bg-white/10 text-white'
      : 'text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-200'}
    w-full
  "
  title={collapsed ? label : undefined}
>
  <div class="relative flex items-center justify-center">
    <svelte:component this={icon} size={20} strokeWidth={1.75} />

    {#if badge && collapsed}
      <span class="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
        {badge > 99 ? '99+' : badge}
      </span>
    {/if}
  </div>

  <span class="text-[10px] font-medium">{label}</span>

  {#if badge && !collapsed}
    <span class="absolute right-2 top-1/2 -translate-y-1/2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
      {badge > 99 ? '99+' : badge}
    </span>
  {/if}
</a>