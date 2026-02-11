// Test des variables d'environnement Vite
export function testViteEnv() {
  console.log('🔍 Test des variables d\'environnement Vite...\n')
  
  // Mode et environnement
  console.log('🌍 Environnement:')
  console.log('MODE:', import.meta.env.MODE)
  console.log('DEV:', import.meta.env.DEV)
  console.log('PROD:', import.meta.env.PROD)
  console.log('BASE_URL:', import.meta.env.BASE_URL)
  
  // Variables Firebase
  console.log('\n🔥 Variables Firebase:')
  const firebaseVars = {
    'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
    'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
    'VITE_FIREBASE_DATABASE_URL': import.meta.env.VITE_FIREBASE_DATABASE_URL
  }
  
  let missingCount = 0
  Object.entries(firebaseVars).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: ${value.substring(0, 15)}...`)
    } else {
      console.log(`❌ ${key}: MANQUANT`)
      missingCount++
    }
  })
  
  // Variable Vimeo
  console.log('\n📹 Variable Vimeo:')
  const vimeoToken = import.meta.env.VITE_VIMEO_ACCESS_TOKEN
  if (vimeoToken) {
    console.log(`✅ VITE_VIMEO_ACCESS_TOKEN: ${vimeoToken.substring(0, 15)}...`)
  } else {
    console.log('❌ VITE_VIMEO_ACCESS_TOKEN: MANQUANT')
  }
  
  // Résumé
  console.log('\n📊 Résumé:')
  console.log(`Variables Firebase: ${7 - missingCount}/7`)
  console.log(`Variable Vimeo: ${vimeoToken ? 'Présente' : 'Manquante'}`)
  
  if (missingCount > 0) {
    console.warn('\n⚠️ PROBLÈMES DÉTECTÉS:')
    console.warn('1. Vérifiez que le fichier .env existe à la racine du projet')
    console.warn('2. Vérifiez que le nom du fichier correspond à votre environnement:')
    console.warn('   - .env (développement)')
    console.warn('   - .env.local (local override)')
    console.warn('   - .env.production (production)')
    console.warn('3. Redémarrez le serveur après modification du .env')
    console.warn('4. Vérifiez qu\'il n\'y a pas d\'espaces autour des = dans le .env')
  }
  
  return {
    firebaseVars,
    vimeoToken,
    missingCount,
    isValid: missingCount === 0
  }
}

// Test automatique au chargement du module (DEV only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Attendre que la page soit chargée
  window.addEventListener('load', () => {
    setTimeout(() => {
      testViteEnv()
    }, 1000)
  })
}
