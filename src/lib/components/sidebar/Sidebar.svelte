<script lang="ts">
    import { page } from '$app/stores';
  import { HelpCircle } from '@lucide/svelte';
    // Импортируем иконки из твоего пакета lucide-svelte
    import { Home, Globe, MessageSquare, Clover, UserPlus,  } from '@lucide/svelte';

    function isActive(href: string) {
        if (href === '/') return $page.url.pathname === '/';
        return $page.url.pathname.startsWith(href);
    }
</script>

<div class="h-full bg-[#f8f9fa]   flex items-stretch">
    
    <aside class="flex w-[68px] shrink-0 flex-col items-center bg-[#0d0d0f] py-4 px-1 rounded-2xl text-white">
        
        <a href="/" class="group relative flex w-full flex-col items-center gap-1 py-2 no-underline">
            {#if isActive('/')}
                <span class="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-tr from-[#b5179e] via-[#7209b7] to-[#4cc9f0] opacity-75 blur-md pointer-events-none z-0"></span>
            {/if}
            
            <span class="relative z-10 flex h-6 w-6 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <Home size={20} strokeWidth={2} />
            </span>
            <span class="relative z-10 text-[10px] font-medium tracking-wide transition-colors duration-150 {isActive('/') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                Home
            </span>
        </a>

        <a href="/spaces" class="group flex w-full flex-col items-center gap-1 py-2.5 no-underline">
            <span class="flex h-6 w-6 items-center justify-center transition-transform duration-200 group-hover:scale-105 {isActive('/spaces') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                <Globe size={20} strokeWidth={1.8} />
            </span>
            <span class="text-[10px] font-medium tracking-wide transition-colors duration-150 {isActive('/spaces') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                Spaces
            </span>
        </a>

        <a href="/chat" class="group flex w-full flex-col items-center gap-1 py-2.5 no-underline">
            <span class="flex h-6 w-6 items-center justify-center transition-transform duration-200 group-hover:scale-105 {isActive('/chat') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                <MessageSquare size={20} strokeWidth={1.8} />
            </span>
            <span class="text-[10px] font-medium tracking-wide transition-colors duration-150 {isActive('/chat') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                Chat
            </span>
        </a>

        <a href="/brain" class="group flex w-full flex-col items-center gap-1 py-2.5 no-underline">
            <span class="flex h-6 w-6 items-center justify-center transition-transform duration-200 group-hover:scale-105 {isActive('/brain') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                <Clover size={20} strokeWidth={1.8} />
            </span>
            <span class="text-[10px] font-medium tracking-wide transition-colors duration-150 {isActive('/brain') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                Brain
            </span>
        </a>

        <a href="/apps" class="group flex w-full flex-col items-center gap-1 py-2.5 no-underline">
            <span class="grid h-5 w-5 grid-cols-2 gap-0.5 p-0.5 transition-transform duration-200 group-hover:scale-105">
                <span class="rounded-[2px] bg-[#ef4444] opacity-90"></span>
                <span class="rounded-[2px] bg-[#f59e0b] opacity-90"></span>
                <span class="rounded-[2px] bg-[#a855f7] opacity-90"></span>
                <span class="rounded-[2px] bg-[#475569] flex items-center justify-center text-[7px] font-bold text-white/90 leading-none">+</span>
            </span>
            <span class="text-[10px] font-medium tracking-wide transition-colors duration-150 {isActive('/apps') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                Apps
            </span>
        </a>

        <div class="flex-1"></div>

        <a href="/invite" class="group flex w-full flex-col items-center gap-1 py-2.5 no-underline">
            <span class="flex h-6 w-6 items-center justify-center transition-transform duration-200 group-hover:scale-105 {isActive('/invite') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                <UserPlus size={20} strokeWidth={1.8} />
            </span>
            <span class="text-[10px] font-medium tracking-wide transition-colors duration-150 {isActive('/invite') ? 'text-white' : 'text-[#7e7e86] group-hover:text-white'}">
                Invite
            </span>
        </a>

        <a href="/help" class="group flex w-full flex-col items-center py-1.5 no-underline text-[#7e7e86] hover:text-white transition-transform duration-200 group-hover:scale-105">
            <HelpCircle size={20} strokeWidth={1.8} />
        </a>
        
    </aside>
</div>