/**
 * Script pour exporter les Places depuis Firebase Realtime Database
 * Usage: node backend/supabase/exportPlacesFromFirebase.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const fs = require('fs');
const path = require('path');

// Configuration Firebase depuis les variables d'environnement
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

// Vérifier les variables
const requiredKeys = ['apiKey', 'databaseURL'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error('❌ Variables Firebase manquantes dans .env:');
  missingKeys.forEach(key => console.error(`   - VITE_FIREBASE_${key.toUpperCase()}`));
  process.exit(1);
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function exportPlaces() {
  console.log('🔄 Connexion à Firebase Realtime Database...\n');

  try {
    // Lire les Places
    console.log('📥 Récupération des Places...');
    const placesRef = ref(db, 'Places');
    const placesSnapshot = await get(placesRef);

    if (!placesSnapshot.exists()) {
      console.error('❌ Aucune place trouvée dans Firebase!');
      console.error('   Vérifie que le nœud "/Places" existe dans ta base.');
      process.exit(1);
    }

    const placesData = placesSnapshot.val();
    const placesCount = Object.keys(placesData).length;
    console.log(`✅ ${placesCount} places récupérées\n`);

    // Lire les Institutions (pour la jointure)
    console.log('📥 Récupération des Institutions...');
    const institutionsRef = ref(db, 'Institutions');
    const institutionsSnapshot = await get(institutionsRef);

    let institutionsData = {};
    if (institutionsSnapshot.exists()) {
      institutionsData = institutionsSnapshot.val();
      console.log(`✅ ${Object.keys(institutionsData).length} institutions récupérées\n`);
    } else {
      console.log('⚠️  Aucune institution trouvée (pas grave, on continue)\n');
    }

    // Créer l'objet à exporter
    const exportData = {
      Places: placesData,
      Institutions: institutionsData
    };

    // Sauvegarder dans un fichier
    const outputPath = path.resolve(__dirname, '../firebasedata/places-export.json');
    
    // Créer le dossier si nécessaire
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log('✅ Export terminé avec succès!');
    console.log('📁 Fichier créé:', outputPath);
    console.log('\n📊 Résumé:');
    console.log(`   - Places: ${placesCount}`);
    console.log(`   - Institutions: ${Object.keys(institutionsData).length}`);
    console.log(`   - Taille: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

    console.log('\n🚀 Tu peux maintenant lancer:');
    console.log('   node backend/supabase/importPlaces.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error.message);
    console.error('\n💡 Causes possibles:');
    console.error('   - Problème de connexion Firebase');
    console.error('   - Variables d\'environnement manquantes');
    console.error('   - Permissions insuffisantes');
    console.error('\nDétails:', error);
    process.exit(1);
  }
}

// Lancer l'export
console.log('╔════════════════════════════════════════════╗');
console.log('║   EXPORT PLACES DEPUIS FIREBASE            ║');
console.log('╚════════════════════════════════════════════╝\n');

exportPlaces();
