<template>
  <Navbar />
  <SocialThreeColumnLayout center-max-width="78rem">
    <!-- Sidebar gauche -->
    <template #left>
      <LeftSidebar />
    </template>
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
    <template #right>
      <RightSidebar />
    </template>
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
  </SocialThreeColumnLayout>
</template>

<script setup>
// Imports Vue/Pinia/PrimeVue
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import Navbar from '@/components/common/utils/Navbar.vue';
import LeftSidebar from '@/components/social/library/LeftSidebar.vue';
import RightSidebar from '@/components/social/library/RightSidebar.vue';
import SocialThreeColumnLayout from '@/components/common/layouts/SocialThreeColumnLayout.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useEventStore } from '@/stores/eventStore';
// Composants custom
import EventForm from '@/components/events/EventForm.vue';
import EventCard from '@/components/events/EventCard.vue';
import EventDetail from '@/components/events/EventDetail.vue';

// Pinia store
const eventStore = useEventStore();
const events = computed(() => eventStore.events || []);

// Router
const router = useRouter();

// Utilisateur courant avec Supabase Auth
const currentUser = ref(null);
const userId = computed(() => currentUser.value?.id || null);

// Écouter les changements d'authentification Supabase
let authSubscription = null;
supabase.auth.getSession().then(({ data: { session } }) => {
  currentUser.value = session?.user || null;
});

authSubscription = supabase.auth.onAuthStateChange((event, session) => {
  currentUser.value = session?.user || null;
  console.log('Auth state changed:', event, currentUser.value?.id);
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
    // Adapter pour les noms de champs Supabase (start_date, end_date)
    const eventDate = new Date(ev.end_date || ev.endDate || ev.start_date || ev.startDate);
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
  // Tri par date (adapter pour Supabase)
  filtered.sort((a, b) => {
    const dateA = new Date(a.start_date || a.startDate);
    const dateB = new Date(b.start_date || b.startDate);
    return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA;
  });
  return filtered;
});

// Actions
function addEventFromForm(eventData) {
  eventStore.addEvent({ ...eventData, admin: userId.value });
  showCreateDialog.value = false;
}

async function likeEvent(event) {
  if (!userId.value) {
    alert('Vous devez être connecté pour liker un événement');
    return;
  }
  
  try {
    await eventStore.toggleLike(event.id, userId.value);
  } catch (error) {
    console.error('Erreur lors du like:', error);
    alert('Erreur lors du like');
  }
}

async function registerEvent(event) {
  if (!userId.value) {
    alert('Vous devez être connecté pour vous inscrire');
    return;
  }

  try {
    // Récupérer les infos utilisateur depuis Supabase
    let currentUserInfo = {
      nom: '',
      prenom: '',
      photoURL: currentUser.value?.user_metadata?.avatar_url || 
                currentUser.value?.user_metadata?.photoURL || 
                'https://ui-avatars.com/api/?name=Utilisateur'
    };

    // Option 1 : Depuis user_metadata Supabase Auth
    if (currentUser.value?.user_metadata) {
      const metadata = currentUser.value.user_metadata;
      currentUserInfo = {
        nom: metadata.nom || metadata.lastName || metadata.last_name || '',
        prenom: metadata.prenom || metadata.firstName || metadata.first_name || '',
        photoURL: metadata.photoURL || metadata.avatar_url || metadata.picture || 
                  'https://ui-avatars.com/api/?name=Utilisateur'
      };
    }

    // Option 2 : Essayer de récupérer depuis user_profiles
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('family_name, forname, avatar_url')
      .eq('user_id', userId.value)
      .maybeSingle();

    if (userData && !userError) {
      currentUserInfo = {
        nom: userData.family_name || currentUserInfo.nom,
        prenom: userData.forname || currentUserInfo.prenom,
        photoURL: userData.avatar_url || currentUserInfo.photoURL
      };
    }

    // Si pas de nom/prénom, utiliser l'email comme fallback
    if (!currentUserInfo.nom && !currentUserInfo.prenom) {
      const email = currentUser.value?.email || '';
      const namePart = email.split('@')[0];
      currentUserInfo.prenom = namePart || 'Utilisateur';
    }

    console.log('Infos utilisateur finales:', currentUserInfo);
    await eventStore.toggleRegistration(event.id, userId.value, event.registered, currentUserInfo);

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    // Fallback basique
    const currentUserInfo = {
      nom: '',
      prenom: currentUser.value?.email?.split('@')[0] || 'Utilisateur',
      photoURL: 'https://ui-avatars.com/api/?name=Utilisateur'
    };
    await eventStore.toggleRegistration(event.id, userId.value, event.registered, currentUserInfo);
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
  const eventsToFix = events.value.filter(event => !event.admin_uid);

  if (eventsToFix.length > 0) {
    const confirmFix = confirm(`Voulez-vous vous attribuer la propriété de ${eventsToFix.length} événement(s) sans propriétaire ?`);

    if (confirmFix) {
      try {
        for (const event of eventsToFix) {
          await eventStore.fixEventAdmin(event.id, userId.value);
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
    await eventStore.fixEventAdmin(event.id, userId.value);
    console.log('Propriété de l\'événement attribuée automatiquement');
  } catch (error) {
    console.error('Erreur lors de la correction:', error);
    alert('Erreur lors de la correction de l\'événement');
  }
}

// Charger les événements au montage
let unsubscribeEvents = null;

onMounted(async () => {
  console.log('EventManagementView mounted - Supabase version');
  try {
    console.log('Starting to listen for events...');
    unsubscribeEvents = eventStore.listenEvents();
    console.log('Events loaded:', events.value.length);
  } catch (error) {
    console.error('Error loading events:', error);
  }
});

// Nettoyer les abonnements au démontage
onUnmounted(() => {
  console.log('EventManagementView unmounted');
  
  // Désabonner du realtime events
  if (unsubscribeEvents && typeof unsubscribeEvents === 'function') {
    unsubscribeEvents();
  }
  
  // Désabonner de l'auth
  if (authSubscription && authSubscription.data && authSubscription.data.subscription) {
    authSubscription.data.subscription.unsubscribe();
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
