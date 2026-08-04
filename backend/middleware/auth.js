const { supabaseAdmin } = require('../supabaseClient')

const ADMIN_PERMISSIONS = new Set(['admin', 'super.all', 'super_admin', 'adminphysio', 'adminsoins'])

function parseBearerToken(headerValue) {
  if (typeof headerValue !== 'string') return null
  const match = headerValue.match(/^Bearer\s+([^\s]+)$/i)
  return match ? match[1] : null
}

function normalizePermissions(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap(normalizePermissions)
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([permission]) => permission)
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed !== value) return normalizePermissions(parsed)
    } catch (_) {
      // Plain role/permission string.
    }
    return value.split(',').map((permission) => permission.trim()).filter(Boolean)
  }
  return []
}

function isAdmin(authContext) {
  return (authContext?.permissions || []).some((permission) =>
    ADMIN_PERMISSIONS.has(String(permission).toLowerCase())
  )
}

async function loadAuthorization(userId) {
  const permissions = new Set()
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role, permissions')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError && profileError.code !== 'PGRST116') throw profileError
  normalizePermissions(profile?.role).forEach((permission) => permissions.add(permission))
  normalizePermissions(profile?.permissions).forEach((permission) => permissions.add(permission))

  const { data: trackRoles, error: trackError } = await supabaseAdmin
    .from('user_track_roles')
    .select('track_id, role')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (trackError && !['42P01', 'PGRST205'].includes(trackError.code)) throw trackError
  for (const entry of trackRoles || []) {
    permissions.add(entry.role)
    if (entry.track_id && entry.role) permissions.add(`${entry.track_id}.${entry.role}`)
  }
  return [...permissions]
}

async function authenticate(req, res, next) {
  const token = parseBearerToken(req.get('authorization'))
  if (!token) return res.status(401).json({ error: 'Authentification requise.' })
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return res.status(401).json({ error: 'Session invalide ou expirée.' })
    req.auth = {
      user: data.user,
      userId: data.user.id,
      permissions: await loadAuthorization(data.user.id),
    }
    return next()
  } catch (error) {
    console.error('[AUTH] Unable to validate session:', error.message)
    return res.status(503).json({ error: 'Service d’authentification indisponible.' })
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Authentification requise.' })
  if (!isAdmin(req.auth)) return res.status(403).json({ error: 'Accès administrateur requis.' })
  return next()
}

function requireAnyPermission(...allowedPermissions) {
  const allowed = new Set(allowedPermissions.flat().map((permission) => String(permission).toLowerCase()))
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Authentification requise.' })
    const authorized = req.auth.permissions.some((permission) => allowed.has(String(permission).toLowerCase()))
    if (!authorized && !isAdmin(req.auth)) return res.status(403).json({ error: 'Permission insuffisante.' })
    return next()
  }
}

function requireAdminForMutations(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  return requireAdmin(req, res, next)
}

function protectAdminMutations(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  return authenticate(req, res, () => requireAdmin(req, res, next))
}

module.exports = {
  authenticate,
  isAdmin,
  normalizePermissions,
  parseBearerToken,
  protectAdminMutations,
  requireAdmin,
  requireAdminForMutations,
  requireAnyPermission,
}
