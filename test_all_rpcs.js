#!/usr/bin/env node

// Test de toutes les fonctions RPC avec les vraies données

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://api2.hedsvs.ch'
const serviceKey = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwic3ViIjoiZjIwYTFlZjUtZmQyYi00NmJmLThiYTctYWM5OWQyOTQzYWIyIiwiaWF0IjoxNzU3NDk5MjA2LCJleHAiOjIwNzI4NTkyMDZ9.g_oiwEM8PAh0SPn45-dvOnUPaXcSSY9PTPUNrj-zlWA'

const supabase = createClient(supabaseUrl, serviceKey)

console.log('🧪 TEST COMPLET DES FONCTIONS RPC\n')
console.log('=' .repeat(80))

async function testAllRPCs() {
  const results = []
  
  // Récupérer des données réelles pour les tests
  console.log('\n📊 PRÉPARATION: Récupération des données de test\n')
  
  let testUserId = null
  let testHouseId = null
  let testModuleId = null
  let testCapsuleId = null
  
  try {
    const { data: users } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1)
    if (users && users.length > 0) {
      testUserId = users[0].user_id
      console.log(`  ✅ Test user_id: ${testUserId}`)
    }
    
    const { data: houses } = await supabase
      .from('houses')
      .select('id')
      .limit(1)
    if (houses && houses.length > 0) {
      testHouseId = houses[0].id
      console.log(`  ✅ Test house_id: ${testHouseId}`)
    }
    
    const { data: gamif } = await supabase
      .from('gamification_data')
      .select('id')
      .limit(1)
    if (gamif && gamif.length > 0) {
      testCapsuleId = gamif[0].id
      console.log(`  ✅ Test capsule_id: ${testCapsuleId}`)
    }
  } catch (err) {
    console.log(`  ⚠️  Erreur récupération données: ${err.message}`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n🧪 TESTS DES RPCS GAMIFICATION\n')
  
  // Test 1: add_user_xp
  if (testUserId) {
    try {
      console.log('Test 1: add_user_xp...')
      const { data, error } = await supabase.rpc('add_user_xp', {
        p_user_id: testUserId,
        p_action: 'test_action',
        p_amount: 10,
        p_description: 'Test RPC depuis script'
      })
      
      if (error) {
        console.log(`  ❌ Erreur: ${error.message}\n`)
        results.push({ rpc: 'add_user_xp', status: 'error', error: error.message })
      } else {
        console.log(`  ✅ Succès: XP ajouté`)
        console.log(`     Résultat:`, data)
        console.log()
        results.push({ rpc: 'add_user_xp', status: 'success', result: data })
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}\n`)
      results.push({ rpc: 'add_user_xp', status: 'exception', error: err.message })
    }
  }
  
  // Test 2: calculate_level_from_xp
  try {
    console.log('Test 2: calculate_level_from_xp...')
    const { data, error } = await supabase.rpc('calculate_level_from_xp', {
      xp: 250
    })
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}\n`)
      results.push({ rpc: 'calculate_level_from_xp', status: 'error', error: error.message })
    } else {
      console.log(`  ✅ Succès: Niveau calculé`)
      console.log(`     XP: 250 → Niveau: ${data}`)
      console.log()
      results.push({ rpc: 'calculate_level_from_xp', status: 'success', result: data })
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}\n`)
    results.push({ rpc: 'calculate_level_from_xp', status: 'exception', error: err.message })
  }
  
  // Test 3: check_and_unlock_badges
  if (testUserId) {
    try {
      console.log('Test 3: check_and_unlock_badges...')
      const { data, error } = await supabase.rpc('check_and_unlock_badges', {
        p_user_id: testUserId,
        p_action: 'test',
        p_total_xp: 100,
        p_level: 2
      })
      
      if (error) {
        console.log(`  ❌ Erreur: ${error.message}\n`)
        results.push({ rpc: 'check_and_unlock_badges', status: 'error', error: error.message })
      } else {
        console.log(`  ✅ Succès: Badges vérifiés`)
        console.log(`     Badges débloqués:`, data || 'aucun')
        console.log()
        results.push({ rpc: 'check_and_unlock_badges', status: 'success', result: data })
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}\n`)
      results.push({ rpc: 'check_and_unlock_badges', status: 'exception', error: err.message })
    }
  }
  
  // Test 4: get_all_gamification_users
  try {
    console.log('Test 4: get_all_gamification_users...')
    const { data, error } = await supabase.rpc('get_all_gamification_users')
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}\n`)
      results.push({ rpc: 'get_all_gamification_users', status: 'error', error: error.message })
    } else {
      console.log(`  ✅ Succès: ${data?.length || 0} utilisateurs gamification`)
      if (data && data.length > 0) {
        console.log(`     Premier utilisateur:`, data[0])
      }
      console.log()
      results.push({ rpc: 'get_all_gamification_users', status: 'success', count: data?.length })
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}\n`)
    results.push({ rpc: 'get_all_gamification_users', status: 'exception', error: err.message })
  }
  
  console.log('='.repeat(80))
  console.log('\n🧪 TESTS DES RPCS LEADERBOARD\n')
  
  // Test 5: get_leaderboard
  try {
    console.log('Test 5: get_leaderboard (global)...')
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_limit: 10
    })
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}\n`)
      results.push({ rpc: 'get_leaderboard', status: 'error', error: error.message })
    } else {
      console.log(`  ✅ Succès: Top ${data?.length || 0} utilisateurs`)
      if (data && data.length > 0) {
        console.log(`     1er: ${data[0].display_name || data[0].email} (${data[0].total_xp} XP)`)
      }
      console.log()
      results.push({ rpc: 'get_leaderboard', status: 'success', count: data?.length })
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}\n`)
    results.push({ rpc: 'get_leaderboard', status: 'exception', error: err.message })
  }
  
  // Test 6: get_leaderboard par maison
  if (testHouseId) {
    try {
      console.log('Test 6: get_leaderboard (par maison)...')
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_house_id: testHouseId,
        p_limit: 5
      })
      
      if (error) {
        console.log(`  ❌ Erreur: ${error.message}\n`)
        results.push({ rpc: 'get_leaderboard_house', status: 'error', error: error.message })
      } else {
        console.log(`  ✅ Succès: Top ${data?.length || 0} de la maison`)
        console.log()
        results.push({ rpc: 'get_leaderboard_house', status: 'success', count: data?.length })
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}\n`)
      results.push({ rpc: 'get_leaderboard_house', status: 'exception', error: err.message })
    }
  }
  
  console.log('='.repeat(80))
  console.log('\n🧪 TESTS DES RPCS MÉDIA\n')
  
  // Test 7: get_video_library_stats
  try {
    console.log('Test 7: get_video_library_stats...')
    const { data, error } = await supabase.rpc('get_video_library_stats')
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}\n`)
      results.push({ rpc: 'get_video_library_stats', status: 'error', error: error.message })
    } else {
      console.log(`  ✅ Succès: Stats vidéothèque`)
      console.log(`     Résultat:`, data)
      console.log()
      results.push({ rpc: 'get_video_library_stats', status: 'success', result: data })
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}\n`)
    results.push({ rpc: 'get_video_library_stats', status: 'exception', error: err.message })
  }
  
  console.log('='.repeat(80))
  console.log('\n🧪 TESTS DES RPCS ANALYTICS\n')
  
  // Test 8: get_capsule_analytics
  if (testCapsuleId) {
    try {
      console.log('Test 8: get_capsule_analytics...')
      const { data, error } = await supabase.rpc('get_capsule_analytics', {
        p_capsule_id: testCapsuleId
      })
      
      if (error) {
        console.log(`  ❌ Erreur: ${error.message}\n`)
        results.push({ rpc: 'get_capsule_analytics', status: 'error', error: error.message })
      } else {
        console.log(`  ✅ Succès: Analytics capsule`)
        console.log(`     Résultat:`, data)
        console.log()
        results.push({ rpc: 'get_capsule_analytics', status: 'success', result: data })
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}\n`)
      results.push({ rpc: 'get_capsule_analytics', status: 'exception', error: err.message })
    }
  }
  
  console.log('='.repeat(80))
  console.log('\n🧪 TESTS DES RPCS PERMISSIONS\n')
  
  // Test 9: whoami
  try {
    console.log('Test 9: whoami...')
    const { data, error } = await supabase.rpc('whoami')
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}\n`)
      results.push({ rpc: 'whoami', status: 'error', error: error.message })
    } else {
      console.log(`  ✅ Succès: Identité actuelle`)
      console.log(`     User:`, data?.db_user)
      console.log(`     Role:`, data?.jwt_claims?.role)
      console.log()
      results.push({ rpc: 'whoami', status: 'success', result: data })
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}\n`)
    results.push({ rpc: 'whoami', status: 'exception', error: err.message })
  }
  
  // Test 10: is_superadmin
  try {
    console.log('Test 10: is_superadmin...')
    const { data, error } = await supabase.rpc('is_superadmin')
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}\n`)
      results.push({ rpc: 'is_superadmin', status: 'error', error: error.message })
    } else {
      console.log(`  ✅ Succès: ${data ? 'Est superadmin' : 'N\'est pas superadmin'}`)
      console.log()
      results.push({ rpc: 'is_superadmin', status: 'success', result: data })
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err.message}\n`)
    results.push({ rpc: 'is_superadmin', status: 'exception', error: err.message })
  }
  
  console.log('='.repeat(80))
  console.log('\n📊 RÉSUMÉ DES TESTS\n')
  
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const exceptionCount = results.filter(r => r.status === 'exception').length
  
  console.log(`Total de tests: ${results.length}`)
  console.log(`  ✅ Succès: ${successCount}`)
  console.log(`  ❌ Erreurs: ${errorCount}`)
  console.log(`  💥 Exceptions: ${exceptionCount}`)
  
  // Sauvegarder les résultats
  fs.writeFileSync('rpc_test_results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      success: successCount,
      error: errorCount,
      exception: exceptionCount
    },
    results
  }, null, 2))
  
  console.log('\n✅ Résultats sauvegardés dans: rpc_test_results.json')
  
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Tests RPC terminés !\n')
}

testAllRPCs()
