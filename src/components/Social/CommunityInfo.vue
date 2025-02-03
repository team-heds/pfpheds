<template>
  <Navbar />

  <div class="newsfeed-layout">
    <!-- Sidebar Gauche -->
    <div class="sidebar-left">
      <LeftSidebar />
    </div>

    <!-- Zone centrale (Main-feed) : Infos de la communauté et flux -->
    <div class="main-feed">
      <div class="community-info">
        <div class="card">
          <h1>{{ community.name }}</h1>
          <h5 class="text-white">{{ community.description }}</h5>
         <!-- <h5><strong>Créée le :</strong> {{ formattedDate }}</h5> -->
          <h6><strong>Membres :</strong> {{ memberCount }}</h6>
          <Button @click="goBack">Retour</Button>
        </div>
      </div>

      <!-- Intégration du flux de la communauté -->
      <CommunityFeed
        v-if="communityId"
        :community-id="communityId"
        :current-user="currentUser"
      />
    </div>

    <!-- Sidebar Droite -->
    <div class="sidebar-right">
      <RightSidebar />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import Navbar from "@/components/Utils/Navbar.vue";
import CommunityFeed from "@/components/Social/CommunityFeed.vue";
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue';
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue';
import { db, auth } from "@/firebase.js";
import { ref as dbRef, get } from "firebase/database";
import { useRoute, useRouter } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "CommunityInfo",
  components: {
    Navbar,
    CommunityFeed,
    LeftSidebar,
    RightSidebar,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const communityId = ref(route.params.id);
    const community = ref({});
    const formattedDate = ref("");
    const memberCount = ref(0);
    const currentUser = ref(null);

    // Récupération des informations de la communauté
    const fetchCommunityInfo = async () => {
      try {
        const snapshot = await get(dbRef(db, `Communities/${communityId.value}`));
        if (!snapshot.exists()) {
          // Redirection si la communauté n'existe pas
          return router.push({ name: "CommunityManagement" });
        }
        const data = snapshot.val();
        community.value = data;

        // Formatage de la date
        if (data.createdAt) {
          formattedDate.value = new Date(data.createdAt).toLocaleDateString();
        }
        // Nombre de membres
        memberCount.value = data.members ? Object.keys(data.members).length : 0;
      } catch (error) {
        console.error("Erreur lors de la récupération des infos de la communauté :", error);
        router.push({ name: "CommunityManagement" });
      }
    };

    // Action pour le bouton "Retour"
    const goBack = () => {
      router.back();
    };

    // Au montage du composant, on récupère les infos et on écoute l'état de l'authentification
    onMounted(() => {
      fetchCommunityInfo();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUser.value = user;
        }
      });
    });

    return {
      communityId,
      community,
      formattedDate,
      memberCount,
      currentUser,
      goBack,
    };
  },
};
</script>

<style scoped>
/* Layout global inspiré de NewsFeed.vue */
.newsfeed-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr; /* Sidebar gauche, contenu central, Sidebar droite */
  gap: 1.5rem;
  height: 100vh;
  overflow: hidden;
}

.sidebar-left {
  overflow-y: auto;
}

.main-feed {
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Masquer la barre de défilement dans le main-feed */
.main-feed::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.main-feed {
  scrollbar-width: none;
}

.sidebar-right {
  overflow-y: auto;
}

/* Styles spécifiques à CommunityInfo */



/* Responsiveness */
@media (max-width: 1024px) {
  .newsfeed-layout {
    grid-template-columns: 1fr 2fr;
  }
  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .newsfeed-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .sidebar-left {
    display: none;
  }
  .main-feed {
    overflow-y: auto;
  }
}

@media (max-width: 480px) {
  .newsfeed-layout {
    padding: 0 1rem;
  }
  .main-feed {
    gap: 0.5rem;
  }
}
</style>
