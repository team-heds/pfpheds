// Media Service (Firebase Realtime DB)
// Paths use capitalized Users/ convention per project memories.

import { getDatabase, ref as dbRef, get, set, update, push, query, orderByChild, equalTo } from 'firebase/database'
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
  const q = query(dbRef(db(), `${MEDIA_ROOT}/Modules`), orderByChild('yearId'), equalTo(yearId));
  const snapshot = await get(q);
  const val = snapshot.val() || {};
  return Object.entries(val).map(([id, m]) => ({ id, ...m }));
}

export async function listVideos({ moduleId, visibility, text }) {
  // Basic list by module; client-side filter visibility/text for now
  const q = query(dbRef(db(), `${MEDIA_ROOT}/Videos`), orderByChild('moduleId'), equalTo(moduleId));
  const snapshot = await get(q);
  const val = snapshot.val() || {};
  let arr = Object.entries(val).map(([id, v]) => ({ id, ...v }));
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
