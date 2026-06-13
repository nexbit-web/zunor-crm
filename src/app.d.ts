// Types only. `import type` keeps server code out of the client graph.
import type { auth } from "$lib/server/auth";

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;
type AuthSession = NonNullable<SessionResult>["session"];
type AuthUser = NonNullable<SessionResult>["user"];

declare global {
  namespace App {
    interface Locals {
      session: AuthSession | null;
      user: AuthUser | null;
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
