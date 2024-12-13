<!-- src/components/CommunitiesList.vue -->
<template>
  <div class="communities-list-section card shadow-sm mt-4">
    <div>
      <h2>Liste de vos communautés</h2>
    </div>

    <div>
      <DataTable v-for="community in communities" :key="community.id" class="w-full">

        <Column field="name" header="Nom">{{ community.name }}</Column>
        <Column header="Description">
          {{ community.description }}
        </Column>
        <Column field="type" header="Type"><td>{{ capitalize(community.type) }}</td></Column>
        <Column field="actions" header="Actions"></Column>
              <Button
                class="btn btn-success btn-sm m-2"
                @click="manageCommunity(community.id)"
              >
                Gérer
              </Button>
              <Button
                class="btn btn-danger btn-sm m-2"
                @click="leaveCommunity(community.id)"
              >
                Quitter
              </Button>

      </DataTable>

    </div>
  </div>
</template>

<script>
import DataTable from 'primevue/datatable'
export default {
  components: {
    DataTable
  },
  name: "CommunitiesList",
  props: {
    communities: {
      type: Array,
      required: true
    }
  },
  emits: ["manageCommunity", "leaveCommunity"],
  setup(props, { emit }) {
    // Fonction pour capitaliser la première lettre
    const capitalize = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Émettre l'événement pour gérer la communauté
    const manageCommunity = (id) => {
      emit("manageCommunity", id);
    };

    // Émettre l'événement pour quitter la communauté
    const leaveCommunity = (id) => {
      // Optionnel : Ajouter une confirmation avant de quitter
      if (confirm("Êtes-vous sûr de vouloir quitter cette communauté ?")) {
        emit("leaveCommunity", id);
      }
    };

    return {
      capitalize,
      manageCommunity,
      leaveCommunity
    };
  }
};
</script>

<style scoped>
.communities-list-section {
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

.btn-success {
  background-color: #28a745;
  color: #ffffff;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-danger {
  background-color: #dc3545;
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  margin-right: 0.5rem;
}
</style>
