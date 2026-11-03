// URL PostgREST de l'environnement courant.
// Ne jamais retomber sur une URL de production codée en dur : un front TEST ou local
// appellerait alors la base de prod.
export function resolveSupabaseRestUrl(env = import.meta.env) {
  const explicit = String(env.VITE_SUPABASE_REST_URL || '').trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const base = String(env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
  return base ? `${base}/rest/v1` : ''
}

export const SUPABASE_REST_URL = resolveSupabaseRestUrl()
