import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { redirect, type Handle } from "@sveltejs/kit";
import { auth } from "$lib/server/auth";
 

// Paths reachable without an ADMIN session. Everything else is gated.
const PUBLIC_PATHS = ["/login"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

// 1) Security headers on EVERY response, including Better Auth endpoints.
const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    // 'unsafe-inline' is here only for style attributes; replace with a nonce when we
    // stop using inline styles. We use class:/style: directives, so this stays narrow.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  if (!building && event.url.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
};

// 2) Resolve the session once, expose it on locals, mount Better Auth.
const populateSession: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.session = session?.session ?? null;
  event.locals.user = session?.user ?? null;

  // svelteKitHandler serves /api/auth/* itself; otherwise it falls through to `resolve`.
  return svelteKitHandler({ event, resolve, auth, building });
};

// 3) The whole CRM is ADMIN-only. Authenticated CLIENT/MASTER are bounced out.
const requireAdmin: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname.startsWith("/api/auth") || isPublic(pathname)) {
    return resolve(event);
  }

  const user = event.locals.user;
  if (!user) {
    redirect(
      303,
      `/login?redirectTo=${encodeURIComponent(pathname + event.url.search)}`,
    );
  }
  if (user.role !== "ADMIN") {
    redirect(303, "/login?error=forbidden");
  }

  return resolve(event);
};

export const handle = sequence(securityHeaders, populateSession, requireAdmin);
