import Pusher from 'pusher'
import { env } from '$env/dynamic/private'

// УВАГА: ці значення мають збігатися з Pusher-додатком маркетплейсу,
// інакше події звідти не дійдуть до CRM.
export const pusherServer = new Pusher({
  appId: env.PUSHER_APP_ID!,
  key: env.PUSHER_KEY!,
  secret: env.PUSHER_SECRET!,
  cluster: env.PUSHER_CLUSTER ?? 'eu',
  useTLS: true,
})

export const ADMIN_CHANNEL = 'private-admin'
export const MODERATION_NEW = 'moderation:new' // новий майстер → тост + бейдж
export const MODERATION_CHANGED = 'moderation:changed' // рішення прийнято → лише бейдж

export async function safeTrigger(
  channel: string | string[],
  event: string,
  data: unknown,
): Promise<void> {
  try {
    await pusherServer.trigger(channel, event, data)
  } catch (err) {
    console.error('[Pusher] trigger failed', { channel, event, err })
  }
}

export const notifyModerationNew = () =>
  safeTrigger(ADMIN_CHANNEL, MODERATION_NEW, {})
export const notifyModerationChanged = () =>
  safeTrigger(ADMIN_CHANNEL, MODERATION_CHANGED, {})
