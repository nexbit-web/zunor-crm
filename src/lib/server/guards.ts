import { error, redirect } from "@sveltejs/kit";

/**
 * Authorize on the server in every protected load/action. The hook already gates,
 * but loads must never trust that alone — defense in depth. Returns the user
 * narrowed to an authenticated ADMIN.
 */
export function requireStaff(locals: App.Locals) {
  const user = locals.user;
  if (!user) redirect(303, "/login");
  if (user.role !== "ADMIN") error(403, "Доступ заборонено");
  return user;
}
