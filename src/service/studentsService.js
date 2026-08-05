    /**
 * Service Étudi ants - Source unique Supabase
 * Gère TOUS les étudiants depuis user_profiles
 * Date: 28/11/2025
 */

import { supabase } from '@/supabase'
import { filterStudentProfiles, isStudentProfile } from '@/utils/userAudience'

function invalidateStudentsCache() {
  if (!getAllStudents.__cache) return
  getAllStudents.__cache.at = 0
  getAllStudents.__cache.data = null
}

/**
 * Récupère les étudiants UNIQUEMENT depuis user_profiles (sans fusion avec studentPhysio)
 * Source unique et fiable pour les noms d'étudiants
 * @returns {Promise<Array>} Liste des étudiants avec infos complètes
 */
export async function getStudentsFromUserProfiles() {
  try {
    // Récupérer UNIQUEMENT depuis user_profiles
    const { data: userProfilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (profilesError) throw profilesError
    
    // Filtrer les étudiants
    const studentUsers = filterStudentProfiles(userProfilesData)
    
    if (import.meta.env && import.meta.env.DEV) console.log(`✅ ${studentUsers.length} étudiants chargés depuis user_profiles (source unique)`)
    
    // Retourner directement les données de user_profiles
    return studentUsers.map(user => ({
      // Champs de base (compatibilité)
      id: user.user_id,
      user_id: user.user_id,
      
      // Noms depuis user_profiles (colonnes officielles)
      display_name: user.display_name,
      forname: user.forname,
      family_name: user.family_name,
      
      // Classe
      Classe: user.classe,
      classe: user.classe,
      
      // Autres infos
      email: user.email,
      avatar_url: user.avatar_url,
      house_id: user.house_id,
      created_at: user.created_at,
      pfp_cohort: user.pfp_cohort,
      role: user.role,
      permissions: user.permissions,
      
      // Flag source
      source: 'user_profiles_only'
    }))
  } catch (error) {
    console.error('❌ Erreur lors du chargement depuis user_profiles:', error)
    return []
  }
}

/**
 * Récupère TOUS les étudiants depuis user_profiles (source unique)
 * Inclut BA22, BA23, BA24, BA25 et tous les futurs
 * @returns {Promise<Array>} Liste des étudiants avec infos complètes
 */
export async function getAllStudents() {
  // Cache simple + déduplication (évite les re-fetch en navigation)
  // NOTE: variables statiques sur le module
  if (!getAllStudents.__cache) {
    // Option A: on sait que la table physio correcte est StudentsPhysio
    getAllStudents.__cache = { at: 0, data: null, inFlight: null, physioTable: 'StudentsPhysio' }
  }

  const debug = (...args) => {
    if (import.meta.env && import.meta.env.DEV) console.log(...args)
  }

  const CACHE_TTL_MS = 5 * 60 * 1000
  const now = Date.now()

  if (getAllStudents.__cache.inFlight) {
    return await getAllStudents.__cache.inFlight
  }

  if (getAllStudents.__cache.data && (now - getAllStudents.__cache.at) < CACHE_TTL_MS) {
    return getAllStudents.__cache.data
  }

  getAllStudents.__cache.inFlight = (async () => {
    try {
      // 1. Récupérer depuis user_profiles (colonnes minimales avec fallbacks)
      const trySelectProfiles = async (selectStr) => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select(selectStr)
        return { data, error }
      }

      let userProfilesData = null
      let profilesError = null

      // Select "optimisé" (peut casser si colonnes absentes)
      // NOTE: seules ces colonnes existent dans user_profiles. sae et cas_particulier sont dans StudentsPhysio uniquement.
      const profilesSelectPreferred = 'user_id,firebase_id,email,role,permissions,is_active,family_name,forname,classe,pfp_cohort,display_name,avatar_url,house_id,created_at'
      const profilesSelectFallback = 'user_id,email,role,permissions,is_active,family_name,forname,classe,pfp_cohort'

      let resProfiles = await trySelectProfiles(profilesSelectPreferred)
      if (resProfiles.error) {
        debug('⚠️ user_profiles select preferred failed, retrying fallback fields:', resProfiles.error)
        resProfiles = await trySelectProfiles(profilesSelectFallback)
      }
      if (resProfiles.error) {
        debug('⚠️ user_profiles select fallback failed, retrying select(*)', resProfiles.error)
        resProfiles = await trySelectProfiles('*')
      }

      userProfilesData = resProfiles.data
      profilesError = resProfiles.error
      if (profilesError) throw profilesError

      // 2. Récupérer depuis studentPhysio (données spécifiques physio)
      let studentPhysioData = null
      let physioError = null

      // Option A: on ne probe plus, on utilise directement StudentsPhysio.
      // Select minimal basé sur les colonnes réellement présentes (vu dans les logs)
      const physioSelectPreferred = 'user_id,firebase_id,class,sae,cas_particulier,msq,sysint,neuroger,aigu,rehab,ambu,fr,de,canton'
      const physioSelectFallback = '*'

      const tryLoadPhysio = async (tableName) => {
        // Même logique: colonnes minimales si possible, sinon fallback *
        let res = await supabase.from(tableName).select(physioSelectPreferred)
        if (res.error) {
          debug(`⚠️ ${tableName} select preferred failed, retrying select(*)`, res.error)
          res = await supabase.from(tableName).select(physioSelectFallback)
        }
        return { data: res.data, error: res.error }
      }

      // Option A: usage direct de StudentsPhysio
      if (getAllStudents.__cache.physioTable) {
        const res = await tryLoadPhysio(getAllStudents.__cache.physioTable)
        if (!res.error) {
          studentPhysioData = res.data
        } else {
          // En Option A, si la table est indisponible, on continue sans physio
          physioError = res.error
        }
      }

      if (physioError) {
        debug('⚠️ Table StudentsPhysio non accessible:', physioError.message)
      }

      // Fusionner les deux sources
      const allUsers = userProfilesData || []
      const physioStudents = studentPhysioData || []
    
    // Filtrer les étudiants depuis user_profiles
    const studentUsers = filterStudentProfiles(allUsers)
    
      debug(`🔍 ${allUsers.length} users totaux, ${studentUsers.length} étudiants user_profiles`)
      debug(`🏥 ${physioStudents.length} étudiants dans studentPhysio`)
    
    // Créer un mapping user_id -> classe depuis StudentsPhysio pour enrichir user_profiles
    const userIdToClassMap = new Map()
    const emailToClassMap = new Map()
    
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
    
      debug(`🔑 ${userIdToClassMap.size} étudiants avec classe (par ID) dans StudentsPhysio`)
      debug(`📧 ${emailToClassMap.size} étudiants avec classe (par email) dans StudentsPhysio`)
    
    // Mapper user_profiles vers le format attendu
    const studentsFromProfiles = studentUsers.map(user => {
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
        || 'Non défini'
      
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
        pfp_cohort: user.pfp_cohort || null, // IMPORTANT: Cohorte PFP
        role: user.role,
        permissions: user.permissions,
        is_active: user.is_active,
        // Flag pour identifier la source
        source: 'user_profiles',
        // Source de la classe pour debug
        classeSource: classeSource
      }
    })
    
    // Log statistiques des sources de classes (dev only)
    if (import.meta.env && import.meta.env.DEV) {
      const classesSources = {
        fromStudentsPhysioById: studentsFromProfiles.filter(s => s.classeSource === 'StudentsPhysio (user_id)').length,
        fromStudentsPhysioByFirebaseId: studentsFromProfiles.filter(s => s.classeSource === 'StudentsPhysio (firebase_id)').length,
        fromUserProfiles: studentsFromProfiles.filter(s => s.classeSource === 'user_profiles').length,
        nonDefini: studentsFromProfiles.filter(s => s.classeSource === 'Non défini').length
      }
      debug(`📊 Sources des classes :`)
      debug(`   - ${classesSources.fromStudentsPhysioById} depuis StudentsPhysio (par user_id)`)
      debug(`   - ${classesSources.fromStudentsPhysioByFirebaseId} depuis StudentsPhysio (par firebase_id)`)
      debug(`   - ${classesSources.fromUserProfiles} depuis user_profiles`)
      debug(`   - ${classesSources.nonDefini} non défini`)
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
    const profileById = new Map()
    allUsers.forEach(profile => {
      if (profile.user_id) profileById.set(profile.user_id, profile)
      if (profile.firebase_id) profileById.set(profile.firebase_id, profile)
    })
    
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
      
      const linkedProfile = profileById.get(student.id) || profileById.get(student.firebase_id)
      const explicitlyNotStudent = linkedProfile && !isStudentProfile(linkedProfile)

      if (!alreadyExists && !explicitlyNotStudent) {
        allStudents.push(student)
      }
    })
    
      debug(`📚 ${allStudents.length} étudiants au total (${studentsFromProfiles.length} user_profiles + ${allStudents.length - studentsFromProfiles.length} studentPhysio uniques)`)

      getAllStudents.__cache.at = Date.now()
      getAllStudents.__cache.data = allStudents
      return allStudents
    } catch (error) {
      // Erreurs critiques toujours visibles
      console.error('❌ Erreur getAllStudents:', error)
      return []
    } finally {
      getAllStudents.__cache.inFlight = null
    }
  })()

  return await getAllStudents.__cache.inFlight
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
    
    if (!data || !isStudentProfile(data)) return null
    
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
    
    invalidateStudentsCache()
    if (import.meta.env && import.meta.env.DEV) console.log(`✅ Étudiant ${userId} mis à jour`)
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
    
    invalidateStudentsCache()
    if (import.meta.env && import.meta.env.DEV) console.log(`✅ Étudiant ${userId} archivé`)
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
    
    invalidateStudentsCache()
    if (import.meta.env && import.meta.env.DEV) console.log(`✅ Classe ${classe} assignée à ${userId}`)
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
    
    if (import.meta.env && import.meta.env.DEV) console.log('📊 Stats par classe:', stats)
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
      if (import.meta.env && import.meta.env.DEV) console.warn('⚠️ Création d\'utilisateur nécessite auth complète')
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
  if (import.meta.env.DEV) console.log('🔍 === DIAGNOSTIC DES TABLES SUPABASE ===\n')
  
  // 1. Analyser user_profiles
  if (import.meta.env.DEV) console.log('📋 TABLE: user_profiles')
  if (import.meta.env.DEV) console.log('─'.repeat(80))
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(5)
  
  if (profilesError) {
    console.error('❌ Erreur:', profilesError)
  } else {
    if (import.meta.env.DEV) console.log(`✅ ${profilesData.length} exemples récupérés`)
    if (profilesData.length > 0) {
      if (import.meta.env.DEV) console.log('\n📊 Colonnes disponibles:')
      if (import.meta.env.DEV) console.log(Object.keys(profilesData[0]).sort().join(', '))
      
      if (import.meta.env.DEV) console.log('\n📝 Exemples de données:')
      profilesData.slice(0, 3).forEach((row, i) => {
        if (import.meta.env.DEV) console.log(`\nÉtudiant ${i + 1}:`)
        if (import.meta.env.DEV) console.log(`  - user_id: ${row.user_id}`)
        if (import.meta.env.DEV) console.log(`  - firebase_id: ${row.firebase_id || 'N/A'}`)
        if (import.meta.env.DEV) console.log(`  - email: ${row.email}`)
        if (import.meta.env.DEV) console.log(`  - nom: ${row.family_name} ${row.forname}`)
        if (import.meta.env.DEV) console.log(`  - role: ${row.role}`)
        if (import.meta.env.DEV) console.log(`  - classe: ${row.classe || row.class || row.promotion || 'N/A'}`)
      })
    }
  }
  
  if (import.meta.env.DEV) console.log('\n' + '='.repeat(80) + '\n')
  
  // 2. Analyser StudentsPhysio
  if (import.meta.env.DEV) console.log('📋 TABLE: StudentsPhysio')
  if (import.meta.env.DEV) console.log('─'.repeat(80))
  
  const { data: physioData, error: physioError } = await supabase
    .from('StudentsPhysio')
    .select('*')
    .limit(5)
  
  if (physioError) {
    console.error('❌ Erreur:', physioError)
  } else {
    if (import.meta.env.DEV) console.log(`✅ ${physioData.length} exemples récupérés`)
    if (physioData.length > 0) {
      if (import.meta.env.DEV) console.log('\n📊 Colonnes disponibles:')
      if (import.meta.env.DEV) console.log(Object.keys(physioData[0]).sort().join(', '))
      
      if (import.meta.env.DEV) console.log('\n📝 Exemples de données:')
      physioData.slice(0, 3).forEach((row, i) => {
        if (import.meta.env.DEV) console.log(`\nÉtudiant ${i + 1}:`)
        if (import.meta.env.DEV) console.log(`  - id: ${row.id}`)
        if (import.meta.env.DEV) console.log(`  - user_id: ${row.user_id}`)
        if (import.meta.env.DEV) console.log(`  - firebase_id: ${row.firebase_id || 'N/A'}`)
        if (import.meta.env.DEV) console.log(`  - class: ${row.class}`)
        
        // Afficher toutes les colonnes
        if (import.meta.env.DEV) console.log(`  - Toutes les données:`, row)
      })
    }
  }
  
  if (import.meta.env.DEV) console.log('\n' + '='.repeat(80) + '\n')
  
  // 3. Tester les correspondances possibles
  if (import.meta.env.DEV) console.log('🔗 ANALYSE DES CORRESPONDANCES POSSIBLES')
  if (import.meta.env.DEV) console.log('─'.repeat(80))
  
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
    if (import.meta.env.DEV) console.log(`\n✅ Correspondances par user_id: ${matchByUserId.length}/${allProfiles.length}`)
    
    // Test correspondance par firebase_id
    const matchByFirebaseId = allProfiles.filter(p => 
      p.firebase_id && allPhysio.some(ph => ph.firebase_id === p.firebase_id)
    )
    if (import.meta.env.DEV) console.log(`✅ Correspondances par firebase_id: ${matchByFirebaseId.length}/${allProfiles.length}`)
    
    if (matchByUserId.length > 0) {
      if (import.meta.env.DEV) console.log('\n📌 Exemple de correspondance par user_id:')
      const example = matchByUserId[0]
      const physioMatch = allPhysio.find(ph => ph.user_id === example.user_id)
      if (import.meta.env.DEV) console.log(`  user_profiles: ${example.user_id} (${example.email})`)
      if (import.meta.env.DEV) console.log(`  StudentsPhysio: ${physioMatch.user_id}`)
    }
    
    if (matchByFirebaseId.length > 0) {
      if (import.meta.env.DEV) console.log('\n📌 Exemple de correspondance par firebase_id:')
      const example = matchByFirebaseId[0]
      const physioMatch = allPhysio.find(ph => ph.firebase_id === example.firebase_id)
      if (import.meta.env.DEV) console.log(`  user_profiles: ${example.firebase_id} (${example.email})`)
      if (import.meta.env.DEV) console.log(`  StudentsPhysio: ${physioMatch.firebase_id}`)
    }
  }
  
  if (import.meta.env.DEV) console.log('\n' + '='.repeat(80))
  if (import.meta.env.DEV) console.log('✅ Diagnostic terminé!\n')
  
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
