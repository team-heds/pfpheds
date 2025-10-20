import { supabase } from '@/supabase'

/**
 * Service pour gérer la bibliothèque vidéo
 */

// Créer une entrée dans la bibliothèque
export async function addVideoToLibrary(videoData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const videoEntry = {
      ticket_id: videoData.ticket_id,
      vimeo_url: videoData.vimeo_url,
      vimeo_id: extractVimeoId(videoData.vimeo_url),
      title: videoData.title,
      description: videoData.description || '',
      thumbnail_url: videoData.thumbnail_url || '',
      duration: videoData.duration || null,
      module_id: videoData.module_id || null,
      year_id: videoData.year_id || null,
      type: videoData.type || 'cours',
      person_filmed: videoData.person_filmed || '',
      filming_date: videoData.filming_date || null,
      published_date: new Date().toISOString(),
      tags: videoData.tags || [],
      created_at: new Date().toISOString(),
      created_by: user?.id || null
    }

    const { data, error } = await supabase
      .from('video_library')
      .insert([videoEntry])
      .select()
      .single()

    if (error) throw error

    console.log('[VideoLibrary] Vidéo ajoutée:', data)
    return data
  } catch (error) {
    console.error('[VideoLibrary] Erreur ajout vidéo:', error)
    throw error
  }
}

// Récupérer toutes les vidéos
export async function getAllVideos(filters = {}) {
  try {
    let query = supabase
      .from('video_library')
      .select(`
        *,
        modules:module_id (id, title),
        years:year_id (id, name)
      `)
      .order('published_date', { ascending: false })

    // Appliquer les filtres
    if (filters.module_id) {
      query = query.eq('module_id', filters.module_id)
    }
    
    if (filters.year_id) {
      query = query.eq('year_id', filters.year_id)
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    console.log('[VideoLibrary] Vidéos chargées:', data?.length)
    return data || []
  } catch (error) {
    console.error('[VideoLibrary] Erreur chargement vidéos:', error)
    throw error
  }
}

// Récupérer une vidéo par ID
export async function getVideoById(videoId) {
  try {
    const { data, error } = await supabase
      .from('video_library')
      .select(`
        *,
        modules:module_id (id, title),
        years:year_id (id, name),
        tickets:ticket_id (id, title, status)
      `)
      .eq('id', videoId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('[VideoLibrary] Erreur chargement vidéo:', error)
    throw error
  }
}

// Mettre à jour une vidéo
export async function updateVideo(videoId, updates) {
  try {
    const { data, error } = await supabase
      .from('video_library')
      .update(updates)
      .eq('id', videoId)
      .select()
      .single()

    if (error) throw error

    console.log('[VideoLibrary] Vidéo mise à jour:', data)
    return data
  } catch (error) {
    console.error('[VideoLibrary] Erreur mise à jour vidéo:', error)
    throw error
  }
}

// Supprimer une vidéo
export async function deleteVideo(videoId) {
  try {
    const { error } = await supabase
      .from('video_library')
      .delete()
      .eq('id', videoId)

    if (error) throw error

    console.log('[VideoLibrary] Vidéo supprimée:', videoId)
  } catch (error) {
    console.error('[VideoLibrary] Erreur suppression vidéo:', error)
    throw error
  }
}

// Ajouter automatiquement les vidéos d'un ticket terminé
export async function addTicketVideosToLibrary(ticket) {
  try {
    if (!ticket.metadata?.video_links || ticket.metadata.video_links.length === 0) {
      console.log('[VideoLibrary] Pas de vidéos à ajouter pour le ticket:', ticket.id)
      return []
    }

    const addedVideos = []

    for (const videoLink of ticket.metadata.video_links) {
      // Vérifier si la vidéo existe déjà
      const { data: existing } = await supabase
        .from('video_library')
        .select('id')
        .eq('vimeo_url', videoLink.url)
        .single()

      if (existing) {
        console.log('[VideoLibrary] Vidéo déjà dans la bibliothèque:', videoLink.url)
        continue
      }

      // Ajouter la vidéo
      const videoData = {
        ticket_id: ticket.id,
        vimeo_url: videoLink.url,
        title: videoLink.title || ticket.title,
        description: videoLink.description || ticket.description,
        thumbnail_url: videoLink.thumbnail || '',
        duration: ticket.metadata.duration_minutes || null,
        module_id: ticket.module_id || null,
        year_id: ticket.year_id || null,
        type: 'cours',
        person_filmed: ticket.metadata.person_filmed || '',
        filming_date: ticket.metadata.filming_date || null,
        tags: [ticket.type]
      }

      const video = await addVideoToLibrary(videoData)
      addedVideos.push(video)
    }

    console.log('[VideoLibrary] Vidéos ajoutées depuis ticket:', addedVideos.length)
    return addedVideos
  } catch (error) {
    console.error('[VideoLibrary] Erreur ajout vidéos du ticket:', error)
    throw error
  }
}

// Récupérer les statistiques
export async function getVideoStats() {
  try {
    const { data: videos, error } = await supabase
      .from('video_library')
      .select('id, module_id, year_id, duration')

    if (error) throw error

    const stats = {
      total: videos.length,
      byModule: {},
      byYear: {},
      totalDuration: 0
    }

    videos.forEach(video => {
      // Par module
      if (video.module_id) {
        stats.byModule[video.module_id] = (stats.byModule[video.module_id] || 0) + 1
      }

      // Par année
      if (video.year_id) {
        stats.byYear[video.year_id] = (stats.byYear[video.year_id] || 0) + 1
      }

      // Durée totale
      if (video.duration) {
        stats.totalDuration += video.duration
      }
    })

    return stats
  } catch (error) {
    console.error('[VideoLibrary] Erreur stats:', error)
    throw error
  }
}

// Extraire l'ID Vimeo depuis l'URL
function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : null
}

// Générer l'URL du player Vimeo
export function getVimeoEmbedUrl(vimeoId) {
  return `https://player.vimeo.com/video/${vimeoId}`
}

// Générer l'URL de la thumbnail Vimeo
export function getVimeoThumbnailUrl(vimeoId) {
  return `https://vumbnail.com/${vimeoId}.jpg`
}
