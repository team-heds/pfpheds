/**
 * Script pour appliquer la migration student_result_vote via l'API Supabase
 * Usage: node scripts/apply-migration-student-result-vote.js
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Créer le client Supabase avec service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Application de la migration student_result_vote...\n')

  // Lire le fichier de migration
  const migrationPath = path.join(__dirname, '../supabase_migrations/20251211_create_student_result_vote.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Fichier de migration non trouvé: ${migrationPath}`)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
  
  console.log('📄 Fichier de migration chargé')
  console.log(`📊 Taille: ${migrationSQL.length} caractères\n`)

  // Découper le SQL en statements individuels pour un meilleur diagnostic
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📝 ${statements.length} statements SQL à exécuter\n`)

  let successCount = 0
  let errorCount = 0

  // Exécuter chaque statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    const preview = statement.substring(0, 80).replace(/\n/g, ' ')
    
    try {
      console.log(`[${i + 1}/${statements.length}] ${preview}...`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        query: statement 
      }).catch(async () => {
        // Fallback: essayer avec une requête directe
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: statement })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }
        
        return { data: await response.json(), error: null }
      })

      if (error) {
        console.error(`   ❌ Erreur: ${error.message}`)
        errorCount++
      } else {
        console.log(`   ✅ Succès`)
        successCount++
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err.message}`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 Résultats:`)
  console.log(`   ✅ Succès: ${successCount}`)
  console.log(`   ❌ Erreurs: ${errorCount}`)
  console.log('='.repeat(60) + '\n')

  if (errorCount > 0) {
    console.log('⚠️  Certaines requêtes ont échoué.')
    console.log('💡 Solution alternative: Copier/coller le SQL directement dans Supabase Dashboard')
    console.log('   1. Ouvrir: https://supabase.com/dashboard')
    console.log('   2. Aller dans: SQL Editor')
    console.log('   3. Copier/coller le contenu de: supabase_migrations/20251211_create_student_result_vote.sql')
    console.log('   4. Cliquer sur: RUN\n')
  } else {
    console.log('✅ Migration appliquée avec succès!')
    console.log('\n🎯 Prochaines étapes:')
    console.log('   1. Redémarrer le backend: cd backend && node index.js')
    console.log('   2. Tester l\'algorithme dans l\'interface\n')
  }
}

// Exécuter
applyMigration().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
