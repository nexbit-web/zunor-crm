<!-- src/routes/(app)/statistics/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  function money(cents: number): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }
</script>

{#snippet stat(label: string, value: number | string, sub: string)}
  <div class="border-border bg-card flex flex-col gap-1 rounded-xl border p-4">
    <span class="text-muted-foreground text-xs font-medium">{label}</span>
    <span class="text-foreground text-2xl font-semibold tabular-nums"
      >{value}</span
    >
    {#if sub}<span class="text-muted-foreground text-xs">{sub}</span>{/if}
  </div>
{/snippet}

{#snippet barChart(series: { label: string; value: number }[])}
  {@const max = Math.max(...series.map((s) => s.value), 1)}
  <div class="flex h-44 items-end gap-3">
    {#each series as bar (bar.label)}
      <div class="flex flex-1 flex-col items-center gap-1.5">
        <span class="text-foreground text-xs tabular-nums">{bar.value}</span>
        <div
          class="bg-muted/50 flex w-full flex-1 items-end overflow-hidden rounded-md"
        >
          <div
            class="bg-primary w-full rounded-md transition-[height] duration-300"
            style:height={`${(bar.value / max) * 100}%`}
          ></div>
        </div>
        <span class="text-muted-foreground text-xs">{bar.label}</span>
      </div>
    {/each}
  </div>
{/snippet}

<div class="flex flex-col gap-8">
  <div>
    <h1 class="text-foreground text-2xl font-semibold">Статистика</h1>
    <p class="text-muted-foreground mt-1 text-sm">
      Повна аналітика платформи в реальному часі.
    </p>
  </div>

  <!-- Користувачі -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Користувачі</h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {@render stat('Усього', data.users.total, '')}
      {@render stat('Клієнти', data.users.clients, '')}
      {@render stat('Майстри', data.users.masters, '')}
      {@render stat('Адміни', data.users.admins, '')}
      {@render stat('Пошта підтверджена', data.users.emailVerified, '')}
    </div>
  </section>

  <!-- Майстри -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Майстри</h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {@render stat('Верифіковані', data.masters.verified, '')}
      {@render stat('На перевірці', data.masters.pending, '')}
      {@render stat('Відхилені', data.masters.rejected, '')}
      {@render stat('Без статусу', data.masters.none, '')}
      {@render stat('Активні', data.masters.active, '')}
    </div>
  </section>

  <!-- Заявки -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Заявки</h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {@render stat('Усього', data.jobs.total, '')}
      {@render stat('Відкриті', data.jobs.open, '')}
      {@render stat('В роботі', data.jobs.inProgress, '')}
      {@render stat('Завершені', data.jobs.completed, '')}
      {@render stat('Скасовані', data.jobs.cancelled, '')}
      {@render stat('Прострочені', data.jobs.expired, '')}
    </div>
  </section>

  <!-- Замовлення -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Замовлення</h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {@render stat('Усього', data.orders.total, '')}
      {@render stat('Створені', data.orders.created, '')}
      {@render stat('В роботі', data.orders.inProgress, '')}
      {@render stat('Завершені', data.orders.completed, '')}
      {@render stat('Скасовані', data.orders.cancelled, '')}
      {@render stat('GMV (завершені)', money(data.orders.gmvCents), '')}
    </div>
  </section>

  <!-- Активність -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">Активність</h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {@render stat('Відгуки майстрів', data.activity.proposals, '')}
      {@render stat('Відгуки (оцінки)', data.activity.reviews, '')}
      {@render stat(
        'Середня оцінка',
        data.activity.avgReview.toFixed(1),
        'з 5',
      )}
      {@render stat('Чати', data.activity.chats, '')}
      {@render stat('Повідомлення', data.activity.messages, '')}
    </div>
  </section>

  <!-- Зростання -->
  <section class="flex flex-col gap-3">
    <h2 class="text-foreground text-lg font-semibold">
      Зростання за 6 місяців
    </h2>
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div
        class="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5"
      >
        <span class="text-muted-foreground text-sm font-medium"
          >Нові користувачі</span
        >
        {@render barChart(data.growth.users)}
        <div class="text-muted-foreground flex items-center gap-4 text-xs">
          <span
            >Клієнти: {data.growth.clients.reduce(
              (s, b) => s + b.value,
              0,
            )}</span
          >
          <span
            >Майстри: {data.growth.masters.reduce(
              (s, b) => s + b.value,
              0,
            )}</span
          >
        </div>
      </div>
      <div
        class="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5"
      >
        <span class="text-muted-foreground text-sm font-medium"
          >Нові замовлення</span
        >
        {@render barChart(data.growth.orders)}
      </div>
    </div>
  </section>
</div>
