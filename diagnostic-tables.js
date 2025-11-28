import { supabase } from './src/supabase.js'

async function diagnosticTables() {
  console.log('🔍 === DIAGNOSTIC DES TABLES SUPABASE ===\n')
  
  // 1. Analyser user_profiles
  console.log('📋 TABLE: user_profiles')
  console.log('─'.repeat(80))
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(3)
  
  if (profilesError) {
    console.error('❌ Erreur:', profilesError)
  } else {
    console.log(`✅ ${profilesData.length} exemples récupérés`)
    if (profilesData.length > 0) {
      console.log('\n📊 Colonnes disponibles:')
      console.log(Object.keys(profilesData[0]).join(', '))
      
      console.log('\n📝 Exemples de données:')
      profilesData.forEach((row, i) => {
        console.log(`\nÉtudiant ${i + 1}:`)
        console.log(`  - user_id: ${row.user_id}`)
        console.log(`  - firebase_id: ${row.firebase_id || 'N/A'}`)
        console.log(`  - email: ${row.email}`)
        console.log(`  - nom: ${row.family_name} ${row.forname}`)
        console.log(`  - role: ${row.role}`)
        console.log(`  - classe: ${row.classe || row.class || row.promotion || 'N/A'}`)
      })
    }
  }
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  // 2. Analyser StudentsPhysio
  console.log('📋 TABLE: StudentsPhysio')
  console.log('─'.repeat(80))
  
  const { data: physioData, error: physioError } = await supabase
    .from('StudentsPhysio')
    .select('*')
    .limit(3)
  
  if (physioError) {
    console.error('❌ Erreur:', physioError)
  } else {
    console.log(`✅ ${physioData.length} exemples récupérés`)
    if (physioData.length > 0) {
      console.log('\n📊 Colonnes disponibles:')
      console.log(Object.keys(physioData[0]).join(', '))
      
      console.log('\n📝 Exemples de données:')
      physioData.forEach((row, i) => {
        console.log(`\nÉtudiant ${i + 1}:`)
        console.log(`  - id: ${row.id}`)
        console.log(`  - user_id: ${row.user_id}`)
        console.log(`  - firebase_id: ${row.firebase_id || 'N/A'}`)
        console.log(`  - class: ${row.class}`)
        
        // Chercher toutes les colonnes qui pourraient contenir un email
        const possibleEmailFields = Object.keys(row).filter(key => 
          key.toLowerCase().includes('mail') || 
          key.toLowerCase().includes('email')
        )
        if (possibleEmailFields.length > 0) {
          possibleEmailFields.forEach(field => {
            console.log(`  - ${field}: ${row[field]}`)
          })
        } else {
          console.log(`  - email: ❌ AUCUNE COLONNE EMAIL TROUVÉE`)
        }
      })
    }
  }
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  // 3. Tester les correspondances possibles
  console.log('🔗 ANALYSE DES CORRESPONDANCES POSSIBLES')
  console.log('─'.repeat(80))
  
  const { data: allProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, firebase_id, email')
    .limit(10)
  
  const { data: allPhysio } = await supabase
    .from('StudentsPhysio')
    .select('user_id, firebase_id')
    .limit(10)
  
  if (allProfiles && allPhysio) {
    // Test correspondance par user_id
    const matchByUserId = allProfiles.filter(p => 
      allPhysio.some(ph => ph.user_id === p.user_id)
    )
    console.log(`\n✅ Correspondances par user_id: ${matchByUserId.length}/${allProfiles.length}`)
    
    // Test correspondance par firebase_id
    const matchByFirebaseId = allProfiles.filter(p => 
      p.firebase_id && allPhysio.some(ph => ph.firebase_id === p.firebase_id)
    )
    console.log(`✅ Correspondances par firebase_id: ${matchByFirebaseId.length}/${allProfiles.length}`)
    
    if (matchByUserId.length > 0) {
      console.log('\n📌 Exemple de correspondance par user_id:')
      const example = matchByUserId[0]
      const physioMatch = allPhysio.find(ph => ph.user_id === example.user_id)
      console.log(`  user_profiles: ${example.user_id} (${example.email})`)
      console.log(`  StudentsPhysio: ${physioMatch.user_id}`)
    }
    
    if (matchByFirebaseId.length > 0) {
      console.log('\n📌 Exemple de correspondance par firebase_id:')
      const example = matchByFirebaseId[0]
      const physioMatch = allPhysio.find(ph => ph.firebase_id === example.firebase_id)
      console.log(`  user_profiles: ${example.firebase_id} (${example.email})`)
      console.log(`  StudentsPhysio: ${physioMatch.firebase_id}`)
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ Diagnostic terminé!\n')
}

diagnosticTables().catch(console.error)
