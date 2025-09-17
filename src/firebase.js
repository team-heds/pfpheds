import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { get, ref } from "firebase/database";

// DEBUG: Vérifier les variables d'environnement
console.log('🔍 DEBUG Firebase - Variables d\'environnement:')
console.log('MODE:', import.meta.env.MODE)
console.log('API_KEY présent:', !!import.meta.env.VITE_FIREBASE_API_KEY)
console.log('AUTH_DOMAIN présent:', !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
console.log('PROJECT_ID présent:', !!import.meta.env.VITE_FIREBASE_PROJECT_ID)
console.log('STORAGE_BUCKET présent:', !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
console.log('MESSAGING_SENDER_ID présent:', !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
console.log('APP_ID présent:', !!import.meta.env.VITE_FIREBASE_APP_ID)
console.log('DATABASE_URL présent:', !!import.meta.env.VITE_FIREBASE_DATABASE_URL)

// Your web app's Firebase configuration
// src/firebase.js (ou à la racine si c'est là que tu l'utilises)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// DEBUG: Vérifier la configuration finale
console.log('🔧 DEBUG Firebase - Configuration:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MANQUANT',
  authDomain: firebaseConfig.authDomain || 'MANQUANT',
  projectId: firebaseConfig.projectId || 'MANQUANT',
  storageBucket: firebaseConfig.storageBucket || 'MANQUANT',
  messagingSenderId: firebaseConfig.messagingSenderId || 'MANQUANT',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 15)}...` : 'MANQUANT',
  databaseURL: firebaseConfig.databaseURL || 'MANQUANT'
})

// Vérifier que toutes les variables sont présentes avant d'initialiser
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'databaseURL']
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key])

if (missingKeys.length > 0) {
  console.error('❌ ERREUR Firebase - Variables manquantes:', missingKeys)
  console.error('💡 SOLUTION: Vérifiez votre fichier .env et redémarrez l\'application')
  throw new Error(`Variables Firebase manquantes: ${missingKeys.join(', ')}`)
}

console.log('✅ Toutes les variables Firebase sont présentes, initialisation...')

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase App initialisée')

// Get a reference to the database service
const db = getDatabase(app);
console.log('✅ Firebase Database initialisée')

// Get a reference to the auth service
const auth = getAuth(app);
console.log('✅ Firebase Auth initialisée')

// Get a reference to the storage service
const storage = getStorage(app);
console.log('✅ Firebase Storage initialisée')

console.log('🎉 Firebase complètement initialisé!')

async function getUserNameById(userId) {
  const userRef = ref(db, `Users/${userId}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    const prenom = data.Prenom || "";
    const nom = data.Nom || "";
    return `${prenom} ${nom}`.trim();
  } else {
    return "";
  }
}


export { db, auth, storage,getUserNameById };
 