<template>
    <div class="community-info">
      <Navbar />
      <div class="info-container">
        <h1>{{ community.name }}</h1>
        <p>{{ community.description }}</p>
        <p><strong>Créée le :</strong> {{ formattedDate }}</p>
        <p><strong>Membres :</strong> {{ memberCount }}</p>
        <!-- Ajoutez d'autres informations pertinentes ici -->
        <button class="btn btn-secondary" @click="goBack">Retour</button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import Navbar from '@/components/Utils/Navbar.vue';
  import { db } from "@/firebase.js";
  import { ref as dbRef, get } from "firebase/database";
  import { useRoute, useRouter } from "vue-router";
  
  export default {
    name: "CommunityInfo",
    components: {
      Navbar
    },
    setup() {
      const route = useRoute();
      const router = useRouter();
      const community = ref({});
      const formattedDate = ref('');
      const memberCount = ref(0);
  
      const fetchCommunityInfo = async () => {
        const communityId = route.params.id;
        try {
          const communitySnapshot = await get(dbRef(db, `Communities/${communityId}`));
          if (communitySnapshot.exists()) {
            const data = communitySnapshot.val();
            community.value = data;
            formattedDate.value = new Date(data.createdAt).toLocaleDateString();
            memberCount.value = data.members ? Object.keys(data.members).length : 0;
          } else {
            // Gérer le cas où la communauté n'existe pas
            router.push({ name: 'CommunityManagement' });
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des infos de la communauté :", error);
          router.push({ name: 'CommunityManagement' });
        }
      };
  
      const goBack = () => {
        router.back();
      };
  
      onMounted(() => {
        fetchCommunityInfo();
      });
  
      return {
        community,
        formattedDate,
        memberCount,
        goBack
      };
    }
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
  