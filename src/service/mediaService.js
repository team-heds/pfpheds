// Media Service (Firebase Realtime DB)
// Paths use capitalized Users/ convention per project memories.

import { getDatabase, ref as dbRef, get, set, update, push } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const MEDIA_ROOT = 'Media';

function db() {
  return getDatabase();
}

function uid() {
  return getAuth().currentUser?.uid || null;
}

export async function listYears() {
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Years`));
  const val = snapshot.val() || {};
  return Object.entries(val).map(([id, y]) => ({ id, ...y }));
}

export async function listModules(yearId) {
  // Récupérer tous les modules et filtrer côté client
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Modules`));
  const val = snapshot.val() || {};
  
  // Filtrer par yearId côté client
  const filteredModules = Object.entries(val)
    .filter(([id, module]) => module.yearId === yearId)
    .map(([id, m]) => ({ id, ...m }));
    
  return filteredModules;
}

export async function getAllModules() {
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Modules`));
  const val = snapshot.val() || {};
  return Object.entries(val).map(([id, m]) => ({ id, ...m }));
}

export async function createModule({ title, yearId, description, order = 1, status = 'draft' }) {
  const now = new Date().toISOString();
  const moduleData = {
    title,
    yearId,
    description: description || '',
    order,
    status,
    createdAt: now,
    updatedAt: now,
    createdBy: uid()
  };
  
  const newModuleRef = push(dbRef(db(), `${MEDIA_ROOT}/Modules`));
  await set(newModuleRef, moduleData);
  return { id: newModuleRef.key, ...moduleData };
}

export async function updateModule(moduleId, updates) {
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: uid()
  };
  
  await update(dbRef(db(), `${MEDIA_ROOT}/Modules/${moduleId}`), updateData);
  return updateData;
}

export async function deleteModule(moduleId) {
  // Vérifier s'il y a des vidéos dans ce module - filtrage côté client
  const videosSnapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Videos`));
  const videos = videosSnapshot.val() || {};
  
  // Filtrer les vidéos par moduleId côté client
  const moduleVideos = Object.values(videos).filter(video => video.moduleId === moduleId);
  
  if (moduleVideos.length > 0) {
    throw new Error('Impossible de supprimer un module contenant des vidéos');
  }
  
  await set(dbRef(db(), `${MEDIA_ROOT}/Modules/${moduleId}`), null);
}

export async function listVideos({ moduleId, visibility, text }) {
  // Récupérer toutes les vidéos et filtrer côté client
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Videos`));
  const val = snapshot.val() || {};
  
  // Filtrer par moduleId côté client
  let arr = Object.entries(val)
    .filter(([id, video]) => video.moduleId === moduleId)
    .map(([id, v]) => ({ id, ...v }));
    
  if (visibility) arr = arr.filter(v => v.visibility === visibility);
  if (text) {
    const t = text.toLowerCase();
    arr = arr.filter(v => (v.title || '').toLowerCase().includes(t) || (v.description || '').toLowerCase().includes(t));
  }
  return arr;
}

export async function getVideo(videoId) {
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Videos/${videoId}`));
  return snapshot.exists() ? { id: videoId, ...snapshot.val() } : null;
}

export async function createOrSyncVideo({ moduleId, vimeoId, title, description, durationSec, tags }) {
  const now = new Date().toISOString();
  const creator = uid();
  const payload = {
    moduleId,
    vimeoId,
    title: title || '',
    description: description || '',
    durationSec: durationSec || 0,
    tags: tags || [],
    visibility: 'draft',
    createdBy: creator,
    createdAt: now,
  };
  const newRef = push(dbRef(db(), `${MEDIA_ROOT}/Videos`));
  await set(newRef, payload);
  return { id: newRef.key, ...payload };
}

export async function setVideoVisibility(videoId, visibility) {
  await update(dbRef(db(), `${MEDIA_ROOT}/Videos/${videoId}`), { visibility });
}

export async function submitForReview(videoId, comment) {
  const now = new Date().toISOString();
  const reviewerPayload = {
    videoId,
    status: 'pending',
    reviewerId: uid(),
    comment: comment || '',
    createdAt: now,
  };
  const reviewRef = push(dbRef(db(), `${MEDIA_ROOT}/Reviews`));
  await set(reviewRef, reviewerPayload);
  await setVideoVisibility(videoId, 'in_review');
  return { id: reviewRef.key, ...reviewerPayload };
}

export async function approveReview(videoId, reviewerId, comment) {
  const now = new Date().toISOString();
  const reviewRef = push(dbRef(db(), `${MEDIA_ROOT}/Reviews`));
  const payload = { videoId, status: 'approved', reviewerId, comment: comment || '', createdAt: now };
  await set(reviewRef, payload);
  return { id: reviewRef.key, ...payload };
}

export async function publishVideo(videoId, userId) {
  const now = new Date().toISOString();
  await update(dbRef(db(), `${MEDIA_ROOT}/Videos/${videoId}`), {
    visibility: 'published',
    publishedBy: userId || uid(),
    publishedAt: now,
  });
}

export async function createShortLink(videoId) {
  const now = new Date().toISOString();
  const linkRef = push(dbRef(db(), `${MEDIA_ROOT}/Links`));
  const shortCode = linkRef.key;
  await set(linkRef, { videoId, createdBy: uid(), createdAt: now });
  return shortCode;
}

export async function resolveShortLink(code) {
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Links/${code}`));
  if (!snapshot.exists()) return null;
  return snapshot.val().videoId;
}

export async function createYear({ name, description, startDate, endDate }) {
  const now = new Date().toISOString();
  const yearData = {
    name,
    description: description || '',
    startDate,
    endDate,
    createdAt: now,
    updatedAt: now,
    createdBy: uid()
  };
  
  const newYearRef = push(dbRef(db(), `${MEDIA_ROOT}/Years`));
  await set(newYearRef, yearData);
  return { id: newYearRef.key, ...yearData };
}

// ==============================
// Tickets
// ==============================

export async function createTicket({ title, type, priority, description, videoId = null, moduleId = null }) {
  const now = new Date().toISOString();
  const tRef = push(dbRef(db(), `${MEDIA_ROOT}/Tickets`));
  const payload = {
    title: title || '',
    type: type || 'issue',
    priority: priority || 'normal',
    description: description || '',
    status: 'open',
    videoId: videoId || null,
    moduleId: moduleId || null,
    createdBy: uid(),
    createdAt: now,
    updatedAt: now,
  };
  await set(tRef, payload);
  return { id: tRef.key, ...payload };
}

export async function listTickets({ status } = {}) {
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Tickets`));
  const val = snapshot.val() || {};
  let arr = Object.entries(val).map(([id, t]) => ({ id, ...t }));
  if (status) arr = arr.filter(t => t.status === status);
  // Sort by createdAt desc
  arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return arr;
}

export async function updateTicketStatus(ticketId, status) {
  const now = new Date().toISOString();
  await update(dbRef(db(), `${MEDIA_ROOT}/Tickets/${ticketId}`), { status, updatedAt: now });
}

export async function addTicketComment(ticketId, message) {
  const now = new Date().toISOString();
  const cRef = push(dbRef(db(), `${MEDIA_ROOT}/TicketComments/${ticketId}`));
  const payload = { message, authorId: uid(), createdAt: now };
  await set(cRef, payload);
  return { id: cRef.key, ...payload };
}

export async function getModuleVideoCount(moduleId) {
  // Récupérer toutes les vidéos et filtrer côté client pour éviter l'index Firebase
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Videos`));
  const videos = snapshot.val() || {};
  
  // Filtrer les vidéos par moduleId côté client
  const moduleVideos = Object.values(videos).filter(video => video.moduleId === moduleId);
  return moduleVideos.length;
}

export async function getModulesWithVideoCount() {
  const modules = await getAllModules();
  const modulesWithCount = [];
  
  for (const module of modules) {
    const videoCount = await getModuleVideoCount(module.id);
    modulesWithCount.push({
      ...module,
      videoCount
    });
  }
  
  return modulesWithCount;
}

export async function isVideoInModule(vimeoId) {
  // Récupérer toutes les vidéos et filtrer côté client
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Videos`));
  const videos = snapshot.val() || {};
  
  // Chercher la vidéo par vimeoId côté client
  const foundVideo = Object.values(videos).find(video => video.vimeoId === vimeoId);
  return !!foundVideo;
}

export async function getVideosByVimeoIds(vimeoIds) {
  // Récupérer toutes les vidéos une seule fois et filtrer côté client
  const snapshot = await get(dbRef(db(), `${MEDIA_ROOT}/Videos`));
  const allVideos = snapshot.val() || {};
  
  const videos = {};
  
  // Parcourir toutes les vidéos et chercher celles qui correspondent aux vimeoIds
  Object.entries(allVideos).forEach(([videoId, videoData]) => {
    if (vimeoIds.includes(videoData.vimeoId)) {
      videos[videoData.vimeoId] = {
        videoId,
        moduleId: videoData.moduleId,
        videoData
      };
    }
  });
  
  return videos;
}

export async function testFirebaseConnection() {
  try {
    await get(dbRef(db(), `${MEDIA_ROOT}/test`))
    return { success: true, message: 'Connexion Firebase réussie' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
