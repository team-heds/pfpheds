/**
 * Script de nettoyage Firebase - Planning obsolète
 * 
 * ATTENTION: Ce script SUPPRIME des données dans Firebase !
 * Assurez-vous d'avoir sauvegardé vos données importantes avant de l'exécuter.
 * 
 * Ce script supprime :
 * - /planning/years/*/semesters (données minibrick obsolètes)
 * - /weeklyPlanning (données weekly planning obsolètes)
 * 
 * Usage:
 *   node scripts/cleanFirebasePlanning.js
 */

import { initializeApp } from 'firebase/app'
import { getDatabase, ref, remove, get } from 'firebase/database'
import readline from 'readline'

// Configuration Firebase (à adapter avec vos valeurs)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "votre-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "votre-auth-domain",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "votre-database-url",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "votre-project-id",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "votre-storage-bucket",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "votre-sender-id",
  appId: process.env.VITE_FIREBASE_APP_ID || "votre-app-id"
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

// Interface readline pour confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function cleanFirebasePlanning() {
  console.log('🧹 Script de nettoyage Firebase Planning\n')
  console.log('⚠️  ATTENTION: Ce script va SUPPRIMER des données !')
  console.log('\nCe qui sera supprimé:')
  console.log('  1. /planning/years/*/semesters/* (minibrick)')
  console.log('  2. /weeklyPlanning/* (weekly planning)\n')

  // Vérifier d'abord ce qui existe
  console.log('📋 Vérification des données existantes...\n')
  
  const planningRef = ref(db, 'planning')
  const weeklyRef = ref(db, 'weeklyPlanning')
  
  let hasPlanning = false
  let hasWeekly = false
  
  try {
    const planningSnapshot = await get(planningRef)
    if (planningSnapshot.exists()) {
      hasPlanning = true
      const planningData = planningSnapshot.val()
      console.log('✓ Trouvé /planning avec années:', Object.keys(planningData.years || {}).join(', '))
    } else {
      console.log('○ /planning n\'existe pas')
    }
  } catch (error) {
    console.log('○ /planning n\'existe pas ou erreur:', error.message)
  }
  
  try {
    const weeklySnapshot = await get(weeklyRef)
    if (weeklySnapshot.exists()) {
      hasWeekly = true
      const weeklyData = weeklySnapshot.val()
      console.log('✓ Trouvé /weeklyPlanning avec classes:', Object.keys(weeklyData).join(', '))
    } else {
      console.log('○ /weeklyPlanning n\'existe pas')
    }
  } catch (error) {
    console.log('○ /weeklyPlanning n\'existe pas ou erreur:', error.message)
  }
  
  console.log('')
  
  if (!hasPlanning && !hasWeekly) {
    console.log('✨ Aucune donnée obsolète trouvée. Rien à nettoyer !')
    rl.close()
    return
  }
  
  // Demander confirmation
  const answer = await question('Voulez-vous vraiment supprimer ces données ? (oui/non): ')
  
  if (answer.toLowerCase() !== 'oui') {
    console.log('\n❌ Annulé par l\'utilisateur')
    rl.close()
    return
  }
  
  console.log('\n🗑️  Suppression en cours...\n')
  
  // Supprimer /planning/years/*/semesters
  if (hasPlanning) {
    try {
      const planningSnapshot = await get(planningRef)
      const planningData = planningSnapshot.val()
      
      if (planningData && planningData.years) {
        for (const yearId of Object.keys(planningData.years)) {
          const semestersRef = ref(db, `planning/years/${yearId}/semesters`)
          await remove(semestersRef)
          console.log(`  ✓ Supprimé /planning/years/${yearId}/semesters`)
        }
      }
    } catch (error) {
      console.error('  ✗ Erreur suppression /planning:', error.message)
    }
  }
  
  // Supprimer /weeklyPlanning
  if (hasWeekly) {
    try {
      await remove(weeklyRef)
      console.log('  ✓ Supprimé /weeklyPlanning')
    } catch (error) {
      console.error('  ✗ Erreur suppression /weeklyPlanning:', error.message)
    }
  }
  
  console.log('\n✅ Nettoyage terminé !')
  console.log('\n💡 Note: Les données sont maintenant dans Supabase (table planning_time_slots)')
  
  rl.close()
}

// Exécuter
cleanFirebasePlanning().catch((error) => {
  console.error('❌ Erreur:', error)
  rl.close()
  process.exit(1)
})
