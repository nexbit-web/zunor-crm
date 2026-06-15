// src/lib/server/pusher.ts
import Pusher from 'pusher'
import { PUSHER_APP_ID, PUSHER_SECRET } from '$env/static/private'
import { PUBLIC_PUSHER_KEY, PUBLIC_PUSHER_CLUSTER } from '$env/static/public'

export const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUBLIC_PUSHER_KEY,
  secret: PUSHER_SECRET, // лишається на сервері
  cluster: PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
})

export const STATS_CHANNEL = 'private-admin-stats'
export const STATS_EVENT = 'stats:changed'

// Лише сигнал «змінилось», без даних. Падіння Pusher не повинно ламати мутацію.
export async function notifyStatsChanged(): Promise<void> {
  try {
    await pusher.trigger(STATS_CHANNEL, STATS_EVENT, { at: Date.now() })
  } catch (err) {
    console.error('pusher trigger failed', err)
  }
}
