const { createClient } = require('@supabase/supabase-js');
const path = require('path');
 
// Essayer de charger le .env depuis le dossier upload ou utiliser les variables directement
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

function isPlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v.includes('your-test-project') || v.includes('your_test_supabase');
}

const envSupabaseUrl = process.env.SUPABASE_URL;
const viteSupabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = !isPlaceholder(envSupabaseUrl)
  ? envSupabaseUrl
  : (!isPlaceholder(viteSupabaseUrl) ? viteSupabaseUrl : envSupabaseUrl || viteSupabaseUrl);

const envSupabaseKey = process.env.SUPABASE_KEY;
const viteSupabaseKey = process.env.VITE_SUPABASE_KEY;
const supabaseKey = !isPlaceholder(envSupabaseKey)
  ? envSupabaseKey
  : (!isPlaceholder(viteSupabaseKey) ? viteSupabaseKey : envSupabaseKey || viteSupabaseKey);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Clé de service pour bypass RLS
const baseClientKey = supabaseKey || supabaseServiceKey;

if (!supabaseUrl || !baseClientKey) {
  console.error('❌ [SUPABASE] Variables manquantes.');
  console.error('   Attendu dans backend/.env :');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_KEY (ou SUPABASE_SERVICE_ROLE_KEY)');
  console.error('   Copiez backend/.env.example vers backend/.env puis renseignez les valeurs.');
  process.exit(1);
}
 
// Client normal (avec RLS)
const supabase = createClient(supabaseUrl, baseClientKey);
 
// Client admin (bypass RLS) - utilise service key si disponible
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback vers client normal si pas de service key
 
console.log('🔧 [SUPABASE] Configuration:');
console.log('  - URL:', supabaseUrl);
console.log('  - Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');
console.log('  - Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT SET');
console.log('🔧 [SUPABASE] Using service key for admin operations:', !!supabaseServiceKey);
 
// Vérification détaillée des clés
if (supabaseServiceKey) {
  console.log('🔑 [DEBUG] Service key length:', supabaseServiceKey.length);
  console.log('🔑 [DEBUG] Service key starts with:', supabaseServiceKey.substring(0, 10));
  
  // Décoder le JWT pour vérifier le rôle
  const jwtParts = supabaseServiceKey.split('.');
  if (jwtParts.length >= 2 && jwtParts[1]) {
    try {
      const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
      console.log('🔑 [DEBUG] JWT payload role:', payload.role);
      console.log('🔑 [DEBUG] JWT payload iss:', payload.iss);
      console.log('🔑 [DEBUG] Is service_role?', payload.role === 'service_role');
    } catch (e) {
      console.warn('⚠️ [WARN] Service key not decodable as JWT (likely placeholder in local .env).');
    }
  } else {
    console.warn('⚠️ [WARN] Service key format does not look like JWT (likely placeholder in local .env).');
  }
} else {
  console.error('❌ [ERROR] Service key is missing! RLS bypass will not work.');
}
 
module.exports = supabase;
module.exports.supabaseAdmin = supabaseAdmin;
 
 