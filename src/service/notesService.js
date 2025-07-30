// Service pour gérer les notes (notebooks/pages) dans la Realtime Database Firebase
import { db } from '../../firebase.js';
import { ref as dbRef, get, set, push, update, remove, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Obtenir l'ID utilisateur connecté
function getUserId() {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
}

// Charger tous les notebooks de l'utilisateur
export async function fetchNotebooks() {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const notebooksRef = dbRef(db, `Notes/${userId}`);
  const snap = await get(notebooksRef);
  if (!snap.exists()) return [];
  const data = snap.val();
  // Transforme en tableau avec id
  return Object.entries(data).map(([id, notebook]) => ({ id, ...notebook }));
}

// Ajouter un notebook
export async function addNotebook(name) {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const notebooksRef = dbRef(db, `Notes/${userId}`);
  const newNotebookRef = push(notebooksRef);
  const now = new Date().toISOString();
  await set(newNotebookRef, {
    name,
    createdAt: now,
    updatedAt: now,
    pages: {}
  });
  return newNotebookRef.key;
}

// Renommer un notebook
export async function renameNotebook(notebookId, newName) {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const notebookRef = dbRef(db, `Notes/${userId}/${notebookId}`);
  await update(notebookRef, {
    name: newName,
    updatedAt: new Date().toISOString()
  });
}

// Supprimer un notebook
export async function deleteNotebook(notebookId) {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const notebookRef = dbRef(db, `Notes/${userId}/${notebookId}`);
  await remove(notebookRef);
}

// Ajouter une page dans un notebook
export async function addPage(notebookId, pageData) {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const pagesRef = dbRef(db, `Notes/${userId}/${notebookId}/pages`);
  const newPageRef = push(pagesRef);
  const now = new Date().toISOString();
  await set(newPageRef, {
    ...pageData,
    createdAt: now,
    updatedAt: now
  });
  return newPageRef.key;
}

// Modifier une page
export async function updatePage(notebookId, pageId, pageData) {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const pageRef = dbRef(db, `Notes/${userId}/${notebookId}/pages/${pageId}`);
  await update(pageRef, {
    ...pageData,
    updatedAt: new Date().toISOString()
  });
}

// Supprimer une page
export async function deletePage(notebookId, pageId) {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const pageRef = dbRef(db, `Notes/${userId}/${notebookId}/pages/${pageId}`);
  await remove(pageRef);
}

// Charger toutes les pages d'un notebook
export async function fetchPages(notebookId) {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const pagesRef = dbRef(db, `Notes/${userId}/${notebookId}/pages`);
  const snap = await get(pagesRef);
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.entries(data).map(([id, page]) => ({ id, ...page }));
}

// (Optionnel) Écoute en temps réel d'un notebook
export function onNotebooksChange(callback) {
  const userId = getUserId();
  if (!userId) throw new Error('Utilisateur non connecté');
  const notebooksRef = dbRef(db, `Notes/${userId}`);
  return onValue(notebooksRef, (snap) => {
    if (!snap.exists()) return callback([]);
    const data = snap.val();
    callback(Object.entries(data).map(([id, notebook]) => ({ id, ...notebook })));
  });
}
