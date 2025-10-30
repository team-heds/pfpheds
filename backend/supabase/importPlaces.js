/**
 * Script d'import des Places de Firebase vers Supabase
 * Usage: node backend/supabase/importPlaces.js
 */

// NOTE: we use direct REST calls to PostgREST to avoid project URL/key mismatch
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configuration ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const projectBaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL; // e.g. https://xyz.supabase.co
const restBaseUrl = process.env.VITE_SUPABASE_REST_URL
  || (projectBaseUrl ? projectBaseUrl.replace(/\/$/, '') + '/rest/v1' : '');
// Utiliser service_role key si disponible (bypass RLS), sinon anon key (moins recommandé)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.VITE_SUPABASE_KEY
  || process.env.SUPABASE_KEY;

if (!restBaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   VITE_SUPABASE_REST_URL:', restBaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ (masquée)' : '❌');
  console.error('   VITE_SUPABASE_KEY:', process.env.VITE_SUPABASE_KEY ? '✅ (masquée)' : '❌');
  console.error('\n💡 Ajoute ces variables dans ton fichier .env :');
  console.error('   VITE_SUPABASE_URL=https://ton-projet.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (recommandé pour import)\n');
  process.exit(1);
}

console.log('🔑 Utilisation de:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY (admin)' : 'ANON_KEY (standard)');

// Common headers for PostgREST
const restHeaders = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
};

/**
 * Fonction pour migrer un champ PFP/Remarques vers JSONB
 * @param {any} field - Valeur du champ (peut être string, object, null)
 * @param {any} field2026 - Valeur du champ -2026
 * @returns {object} - Objet JSONB {"2025": "...", "2026": "..."}
 */
function migrateFieldToJson(field, field2026) {
  let obj = {};
  
  // Si c'est déjà un objet, on le garde
  if (typeof field === 'object' && field !== null) {
    obj = { ...field };
  } else if (field !== undefined && field !== null && field !== '') {
    // Sinon on met la valeur dans 2025
    obj['2025'] = String(field);
  }
  
  // Ajouter la valeur 2026 si présente
  if (field2026 !== undefined && field2026 !== null && field2026 !== '') {
    obj['2026'] = String(field2026);
  } else if (!obj['2026']) {
    obj['2026'] = '';
  }
  
  return obj;
}

/**
 * Fonction pour normaliser un booléen Firebase
 * @param {any} value - Valeur à normaliser
 * @returns {boolean}
 */
function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

/**
 * Fonction principale d'import
 */
async function importPlaces() {
  console.log('🔄 Démarrage de l\'import des places...\n');

  // Lire le fichier d'export Firebase
  // Essayer d'abord places-export.json, sinon l'export complet
  let firebaseDataPath = path.resolve(__dirname, '../firebasedata/places-export.json');
  
  if (!fs.existsSync(firebaseDataPath)) {
    console.log('⚠️  places-export.json non trouvé, essai avec l\'export complet...');
    firebaseDataPath = path.resolve(__dirname, '../firebasedata/pfpheds-default-rtdb-export.json');
  }
  
  if (!fs.existsSync(firebaseDataPath)) {
    console.error('❌ Aucun fichier Firebase trouvé!');
    console.error('\n📋 Pour exporter les Places depuis Firebase Console:');
    console.error('   1. Va sur https://console.firebase.google.com');
    console.error('   2. Sélectionne le projet "pfpheds"');
    console.error('   3. Va dans "Realtime Database"');
    console.error('   4. Clique sur "Places" → 3 points → "Export JSON"');
    console.error('   5. Sauvegarde dans: backend/firebasedata/places-export.json\n');
    process.exit(1);
  }

  console.log('📂 Lecture du fichier Firebase...');
  const firebaseData = JSON.parse(fs.readFileSync(firebaseDataPath, 'utf8'));

  if (!firebaseData.Places) {
    console.error('❌ Aucune place trouvée dans l\'export Firebase (clé "Places" manquante)');
    console.error('\n💡 Le fichier ne contient pas de clé "Places".');
    console.error('   Assure-toi d\'exporter le nœud "/Places" depuis Firebase.');
    process.exit(1);
  }

  const placesData = firebaseData.Places;
  const institutionsData = firebaseData.Institutions || {};
  
  console.log(`✅ ${Object.keys(placesData).length} places trouvées dans Firebase`);
  console.log(`✅ ${Object.keys(institutionsData).length} institutions trouvées pour jointure\n`);

  // Transformer les places pour Supabase
  const placesForSupabase = Object.entries(placesData).map(([placeId, place]) => {
    // Récupérer l'institution associée
    const institutionId = place.InstitutionId || place.IDPlace;
    const institution = institutionsData[institutionId] || {};

    return {
      PlaceId: placeId,
      NomPlace: place.NomPlace || null,
      InstitutionId: institutionId || null,
      fileURL: place.fileURL || null,
      
      // Spécialités
      MSQ: normalizeBoolean(place.MSQ),
      SYSINT: normalizeBoolean(place.SYSINT),
      AIGU: normalizeBoolean(place.AIGU),
      REHAB: normalizeBoolean(place.REHAB),
      AMBU: normalizeBoolean(place.AMBU),
      NEUROGER: normalizeBoolean(place.NEUROGER),
      
      // Langues
      FR: normalizeBoolean(place.FR),
      DE: normalizeBoolean(place.DE),
      IT: normalizeBoolean(place.IT),
      ENG: normalizeBoolean(place.ENG),
      
      // PFP par année (JSONB)
      PFP1A: migrateFieldToJson(place.PFP1A, place['PFP1A-2026']),
      PFP1B: migrateFieldToJson(place.PFP1B, place['PFP1B-2026']),
      PFP2: migrateFieldToJson(place.PFP2, place['PFP2-2026']),
      PFP3: migrateFieldToJson(place.PFP3, place['PFP3-2026']),
      PFP4: migrateFieldToJson(place.PFP4, place['PFP4-2026']),
      
      // Remarques par année (JSONB)
      Remarques: migrateFieldToJson(place.Remarques, place['Remarques-2026']),
      
      // Praticiens formateurs (array)
      praticiensFormateurs: Array.isArray(place.praticiensFormateurs) 
        ? place.praticiensFormateurs 
        : (place.praticiensFormateurs ? [place.praticiensFormateurs] : []),
      
      // Champs dupliqués de l'institution
      InstitutionName: institution.Name || place.NomPlace || null,
      AccordCadreDate: institution.AccordCadreDate || null,
      Canton: institution.Canton || null,
      Categorie: institution.Category || null,
      ConventionDate: institution.ConventionDate || null,
      Lieu: institution.Locality || null,
    };
  });

  console.log('🔄 Import vers Supabase (REST)...');
  console.log(`   Nombre de places à importer: ${placesForSupabase.length}`);

  // Import par batch de 500 max
  const batchSize = 500;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < placesForSupabase.length; i += batchSize) {
    const batch = placesForSupabase.slice(i, i + batchSize);

    try {
      const res = await fetch(`${restBaseUrl}/places?on_conflict=PlaceId`, {
        method: 'POST',
        headers: {
          ...restHeaders,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(batch),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`❌ Erreur batch ${Math.floor(i / batchSize) + 1}:`, text || res.statusText);
        errors += batch.length;
      } else {
        const data = await res.json();
        imported += data.length || batch.length;
        console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(placesForSupabase.length / batchSize)} importé (${data.length || batch.length} places)`);
      }
    } catch (e) {
      console.error(`❌ Exception batch ${Math.floor(i / batchSize) + 1}:`, e.message);
      errors += batch.length;
    }
  }

  console.log('\n📊 Résumé de l\'import:');
  console.log(`   ✅ Importées: ${imported}`);
  console.log(`   ❌ Erreurs: ${errors}`);
  console.log(`   📝 Total: ${placesForSupabase.length}`);

  if (errors === 0) {
    console.log('\n🎉 Import terminé avec succès!');
  } else {
    console.log('\n⚠️  Import terminé avec des erreurs.');
  }

  // Vérification finale
  console.log('\n🔍 Vérification dans Supabase (REST)...');
  try {
    const res = await fetch(`${restBaseUrl}/places?select=PlaceId`, {
      headers: { ...restHeaders, Prefer: 'count=exact' },
    });
    const total = res.headers.get('content-range')?.split('/')?.[1];
    console.log(`✅ Nombre de places dans Supabase: ${total || 'inconnu'}`);
  } catch (e) {
    console.error('❌ Erreur de vérification:', e.message);
  }

  // Exemples de données importées
  console.log('\n📋 Exemples de places importées:');
  try {
    const res = await fetch(`${restBaseUrl}/places?select=PlaceId,NomPlace,InstitutionName,Canton,MSQ,AIGU,PFP2&limit=5`, {
      headers: restHeaders,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('❌ Erreur récupération exemples:', text || res.statusText);
    } else {
      const samples = await res.json();
      console.table(samples);
    }
  } catch (e) {
    console.error('❌ Erreur récupération exemples:', e.message);
  }
}

// Exécuter l'import
importPlaces().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
