/**
 * @module adminDashboardService
 * @description Service Dashboard Admin — Stats globales multi-filières (SI/PHY).
 * Toutes les opérations d'écriture valident les entrées via useInputValidation.
 *
 * @function getGlobalStats() - Stats globales (modules, enseignants, RM par filière)
 * @function getAllTrackRoles() - Rôles par filière avec détails utilisateur
 * @function getModulesWithRM() - Modules avec leur responsable
 * @function assignTrackRole(userId, trackId, role, assignedBy) - Assigne un rôle (validé)
 * @function removeTrackRole(roleId) - Désactive un rôle (validé)
 * @function updateModuleRM(moduleId, responsableEmail) - Met à jour le RM d'un module (validé)
 * @function getUsersForRoleAssignment() - Liste des utilisateurs pour assignation
 * @function getTracks() - Filières disponibles
 * @function loadAdminDashboard() - Charge toutes les données du dashboard
 */
import { supabase } from '@/supabase'
import { validateEmail, validateId } from '@/composables/useInputValidation'
import { filterSITeacherProfiles } from '@/utils/userAudience'

/**
 * Récupère les stats globales par filière
 */
export async function getGlobalStats() {
  try {
    // Modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, track_id, responsable_email, year, credits')
    if (modulesError) throw modulesError
    const modList = modules || []

    // Cours
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })

    // Enseignants SI depuis user_profiles (rôle EnseignantSoins)
    const { data: siTeachers } = await supabase
      .from('user_profiles')
      .select('user_id, role, permissions, is_active')
      .or('role.eq.EnseignantSoins,permissions.cs.["EnseignantSoins"]')
      .eq('is_active', true)
    const siTeacherCount = filterSITeacherProfiles(siTeachers).length

    // Enseignants PHY depuis user_profiles
    const { data: phyTeachers } = await supabase
      .from('user_profiles')
      .select('user_id')
      .or('role.eq.EnseignantPhysio,permissions.cs.["EnseignantPhysio"]')
    const phyTeacherCount = phyTeachers?.length || 0

    // Utilisateurs avec un rôle non-null
    const { data: usersWithRoles } = await supabase
      .from('user_profiles')
      .select('user_id')
      .not('role', 'is', null)
    const totalUsersWithRoles = usersWithRoles?.length || 0

    // RM = modules avec responsable_email renseigné
    const siRM = new Set(modList.filter(m => m.track_id === 'SI' && m.responsable_email).map(m => m.responsable_email)).size
    const phyRM = new Set(modList.filter(m => m.track_id === 'PHY' && m.responsable_email).map(m => m.responsable_email)).size

    const stats = {
      totalModules: modList.length,
      totalCourses: coursesCount || 0,
      totalUsersWithRoles,
      si: {
        modules: modList.filter(m => m.track_id === 'SI').length,
        teachers: siTeacherCount,
        rm: siRM
      },
      phy: {
        modules: modList.filter(m => m.track_id === 'PHY').length,
        teachers: phyTeacherCount,
        rm: phyRM
      },
      modulesNoTrack: modList.filter(m => !m.track_id).length
    }

    return stats
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur stats globales:', error)
    return {
      totalModules: 0,
      totalCourses: 0,
      totalUsersWithRoles: 0,
      si: { modules: 0, teachers: 0, rm: 0 },
      phy: { modules: 0, teachers: 0, rm: 0 },
      modulesNoTrack: 0
    }
  }
}

/**
 * Récupère tous les rôles par filière avec détails utilisateur
 */
export async function getAllTrackRoles() {
  try {
    if (import.meta.env.DEV) console.log('👥 [adminDashboard] Chargement rôles depuis user_profiles...')
    
    // Fallback: derive track roles from user_profiles.role
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, forname, family_name, display_name, role')
      .not('role', 'is', null)
      .order('role', { ascending: true })
    
    if (error) throw error
    
    const roles = (data || []).map(r => {
      // Derive trackId from role name
      const roleLower = (r.role || '').toLowerCase()
      let trackId = null
      if (roleLower.includes('soins') || roleLower.includes('si')) trackId = 'SI'
      else if (roleLower.includes('physio') || roleLower.includes('phy')) trackId = 'PHY'
      
      return {
        id: r.user_id,
        userId: r.user_id,
        trackId,
        role: r.role,
        isActive: true,
        assignedAt: null,
        expiresAt: null,
        userName: r.display_name || 
                  `${r.forname || ''} ${r.family_name || ''}`.trim() ||
                  r.email ||
                  'Inconnu',
        userEmail: r.email
      }
    })
    
    if (import.meta.env.DEV) console.log('✅ [adminDashboard] Rôles chargés:', roles.length)
    return roles
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur rôles:', error)
    return []
  }
}

/**
 * Récupère les modules avec leur responsable
 */
export async function getModulesWithRM() {
  try {
    if (import.meta.env.DEV) console.log('📚 [adminDashboard] Chargement modules avec RM...')
    
    const { data, error } = await supabase
      .from('modules')
      .select('id, code, title, track_id, responsable, responsable_email, year, credits, heures_contact')
      .order('track_id', { ascending: true })
      .order('year', { ascending: true })
      .order('code', { ascending: true })
    
    if (error) throw error
    
    if (import.meta.env.DEV) console.log('✅ [adminDashboard] Modules chargés:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur modules:', error)
    return []
  }
}

/**
 * Assigne un rôle à un utilisateur pour une filière
 */
export async function assignTrackRole(userId, trackId, role, assignedBy) {
  void assignedBy
  // Validation des entrées
  const userIdCheck = validateId(userId)
  if (!userIdCheck.valid) throw new Error('userId invalide')

  try {
    if (import.meta.env.DEV) console.log('➕ [adminDashboard] Assignation rôle via user_profiles:', { userId, role })
    
    // Update role directly on user_profiles
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('user_id', userId)
    
    if (error) throw error
    
    if (import.meta.env.DEV) console.log('✅ [adminDashboard] Rôle assigné')
    return { success: true, message: 'Rôle assigné avec succès' }
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur assignation:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Désactive un rôle
 */
export async function removeTrackRole(roleId) {
  const idCheck = validateId(String(roleId))
  if (!idCheck.valid) throw new Error('roleId invalide')

  try {
    if (import.meta.env.DEV) console.log('➖ [adminDashboard] Suppression rôle (clear):', roleId)
    
    // Clear role on user_profiles
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: null })
      .eq('user_id', roleId)
    
    if (error) throw error
    
    if (import.meta.env.DEV) console.log('✅ [adminDashboard] Rôle supprimé')
    return { success: true }
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur suppression:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Met à jour le responsable d'un module
 */
export async function updateModuleRM(moduleId, responsableEmail) {
  const idCheck = validateId(String(moduleId))
  if (!idCheck.valid) throw new Error('moduleId invalide')
  if (responsableEmail) {
    const emailCheck = validateEmail(responsableEmail)
    if (!emailCheck.valid) throw new Error(emailCheck.message)
  }

  try {
    if (import.meta.env.DEV) console.log('📝 [adminDashboard] Mise à jour RM module:', { moduleId, responsableEmail })
    
    const { error } = await supabase
      .from('modules')
      .update({ 
        responsable_email: responsableEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
    
    if (error) throw error
    
    if (import.meta.env.DEV) console.log('✅ [adminDashboard] RM mis à jour')
    return { success: true }
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur update RM:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Récupère la liste des utilisateurs pour l'assignation de rôles
 */
export async function getUsersForRoleAssignment() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, forname, family_name, display_name, role')
      .order('family_name', { ascending: true })
    
    if (error) throw error
    
    return (data || []).map(u => ({
      id: u.user_id,
      email: u.email,
      name: u.display_name || `${u.forname || ''} ${u.family_name || ''}`.trim() || u.email,
      currentRole: u.role
    }))
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur users:', error)
    return []
  }
}

/**
 * Récupère les filières disponibles
 */
export async function getTracks() {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur tracks:', error)
    return [
      { id: 'SI', label: 'Soins Infirmiers', color: '#3b82f6' },
      { id: 'PHY', label: 'Physiothérapie', color: '#10b981' }
    ]
  }
}

/**
 * Charge toutes les données du dashboard admin
 */
export async function loadAdminDashboard() {
  try {
    if (import.meta.env.DEV) console.log('🚀 [adminDashboard] Chargement complet...')
    
    const [stats, roles, modules, tracks, users] = await Promise.all([
      getGlobalStats(),
      getAllTrackRoles(),
      getModulesWithRM(),
      getTracks(),
      getUsersForRoleAssignment()
    ])
    
    return {
      stats,
      roles,
      modules,
      tracks,
      users
    }
  } catch (error) {
    console.error('❌ [adminDashboard] Erreur chargement:', error)
    return {
      stats: null,
      roles: [],
      modules: [],
      tracks: [],
      users: []
    }
  }
}
