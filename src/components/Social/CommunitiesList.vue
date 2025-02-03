<!-- src/components/PublicCommunitiesList.vue -->
<template>
  <Card class="public-communities-list-section p-mt-4 card">
    <template #title>
      <h2>Vos Communautés</h2>
    </template>
    <template #content>
      <DataTable :value="publicCommunities" class="p-datatable-striped p-datatable-responsive" responsiveLayout="scroll"
        emptyMessage="Aucune communauté publique trouvée." paginator rows="10" :rowsPerPageOptions="[5, 10, 20]"
        globalFilter :filters="filters">
        <!-- Colonne Nom de la Communauté -->
        <Column field="name" header="Nom" sortable></Column>

        <!-- Colonne Description -->
        <Column field="description" header="Description"></Column>

        <!-- Colonne Type de Communauté -->
        <Column field="type" header="Type">
          <template #body="slotProps">
            {{ capitalize(slotProps.data.type) }}
          </template>
        </Column>

        <!-- Colonne Créée par -->
        <Column field="creatorName" header="Créée par" sortable></Column>

        <!-- Colonne Date de Création -->
        <Column field="createdAt" header="Date de Création" sortable>
          <template #body="slotProps">
            {{ slotProps.data.createdAt }}
            <!--  formatDate(slotProps.data.createdAt) || -->
          </template>
        </Column>

        <!-- Colonne Nombre de Membres -->
        <Column field="memberCount" header="Nombre de Membres" sortable></Column>

        <!-- Colonne Actions -->
        <Column header="Actions" :style="{ minWidth: '200px' }">
          <template #body="slotProps">
            <Button label="Gérer" icon="pi pi-cog" class="p-button-secondary p-button-sm p-mr-2 m-2"
              @click="manageCommunity(slotProps.data.id)" />

            <Button v-if="!slotProps.data.isMember" label="Rejoindre" icon="pi pi-user-plus"
              class="p-button-primary p-button-sm p-mr-2 m-2" @click="joinCommunity(slotProps.data.id)" />
            <Button v-else label="Quitter" icon="pi pi-sign-out" class="p-button-danger p-button-sm p-mr-2 m-2"
              @click="leaveCommunity(slotProps.data.id)" />

            <Button label="Infos" icon="pi pi-info-circle" class="p-button-info p-button-sm p-mr-2 m-2"
              @click="viewInfo(slotProps.data.id)" />
          </template>
        </Column>
      </DataTable>
    </template>

    <!-- Composant de confirmation -->
    <ConfirmDialog />
  </Card>
</template>

<script>
import { computed, ref } from "vue";
import { useConfirm } from "primevue/useconfirm";
import Card from "primevue/card";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";
import InputText from "primevue/inputtext";

export default {
  name: "PublicCommunitiesList",
  components: {
    Card,
    DataTable,
    Column,
    Button,
    ConfirmDialog,
    InputText
  },
  props: {
    communities: {
      type: Array,
      required: true,
    },
  },
  emits: ["manageCommunity", "joinCommunity", "leaveCommunity", "viewInfo"],

  setup(props, { emit }) {

    // Références pour le filtrage global
    const filters = ref({
      'global': { value: null, matchMode: 'contains' },
      'name': { value: null, matchMode: 'contains' },
      'type': { value: null, matchMode: 'equals' },
      'creatorName': { value: null, matchMode: 'contains' },
      'createdAt': { value: null, matchMode: 'dateIs' },
      'memberCount': { value: null, matchMode: 'equals' },
    });

    // Fonction pour capitaliser la première lettre
    const capitalize = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Fonction pour formater la date
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Filtrer les communautés de type 'public'
    const publicCommunities = computed(() => {
      return props.communities.filter(community => community.type === 'public').map(community => ({
        ...community,
        creatorName: community.creatorName || 'Inconnu', // Assurez-vous que cette propriété existe
        createdAt: community.createdAt || 'N/A', // Assurez-vous que cette propriété existe
        memberCount: community.members ? Object.keys(community.members).length : 0
      }));
    });

    // Fonctions pour émettre les événements
    const manageCommunity = (id) => {
      emit("manageCommunity", id);
    };

    const joinCommunity = (id) => {
      emit("joinCommunity", id);
    };

    const leaveCommunity = (id) => {
      emit("leaveCommunity", id);

    };

    const viewInfo = (id) => {
      emit("viewInfo", id);
    };

    return {
      capitalize,
      formatDate,
      manageCommunity,
      joinCommunity,
      leaveCommunity,
      viewInfo,
      publicCommunities,
      filters
    };
  }
};
</script>

<style scoped>
.public-communities-list-section {
  /* Styles supplémentaires si nécessaire */
}
</style>
