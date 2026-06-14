<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import { page } from '$app/state'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
  let submitting = $state(false)

  const redirectTo = $derived(page.url.searchParams.get('redirectTo') ?? '/')
  const forbidden = $derived(page.url.searchParams.get('error') === 'forbidden')
</script>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
  <div
    class="border-border bg-card w-full max-w-sm rounded-2xl border p-6 shadow-sm"
  >
    <h1 class="text-foreground text-xl font-semibold">Вхід у Zunor CRM</h1>
    <p class="text-muted-foreground mt-1 text-sm">
      Доступ лише для адміністраторів.
    </p>

    {#if forbidden}
      <p
        class="bg-destructive/10 text-destructive mt-4 rounded-md px-3 py-2 text-sm"
        role="alert"
      >
        Цей акаунт не має доступу до CRM.
      </p>
    {/if}

    <form
      method="POST"
      class="mt-5 flex flex-col gap-4"
      use:enhance={() => {
        submitting = true
        return async ({ update }) => {
          await update()
          submitting = false
        }
      }}
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div class="flex flex-col gap-1.5">
        <label for="email" class="text-foreground text-sm font-medium"
          >Email</label
        >
        <input
          id="email"
          name="email"
          type="email"
          autocomplete="username"
          required
          value={form?.email ?? ''}
          class="border-input bg-background focus-visible:ring-ring h-10 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="password" class="text-foreground text-sm font-medium"
          >Пароль</label
        >
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          class="border-input bg-background focus-visible:ring-ring h-10 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
        />
      </div>

      {#if form?.error}
        <p class="text-destructive text-sm" role="alert">{form.error}</p>
      {/if}

      <button
        type="submit"
        disabled={submitting}
        class="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring h-10 rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-2 disabled:opacity-60"
      >
        {submitting ? 'Входимо…' : 'Увійти'}
      </button>
    </form>
  </div>
</div>
