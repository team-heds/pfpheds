// Media Service Sécurisé (Firebase Realtime DB)
// Version avec initialisation Firebase sécurisée

import { getFirebaseInstances } from '@/utils/firebaseInit'

const MEDIA_ROOT = 'Media';

// Fonction pour obtenir la base de données de manière sécurisée
async function getDbSafely() {
  const firebase = await getFirebaseInstances()
  if (!firebase.success) {
    throw new Error(`Firebase non disponible: ${firebase.error?.message}`)
  }
  return firebase.db
}

// Fonction pour obtenir l'utilisateur actuel de manière sécurisée
async function getCurrentUserSafely() {
  const firebase = await getFirebaseInstances()
  if (!firebase.success) {
    return null
  }
  return firebase.auth.currentUser?.uid || null
}

export async function listYears() {
  try {
    const db = await getDbSafely()
    const { ref: dbRef, get } = await import('firebase/database')
    
    const snapshot = await get(dbRef(db, `${MEDIA_ROOT}/Years`))
    const val = snapshot.val() || {}
    return Object.entries(val).map(([id, y]) => ({ id, ...y }))
  } catch (error) {
    console.error('Erreur lors de la récupération des années:', error)
    throw error
  }
}

export async function createYear(yearData) {
  try {
    const db = await getDbSafely()
    const uid = await getCurrentUserSafely()
    const { ref: dbRef, push } = await import('firebase/database')
    
    const newYear = {
      ...yearData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: uid
    }
    
    const yearRef = await push(dbRef(db, `${MEDIA_ROOT}/Years`), newYear)
    return { id: yearRef.key, ...newYear }
  } catch (error) {
    console.error('Erreur lors de la création de l\'année:', error)
    throw error
  }
}

export async function getAllModules() {
  try {
    const db = await getDbSafely()
    const { ref: dbRef, get } = await import('firebase/database')
    
    const snapshot = await get(dbRef(db, `${MEDIA_ROOT}/Modules`))
    const val = snapshot.val() || {}
    return Object.entries(val).map(([id, module]) => ({ id, ...module }))
  } catch (error) {
    console.error('Erreur lors de la récupération des modules:', error)
    throw error
  }
}

export async function createModule(moduleData) {
  try {
    const db = await getDbSafely()
    const uid = await getCurrentUserSafely()
    const { ref: dbRef, push } = await import('firebase/database')
    
    const newModule = {
      ...moduleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: uid
    }
    
    const moduleRef = await push(dbRef(db, `${MEDIA_ROOT}/Modules`), newModule)
    return { id: moduleRef.key, ...newModule }
  } catch (error) {
    console.error('Erreur lors de la création du module:', error)
    throw error
  }
}

export async function updateModule(moduleId, moduleData) {
  try {
    const db = await getDbSafely()
    const uid = await getCurrentUserSafely()
    const { ref: dbRef, update } = await import('firebase/database')
    
    const updatedData = {
      ...moduleData,
      updatedAt: new Date().toISOString(),
      updatedBy: uid
    }
    
    await update(dbRef(db, `${MEDIA_ROOT}/Modules/${moduleId}`), updatedData)
    return { id: moduleId, ...updatedData }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du module:', error)
    throw error
  }
}

export async function deleteModule(moduleId) {
  try {
    const db = await getDbSafely()
    const { ref: dbRef, remove } = await import('firebase/database')
    
    await remove(dbRef(db, `${MEDIA_ROOT}/Modules/${moduleId}`))
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression du module:', error)
    throw error
  }
}

export async function getModuleVideoCount(moduleId) {
  try {
    const db = await getDbSafely()
    const { ref: dbRef, get } = await import('firebase/database')
    
    const snapshot = await get(dbRef(db, `${MEDIA_ROOT}/Videos`))
    const videos = snapshot.val() || {}
    
    const moduleVideos = Object.values(videos).filter(video => video.moduleId === moduleId)
    return moduleVideos.length
  } catch (error) {
    console.error('Erreur lors du comptage des vidéos:', error)
    return 0
  }
}

export async function getModulesWithVideoCount() {
  try {
    const modules = await getAllModules()
    const modulesWithCount = await Promise.all(
      modules.map(async (module) => {
        const videoCount = await getModuleVideoCount(module.id)
        return { ...module, videoCount }
      })
    )
    return modulesWithCount
  } catch (error) {
    console.error('Erreur lors de la récupération des modules avec comptage:', error)
    throw error
  }
}

export async function isVideoInModule(vimeoId) {
  try {
    const db = await getDbSafely()
    const { ref: dbRef, get, query, orderByChild, equalTo } = await import('firebase/database')
    
    const videosQuery = query(
      dbRef(db, `${MEDIA_ROOT}/Videos`),
      orderByChild('vimeoId'),
      equalTo(vimeoId)
    )
    
    const snapshot = await get(videosQuery)
    const videos = snapshot.val()
    
    if (videos) {
      const videoEntries = Object.entries(videos)
      if (videoEntries.length > 0) {
        const [videoId, videoData] = videoEntries[0]
        return {
          exists: true,
          videoId,
          moduleId: videoData.moduleId,
          videoData
        }
      }
    }
    
    return { exists: false }
  } catch (error) {
    console.error('Erreur lors de la vérification de la vidéo:', error)
    return { exists: false, error }
  }
}

export async function getVideosByVimeoIds(vimeoIds) {
  try {
    const db = await getDbSafely()
    const { ref: dbRef, get } = await import('firebase/database')
    
    const snapshot = await get(dbRef(db, `${MEDIA_ROOT}/Videos`))
    const allVideos = snapshot.val() || {}
    
    const foundVideos = {}
    
    Object.entries(allVideos).forEach(([videoId, videoData]) => {
      if (vimeoIds.includes(videoData.vimeoId)) {
        foundVideos[videoData.vimeoId] = {
          videoId,
          moduleId: videoData.moduleId,
          videoData
        }
      }
    })
    
    return foundVideos
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos par IDs Vimeo:', error)
    return {}
  }
}

// Fonction de test de connectivité Firebase
export async function testFirebaseConnection() {
  try {
    const firebase = await getFirebaseInstances()
    if (!firebase.success) {
      return {
        success: false,
        error: firebase.error?.message || 'Initialisation Firebase échouée'
      }
    }
    
    // Test simple de lecture
    const { ref: dbRef, get } = await import('firebase/database')
    await get(dbRef(firebase.db, `${MEDIA_ROOT}/test`))
    
    return {
      success: true,
      message: 'Connexion Firebase réussie'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
