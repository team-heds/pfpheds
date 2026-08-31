<template>
  <div class="sidebar">
    <Toast ref="toast" />
    <!-- Partie supérieure fixe -->
    <div class="fixed-content">
      <!-- Profil utilisateur -->
      <div class="profile-overline">Mon espace</div>
      <div class="user-profile" :class="{ 'is-placeholder': !user.id }">
        <button
          type="button"
          class="avatar-button"
          aria-label="Modifier la photo de profil"
          :aria-busy="avatarUploading"
          :disabled="avatarUploading"
          @click="triggerFileInput"
        >
          <img
            :src="userPhotoURL"
            alt="Avatar"
            class="user-avatar"
          />
          <span class="avatar-edit" aria-hidden="true"><i class="pi pi-camera"></i></span>
        </button>
        <div class="user-identity">
          <button type="button" @click="goToProfile" class="profile-link">{{ userFullName }}</button>
          <p class="user-meta">{{ user.email || 'Email non renseigné' }}</p>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="avatar-input"
          :disabled="avatarUploading"
          @change="onAvatarSelected"
        />
      </div>

      <!-- Liens supplémentaires -->
      <nav class="profile-links" aria-label="Raccourcis personnels">
        <button type="button" class="profile-action" @click="goToDocumentPFP">
            <span class="profile-action__icon"><i class="pi pi-file"></i></span>
            <span>Documents pour les PFPs</span>
            <i class="pi pi-chevron-right profile-action__arrow" aria-hidden="true"></i>
        </button>
        <button type="button" class="profile-action" @click="goToTools">
            <span class="profile-action__icon"><i class="pi pi-wrench"></i></span>
            <span>Outils</span>
            <i class="pi pi-chevron-right profile-action__arrow" aria-hidden="true"></i>
        </button>
      </nav>
    </div>

    <!-- Partie inférieure scrollable -->
    <div class="scrollable-content">
      <!-- Supprimé -->
    </div>
  </div>

  <!-- Nouvelle card Messagerie détachée -->
  <div class="messaging-card" v-if="authStore.isFirebaseUser">
    <div class="flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Messagerie</h4>
      <Button
        icon="pi pi-arrow-right"
        class="p-button-text p-button-sm"
        @click="goToChat"
        v-tooltip.top="'Voir tous les chats'"
      />
    </div>
    <div class="scrollable-content">
      <div v-if="recentConversations.length === 0" class="text-center text-600 mt-4">
        Aucune conversation récente
      </div>
      <UserCard
        v-for="user in recentConversations"
        :key="user.id"
        :user="user"
        :lastReceivedMessageAt="user.lastReceivedMessageAt"
        @click="openChat(user)"
      />
    </div>
  </div>

  <!-- Section Événements à venir -->
  <div class="upcoming-events-section">
    <div class="flex justify-content-between align-items-center mb-3">
      <h4 class="section-title m-0">
        Événements à venir
      </h4>
      <Button
        icon="pi pi-arrow-right"
        class="p-button-text p-button-sm"
        @click="goToEventManagement"
        v-tooltip.top="'Voir tous les événements'"
      />
    </div>

    <div v-if="upcomingEvents.length === 0" class="no-events">
      <i class="pi pi-calendar-times text-400"></i>
      <p class="text-500 text-sm mt-2">Aucun événement à venir</p>
    </div>

    <div v-else class="events-list">
      <div
        v-for="event in upcomingEvents.slice(0, 4)"
        :key="event.id"
        class="flex flex-nowrap justify-content-between align-items-center border-1 surface-border border-circles p-3 cursor-pointer select-none hover:surface-hover transition-colors transition-duration-150 mb-2"
        @click="openEventDetail(event)"
        tabindex="0"
      >
        <div class="flex align-items-center flex-1">
          <div class="flex-column flex-1">
            <span class="text-900 font-semibold block">{{ event.title }}</span>
            <span class="block text-400 text-sm">
              {{ formatEventDate(event.startDate) }}<span v-if="event.endDate"> – {{ formatEventDate(event.endDate) }}</span>
            </span>
          </div>
          <div class="event-type-badge mr-3">
            <span class="event-type-text">{{ getEventTypeLabel(event.type) }}</span>
          </div>
        </div>

        <div class="event-arrow">
          <i class="pi pi-chevron-right text-400"></i>
        </div>
      </div>
    </div>
  </div>

  <!-- Dialog pour les détails de l'événement -->
  <Dialog
    v-model:visible="showEventDetail"
    :header="selectedEvent?.title || 'Détails de l\'événement'"
    :style="{ width: '600px', maxWidth: '96vw' }"
    :modal="true"
    :closable="true"
    :draggable="false"
  >
    <EventDetail
      v-if="selectedEvent"
      :event="selectedEvent"
      :user-id="user.id"
      :user-profile="user"
      @register="handleRegister"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </Dialog>

  <QuestsSidebarCard v-if="gamificationUserJourneyEnabled && !hideGamification" />
</template>

<script>
import Toast from "primevue/toast";
import { getDatabase, ref as dbRef, get, onValue } from "firebase/database";
import { supabase } from '@/supabase.js';
import UserCard from '@/views/apps/chat/UserCard.vue';
import { useEventStore } from '@/stores/eventStore';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import supabaseStorageService from '@/service/supabaseStorageService';
import EventDetail from '@/components/events/EventDetail.vue';
import QuestsSidebarCard from '@/components/gamification/QuestsSidebarCard.vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { gamificationFeatures } from '@/config/gamificationFeatures';

const defaultAvatar = '@/assets/images/avatar/01.jpg';

export default {
  name: "LeftSidebar",
  components: { UserCard, Toast, EventDetail, Dialog, Button, QuestsSidebarCard },
  props: {
    // Masque la carte gamification du sidebar (utilisé sur le profil pour la présentation)
    hideGamification: { type: Boolean, default: false }
  },
  setup() {
    const eventStore = useEventStore();
    const authStore = useAuthStore();
    const userStore = useUserStore();
    return {
      eventStore,
      authStore,
      userStore,
      gamificationUserJourneyEnabled: gamificationFeatures.userJourney,
      // upcomingEvents: computed(() => eventStore.upcomingEvents) // Supprimé car dupliqué
    };
  },
  data() {
    return {
      user: {
        prenom: "",
        nom: "",
        PhotoURL: "" || defaultAvatar,
        id: ""
      },
      recentConversations: [], // 6 dernières conversations
      showEventDetail: false, // Variable pour afficher/masquer le dialog
      selectedEvent: null, // Variable pour stocker l'événement sélectionné
      avatarUploading: false,
    };
  },
  computed: {
    userFullName() {
      const capitalize = (str) => {
        if (!str) return ''
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      }
      const prenom = capitalize(this.user.prenom)
      const nom = capitalize(this.user.nom)
      const display = `${nom} ${prenom}`.trim()
      return display || 'Profil utilisateur'
    },
    userPhotoURL() {
      return this.user.PhotoURL || defaultAvatar;
    },
    userInitials() {
      const { prenom, nom } = this.user;
      return (
        (prenom ? prenom[0].toUpperCase() : "") +
        (nom ? nom[0].toUpperCase() : "")
      );
    },
    upcomingEvents() {
      const now = new Date();
      const userId = this.user.id;
      
      if (!userId || !this.eventStore.events) {
        return [];
      }
      
      // Filtrer les événements où l'utilisateur est inscrit
      const userEvents = this.eventStore.events.filter(event => {
        // Vérification inscription utilisateur (compatibilité formats)
        if (!event.registered) return false;
        const isRegistered = event.registered.some(registration => {
          if (typeof registration === 'string') {
            return registration === userId;
          } else if (typeof registration === 'object' && registration.uid) {
            return registration.uid === userId;
          }
          return false;
        });
        if (!isRegistered) return false;
        const eventDate = new Date(event.endDate || event.startDate);
        return eventDate > now || eventDate.toDateString() === now.toDateString();
      });
      return userEvents
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);
    },
  },
  methods: {
    getEventTypeLabel(type) {
      switch (type) {
        case 'private':
          return 'Privé';
        case 'alpinphysio':
          return "Alp'in Physio";
        case 'public':
        default:
          return 'Public';
      }
    },
    formatEventDate(date) {
      if (!date) return '';
      if (typeof date === 'string') date = new Date(date);
      return date.toLocaleDateString('fr-CH', { 
        weekday: 'short',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatConversationDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    openEventDetail(event) {
      this.selectedEvent = event;
      this.showEventDetail = true;
    },
    async handleRegister(event) {
      // Récupérer les infos utilisateur pour l'inscription
      const currentUser = this.authStore.user;
      if (!currentUser) return;

      try {
        let userInfo = {
          nom: 'Utilisateur',
          prenom: '',
          photoURL: ''
        };
        
        // Pour Firebase, on récupère depuis Firebase DB
        if (this.authStore.isFirebaseUser) {
          const db = getDatabase();
          const userRef = dbRef(db, `Users/${currentUser.uid}`);
          const snapshot = await get(userRef);
        
          if (snapshot.exists()) {
            const userData = snapshot.val();
            userInfo = {
              nom: userData.Nom || 'Utilisateur',
              prenom: userData.Prenom || '',
              photoURL: userData.PhotoURL || ''
            };
          }
        }
        // Pour Supabase, on utilise les données disponibles
        else if (this.authStore.isSupabaseUser) {
          userInfo = {
            nom: currentUser.user_metadata?.nom || this.user.nom || 'Utilisateur',
            prenom: currentUser.user_metadata?.prenom || this.user.prenom || '',
            photoURL: currentUser.user_metadata?.photoURL || this.user.PhotoURL || ''
          };
        }

        // Appeler la fonction d'inscription du store
        await this.eventStore.toggleRegistration(event.id, userInfo);
        console.log('✅ Inscription réussie - L\'événement apparaîtra dans "Événements à venir"');
        
        // Rafraîchir les événements pour mettre à jour la liste
        await this.eventStore.fetchEvents();
        
        // Fermer le dialog après inscription
        this.showEventDetail = false;
        
        // Afficher un toast de succès
        if (this.$refs.toast) {
          this.$refs.toast.add({ 
            severity: 'success', 
            summary: 'Inscription réussie !', 
            detail: 'L\'événement apparaît maintenant dans vos événements à venir', 
            life: 4000 
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        if (this.$refs.toast) {
          this.$refs.toast.add({ 
            severity: 'error', 
            summary: 'Erreur', 
            detail: 'Impossible de s\'inscrire à l\'événement', 
            life: 4000 
          });
        }
      }
    },
    handleEdit(eventData) {
      // Fermer la modale et naviguer vers la page de gestion
      this.showEventDetail = false;
      this.$router.push('/event-management');
    },
    async handleDelete(event) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
        try {
          await this.eventStore.deleteEvent(event.id);
          this.showEventDetail = false;
          console.log('Événement supprimé');
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      }
    },
    async fetchUserProfile(uid) {
      const db = getDatabase();
      const userRef = dbRef(db, `Users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        this.user = {
          prenom: userData.Prenom || "",
          nom: userData.Nom || "",
          PhotoURL: userData.PhotoURL || defaultAvatar,
          email: userData.Mail || "",
          id: uid
        };
      }
    },
    async fetchUserProfileSupabase(userId) {
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('forname, family_name, avatar_url, email')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Erreur chargement profil:', error);
        // Fallback sur l'email de l'utilisateur connecté
        const currentUser = this.authStore.user;
        const email = currentUser?.email || '';
        const parts = email.split('@')[0].split('.');
        this.user = {
          prenom: parts[0] || 'Utilisateur',
          nom: parts[1] || '',
          PhotoURL: defaultAvatar,
          email: email,
          id: userId
        };
        return;
      }
      
      if (profileData) {
        const photoURL = profileData.avatar_url || defaultAvatar;
        this.user = {
          prenom: profileData.forname || '',
          nom: profileData.family_name || '',
          PhotoURL: photoURL,
          email: profileData.email || '',
          id: userId
        };
        
        // Forcer la mise à jour de l'UI
        this.$forceUpdate();
      } else {
        // Fallback sur l'email
        const currentUser = this.authStore.user;
        const email = currentUser?.email || '';
        const parts = email.split('@')[0].split('.');
        this.user = {
          prenom: parts[0] || 'Utilisateur',
          nom: parts[1] || '',
          PhotoURL: defaultAvatar,
          email: email,
          id: userId
        };
      }
    },
    async fetchRecentConversations() {
      const currentUser = this.authStore.user;
      if (!currentUser) return;
      
      // Pour Firebase uniquement (Supabase n'a pas cette fonctionnalité pour l'instant)
      if (!this.authStore.isFirebaseUser) {
        return;
      }
      
      const userId = currentUser.uid;
      const db = getDatabase();
      const conversationsRef = dbRef(db, 'conversations');
      onValue(conversationsRef, async (snapshot) => {
        const data = snapshot.val() || {};
        let convs = Object.entries(data)
          .filter(([key, conv]) => key.includes(userId))
          .map(([key, conv]) => {
            const [id1, id2] = key.split('-');
            const otherUserId = id1 === userId ? id2 : id1;
            return {
              id: key,
              otherUserId,
              lastReceivedMessageAt: conv.lastReceivedMessageAt || 0
            };
          });
        convs.sort((a, b) => (b.lastReceivedMessageAt || 0) - (a.lastReceivedMessageAt || 0));
        convs = convs.slice(0, 4);
        const dbUsers = dbRef(db, 'Users');
        const usersSnap = await get(dbUsers);
        const usersData = usersSnap.val() || {};
        this.recentConversations = convs.map(conv => {
          const userData = usersData[conv.otherUserId];
          if (!userData) return null;
          return {
            ...userData,
            id: conv.otherUserId,
            lastReceivedMessageAt: conv.lastReceivedMessageAt
          };
        }).filter(u => u && u.id);
      });
    },
    openChat(user) {
      const currentUser = this.authStore.user;
      if (!currentUser || !this.authStore.isFirebaseUser) return;
      const userId = currentUser.uid;
      const conversationId = [userId, user.id].sort().join('-');
      this.$router.push({ name: 'IndexChat', query: { id: conversationId, user: user.id } });
    },
    triggerFileInput() {
      if (!this.avatarUploading) this.$refs.fileInput?.click();
    },
    async onAvatarSelected(event) {
      const file = event.target.files?.[0];
      if (!file || this.avatarUploading) return;

      const currentUser = this.authStore.user;
      const userId = currentUser?.id;
      if (!userId) {
        this.$refs.toast?.add({ severity: 'error', summary: 'Avatar', detail: 'Utilisateur Supabase non connecté.', life: 4000 });
        event.target.value = '';
        return;
      }

      this.avatarUploading = true;
      try {
        const result = await supabaseStorageService.replaceUserAvatar(userId, file);
        this.user.PhotoURL = result.url;

        if (this.userStore.user?.id === userId) {
          try {
            await this.userStore.fetchProfile();
          } catch (refreshError) {
            console.warn('[Avatar] Profil enregistré, rafraîchissement différé:', refreshError);
          }
        }

        this.$refs.toast?.add({ severity: 'success', summary: 'Avatar', detail: 'Photo de profil mise à jour.', life: 4000 });
      } catch (error) {
        console.error("❌ Erreur lors de l'upload de l'avatar :", error);
        this.$refs.toast?.add({
          severity: 'error', 
          summary: 'Avatar',
          detail: error?.message || "Impossible de mettre à jour la photo de profil.",
          life: 6000 
        });
      } finally {
        this.avatarUploading = false;
        event.target.value = '';
      }
    },
    goToProfile() {
      const currentUser = this.authStore.user;
      if (currentUser) {
        // Utiliser la logique adaptée selon le système d'auth
        if (this.authStore.isFirebaseUser) {
          this.$router.push(`/profile/${currentUser.uid}`);
        } else if (this.authStore.isSupabaseUser) {
          this.$router.push(`/profile/${currentUser.id}`);
        }
      }
    },
    goToDocumentPFP() {
      this.$router.push("/documents_pfp");
    },
    goToTools() {
      this.$router.push("/outils");
    },
    async logout() {
      try {
        await this.authStore.signOut();
        this.$router.push('/home');
      } catch (error) {
        console.error('Erreur de déconnexion:', error);
      }
    },
    goToEventManagement() {
      this.$router.push("/event-management");
    },
    goToChat() {
      this.$router.push("/chat");
    },
  },
  async mounted() {
    // Initialiser l'état d'authentification
    await this.authStore.checkAuthState();
    
    const currentUser = this.authStore.user;
    if (currentUser) {
      if (this.authStore.isFirebaseUser) {
        // Logique Firebase complète
        this.user.id = currentUser.uid;
        await this.fetchUserProfile(currentUser.uid);
        this.fetchRecentConversations();
      } else if (this.authStore.isSupabaseUser) {
        // Logique Supabase - charger depuis user_profiles
        this.user.id = currentUser.id;
        await this.fetchUserProfileSupabase(currentUser.id);
      }
    }
    
    // Initialiser le store des événements
    this.eventStore.listenEvents();
  }
};
</script>

<style scoped>
.sidebar {
  margin-left: 4rem;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  height: auto;
  min-height: auto;
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 1.2rem;
  border: 1px solid var(--surface-border, rgba(148, 163, 184, 0.2));
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05);
}

.test-card {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 1.2rem;
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  font-weight: bold;
  text-align: left;
  margin-left: 4rem;
}

.messaging-card {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 1.2rem;
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  margin-left: 4rem;
}

.scrollable-content {
  flex: none;
  overflow-y: auto;
  max-height: 50vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Ajoute un espace entre les cards de messagerie */
.scrollable-content > *:not(:last-child) {
  margin-bottom: 0.75rem;
}

/* Partie supérieure fixe */
.fixed-content {
  flex: 0 0 auto; /* Ne grandit pas */
  /* Optionnel : pour qu'elle reste bien visible lors du scroll, vous pouvez utiliser sticky */
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--surface-card);
}

.profile-overline {
  margin-bottom: 0.875rem;
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Liens du profil */
.profile-link {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  text-decoration: none;
  color: var(--text-color);
  cursor: pointer;
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: start;
  transition: color 0.15s ease;
}

.profile-link:hover {
  color: var(--primary-color);
}

.user-profile {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.875rem;
  padding-bottom: 1.25rem;
}

.user-profile.is-placeholder {
  opacity: 0.9;
}

.user-meta {
  width: 100%;
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-identity { min-width: 0; }

.avatar-button {
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  padding: 0;
  border: 0;
  border-radius: 1rem;
  background: transparent;
  cursor: pointer;
}

.user-avatar {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 1rem;
  object-fit: cover;
  outline: 1px solid rgba(255, 255, 255, 0.12);
}

.avatar-edit {
  position: absolute;
  inset-inline-end: -0.25rem;
  bottom: -0.25rem;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid var(--surface-card);
  border-radius: 50%;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.65rem;
}

.avatar-input { display: none; }

/* Liens supplémentaires */
.profile-links {
  display: grid;
  gap: 0.375rem;
}

.profile-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.625rem;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  text-align: start;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.profile-action:hover {
  color: var(--primary-color);
  background-color: var(--surface-hover);
}

.profile-action__icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.625rem;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--primary-color);
}

.profile-action__arrow {
  margin-inline-start: auto;
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.profile-link:focus-visible,
.avatar-button:focus-visible,
.profile-action:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}
.event-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.95rem;
}
.event-title {
  font-weight: 500;
}
.event-date {
  color: var(--text-color-secondary);
  font-size: 0.92em;
}

.event-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--primary-color);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.event-arrow {
  font-size: 1.2em;
  margin-left: 0.2em;
}

/* Styles pour les événements */
.upcoming-events-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 1.2rem;
  background: var(--surface-card);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  margin-left: 4rem;
}

.section-title {
  font-weight: bold;


}

.no-events {
  text-align: center;
  padding: 2rem;
}

.events-list {
  display: flex;
  flex-direction: column;
}

/* Style des badges de type d'événement */
.event-type-badge {
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* Style de la flèche */
.event-arrow {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  transition: color 0.2s ease, transform 0.2s ease;
}

/* Bordures rondes comme UserCard */
.border-circles {
  border-radius: 12px;
}
</style>
