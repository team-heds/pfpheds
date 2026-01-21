// Script pour vérifier et corriger les places qui n'ont pas d'institution
const { supabase } = require('../supabase')

async function fixPlacesInstitution() {
  try {
    console.log('🔍 Recherche des places sans institution...')
    
    // Récupérer toutes les places
    const { data: places, error } = await supabase
      .from('places')
      .select('PlaceId, NomPlace, InstitutionName, InstitutionId')
      .is('InstitutionName', null)
      .or('InstitutionName.eq.,InstitutionName.is.null')
    
    if (error) {
      console.error('Erreur lors de la récupération des places:', error)
      return
    }
    
    console.log(`📊 ${places?.length || 0} places trouvées sans institution`)
    
    if (!places || places.length === 0) {
      console.log('✅ Toutes les places ont une institution')
      return
    }
    
    // Récupérer les institutions pour faire la correspondance
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('id, InstitutionId, Name, name')
    
    if (instError) {
      console.error('Erreur lors de la récupération des institutions:', instError)
      return
    }
    
    console.log(`📚 ${institutions?.length || 0} institutions trouvées`)
    
    // Pour chaque place sans institution, essayer de la corriger
    for (const place of places) {
      console.log(`\n🔧 Traitement de la place: ${place.NomPlace} (${place.PlaceId})`)
      
      // Chercher une institution correspondante par InstitutionId
      if (place.InstitutionId) {
        const institution = institutions.find(inst => 
          inst.InstitutionId === place.InstitutionId || 
          inst.id === place.InstitutionId
        )
        
        if (institution) {
          const institutionName = institution.Name || institution.name
          console.log(`  ✅ Institution trouvée: ${institutionName}`)
          
          // Mettre à jour la place
          const { error: updateError } = await supabase
            .from('places')
            .update({ InstitutionName: institutionName })
            .eq('PlaceId', place.PlaceId)
          
          if (updateError) {
            console.error(`  ❌ Erreur mise à jour: ${updateError.message}`)
          } else {
            console.log(`  ✅ Place mise à jour avec succès`)
          }
        } else {
          console.log(`  ❌ Aucune institution trouvée pour InstitutionId: ${place.InstitutionId}`)
        }
      } else {
        console.log(`  ❌ Pas d'InstitutionId pour cette place`)
      }
    }
    
    console.log('\n🎉 Correction terminée!')
    
  } catch (error) {
    console.error('Erreur inattendue:', error)
  }
}

// Exécuter le script
fixPlacesInstitution()
