import { error, json } from '@sveltejs/kit'
import { auth } from '$lib/server/auth'
import { prisma } from '$lib/server/prisma'
import { pusherServer, ADMIN_CHANNEL } from '$lib/server/pusher'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) error(401, 'Unauthorized')

  // CRM-канал лише для адмінів — перевіряємо роль у БД, не довіряючи клієнту
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (dbUser?.role !== 'ADMIN') error(403, 'Forbidden')

  const form = await request.formData()
  const socketId = form.get('socket_id')?.toString()
  const channel = form.get('channel_name')?.toString()
  if (!socketId || !channel) error(400, 'Missing socket_id or channel_name')
  if (channel !== ADMIN_CHANNEL) error(403, 'Forbidden channel')

  return json(pusherServer.authorizeChannel(socketId, channel))
}
