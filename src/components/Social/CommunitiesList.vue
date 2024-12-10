<template>
  <div class="communities-list">
    <div v-if="communities.length === 0">
      <p>Aucune communauté trouvée.</p>
    </div>
    <div v-else>
      <div v-for="community in communities" :key="community.id" class="community-card">
        <h3>{{ capitalize(community.name) }}</h3>
        <p>{{ community.description }}</p>
        <div class="buttons">
          <button class="btn btn-secondary btn-sm" @click="$emit('manageCommunity', community.id)">Gérer</button>
          <button 
            v-if="!community.isMember" 
            class="btn btn-primary btn-sm" 
            @click="joinCommunity(community.id)"
          >
            Rejoindre
          </button>
          <button 
            v-else 
            class="btn btn-danger btn-sm" 
            @click="leaveCommunity(community.id)"
          >
            Quitter
          </button>
          <button 
            class="btn btn-info btn-sm" 
            @click="viewInfo(community.id)"
          >
            Infos
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CommunitiesList",
  props: {
    communities: {
      type: Array,
      required: true
    }
  },
  methods: {
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    joinCommunity(communityId) {
      this.$emit('joinCommunity', communityId);
    },
    leaveCommunity(communityId) {
      this.$emit('leaveCommunity', communityId);
    },
    viewInfo(communityId) {
      this.$emit('viewInfo', communityId);
    }
  }
};
</script>

<style scoped>
.communities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.community-card {
  border: 1px solid #dddddd;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.buttons {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}
</style>
