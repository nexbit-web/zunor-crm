<script lang="ts">
  import Sidebar from '$lib/components/sidebar/SidebarItem.svelte';
  import Header from '$lib/components/header/Header.svelte';
</script>

<div class="app-shell">
  <Header />
  <Sidebar />
  <main class="content">
    <slot />
  </main>
</div>

<style>
  .app-shell {
    display: grid;
    grid-template-columns: 72px 1fr;
    grid-template-rows: 52px 1fr;
    grid-template-areas:
      "header header"
      "sidebar content";
    height: 100vh;
    overflow: hidden;
  }

  /* Header занимает всю ширину */
  :global(header) {
    grid-area: header;
  }

  /* Sidebar — только под хедером */
  :global(aside) {
    grid-area: sidebar;
    overflow-y: auto;
  }

  /* Content — остаток пространства */
  .content {
    grid-area: content;
    overflow-y: auto;
  }
</style>