function asPermissionList(requirement) {
  if (requirement === undefined || requirement === null || requirement === '') return []
  return (Array.isArray(requirement) ? requirement : [requirement]).filter(Boolean)
}

export function evaluateRouteAccess(meta = {}, {
  isAuthenticated = false,
  isSuper = false,
  can = () => false
} = {}) {
  const needs = asPermissionList(meta.need)
  const requiredRoles = asPermissionList(meta.requiredRole)

  if (needs.includes('public') || needs.includes('anonymous')) {
    return { allowed: true, reason: 'public' }
  }

  const requiresIdentity = Boolean(meta.requiresAuth || needs.length || requiredRoles.length)
  if (requiresIdentity && !isAuthenticated) {
    return { allowed: false, reason: 'authentication' }
  }

  if (needs.includes('authenticated')) {
    return { allowed: true, reason: 'authenticated' }
  }

  if (needs.length > 0 && !isSuper && !can(needs)) {
    return { allowed: false, reason: 'permission', missing: needs }
  }

  if (requiredRoles.length > 0 && !isSuper && !can(requiredRoles)) {
    return { allowed: false, reason: 'role', missing: requiredRoles }
  }

  return { allowed: true, reason: isSuper ? 'super' : 'granted' }
}

