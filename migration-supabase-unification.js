/**
 * 🔄 SCRIPT DE MIGRATION : Unification des données étudiants
 * 
 * Ce script va :
 * 1. Mettre à jour user_profiles avec les classes de StudentsPhysio
 * 2. Créer les user_profiles manquants pour les comptes Auth orphelins
 * 3. Nettoyer les références Firebase (obsolètes)
 * 4. Valider la cohérence des données
 * 
 * IMPORTANT : Exécuter dans la console du navigateur après connexion
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 📊 Étape 1 : Analyse de la situation actuelle
 */
async function analyzeCurrentState() {
  console.log('🔍 === ANALYSE DE LA SITUATION ACTUELLE ===\n')
  
  // Compter les utilisateurs Auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  console.log(`👥 Utilisateurs Supabase Auth: ${authUsers?.users?.length || 0}`)
  
  // Compter les user_profiles
  const { count: profilesCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
  console.log(`📋 user_profiles existants: ${profilesCount}`)
  
  // Compter StudentsPhysio
  const { count: physioCount } = await supabase
    .from('StudentsPhysio')
    .select('*', { count: 'exact', head: true })
  console.log(`🏥 StudentsPhysio: ${physioCount}`)
  
  // Étudiants avec classe incorrecte (BA25 par défaut)
  const { count: incorrectCount } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('classe', 'BA25')
    .eq('role', 'student')
  console.log(`❌ Étudiants avec classe incorrecte (BA25): ${incorrectCount}`)
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  return { authUsers, profilesCount, physioCount, incorrectCount }
}

/**
 * 🔄 Étape 2 : Mettre à jour les user_profiles existants
 */
async function updateExistingProfiles() {
  console.log('🔄 === MISE À JOUR DES PROFILS EXISTANTS ===\n')
  
  let updatedCount = 0
  let errors = []
  
  // Récupérer tous les étudiants de StudentsPhysio
  const { data: physioStudents, error: physioError } = await supabase
    .from('StudentsPhysio')
    .select('*')
  
  if (physioError) {
    console.error('❌ Erreur récupération StudentsPhysio:', physioError)
    return { updatedCount: 0, errors: [physioError] }
  }
  
  console.log(`📥 ${physioStudents.length} étudiants à traiter depuis StudentsPhysio\n`)
  
  // Pour chaque étudiant StudentsPhysio
  for (const student of physioStudents) {
    try {
      // Trouver le user_profile correspondant (par user_id ou firebase_id)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`user_id.eq.${student.user_id},firebase_id.eq.${student.firebase_id}`)
        .single()
      
      if (existingProfile) {
        // Mettre à jour le profil existant
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            classe: student.class, // Classe correcte depuis StudentsPhysio
            sae: student.sae || false,
            metadata: {
              ...(existingProfile.metadata || {}),
              physio_data: {
                aigu: student.aigu,
                ambu: student.ambu,
                msq: student.msq,
                neuroger: student.neuroger,
                rehab: student.rehab,
                sysint: student.sysint,
                pfp1a: student.pfp1a,
                pfp_valided: student.pfp_valided,
                pfp_2: student.pfp_2,
                canton: student.canton,
                all_lang: student.all_lang
              },
              migrated_from_studentsphysio: true,
              migration_date: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('user_id', existingProfile.user_id)
        
        if (updateError) {
          errors.push({ student: student.user_id, error: updateError })
        } else {
          updatedCount++
          if (updatedCount % 10 === 0) {
            console.log(`✅ ${updatedCount} profils mis à jour...`)
          }
        }
      }
    } catch (err) {
      errors.push({ student: student.user_id, error: err })
    }
  }
  
  console.log(`\n✅ ${updatedCount} profils mis à jour avec succès`)
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} erreurs rencontrées:`, errors.slice(0, 5))
  }
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  return { updatedCount, errors }
}

/**
 * 🆕 Étape 3 : Créer les user_profiles manquants
 */
async function createMissingProfiles() {
  console.log('🆕 === CRÉATION DES PROFILS MANQUANTS ===\n')
  
  let createdCount = 0
  let errors = []
  
  // Récupérer les étudiants StudentsPhysio sans user_profile
  const { data: physioStudents } = await supabase
    .from('StudentsPhysio')
    .select('*')
  
  const { data: existingProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, firebase_id')
  
  const existingIds = new Set([
    ...existingProfiles.map(p => p.user_id),
    ...existingProfiles.map(p => p.firebase_id).filter(Boolean)
  ])
  
  // Filtrer les orphelins
  const orphans = physioStudents.filter(s => 
    !existingIds.has(s.user_id) && !existingIds.has(s.firebase_id)
  )
  
  console.log(`📥 ${orphans.length} profils à créer\n`)
  
  if (orphans.length === 0) {
    console.log('✅ Aucun profil orphelin trouvé\n')
    return { createdCount: 0, errors: [] }
  }
  
  // Récupérer les utilisateurs Auth pour avoir les emails
  const { data: authData } = await supabase.auth.admin.listUsers()
  const authUsersMap = new Map(authData.users.map(u => [u.id, u]))
  
  // Créer les profils manquants
  for (const student of orphans) {
    try {
      // Trouver l'utilisateur Auth correspondant
      const authUser = authUsersMap.get(student.user_id) || 
                      Array.from(authUsersMap.values()).find(u => 
                        u.user_metadata?.firebase_id === student.firebase_id
                      )
      
      if (!authUser) {
        errors.push({ 
          student: student.user_id, 
          error: 'Compte Auth introuvable' 
        })
        continue
      }
      
      // Extraire nom/prénom de l'email ou des métadonnées
      const email = authUser.email
      const [forname, family_name] = extractNameFromEmail(email, authUser.user_metadata)
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: student.user_id,
          firebase_id: student.firebase_id,
          email: email,
          family_name: family_name,
          forname: forname,
          display_name: `${forname} ${family_name}`,
          role: 'student',
          classe: student.class,
          sae: student.sae || false,
          is_active: true,
          metadata: {
            physio_data: {
              aigu: student.aigu,
              ambu: student.ambu,
              msq: student.msq,
              neuroger: student.neuroger,
              rehab: student.rehab,
              sysint: student.sysint,
              pfp1a: student.pfp1a,
              pfp_valided: student.pfp_valided,
              pfp_2: student.pfp_2,
              canton: student.canton
            },
            created_from_migration: true,
            migration_date: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        errors.push({ student: student.user_id, error: insertError })
      } else {
        createdCount++
        if (createdCount % 10 === 0) {
          console.log(`✅ ${createdCount} profils créés...`)
        }
      }
    } catch (err) {
      errors.push({ student: student.user_id, error: err })
    }
  }
  
  console.log(`\n✅ ${createdCount} profils créés avec succès`)
  if (errors.length > 0) {
    console.warn(`⚠️ ${errors.length} erreurs rencontrées:`, errors.slice(0, 5))
  }
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  return { createdCount, errors }
}

/**
 * 🧹 Étape 4 : Nettoyer les références Firebase (optionnel)
 */
async function cleanupFirebaseReferences() {
  console.log('🧹 === NETTOYAGE FIREBASE (OPTIONNEL) ===\n')
  
  console.log('ℹ️ Cette étape peut être faite plus tard si besoin')
  console.log('ℹ️ Pour le moment, on garde firebase_id pour la compatibilité\n')
  
  // Pour plus tard, si tu veux vraiment tout nettoyer :
  // await supabase.from('user_profiles').update({ firebase_id: null })
  
  console.log('✅ firebase_id conservé pour compatibilité\n')
  console.log('='.repeat(80) + '\n')
}

/**
 * ✅ Étape 5 : Validation finale
 */
async function validateMigration() {
  console.log('✅ === VALIDATION FINALE ===\n')
  
  // Compter les étudiants par classe
  const { data: classStats } = await supabase
    .from('user_profiles')
    .select('classe')
    .eq('role', 'student')
  
  const classCounts = classStats.reduce((acc, s) => {
    acc[s.classe] = (acc[s.classe] || 0) + 1
    return acc
  }, {})
  
  console.log('📊 Répartition par classe:')
  Object.entries(classCounts).sort().forEach(([classe, count]) => {
    console.log(`   ${classe}: ${count} étudiants`)
  })
  
  // Vérifier les doublons
  const { data: allProfiles } = await supabase
    .from('user_profiles')
    .select('user_id, email')
  
  const emails = allProfiles.map(p => p.email)
  const duplicates = emails.filter((e, i) => emails.indexOf(e) !== i)
  
  if (duplicates.length > 0) {
    console.warn(`\n⚠️ ${duplicates.length} emails en doublon trouvés`)
  } else {
    console.log('\n✅ Aucun doublon détecté')
  }
  
  // Compter les profils avec données physio
  const { count: withPhysioData } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .not('metadata->physio_data', 'is', null)
  
  console.log(`\n✅ ${withPhysioData} profils enrichis avec données physio`)
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  return { classCounts, duplicates, withPhysioData }
}

/**
 * 🔧 Fonction utilitaire : Extraire nom/prénom de l'email
 */
function extractNameFromEmail(email, metadata = {}) {
  // Priorité aux métadonnées si disponibles
  if (metadata.family_name && metadata.forname) {
    return [metadata.forname, metadata.family_name]
  }
  
  // Sinon extraire de l'email (prenom.nom@students.hevs.ch)
  const [localPart] = email.split('@')
  const [forname = 'Étudiant', family_name = 'HEVS'] = localPart.split('.')
  
  return [
    capitalize(forname),
    capitalize(family_name)
  ]
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 🚀 FONCTION PRINCIPALE
 */
export async function runMigration() {
  console.log('\n'.repeat(2))
  console.log('🚀 '.repeat(40))
  console.log('🚀 MIGRATION UNIFICATION SUPABASE - DÉBUT')
  console.log('🚀 '.repeat(40))
  console.log('\n')
  
  const startTime = Date.now()
  
  try {
    // Étape 1 : Analyse
    const analysis = await analyzeCurrentState()
    
    // Confirmation
    console.log('⚠️  ATTENTION : Cette migration va modifier la base de données')
    console.log('⚠️  Assurez-vous d\'avoir un backup avant de continuer\n')
    
    // Étape 2 : Mise à jour des profils existants
    const updateResult = await updateExistingProfiles()
    
    // Étape 3 : Création des profils manquants
    const createResult = await createMissingProfiles()
    
    // Étape 4 : Nettoyage (optionnel)
    await cleanupFirebaseReferences()
    
    // Étape 5 : Validation
    const validation = await validateMigration()
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('🎉 '.repeat(40))
    console.log('🎉 MIGRATION TERMINÉE AVEC SUCCÈS !')
    console.log('🎉 '.repeat(40))
    console.log(`\n⏱️  Durée: ${duration}s\n`)
    console.log(`📊 Résumé:`)
    console.log(`   - ${updateResult.updatedCount} profils mis à jour`)
    console.log(`   - ${createResult.createdCount} profils créés`)
    console.log(`   - ${validation.withPhysioData} profils avec données physio`)
    console.log(`   - ${Object.keys(validation.classCounts).length} classes différentes`)
    
    return {
      success: true,
      duration,
      updateResult,
      createResult,
      validation
    }
  } catch (error) {
    console.error('\n❌ ERREUR PENDANT LA MIGRATION:', error)
    return {
      success: false,
      error
    }
  }
}

// Exposer la fonction globalement pour l'exécuter depuis la console
if (typeof window !== 'undefined') {
  window.runMigration = runMigration
  window.analyzeCurrentState = analyzeCurrentState
}

export default {
  runMigration,
  analyzeCurrentState,
  updateExistingProfiles,
  createMissingProfiles,
  validateMigration
}
