import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access'

export const ac = createAccessControl({ ...defaultStatements })

// Авторизацію робимо у власних гардах. Тут лише реєструємо імена ролей,
// інакше createUser/setRole приймають тільки 'user'|'admin'.
export const roles = {
  ADMIN: ac.newRole({ ...adminAc.statements }), // повний доступ до admin-ендпоінтів
  MANAGER: ac.newRole({}),
  MODERATOR: ac.newRole({}),
  CLIENT: ac.newRole({}),
  MASTER: ac.newRole({}),
}
