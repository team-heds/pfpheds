<template>
  <div class="community-info">
    <Navbar />
    <div class="info-container">
      <h1>{{ community.name }}</h1>
      <p>{{ community.description }}</p>
      <p><strong>Créée le :</strong> {{ formattedDate }}</p>
      <p><strong>Membres :</strong> {{ memberCount }}</p>

      <button class="btn btn-secondary" @click="goBack">Retour</button>
    </div>

    <!-- Intégration du flux (feed) de la communauté -->
    <CommunityFeed
      v-if="communityId"
      :community-id="communityId"
      :current-user="currentUser"
    />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import Navbar from "@/components/Utils/Navbar.vue";
import CommunityFeed from "@/components/Social/CommunityFeed.vue";
import { db, auth } from "@/firebase.js";
import { ref as dbRef, get } from "firebase/database";
import { useRoute, useRouter } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "CommunityInfo",
  components: {
    Navbar,
    CommunityFeed,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const communityId = ref(route.params.id);
    const community = ref({});
    const formattedDate = ref("");
    const memberCount = ref(0);
    const currentUser = ref(null);

    // Récupère les informations de la communauté
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

    // Bouton retour
    const goBack = () => {
      router.back();
    };

    // Au montage, on récupère la communauté et on écoute l'auth
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
.community-info {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333333;
}

.info-container {
  max-width: 800px;
  margin: 0 auto;
}

.info-container h1 {
  margin-bottom: 1rem;
}

.info-container p {
  margin-bottom: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.btn-secondary {
  background-color: #6c757d;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #5a6268;
}
</style>
