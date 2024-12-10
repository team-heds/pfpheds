<!-- src/components/PublicCommunitiesList.vue -->
<template>
  <div class="public-communities-list-section card shadow-sm mt-4">
    <div class="card-header">
      <h2>Communautés Publiques</h2>
    </div>
    <div class="card-body p-0">
      <table class="communities-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Description</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="community in publicCommunities" :key="community.id">
            <td>{{ community.name }}</td>
            <td>{{ community.description }}</td>
            <td>{{ capitalize(community.type) }}</td>
            <td>
              <button
                class="btn btn-secondary btn-sm"
                @click="manageCommunity(community.id)"
              >
                Gérer
              </button>

              <!-- Bouton Rejoindre / Quitter -->
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

              <!-- Bouton Infos -->
              <button
                class="btn btn-info btn-sm"
                @click="viewInfo(community.id)"
              >
                Infos
              </button>
            </td>
          </tr>
          <tr v-if="publicCommunities.length === 0">
            <td colspan="4" class="text-center">Aucune communauté publique trouvée.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";

export default {
  name: "PublicCommunitiesList",
  props: {
    communities: {
      type: Array,
      required: true
    }
  },
  emits: ["manageCommunity", "joinCommunity", "leaveCommunity", "viewInfo"],
  setup(props, { emit }) {
    // Fonction pour capitaliser la première lettre
    const capitalize = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Émission de l'événement pour gérer la communauté
    const manageCommunity = (id) => {
      emit("manageCommunity", id);
    };

    // Émission de l'événement pour rejoindre la communauté
    const joinCommunity = (id) => {
      emit("joinCommunity", id);
    };

    // Émission de l'événement pour quitter la communauté
    const leaveCommunity = (id) => {
      emit("leaveCommunity", id);
    };

    // Émission de l'événement pour voir les infos de la communauté
    const viewInfo = (id) => {
      emit("viewInfo", id);
    };

    // Filtrer les communautés de type 'public'
    const publicCommunities = computed(() => {
      return props.communities.filter(community => community.type === 'public');
    });

    return {
      capitalize,
      manageCommunity,
      joinCommunity,
      leaveCommunity,
      viewInfo,
      publicCommunities
    };
  }
};
</script>

<style scoped>
.public-communities-list-section {
  margin-bottom: 2rem;
}

.communities-table {
  width: 100%;
  border-collapse: collapse;
}

.communities-table th,
.communities-table td {
  border: 1px solid #dddddd;
  padding: 1rem;
  text-align: left;
}

.communities-table th {
  background-color: #f1f1f1;
  color: #333333;
}

.communities-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.communities-table tr:hover {
  background-color: #f1f1f1;
}

/* Boutons */
.btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-secondary {
  background-color: #6c757d;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-primary {
  background-color: #007bff;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-danger {
  background-color: #dc3545;
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-info {
  background-color: #17a2b8;
  color: #ffffff;
}

.btn-info:hover {
  background-color: #117a8b;
}
</style>
