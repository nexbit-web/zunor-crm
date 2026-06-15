<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js'
  import { Skeleton } from '$lib/components/ui/skeleton/index.js'
</script>

<div class="flex flex-col gap-4" aria-busy="true" aria-live="polite">
  <span class="sr-only">Завантаження статистики…</span>

  <!-- KPI -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#each Array.from({ length: 4 }) as _, i (i)}
      <Card.Root class="p-5">
        <Skeleton class="h-4 w-28" />
        <Skeleton class="mt-4 h-8 w-24" />
        <Skeleton class="mt-4 h-5 w-20 rounded-full" />
      </Card.Root>
    {/each}
  </div>

  <!-- GROWTH + PIE -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
    <Card.Root>
      <Card.Header><Skeleton class="h-5 w-40" /></Card.Header>
      <Card.Content
        ><Skeleton class="h-65 w-full rounded-lg" /></Card.Content
      >
    </Card.Root>
    <Card.Root>
      <Card.Header><Skeleton class="h-5 w-36" /></Card.Header>
      <Card.Content class="flex flex-col items-center gap-4">
        <Skeleton class="size-50 rounded-full" />
        <div class="flex w-full flex-col gap-2">
          {#each Array.from({ length: 3 }) as _, i (i)}
            <div class="flex items-center justify-between">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-4 w-12" />
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- JOBS + ORDERS -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {#each Array.from({ length: 2 }) as _, i (i)}
      <Card.Root>
        <Card.Header><Skeleton class="h-5 w-32" /></Card.Header>
        <Card.Content
          ><Skeleton class="h-55 w-full rounded-lg" /></Card.Content
        >
      </Card.Root>
    {/each}
  </div>

  <!-- MASTERS + ACTIVITY -->
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
    <Card.Root>
      <Card.Header><Skeleton class="h-5 w-44" /></Card.Header>
      <Card.Content
        ><Skeleton class="h-55 w-full rounded-lg" /></Card.Content
      >
    </Card.Root>
    <Card.Root>
      <Card.Header><Skeleton class="h-5 w-28" /></Card.Header>
      <Card.Content>
        <div class="grid grid-cols-2 gap-y-5 sm:grid-cols-3">
          {#each Array.from({ length: 5 }) as _, i (i)}
            <div class="px-5 {i % 3 === 0 ? 'pl-0' : 'border-border border-l'}">
              <Skeleton class="h-7 w-16" />
              <Skeleton class="mt-2 h-3.5 w-20" />
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
