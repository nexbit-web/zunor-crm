import { invalidate, goto } from '$app/navigation'
import { toast } from '$lib/stores/toast-store.svelte'
import { PUBLIC_PUSHER_KEY, PUBLIC_PUSHER_CLUSTER } from '$env/static/public'

/** Запускає live-сповіщення для адміна. Повертає функцію зупинки (для onMount cleanup). */
export function startAdminRealtime(): () => void {
  if (!PUBLIC_PUSHER_KEY) return () => {} // без ключа real-time просто вимкнено

  let disposed = false
  let teardown: (() => void) | null = null

  void (async () => {
    const Pusher = (await import('pusher-js')).default // важка либа — ліниво
    if (disposed) return

    const client = new Pusher(PUBLIC_PUSHER_KEY, {
      cluster: PUBLIC_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
    })
    const channel = client.subscribe('private-admin')

    const refresh = () => void invalidate('app:moderation')
    const onNew = (data?: { name?: string; resubmission?: boolean }) => {
      refresh() // бейдж — з сервера
      const who = data?.name ?? 'Майстер'
      const msg = data?.resubmission
        ? `${who} оновив профіль — потрібна перевірка`
        : `Новий майстер на верифікацію: ${who}`
      toast.notification(msg, {
        duration: 30000,
        action: {
          label: 'Переглянути',
          onClick: (id: string) => {
            goto('/moderation')
            toast.dismiss(id)
          },
        },
      })
    }

    channel.bind('moderation:new', onNew)
    channel.bind('moderation:changed', refresh)

    teardown = () => {
      channel.unbind('moderation:new', onNew)
      channel.unbind('moderation:changed', refresh)
      client.unsubscribe('private-admin')
      client.disconnect()
    }
    if (disposed) teardown()
  })()

  return () => {
    disposed = true
    teardown?.()
  }
}
