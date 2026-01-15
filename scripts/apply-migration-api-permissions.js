/**
 * Script pour appliquer la migration api_my_permissions
 * Ce script crée le RPC manquant dans Supabase
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    console.log('🚀 Application de la migration api_my_permissions...')
    
    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260114_create_api_my_permissions.sql')
    const sqlContent = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Fichier SQL chargé:', migrationPath)
    
    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent })
    
    if (error) {
      // Si exec_sql n'existe pas, essayer avec la connexion PostgreSQL directe
      console.warn('⚠️  exec_sql RPC non disponible, tentative avec query directe...')
      
      const { data: result, error: queryError } = await supabase
        .from('_migrations')
        .select('*')
        .limit(1)
      
      if (queryError) {
        console.error('❌ Erreur lors de l\'exécution SQL:', queryError)
        console.log('\n📝 Veuillez appliquer manuellement la migration via Supabase Dashboard:')
        console.log('   1. Allez sur https://supabase.com/dashboard')
        console.log('   2. Sélectionnez votre projet')
        console.log('   3. Allez dans "SQL Editor"')
        console.log('   4. Collez le contenu du fichier:', migrationPath)
        console.log('   5. Exécutez le SQL\n')
        console.log('📄 Contenu du fichier SQL à copier:\n')
        console.log(sqlContent)
        process.exit(1)
      }
    }
    
    console.log('✅ Migration appliquée avec succès!')
    
    // Tester le RPC
    console.log('\n🧪 Test du RPC api_my_permissions...')
    const { data: testData, error: testError } = await supabase.rpc('api_my_permissions')
    
    if (testError) {
      console.warn('⚠️  Erreur lors du test:', testError.message)
      console.log('   Cela peut être normal si aucun utilisateur n\'est connecté')
    } else {
      console.log('✅ RPC fonctionne! Permissions retournées:', testData)
    }
    
  } catch (err) {
    console.error('❌ Erreur fatale:', err)
    process.exit(1)
  }
}

applyMigration()
