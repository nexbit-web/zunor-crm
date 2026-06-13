<header>
  <!-- Workspace switcher -->
  <div class="ws-switcher">
    <div class="ws-logo">N</div>
    <span>NBoy's Workspace</span>
    <ChevronDown size={14} />
  </div>

  <button class="icon-btn"><Calendar size={16} /></button>

  <!-- Search — по центру -->
  <div class="search">
    <Search size={14} />
    <span>Search</span>
    <kbd>Ctrl K</kbd>
  </div>

  <!-- Right side -->
  <div class="right">
    <button class="icon-btn"><Settings2 size={16} /></button>
    <button class="icon-btn"><Folder size={16} /></button>
    <Avatar />
  </div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    background: var(--color-background-primary);
    border-bottom: 0.5px solid var(--color-border-tertiary);
  }

  .search {
    flex: 1;
    max-width: 320px;
    margin: 0 auto;
    /* ... */
  }

  .right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>