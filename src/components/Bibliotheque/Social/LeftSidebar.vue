<template>
  <div class="sidebar ">
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
      </div>
    </div>

    <!-- Partie inférieure scrollable -->
    <div class="scrollable-content">
      <!-- Supprimé -->
    </div>
  </div>

  <!-- Nouvelle card Messagerie détachée -->
  <div class="messaging-card">
    <h4>Messagerie</h4>
    <br>
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

  <!-- Nouvelle card "test" sous la sidebar -->
 <div class="test-card">
  <h4>Mes événements à venir</h4>
  <ul class="event-list">
    <li v-for="event in registeredEvents" :key="event.id">
      <span class="event-title">{{ event.title }}</span>
      <span class="event-date">{{ formatSidebarDate(event.startDate) }}</span>
    </li>
    <li v-if="registeredEvents.length === 0" class="empty">Aucun événement inscrit.</li>
  </ul>
  <h4 style="margin-top:1em;">Autres événements accessibles</h4>
  <ul class="event-list">
    <li v-for="event in accessibleEvents" :key="event.id">
      <span class="event-title">{{ event.title }}</span>
      <span class="event-date">{{ formatSidebarDate(event.startDate) }}</span>
    </li>
    <li v-if="accessibleEvents.length === 0" class="empty">Aucun autre événement à venir.</li>
  </ul>
  <router-link to="/event-management">
    <button class="p-button p-button-text event-link">
      Voir tous les événements
      <span class="pi pi-arrow-right event-arrow"></span>
    </button>
  </router-link>
</div>
 
</template>
<script>
import Avatar from "primevue/avatar";
import Toast from "primevue/toast";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref as dbRef, get, update, onValue } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../../../../firebase.js';
import UserCard from '@/views/apps/chat/UserCard.vue';
import { inject, computed } from 'vue';
import { useEventStore } from '@/stores/eventStore';

const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

export default {
  name: "LeftSidebar",
  components: { UserCard, Avatar, Toast },
  data() {
    return {
      user: {
        Prenom: "",
        Nom: "",
        PhotoURL: "" || defaultAvatar,
        id: ""
      },
      recentConversations: [], // 6 dernières conversations

    };
  },
  computed: {
    userId() {
      // Si tu utilises Pinia ou un autre système, adapte ici
      const userState = this.$root?.$?.appContext.provides?.userState;
      return userState?.user?.uid || null;
    },
    eventStore() {
      return useEventStore();
    },
    events() {
      return this.eventStore.events;
    },
    registeredEvents() {
      const now = new Date();
      return this.events
        .filter(ev => {
          const reg = this.toArray(ev.registered);
          return this.userId && reg.includes(this.userId) && new Date(ev.startDate) >= now;
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    },
    accessibleEvents() {
      const now = new Date();
      const already = new Set(this.registeredEvents.map(ev => ev.id));
      return this.events
        .filter(ev => {
          const reg = this.toArray(ev.registered);
          return !already.has(ev.id)
            && new Date(ev.startDate) >= now
            && (
              ev.type === 'public'
              || (ev.type === 'private' && (
                (ev.role && this.userId && this.$root?.$?.appContext.provides?.userState?.user?.role === ev.role)
                || ev.admin === this.userId
              ))
            );
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);
    },
    userFullName() {
      return `${this.user.prenom} ${this.user.nom}`.trim() || "Utilisateur";
    },
    userPhotoURL() {
      return this.user.PhotoURL;
    },
    userInitials() {
      const { prenom, nom } = this.user;
      return (
        (prenom ? prenom[0].toUpperCase() : "") +
        (nom ? nom[0].toUpperCase() : "")
      );
    },
  },
  methods: {
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
    async fetchUserProfile(uid) {
      const db = getDatabase();
      const userRef = dbRef(db, `Users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        console.log("Utilisateur trouvé :", userData); // Debugging
        this.user = {
          prenom: userData.Prenom || "",
          nom: userData.Nom || "",
          PhotoURL: userData.PhotoURL || defaultAvatar,
          id: uid
        };
      } else {
        console.log("Aucun utilisateur trouvé avec l'UID :", uid);
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
        console.log('[DEBUG] userId courant:', userId);
        console.log('[DEBUG] conversations node complet:', data);
        // Nouvelle logique adaptée à la structure
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
        console.log('Conversations trouvées:', convs);
        // Trier par date décroissante
        convs.sort((a, b) => (b.lastReceivedMessageAt || 0) - (a.lastReceivedMessageAt || 0));
        convs = convs.slice(0, 6);
        // Récupérer les infos de l'autre utilisateur
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
        console.log('Utilisateurs à afficher:', this.recentConversations);
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
    goToProfile() {
      this.$router.push("/profile/" + this.user.id);
    },
    goToDocumentPFP() {
      this.$router.push("/documents_pfp");
    },
    async goToLogout() {
      const auth = getAuth();
      try {
        await signOut(auth);
        console.log("Utilisateur déconnecté");
        this.$router.push("/"); // Redirection à la page d'accueil
      } catch (error) {
        console.error("Erreur de déconnexion:", error);
        this.$refs.toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de déconnexion : ' + (error && error.message ? error.message : error), life: 6000 });
      }
    },
    formatSidebarDate(date) {
      if (!date) return '';
      if (typeof date === 'string') date = new Date(date);
      return date.toLocaleDateString('fr-CH', { month: '2-digit', day: '2-digit' });
    },
  },
  methods: {
    toArray(val) {
      if (Array.isArray(val)) return val;
      if (val && typeof val === 'object') return Object.values(val);
      return [];
    },
    async fetchUserProfile(uid) {
      const db = getDatabase();
      const userRef = dbRef(db, `Users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        console.log("Utilisateur trouvé :", userData); // Debugging
        this.user = {
          prenom: userData.Prenom || "",
          nom: userData.Nom || "",
          PhotoURL: userData.PhotoURL || defaultAvatar,
          id: uid
        };
      } else {
        console.log("Aucun utilisateur trouvé avec l'UID :", uid);
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
        console.log('[DEBUG] userId courant:', userId);
        console.log('[DEBUG] conversations node complet:', data);
        // Nouvelle logique adaptée à la structure
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
        console.log('Conversations trouvées:', convs);
        // Trier par date décroissante
        convs.sort((a, b) => (b.lastReceivedMessageAt || 0) - (a.lastReceivedMessageAt || 0));
        convs = convs.slice(0, 6);
        // Récupérer les infos de l'autre utilisateur
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
        console.log('Utilisateurs à afficher:', this.recentConversations);
      });
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
    // Inject events if provided by parent (EventManagement.vue)
    if (this.$root && this.$root.$emit) {
      this.$root.$emit('request-events', (events) => {
        if (Array.isArray(events)) {
          this.allEvents = events;
        }
      });
    }
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

/* Styles supplémentaires pour UserCard, etc. peuvent rester inchangés */

</style>
