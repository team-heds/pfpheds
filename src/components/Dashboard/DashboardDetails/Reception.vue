<template>
  <div class="container py-5">
    <div class="text-center mb-4">
      <h1 class="mb-3">Réception des votations</h1>
      <div>
        <label class="form-label">Classe : 22</label> <br>
        <label class="form-label">PFP : PFP2</label> <br>
        <label class="form-label">Année académique : 23</label> <br>
      </div>
    </div>

    <DataTable :value="stages" responsiveLayout="scroll">
      <template #header>
        <div class="table-header">Liste des stages</div>
      </template>
      <Column field="id" header="ETUDIANT" />
      <Column field="institution" header="Institution" />
      <Column field="canton" header="Secteur" />
      <Column field="praticien" header="Praticien Formateur" />
      <Column field="casParticulier" header="Cas particulier" />
    </DataTable>

    <div class="d-flex justify-content-center mt-4">
      <Button @click="createPFP" label="Choisir ses choix pour la PFP" class="p-button-primary" />
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, get } from "firebase/database";
import { ref as vueRef, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

export default {
  name: 'Reception',
  components: {
    DataTable,
    Column,
    Button
  },
  setup() {
    const stages = vueRef([]);

    const fetchStages = async () => {
      try {
        const stagesRef = ref(db, 'lieustage/23-PFP1A/');
        const snapshot = await get(stagesRef);
        if (snapshot.exists()) {
          stages.value = Object.values(snapshot.val());
          console.log("Stages récupérés :", stages.value);
        } else {
          console.error('Aucun stage trouvé dans lieustage/23-PFP1A');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stages:', error);
      }
    };

    const createPFP = () => {
      // Ajouter la logique pour valider PFP ici
    };

    onMounted(() => {
      fetchStages();
    });

    return {
      stages,
      createPFP
    };
  }
};
</script>

<style scoped>

</style>
