#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://api2.hedsvs.ch'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test de connexion
async function testConnection() {
  console.log('🔍 Test de connexion à Supabase VPS...')
  console.log('URL:', supabaseUrl)
  
  try {
    // Liste les tables disponibles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Erreur:', error.message)
    } else {
      console.log('✅ Connexion réussie!')
      console.log('📊 Table user_profiles accessible')
    }
  } catch (err) {
    console.error('❌ Erreur de connexion:', err.message)
  }
}

testConnection()
