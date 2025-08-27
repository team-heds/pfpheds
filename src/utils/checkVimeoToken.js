// Utilitaire pour vérifier la configuration du token Vimeo
export function checkVimeoTokenConfiguration() {
  const envToken = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('VIMEO_TOKEN_OVERRIDE') : null
  
  const result = {
    hasEnvToken: !!envToken,
    hasLocalToken: !!localToken,
    activeToken: localToken || envToken,
    tokenPreview: null,
    source: null
  }
  
  if (result.activeToken) {
    result.tokenPreview = result.activeToken.substring(0, 8) + '...'
    result.source = localToken ? 'localStorage' : 'environment'
  }
  
  return result
}

// Fonction pour définir un token de test
export function setTestVimeoToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('VIMEO_TOKEN_OVERRIDE', token)
    console.log('✅ Token Vimeo de test défini dans localStorage')
  }
}

// Fonction pour supprimer le token de test
export function clearTestVimeoToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('VIMEO_TOKEN_OVERRIDE')
    console.log('✅ Token Vimeo de test supprimé')
  }
}

// Fonction pour diagnostiquer les problèmes de token
export function diagnoseVimeoToken() {
  const config = checkVimeoTokenConfiguration()
  
  console.group('🔍 Diagnostic Token Vimeo')
  console.log('Environment token:', config.hasEnvToken ? '✅ Présent' : '❌ Manquant')
  console.log('LocalStorage token:', config.hasLocalToken ? '✅ Présent' : '❌ Manquant')
  console.log('Token actif:', config.activeToken ? `✅ ${config.tokenPreview} (${config.source})` : '❌ Aucun')
  
  if (!config.activeToken) {
    console.warn('⚠️ SOLUTION: Créez un fichier .env.production avec VITE_VIMEO_ACCESS_TOKEN=votre_token')
    console.warn('⚠️ OU utilisez setTestVimeoToken("votre_token") pour un test rapide')
  }
  
  console.groupEnd()
  
  return config
}
