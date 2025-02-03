<!-- src/components/PublicCommunitiesList.vue -->
<template>
  <Card class="public-communities-list-section mt-4 card">
    <template #title>
      <h2>Les Communautés Publiques</h2>
    </template>
    <template #content>
      <DataTable
        :value="publicCommunities"
        class="w-full"
        responsiveLayout="scroll"
        paginator
        rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        emptyMessage="Aucune communauté publique trouvée."
      >
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

        <!-- Colonne Actions -->
        <Column header="Actions" :style="{ minWidth: '300px' }">
          <template #body="slotProps">
            <Button
              label="Gérer"
              icon="pi pi-cog"
              class="p-button-secondary p-button-sm p-mr-2 m-2"
              @click="manageCommunity(slotProps.data.id)"
            />

            <Button
              v-if="!slotProps.data.isMember"
              label="Rejoindre"
              icon="pi pi-user-plus"
              class="p-button-primary p-button-sm p-mr-2 m-2"
              @click="joinCommunity(slotProps.data.id)"
            />
            <Button
              v-else
              label="Quitter"
              icon="pi pi-sign-out"
              class="p-button-danger p-button-sm p-mr-2 m-2"
              @click="leaveCommunity(slotProps.data.id)"
            />

            <Button
              label="Infos"
              icon="pi pi-info-circle"
              class="p-button-info p-button-sm m-2"
              @click="viewInfo(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </template>

    <!-- Composant de confirmation -->
    <ConfirmDialog />
  </Card>
</template>

<script>
import { computed } from "vue";
import { useConfirm } from "primevue/useconfirm"; // Correction de l'import
import Card from "primevue/card";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import ConfirmDialog from "primevue/confirmdialog";

export default {
  name: "PublicCommunitiesList",
  components: {
    Card,
    DataTable,
    Column,
    Button,
    ConfirmDialog,
  },
  props: {
    communities: {
      type: Array,
      required: true,
    },
  },
  emits: ["manageCommunity", "joinCommunity", "leaveCommunity", "viewInfo"],
  setup(props, { emit }) {
    const confirm = useConfirm();

    // Fonction pour capitaliser la première lettre
    const capitalize = (str) => {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Filtrer les communautés de type 'public'
    const publicCommunities = computed(() =>
      props.communities.filter((community) => community.type === "public")
    );

    // Fonctions pour émettre les événements
    const manageCommunity = (id) => {
      emit("manageCommunity", id);
    };

    const joinCommunity = (id) => {
      emit("joinCommunity", id);
    };

    const leaveCommunity = (id) => {
      confirm.require({
        message: "Êtes-vous sûr de vouloir quitter cette communauté ?",
        header: "Confirmation",
        icon: "pi pi-exclamation-triangle",
        accept: () => emit("leaveCommunity", id),
        reject: () => {},
      });
    };

    const viewInfo = (id) => {
      emit("viewInfo", id);
    };

    return {
      capitalize,
      manageCommunity,
      joinCommunity,
      leaveCommunity,
      viewInfo,
      publicCommunities,
    };
  },
};
</script>

<style scoped>
.public-communities-list-section {

}
</style>
