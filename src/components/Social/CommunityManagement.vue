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

    <!-- Liste des Communautés de l'utilisateur -->
    <CommunitiesList
      :communities="userCommunities"
      @manageCommunity="handleManageCommunity"
      @click="handleLeaveCommunity"
      @showToast="handleShowToast"
    />

    <!-- Liste des Communautés Publiques -->
    <PublicCommunitiesList
      :communities="publicCommunitiesComputed"
      @manageCommunity="handleManageCommunityPublic"
      @joinCommunity="handleJoinCommunityPublic"
      @leaveCommunity="handleLeaveCommunityPublic"
      @showToast="handleShowToast"
    />

    <!-- PrimeVue Toast Notifications -->
    <Toast ref="toast" />
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

import Navbar from '@/components/Utils/Navbar.vue';
import CreateNewCommunity from './CreateNewCommunity.vue';
import CommunitiesList from './CommunitiesList.vue';
import PublicCommunitiesList from './PublicCommunitiesList.vue';
import Toast from 'primevue/toast';

import { db, auth } from "../../../firebase.js";
import { ref as dbRef, get, update } from "firebase/database";

export default {
  name: "CommunityManagement",
  components: {
    Navbar,
    CreateNewCommunity,
    CommunitiesList,
    PublicCommunitiesList,
    Toast,
  },
  setup() {
    const router = useRouter();

    // Références réactives
    const communities = ref([]);
    const publicCommunities = ref([]);
    const localCurrentUser = ref(null);
    const toast = ref(null); // Référence pour PrimeVue Toast

    // Affiche un toast via PrimeVue
    const addToast = (severity, summary, detail) => {
      if (toast.value) {
        toast.value.add({ severity, summary, detail, life: 3000 });
      } else {
        console.log("Toast", { severity, summary, detail });
      }
    };

    // Récupère l'utilisateur actuel
    const fetchCurrentUser = () => {
      const user = auth.currentUser;
      if (user) {
        localCurrentUser.value = user;
      } else {
        addToast('error', 'Erreur', 'Utilisateur non authentifié.');
      }
    };

    // Récupère l'ensemble des communautés depuis Firebase
    const fetchCommunities = async () => {
      if (!localCurrentUser.value) return;

      try {
        const communitiesSnapshot = await get(dbRef(db, "Communities"));
        if (communitiesSnapshot.exists()) {
          const data = communitiesSnapshot.val();
          const allCommunities = Object.entries(data).map(([key, community]) => ({
            id: key,
            ...community,
            isMember: community.members && community.members[localCurrentUser.value.uid] ? true : false
          }));

          // Communautés auxquelles l'utilisateur appartient
          const userComms = allCommunities.filter(community => community.isMember);
          // Communautés publiques non encore rejointes
          const publicComms = allCommunities.filter(community =>
            community.type === 'public' && !community.isMember
          );

          communities.value = userComms;
          publicCommunities.value = publicComms;
        } else {
          communities.value = [];
          publicCommunities.value = [];
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des communautés :", error);
        addToast('error', 'Erreur', 'Impossible de récupérer les communautés.');
      }
    };

    // Navigation vers la gestion d'une communauté
    const handleManageCommunity = (communityId) => {
      router.push({ name: 'ManageOneCommunity', params: { id: communityId } });
    };

    const handleManageCommunityPublic = (communityId) => {
      router.push({ name: 'ManageOneCommunity', params: { id: communityId } });
    };

    onMounted(() => {
      fetchCurrentUser();
      fetchCommunities();
    });

    // Rafraîchit la liste après création d'une communauté
    const handleCommunityCreated = () => {
      fetchCommunities();
      addToast('success', 'Succès', 'Nouvelle communauté ajoutée.');
    };

    // Permet aux composants enfants d'afficher un toast
    const handleShowToast = (toastData) => {
      addToast(toastData.severity, toastData.summary, toastData.detail);
    };

    // Rejoint une communauté
    const handleJoinCommunity = async (communityId) => {
      if (!localCurrentUser.value) {
        addToast('error', 'Erreur', 'Utilisateur non authentifié.');
        return;
      }
      const userId = localCurrentUser.value.uid;

      try {
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

    // Quitte une communauté
    // Notez que cette méthode doit recevoir l'ID de la communauté (une chaîne) et non un objet événement.
    const handleLeaveCommunity = async (communityId) => {
      console.log("ID de la communauté reçue :", communityId);
      if (!localCurrentUser.value) {
        addToast('error', 'Erreur', 'Utilisateur non authentifié.');
        return;
      }
      const userId = localCurrentUser.value.uid;

      try {
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
      console.log("Communautés après la sortie :", communities.value);
    };

    // Navigation pour afficher les informations d'une communauté
    const handleViewInfo = (communityId) => {
      router.push({ name: 'CommunityInfo', params: { id: communityId } });
    };

    // Fonctions spécifiques aux communautés publiques
    const handleJoinCommunityPublic = async (communityId) => {
      await handleJoinCommunity(communityId);
    };

    const handleLeaveCommunityPublic = async (communityId) => {
      await handleLeaveCommunity(communityId);
    };

    const handleViewInfoPublic = (communityId) => {
      handleViewInfo(communityId);
    };

    // Communautés de l'utilisateur
    const userCommunities = computed(() => {
      return communities.value.filter(community => community.isMember);
    });

    // Communautés publiques non rejointes
    const publicCommunitiesComputed = computed(() => {
      return publicCommunities.value;
    });

    return {
      communities,
      publicCommunities,
      userCommunities,
      publicCommunitiesComputed,
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
      localCurrentUser,
      toast
    };
  }
};
</script>

<style scoped>
.community-management {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333333;
}

/* Les styles de PrimeVue (pour Toast notamment) seront appliqués */
</style>
