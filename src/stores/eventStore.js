import { defineStore } from 'pinia';
import { db } from 'root/firebase';
import { ref as dbRef, onValue, push, set, update } from 'firebase/database';
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
            registered: Array.isArray(ev.registered) ? ev.registered : (ev.registered && typeof ev.registered === 'object' ? Object.values(ev.registered) : [])
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

    await set(newEventRef, {
      title: event.title,
      description: event.description,
      startDate,
      endDate,
      type: event.type,
      role: event.type === 'private' ? event.role : '',
      admin: event.admin,
      likes: 0,
      liked: false,
      registered: [],
    });
  }

  // Exemple pour mettre à jour un événement (like/register)
  async function updateEvent(id, updates) {
    const eventRef = dbRef(db, `events/${id}`);
    await update(eventRef, updates);
  }

  // Inscription/désinscription d'un utilisateur à un événement
  async function toggleRegistration(eventId, userId, registeredList = []) {
    let newList;
    if (registeredList.includes(userId)) {
      newList = registeredList.filter(id => id !== userId); // Désinscription
    } else {
      newList = [...registeredList, userId]; // Inscription
    }
    const eventRef = dbRef(db, `events/${eventId}`);
    await update(eventRef, { registered: newList });
  }

  return { events, listenEvents, addEvent, updateEvent, toggleRegistration };
});