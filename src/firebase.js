import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { get, ref } from "firebase/database";

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

// Vérifier que toutes les variables sont présentes avant d'initialiser
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'databaseURL']
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key])
const isFirebaseEnabled = missingKeys.length === 0

if (!isFirebaseEnabled) {
  console.error('❌ ERREUR Firebase - Variables manquantes:', missingKeys)
  console.warn('⚠️ Firebase désactivé: mode Supabase-only actif.')
}

// Initialize Firebase
const app = isFirebaseEnabled ? initializeApp(firebaseConfig) : null;
// Get a reference to the database service
const db = app ? getDatabase(app) : null;
// Get a reference to the auth service
const auth = app ? getAuth(app) : null;
// Get a reference to the storage service
const storage = app ? getStorage(app) : null;
async function getUserNameById(userId) {
  if (!db) return "";
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


export { db, auth, storage, isFirebaseEnabled, getUserNameById };
 