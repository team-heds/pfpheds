import { useRoleStore } from '@/stores/role'

/** Permissions qui donnent l'accès administrateur complet. */
export const ADMIN_PERMISSIONS = Object.freeze(['admin', 'super.all'])

export function hasAdminAccess(roleStore = useRoleStore()) {
  return roleStore.can([...ADMIN_PERMISSIONS])
}

/** Pour les guards : attend le chargement des permissions avant de décider. */
export async function resolveAdminAccess(roleStore = useRoleStore()) {
  try {
    await roleStore.init()
  } catch (error) {
    console.warn('Permissions indisponibles :', error)
  }
  return hasAdminAccess(roleStore)
}
