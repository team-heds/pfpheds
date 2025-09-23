require('dotenv').config()
const express = require('express')
const cors = require('cors')

const userStoreRoutes = require('./supabase/userStoreBackend')                // si existant
const institutionsStoreRoutes = require('./supabase/institutionsStoreBackend')
const enseignantsStoreRoutes = require('./supabase/enseignantsStoreBackend') // si existant
const hashtagStoreRoutes = require('./supabase/hashtagStoreBackend')         // si existant
const communitiesStoreRoutes = require('./supabase/communitiesStoreBackend') // si existant
const filePhysioRoutes = require('./supabase/filePhysioBackendStore')        // si existant
const postsStoreRoutes = require('./supabase/postsBackendStore')             // si existant
const praticiensFormateursStoreRoutes = require('./supabase/praticiensFormateursBackendStore') // si existant

const app = express()

// --- Middlewares globaux AVANT les routes ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.options(/.*/, cors())
app.use(express.json({ limit: '1mb' }))

// --- Health ---
app.get('/api/ping', (_req, res) => res.send('pingpong'))

// --- Routes ---
app.use('/api/institutions', institutionsStoreRoutes)
if (communitiesStoreRoutes) app.use('/api/communities', communitiesStoreRoutes)
if (enseignantsStoreRoutes) app.use('/api/enseignants', enseignantsStoreRoutes)
if (filePhysioRoutes) app.use('/api/filePhysio', filePhysioRoutes)
if (hashtagStoreRoutes) app.use('/api/hashtags', hashtagStoreRoutes)
if (postsStoreRoutes) app.use('/api/posts', postsStoreRoutes)
 app.use('/api/praticiens_formateurs', praticiensFormateursStoreRoutes)
if (userStoreRoutes) app.use('/api', userStoreRoutes)

// --- 404 générique ---
app.use((req, res) => {
  console.log('404 for:', req.method, req.url)
  res.status(404).json({ error: 'Not Found' })
})

// --- Start ---
const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
  