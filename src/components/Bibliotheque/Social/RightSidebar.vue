<template>
  <div class="right-sidebar">
    <!-- Section Communautés -->
    <div class="profile-section card">
      <div class="communities-header">
        <h4>Communautés</h4>
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
          v-for="(community, index) in communities"
          :key="index"
          class="community-item"
          @click="goToCommunity(community.id)"
        >
          <Avatar
            :label="community.initial"
            class="mr-2"
            size="large"
            shape="circle"
          />
          <span class="community-name">{{ community.name }}</span>
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

export default {
  name: "RightSidebar",
  components: {
    Avatar,
    Button,
    Chip,
  },
  props: {
    currentUser: Object,
  },
  data() {
    return {
      communities: [
        { id: 1, name: "Projet Alpha", initial: "A" },
        { id: 2, name: "Beta Team", initial: "B" },
        { id: 3, name: "Gamma Group", initial: "G" },
      ],
      hashtags: ["#BA22", "#BA23", "#BA24", "#ALL"],
    };
  },
  methods: {
    addCommunity() {
      // Logique pour ajouter une nouvelle communauté
      console.log("Ajout d'une nouvelle communauté");
    },
    goToCommunity(communityId) {
      // Logique pour naviguer vers une communauté spécifique
      console.log(`Naviguer vers la communauté avec l'ID: ${communityId}`);
      // Exemple : redirection vers une route
      this.$router.push(`/community/${communityId}`);
    },
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
