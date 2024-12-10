<!-- src/views/apps/community/CommunityManagement.vue -->
<template>
  <div class="community-management">
    <!-- Navbar -->
    <Navbar />

    <!-- Section de création de communauté -->
    <CreateNewCommunity 
      @communityCreated="handleCommunityCreated" 
      @showToast="handleShowToast" 
    />

    <!-- Liste des Communautés -->
    <CommunitiesList 
      :communities="communities" 
      @manageCommunity="handleManageCommunity" 
      @joinCommunity="handleJoinCommunity"
      @leaveCommunity="handleLeaveCommunity"
      @viewInfo="handleViewInfo"
      @showToast="handleShowToast" 
    />

    <!-- Liste des Communautés Publiques -->
    <PublicCommunitiesList 
      :communities="communities" 
      @manageCommunity="handleManageCommunityPublic"
      @joinCommunity="handleJoinCommunityPublic"
      @leaveCommunity="handleLeaveCommunityPublic"
      @viewInfo="handleViewInfoPublic"
      @showToast="handleShowToast" 
    />

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div 
        v-for="(toast, index) in toasts" 
        :key="index" 
        :class="['toast', toast.severity]"
      >
        <strong>{{ toast.summary }}</strong>
        <p>{{ toast.detail }}</p>
        <button @click="removeToast(index)">✖</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import Navbar from '@/components/Utils/Navbar.vue';
import CreateNewCommunity from './CreateNewCommunity.vue';
import CommunitiesList from './CommunitiesList.vue';
import PublicCommunitiesList from './PublicCommunitiesList.vue';
import { db, auth } from "@/firebase.js";
import { ref as dbRef, get, set, update, remove } from "firebase/database";
import { useRouter } from "vue-router";

export default {
  name: "CommunityManagement",
  components: {
    Navbar,
    CreateNewCommunity,
    CommunitiesList,
    PublicCommunitiesList,
  },
  setup() {
    const router = useRouter();

    // Références réactives
    const communities = ref([]);
    const toasts = ref([]);
    const localCurrentUser = ref(null);

    // Fonctions pour gérer les toasts
    const addToast = (severity, summary, detail) => {
      toasts.value.push({ severity, summary, detail });
      // Supprimer le toast après 3 secondes
      setTimeout(() => {
        removeToast(0);
      }, 3000);
    };

    const removeToast = (index) => {
      toasts.value.splice(index, 1);
    };

    // Fonction pour récupérer l'utilisateur actuel
    const fetchCurrentUser = () => {
      const user = auth.currentUser;
      if (user) {
        localCurrentUser.value = user;
      } else {
        // Gérer l'utilisateur non authentifié
        addToast('error', 'Erreur', 'Utilisateur non authentifié.');
      }
    };

    // Fonction pour récupérer les communautés
    const fetchCommunities = async () => {
      if (!localCurrentUser.value) return;

      try {
        const communitiesSnapshot = await get(dbRef(db, "Communities"));
        if (communitiesSnapshot.exists()) {
          const data = communitiesSnapshot.val();
          communities.value = Object.entries(data).map(([key, community]) => ({
            id: key,
            ...community,
            isMember: community.members && community.members[localCurrentUser.value.uid] ? true : false
          }));
        } else {
          communities.value = [];
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des communautés :", error);
        addToast('error', 'Erreur', 'Impossible de récupérer les communautés.');
      }
    };

    // Fonction pour gérer une communauté (naviguer vers ManageOneCommunity.vue)
    const handleManageCommunity = (communityId) => {
      router.push({ name: 'ManageOneCommunity', params: { id: communityId } });
    };

    // Fonction pour gérer une communauté publique (si un comportement spécifique est nécessaire)
    const handleManageCommunityPublic = (communityId) => {
      router.push({ name: 'ManageOneCommunity', params: { id: communityId } });
    };

    onMounted(() => {
      fetchCurrentUser();
      fetchCommunities();
    });

    // Fonction appelée lorsque une nouvelle communauté est créée
    const handleCommunityCreated = () => {
      fetchCommunities(); // Rafraîchir la liste des communautés
      addToast('success', 'Succès', 'Nouvelle communauté ajoutée.');
    };

    // Fonction pour gérer les toasts émis par les composants enfants
    const handleShowToast = (toast) => {
      addToast(toast.severity, toast.summary, toast.detail);
    };

    // Fonction pour rejoindre une communauté
    const handleJoinCommunity = async (communityId) => {
      if (!localCurrentUser.value) {
        addToast('error', 'Erreur', 'Utilisateur non authentifié.');
        return;
      }
      const userId = localCurrentUser.value.uid;

      try {
        // Mettre à jour les deux tables de manière atomique
        await update(dbRef(db), {
          [`Communities/${communityId}/members/${userId}`]: true,
          [`Users/${userId}/communities/${communityId}`]: true
        });

        addToast('success', 'Succès', 'Vous avez rejoint la communauté.');
        fetchCommunities();
      } catch (error) {
        console.error("Erreur lors de la jonction de la communauté :", error);
        addToast('error', 'Erreur', 'Impossible de rejoindre la communauté.');
      }
    };

    // Fonction pour quitter une communauté
    const handleLeaveCommunity = async (communityId) => {
      if (!localCurrentUser.value) {
        addToast('error', 'Erreur', 'Utilisateur non authentifié.');
        return;
      }
      const userId = localCurrentUser.value.uid;

      try {
        // Supprimer les deux entrées de manière atomique
        await update(dbRef(db), {
          [`Communities/${communityId}/members/${userId}`]: null,
          [`Users/${userId}/communities/${communityId}`]: null
        });

        addToast('success', 'Succès', 'Vous avez quitté la communauté.');
        fetchCommunities();
      } catch (error) {
        console.error("Erreur lors de la sortie de la communauté :", error);
        addToast('error', 'Erreur', 'Impossible de quitter la communauté.');
      }
    };

    // Fonction pour voir les informations d'une communauté
    const handleViewInfo = (communityId) => {
      router.push({ name: 'CommunityInfo', params: { id: communityId } });
    };

    // Fonctions spécifiques pour les communautés publiques
    const handleJoinCommunityPublic = async (communityId) => {
      await handleJoinCommunity(communityId);
    };

    const handleLeaveCommunityPublic = async (communityId) => {
      await handleLeaveCommunity(communityId);
    };

    const handleViewInfoPublic = (communityId) => {
      handleViewInfo(communityId);
    };

    // Computed property pour les communautés de l'utilisateur
    const userCommunities = computed(() => {
      return communities.value.filter(community => community.isMember);
    });

    return {
      communities,
      fetchCommunities,
      handleManageCommunity,
      handleManageCommunityPublic,
      handleCommunityCreated,
      handleShowToast,
      handleJoinCommunity,
      handleLeaveCommunity,
      handleViewInfo,
      handleJoinCommunityPublic,
      handleLeaveCommunityPublic,
      handleViewInfoPublic,
      toasts,
      removeToast,
      addToast,
      userCommunities,
      localCurrentUser
    };
  }
};
</script>

<style scoped>
.community-management {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333333; /* Texte sombre pour un bon contraste */
}

/* Card pour les sections */
.card {
  border: 1px solid #dddddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Ombre légère */
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #dddddd;
}

.card-body {
  padding: 1.5rem;
}

/* Boutons */
.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-success {
  background-color: #28a745;
  color: #ffffff;
}

.btn-success:hover {
  background-color: #1e7e34;
}

.btn-danger {
  background-color: #dc3545;
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-secondary {
  background-color: #6c757d;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-info {
  background-color: #17a2b8;
  color: #ffffff;
}

.btn-info:hover {
  background-color: #117a8b;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  margin-right: 0.5rem;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
}

.toast {
  background-color: #333333;
  color: #ffffff;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 6px;
  min-width: 250px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.toast.success {
  background-color: #28a745;
}

.toast.error {
  background-color: #dc3545;
}

.toast.warn {
  background-color: #ffc107;
  color: #212529;
}

.toast p {
  margin: 0;
  padding-left: 0.5rem;
}

.toast button {
  background: none;
  border: none;
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
}

/* Responsive Design */
@media (max-width: 768px) {
  .community-management {
    padding: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .toast {
    min-width: 200px;
    padding: 0.75rem;
  }
}
</style>
