

    import { createClient } from '@supabase/supabase-js'

    // ✅ Lis les variables d’environnement de Vite
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY
    if (supabaseUrl && /\/rest\/v1\/?$/i.test(supabaseUrl)) {
    console.warn('[Supabase] VITE_SUPABASE_URL ne doit pas contenir /rest/v1. Normalisation appliquée.')
    supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/i, '')
    }
    if (supabaseUrl && /\/$/.test(supabaseUrl)) {
    supabaseUrl = supabaseUrl.replace(/\/+$/, '')
    }

    if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] ❌ Variables d’environnement manquantes.')
    console.error('VITE_SUPABASE_URL:', supabaseUrl)
    console.error('VITE_SUPABASE_KEY:', supabaseAnonKey)
    }

    // ✅ Crée le client avec options recommandées (Realtime désactivé)
    export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,       // garde la session même après refresh
        autoRefreshToken: true,     // refresh automatique des tokens
        detectSessionInUrl: true,   // utile pour login OAuth et reset password
    },
    })
