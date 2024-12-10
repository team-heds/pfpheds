<!-- src/components/RightSidebar.vue -->
<template>
  <div class="right-sidebar">
    <!-- Section Communautés -->
    <div class="profile-section card">
      <div class="communities-header">
        <h4 @click="goToCommunities" class="clickable">Communautés</h4>
        <!-- Bouton pour ajouter une nouvelle communauté -->
        <Button
          icon="pi pi-plus"
          class="add-community-button p-button-rounded p-button-primary"
          @click="addCommunity"
          tooltip="Ajouter une communauté"
          tooltipOptions="{ position: 'top' }"
        />
      </div>
      <ul class="communities-list">
        <li
          v-for="(community, index) in userCommunities"
          :key="community.id"
          class="community-item"
          @click="goToCommunity(community.id)"
        >
          <Avatar
            :label="getInitial(community.name)"
            class="mr-2"
            size="large"
            shape="circle"
          />
          <span class="community-name">{{ community.name }}</span>
        </li>
        <li v-if="userCommunities.length === 0" class="text-center">
          Aucune communauté jointe.
        </li>
      </ul>
    </div>

    <!-- Section Hashtags -->
    <div class="profile-section card">
      <div class="hashtags">
        <h4>Hashtags</h4>
        <ul>
          <li v-for="(hashtag, index) in hashtags" :key="index">
            <Chip :label="hashtag" removable />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Chip from "primevue/chip";
import { ref, onMounted, onUnmounted } from "vue";
import { auth, db } from "../../../../firebase.js";
import { onValue, ref as dbRef, get } from "firebase/database";

export default {
  name: "RightSidebar",
  components: {
    Avatar,
    Button,
    Chip,
  },
  data() {
    return {
      userCommunities: [], // Communautés de l'utilisateur
      hashtags: ["#BA22", "#BA23", "#BA24", "#ALL"],
      unsubscribeUserCommunities: null, // Fonction de désabonnement
    };
  },
  methods: {
    addCommunity() {
      // Logique pour ajouter une nouvelle communauté
      console.log("Ajout d'une nouvelle communauté");
      // Vous pouvez rediriger vers une page de création de communauté ou ouvrir un modal
      this.$router.push("/create-community");
    },
    goToCommunity(communityId) {
      // Logique pour naviguer vers une communauté spécifique
      console.log(`Naviguer vers la communauté avec l'ID: ${communityId}`);
      this.$router.push(`/community/${communityId}`);
    },
    goToCommunities() {
      // Redirection vers la page des communautés
      console.log("Naviguer vers la page des communautés");
      this.$router.push("/communities");
    },
    getInitial(name) {
      return name.charAt(0).toUpperCase();
    },
    async fetchCommunityDetails(communityId) {
      try {
        const communitySnapshot = await get(dbRef(db, `Communities/${communityId}`));
        if (communitySnapshot.exists()) {
          const communityData = communitySnapshot.val();
          return { id: communityId, name: communityData.name, initial: communityData.name.charAt(0).toUpperCase() };
        } else {
          console.warn(`Communauté avec l'ID ${communityId} non trouvée.`);
          return null;
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération de la communauté ${communityId}:`, error);
        return null;
      }
    },
    async updateUserCommunities(communitiesObj) {
      const communityIds = Object.keys(communitiesObj || {});
      const promises = communityIds.map(id => this.fetchCommunityDetails(id));
      const communities = await Promise.all(promises);
      this.userCommunities = communities.filter(community => community !== null);
    },
  },
  async mounted() {
    const user = auth.currentUser;
    if (user) {
      // Référence à la liste des communautés de l'utilisateur
      const userCommunitiesRef = dbRef(db, `Users/${user.uid}/communities`);

      // Écouter les changements en temps réel
      this.unsubscribeUserCommunities = onValue(userCommunitiesRef, (snapshot) => {
        const communitiesObj = snapshot.val();
        this.updateUserCommunities(communitiesObj);
      }, (error) => {
        console.error("Erreur lors de l'écoute des communautés de l'utilisateur:", error);
      });

      // Initialiser les communautés de l'utilisateur
      const snapshot = await get(userCommunitiesRef);
      const communitiesObj = snapshot.val();
      await this.updateUserCommunities(communitiesObj);
    } else {
      // Gérer l'utilisateur non authentifié
      console.error("Utilisateur non authentifié.");
    }
  },
  beforeUnmount() {
    // Désabonner les écouteurs Firebase pour éviter les fuites de mémoire
    if (this.unsubscribeUserCommunities) {
      this.unsubscribeUserCommunities();
    }
  },
};
</script>

<style scoped>
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section Communautés */
.communities-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.communities-header h4.clickable {
  cursor: pointer;
  color: var(--primary-color);
  transition: color 0.2s ease;
}

.communities-header h4.clickable:hover {
  color: var(--primary-color-hover);
}

.communities-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.community-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.community-item:hover {
  background-color: var(--surface-hover);
  border-radius: 0.5rem;
}

.community-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
}

/* Bouton pour ajouter une communauté */
.add-community-button {
  align-self: flex-end;
}

/* Section Hashtags */
.hashtags ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.hashtags li {
  margin: 0.5rem 0;
}
</style>
