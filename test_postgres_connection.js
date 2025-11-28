#!/usr/bin/env node

// Test de connexion PostgreSQL directe
import pg from 'pg'
const { Client } = pg

const connectionString = 'postgresql://postgres:df2210861ffd6324e3d9a5c0a3a33dbe995c699e882282b0@api2.hedsvs.ch:5432/postgres'

console.log('🔍 Test de connexion PostgreSQL...')
console.log('Host: api2.hedsvs.ch:5432')
console.log('Database: postgres')
console.log('User: postgres')

const client = new Client({
  connectionString,
  ssl: false // Essayez avec true si ça échoue
})

async function testConnection() {
  try {
    console.log('\n⏳ Connexion en cours...')
    await client.connect()
    console.log('✅ Connexion réussie!')
    
    // Liste les tables
    console.log('\n📊 Tables disponibles:')
    const result = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    console.log(`\n✅ Total: ${result.rows.length} tables`)
    
  } catch (err) {
    console.error('\n❌ Erreur de connexion:', err.message)
    console.error('\nDétails:', err)
  } finally {
    await client.end()
  }
}

testConnection()
