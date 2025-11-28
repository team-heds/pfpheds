#!/usr/bin/env node

// Export complet de toutes les données Supabase

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://api2.hedsvs.ch'
const serviceKey = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwic3ViIjoiZjIwYTFlZjUtZmQyYi00NmJmLThiYTctYWM5OWQyOTQzYWIyIiwiaWF0IjoxNzU3NDk5MjA2LCJleHAiOjIwNzI4NTkyMDZ9.g_oiwEM8PAh0SPn45-dvOnUPaXcSSY9PTPUNrj-zlWA'

const supabase = createClient(supabaseUrl, serviceKey)

console.log('📦 EXPORT COMPLET DES DONNÉES SUPABASE\n')
console.log('=' .repeat(80))

const allTables = [
  'user_profiles',
  'gamification_data',
  'houses',
  'badges',
  'quests',
  'challenges',
  'users',
  'xp_actions',
  'house_points',
  'course_sessions',
  'praticians_formateurs',
  'stages',
  'votations',
  'pfp_assignments',
  'contracts',
  'videos',
  'media_files',
  'comments',
  'likes',
  'mentions',
  'hashtags',
  'tickets',
  'tasks',
  'notes',
  'notebooks',
  'pages',
  'messages',
  'conversations',
  'chat_rooms',
  'documents',
  'files',
  'attachments',
  'audit_logs',
  'notifications',
  'settings'
]

async function exportAllData() {
  const exportData = {
    timestamp: new Date().toISOString(),
    database: 'pfpheds_supabase',
    tables: {}
  }
  
  let totalRows = 0
  
  console.log('\n📊 EXPORT DES TABLES:\n')
  
  for (const tableName of allTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
      
      if (!error && data) {
        exportData.tables[tableName] = {
          count: count || data.length,
          data: data,
          schema: data.length > 0 ? Object.keys(data[0]) : []
        }
        
        totalRows += count || data.length
        
        if ((count || 0) > 0) {
          console.log(`  ✅ ${tableName.padEnd(30)} → ${count} lignes exportées`)
        }
      }
    } catch (err) {
      // Table n'existe pas ou erreur, on ignore
    }
  }
  
  // Sauvegarder l'export complet
  const filename = `supabase_export_${new Date().toISOString().split('T')[0]}.json`
  fs.writeFileSync(filename, JSON.stringify(exportData, null, 2))
  
  console.log('\n' + '='.repeat(80))
  console.log(`\n✅ Export terminé !`)
  console.log(`   📁 Fichier: ${filename}`)
  console.log(`   📊 Total: ${Object.keys(exportData.tables).length} tables`)
  console.log(`   📈 Total lignes: ${totalRows}`)
  
  // Créer aussi un export par catégorie
  const categories = {
    users: ['user_profiles', 'users'],
    gamification: ['gamification_data', 'houses', 'badges', 'quests', 'challenges', 'xp_actions', 'house_points'],
    academic: ['course_sessions'],
    pfp: ['praticians_formateurs', 'stages', 'votations', 'pfp_assignments', 'contracts'],
    media: ['videos', 'media_files'],
    social: ['comments', 'likes', 'mentions', 'hashtags'],
    apps: ['tickets', 'tasks', 'notes', 'notebooks', 'pages', 'messages', 'conversations', 'chat_rooms'],
    system: ['documents', 'files', 'attachments', 'audit_logs', 'notifications', 'settings']
  }
  
  console.log('\n📂 EXPORT PAR CATÉGORIE:\n')
  
  for (const [category, tables] of Object.entries(categories)) {
    const categoryData = {}
    let categoryRows = 0
    
    for (const table of tables) {
      if (exportData.tables[table] && exportData.tables[table].count > 0) {
        categoryData[table] = exportData.tables[table]
        categoryRows += exportData.tables[table].count
      }
    }
    
    if (Object.keys(categoryData).length > 0) {
      const catFilename = `export_${category}_${new Date().toISOString().split('T')[0]}.json`
      fs.writeFileSync(catFilename, JSON.stringify(categoryData, null, 2))
      console.log(`  ✅ ${category.padEnd(20)} → ${catFilename} (${categoryRows} lignes)`)
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Tous les exports sont terminés !\n')
  
  return exportData
}

exportAllData()
