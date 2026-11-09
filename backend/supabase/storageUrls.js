function getPublicStorageBaseUrl(environment = process.env) {
  const value = environment.SUPABASE_PUBLIC_URL || environment.SUPABASE_URL || environment.VITE_SUPABASE_URL
  const parsed = new URL(value)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Adresse publique du stockage non valide.')
  }
  return parsed.origin
}

// Self-hosted deployments may call Supabase through an internal gateway.
// Only replace that SDK-generated origin, never expose it in browser URLs or
// derive it from a request Host / X-Forwarded-Host header.
function toPublicStorageUrl(rawUrl, publicBaseUrl = getPublicStorageBaseUrl()) {
  const parsed = new URL(rawUrl)
  if (!parsed.pathname.startsWith('/storage/v1/')) throw new Error('URL de stockage non valide.')
  const base = new URL(publicBaseUrl)
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('Adresse publique du stockage non valide.')
  }
  return `${base.origin}${parsed.pathname}${parsed.search}`
}

module.exports = { getPublicStorageBaseUrl, toPublicStorageUrl }
