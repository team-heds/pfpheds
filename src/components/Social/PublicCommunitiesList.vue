<!-- src/components/PublicCommunitiesList.vue -->
<template>
    <div class="public-communities-list card shadow-sm mt-4">
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
                  class="btn btn-info btn-sm"
                  @click="manageCommunity(community.id)"
                >
                  Voir
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
    emits: ["manageCommunity"],
    setup(props, { emit }) {
      // Filtrer les communautés publiques
      const publicCommunities = computed(() => {
        return props.communities.filter(
          (community) => community.type.toLowerCase() === "public"
        );
      });
  
      const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
      };
  
      const manageCommunity = (id) => {
        emit("manageCommunity", id);
      };
  
      return {
        publicCommunities,
        capitalize,
        manageCommunity
      };
    }
  };
  </script>
  
  <style scoped>
  .public-communities-list {
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
  
  .btn-info {
    background-color: #17a2b8;
    color: #ffffff;
  }
  
  .btn-info:hover {
    background-color: #138496;
  }
  
  .btn-sm {
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
  }
  </style>
  