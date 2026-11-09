

    import { createClient } from '@supabase/supabase-js'
    import { getPasswordRecoveryCallbackTarget } from '@/service/passwordRecoveryService'

    // ✅ Lis les variables d’environnement de Vite
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

    // Le tunnel Portly publie toute la stack de test (SPA + API Supabase) sur
    // la même origine. Utiliser cette origine évite les blocages CSP/CORS et
    // permet de se connecter depuis un réseau qui ne peut pas joindre
    // directement test.hedsvs.ch. Le domaine de test et la production gardent
    // leur URL configurée par Vite.
    const isStagingTunnel = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
      && window.location.port === '8180'
    if (isStagingTunnel) {
    supabaseUrl = window.location.origin
    }
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

    // Un modèle d'email ou une ancienne configuration peut renvoyer le callback
    // vers /home. Corriger l'URL avant de créer le client empêche Supabase de
    // transformer silencieusement la récupération en connexion ordinaire.
    const passwordRecoveryTarget = getPasswordRecoveryCallbackTarget(window.location)
    if (passwordRecoveryTarget) {
    window.history.replaceState(window.history.state, '', passwordRecoveryTarget)
    }

    const passwordRecoveryRoutes = new Set(['/reset-password', '/new-password'])
    const isPasswordRecoveryRoute = passwordRecoveryRoutes.has(window.location.pathname)

    // ✅ Crée le client avec options recommandées (Realtime désactivé)
    export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,       // garde la session même après refresh
        autoRefreshToken: true,     // refresh automatique des tokens
        // Le callback de récupération est échangé explicitement par ResetPassword.
        // Cela évite qu'une session ordinaire soit confondue avec une preuve de récupération.
        detectSessionInUrl: !isPasswordRecoveryRoute,
        storage: window.localStorage, // Force l'utilisation de localStorage (par défaut mais explicite)
        storageKey: 'supabase.auth.token', // Clé de stockage personnalisée
        flowType: 'pkce',           // Plus sécurisé pour les SPAs
    },
    })
