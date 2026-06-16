export type Role = 'ADMIN' | 'MANAGER' | 'MODERATOR'
export const STAFF_ROLES = ['ADMIN', 'MANAGER', 'MODERATOR'] as const

const RANK = { MODERATOR: 1, MANAGER: 2, ADMIN: 3 } as const

export function isStaff(role: string | null | undefined): role is Role {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'MODERATOR'
}

/** Роль не нижча за потрібну: ADMIN ≥ MANAGER ≥ MODERATOR. */
export function atLeast(role: string | null | undefined, min: Role): boolean {
  return isStaff(role) && RANK[role] >= RANK[min]
}
