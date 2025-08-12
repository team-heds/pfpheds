// Initialisation Firebase sécurisée avec gestion d'erreurs
let firebaseApp = null
let firebaseAuth = null
let firebaseDb = null
let firebaseStorage = null
let initializationError = null

// Fonction pour initialiser Firebase de manière sécurisée
export async function initializeFirebaseSafely() {
  // Si déjà initialisé avec succès, retourner les instances
  if (firebaseApp && firebaseAuth && firebaseDb && firebaseStorage) {
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firebaseDb,
      storage: firebaseStorage,
      success: true
    }
  }

  // Si une erreur d'initialisation précédente, la retourner
  if (initializationError) {
    return {
      success: false,
      error: initializationError
    }
  }

  try {
    console.log('🔄 Initialisation Firebase sécurisée...')

    // Vérifier les variables d'environnement
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
    }

    // Vérifier que toutes les variables sont présentes
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'databaseURL']
    const missingKeys = requiredKeys.filter(key => !config[key])

    if (missingKeys.length > 0) {
      const error = new Error(`Variables Firebase manquantes: ${missingKeys.join(', ')}`)
      initializationError = error
      console.error('❌ Variables Firebase manquantes:', missingKeys)
      return {
        success: false,
        error,
        missingKeys
      }
    }

    // Import dynamique des modules Firebase
    const { initializeApp } = await import('firebase/app')
    const { getAuth } = await import('firebase/auth')
    const { getDatabase } = await import('firebase/database')
    const { getStorage } = await import('firebase/storage')

    // Initialiser Firebase
    firebaseApp = initializeApp(config, `app-${Date.now()}`)
    console.log('✅ Firebase App initialisée')

    firebaseAuth = getAuth(firebaseApp)
    console.log('✅ Firebase Auth initialisée')

    firebaseDb = getDatabase(firebaseApp)
    console.log('✅ Firebase Database initialisée')

    firebaseStorage = getStorage(firebaseApp)
    console.log('✅ Firebase Storage initialisée')

    console.log('🎉 Firebase complètement initialisé avec succès!')

    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firebaseDb,
      storage: firebaseStorage,
      success: true
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation Firebase:', error)
    initializationError = error
    return {
      success: false,
      error
    }
  }
}

// Fonction pour obtenir les instances Firebase (avec initialisation automatique)
export async function getFirebaseInstances() {
  return await initializeFirebaseSafely()
}

// Fonction pour vérifier si Firebase est disponible
export function isFirebaseAvailable() {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_DATABASE_URL'
  ]

  return requiredVars.every(varName => !!import.meta.env[varName])
}

// Fonction pour obtenir les détails de configuration
export function getFirebaseConfigStatus() {
  const vars = {
    'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
    'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
    'VITE_FIREBASE_DATABASE_URL': import.meta.env.VITE_FIREBASE_DATABASE_URL
  }

  const present = Object.entries(vars).filter(([key, value]) => !!value)
  const missing = Object.entries(vars).filter(([key, value]) => !value)

  return {
    total: Object.keys(vars).length,
    present: present.length,
    missing: missing.length,
    missingVars: missing.map(([key]) => key),
    presentVars: present.map(([key]) => key),
    isComplete: missing.length === 0
  }
}

// Reset de l'initialisation (pour les tests)
export function resetFirebaseInitialization() {
  firebaseApp = null
  firebaseAuth = null
  firebaseDb = null
  firebaseStorage = null
  initializationError = null
  console.log('🔄 Firebase initialization reset')
}
