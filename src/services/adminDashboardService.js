/**
 * Service Dashboard Admin - Stats globales multi-filières
 * Fournit les statistiques pour le dashboard admin avec vue SI/PHY
 */
import { supabase } from '@/supabase'

/**
 * Récupère les stats globales par filière
 */
export async function getGlobalStats() {
  try {
    // Requêtes parallélisées pour de meilleures performances
    const [modulesResult, teacherRolesResult, rmRolesResult, coursesResult, allRolesResult] = await Promise.all([
      supabase.from('modules').select('id, track_id, responsable_email, year, credits'),
      supabase.from('user_track_roles').select('user_id, track_id, role').eq('role', 'TEACHER').eq('is_active', true),
      supabase.from('user_track_roles').select('user_id, track_id, role').eq('role', 'RM').eq('is_active', true),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('user_track_roles').select('user_id').eq('is_active', true),
    ])

    const modules = modulesResult.data || []
    if (modulesResult.error) throw modulesResult.error

    const teacherRoles = teacherRolesResult.data || []
    const rmRoles = rmRolesResult.data || []
    const allRoles = allRolesResult.data || []

    const stats = {
      totalModules: modules.length,
      totalCourses: coursesResult.count || 0,
      totalUsersWithRoles: new Set(allRoles.map(r => r.user_id)).size,
      si: {
        modules: modules.filter(m => m.track_id === 'SI').length,
        teachers: new Set(teacherRoles.filter(r => r.track_id === 'SI').map(r => r.user_id)).size,
        rm: new Set(rmRoles.filter(r => r.track_id === 'SI').map(r => r.user_id)).size
      },
      phy: {
        modules: modules.filter(m => m.track_id === 'PHY').length,
        teachers: new Set(teacherRoles.filter(r => r.track_id === 'PHY').map(r => r.user_id)).size,
        rm: new Set(rmRoles.filter(r => r.track_id === 'PHY').map(r => r.user_id)).size
      },
      modulesNoTrack: modules.filter(m => !m.track_id).length
    }

    return stats
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
    console.log('👥 [adminDashboard] Chargement rôles par filière...')
    
    const { data, error } = await supabase
      .from('user_track_roles')
      .select(`
        id,
        user_id,
        track_id,
        role,
        is_active,
        assigned_by,
        assigned_at,
        expires_at,
        user_profiles (
          email,
          forname,
          family_name,
          display_name
        )
      `)
      .order('track_id', { ascending: true })
      .order('role', { ascending: true })
    
    if (error) throw error
    
    // Formater les données
    const roles = (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      trackId: r.track_id,
      role: r.role,
      isActive: r.is_active,
      assignedAt: r.assigned_at,
      expiresAt: r.expires_at,
      userName: r.user_profiles?.display_name || 
                `${r.user_profiles?.forname || ''} ${r.user_profiles?.family_name || ''}`.trim() ||
                r.user_profiles?.email ||
                'Inconnu',
      userEmail: r.user_profiles?.email
    }))
    
    console.log('✅ [adminDashboard] Rôles chargés:', roles.length)
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
    console.log('📚 [adminDashboard] Chargement modules avec RM...')
    
    const { data, error } = await supabase
      .from('modules')
      .select('id, code, title, track_id, responsable, responsable_email, year, credits, heures_contact')
      .order('track_id', { ascending: true })
      .order('year', { ascending: true })
      .order('code', { ascending: true })
    
    if (error) throw error
    
    console.log('✅ [adminDashboard] Modules chargés:', data?.length || 0)
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
  try {
    console.log('➕ [adminDashboard] Assignation rôle:', { userId, trackId, role })
    
    // Vérifier si le rôle existe déjà
    const { data: existing } = await supabase
      .from('user_track_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .eq('role', role)
      .single()
    
    if (existing) {
      // Réactiver si inactif
      const { error } = await supabase
        .from('user_track_roles')
        .update({ is_active: true, assigned_at: new Date().toISOString(), assigned_by: assignedBy })
        .eq('id', existing.id)
      
      if (error) throw error
      console.log('✅ [adminDashboard] Rôle réactivé')
      return { success: true, message: 'Rôle réactivé' }
    }
    
    // Créer nouveau rôle
    const { error } = await supabase
      .from('user_track_roles')
      .insert({
        user_id: userId,
        track_id: trackId,
        role,
        is_active: true,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    console.log('✅ [adminDashboard] Rôle assigné')
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
  try {
    console.log('➖ [adminDashboard] Suppression rôle:', roleId)
    
    const { error } = await supabase
      .from('user_track_roles')
      .update({ is_active: false })
      .eq('id', roleId)
    
    if (error) throw error
    
    console.log('✅ [adminDashboard] Rôle désactivé')
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
  try {
    console.log('📝 [adminDashboard] Mise à jour RM module:', { moduleId, responsableEmail })
    
    const { error } = await supabase
      .from('modules')
      .update({ 
        responsable_email: responsableEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
    
    if (error) throw error
    
    console.log('✅ [adminDashboard] RM mis à jour')
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
    console.log('🚀 [adminDashboard] Chargement complet...')
    
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
