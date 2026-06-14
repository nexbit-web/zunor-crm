// src/routes/(app)/+layout.server.ts
import { requireStaff } from '$lib/server/guards'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals }) => {
  // Defense-in-depth: хук уже гейтить, але layout не довіряє цьому наосліп.
  const user = requireStaff(locals)
  // Тільки безпечні поля для шапки. Жодних токенів/хешів.
  return {
    user: {
      name: user.name ?? null,
      email: user.email,
      image: user.image ?? null,
    },
  }
}
