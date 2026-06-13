import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { prisma } from "$lib/server/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    // Staff accounts are provisioned, never self-registered. Even if someone hits the
    // sign-up endpoint directly, the CRM gate (role === ADMIN) keeps them out.
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    // Better Auth hashes with scrypt by default; the hash lives on the Account table.
  },

  user: {
    // Platform schema stores the avatar as `avatar`; Better Auth's core field is `image`.
    fields: { image: "avatar" },
    additionalFields: {
      // Surface the platform Role on the session so the gate can read it without an
      // extra query. input:false → clients can never set/escalate their own role.
      role: { type: "string", input: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
    // Short-lived signed cookie cache avoids a DB read on every request in hooks.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  // CSRF / origin allowlist for auth endpoints.
  trustedOrigins: env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [],

  // MUST be the last plugin so it can flush Set-Cookie on the way out.
  plugins: [sveltekitCookies(getRequestEvent)],
});

export type Auth = typeof auth;
