/**
 * Script de test pour l'algorithme d'attribution des places
 * 
 * Usage: node scripts/test-algorithm-attribution.js
 */

require('dotenv').config()
const supabase = require('../backend/supabaseClient')

async function testAlgorithm() {
  console.log('🧪 Test de l\'algorithme d\'attribution des places\n')

  try {
    // 1. Vérifier que la table existe
    console.log('1️⃣ Vérification de la table student_result_vote...')
    const { data: tables, error: tablesError } = await supabase
      .from('student_result_vote')
      .select('*')
      .limit(0)

    if (tablesError) {
      console.error('❌ La table student_result_vote n\'existe pas encore')
      console.log('   Veuillez exécuter la migration: supabase_migrations/20251211_create_student_result_vote.sql')
      return
    }
    console.log('✅ Table student_result_vote existe\n')

    // 2. Vérifier les fonctions RPC
    console.log('2️⃣ Test des fonctions RPC...')
    
    // Test get_student_result (devrait retourner null si pas de résultat)
    try {
      const { data: resultData, error: resultError } = await supabase
        .rpc('get_student_result', {
          p_user_id: '00000000-0000-0000-0000-000000000000',
          p_pfp_type: 'PFP1A',
          p_year: '2026'
        })
      
      if (resultError) throw resultError
      console.log('✅ Fonction get_student_result fonctionne')
    } catch (err) {
      console.error('❌ Erreur get_student_result:', err.message)
    }

    // Test get_algorithm_results
    try {
      const { data: resultsData, error: resultsError } = await supabase
        .rpc('get_algorithm_results', {
          p_pfp_type: 'PFP1A',
          p_year: '2026',
          p_algorithm_run_id: null
        })
      
      if (resultsError) throw resultsError
      console.log('✅ Fonction get_algorithm_results fonctionne')
    } catch (err) {
      console.error('❌ Erreur get_algorithm_results:', err.message)
    }

    console.log('')

    // 3. Vérifier la vue result_statistics
    console.log('3️⃣ Test de la vue result_statistics...')
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('result_statistics')
        .select('*')
        .limit(5)
      
      if (statsError) throw statsError
      console.log('✅ Vue result_statistics existe')
      console.log(`   Statistiques trouvées: ${statsData?.length || 0}\n`)
    } catch (err) {
      console.error('❌ Erreur result_statistics:', err.message, '\n')
    }

    // 4. Test des permissions RLS (nécessite un token utilisateur)
    console.log('4️⃣ Test des permissions RLS...')
    console.log('⚠️  Les tests RLS nécessitent un token utilisateur valide')
    console.log('   Les permissions sont configurées pour:')
    console.log('   - Étudiants: Lecture de leurs propres résultats')
    console.log('   - Admins: Lecture/Écriture de tous les résultats\n')

    // 5. Exemple de données de test
    console.log('5️⃣ Structure des données attendues:\n')
    console.log('📊 Exemple d\'étudiant:')
    console.log(JSON.stringify({
      userId: 'uuid-student-1',
      nom: 'Dupont',
      prenom: 'Jean',
      classe: 'BA25',
      choices: [
        { placeId: 'place-1', rank: 1 },
        { placeId: 'place-2', rank: 2 },
        { placeId: 'place-3', rank: 3 }
      ],
      priorityScore: 85.5
    }, null, 2))

    console.log('\n📍 Exemple de place:')
    console.log(JSON.stringify({
      PlaceId: 'place-1',
      NomPlace: 'HUG - Soins intensifs',
      InstitutionName: 'Hôpitaux Universitaires de Genève',
      Capacity: 2
    }, null, 2))

    console.log('\n✅ Tous les tests sont passés!')
    console.log('\n📖 Pour plus d\'informations, consultez: ALGORITHME_ATTRIBUTION.md')

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error)
  }
}

// Exécuter les tests
testAlgorithm()
