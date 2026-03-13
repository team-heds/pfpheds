// Restore the 18 pre-assigned students that should exist in student_result_vote for PFP4
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const c = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// The 18 pre-assigned from the user's screenshot
const preAssigned = [
  { nom: 'Fuhrer', prenom: 'Nina', place: 'Neuro', institution: 'Rehaklinik Bellikon' },
  { nom: 'Coty', prenom: 'Alexis', place: null, institution: null },
  { nom: 'Palthey', prenom: 'Barbara', place: 'Neuro', institution: 'Schweizer Paraplegiker-Zentrum Nottwil' },
  { nom: 'Rey', prenom: 'Lucie', place: 'Ortho', institution: 'Hôpital du Valais (HVS) - site de Martigny' },
  { nom: 'Geier', prenom: 'Jana', place: 'Neuro', institution: 'Rehaklinik Zihlschlacht' },
  { nom: 'Menoud', prenom: 'Rosalie', place: 'Chir viscerale, ORL et thoracique -', institution: 'Hôpital du Valais (HVS) - site de Sion' },
  { nom: 'Ruf', prenom: 'Maelle', place: 'Ortho', institution: 'Leukerbad Clinic' },
  { nom: 'Markianos', prenom: 'Alexis', place: 'Rehab - Sport', institution: 'Centre Européen de Rééducation du Sportif (CERS)' },
  { nom: 'Martig', prenom: 'Gauthier', place: 'Rehab - Sport', institution: 'Centre Européen de Rééducation du Sportif (CERS)' },
  { nom: 'Bonvin', prenom: 'Stella', place: 'Ortho - Med', institution: 'Berner Klinik Montana' },
  { nom: 'Depury', prenom: 'Romain', place: 'Ambu', institution: 'Movea - Sion' },
  { nom: 'Beguin', prenom: 'Nicolas', place: 'Rehab - Sport', institution: 'Centre Européen de Rééducation du Sportif (CERS)' },
  { nom: 'Bagnoud', prenom: 'Steve', place: 'Ambu', institution: 'Physiothérapie Ferrazzi GmbH' },
  { nom: 'Espincho Carneiro', prenom: 'Jose', place: 'Ortho - Med', institution: 'Luzerner Hohenklinik Montana' },
  { nom: 'Gapany', prenom: 'Caroline', place: 'Soins Intensifs', institution: 'Hôpital du Valais (HVS) - site de Sion' },
  { nom: 'Behrens', prenom: 'Laura', place: 'Ambu', institution: 'Physiotherapie Plaffeien' },
  { nom: 'Verhulst', prenom: 'Martin', place: 'Ortho', institution: 'Leukerbad Clinic' },
  { nom: 'Brix', prenom: 'Meline', place: 'Neuro - Ped', institution: 'Hôpital du Valais (HVS) - site de Sion' },
]

async function main() {
  // Get all profiles
  const { data: profiles } = await c.from('user_profiles').select('user_id, forname, family_name')
  
  // Get existing PFP4 assignments
  const { data: existing } = await c
    .from('student_result_vote')
    .select('user_id')
    .eq('pfp_type', 'PFP4')
    .eq('year', '2026')
  const existingSet = new Set(existing.map(a => a.user_id))
  
  // Get all places
  const { data: allPlaces } = await c.from('places').select('PlaceId, NomPlace, InstitutionId')
  const { data: allInst } = await c.from('institutions').select('InstitutionId, Name')
  const instMap = new Map(allInst.map(i => [i.InstitutionId, i.Name]))
  
  console.log(`Existants PFP4: ${existingSet.size}`)
  
  const toRestore = []
  
  for (const pa of preAssigned) {
    // Find user
    const profile = profiles.find(p => 
      p.family_name && p.family_name.toLowerCase().includes(pa.nom.toLowerCase().split(' ')[0]) &&
      p.forname && p.forname.toLowerCase().includes(pa.prenom.toLowerCase())
    )
    if (!profile) {
      console.log(`⚠️ Profil non trouvé: ${pa.nom} ${pa.prenom}`)
      continue
    }
    
    if (existingSet.has(profile.user_id)) {
      console.log(`✅ EXISTE: ${pa.nom} ${pa.prenom}`)
      continue
    }
    
    // Find place
    let placeId = null
    let placeName = pa.place
    let instName = pa.institution
    
    if (pa.place && pa.institution) {
      const inst = allInst.find(i => i.Name && i.Name.includes(pa.institution.substring(0, 20)))
      if (inst) {
        const place = allPlaces.find(p => 
          p.InstitutionId === inst.InstitutionId && 
          p.NomPlace && p.NomPlace.includes(pa.place.substring(0, 10))
        )
        if (place) {
          placeId = place.PlaceId
          placeName = place.NomPlace
          instName = inst.Name
        }
      }
    }
    
    console.log(`🔄 MANQUE: ${pa.nom} ${pa.prenom} → ${placeName} | ${instName} | PlaceId: ${placeId}`)
    
    toRestore.push({
      user_id: profile.user_id,
      pfp_type: 'PFP4',
      year: '2026',
      assigned_place_id: placeId,
      assigned_place_name: placeName,
      assigned_institution_name: instName,
      assigned_rank: 0,
      algorithm_version: '1.0',
      status: 'draft',
      notes: `Manuel — manual assignment (restored)`,
      assigned_at: new Date().toISOString()
    })
  }
  
  if (toRestore.length === 0) {
    console.log('\n✅ Tous les 18 pré-assignés sont déjà en DB')
    process.exit(0)
  }
  
  console.log(`\n🔄 Restauration de ${toRestore.length} pré-assignés...`)
  
  const { data, error } = await c
    .from('student_result_vote')
    .upsert(toRestore, { onConflict: 'user_id,pfp_type,year' })
  
  if (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
  
  console.log(`✅ ${toRestore.length} pré-assignés restaurés`)
  
  // Verify
  const { data: final } = await c
    .from('student_result_vote')
    .select('user_id, assigned_place_name, assigned_institution_name')
    .eq('pfp_type', 'PFP4')
    .eq('year', '2026')
  console.log(`\nTotal PFP4 2026 maintenant: ${final.length}`)
  
  process.exit(0)
}

main().catch(err => { console.error('❌', err); process.exit(1) })
