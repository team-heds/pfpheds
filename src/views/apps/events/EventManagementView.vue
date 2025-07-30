<template>
  <Navbar />
  <div class="event-layout event-layout-padded">
    <!-- Sidebar gauche -->
    <div class="sidebar-left sidebar-padded">
      <LeftSidebar />
    </div>
    <!-- Zone centrale -->
    <main class="main-content main-content-padded">
      <div class="event-header-bar event-header-bar-centered">
        <header class="page-header">
          <h1 class="title">Évenements</h1>
          <p class="subtitle">
            Découvrez et participez aux événements de notre communauté
          </p>
        </header>
      </div>
      <!-- Barre de recherche et filtres avancés -->
      <div class="search-bar" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <span class="p-input-icon-left">
          <InputText v-model="searchTerm" placeholder="Rechercher par titre, description ou type" class="search-input style-bar" />
        </span>

      </div>
      <div class="filter-bar mb-5" style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <Button icon="pi pi-plus" label="Créer un événement" class="p-button-primary ml-5 mb-0" @click="showCreateDialog = true" />
        <span>
          <Button
            :outlined="!privateOnly"
            :severity="privateOnly ? 'danger' : 'secondary'"
            icon="pi pi-lock"
            label="Privé seulement"
            class="p-button-sm mr-2 same-width-btn"
            @click="privateOnly = !privateOnly"
            :aria-pressed="privateOnly.toString()"
          />
        </span>
        <span v-if="privateOnly">
          <Dropdown v-model="selectedGroup" :options="privateRolesDropdown" optionLabel="label" optionValue="value" placeholder="Rôle (tous)" class="p-inputtext p-dropdown-sm same-width-btn event-dropdown" />
        </span>
        <span>
          <Dropdown v-model="sortOrder" :options="sortOptions" optionLabel="label" optionValue="value" class="p-inputtext p-dropdown-sm same-width-btn event-dropdown" />
        </span>
      </div>

      <!-- Grille de cartes événements -->
      <div class="grid-scrollable-wrapper">
        <!-- Debug info -->
        <div v-if="events.length === 0" class="no-events-message">
          <p>Aucun événement trouvé. Total d'événements chargés: {{ events.length }}</p>
          <p>Utilisateur connecté: {{ userId ? 'Oui' : 'Non' }}</p>
          <p>Store initialisé: {{ eventStore ? 'Oui' : 'Non' }}</p>
        </div>
        
        <div class="grid-container">
          <div
            v-for="event in filteredEvents"
            :key="event.id"
            class="card-wrapper"
          >
            <EventCard
              :event="event"
              :user-id="userId"
              @like="likeEvent"
              @register="registerEvent"
              @show-details="openEventDetails"
              style="width: 20rem; height: 100%;"
            />
          </div>
          <div v-if="filteredEvents.length === 0" class="empty">Aucun événement pour l'instant.</div>
        </div>
      </div>
    </main>
    <!-- Sidebar droite -->
    <div class="sidebar-right sidebar-padded">
      <RightSidebar />
    </div>
    <!-- Modale création événement -->
    <Dialog v-model:visible="showCreateDialog" modal header="Créer un événement" :style="{ minWidth: '340px', maxWidth: '98vw' }">
      <EventForm @submit="addEventFromForm" @close="showCreateDialog = false" />
    </Dialog>
    <!-- Modale modification événement -->
    <Dialog v-model:visible="showEditDialog" modal header="Modifier l'événement" :style="{ minWidth: '340px', maxWidth: '98vw' }">
      <EventForm
        :event="eventToEdit"
        :edit-mode="true"
        @submit="updateEventFromForm"
        @close="showEditDialog = false" />
    </Dialog>
    <!-- Modale détails événement -->
    <Dialog v-model:visible="showDetailDialog" modal  :style="{ width: '600px', maxWidth: '96vw' }">
      <EventDetail
        v-if="selectedEvent"
        :event="selectedEvent"
        :user-id="userId"
        @register="registerEvent"
        @like="likeEvent"
        @edit="editEvent"
        @delete="deleteEvent"
        @fixAdmin="fixEventAdmin"
        @close="showDetailDialog = false" />
    </Dialog>
  </div>
</template>

<script setup>
// Imports Vue/Pinia/PrimeVue
import { ref, computed, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../../../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/common/utils/Navbar.vue';
import LeftSidebar from '@/components/social/library/LeftSidebar.vue';
import RightSidebar from '@/components/social/library/RightSidebar.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useEventStore } from '@/stores/eventStore';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
// Composants custom
import EventForm from '@/components/events/EventForm.vue';
import EventCard from '@/components/events/EventCard.vue';
import EventDetail from '@/components/events/EventDetail.vue';

// Pinia store
const eventStore = useEventStore();
const events = computed(() => eventStore.events || []);

// Router
const router = useRouter();

// Utilisateur courant (auth directe au lieu d'injection)
const currentUser = ref(null);
const userId = computed(() => currentUser.value?.uid || null);

// Écouter les changements d'authentification
onAuthStateChanged(auth, (user) => {
  currentUser.value = user;
});

// Modales
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDetailDialog = ref(false);
const selectedEvent = ref(null);
const eventToEdit = ref(null);

// Recherche
const searchTerm = ref('');
const privateOnly = ref(false);
const selectedGroup = ref('');
const sortOrder = ref('asc');

// Options pour Dropdown PrimeVue
const sortOptions = [
  { label: 'Plus proche', value: 'asc' },
  { label: 'Plus lointain', value: 'desc' }
];
const privateRoles = computed(() => {
  const roles = new Set();
  events.value.forEach(ev => {
    if (ev.type === 'private' && ev.role) roles.add(ev.role);
  });
  return Array.from(roles);
});
const privateRolesDropdown = computed(() => [
  { label: 'Tous', value: '' },
  ...privateRoles.value.map(r => ({ label: r, value: r }))
]);

const filteredEvents = computed(() => {
  const now = new Date();
  let filtered = events.value.filter(ev => {
    const eventDate = new Date(ev.endDate || ev.startDate);
    // Afficher uniquement les événements futurs ou du jour
    const isFuture = eventDate > now || eventDate.toDateString() === now.toDateString();
    if (!isFuture) return false;
    // Filtre privé
    if (privateOnly.value && ev.type !== 'private') return false;
    // Filtre rôle
    if (privateOnly.value && selectedGroup.value && ev.role !== selectedGroup.value) return false;
    return true;
  });
  // Recherche texte
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter(ev =>
      (ev.title && ev.title.toLowerCase().includes(term)) ||
      (ev.description && ev.description.toLowerCase().includes(term)) ||
      (ev.type && ev.type.toLowerCase().includes(term))
    );
  }
  // Tri par date
  filtered.sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA;
  });
  return filtered;
});

// Actions
function addEventFromForm(eventData) {
  eventStore.addEvent({ ...eventData, admin: userId.value });
  showCreateDialog.value = false;
}
function likeEvent(event) {
  eventStore.updateEvent(event.id, {
    likes: event.liked ? event.likes - 1 : event.likes + 1,
    liked: !event.liked
  });
}
async function registerEvent(event) {
  if (!userId.value) return;

  try {
    const db = getDatabase();
    const userRef = dbRef(db, `Users/${userId.value}`);
    const snapshot = await get(userRef);

    let currentUserInfo = {
      nom: '',
      prenom: '',
      photoURL: auth.currentUser?.photoURL || 'https://ui-avatars.com/api/?name=Utilisateur'
    };

    if (snapshot.exists()) {
      const userData = snapshot.val();
      console.log('Données utilisateur Firebase:', userData);

      currentUserInfo = {
        nom: userData.Nom || userData.nom || userData.lastName || '',
        prenom: userData.Prenom || userData.prenom || userData.firstName || '',
        photoURL: userData.PhotoURL || userData.photoURL || userData.avatar || auth.currentUser?.photoURL || 'https://ui-avatars.com/api/?name=Utilisateur'
      };
    } else {
      console.log('Aucune donnée utilisateur trouvée dans Firebase');
      // Utiliser les données de Firebase Auth comme fallback
      currentUserInfo = {
        nom: auth.currentUser?.displayName?.split(' ')[1] || '',
        prenom: auth.currentUser?.displayName?.split(' ')[0] || '',
        photoURL: auth.currentUser?.photoURL || 'https://ui-avatars.com/api/?name=Utilisateur'
      };
    }

    console.log('Infos utilisateur finales:', currentUserInfo);
    eventStore.toggleRegistration(event.id, userId.value, event.registered, currentUserInfo);

  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    // Fallback avec les données Firebase Auth
    const currentUserInfo = {
      nom: auth.currentUser?.displayName?.split(' ')[1] || '',
      prenom: auth.currentUser?.displayName?.split(' ')[0] || '',
      photoURL: auth.currentUser?.photoURL || 'https://ui-avatars.com/api/?name=Utilisateur'
    };
    eventStore.toggleRegistration(event.id, userId.value, event.registered, currentUserInfo);
  }
}
function openEventDetails(event) {
  selectedEvent.value = event;
  showDetailDialog.value = true;
}

function editEvent(event) {
  eventToEdit.value = event;
  showEditDialog.value = true;
  showDetailDialog.value = false; // Fermer la modale de détails
}

async function updateEventFromForm(eventData) {
  try {
    await eventStore.updateEventComplete(eventToEdit.value.id, eventData);
    showEditDialog.value = false;
    console.log('Événement mis à jour avec succès');
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    alert('Erreur lors de la mise à jour de l\'événement');
  }
}

async function deleteEvent(event) {
  if (confirm(`Voulez-vous vraiment supprimer l'événement "${event.title}" ?`)) {
    try {
      await eventStore.deleteEvent(event.id);
      showDetailDialog.value = false;
      console.log('Événement supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'événement');
    }
  }
}

async function fixExistingEvent() {
  if (!userId.value) {
    alert('Vous devez être connecté pour corriger un événement');
    return;
  }

  // Trouver tous les événements sans admin
  const eventsToFix = events.value.filter(event => !event.admin);

  if (eventsToFix.length > 0) {
    const confirmFix = confirm(`Voulez-vous vous attribuer la propriété de ${eventsToFix.length} événement(s) sans propriétaire ?`);

    if (confirmFix) {
      try {
        for (const event of eventsToFix) {
          await eventStore.updateEvent(event.id, { admin: userId.value });
        }
        alert(`${eventsToFix.length} événement(s) corrigé(s) ! Vous pouvez maintenant les modifier/supprimer.`);
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la correction des événements');
      }
    }
  } else {
    alert('Aucun événement à corriger trouvé');
  }
}

async function fixEventAdmin(event) {
  try {
    await eventStore.updateEvent(event.id, { admin: userId.value });
    console.log('Propriété de l\'événement attribuée automatiquement');
  } catch (error) {
    console.error('Erreur lors de la correction:', error);
    alert('Erreur lors de la correction de l\'événement');
  }
}

// Charger les événements au montage
onMounted(async () => {
  console.log('EventManagementView mounted');
  try {
    console.log('Starting to listen for events...');
    await eventStore.listenEvents();
    console.log('Events loaded:', events.value.length);
  } catch (error) {
    console.error('Error loading events:', error);
  }
});
</script>

<style scoped>
.event-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 1.5rem;
  min-height: 100vh;
}
.event-layout-padded {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
.sidebar-left, .sidebar-right {
  min-width: 0;
}
.sidebar-padded {
  padding-top: 2.2rem;
  padding-bottom: 2.2rem;
}
.main-content {
  padding: 2em 0.5em 8em 0.5em;
  min-width: 0;
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.main-content::-webkit-scrollbar {
  display: none;
}
.main-content-padded {
  padding-left: 2.5rem;
  padding-right: 2.5rem;
  padding-bottom: 8em;
}
/* Header de la page */
.page-header {
  text-align: center;
  margin-bottom: 2rem;
}
.title {
  color: var(--text-color);
  font-size: 3rem;
  font-weight: bold;
}
.subtitle {
  color: var(--text-color-secondary);
  font-size: 1.25rem;
}
.event-header-bar-centered {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8em;
  margin-bottom: 1.4em;
}
.event-title-centered {
  text-align: center;
  font-size: 2.1em;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.2em;
}
.search-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 2em;
}
.search-input {
  width: 320px;
  max-width: 90vw;
}
.style-bar {
  background-color: var(--surface-card);
  border-radius: 1.2rem;
}
.grid-scrollable-wrapper {
  margin-bottom: 2rem;
  -webkit-overflow-scrolling: touch;
}
.grid-scrollable-wrapper::-webkit-scrollbar {
  display: none;
}
.grid-scrollable-wrapper {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 2rem;
  margin: 0 auto;
}
.card-wrapper {
  display: flex;
  justify-content: center;
}
.empty {
  color: #888;
  margin: 2em 0;
  text-align: center;
  grid-column: 1/-1;
}
.no-events-message {
  text-align: center;
  padding: 2rem;
  background: var(--surface-card);
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  color: var(--text-color-secondary);
}
.no-events-message p {
  margin: 0.5rem 0;
}
.same-width-btn {
  min-width: 160px !important;
  max-width: 180px;
  flex-shrink: 0;
  height: 38px !important;
  line-height: 36px !important;
  padding: 0 1rem !important;
  font-size: 1rem;
  border-radius: 6px;
}
.event-dropdown {
  --width: 160px;
  width: 160px !important;
  min-width: 160px !important;
  max-width: 180px;
  box-sizing: border-box;
  height: 38px !important;
  line-height: 36px !important;
  font-size: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
}
.event-toolbar {
  margin-bottom: 2rem;
}
@media (max-width: 1400px) {
  .event-layout,
  .event-layout-padded {
    grid-template-columns: 1fr 4fr 1fr;
    padding-left: 0.8rem;
    padding-right: 0.8rem;
  }
  .main-content-padded {
    padding-left: 0.7rem;
    padding-right: 0.7rem;
  }
}
@media (max-width: 1100px) {
  .event-layout,
  .event-layout-padded {
    grid-template-columns: 1fr 6fr 1fr;
    padding-left: 0.2rem;
    padding-right: 0.2rem;
  }
  .main-content-padded {
    padding-left: 0.3rem;
    padding-right: 0.3rem;
  }
}
@media (max-width: 900px) {
  .event-layout,
  .event-layout-padded {
    grid-template-columns: 1fr;
    padding: 0;
  }
  .sidebar-left, .sidebar-right {
    display: none;
    padding: 0;
  }
  .main-content, .main-content-padded {
    padding: 1.2em 0.2em 1.2em 0.2em;
  }
}
@media (max-width: 700px) {
  .event-toolbar {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .same-width-btn, .event-dropdown {
    min-width: 120px !important;
    max-width: 100%;
    width: 100% !important;
    height: 36px !important;
    font-size: 0.97rem;
  }
}
</style>