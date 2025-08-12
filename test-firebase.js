// Script de test Firebase pour identifier le problème
console.log('🔍 Test de configuration Firebase...\n')

// 1. Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement:')
const envVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_URL'
]

envVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`)
  } else {
    console.log(`❌ ${varName}: MANQUANT`)
  }
})

// 2. Test d'import Firebase
console.log('\n🔥 Test d\'import Firebase:')
try {
  const { initializeApp } = require('firebase/app')
  console.log('✅ firebase/app importé avec succès')
  
  const { getAuth } = require('firebase/auth')
  console.log('✅ firebase/auth importé avec succès')
  
  const { getDatabase } = require('firebase/database')
  console.log('✅ firebase/database importé avec succès')
  
} catch (error) {
  console.error('❌ Erreur d\'import Firebase:', error.message)
}

// 3. Test de configuration
console.log('\n⚙️ Test de configuration:')
const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
}

const missingKeys = Object.keys(config).filter(key => !config[key])
if (missingKeys.length === 0) {
  console.log('✅ Toutes les clés de configuration sont présentes')
} else {
  console.log('❌ Clés manquantes:', missingKeys)
}

console.log('\n📝 Configuration complète:')
console.log(JSON.stringify(config, null, 2))
