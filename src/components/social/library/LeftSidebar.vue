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

  <!-- Nouvelle card Messagerie détachée
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

  -->

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
            <span class="event-type-text">{{ getEventTypeLabel(event.type) }}</span>
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
      :user-id="user.id"
      :user-profile="user"
      @register="handleRegister"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </Dialog>

  <!-- 🆕 Section Nouvelles Quêtes -->
  <QuestsSidebarCard />

</template>

<script>
import Toast from "primevue/toast";
import { getDatabase, ref as dbRef, get, update, onValue } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { supabase } from '@/supabase.js';
import UserCard from '@/views/apps/chat/UserCard.vue';
import { useEventStore } from '@/stores/eventStore';
import { useAuthStore } from '@/stores/authStore';
import EventDetail from '@/components/events/EventDetail.vue';
import QuestsSidebarCard from '@/components/gamification/QuestsSidebarCard.vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

const defaultAvatar = '@/assets/images/avatar/01.jpg';

export default {
  name: "LeftSidebar",
  components: { UserCard, Toast, EventDetail, QuestsSidebarCard, Dialog, Button }, 
  setup() {
    const eventStore = useEventStore();
    const authStore = useAuthStore();
    return {
      eventStore,
      authStore,
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
      return `${nom}.${prenom}`.trim() || "Utilisateur";
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
      console.log('📥 Chargement profil Supabase depuis user_profiles pour:', userId);
      
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
        console.log('✅ Profil Supabase chargé:', profileData);
        
        const photoURL = profileData.avatar_url || defaultAvatar;
        console.log('📷 Avatar URL récupéré:', photoURL && photoURL !== defaultAvatar ? photoURL.substring(0, 50) + '...' : 'avatar par défaut');
        
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
        console.warn('⚠️ Aucun profil trouvé dans user_profiles');
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
        console.log('Messagerie disponible uniquement pour Firebase');
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
      this.$refs.fileInput.click();
    },
    async onAvatarSelected(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const currentUser = this.authStore.user;
      if (!currentUser) {
        this.$refs.toast.add({ severity: 'error', summary: 'Erreur', detail: 'Utilisateur non connecté.', life: 4000 });
        return;
      }
      
      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        this.$refs.toast.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner une image.', life: 4000 });
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.$refs.toast.add({ severity: 'error', summary: 'Erreur', detail: 'L\'image ne doit pas dépasser 5MB.', life: 4000 });
        return;
      }
      
      this.$refs.toast.add({ severity: 'info', summary: 'Upload en cours', detail: 'Upload de votre photo...', life: 2000 });
      
      try {
        if (this.authStore.isFirebaseUser) {
          // Upload vers Firebase Storage
          const userId = currentUser.uid;
          const storage = getStorage();
          const avatarRef = storageRef(storage, `users/${userId}/profile-picture.jpg`);
          
          await uploadBytes(avatarRef, file);
          const photoURL = await getDownloadURL(avatarRef);
          
          const db = getDatabase();
          const userRef = dbRef(db, `Users/${userId}`);
          await update(userRef, { PhotoURL: photoURL });
          
          this.user.PhotoURL = photoURL;
          this.$refs.toast.add({ severity: 'success', summary: 'Succès', detail: 'Photo de profil mise à jour !', life: 4000 });
          
        } else if (this.authStore.isSupabaseUser) {
          // Solution alternative : Convertir l'image en base64 et stocker dans user_profiles
          const userId = currentUser.id;
          
          console.log('📤 Conversion de l\'image en base64...');
          
          // Lire le fichier et le convertir en base64
          const reader = new FileReader();
          
          const photoURL = await new Promise((resolve, reject) => {
            reader.onload = (e) => {
              resolve(e.target.result);
            };
            reader.onerror = (error) => {
              reject(error);
            };
            reader.readAsDataURL(file);
          });
          
          console.log('✅ Image convertie en base64 (taille:', photoURL.length, 'caractères)');
          
          // Mettre à jour user_profiles avec l'image base64
          const { data: updateData, error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              avatar_url: photoURL,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select();
          
          if (updateError) {
            console.error('❌ Erreur mise à jour profile:', updateError);
            throw updateError;
          }
          
          console.log('✅ Profil mis à jour dans user_profiles');
          console.log('📊 Données mises à jour:', updateData);
          console.log('📷 Avatar stocké:', updateData?.[0]?.avatar_url ? 'Oui (' + updateData[0].avatar_url.length + ' caractères)' : 'Non');
          
          // Mettre à jour l'UI
          this.user.PhotoURL = photoURL;
          this.$refs.toast.add({ severity: 'success', summary: 'Succès', detail: 'Photo de profil mise à jour !', life: 4000 });
        }
        
      } catch (error) {
        console.error("❌ Erreur lors de l'upload de l'avatar :", error);
        this.$refs.toast.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: 'Erreur lors de l\'upload : ' + (error?.message || error), 
          life: 6000 
        });
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
      console.log('LeftSidebar - Utilisateur connecté:', currentUser.email || currentUser.uid);
      console.log('LeftSidebar - Provider:', this.authStore.authProvider);
      
      if (this.authStore.isFirebaseUser) {
        // Logique Firebase complète
        this.user.id = currentUser.uid;
        await this.fetchUserProfile(currentUser.uid);
        this.fetchRecentConversations();
      } else if (this.authStore.isSupabaseUser) {
        // Logique Supabase - charger depuis user_profiles
        this.user.id = currentUser.id;
        await this.fetchUserProfileSupabase(currentUser.id);
        console.log('LeftSidebar - Utilisateur Supabase configuré:', this.user);
      }
    } else {
      console.log('LeftSidebar - Aucun utilisateur connecté');
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
