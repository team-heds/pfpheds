<template>
  <div>
    <Navbar />
    <div class="filter-menu">
      <DataTable
        :value="filteredInstitutions"
        :paginator="true"
        :rows="10"
        dataKey="InstitutionId"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['Name', 'Address', 'Locality', 'Canton', 'InstitutionId']"
        showGridlines
      >
        <!-- Table Header -->
        <template #header>
          <div class="flex justify-content-between flex-column sm:flex-row">
            <Button label="Ajouter une institution" icon="pi pi-plus" class="mb-2 mr-2" @click="goToInstitutionForm" />
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText v-model="globalFilter" placeholder="Rechercher" style="width: 100%" />
            </IconField>
          </div>
        </template>

        <!-- Empty and Loading States -->
        <template #empty> Aucun institution trouvée. </template>
        <template #loading> Chargement des données des institutions. Veuillez patienter. </template>

        <!-- Table Columns -->
        <Column field="InstitutionId" header="ID" style="min-width: 6rem" class="text-center">
          <template #body="{ data }">{{ data.InstitutionId }}</template>
        </Column>
        <Column field="Name" header="Nom de l'institution" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.Name }}</template>
        </Column>
        <Column field="Address" header="Adresse" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.Address }}</template>
        </Column>
        <Column field="Locality" header="Localité" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.Locality }}</template>
        </Column>
        <Column field="Canton" header="Canton" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.Canton }}</template>
        </Column>
        <Column field="AccordCadreDate" header="Accord Cadre" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.AccordCadreDate }}</template>
        </Column>
        <Column header="Action" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Détails" class="mb-2 mr-2" @click="goToDetails(data.InstitutionId)" />
            <Button label="Modifier" class="mb-2 mr-2" @click="goToInstitutionFormModif(data.InstitutionId)" />
            <Button label="Supprimer" class="mb-2 mr-2" @click="supprimerInstitution(data.InstitutionId)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, onValue, remove } from "firebase/database";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Navbar from '@/components/Utils/Navbar.vue';

export default {
  name: "InstitutionList",
  components: {
    DataTable,
    Column,
    InputText,
    Button,
    IconField,
    InputIcon,
    Navbar
  },
  data() {
    return {
      institutions: [],  // Contient les données d'institutions de Firebase
      filters: {},
      loading: true,
      globalFilter: ''
    };
  },
  computed: {
    filteredInstitutions() {
      // Si nécessaire, applique des filtres ici, pour l'instant, on retourne les institutions telles quelles.
      return this.institutions;
    }
  },
  async mounted() {
    try {
      const institutionsRef = ref(db, 'Institutions/');
      onValue(institutionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.institutions = Object.keys(data).map(key => ({
            InstitutionId: key,
            ...data[key]
          }));
          console.log(this.institutions); // <-- Debugging ici pour vérifier les données récupérées
        } else {
          this.institutions = [];
        }
        this.loading = false;
      });
    } catch (error) {
      console.error('Erreur de récupération des données', error);
      this.loading = false;
    }
  },
  methods: {
    supprimerInstitution(InstitutionId) {
      if (!InstitutionId) {
        alert("ID de l'institution est manquant ou incorrect.");
        return;
      }

      if (window.confirm("Êtes-vous sûr de vouloir supprimer cette institution ?")) {
        const instRef = ref(db, 'Institutions/' + InstitutionId);
        remove(instRef)
          .then(() => {
            alert("L'institution a été supprimée avec succès.");
            this.institutions = this.institutions.filter(inst => inst.InstitutionId !== InstitutionId);
          })
          .catch((error) => {
            console.error("Erreur lors de la suppression de l'institution:", error);
            alert("Une erreur est survenue lors de la suppression de l'institution.");
          });
      }
    },
    goToInstitutionForm() {
      this.$router.push({ name: 'InstitutionForm' });
    },
    goToInstitutionFormModif(id) {
      this.$router.push({ name: 'InstitutionFormModif', params: { id } });
    },
    goToDetails(id) {
      if (id) {
        this.$router.push({ name: 'InstitutionView', params: { id: id } });
      } else {
        console.error("ID is undefined for this institution.");
      }
    }
  }
};
</script>

<style scoped>
.filter-menu {
  margin: 1rem;
}
</style>
