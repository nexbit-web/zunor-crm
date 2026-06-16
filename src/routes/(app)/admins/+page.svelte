<script lang="ts">
  import type { PageData } from './$types'
  import { enhance } from '$app/forms'
  import * as Card from '$lib/components/ui/card/index.js'
  import { toast } from '$lib/stores/toast-store.svelte'

  let { data }: { data: PageData } = $props()

  const roleLabel: Record<string, string> = {
    ADMIN: 'Адмін',
    MANAGER: 'Менеджер',
    MODERATOR: 'Модератор',
  }

  // спільний обробник enhance: тост + оновлення даних
  function notify(fallback = 'Готово') {
    return async ({
      result,
      update,
    }: {
      result: { type: string; data?: { success?: string; error?: string } }
      update: () => Promise<void>
    }) => {
      if (result.type === 'success') {
        toast.success(result.data?.success ?? fallback)
        await update()
      } else if (result.type === 'failure') {
        toast.error(result.data?.error ?? 'Помилка')
      } else {
        await update()
      }
    }
  }
</script>

<div class="mx-auto flex max-w-[960px] flex-col gap-6">
  <div>
    <h1
      class="text-foreground text-[clamp(22px,3vw,28px)] font-bold tracking-tight"
    >
      Співробітники
    </h1>
    <p class="text-muted-foreground mt-1 text-sm">
      Додавання, ролі та блокування персоналу
    </p>
  </div>

  <!-- Додати співробітника -->
  <Card.Root class="p-5">
    <h2 class="mb-4 text-base font-semibold">Додати співробітника</h2>
    <form
      method="POST"
      action="?/create"
      use:enhance={() => notify('Співробітника створено')}
      class="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted-foreground">Ім'я</span>
        <input
          name="name"
          required
          minlength="2"
          maxlength="80"
          class="border-border bg-background h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted-foreground">Email</span>
        <input
          name="email"
          type="email"
          required
          autocomplete="off"
          class="border-border bg-background h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted-foreground">Тимчасовий пароль (≥ 12)</span>
        <input
          name="password"
          type="text"
          required
          minlength="12"
          maxlength="128"
          autocomplete="new-password"
          class="border-border bg-background h-9 rounded-lg border px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted-foreground">Роль</span>
        <select
          name="role"
          required
          class="border-border bg-background h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <option value="MODERATOR">Модератор</option>
          <option value="MANAGER">Менеджер</option>
          <option value="ADMIN">Адмін</option>
        </select>
      </label>
      <div class="sm:col-span-2">
        <button
          type="submit"
          class="bg-primary text-primary-foreground h-9 rounded-lg px-4 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Створити
        </button>
      </div>
    </form>
  </Card.Root>

  <!-- Список співробітників -->
  <Card.Root class="overflow-hidden">
    <div class="divide-border divide-y">
      {#each data.staff as s (s.id)}
        {@const isSelf = s.id === data.meId}
        <div class="flex flex-wrap items-center gap-3 px-5 py-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {s.name ?? '—'}
              {#if isSelf}<span class="text-muted-foreground text-xs">(ви)</span
                >{/if}
            </p>
            <p class="text-muted-foreground truncate text-xs">{s.email}</p>
          </div>

          {#if s.banned}
            <span
              class="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400"
              >Заблоковано</span
            >
          {/if}

          <!-- Зміна ролі (не для себе) -->
          <form
            method="POST"
            action="?/setRole"
            use:enhance={() => notify('Роль оновлено')}
          >
            <input type="hidden" name="userId" value={s.id} />
            <select
              name="role"
              value={s.role}
              disabled={isSelf}
              onchange={(e) => e.currentTarget.form?.requestSubmit()}
              class="border-border bg-background h-8 rounded-lg border px-2 text-xs outline-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-label="Роль {s.name ?? s.email}"
            >
              <option value="MODERATOR">{roleLabel.MODERATOR}</option>
              <option value="MANAGER">{roleLabel.MANAGER}</option>
              <option value="ADMIN">{roleLabel.ADMIN}</option>
            </select>
          </form>

          <!-- Блок / розблок -->
          {#if s.banned}
            <form
              method="POST"
              action="?/unblock"
              use:enhance={() => notify('Розблоковано')}
            >
              <input type="hidden" name="userId" value={s.id} />
              <button
                type="submit"
                class="border-border h-8 rounded-lg border px-3 text-xs font-medium hover:bg-[var(--muted)]"
                >Розблокувати</button
              >
            </form>
          {:else}
            <form
              method="POST"
              action="?/block"
              use:enhance={() => notify('Заблоковано')}
            >
              <input type="hidden" name="userId" value={s.id} />
              <button
                type="submit"
                disabled={isSelf}
                class="h-8 rounded-lg border border-amber-500/40 px-3 text-xs font-medium text-amber-600 hover:bg-amber-500/10 disabled:opacity-40 dark:text-amber-400"
              >
                Заблокувати
              </button>
            </form>
          {/if}

          <!-- Видалити -->
          <form
            method="POST"
            action="?/remove"
            use:enhance={({ cancel }) => {
              if (!confirm(`Видалити співробітника ${s.email}?`))
                return cancel()
              return notify('Видалено')
            }}
          >
            <input type="hidden" name="userId" value={s.id} />
            <button
              type="submit"
              disabled={isSelf}
              class="h-8 rounded-lg border border-rose-500/40 px-3 text-xs font-medium text-rose-600 hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-400"
            >
              Видалити
            </button>
          </form>
        </div>
      {/each}
    </div>
  </Card.Root>
</div>
