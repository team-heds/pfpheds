const { supabaseAdmin } = require('../supabaseClient')
const { withTimeout } = require('../observability/health')
const { logStructured, upstreamErrorContext } = require('../observability/logger')

const AUTH_UPSTREAM_TIMEOUT_MS = Math.max(
  250,
  Math.min(Number(process.env.AUTH_UPSTREAM_TIMEOUT_MS) || 2500, 10000)
)
const AUTHORIZATION_CACHE_TTL_MS = Math.max(
  0,
  Math.min(Number(process.env.AUTHORIZATION_CACHE_TTL_MS) || 0, 5000)
)

const ADMIN_PERMISSIONS = new Set([
  'admin',
  'super.all',
  'super_admin',
  'adminphysio',
  'adminsoins'
])

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
    return value
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean)
  }
  return []
}

function isAdmin(authContext) {
  return (authContext?.permissions || []).some((permission) =>
    ADMIN_PERMISSIONS.has(String(permission).toLowerCase())
  )
}

async function executeSupabaseQuery(query, timeoutMs) {
  const controller = new AbortController()
  const abortableQuery =
    typeof query.abortSignal === 'function' ? query.abortSignal(controller.signal) : query
  return withTimeout(abortableQuery, timeoutMs, () => controller.abort())
}

async function loadAuthorizationFromUpstream(client, userId, timeoutMs) {
  const permissions = new Set()
  const profileQuery = client
    .from('user_profiles')
    .select('role, permissions')
    .eq('user_id', userId)
    .maybeSingle()
  const { data: profile, error: profileError } = await executeSupabaseQuery(profileQuery, timeoutMs)

  if (profileError && profileError.code !== 'PGRST116') throw profileError
  normalizePermissions(profile?.role).forEach((permission) => permissions.add(permission))
  normalizePermissions(profile?.permissions).forEach((permission) => permissions.add(permission))

  const trackRolesQuery = client
    .from('user_track_roles')
    .select('track_id, role')
    .eq('user_id', userId)
    .eq('is_active', true)
  const { data: trackRoles, error: trackError } = await executeSupabaseQuery(
    trackRolesQuery,
    timeoutMs
  )

  if (trackError && !['42P01', 'PGRST205'].includes(trackError.code)) throw trackError
  for (const entry of trackRoles || []) {
    permissions.add(entry.role)
    if (entry.track_id && entry.role) permissions.add(`${entry.track_id}.${entry.role}`)
  }
  return [...permissions]
}

function createAuthorizationCache(fetchAuthorization, options = {}) {
  const ttlMs = Math.max(0, Number(options.ttlMs) || 0)
  const maxEntries = Math.max(1, Number(options.maxEntries) || 1000)
  const now = options.now || Date.now
  const cached = new Map()
  const inFlight = new Map()

  return async function getAuthorization(userId) {
    const existing = cached.get(userId)
    if (existing && existing.expiresAt > now()) return [...existing.permissions]
    if (existing) cached.delete(userId)
    if (inFlight.has(userId)) return [...(await inFlight.get(userId))]

    const request = Promise.resolve(fetchAuthorization(userId))
      .then((permissions) => {
        const immutablePermissions = Object.freeze([...new Set(permissions || [])])
        if (ttlMs > 0) {
          for (const [cacheKey, cachedValue] of cached) {
            if (cachedValue.expiresAt <= now()) cached.delete(cacheKey)
          }
          if (cached.size >= maxEntries) cached.delete(cached.keys().next().value)
          cached.set(userId, { permissions: immutablePermissions, expiresAt: now() + ttlMs })
        }
        return immutablePermissions
      })
      .finally(() => inFlight.delete(userId))

    inFlight.set(userId, request)
    return [...(await request)]
  }
}

function createAuthorizationLoader(options = {}) {
  const client = options.client || supabaseAdmin
  const timeoutMs = options.timeoutMs || AUTH_UPSTREAM_TIMEOUT_MS
  return createAuthorizationCache(
    (userId) => loadAuthorizationFromUpstream(client, userId, timeoutMs),
    { ttlMs: options.cacheTtlMs ?? AUTHORIZATION_CACHE_TTL_MS, now: options.now }
  )
}

const loadAuthorization = createAuthorizationLoader()

function createAuthenticate(options = {}) {
  const authClient = options.authClient || supabaseAdmin.auth
  const authorizationLoader = options.authorizationLoader || loadAuthorization
  const timeoutMs = options.timeoutMs || AUTH_UPSTREAM_TIMEOUT_MS
  const logger = options.logger || console

  return async function authenticateRequest(req, res, next) {
    const token = parseBearerToken(req.get('authorization'))
    if (!token) return res.status(401).json({ error: 'Authentification requise.' })
    try {
      const { data, error } = await withTimeout(authClient.getUser(token), timeoutMs)
      if (error) {
        const upstreamUnavailable =
          Number(error.status || error.statusCode) >= 500 ||
          error.name === 'AuthRetryableFetchError' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ECONNREFUSED'
        if (upstreamUnavailable) throw error
        return res.status(401).json({ error: 'Session invalide ou expirée.' })
      }
      if (!data?.user) return res.status(401).json({ error: 'Session invalide ou expirée.' })
      req.auth = {
        user: data.user,
        userId: data.user.id,
        permissions: await authorizationLoader(data.user.id)
      }
      return next()
    } catch (error) {
      logStructured(
        'error',
        upstreamErrorContext(error, {
          requestId: req.id,
          service: 'supabase',
          operation: 'authenticate'
        }),
        logger
      )
      return res.status(503).json({ error: 'Service d’authentification indisponible.' })
    }
  }
}

const authenticate = createAuthenticate()

function requireAdmin(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Authentification requise.' })
  if (!isAdmin(req.auth)) return res.status(403).json({ error: 'Accès administrateur requis.' })
  return next()
}

function requireAnyPermission(...allowedPermissions) {
  const allowed = new Set(
    allowedPermissions.flat().map((permission) => String(permission).toLowerCase())
  )
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Authentification requise.' })
    const authorized = req.auth.permissions.some((permission) =>
      allowed.has(String(permission).toLowerCase())
    )
    if (!authorized && !isAdmin(req.auth))
      return res.status(403).json({ error: 'Permission insuffisante.' })
    return next()
  }
}

function requireAdminForMutations(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  return requireAdmin(req, res, next)
}

function requireSelfParam(paramName = 'userId') {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Authentification requise.' })
    if (String(req.params?.[paramName] || '') === req.auth.userId || isAdmin(req.auth))
      return next()
    return res.status(403).json({ error: 'Accès au profil demandé interdit.' })
  }
}

function protectAdminMutations(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  return authenticate(req, res, () => requireAdmin(req, res, next))
}

module.exports = {
  authenticate,
  createAuthenticate,
  createAuthorizationCache,
  createAuthorizationLoader,
  executeSupabaseQuery,
  isAdmin,
  loadAuthorizationFromUpstream,
  normalizePermissions,
  parseBearerToken,
  protectAdminMutations,
  requireAdmin,
  requireAdminForMutations,
  requireAnyPermission,
  requireSelfParam
}
