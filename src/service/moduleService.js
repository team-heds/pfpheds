import { ref as dbRef, get, set, push, update, remove } from 'firebase/database'
import { db } from '../../firebase'

// ========================================
// GESTION DES MODULES
// ========================================

/**
 * Récupérer tous les modules
 */
export async function getAllModules() {
  try {
    const modulesRef = dbRef(db, 'modules')
    const snapshot = await get(modulesRef)
    
    if (snapshot.exists()) {
      const modulesData = snapshot.val()
      return Object.keys(modulesData).map(id => ({
        id,
        ...modulesData[id]
      }))
    }
    
    return []
  } catch (error) {
    console.error('[moduleService] Error fetching modules:', error)
    return []
  }
}

/**
 * Récupérer un module par son ID
 */
export async function getModuleById(moduleId) {
  try {
    const moduleRef = dbRef(db, `modules/${moduleId}`)
    const snapshot = await get(moduleRef)
    
    if (snapshot.exists()) {
      return {
        id: moduleId,
        ...snapshot.val()
      }
    }
    
    return null
  } catch (error) {
    console.error('[moduleService] Error fetching module:', error)
    return null
  }
}

/**
 * Créer un nouveau module
 */
export async function createModule(moduleData) {
  try {
    const modulesRef = dbRef(db, 'modules')
    const newModuleRef = push(modulesRef)
    
    const module = {
      ...moduleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      videoCount: 0,
      validatedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      progressPercentage: 0
    }
    
    await set(newModuleRef, module)
    
    return {
      id: newModuleRef.key,
      ...module
    }
  } catch (error) {
    console.error('[moduleService] Error creating module:', error)
    throw error
  }
}

/**
 * Mettre à jour un module
 */
export async function updateModule(moduleId, updates) {
  try {
    const moduleRef = dbRef(db, `modules/${moduleId}`)
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await update(moduleRef, updateData)
    return true
  } catch (error) {
    console.error('[moduleService] Error updating module:', error)
    throw error
  }
}

/**
 * Supprimer un module
 */
export async function deleteModule(moduleId) {
  try {
    const moduleRef = dbRef(db, `modules/${moduleId}`)
    await remove(moduleRef)
    
    // Supprimer aussi toutes les vidéos du module
    const videosRef = dbRef(db, `moduleVideos/${moduleId}`)
    await remove(videosRef)
    
    return true
  } catch (error) {
    console.error('[moduleService] Error deleting module:', error)
    throw error
  }
}

// ========================================
// GESTION DES VIDÉOS DE MODULE
// ========================================

/**
 * Récupérer toutes les vidéos d'un module
 */
export async function getModuleVideos(moduleId) {
  try {
    const videosRef = dbRef(db, `moduleVideos/${moduleId}`)
    const snapshot = await get(videosRef)
    
    if (snapshot.exists()) {
      const videosData = snapshot.val()
      return Object.keys(videosData).map(id => ({
        id,
        moduleId,
        ...videosData[id]
      }))
    }
    
    return []
  } catch (error) {
    console.error('[moduleService] Error fetching module videos:', error)
    return []
  }
}

/**
 * Récupérer une vidéo par son ID
 */
export async function getVideoById(moduleId, videoId) {
  try {
    const videoRef = dbRef(db, `moduleVideos/${moduleId}/${videoId}`)
    const snapshot = await get(videoRef)
    
    if (snapshot.exists()) {
      return {
        id: videoId,
        moduleId,
        ...snapshot.val()
      }
    }
    
    return null
  } catch (error) {
    console.error('[moduleService] Error fetching video:', error)
    return null
  }
}

/**
 * Ajouter une vidéo à un module
 */
export async function addVideoToModule(moduleId, videoData) {
  try {
    const videosRef = dbRef(db, `moduleVideos/${moduleId}`)
    const newVideoRef = push(videosRef)
    
    const video = {
      ...videoData,
      moduleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      comments: []
    }
    
    await set(newVideoRef, video)
    
    // Mettre à jour les statistiques du module
    await updateModuleStats(moduleId)
    
    return {
      id: newVideoRef.key,
      ...video
    }
  } catch (error) {
    console.error('[moduleService] Error adding video to module:', error)
    throw error
  }
}

/**
 * Mettre à jour une vidéo
 */
export async function updateVideo(moduleId, videoId, updates) {
  try {
    const videoRef = dbRef(db, `moduleVideos/${moduleId}/${videoId}`)
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await update(videoRef, updateData)
    
    // Mettre à jour les statistiques du module si le statut a changé
    if (updates.status) {
      await updateModuleStats(moduleId)
    }
    
    return true
  } catch (error) {
    console.error('[moduleService] Error updating video:', error)
    throw error
  }
}

/**
 * Supprimer une vidéo
 */
export async function deleteVideo(moduleId, videoId) {
  try {
    const videoRef = dbRef(db, `moduleVideos/${moduleId}/${videoId}`)
    await remove(videoRef)
    
    // Supprimer aussi les commentaires de la vidéo
    const commentsRef = dbRef(db, `videoComments/${moduleId}/${videoId}`)
    await remove(commentsRef)
    
    // Mettre à jour les statistiques du module
    await updateModuleStats(moduleId)
    
    return true
  } catch (error) {
    console.error('[moduleService] Error deleting video:', error)
    throw error
  }
}

/**
 * Valider une vidéo
 */
export async function validateVideo(moduleId, videoId) {
  return await updateVideo(moduleId, videoId, { status: 'validated' })
}

/**
 * Rejeter une vidéo
 */
export async function rejectVideo(moduleId, videoId) {
  return await updateVideo(moduleId, videoId, { status: 'rejected' })
}

/**
 * Mettre une vidéo en attente
 */
export async function setPendingVideo(moduleId, videoId) {
  return await updateVideo(moduleId, videoId, { status: 'pending' })
}

// ========================================
// GESTION DES COMMENTAIRES
// ========================================

/**
 * Récupérer les commentaires d'une vidéo
 */
export async function getVideoComments(moduleId, videoId) {
  try {
    const commentsRef = dbRef(db, `videoComments/${moduleId}/${videoId}`)
    const snapshot = await get(commentsRef)
    
    if (snapshot.exists()) {
      const commentsData = snapshot.val()
      return Object.keys(commentsData).map(id => ({
        id,
        ...commentsData[id]
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    
    return []
  } catch (error) {
    console.error('[moduleService] Error fetching video comments:', error)
    return []
  }
}

/**
 * Ajouter un commentaire à une vidéo
 */
export async function addVideoComment(moduleId, videoId, commentData) {
  try {
    const commentsRef = dbRef(db, `videoComments/${moduleId}/${videoId}`)
    const newCommentRef = push(commentsRef)
    
    const comment = {
      ...commentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await set(newCommentRef, comment)
    
    return {
      id: newCommentRef.key,
      ...comment
    }
  } catch (error) {
    console.error('[moduleService] Error adding video comment:', error)
    throw error
  }
}

/**
 * Supprimer un commentaire
 */
export async function deleteVideoComment(moduleId, videoId, commentId) {
  try {
    const commentRef = dbRef(db, `videoComments/${moduleId}/${videoId}/${commentId}`)
    await remove(commentRef)
    return true
  } catch (error) {
    console.error('[moduleService] Error deleting video comment:', error)
    throw error
  }
}

// ========================================
// GESTION DES ASSIGNATIONS DE VIDÉOS
// ========================================

/**
 * Vérifier si une vidéo Vimeo est assignée à un module
 */
export async function isVideoAssignedToModule(vimeoId) {
  try {
    const modulesRef = dbRef(db, 'moduleVideos')
    const snapshot = await get(modulesRef)
    
    if (snapshot.exists()) {
      const allModuleVideos = snapshot.val()
      
      // Parcourir tous les modules et leurs vidéos
      for (const moduleId in allModuleVideos) {
        const moduleVideos = allModuleVideos[moduleId]
        for (const videoId in moduleVideos) {
          const video = moduleVideos[videoId]
          if (video.vimeoId === vimeoId) {
            return {
              assigned: true,
              moduleId,
              videoId,
              moduleName: null // À récupérer si nécessaire
            }
          }
        }
      }
    }
    
    return { assigned: false }
  } catch (error) {
    console.error('[moduleService] Error checking video assignment:', error)
    return { assigned: false }
  }
}

/**
 * Récupérer toutes les vidéos assignées avec leurs modules
 */
export async function getAllAssignedVideos() {
  try {
    const modulesRef = dbRef(db, 'moduleVideos')
    const snapshot = await get(modulesRef)
    
    const assignedVideos = []
    
    if (snapshot.exists()) {
      const allModuleVideos = snapshot.val()
      
      for (const moduleId in allModuleVideos) {
        const moduleVideos = allModuleVideos[moduleId]
        for (const videoId in moduleVideos) {
          const video = moduleVideos[videoId]
          assignedVideos.push({
            ...video,
            id: videoId,
            moduleId
          })
        }
      }
    }
    
    return assignedVideos
  } catch (error) {
    console.error('[moduleService] Error fetching assigned videos:', error)
    return []
  }
}

/**
 * Supprimer une vidéo d'un module par son vimeoId
 */
export async function removeVideoFromModuleByVimeoId(vimeoId) {
  try {
    const assignment = await isVideoAssignedToModule(vimeoId)
    
    if (assignment.assigned) {
      await deleteVideo(assignment.moduleId, assignment.videoId)
      return true
    }
    
    return false
  } catch (error) {
    console.error('[moduleService] Error removing video from module:', error)
    throw error
  }
}

// ========================================
// UTILITAIRES
// ========================================

/**
 * Mettre à jour les statistiques d'un module
 */
async function updateModuleStats(moduleId) {
  try {
    const videos = await getModuleVideos(moduleId)
    
    const stats = {
      videoCount: videos.length,
      validatedCount: videos.filter(v => v.status === 'validated').length,
      pendingCount: videos.filter(v => v.status === 'pending').length,
      rejectedCount: videos.filter(v => v.status === 'rejected').length
    }
    
    stats.progressPercentage = stats.videoCount > 0 
      ? Math.round((stats.validatedCount / stats.videoCount) * 100)
      : 0
    
    // Déterminer le statut global du module
    let moduleStatus = 'pending'
    if (stats.validatedCount === stats.videoCount && stats.videoCount > 0) {
      moduleStatus = 'validated'
    } else if (stats.rejectedCount > 0) {
      moduleStatus = 'rejected'
    }
    
    stats.status = moduleStatus
    stats.updatedAt = new Date().toISOString()
    
    await updateModule(moduleId, stats)
    
    return stats
  } catch (error) {
    console.error('[moduleService] Error updating module stats:', error)
    throw error
  }
}

/**
 * Rechercher des modules
 */
export async function searchModules(query, filters = {}) {
  try {
    const modules = await getAllModules()
    
    let filtered = modules
    
    // Filtrer par recherche textuelle
    if (query && query.trim()) {
      const searchQuery = query.toLowerCase()
      filtered = filtered.filter(module => 
        module.name.toLowerCase().includes(searchQuery) ||
        module.description?.toLowerCase().includes(searchQuery)
      )
    }
    
    // Filtrer par statut
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(module => module.status === filters.status)
    }
    
    // Trier par date de mise à jour
    filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    
    return filtered
  } catch (error) {
    console.error('[moduleService] Error searching modules:', error)
    return []
  }
}

/**
 * Rechercher des vidéos dans un module
 */
export async function searchModuleVideos(moduleId, query, filters = {}) {
  try {
    const videos = await getModuleVideos(moduleId)
    
    let filtered = videos
    
    // Filtrer par recherche textuelle
    if (query && query.trim()) {
      const searchQuery = query.toLowerCase()
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchQuery) ||
        video.description?.toLowerCase().includes(searchQuery)
      )
    }
    
    // Filtrer par statut
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(video => video.status === filters.status)
    }
    
    // Trier par date de mise à jour
    filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    
    return filtered
  } catch (error) {
    console.error('[moduleService] Error searching module videos:', error)
    return []
  }
}

/**
 * Exporter un rapport de module
 */
export async function exportModuleReport(moduleId) {
  try {
    const module = await getModuleById(moduleId)
    const videos = await getModuleVideos(moduleId)
    
    const report = {
      module,
      videos,
      summary: {
        totalVideos: videos.length,
        validatedVideos: videos.filter(v => v.status === 'validated').length,
        pendingVideos: videos.filter(v => v.status === 'pending').length,
        rejectedVideos: videos.filter(v => v.status === 'rejected').length,
        completionPercentage: module.progressPercentage || 0
      },
      generatedAt: new Date().toISOString()
    }
    
    return report
  } catch (error) {
    console.error('[moduleService] Error exporting module report:', error)
    throw error
  }
}
