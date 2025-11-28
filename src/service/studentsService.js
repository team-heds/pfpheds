/**
 * Service Étudi ants - Source unique Supabase
 * Gère TOUS les étudiants depuis user_profiles
 * Date: 28/11/2025
 */

import { supabase } from '@/supabase'

/**
 * Récupère TOUS les étudiants depuis user_profiles (source unique)
 * Inclut BA22, BA23, BA24, BA25 et tous les futurs
 * @returns {Promise<Array>} Liste des étudiants avec infos complètes
 */
export async function getAllStudents() {
  try {
    // 1. Récupérer depuis user_profiles
    const { data: userProfilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (profilesError) throw profilesError
    
    // 2. Récupérer depuis studentPhysio (données spécifiques physio)
    // Essayer plusieurs variantes de noms de table
    let studentPhysioData = null
    let physioError = null
    
    const tableVariants = ['studentPhysio', 'student_physio', 'students_physio', 'StudentsPhysio']
    
    for (const tableName of tableVariants) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
      
      if (!error) {
        studentPhysioData = data
        console.log(`✅ Table trouvée: ${tableName}`)
        break
      } else if (error.message.includes('does not exist')) {
        console.log(`❌ Table ${tableName} n'existe pas`)
      } else {
        physioError = error
        break
      }
    }
    
    // Ne pas throw si la table n'existe pas, juste logger
    if (physioError) {
      console.warn('⚠️ Table studentPhysio non accessible:', physioError.message)
    }
    
    // Fusionner les deux sources
    const allUsers = userProfilesData || []
    const physioStudents = studentPhysioData || []
    
    // Filtrer les étudiants depuis user_profiles
    const studentUsers = allUsers.filter(user => {
      const role = (user.role || '').toLowerCase()
      const email = (user.email || '').toLowerCase()
      
      // Considérer comme étudiant si:
      // 1. Le rôle contient "student" ou "etudiant"
      // 2. OU l'email est @students.hevs.ch
      return (
        role.includes('student') ||
        role.includes('etudiant') ||
        role.includes('étudiant') ||
        email.includes('@students.hevs.ch')
      )
    })
    
    console.log(`🔍 ${allUsers.length} users totaux, ${studentUsers.length} étudiants user_profiles`)
    console.log(`🏥 ${physioStudents.length} étudiants dans studentPhysio`)
    
    // Créer un mapping user_id -> classe depuis StudentsPhysio pour enrichir user_profiles
    const userIdToClassMap = new Map()
    const emailToClassMap = new Map()
    
    // DEBUG : vérifier les emails disponibles
    console.log(`🔍 Échantillon étudiants StudentsPhysio (premiers 3):`)
    physioStudents.slice(0, 3).forEach(student => {
      console.log(`   - Mail: "${student.Mail}", email: "${student.email}", mail: "${student.mail}", class: "${student.class}"`)
    })
    
    physioStudents.forEach(student => {
      const classe = student.class 
        || student.Class 
        || student.Classe 
        || student.classe
        || student.promotion
        || student.year
        || student.annee
      
      if (classe) {
        // Mapping par user_id (prioritaire)
        if (student.user_id) {
          userIdToClassMap.set(student.user_id, classe)
        }
        
        // Mapping par firebase_id (fallback)
        if (student.firebase_id) {
          userIdToClassMap.set(student.firebase_id, classe)
        }
        
        // Mapping par email (fallback)
        const email = (student.Mail || student.email || student.mail || '').toLowerCase()
        if (email) {
          emailToClassMap.set(email, classe)
        }
      }
    })
    
    console.log(`🔑 ${userIdToClassMap.size} étudiants avec classe (par ID) dans StudentsPhysio`)
    console.log(`📧 ${emailToClassMap.size} étudiants avec classe (par email) dans StudentsPhysio`)
    
    // DEBUG : Afficher un échantillon pour comprendre le format des IDs
    if (userIdToClassMap.size > 0) {
      const sampleIdsWithClasse = Array.from(userIdToClassMap.entries()).slice(0, 3)
      console.log(`🔍 Échantillon IDs dans StudentsPhysio (ID → Classe):`)
      sampleIdsWithClasse.forEach(([id, classe]) => {
        console.log(`   - ID: "${id}" (type: ${typeof id}) → Classe: ${classe}`)
      })
    }
    if (studentUsers.length > 0) {
      const sampleUsers = studentUsers.slice(0, 3)
      console.log(`🔍 Échantillon IDs dans user_profiles:`)
      sampleUsers.forEach(u => {
        console.log(`   - ID: "${u.user_id}" (type: ${typeof u.user_id}), Email: ${u.email}`)
      })
    }
    
    // Mapper user_profiles vers le format attendu
    const studentsFromProfiles = studentUsers.map(user => {
      const userEmail = (user.email || '').toLowerCase()
      
      // Essayer de récupérer la classe depuis (ORDRE DE PRIORITÉ) :
      // 1. StudentsPhysio via user_id (source fiable avec BA23/BA24/BA25)
      // 2. StudentsPhysio via firebase_id (fallback)
      // 3. user_profiles seulement si pas trouvé ailleurs
      const classeFromPhysioById = userIdToClassMap.get(user.user_id)
      const classeFromPhysioByFirebaseId = user.firebase_id ? userIdToClassMap.get(user.firebase_id) : null
      const classeFromUserProfiles = user.classe || user.class || user.promotion
      
      const classe = classeFromPhysioById 
        || classeFromPhysioByFirebaseId
        || classeFromUserProfiles
        || 'BA25'  // Valeur par défaut si rien n'est trouvé
      
      // Déterminer la source de la classe pour debug
      let classeSource = 'Non défini'
      if (classeFromPhysioById) {
        classeSource = 'StudentsPhysio (user_id)'
      } else if (classeFromPhysioByFirebaseId) {
        classeSource = 'StudentsPhysio (firebase_id)'
      } else if (classeFromUserProfiles) {
        classeSource = 'user_profiles'
      }
      
      return {
        id: user.user_id,
        Nom: user.family_name || 'Nom non disponible',
        Prenom: user.forname || 'Prénom non disponible',
        Mail: user.email || 'Email non disponible',
        Classe: classe,
        SAE: user.sae === true || user.cas_particulier === 'true',
        // Champs supplémentaires
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        house_id: user.house_id,
        created_at: user.created_at,
        // Flag pour identifier la source
        source: 'user_profiles',
        // Source de la classe pour debug
        classeSource: classeSource
      }
    })
    
    // Log statistiques des sources de classes
    const classesSources = {
      fromStudentsPhysioById: studentsFromProfiles.filter(s => s.classeSource === 'StudentsPhysio (user_id)').length,
      fromStudentsPhysioByFirebaseId: studentsFromProfiles.filter(s => s.classeSource === 'StudentsPhysio (firebase_id)').length,
      fromUserProfiles: studentsFromProfiles.filter(s => s.classeSource === 'user_profiles').length,
      nonDefini: studentsFromProfiles.filter(s => s.classeSource === 'Non défini').length
    }
    console.log(`📊 Sources des classes :`)
    console.log(`   - ${classesSources.fromStudentsPhysioById} depuis StudentsPhysio (par user_id)`)
    console.log(`   - ${classesSources.fromStudentsPhysioByFirebaseId} depuis StudentsPhysio (par firebase_id)`)
    console.log(`   - ${classesSources.fromUserProfiles} depuis user_profiles`)
    console.log(`   - ${classesSources.nonDefini} non défini`)
    
    // Log pour debug : voir les colonnes disponibles dans studentPhysio
    if (physioStudents.length > 0) {
      console.log('🔍 Colonnes dans studentPhysio:', Object.keys(physioStudents[0]))
    }
    
    // Mapper studentPhysio vers le format attendu
    const studentsFromPhysio = physioStudents.map(student => {
      // Essayer toutes les variantes possibles pour la classe
      const classe = student.Class 
        || student.Classe 
        || student.classe 
        || student.class
        || student.promotion
        || student.year
        || student.annee
        || 'Non défini'
      
      return {
        id: student.user_id || student.id,  // Utiliser user_id en priorité pour le lien avec user_profiles
        Nom: student.Nom || student.family_name || student.nom || 'Nom non disponible',
        Prenom: student.Prenom || student.forname || student.prenom || 'Prénom non disponible',
        Mail: student.Mail || student.email || student.mail || 'Email non disponible',
        Classe: classe,
        SAE: student.SAE === true || student.CasParticulier === 'true' || student.sae === true || student.cas_particulier === 'true',
        // Champs supplémentaires
        firebase_id: student.firebase_id,
        // Champs bruts pour debug
        _rawData: student,
        // Flag pour identifier la source
        source: 'studentPhysio',
        classeSource: 'StudentsPhysio'
      }
    })
    
    // Fusionner les deux sources (éviter les doublons par user_id/firebase_id)
    const allStudents = [...studentsFromProfiles]
    
    // Créer un Set des IDs existants dans user_profiles (user_id + firebase_id)
    const existingIds = new Set()
    studentsFromProfiles.forEach(s => {
      existingIds.add(s.id) // user_id
      // Ajouter aussi le firebase_id si présent
      const profile = studentUsers.find(u => u.user_id === s.id)
      if (profile && profile.firebase_id) {
        existingIds.add(profile.firebase_id)
      }
    })
    
    // Ajouter les étudiants de StudentsPhysio qui ne sont pas déjà dans user_profiles
    studentsFromPhysio.forEach(student => {
      // Vérifier si l'étudiant existe déjà (par user_id OU firebase_id)
      const alreadyExists = existingIds.has(student.id) || 
                           (student.firebase_id && existingIds.has(student.firebase_id))
      
      if (!alreadyExists) {
        allStudents.push(student)
      }
    })
    
    console.log(`📚 ${allStudents.length} étudiants au total (${studentsFromProfiles.length} user_profiles + ${allStudents.length - studentsFromProfiles.length} studentPhysio uniques)`)
    
    return allStudents
  } catch (error) {
    console.error('❌ Erreur getAllStudents:', error)
    return []
  }
}

/**
 * Récupère un étudiant par son ID
 * @param {string} userId - ID de l'étudiant
 * @returns {Promise<Object|null>} Étudiant ou null
 */
export async function getStudentById(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    
    if (!data) return null
    
    return {
      id: data.user_id,
      Nom: data.family_name || '',
      Prenom: data.forname || '',
      Mail: data.email || '',
      Classe: data.metadata?.classe || data.metadata?.class || '',
      SAE: data.metadata?.SAE === true,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      house_id: data.house_id,
      metadata: data.metadata,
      source: 'supabase'
    }
  } catch (error) {
    console.error('❌ Erreur getStudentById:', error)
    return null
  }
}

/**
 * Met à jour un étudiant
 * @param {string} userId - ID de l'étudiant
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<boolean>} Succès ou échec
 */
export async function updateStudent(userId, updates) {
  try {
    // Préparer les données pour Supabase
    const supabaseUpdates = {
      ...(updates.Nom && { family_name: updates.Nom }),
      ...(updates.Prenom && { forname: updates.Prenom }),
      ...(updates.Mail && { email: updates.Mail }),
      metadata: {
        ...updates.metadata,
        ...(updates.Classe && { classe: updates.Classe, class: updates.Classe }),
        ...(updates.SAE !== undefined && { SAE: updates.SAE })
      }
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .update(supabaseUpdates)
      .eq('user_id', userId)
    
    if (error) throw error
    
    console.log(`✅ Étudiant ${userId} mis à jour`)
    return true
  } catch (error) {
    console.error('❌ Erreur updateStudent:', error)
    return false
  }
}

/**
 * Supprime un étudiant (soft delete - change le rôle)
 * @param {string} userId - ID de l'étudiant
 * @returns {Promise<boolean>} Succès ou échec
 */
export async function deleteStudent(userId) {
  try {
    // Soft delete: changer le rôle au lieu de supprimer
    const { error } = await supabase
      .from('user_profiles')
      .update({
        role: 'archived_student',
        metadata: {
          archived_at: new Date().toISOString(),
          archived_reason: 'Supprimé depuis interface admin'
        }
      })
      .eq('user_id', userId)
    
    if (error) throw error
    
    console.log(`✅ Étudiant ${userId} archivé`)
    return true
  } catch (error) {
    console.error('❌ Erreur deleteStudent:', error)
    return false
  }
}

/**
 * Ajoute une classe à un étudiant
 * @param {string} userId - ID de l'étudiant
 * @param {string} classe - Classe (BA22, BA23, BA24, BA25, etc.)
 * @returns {Promise<boolean>} Succès ou échec
 */
export async function assignClass(userId, classe) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        metadata: {
          classe: classe,
          class: classe, // Rétrocompatibilité
          assigned_at: new Date().toISOString()
        }
      })
      .eq('user_id', userId)
    
    if (error) throw error
    
    console.log(`✅ Classe ${classe} assignée à ${userId}`)
    return true
  } catch (error) {
    console.error('❌ Erreur assignClass:', error)
    return false
  }
}

/**
 * Récupère les statistiques par classe
 * @returns {Promise<Object>} Stats par classe
 */
export async function getClassStats() {
  try {
    const students = await getAllStudents()
    
    const stats = {}
    students.forEach(student => {
      const classe = student.Classe || 'Non défini'
      stats[classe] = (stats[classe] || 0) + 1
    })
    
    console.log('📊 Stats par classe:', stats)
    return stats
  } catch (error) {
    console.error('❌ Erreur getClassStats:', error)
    return {}
  }
}

/**
 * Récupère les étudiants d'une classe spécifique
 * @param {string} classe - Classe (BA22, BA23, BA24, BA25)
 * @returns {Promise<Array>} Étudiants de la classe
 */
export async function getStudentsByClass(classe) {
  try {
    const allStudents = await getAllStudents()
    return allStudents.filter(s => s.Classe === classe)
  } catch (error) {
    console.error('❌ Erreur getStudentsByClass:', error)
    return []
  }
}

/**
 * Synchronise un étudiant Firebase vers Supabase
 * @param {Object} firebaseStudent - Données Firebase
 * @returns {Promise<boolean>} Succès ou échec
 */
export async function syncFirebaseStudent(firebaseStudent) {
  try {
    // Vérifier si l'étudiant existe déjà
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', firebaseStudent.Mail)
      .single()
    
    if (existing) {
      // Mettre à jour
      return await updateStudent(existing.user_id, firebaseStudent)
    } else {
      // Créer (nécessite authentification Firebase/Supabase)
      console.warn('⚠️ Création d\'utilisateur nécessite auth complète')
      return false
    }
  } catch (error) {
    console.error('❌ Erreur syncFirebaseStudent:', error)
    return false
  }
}

/**
 * Compte le nombre total d'étudiants
 * @returns {Promise<number>} Nombre d'étudiants
 */
export async function countStudents() {
  try {
    // Utiliser getAllStudents qui a le filtre flexible
    const students = await getAllStudents()
    return students.length
  } catch (error) {
    console.error('❌ Erreur countStudents:', error)
    return 0
  }
}

/**
 * Fonction de diagnostic pour analyser les tables et les correspondances
 * À appeler depuis la console: window.diagnosticTables()
 */
export async function diagnosticTables() {
  console.log('🔍 === DIAGNOSTIC DES TABLES SUPABASE ===\n')
  
  // 1. Analyser user_profiles
  console.log('📋 TABLE: user_profiles')
  console.log('─'.repeat(80))
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(5)
  
  if (profilesError) {
    console.error('❌ Erreur:', profilesError)
  } else {
    console.log(`✅ ${profilesData.length} exemples récupérés`)
    if (profilesData.length > 0) {
      console.log('\n📊 Colonnes disponibles:')
      console.log(Object.keys(profilesData[0]).sort().join(', '))
      
      console.log('\n📝 Exemples de données:')
      profilesData.slice(0, 3).forEach((row, i) => {
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
    .limit(5)
  
  if (physioError) {
    console.error('❌ Erreur:', physioError)
  } else {
    console.log(`✅ ${physioData.length} exemples récupérés`)
    if (physioData.length > 0) {
      console.log('\n📊 Colonnes disponibles:')
      console.log(Object.keys(physioData[0]).sort().join(', '))
      
      console.log('\n📝 Exemples de données:')
      physioData.slice(0, 3).forEach((row, i) => {
        console.log(`\nÉtudiant ${i + 1}:`)
        console.log(`  - id: ${row.id}`)
        console.log(`  - user_id: ${row.user_id}`)
        console.log(`  - firebase_id: ${row.firebase_id || 'N/A'}`)
        console.log(`  - class: ${row.class}`)
        
        // Afficher toutes les colonnes
        console.log(`  - Toutes les données:`, row)
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
    .limit(50)
  
  const { data: allPhysio } = await supabase
    .from('StudentsPhysio')
    .select('user_id, firebase_id')
    .limit(50)
  
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
  
  return {
    profilesCount: profilesData?.length || 0,
    physioCount: physioData?.length || 0,
    matchByUserId: allProfiles && allPhysio ? allProfiles.filter(p => 
      allPhysio.some(ph => ph.user_id === p.user_id)
    ).length : 0,
    matchByFirebaseId: allProfiles && allPhysio ? allProfiles.filter(p => 
      p.firebase_id && allPhysio.some(ph => ph.firebase_id === p.firebase_id)
    ).length : 0
  }
}

// Exposer la fonction de diagnostic globalement
if (typeof window !== 'undefined') {
  window.diagnosticTables = diagnosticTables
}

/**
 * Export par défaut
 */
export default {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  assignClass,
  getClassStats,
  getStudentsByClass,
  syncFirebaseStudent,
  countStudents,
  diagnosticTables
}
