const isEnabledByDefault = value => String(value ?? 'true').toLowerCase() === 'true'

export const runtimeFeatures = Object.freeze({
  supabaseRealtime: isEnabledByDefault(import.meta.env.VITE_SUPABASE_REALTIME),
})
