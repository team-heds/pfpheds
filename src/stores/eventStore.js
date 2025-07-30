import { defineStore } from 'pinia';
import { db } from '../../firebase.js';
import { ref as dbRef, onValue, push, set, update, remove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref } from 'vue';

export const useEventStore = defineStore('event', () => {
  const events = ref([]);

  // Charger les événements en temps réel
  function listenEvents() {
    const eventsRef = dbRef(db, 'events');
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      events.value = data
        ? Object.entries(data).map(([id, ev]) => ({
            id,
            title: ev.title || '',
            description: ev.description || '',
            startDate: ev.startDate || '',
            endDate: ev.endDate || '',
            type: ev.type || 'public',
            role: ev.role || '',
            likes: ev.likes || 0,
            liked: ev.liked || false,
            registered: Array.isArray(ev.registered) ? ev.registered : (ev.registered && typeof ev.registered === 'object' ? Object.values(ev.registered) : []),
            image: ev.image || null,
            lieu: ev.lieu || ''
          }))
        : [];
    });
  }

  // Ajouter un événement
  async function addEvent(event) {
    const eventsRef = dbRef(db, 'events');
    const newEventRef = push(eventsRef);

    // Conversion en ISO si ce sont des objets Date
    const startDate = event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate;
    const endDate = event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate;

    let imageUrl = null;
    if (event.image) {
      console.log('Image détectée pour upload:', event.image);
      console.log('Type de fichier:', event.image.type);
      console.log('Taille du fichier:', event.image.size, 'bytes');
      
      try {
        const storage = getStorage();
        console.log('Storage initialisé');
        
        const imageRef = storageRef(storage, `events/${newEventRef.key}/image`);
        console.log('Référence créée:', `events/${newEventRef.key}/image`);
        
        console.log('Début upload...');
        const uploadTask = await uploadBytes(imageRef, event.image);
        console.log('Upload terminé:', uploadTask);
        
        imageUrl = await getDownloadURL(uploadTask.ref);
        console.log('Image uploadée avec succès:', imageUrl);
      } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image:', error);
        console.error('Code erreur:', error.code);
        console.error('Message erreur:', error.message);
        console.log('L\'événement sera créé sans image');
        // On continue sans image plutôt que de faire échouer toute la création
      }
    } else {
      console.log('Aucune image fournie pour cet événement');
    }
    
    await set(newEventRef, {
      title: event.title,
      description: event.description,
      startDate,
      endDate,
      lieu: event.lieu || '',
      type: event.type,
      role: event.type === 'private' ? event.role : '',
      admin: event.admin,
      likes: 0,
      liked: false,
      registered: [],
      image: imageUrl
    });
  }

  // Exemple pour mettre à jour un événement (like/register)
  async function updateEvent(id, updates) {
    const eventRef = dbRef(db, `events/${id}`);
    await update(eventRef, updates);
  }

  // Fonction pour mettre à jour un événement complet
  async function updateEventComplete(eventId, updatedData) {
    try {
      const eventRef = dbRef(db, `events/${eventId}`);
      
      // Gestion de l'image si elle est fournie
      let imageUrl = updatedData.image;
      if (updatedData.image && typeof updatedData.image !== 'string') {
        console.log('Nouvelle image détectée pour update:', updatedData.image);
        try {
          const storage = getStorage();
          const imageRef = storageRef(storage, `events/${eventId}/image`);
          const uploadTask = await uploadBytes(imageRef, updatedData.image);
          imageUrl = await getDownloadURL(uploadTask.ref);
          console.log('Image mise à jour avec succès:', imageUrl);
        } catch (error) {
          console.error('Erreur lors de l\'upload de la nouvelle image:', error);
          imageUrl = updatedData.existingImage || null; // Garde l'ancienne URL si l'upload échoue
        }
      } else if (typeof updatedData.image === 'string') {
        imageUrl = updatedData.image; // URL existante
      } else if (updatedData.existingImage) {
        imageUrl = updatedData.existingImage; // Image existante conservée
      }

      const updateData = {
        title: updatedData.title,
        description: updatedData.description,
        startDate: updatedData.startDate instanceof Date ? updatedData.startDate.toISOString() : updatedData.startDate,
        endDate: updatedData.endDate instanceof Date ? updatedData.endDate.toISOString() : updatedData.endDate,
        lieu: updatedData.lieu || '',
        type: updatedData.type,
        role: updatedData.role || null
      };

      // Ajouter l'image seulement si elle existe
      if (imageUrl) {
        updateData.image = imageUrl;
      }

      await update(eventRef, updateData);
      console.log('Événement mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      throw error;
    }
  }

  // Fonction pour corriger les événements existants sans champ admin
  async function fixEventAdmin(eventId, adminUserId) {
    try {
      const eventRef = dbRef(db, `events/${eventId}`);
      await update(eventRef, { admin: adminUserId });
      console.log(`Événement ${eventId} mis à jour avec admin: ${adminUserId}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la correction de l\'événement:', error);
      throw error;
    }
  }

  // Fonction pour supprimer un événement
  async function deleteEvent(eventId) {
    try {
      const eventRef = dbRef(db, `events/${eventId}`);
      
      // Supprimer l'image de Firebase Storage si elle existe
      try {
        const storage = getStorage();
        const imageRef = storageRef(storage, `events/${eventId}/image`);
        await deleteObject(imageRef);
        console.log('Image supprimée de Firebase Storage');
      } catch (error) {
        console.log('Aucune image à supprimer ou erreur:', error.message);
      }

      // Supprimer l'événement de la base de données
      await remove(eventRef);
      console.log('Événement supprimé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      throw error;
    }
  }

  // Inscription/désinscription d'un utilisateur à un événement
  async function toggleRegistration(eventId, userId, registeredList = [], userInfo = null) {
    let newList;
    
    // Vérifier si l'utilisateur est déjà inscrit (par UID)
    const isRegistered = registeredList.some(item => 
      typeof item === 'string' ? item === userId : item.uid === userId
    );
    
    if (isRegistered) {
      // Désinscription - retirer l'utilisateur
      newList = registeredList.filter(item => 
        typeof item === 'string' ? item !== userId : item.uid !== userId
      );
    } else {
      // Inscription - ajouter l'utilisateur avec ses infos complètes
      const userEntry = userInfo ? {
        uid: userId,
        nom: userInfo.nom || '',
        prenom: userInfo.prenom || '',
        photoURL: userInfo.photoURL || 'https://ui-avatars.com/api/?name=Utilisateur'
      } : userId; // Fallback vers UID simple si pas d'infos
      
      newList = [...registeredList, userEntry];
    }
    
    const eventRef = dbRef(db, `events/${eventId}`);
    await update(eventRef, { registered: newList });
  }

  return { events, listenEvents, addEvent, updateEvent, updateEventComplete, deleteEvent, toggleRegistration, fixEventAdmin };
});
