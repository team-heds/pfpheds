<template>
  <div class="sidebar">
    <Toast ref="toast" />
    <!-- Partie supérieure fixe -->
    <div class="fixed-content">
      <!-- Profil utilisateur -->
      <div class="user-profile flex">
        <!-- Avatar -->
        <label style="cursor:pointer; margin:0;">
          <img
            :src="userPhotoURL"
            alt="Avatar"
            class="m-2 col-6"
            style="width: 50px; height: 50px; border-radius: 1.2rem; object-fit: cover; border:2px solid #ccc;"
            @click.prevent="triggerFileInput"
          />
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display:none"
            @change="onAvatarSelected"
          />
        </label>
        <h4 class="m-2 mt-5">
          <a @click="goToProfile" class="profile-link">{{ userFullName }}</a>
        </h4>
      </div>

      <!-- Liens supplémentaires -->
      <div class="profile-links">
        <ul>
          <li @click="goToDocumentPFP">
            <i class="pi pi-file link-icon"></i>
            <span>Documents PFP</span>
          </li>
        </ul>
        <ul>
          <li @click="goToTools">
            <i class="pi pi-globe link-icon"></i>
            <span>Outils</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Partie inférieure scrollable -->
    <div class="scrollable-content">
      <!-- Supprimé -->
    </div>
  </div>

  <!-- Nouvelle card Messagerie détachée -->
  <div class="messaging-card">
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
          
          <!-- Contenu principal -->
          <div class="flex-column flex-1">
            <span class="text-900 font-semibold block">{{ event.title }}</span>
            <span class="block text-400 text-sm">
              {{ formatEventDate(event.startDate) }}<span v-if="event.endDate"> – {{ formatEventDate(event.endDate) }}</span>
            </span>
          </div>
          <!-- Badge du type d'événement -->
          <div class="event-type-badge mr-3">
            <span class="event-type-text">{{ event.type || 'Événement' }}</span>
          </div>
        </div>
        
        <!-- Indicateur de clic -->
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
      @register="handleRegister"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </Dialog>

</template>

<script>
import Avatar from "primevue/avatar";
import Toast from "primevue/toast";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref as dbRef, get, update, onValue } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import UserCard from '@/views/apps/chat/UserCard.vue';
import { inject, computed } from 'vue';
import { useEventStore } from '@/stores/eventStore';
import EventDetail from '@/components/Events/EventDetail.vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

export default {
  name: "LeftSidebar",
  components: { UserCard, Avatar, Toast, EventDetail, Dialog, Button }, 
  setup() {
    const eventStore = useEventStore();
    return {
      eventStore
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
    };
  },
  computed: {
    userFullName() {
      return `${this.user.prenom} ${this.user.nom}`.trim() || "Utilisateur";
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
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const db = getDatabase();
        const userRef = dbRef(db, `Users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        
        let userInfo = {
          nom: 'Utilisateur',
          prenom: '',
          photoURL: ''
        };

        if (snapshot.exists()) {
          const userData = snapshot.val();
          userInfo = {
            nom: userData.Nom || 'Utilisateur',
            prenom: userData.Prenom || '',
            photoURL: userData.PhotoURL || ''
          };
        }

        // Appeler la fonction d'inscription du store
        await this.eventStore.toggleRegistration(event.id, userInfo);
        console.log('Inscription réussie');
      } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
      }
    },
    handleEdit(event) {
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
    async fetchRecentConversations() {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
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
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userId = currentUser.uid;
      const conversationId = [userId, user.id].sort().join('-');
      this.$router.push({ name: 'IndexChat', query: { id: conversationId, user: user.id } });
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    async onAvatarSelected(event) {
      const file = event.target.files[0];
      if (!file) return;
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        this.$refs.toast.add({ severity: 'error', summary: 'Erreur', detail: 'Utilisateur non connecté.', life: 4000 });
        return;
      }
      const userId = currentUser.uid;
      const storage = getStorage();
      const avatarRef = storageRef(storage, `users/${userId}/profile-picture.jpg`);
      try {
        await uploadBytes(avatarRef, file);
        const photoURL = await getDownloadURL(avatarRef);
        const db = getDatabase();
        const userRef = dbRef(db, `Users/${userId}`);
        await update(userRef, { PhotoURL: photoURL });
        this.user.PhotoURL = photoURL;
        this.$refs.toast.add({ severity: 'success', summary: 'Succès', detail: 'Photo de profil mise à jour avec succès', life: 4000 });
      } catch (error) {
        console.error("Erreur lors de l'upload de l'avatar :", error);
        this.$refs.toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de l\'upload de l\'avatar : ' + (error && error.message ? error.message : error), life: 6000 });
      }
    },
    goToProfile() {
      this.$router.push("/profile/" + this.user.id);
    },
    goToDocumentPFP() {
      this.$router.push("/documents_pfp");
    },
    goToTools() {
      this.$router.push("/outils");
    },
    async goToLogout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        console.log("Utilisateur déconnecté");
        this.$router.push("/");
      } catch (error) {
        console.error("Erreur de déconnexion:", error);
        this.$refs.toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de déconnexion : ' + (error && error.message ? error.message : error), life: 6000 });
      }
    },
    goToEventManagement() {
      this.$router.push("/event-management");
    },
    goToChat() {
      this.$router.push("/chat");
    },
  },
  mounted() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.user.id = user.uid;
        this.fetchUserProfile(user.uid);
        this.fetchRecentConversations();
      }
    });
    
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

/* Liens du profil */
.profile-link {
  text-decoration: none;
  color: var(--text-color);
  cursor: pointer;
  transition: color 0.3s ease;
}

.profile-link:hover {
  color: var(--primary-color);
}

/* Liens supplémentaires */
.profile-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.profile-links li {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: color 0.3s ease, background-color 0.3s ease;
}

.profile-links li:hover {
  color: var(--primary-color);
  background-color: var(--surface-hover);
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.link-icon {
  font-size: 1.25rem;
  margin-right: 0.5rem;
  padding: 0.5rem;
  color: var(--primary-color);
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
  transition: all 0.3s ease;
}

/* Bordures rondes comme UserCard */
.border-circles {
  border-radius: 12px;
}
</style>