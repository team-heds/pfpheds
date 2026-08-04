require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const supabase = require('./supabaseClient')
const {
  authenticate,
  requireAdmin,
  requireAdminForMutations,
  requireAnyPermission
} = require('./middleware/auth')

// CareConvers stateful chat routes
const registerCareConversStoreRoutes = require('./supabase/careconversStoreBackend')
const app = express()

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

// push
const pushRoutes = require('./supabase/pushBackend')

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://hedsvs.ch', 'https://www.hedsvs.ch', 'https://api2.hedsvs.ch']
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5180',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5180'
      ]

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

// CORS and JSON parsing MUST be before routes
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

// Debug middleware (seulement en développement)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`)
    next()
  })
}

// Keep only operational health probes public. Every business API route below requires a valid JWT.
app.get('/api/ping', (_req, res) => res.send('pingpong'))
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
app.use('/api/integrations/vimeo', requireAnyPermission('editor'), vimeoRoutes)
app.use('/api/integrations/github', requireAnyPermission('editor'), githubRoutes)
// General /api route DISABLED for debugging
// app.use('/api', userStoreRoutes);

// (OpenAI not required for CareConvers stateful routes)

// Health check endpoint pour Docker/Kubernetes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Test route for praticiens_formateurs
app.get('/api/chapters', async (req, res) => {
  const { data, error } = await supabase.from('chapters').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Mount CareConvers stateful /api/chat routes
registerCareConversStoreRoutes(app)

app.use((error, _req, res, _next) => {
  void _next
  console.error('[API] Request failed:', error.message)
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
