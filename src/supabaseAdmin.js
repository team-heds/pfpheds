import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé Service Role pour les opérations admin
 * (création d'utilisateurs sans affecter la session courante)
 * 
 * Nécessite VITE_SUPABASE_SERVICE_ROLE_KEY dans le .env
 * ⚠️ Ne jamais exposer cette clé en production publique — usage admin uniquement
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '')
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin = null

if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
} else {
  if (import.meta.env.DEV) {
    console.warn('[supabaseAdmin] ⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY manquante — la création admin d\'utilisateurs ne fonctionnera pas.')
  }
}

export { supabaseAdmin }
