// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks'
import { svelteKitHandler } from 'better-auth/svelte-kit'
import { building } from '$app/environment'
import { redirect, type Handle } from '@sveltejs/kit'
import { auth } from '$lib/server/auth'

// Доступне без ADMIN-сесії. Усе інше — за гейтом.
const PUBLIC_PATHS = ['/login']
const isPublic = (p: string) =>
  PUBLIC_PATHS.some((x) => p === x || p.startsWith(x + '/'))

// 1) Security-заголовки на КОЖНУ відповідь, включно з ендпоінтами Better Auth.
const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event)

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // ← вот и всё
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.pusher.com wss://*.pusher.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )

  if (!building && event.url.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    )
  }
  return response
}

// 2) Резолвимо сесію один раз, кладемо в locals, монтуємо Better Auth.
const populateSession: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers })
  event.locals.session = session?.session ?? null
  event.locals.user = session?.user ?? null
  // svelteKitHandler сам віддає /api/auth/*, інакше падає у resolve (→ requireAdmin).
  return svelteKitHandler({ event, resolve, auth, building })
}

// 3) Уся CRM — ADMIN-only. CLIENT/MASTER з маркетплейсу сюди не заходять.
const requireAdmin: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url
  if (pathname.startsWith('/api/auth') || isPublic(pathname))
    return resolve(event)

  const user = event.locals.user
  if (!user) {
    throw redirect(
      // ← throw!
      303,
      `/login?redirectTo=${encodeURIComponent(pathname + event.url.search)}`,
    )
  }
  if (user.role !== 'ADMIN') {
    throw redirect(303, '/login?error=forbidden') // ← throw!
  }
  return resolve(event)
}

export const handle = sequence(securityHeaders, populateSession, requireAdmin)
