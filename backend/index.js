require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const supabase = require('./supabaseClient')
const { supabaseAdmin } = require('./supabaseClient')
const { createHealthRouter, createSupabaseReadinessCheck } = require('./observability/health')
const { logStructured, upstreamErrorContext } = require('./observability/logger')
const {
  createRequestContextMiddleware,
  normalizedRoute
} = require('./observability/requestContext')
const {
  authenticate,
  requireAdmin,
  requireAdminForMutations,
  requireAnyPermission
} = require('./middleware/auth')

// CareConvers stateful chat routes
const registerCareConversStoreRoutes = require('./supabase/careconversStoreBackend')
const app = express()

// Requests reach Express through the single Caddy reverse proxy. This lets
// express-rate-limit use the real client IP from X-Forwarded-For safely.
app.set('trust proxy', 1)

//const userStoreRoutes = require('./supabase/userStoreBackend')
const institutionsStoreRoutes = require('./supabase/institutionsStoreBackend')
const enseignantsStoreRoutes = require('./supabase/enseignantsStoreBackend.js')
const hashtagStoreRoutes = require('./supabase/hashtagStoreBackend.js')
const communitiesStoreRoutes = require('./supabase/communitiesStoreBackend')
const filePhysioRoutes = require('./supabase/filePhysioBackendStore')
const postsStoreRoutes = require('./supabase/postsBackendStore.js')
//const praticiensFormateursStoreRoutes = require('./supabase/praticiensFormateursBackendStore.js');
const praticiensStoreRoutes = require('./supabase/praticiensStoreBackend.js')
const resultatVotationRoutes = require('./supabase/resultatVotationStoreBackend.js')
const ftpRoutes = require('./uploads/ftpRoutes')
const feedbackaRoutes = require('./supabase/feedbackaBackend.js')
const adminUsersRoutes = require('./supabase/adminUsersBackend.js')
const vimeoRoutes = require('./supabase/vimeoBackend.js')
const githubRoutes = require('./supabase/githubBackend.js')
const audienceDirectoryRoutes = require('./supabase/audienceDirectoryBackend.js')
const {
  createAdminDashboardStatsRouter
} = require('./dashboard/adminDashboardStatsBackend.js')
const {
  createPasswordRecoveryRequestRouter
} = require('./supabase/passwordRecoveryRequestBackend.js')
const { createPfpOutcomeRouter } = require('./supabase/pfpOutcomeBackend.js')

// push
const pushRoutes = require('./supabase/pushBackend')

const allowedProductionOrigins = [
  'https://hedsvs.ch',
  'https://www.hedsvs.ch',
  'https://api2.hedsvs.ch'
]

function isAllowedOrigin(origin) {
  if (!origin) return true

  if (process.env.NODE_ENV === 'production') {
    return allowedProductionOrigins.includes(origin)
  }

  try {
    const url = new URL(origin)
    return (
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    )
  } catch {
    return false
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true
}

// CORS and JSON parsing MUST be before routes
app.use(createRequestContextMiddleware())
app.use(cors(corsOptions))
// Express 5 uses path-to-regexp v6 which doesn't support '*' patterns.
// Use a regex to match all paths for CORS preflight handling.
app.options(/.*/, cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 180,
    standardHeaders: 'draft-8',
    legacyHeaders: false
  })
)

// Keep only operational health probes public. Every business API route below requires a valid JWT.
app.get('/api/ping', (_req, res) => res.send('pingpong'))
app.use(
  '/health',
  createHealthRouter({
    checkDependency: createSupabaseReadinessCheck(supabaseAdmin, {
      timeoutMs: Math.max(250, Math.min(Number(process.env.READINESS_TIMEOUT_MS) || 1500, 5000))
    })
  })
)
// Password recovery must remain anonymous, but is isolated behind a dedicated
// server-side limiter and always returns the same public response.
app.use('/api/auth/password-recovery', createPasswordRecoveryRequestRouter())
app.use('/api', authenticate)

// Routes - specific routes FIRST, then general ones
console.log('[ROUTES] Mounting routes...')

app.use('/api/institutions', requireAdminForMutations, institutionsStoreRoutes)
app.use('/api/communities', requireAdminForMutations, communitiesStoreRoutes)
app.use('/api/enseignants', requireAdmin, enseignantsStoreRoutes)
app.use('/api/filePhysio', filePhysioRoutes)
app.use('/api/hashtags', requireAdminForMutations, hashtagStoreRoutes)
app.use('/api/posts', postsStoreRoutes)
//app.use('/api/praticiens-formateurs', praticiensFormateursStoreRoutes);
app.use('/api/praticiens', requireAdmin, praticiensStoreRoutes)
app.use('/api/resultat-votation', resultatVotationRoutes)
app.use('/api/feedbacka', feedbackaRoutes)
app.use('/api/push', requireAdmin, pushRoutes)
app.use('/api/ftp', requireAdmin, ftpRoutes)
app.use('/api/admin/users', requireAdmin, adminUsersRoutes)
app.use(
  '/api/audiences',
  requireAnyPermission(
    'students.read',
    'EnseignantSoins',
    'RMSoins',
    'EnseignantPhysio',
    'RMPhysio',
    'RepondantHES'
  ),
  audienceDirectoryRoutes
)
app.use(
  '/api/admin-dashboard',
  requireAnyPermission(
    'students.read',
    'EnseignantSoins',
    'RMSoins',
    'EnseignantPhysio',
    'RMPhysio',
    'RepondantHES'
  ),
  createAdminDashboardStatsRouter({ client: supabaseAdmin })
)
app.use(
  '/api/pfp-outcomes',
  requireAnyPermission('page1.access', 'AdminPhysio', 'SECRETARIAT'),
  createPfpOutcomeRouter({ client: supabaseAdmin })
)
app.use('/api/integrations/vimeo', requireAnyPermission('editor'), vimeoRoutes)
app.use('/api/integrations/github', requireAnyPermission('editor'), githubRoutes)
// General /api route DISABLED for debugging
// app.use('/api', userStoreRoutes);

// (OpenAI not required for CareConvers stateful routes)

// Test route for praticiens_formateurs
app.get('/api/chapters', async (req, res) => {
  const { data, error } = await supabase.from('chapters').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Mount CareConvers stateful /api/chat routes
registerCareConversStoreRoutes(app)

app.use((error, req, res, _next) => {
  void _next
  logStructured(
    'error',
    upstreamErrorContext(error, {
      requestId: req.id,
      service: 'api',
      operation: 'request-handler',
      method: req.method,
      route: normalizedRoute(req)
    })
  )
  if (
    error.name === 'MulterError' ||
    /Type de fichier non autorisé|Type d’image non autorisé/.test(error.message)
  ) {
    return res.status(400).json({ error: error.message })
  }
  return res.status(500).json({ error: 'Internal Server Error' })
})

// Lancement du serveur sur toutes les interfaces réseau
const PORT = process.env.PORT || 3000
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = app
