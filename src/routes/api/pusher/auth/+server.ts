// src/routes/api/pusher/auth/+server.ts
import { error, json } from '@sveltejs/kit'
import { requireStaff } from '$lib/server/guards'
import { pusher, STATS_CHANNEL } from '$lib/server/pusher'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals, request }) => {
  requireStaff(locals) // тільки ADMIN може підписатись

  const form = await request.formData()
  const socketId = form.get('socket_id')
  const channel = form.get('channel_name')

  if (typeof socketId !== 'string' || typeof channel !== 'string')
    error(400, 'Bad request')
  if (channel !== STATS_CHANNEL) error(403, 'Forbidden channel') // allow-list одного каналу

  return json(pusher.authorizeChannel(socketId, channel))
}
