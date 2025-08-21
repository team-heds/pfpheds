// Diagnostic Firebase pour identifier les problèmes de configuration
export function diagnoseFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
  }

  console.group('🔍 Diagnostic Configuration Firebase')
  
  // Vérifier chaque variable d'environnement
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_DATABASE_URL'
  ]

  let missingVars = []
  let presentVars = []

  requiredVars.forEach(varName => {
    const value = import.meta.env[varName]
    if (value) {
      presentVars.push(varName)
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`)
    } else {
      missingVars.push(varName)
      console.error(`❌ ${varName}: MANQUANT`)
    }
  })

  console.log(`\n📊 Résumé:`)
  console.log(`✅ Variables présentes: ${presentVars.length}/${requiredVars.length}`)
  console.log(`❌ Variables manquantes: ${missingVars.length}`)

  if (missingVars.length > 0) {
    console.warn('\n⚠️ PROBLÈME DÉTECTÉ:')
    console.warn('Variables manquantes:', missingVars)
    console.warn('\n💡 SOLUTION:')
    console.warn('1. Vérifiez que le fichier .env existe à la racine du projet')
    console.warn('2. Vérifiez que toutes les variables VITE_FIREBASE_* sont définies')
    console.warn('3. Redémarrez le serveur de développement après modification')
  }

  console.groupEnd()

  return {
    config,
    missingVars,
    presentVars,
    isValid: missingVars.length === 0
  }
}

// Test de connexion Firebase
export async function testFirebaseConnection() {
  try {
    console.group('🔥 Test Connexion Firebase')
    
    // Import dynamique pour éviter les erreurs
    const { initializeApp } = await import('firebase/app')
    const { getAuth, connectAuthEmulator } = await import('firebase/auth')
    const { getDatabase, connectDatabaseEmulator } = await import('firebase/database')
    
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
    }

    console.log('🚀 Initialisation Firebase...')
    const app = initializeApp(config, 'test-app')
    console.log('✅ App Firebase initialisée')

    console.log('🔐 Initialisation Auth...')
    const auth = getAuth(app)
    console.log('✅ Firebase Auth initialisé')

    console.log('🗄️ Initialisation Database...')
    const db = getDatabase(app)
    console.log('✅ Firebase Database initialisé')

    console.log('🎉 Tous les services Firebase sont opérationnels!')
    
    console.groupEnd()
    return { success: true, app, auth, db }
    
  } catch (error) {
    console.error('❌ Erreur lors du test Firebase:', error)
    console.groupEnd()
    return { success: false, error }
  }
}

// Fonction pour afficher les informations d'environnement
export function showEnvironmentInfo() {
  console.group('🌍 Informations Environnement')
  console.log('Mode:', import.meta.env.MODE)
  console.log('Base URL:', import.meta.env.BASE_URL)
  console.log('Prod:', import.meta.env.PROD)
  console.log('Dev:', import.meta.env.DEV)
  console.groupEnd()
}
