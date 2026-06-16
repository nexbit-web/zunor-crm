// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks'
import { svelteKitHandler } from 'better-auth/svelte-kit'
import { building } from '$app/environment'
import { redirect, type Handle } from '@sveltejs/kit'
import { auth } from '$lib/server/auth'
import { isStaff } from '$lib/permissions'

// Доступне без staff-сесії. Усе інше — за гейтом.
const PUBLIC_PATHS = ['/login']
const isPublic = (p: string) =>
  PUBLIC_PATHS.some((x) => p === x || p.startsWith(x + '/'))

// 1) Security-заголовки на КОЖНУ відповідь (включно з ендпоінтами Better Auth).
const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event)

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
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

// 2) Сесія один раз → locals; монтуємо Better Auth (/api/auth/*).
const populateSession: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers })
  event.locals.session = session?.session ?? null
  event.locals.user = session?.user ?? null
  // svelteKitHandler сам віддає /api/auth/*, інакше викликає resolve → наступний гейт.
  return svelteKitHandler({ event, resolve, auth, building })
}

// 3) CRM — лише staff (ADMIN/MANAGER/MODERATOR); бан і не-staff → на /login.
//    Права на конкретні дії перевіряються у load/actions через requireCapability.
const requireStaffGate: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url
  if (pathname.startsWith('/api/auth') || isPublic(pathname)) {
    return resolve(event)
  }

  const user = event.locals.user
  if (!user) {
    redirect(
      303,
      `/login?redirectTo=${encodeURIComponent(pathname + event.url.search)}`,
    )
  }
  if (!isStaff(user.role) || user.banned) {
    redirect(303, '/login?error=forbidden')
  }

  return resolve(event)
}

export const handle = sequence(
  securityHeaders,
  populateSession,
  requireStaffGate,
)
