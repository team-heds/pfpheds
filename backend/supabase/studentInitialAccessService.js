const crypto = require('crypto')
const { isStudentProfile, normalizeAudienceToken } = require('../security/userAudience')
const { withTimeout } = require('../observability/health')
const { resolveRecoveryRedirectUrl } = require('./passwordRecoveryRequestBackend')

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ACCESS_TTL_MS = 60 * 60 * 1000
const ALLOWED_CLASSES = new Set(['ba26', 'bac26'])

class StudentInitialAccessError extends Error {
  constructor(code, status, message) {
    super(message)
    this.name = 'StudentInitialAccessError'
    this.code = code
    this.status = status
  }
}

function controlledError(code) {
  const errors = {
    invalid_user_id: [400, 'Identifiant utilisateur invalide.'],
    profile_not_found: [404, 'Profil étudiant introuvable.'],
    student_ineligible: [409, 'Ce profil n’est pas éligible au premier accès BA26.'],
    auth_account_missing: [409, 'Le compte d’authentification n’est pas disponible.'],
    auth_email_missing: [409, 'L’adresse du compte d’authentification n’est pas disponible.'],
    access_already_used: [409, 'Le premier accès de ce compte a déjà été utilisé.'],
    delivery_failed: [502, 'L’accès initial n’a pas pu être envoyé.'],
    provider_unavailable: [503, 'Le service d’authentification est temporairement indisponible.'],
    persistence_failed: [503, 'Le suivi de l’accès initial est temporairement indisponible.']
  }
  const [status, message] = errors[code] || errors.persistence_failed
  return new StudentInitialAccessError(code, status, message)
}

function isEligibleClass(value) {
  return ALLOWED_CLASSES.has(normalizeAudienceToken(value))
}

function resolveInitialAccessRedirectUrl(environment) {
  const url = new URL(resolveRecoveryRedirectUrl(environment))
  url.searchParams.set('flow', 'initial-access')
  return url.toString()
}

function publicState(row, now = new Date()) {
  if (!row) return { status: 'pending', attemptCount: 0 }
  const expired =
    row.status === 'sent' && row.expires_at && new Date(row.expires_at).getTime() <= now.getTime()
  return {
    status: expired ? 'expired' : row.status,
    attemptCount: row.attempt_count,
    lastSentAt: row.last_sent_at,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    lastErrorCode: row.last_error_code,
    updatedAt: row.updated_at
  }
}

function createStudentInitialAccessService(options = {}) {
  const client = options.client
  const authClient = options.authClient
  if (!client || !authClient) throw new Error('Supabase server clients are required.')

  const now = options.now || (() => new Date())
  const timeoutMs = options.timeoutMs || 5000
  const redirectTo = resolveInitialAccessRedirectUrl(options.environment || process.env)
  const idFactory = options.idFactory || crypto.randomUUID

  async function execute(query) {
    const controller = new AbortController()
    const abortable =
      typeof query?.abortSignal === 'function' ? query.abortSignal(controller.signal) : query
    const result = await withTimeout(abortable, timeoutMs, () => controller.abort())
    if (result?.error) throw result.error
    return result?.data
  }

  async function recordEvent(event) {
    await execute(client.from('student_initial_access_events').insert(event))
  }

  async function recordFailure({ userId, actorUserId, requestId, errorCode, attemptCount }) {
    const timestamp = now().toISOString()
    await execute(
      client.from('student_initial_access').upsert(
        {
          user_id: userId,
          status: 'error',
          attempt_count: attemptCount,
          last_error_code: errorCode,
          updated_at: timestamp,
          updated_by: actorUserId
        },
        { onConflict: 'user_id' }
      )
    )
    await recordEvent({
      user_id: userId,
      event_type: 'error',
      actor_user_id: actorUserId,
      request_id: requestId,
      error_code: errorCode,
      created_at: timestamp
    })
  }

  async function loadProfile(userId) {
    if (!UUID_PATTERN.test(userId)) throw controlledError('invalid_user_id')
    let profile
    try {
      profile = await execute(
        client
          .from('user_profiles')
          .select('user_id,role,permissions,is_active,classe')
          .eq('user_id', userId)
          .maybeSingle()
      )
    } catch {
      throw controlledError('persistence_failed')
    }
    if (!profile) throw controlledError('profile_not_found')
    if (!isStudentProfile(profile) || !isEligibleClass(profile.classe)) {
      throw controlledError('student_ineligible')
    }
    return profile
  }

  async function listStates() {
    try {
      const rows = await execute(
        client
          .from('student_initial_access')
          .select(
            'user_id,status,attempt_count,last_sent_at,expires_at,used_at,last_error_code,updated_at'
          )
          .order('updated_at', { ascending: false })
      )
      const reference = now()
      return (rows || []).map((row) => ({ userId: row.user_id, ...publicState(row, reference) }))
    } catch {
      throw controlledError('persistence_failed')
    }
  }

  async function send({ userId, actorUserId, requestId = idFactory() }) {
    await loadProfile(userId)

    let previous
    try {
      previous = await execute(
        client
          .from('student_initial_access')
          .select('status,attempt_count,last_sent_at,expires_at,used_at,last_error_code,updated_at')
          .eq('user_id', userId)
          .maybeSingle()
      )
      if (previous?.status === 'used') throw controlledError('access_already_used')

      const timestamp = now().toISOString()
      const attemptCount = Number(previous?.attempt_count || 0) + 1
      await execute(
        client.from('student_initial_access').upsert(
          {
            user_id: userId,
            status: 'pending',
            attempt_count: attemptCount,
            used_at: null,
            last_error_code: null,
            updated_at: timestamp,
            updated_by: actorUserId
          },
          { onConflict: 'user_id' }
        )
      )
      await recordEvent({
        user_id: userId,
        event_type: 'pending',
        actor_user_id: actorUserId,
        request_id: requestId,
        created_at: timestamp
      })
    } catch (error) {
      if (error instanceof StudentInitialAccessError) throw error
      throw controlledError('persistence_failed')
    }
    const attemptCount = Number(previous?.attempt_count || 0) + 1

    let authUser
    try {
      const result = await withTimeout(authClient.admin.getUserById(userId), timeoutMs)
      if (result?.error || !result?.data?.user) throw result?.error || new Error('missing')
      authUser = result.data.user
    } catch (error) {
      const unavailable = error?.code === 'UPSTREAM_TIMEOUT' || Number(error?.status || 0) >= 500
      const code = unavailable ? 'provider_unavailable' : 'auth_account_missing'
      try {
        await recordFailure({ userId, actorUserId, requestId, errorCode: code, attemptCount })
      } catch {
        throw controlledError('persistence_failed')
      }
      throw controlledError(code)
    }

    const email = String(authUser.email || '')
      .trim()
      .toLowerCase()
    if (!email) {
      try {
        await recordFailure({
          userId,
          actorUserId,
          requestId,
          errorCode: 'auth_email_missing',
          attemptCount
        })
      } catch {
        throw controlledError('persistence_failed')
      }
      throw controlledError('auth_email_missing')
    }

    try {
      const { error } = await withTimeout(
        authClient.resetPasswordForEmail(email, { redirectTo }),
        timeoutMs
      )
      if (error) throw error
    } catch (error) {
      const code =
        error?.code === 'UPSTREAM_TIMEOUT' || Number(error?.status || 0) >= 500
          ? 'provider_unavailable'
          : 'delivery_failed'
      try {
        await recordFailure({ userId, actorUserId, requestId, errorCode: code, attemptCount })
      } catch {
        throw controlledError('persistence_failed')
      }
      throw controlledError(code)
    }

    const sentAt = now()
    const row = {
      user_id: userId,
      status: 'sent',
      attempt_count: attemptCount,
      last_sent_at: sentAt.toISOString(),
      expires_at: new Date(sentAt.getTime() + ACCESS_TTL_MS).toISOString(),
      used_at: null,
      last_error_code: null,
      updated_at: sentAt.toISOString(),
      updated_by: actorUserId
    }

    try {
      await execute(client.from('student_initial_access').upsert(row, { onConflict: 'user_id' }))
      await recordEvent({
        user_id: userId,
        event_type: previous ? 'resent' : 'sent',
        actor_user_id: actorUserId,
        request_id: requestId,
        created_at: sentAt.toISOString()
      })
    } catch {
      throw controlledError('persistence_failed')
    }

    return { userId, ...publicState(row, sentAt) }
  }

  async function markUsed({ userId, requestId = idFactory() }) {
    if (!UUID_PATTERN.test(userId)) throw controlledError('invalid_user_id')
    let current
    try {
      current = await execute(
        client
          .from('student_initial_access')
          .select('status,attempt_count,last_sent_at,expires_at,used_at,last_error_code,updated_at')
          .eq('user_id', userId)
          .maybeSingle()
      )
      if (!current || current.status === 'used') {
        return { tracked: Boolean(current), state: publicState(current, now()) }
      }
      if (!['sent', 'expired'].includes(current.status)) {
        return { tracked: true, state: publicState(current, now()) }
      }

      const timestamp = now().toISOString()
      const updated = await execute(
        client
          .from('student_initial_access')
          .update({
            status: 'used',
            used_at: timestamp,
            last_error_code: null,
            updated_at: timestamp,
            updated_by: userId
          })
          .eq('user_id', userId)
          .select('status,attempt_count,last_sent_at,expires_at,used_at,last_error_code,updated_at')
          .maybeSingle()
      )
      await recordEvent({
        user_id: userId,
        event_type: 'used',
        actor_user_id: userId,
        request_id: requestId,
        created_at: timestamp
      })
      return { tracked: true, state: publicState(updated, now()) }
    } catch (error) {
      if (error instanceof StudentInitialAccessError) throw error
      throw controlledError('persistence_failed')
    }
  }

  return { listStates, loadProfile, markUsed, send }
}

module.exports = {
  ACCESS_TTL_MS,
  StudentInitialAccessError,
  createStudentInitialAccessService,
  isEligibleClass,
  publicState,
  resolveInitialAccessRedirectUrl
}
