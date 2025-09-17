

import { createClient } from '@supabase/supabase-js'

// ✅ Lis les variables d’environnement de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] ❌ Variables d’environnement manquantes.')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey)
}

// ✅ Crée le client avec options recommandées
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // garde la session même après refresh
    autoRefreshToken: true,     // refresh automatique des tokens
    detectSessionInUrl: true,   // utile pour login OAuth et reset password
  },
})
