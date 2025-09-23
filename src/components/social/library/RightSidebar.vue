<!-- src/components/RightSidebar.vue -->
<template>
  <div class="right-sidebar">
    <!-- Section Communauté -->
    <div class="profile-section">
      <div class="communities-header">
        <h4 @click="goToCommunities" class="clickable">Communautés</h4>
      </div>
      <ul class="communities-list">
        <li
          v-for="community in userCommunities"
          :key="community.id"
          class="community-item"
        >
          <router-link :to="`/communities/info/${community.id}`" class="community-link">
            <Avatar
              :label="getInitial(community.name)"
              class="mr-2 fixed-avatar"
              size="large"
              shape="circle"
            />
            <span class="community-name">{{ community.name }}</span>
          </router-link>
        </li>
        <li v-if="userCommunities.length === 0" class="text-center">
          Aucune communauté jointe
        </li>
      </ul>
    </div>

    <!-- Section Hashtags -->
    <div class="profile-section">
      <div class="hashtags">
        <h4 class="text-color">Hashtags</h4>
        <ul>
          <li v-for="hashtag in hashtags" :key="hashtag">
            <Chip :label="hashtag" removable />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import Avatar from "primevue/avatar";
import Chip from "primevue/chip";
import { onValue, ref as dbRef, get } from "firebase/database";
import { db } from "../../../../firebase.js";
import { useAuthStore } from '@/stores/authStore';
// import { supabase } from '@/supabase'; // Décommentez si vous implémentez des requêtes Supabase

export default {
  name: "RightSidebar",
  components: {
    Avatar,
    Chip,
  },
  data() {
    return {
      userCommunities: [], // Communautés de l'utilisateur
      hashtags: ["#BA22", "#BA23", "#BA24", "#BA25", "#ALL", "#PFP1A", "#PFP1B", "#PFP2", "#PFP3", "#PFP4", "#PHYSIO", "#LLB", '#HEdS'], // Hashtags à afficher
      unsubscribeUserCommunities: null, // Fonction de désabonnement
      authStore: null, // Store d'authentification
    };
  },
  created() {
    this.authStore = useAuthStore();
  },
  methods: {
    goToCommunities() {
      console.log("Naviguer vers la page des communautés");
      this.$router.push("/communities");
    },
    getInitial(name) {
      return name ? name.charAt(0).toUpperCase() : "?";
    },
    async fetchCommunityDetails(communityId) {
      try {
        const communityRef = dbRef(db, `Communities/${communityId}`);
        const snapshot = await get(communityRef);
        if (snapshot.exists()) {
          const communityData = snapshot.val();
          return {
            id: communityId,
            name: communityData.name || "Communauté sans nom",
            initial: communityData.name.charAt(0).toUpperCase(),
          };
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
      // Filtrer uniquement les communautés dont la valeur est true
      const communityIds = Object.keys(communitiesObj || {}).filter(
        (id) => communitiesObj[id] === true
      );

      const communityPromises = communityIds.map((id) =>
        this.fetchCommunityDetails(id)
      );
      const communities = await Promise.all(communityPromises);
      this.userCommunities = communities.filter((c) => c !== null);
    },
    async loadFirebaseCommunities(user) {
      try {
        // Référence à la liste des communautés de l'utilisateur Firebase
        const userCommunitiesRef = dbRef(db, `Users/${user.uid}/communities`);

        // Écouter les changements en temps réel
        this.unsubscribeUserCommunities = onValue(
          userCommunitiesRef,
          (snapshot) => {
            const communitiesObj = snapshot.val();
            this.updateUserCommunities(communitiesObj);
          },
          (error) => {
            console.error("Erreur lors de l'écoute des communautés de l'utilisateur:", error);
          }
        );

        // Initialiser les communautés de l'utilisateur
        const snapshot = await get(userCommunitiesRef);
        const communitiesObj = snapshot.val();
        await this.updateUserCommunities(communitiesObj);
      } catch (error) {
        console.error('Erreur lors du chargement des communautés Firebase:', error);
      }
    },
    
    async loadSupabaseCommunities(user) {
      try {
        console.log('Chargement des communautés Supabase pour:', user.email);
        
        // Ici vous pouvez implémenter la logique Supabase pour récupérer les communautés
        // Par exemple, depuis une table 'user_communities' dans Supabase
        
        // Pour l'instant, on simule des communautés basées sur l'email de l'utilisateur
        const defaultCommunities = [
          {
            id: 'supabase-general-ba25',
            name: 'Général BA25',
            initial: 'G'
          },
          {
            id: 'supabase-physio-ba25',
            name: 'Physiothérapie BA25',
            initial: 'P'
          }
        ];
        
        // Si l'utilisateur est un étudiant en physio (exemple de logique)
        if (user.email && user.email.includes('physio')) {
          defaultCommunities.push({
            id: 'supabase-physio-advanced',
            name: 'Physio Avancée',
            initial: 'A'
          });
        }
        
        // Vous pouvez aussi faire une requête Supabase ici :
        // const { data, error } = await supabase
        //   .from('user_communities')
        //   .select('community_id, communities(name)')
        //   .eq('user_id', user.id);
        
        this.userCommunities = defaultCommunities;
        console.log('Communautés Supabase chargées:', this.userCommunities);
        
      } catch (error) {
        console.error('Erreur lors du chargement des communautés Supabase:', error);
        this.loadFallbackCommunities();
      }
    },
    
    loadFallbackCommunities() {
      // Communautés de secours en cas d'erreur
      this.userCommunities = [
        {
          id: 'fallback-general',
          name: 'Général',
          initial: 'G'
        }
      ];
    }
  },
  async mounted() {
    // Attendre que l'état d'authentification soit initialisé
    await this.authStore.checkAuthState();
    
    const user = this.authStore.user;
    console.log('RightSidebar - User:', user);
    console.log('RightSidebar - Auth Provider:', this.authStore.authProvider);
    
    if (user) {
      // Pour les utilisateurs Firebase, on utilise les communautés Firebase
      if (this.authStore.isFirebaseUser) {
        console.log('RightSidebar - Chargement des communautés Firebase pour:', user.uid);
        await this.loadFirebaseCommunities(user);
      } 
      // Pour les utilisateurs Supabase, on utilise la logique Supabase
      else if (this.authStore.isSupabaseUser) {
        console.log('RightSidebar - Utilisateur Supabase détecté:', user.email);
        await this.loadSupabaseCommunities(user);
      }
    } else {
      console.log("RightSidebar - Aucun utilisateur authentifié détecté.");
    }
  },
  beforeUnmount() {
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
  margin-right: 4rem;
  width: auto;
}

/* Section Communautés */
.communities-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
}

.communities-header h4.clickable {
  cursor: pointer;
  color: var(--text-color);
  transition: color 0.2s ease;
}

.communities-header h4.clickable:hover {
  color: var(--primary-color);
}

.communities-list {
  list-style: none;
  margin: 0;
}

.community-item {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem 0;
  transition: background-color 0.2s ease;
  border-radius: 1.2rem; /* Coins arrondis taille que je dois uttilser */
}

.community-item:hover {
  background-color: var(--surface-hover);
  border-radius: 1.2rem;

}

.community-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
}

.fixed-avatar {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.hashtags {
  list-style: none;
  padding: 1rem;
  margin: 0;
}

.hashtags ul {
  list-style: none;
  padding-top:  0.5rem;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hashtags li {
  margin: 0;
  display: flex;
  justify-content: left;
  flex: 0 1 auto;
}

.hashtags .p-chip {
  white-space: nowrap;
  max-width: 100%;
}

/* Optionnel : style pour le lien dans la communauté */
.community-link {
  display: flex;
  align-items: center;
  width: 100%;
  text-decoration: none;
  color: inherit;
  border-radius: 1.2rem; /* Coins arrondis taille que je dois uttilser */
}
.profile-section {
  display: flex;
  flex-direction: column;
  height: auto;
  width: 100%;
  max-height: 100vh;
  min-height: auto;
  background: var(--surface-card);
  padding: 1rem;
  border-radius: 1.2rem;
}
</style>
