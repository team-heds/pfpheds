/**
 * Script de test de connexion Supabase
 * 
 * Usage:
 *   node test-supabase-connection.js
 * 
 * Ce script teste:
 * 1. La connexion au serveur Supabase
 * 2. L'accès à l'API Auth
 * 3. La création d'un utilisateur de test
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

console.log('\n🔍 TEST DE CONNEXION SUPABASE\n')
console.log('Configuration:')
console.log('  URL:', supabaseUrl)
console.log('  Key:', supabaseKey.substring(0, 20) + '...')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

// Test 1: Ping serveur
const testServerConnection = async () => {
  console.log('1️⃣  Test connexion serveur...')
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ✅ Serveur accessible (table user_profiles vide ou inexistante)')
        return true
      } else if (error.message.includes('relation "public.user_profiles" does not exist')) {
        console.log('   ⚠️  Serveur accessible mais table user_profiles n\'existe pas')
        console.log('   💡 Exécutez la migration FIX_auth_signup.sql')
        return true
      } else {
        console.error('   ❌ Erreur:', error.message)
        return false
      }
    }
    
    console.log('   ✅ Serveur accessible')
    return true
  } catch (e) {
    console.error('   ❌ Impossible de se connecter:', e.message)
    console.error('   💡 Vérifiez que Docker est démarré et que Supabase est lancé')
    return false
  }
}

// Test 2: Configuration Auth
const testAuthConfig = async () => {
  console.log('\n2️⃣  Test configuration Auth...')
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('   ❌ Erreur Auth:', error.message)
      return false
    }
    
    console.log('   ✅ Service Auth accessible')
    return true
  } catch (e) {
    console.error('   ❌ Service Auth non disponible:', e.message)
    return false
  }
}

// Test 3: Inscription test
const testSignUp = async () => {
  console.log('\n3️⃣  Test inscription utilisateur...')
  
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'Test1234!'
  
  console.log('   Email test:', testEmail)
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (error) {
      console.error('   ❌ Erreur inscription:', error.message)
      console.error('   Code:', error.code || 'N/A')
      console.error('   Status:', error.status || 'N/A')
      
      // Diagnostics selon le code d'erreur
      if (error.message.includes('Email signups are disabled')) {
        console.log('\n   💡 SOLUTION:')
        console.log('      1. Allez sur Supabase Dashboard → Authentication → Settings')
        console.log('      2. Activez "Enable email signups"')
        console.log('      OU pour Supabase local, vérifiez config.toml:')
        console.log('         [auth]')
        console.log('         enable_signup = true')
      } else if (error.message.includes('API error happened')) {
        console.log('\n   💡 SOLUTION:')
        console.log('      1. Vérifiez que Docker Supabase est démarré')
        console.log('      2. Vérifiez les logs: npx supabase logs auth')
        console.log('      3. Vérifiez l\'URL Supabase dans .env')
      } else if (error.message.includes('rate limit')) {
        console.log('\n   💡 SOLUTION: Trop de tentatives, attendez 1h ou utilisez un autre email')
      }
      
      return false
    }
    
    if (data.user) {
      console.log('   ✅ Inscription réussie!')
      console.log('   User ID:', data.user.id)
      console.log('   Email:', data.user.email)
      
      if (!data.session) {
        console.log('   ℹ️  Pas de session (confirmation email requise)')
      } else {
        console.log('   ✅ Session créée automatiquement')
      }
      
      return true
    } else {
      console.log('   ⚠️  Inscription apparemment réussie mais pas de data.user')
      return false
    }
  } catch (e) {
    console.error('   ❌ Exception:', e.message)
    return false
  }
}

// Exécuter tous les tests
const runAllTests = async () => {
  const serverOk = await testServerConnection()
  
  if (!serverOk) {
    console.log('\n❌ ÉCHEC: Serveur Supabase non accessible')
    console.log('\n💡 ACTIONS À EFFECTUER:')
    console.log('   1. Démarrer Docker Desktop')
    console.log('   2. Lancer Supabase: npx supabase start')
    console.log('   3. Vérifier .env: VITE_SUPABASE_URL et VITE_SUPABASE_KEY')
    process.exit(1)
  }
  
  const authOk = await testAuthConfig()
  
  if (!authOk) {
    console.log('\n❌ ÉCHEC: Service Auth non accessible')
    process.exit(1)
  }
  
  const signUpOk = await testSignUp()
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 RÉSUMÉ DES TESTS')
  console.log('='.repeat(50))
  console.log(`Connexion serveur:     ${serverOk ? '✅' : '❌'}`)
  console.log(`Service Auth:          ${authOk ? '✅' : '❌'}`)
  console.log(`Test inscription:      ${signUpOk ? '✅' : '❌'}`)
  console.log('')
  
  if (serverOk && authOk && signUpOk) {
    console.log('🎉 TOUS LES TESTS PASSÉS - Supabase est opérationnel!')
  } else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ - Consultez SUPABASE_SIGNUP_FIX.md')
  }
  
  process.exit(signUpOk ? 0 : 1)
}

// Lancer les tests
runAllTests()
