<script lang="ts">
    import type { Snippet } from 'svelte';
    import Sidebar from '$lib/components/sidebar/Sidebar.svelte';
  import Header from '$lib/components/header/Header.svelte';

    // Svelte 5 деструктуризация дочерних страниц
    let { children } = $props<{ children: Snippet }>();
</script>

<div class="flex h-screen w-screen flex-col overflow-hidden bg-white p-1">
    
    <Header/>
    <div class="flex flex-1 min-h-0 w-full gap-2 items-stretch">
        
        <Sidebar />
        
        <div class="flex flex-1 flex-col min-w-0 bg-[#f8f9fa] rounded-2xl border border-neutral-200/60 overflow-hidden shadow-sm">
            
           

            <main class="flex-1 min-h-0 overflow-auto bg-white p-6">
                {#if children}
                    {@render children()}
                {/if}
            </main>
            
        </div>
        
    </div>
</div>