const ASSET_PATH = /^\/assets\/.+\.(?:js|css|woff2)$/i

export const isBuildAsset = (url, origin) => url.origin === origin && ASSET_PATH.test(url.pathname)

// Un fichier absent peut recevoir la page HTML de l'application avec un statut 200 :
// la garder en cache casserait durablement cet écran.
export function cacheableAssetResponse(response) {
  const contentType = response?.headers?.get('content-type') || ''
  return response?.status === 200 && !contentType.includes('text/html') ? response : null
}
