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
      .select('*')
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

// Récupérer toutes les vidéos depuis Vimeo API avec pagination
export async function getVimeoVideos(onProgress = null) {
  try {
    const accessToken = import.meta.env.VITE_VIMEO_ACCESS_TOKEN
    
    if (!accessToken) {
      throw new Error('VITE_VIMEO_ACCESS_TOKEN non configuré')
    }

    let allVideos = []
    let page = 1
    let hasMore = true
    const perPage = 100 // Maximum autorisé par Vimeo

    console.log('[VideoLibrary] 🔄 Début du chargement des vidéos Vimeo...')

    while (hasMore) {
      const response = await fetch(`https://api.vimeo.com/me/videos?per_page=${perPage}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur Vimeo API: ${response.status}`)
      }

      const data = await response.json()
      
      // Transformer les données Vimeo
      const videos = data.data.map(video => ({
        vimeo_id: video.uri.split('/').pop(),
        vimeo_url: video.link,
        title: video.name,
        description: video.description || '',
        thumbnail_url: video.pictures?.sizes?.[3]?.link || '',
        duration: Math.round(video.duration / 60), // Convertir en minutes
        created_at: video.created_time,
        in_library: false // Par défaut pas dans la bibliothèque
      }))

      allVideos = [...allVideos, ...videos]
      
      console.log(`[VideoLibrary] 📄 Page ${page}: ${videos.length} vidéos chargées (Total: ${allVideos.length})`)

      // Callback de progression
      if (onProgress) {
        onProgress(allVideos.length, page)
      }

      // Vérifier s'il y a une page suivante
      hasMore = data.paging && data.paging.next !== null
      page++

      // Limite de sécurité pour éviter une boucle infinie
      if (page > 50) {
        console.warn('[VideoLibrary] ⚠️ Limite de 50 pages atteinte (5000 vidéos)')
        break
      }
    }

    console.log('[VideoLibrary] ✅ Toutes les vidéos Vimeo chargées:', allVideos.length)
    return allVideos
  } catch (error) {
    console.error('[VideoLibrary] ❌ Erreur chargement Vimeo:', error)
    throw error
  }
}

// Vérifier quelles vidéos Vimeo sont déjà dans la bibliothèque
export async function checkVimeoVideosInLibrary(vimeoVideos) {
  try {
    const vimeoIds = vimeoVideos.map(v => v.vimeo_id)
    
    const { data, error } = await supabase
      .from('video_library')
      .select('vimeo_id')
      .in('vimeo_id', vimeoIds)

    if (error) throw error

    const existingIds = new Set(data.map(v => v.vimeo_id))
    
    return vimeoVideos.map(video => ({
      ...video,
      in_library: existingIds.has(video.vimeo_id)
    }))
  } catch (error) {
    console.error('[VideoLibrary] Erreur vérification:', error)
    return vimeoVideos // Retourner sans statut si erreur
  }
}
