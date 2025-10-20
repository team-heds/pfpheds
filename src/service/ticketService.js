import { supabase } from '@/supabase'

/**
 * Service de gestion des tickets académiques (Kanban)
 */

// Statuts possibles des tickets
export const TICKET_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  VALIDATION: 'validation',
  PROBLEMS: 'problems',
  DONE: 'done'
}

// Types de tickets
export const TICKET_TYPES = {
  VIDEO: 'video',
  DEVELOPMENT: 'development',
  SIMULATION: 'simulation',
  OTHER: 'other'
}

// Modalités vidéo
export const VIDEO_MODALITIES = {
  POWERPOINT: 'powerpoint_sonorise',
  TABLE_RONDE: 'table_ronde',
  PODCAST: 'podcast',
  INTERVIEW: 'interview',
  TUTORIAL: 'tutorial',
  OTHER: 'other'
}

/**
 * Récupère tous les tickets
 * @returns {Promise<Array>}
 */
export async function getAllTickets() {
  try {
    const { data, error } = await supabase
      .from('academic_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[ticketService] Erreur getAllTickets:', error)
    throw error
  }
}

/**
 * Récupère les tickets par statut
 * @param {string} status - Statut du ticket
 * @returns {Promise<Array>}
 */
export async function getTicketsByStatus(status) {
  try {
    const { data, error } = await supabase
      .from('academic_tickets')
      .select('*')
      .eq('status', status)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[ticketService] Erreur getTicketsByStatus:', error)
    throw error
  }
}

/**
 * Crée un nouveau ticket
 * @param {Object} ticketData - Données du ticket
 * @returns {Promise<Object>}
 */
export async function createTicket(ticketData) {
  try {
    // Nettoyer les données : module_id doit être un UUID ou null
    const cleanData = { ...ticketData }
    
    // Si module_id n'est pas un UUID valide, le mettre à null
    if (cleanData.module_id && typeof cleanData.module_id !== 'string') {
      cleanData.module_id = null
    } else if (cleanData.module_id && !cleanData.module_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      cleanData.module_id = null
    }
    
    const { data, error } = await supabase
      .from('academic_tickets')
      .insert([{
        ...cleanData,
        status: cleanData.status || TICKET_STATUS.BACKLOG,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    console.log('[ticketService] ✅ Ticket créé:', data.id)
    return data
  } catch (error) {
    console.error('[ticketService] ❌ Erreur createTicket:', error)
    throw error
  }
}

/**
 * Met à jour un ticket
 * @param {string} ticketId - ID du ticket
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>}
 */
export async function updateTicket(ticketId, updates) {
  try {
    // Nettoyer les données : module_id doit être un UUID ou null
    const cleanUpdates = { ...updates }
    
    // Si module_id n'est pas un UUID valide, le mettre à null
    if (cleanUpdates.module_id && typeof cleanUpdates.module_id !== 'string') {
      cleanUpdates.module_id = null
    } else if (cleanUpdates.module_id && !cleanUpdates.module_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      cleanUpdates.module_id = null
    }
    
    // Récupérer l'ancien statut avant la mise à jour
    const { data: oldTicket } = await supabase
      .from('academic_tickets')
      .select('status, metadata')
      .eq('id', ticketId)
      .single()
    
    const { data, error } = await supabase
      .from('academic_tickets')
      .update({
        ...cleanUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error
    console.log('[ticketService] ✅ Ticket mis à jour:', ticketId)
    
    // Si le ticket passe en "done" et a des vidéos, les ajouter à la bibliothèque
    if (oldTicket && oldTicket.status !== TICKET_STATUS.DONE && 
        cleanUpdates.status === TICKET_STATUS.DONE && 
        data.metadata?.video_links && data.metadata.video_links.length > 0) {
      
      console.log('[ticketService] 🎬 Ticket terminé avec vidéos, ajout à la bibliothèque...')
      
      // Import dynamique pour éviter les dépendances circulaires
      try {
        const { addTicketVideosToLibrary } = await import('./videoLibraryService')
        await addTicketVideosToLibrary(data)
        console.log('[ticketService] ✅ Vidéos ajoutées à la bibliothèque')
      } catch (libError) {
        console.error('[ticketService] ⚠️ Erreur ajout bibliothèque (non bloquant):', libError)
      }
    }
    
    return data
  } catch (error) {
    console.error('[ticketService] ❌ Erreur updateTicket:', error)
    throw error
  }
}

/**
 * Change le statut d'un ticket
 * @param {string} ticketId - ID du ticket
 * @param {string} newStatus - Nouveau statut
 * @param {number} orderIndex - Nouvelle position dans la colonne
 * @returns {Promise<Object>}
 */
export async function changeTicketStatus(ticketId, newStatus, orderIndex = null) {
  try {
    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (orderIndex !== null) {
      updates.order_index = orderIndex
    }

    const { data, error } = await supabase
      .from('academic_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error
    console.log('[ticketService] ✅ Statut changé:', ticketId, '→', newStatus)
    return data
  } catch (error) {
    console.error('[ticketService] ❌ Erreur changeTicketStatus:', error)
    throw error
  }
}

/**
 * Supprime un ticket
 * @param {string} ticketId - ID du ticket
 * @returns {Promise<void>}
 */
export async function deleteTicket(ticketId) {
  try {
    const { error } = await supabase
      .from('academic_tickets')
      .delete()
      .eq('id', ticketId)

    if (error) throw error
    console.log('[ticketService] ✅ Ticket supprimé:', ticketId)
  } catch (error) {
    console.error('[ticketService] ❌ Erreur deleteTicket:', error)
    throw error
  }
}

/**
 * Publie une vidéo sur Vimeo et met à jour le ticket
 * @param {string} ticketId - ID du ticket
 * @param {string} vimeoId - ID de la vidéo sur Vimeo
 * @param {string} vimeoUrl - URL de la vidéo sur Vimeo
 * @returns {Promise<Object>}
 */
export async function publishToVimeo(ticketId, vimeoId, vimeoUrl) {
  try {
    const { data, error } = await supabase
      .from('academic_tickets')
      .update({
        vimeo_id: vimeoId,
        vimeo_url: vimeoUrl,
        published_at: new Date().toISOString(),
        status: TICKET_STATUS.DONE,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error
    console.log('[ticketService] ✅ Vidéo publiée sur Vimeo:', vimeoId)
    return data
  } catch (error) {
    console.error('[ticketService] ❌ Erreur publishToVimeo:', error)
    throw error
  }
}

/**
 * Récupère les statistiques des tickets
 * @returns {Promise<Object>}
 */
export async function getTicketStats() {
  try {
    const { data, error } = await supabase
      .from('academic_tickets')
      .select('status, type')

    if (error) throw error

    const stats = {
      total: data.length,
      by_status: {},
      by_type: {}
    }

    // Compter par statut
    Object.values(TICKET_STATUS).forEach(status => {
      stats.by_status[status] = data.filter(t => t.status === status).length
    })

    // Compter par type
    Object.values(TICKET_TYPES).forEach(type => {
      stats.by_type[type] = data.filter(t => t.type === type).length
    })

    return stats
  } catch (error) {
    console.error('[ticketService] Erreur getTicketStats:', error)
    throw error
  }
}

export default {
  getAllTickets,
  getTicketsByStatus,
  createTicket,
  updateTicket,
  changeTicketStatus,
  deleteTicket,
  publishToVimeo,
  getTicketStats,
  TICKET_STATUS,
  TICKET_TYPES,
  VIDEO_MODALITIES
}
