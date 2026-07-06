/**
 * Guard de navigation pour vérifier les permissions sur les modules.
 * Empêche l'accès aux modules dont l'utilisateur n'est pas responsable.
 */

import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase'

export async function modulePermissionGuard(to, from, next) {
  const authStore = useAuthStore()
  const userEmail = authStore.user?.email

  if (!userEmail) {
    console.warn('Accès refusé : aucun utilisateur connecté')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresModuleOwnership && to.params.id) {
    const moduleId = to.params.id

    try {
      const { data: module, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single()

      if (error || !module) {
        console.error('Module non trouvé:', error)
        next({
          path: '/admin/dashboard-rm',
          query: { error: 'Module non trouvé' }
        })
        return
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_email', userEmail)

      const isAdmin = roles?.some((r) => r.role === 'admin')
      const isOwner = module.responsable_email === userEmail

      let isCoordinateur = false
      if (module.coordinateur && typeof module.coordinateur === 'string') {
        const coordinators = module.coordinateur.split(',').map((e) => e.trim().toLowerCase())
        isCoordinateur = coordinators.includes(userEmail.toLowerCase())
      }

      let matchByName = false
      if (!module.responsable_email && module.responsable) {
        const emailName = userEmail.split('@')[0].toLowerCase()
        const responsableName = module.responsable.toLowerCase()
        matchByName = responsableName.includes(emailName)
      }

      if (isAdmin || isOwner || isCoordinateur || matchByName) {
        next()
      } else {
        console.warn('Accès refusé : utilisateur non responsable du module')
        next({
          path: '/admin/dashboard-rm',
          query: {
            error: 'Vous n\'êtes pas autorisé à accéder à ce module',
            moduleId: moduleId
          }
        })
      }
    } catch (error) {
      console.error('Erreur de vérification des permissions module:', error)
      next({
        path: '/admin/dashboard-rm',
        query: { error: 'Erreur de vérification des permissions' }
      })
    }
  } else {
    next()
  }
}

export async function adminOnlyGuard(to, from, next) {
  const authStore = useAuthStore()
  const userEmail = authStore.user?.email

  if (!userEmail) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  try {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_email', userEmail)

    if (error) {
      console.error('Erreur vérification rôle admin:', error)
      next({ path: '/admin/dashboard-rm', query: { error: 'Erreur de vérification' } })
      return
    }

    const isAdmin = roles?.some((r) => r.role === 'admin')

    if (isAdmin) {
      next()
    } else {
      console.warn('Accès admin refusé pour:', userEmail)
      next({ path: '/admin/dashboard-rm', query: { error: 'Accès réservé aux administrateurs' } })
    }
  } catch (error) {
    console.error('Erreur guard admin:', error)
    next({ path: '/admin/dashboard-rm', query: { error: 'Erreur de vérification' } })
  }
}
