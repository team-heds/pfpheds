require('dotenv').config()
const express = require('express')
const cors = require('cors')
const supabase = require('./supabaseClient');
 
// CareConvers stateful chat routes
const registerCareConversStoreRoutes = require('./supabase/careconversStoreBackend');
const app = express()

//const userStoreRoutes = require('./supabase/userStoreBackend')
const institutionsStoreRoutes = require('./supabase/institutionsStoreBackend')
const enseignantsStoreRoutes = require('./supabase/enseignantsStoreBackend.js');
const hashtagStoreRoutes = require('./supabase/hashtagStoreBackend.js');
const communitiesStoreRoutes = require('./supabase/communitiesStoreBackend');
const filePhysioRoutes = require('./supabase/filePhysioBackendStore');
const postsStoreRoutes = require('./supabase/postsBackendStore.js');
//const praticiensFormateursStoreRoutes = require('./supabase/praticiensFormateursBackendStore.js');
const praticiensStoreRoutes = require('./supabase/praticiensStoreBackend.js');
const ftpRoutes = require('./uploads/ftpRoutes');

// push
const pushRoutes = require('./supabase/pushBackend');


// CORS and JSON parsing MUST be before routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://hedsvs.ch', 'https://www.hedsvs.ch', 'https://api2.hedsvs.ch']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
// Express 5 uses path-to-regexp v6 which doesn't support '*' patterns.
// Use a regex to match all paths for CORS preflight handling.
app.options(/.*/, cors())
app.use(express.json())
 
// Debug middleware (seulement en développement)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
  });
}
 
// Routes - specific routes FIRST, then general ones
console.log('[ROUTES] Mounting routes...');
console.log('[ROUTES] praticiensFormateursStoreRoutes type:', typeof praticiensFormateursStoreRoutes);
 
app.use('/api/institutions', institutionsStoreRoutes);
app.use('/api/communities', communitiesStoreRoutes);
app.use('/api/enseignants', enseignantsStoreRoutes);
app.use('/api/filePhysio', filePhysioRoutes);
app.use('/api/hashtags', hashtagStoreRoutes);
app.use('/api/posts', postsStoreRoutes);
//app.use('/api/praticiens-formateurs', praticiensFormateursStoreRoutes);
app.use('/api/praticiens', praticiensStoreRoutes);
// Direct diagnostic route (dup with uploads/ftpRoutes /diagnostic) to ensure availability
app.get('/api/ftp/diagnostic', (req, res) => {
  const configured = !!(process.env.FTP_HOST && process.env.FTP_USER && process.env.FTP_PASSWORD)
  res.json({ ok: true, configured, host: process.env.FTP_HOST || null, baseDir: process.env.FTP_BASE_DIR || null })
})
app.use('/api/ftp', ftpRoutes);
// General /api route DISABLED for debugging
// app.use('/api', userStoreRoutes);
 
// (OpenAI not required for CareConvers stateful routes)
 
 
app.get('/api/ping', (req, res) => {
  res.send('pingpong')
})

// Health check endpoint pour Docker/Kubernetes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
})
 
// Test route for praticiens_formateurs
app.get('/api/praticiens_formateurs-test', (req, res) => {
  res.json({ message: 'Test route works!' })
})
 
app.get('/api/pong', (req, res) => {
  res.send('aller')
})
 
app.get('/api/pongg', (req, res) => {
  res.send('aller 2x')
})
 
 
// Exemple de route test Supabase
 
app.get('/api/chapters', async (req, res) => {
  const { data, error } = await supabase.from('chapters').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
 
// Mount CareConvers stateful /api/chat routes
registerCareConversStoreRoutes(app);
 
// Lancement du serveur sur toutes les interfaces réseau
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});