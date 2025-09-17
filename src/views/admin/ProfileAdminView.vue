<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="profile-admin-page">
      <!-- Indicateur de chargement -->
      <div v-if="isLoading" class="col-12">
        <div class="card">
          <div class="text-center p-6">
            <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
            <p class="text-600 m-0">Chargement du profil...</p>
          </div>
        </div>
      </div>

      <!-- Contenu en fonction de l'onglet actif, affiché quand le chargement est terminé -->
      <div v-else class="col-12">
        <!-- On utilise "profileKey" comme clé afin de forcer la recréation des composants -->
        <ProfileInfoAdmin v-if="activeTab === 0" :user="user" :key="profileKey" />
        <DocumentsUserProfile v-if="activeTab === 1" :key="profileKey" />
        <ResumStageUserProfile v-if="activeTab === 2" :user="user" :key="profileKey" />
        <ChatProfil v-if="activeTab === 3" :key="profileKey" />
      </div>
    </div>
  </div>


</template>

<script>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
import { useRoute, useRouter } from 'vue-router';

import Navbar from '@/components/common/utils/Navbar.vue';
import ProfileInfoAdmin from '@/components/user/details/ProfileInfoAdmin.vue'
import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'
import DocumentsUserProfile from '@/components/user/details/DocumentsUserProfile.vue'
import ChatProfil from '@/components/user/details/ChatProfil.vue'

export default {
  name: 'ProfilAdmin',
  components: {
    Navbar,
    ProfileInfoAdmin,
    ResumStageUserProfile,
    DocumentsUserProfile,
    ChatProfil
    },
  setup() {
    const route = useRoute();
    const router = useRouter();

    // Onglet actif dans la vue (0: infos, 1: documents, 2: résumé, 3: chat)
    const activeTab = ref(0);

    // Chemin vers l'avatar par défaut
    const defaultAvatar = '@/assets/images/avatar/01.jpg';

    // Objet réactif pour stocker les informations de l'utilisateur sélectionné
    const user = reactive({
      uid: '',
      nom: '',
      prenom: '',
      bio: '',
      email: '',
      photoURL: '',
      ville: '',
      canton: '',
    });

    // Clé utilisée pour forcer le rechargement des composants enfants
    const profileKey = ref(0);

    // Liste de tous les utilisateurs (pour la sélection par l'administrateur)
    const usersList = ref([]);
    // ID de l'utilisateur actuellement sélectionné dans le menu déroulant
    const selectedUserId = ref(null);

    // Terme de recherche saisi par l'administrateur
    const searchTerm = ref('');

    // Indicateur de chargement
    const isLoading = ref(false);

    // Liste filtrée en fonction du terme de recherche
    const filteredUsers = computed(() => {
      if (!searchTerm.value) return usersList.value;
      return usersList.value.filter(u => {
        const fullName = (u.prenom + ' ' + u.nom).toLowerCase();
        return fullName.includes(searchTerm.value.toLowerCase());
      });
    });

    /**
     * Récupère le profil d'un utilisateur depuis Firebase à partir de son ID.
     */
    const fetchUserProfileById = async (userId) => {
      try {
        const db = getDatabase();
        const userRef = dbRef(db, `Users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          user.uid = userId;
          user.nom = userData.Nom || '';
          user.prenom = userData.Prenom || '';
          user.email = userData.Mail || '';
          user.ville = userData.Ville || '';
          user.bio = userData.Biography || '';
          user.photoURL = userData.PhotoURL || defaultAvatar;
          // Incrémente la clé pour forcer le rechargement des composants
          profileKey.value++;
        } else {
          console.error("Aucun profil trouvé pour l'ID :", userId);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
      }
    };

    /**
     * Récupère la liste de tous les utilisateurs depuis Firebase.
     */
    const fetchAllUsers = async () => {
      try {
        const db = getDatabase();
        const usersRef = dbRef(db, 'Users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const allUsers = Object.keys(usersData).map((uid) => {
            const uData = usersData[uid];
            return {
              uid,
              prenom: uData.Prenom || '',
              nom: uData.Nom || '',
              email: uData.Mail || '',
            };
          });
          usersList.value = allUsers;

          // Vérifier si un ID est fourni dans l'URL
          const routeUserId = route.params.id;
          if (routeUserId && allUsers.find((u) => u.uid === routeUserId)) {
            selectedUserId.value = routeUserId;
          } else if (allUsers.length > 0) {
            selectedUserId.value = allUsers[0].uid;
          }
          // Charge le profil du premier utilisateur sélectionné
          isLoading.value = true;
          await fetchUserProfileById(selectedUserId.value);
          isLoading.value = false;
        } else {
          console.error("Aucun utilisateur trouvé.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs :", error);
      }
    };

    /**
     * Gère le changement de l'utilisateur sélectionné par l'administrateur.
     * Se contente de mettre à jour l'URL ; le watch se chargera de recharger le profil.
     */
    const handleUserChange = () => {
      if (selectedUserId.value) {
        router.push({ name: 'ProfileAdmin', params: { id: selectedUserId.value } });
      }
    };


    // Au montage, charger la liste des utilisateurs et sélectionner celui de l'URL (si présent)
    onMounted(async () => {
      await fetchAllUsers();
    });

    // Observer les changements de l'ID dans la route et mettre à jour le profil affiché
    watch(
      () => route.params.id,
      async (newId) => {
        if (newId) {
          isLoading.value = true;
          await fetchUserProfileById(newId);
          isLoading.value = false;
        }
      }
    );


    return {
      activeTab,
      user,
      usersList,
      selectedUserId,
      handleUserChange,
      searchTerm,
      filteredUsers,
      isLoading,
      profileKey,
    };
  },
};
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.profile-admin-page {
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .profile-admin-page {
    padding: 1rem;
    padding-bottom: 6rem;
  }
}
</style>
