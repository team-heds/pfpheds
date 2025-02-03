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
          <p><strong>Description:</strong> {{ community.description }}</p>

          <!-- <h5><strong>Créée le :</strong> {{ formattedDate }}</h5>   <Button @click="goBack">Retour</Button> -->
          <h6><strong>Membres :</strong> {{ memberCount }}</h6>
         
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
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import Navbar from "@/components/Utils/Navbar.vue";
import CommunityFeed from "@/components/Social/CommunityFeed.vue";
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue';
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue';
import { db, auth } from "@/firebase.js";
import { ref as dbRef, get } from "firebase/database";
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
    // Stocke l'ID de la communauté en fonction du paramètre d'URL
    const communityId = ref(route.params.id);
    const community = ref({});
    const formattedDate = ref("");
    const memberCount = ref(0);
    const currentUser = ref(null);

    // Fonction pour récupérer les infos de la communauté depuis la BDD
    const fetchCommunityInfo = async () => {
      try {
        const snapshot = await get(dbRef(db, `Communities/${communityId.value}`));
        if (!snapshot.exists()) {
          // Redirection si la communauté n'existe pas
          return router.push({ name: "CommunityManagement" });
        }
        const data = snapshot.val();
        community.value = data;

        // Formatage de la date (si disponible)
        if (data.createdAt) {
          formattedDate.value = new Date(data.createdAt).toLocaleDateString();
        }
        // Calcul du nombre de membres
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

    // Au montage du composant, on récupère les infos de la communauté et on écoute l'état de l'authentification
    onMounted(() => {
      fetchCommunityInfo();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUser.value = user;
        }
      });
    });

    // Lorsqu'on navigue vers une autre communauté (même composant affiché),
    // on met à jour l'ID et on recharge les infos correspondantes.
    onBeforeRouteUpdate((to, from, next) => {
      communityId.value = to.params.id;
      fetchCommunityInfo();
      next();
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
