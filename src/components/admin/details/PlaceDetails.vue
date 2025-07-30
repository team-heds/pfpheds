<template>
  <div class="container py-5">
    <div class="text-center mb-4">
      <h1 class="mb-3">Définissez les PFP</h1>
      <div class="p-grid p-fluid">
        <div class="p-col-12 p-md-6 p-lg-4">
          <div class="form-group">
            <label for="annee_civil" class="form-label">Année Académique :</label>
            <Dropdown id="annee_civil" v-model="annee_civil" :options="anneescivils" placeholder="Sélectionnez une année" class="w-full" />
          </div>
        </div>
        <div class="p-col-12 p-md-6 p-lg-4">
          <div class="form-group mt-3">
            <Button @click="ajouterAnneecivil" label="Ajouter Année Académique" class="p-button-primary-soft w-full" />
          </div>
        </div>
      </div>
      <section class="pt-5">
        <div class="container">
          <div v-if="Object.keys(placedestages).length">
            <DataTable :value="Object.entries(placedestages).flatMap(([id, places]) => places)" responsiveLayout="scroll">
              <Column field="institutionName" header="Nom Institution" :body="rowData => getInstitutionName(rowData.idInstitution)" />
              <Column field="Sector" header="Secteur" />
              <Column field="NpmPractitionerTrainer" header="Praticien Formateur" />
              <Column field="AIGU" header="AIGU">
                <template #body="slotProps">
                  <Checkbox v-model="slotProps.data.AIGU" @change="updateFirebase('AIGU', slotProps.data)" />
                </template>
              </Column>
              <Column field="REA" header="REA">
                <template #body="slotProps">
                  <Checkbox v-model="slotProps.data.REA" @change="updateFirebase('REA', slotProps.data)" />
                </template>
              </Column>
              <Column field="MSQ" header="MSQ">
                <template #body="slotProps">
                  <Checkbox v-model="slotProps.data.MSQ" @change="updateFirebase('MSQ', slotProps.data)" />
                </template>
              </Column>
              <Column field="SYSINT" header="SYSINT">
                <template #body="slotProps">
                  <Checkbox v-model="slotProps.data.SYSINT" @change="updateFirebase('SYSINT', slotProps.data)" />
                </template>
              </Column>
              <Column field="NEUROGER" header="NEUROGER">
                <template #body="slotProps">
                  <Checkbox v-model="slotProps.data.NEUROGER" @change="updateFirebase('NEUROGER', slotProps.data)" />
                </template>
              </Column>
              <Column field="AMBU" header="AMBU">
                <template #body="slotProps">
                  <Checkbox v-model="slotProps.data.AMBU" @change="updateFirebase('AMBU', slotProps.data)" />
                </template>
              </Column>
              <Column field="PFP2" header="PFP2">
                <template #body="slotProps">
                  <Checkbox :checked="isStageChecked('PFP2', slotProps.data.id)" @change="toggleStage('PFP2', slotProps.data.id, slotProps.data, $event.target.checked)" />
                </template>
              </Column>
              <Column field="PFP1A" header="PFP1A">
                <template #body="slotProps">
                  <Checkbox :checked="isStageChecked('PFP1A', slotProps.data.id)" @change="toggleStage('PFP1A', slotProps.data.id, slotProps.data, $event.target.checked)" />
                </template>
              </Column>
              <Column field="PFP1B" header="PFP1B">
                <template #body="slotProps">
                  <Checkbox :checked="isStageChecked('PFP1B', slotProps.data.id)" @change="toggleStage('PFP1B', slotProps.data.id, slotProps.data, $event.target.checked)" />
                </template>
              </Column>
              <Column field="PFP3" header="PFP3">
                <template #body="slotProps">
                  <Checkbox :checked="isStageChecked('PFP3', slotProps.data.id)" @change="toggleStage('PFP3', slotProps.data.id, slotProps.data, $event.target.checked)" />
                </template>
              </Column>
              <Column field="PFP4" header="PFP4">
                <template #body="slotProps">
                  <Checkbox :checked="isStageChecked('PFP4', slotProps.data.id)" @change="toggleStage('PFP4', slotProps.data.id, slotProps.data, $event.target.checked)" />
                </template>
              </Column>
            </DataTable>
          </div>
          <p v-else>Pas de places de stage disponibles</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, onValue, set, update, get } from "firebase/database";
import { reactive, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';

export default {
  name: 'PlaceDetails',
  components: {
    DataTable,
    Column,
    Dropdown,
    Checkbox,
    Button
  },
  data() {
    return {
      annee_civil: '',
      institutions: {},
      anneescivils: [],
      placedestages: [],
      stages: reactive({}),
    };
  },
  watch: {
    async annee_civil(newValue) {
      console.log('Année académique sélectionnée:', newValue);
      await this.fetchStages(newValue);
    },
  },
  methods: {
    async toggleStage(pfp, stageId, place, isChecked) {
      try {
        console.log('toggleStage called', { pfp, stageId, place, isChecked });

        const annee = this.annee_civil;
        const stageRef = ref(db, `annees_civils/${annee}/${pfp}/${stageId}`);

        const stageData = {
          active: isChecked,
          NpmPractitionerTrainer: place.NpmPractitionerTrainer,
          idInstitution: place.idInstitution,
          sector: place.Sector,
          NpmPractitionerTrainer: place.NpmPractitionerTrainer,
          AIGU: place.AIGU,
          REA: place.REA,
          MSQ: place.MSQ,
          SYSINT: place.SYSINT,
          NEUROGER: place.NEUROGER,
          AMBU: place.AMBU,
        };

        await set(stageRef, stageData);

        if (!this.stages[pfp]) {
          this.stages[pfp] = {};
        }
        if (!this.stages[pfp][stageId]) {
          this.stages[pfp][stageId] = stageData;
        } else {
          this.stages[pfp][stageId] = stageData;
        }

        await this.fetchStages(this.annee_civil);
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l’état du stage dans la base de données:', error);
      }
    },
    async fetchStages(annee) {
      const stagesRef = ref(db, `annees_civils/${annee}`);
      onValue(stagesRef, (snapshot) => {
        if (snapshot.exists()) {
          this.stages = snapshot.val();
        } else {
          console.error('Pas de données de stage disponibles pour cette année académique');
          this.stages = {};
        }
      });
    },
    isStageChecked(pfp, stageId) {
      return this.stages[pfp]?.[stageId]?.active || false;
    },
    async ajouterAnneecivil() {
      const annee = prompt('Veuillez entrer la nouvelle année académique:');
      const nouvelleAnneeRef = ref(db, `annees_civils/${annee}`);

      if (annee) {
        try {
          const placedestageRef = ref(db, 'placedestage/');
          let stagesIds = {};

          await onValue(placedestageRef, (snapshot) => {
            if (snapshot.exists()) {
              const allPlacedestage = snapshot.val();
              for (const id in allPlacedestage) {
                const places = allPlacedestage[id];
                for (const placeId in places) {
                  if (!stagesIds[placeId]) stagesIds[placeId] = {};
                  stagesIds[placeId].active = false;
                  stagesIds[placeId].idInstitution = places[placeId].idInstitution;
                }
              }
            }
          });

          await set(nouvelleAnneeRef, {
            PFP1A: stagesIds,
            PFP2: stagesIds,
            PFP1B: stagesIds,
            PFP3: stagesIds,
            PFP4: stagesIds,
          });
          alert(`Année académique ${annee} ajoutée avec succès!`);
        } catch (error) {
          console.error('Erreur lors de l’ajout de l’année académique:', error);
          alert('Erreur lors de l’ajout de l’année académique. Veuillez réessayer.');
        }
      }
    },
    async updateFirebase(field, place) {
      const placeRef = ref(db, `placedestage/${place.idInstitution}/${place.id}`);
      try {
        await update(placeRef, { [field]: !place[field] });
      } catch (error) {
        console.error('Erreur de mise à jour de Firebase:', error);
      }
    },
    getInstitutionName(idInstitution) {
      return this.institutions[idInstitution]?.Name || 'Nom inconnu';
    },
  },
  async mounted() {
    await this.fetchStages(this.annee_civil);

    const annee = this.annee_civil;
    const stagesRef = ref(db, `annees_civils/${annee}`);

    const pfp2Ref = ref(db, `annees_civils/${this.annee_civil}/PFP2`);
    onValue(pfp2Ref, (snapshot) => {
      if (snapshot.exists()) {
        this.stages.PFP2 = snapshot.val();
      }
    });

    onValue(stagesRef, (snapshot) => {
      if (snapshot.exists()) {
        this.stages = snapshot.val();
      }
    });

    const anneescivilsRef = ref(db, 'annees_civils');
    onValue(anneescivilsRef, (snapshot) => {
      if (snapshot.exists()) {
        this.anneescivils = Object.keys(snapshot.val());
      } else {
        console.error('Pas d’années académiques disponibles');
        this.anneescivils = [];
      }
    });

    const placedestageRef = ref(db, 'placedestage/');
    onValue(placedestageRef, (snapshot) => {
      if (snapshot.exists()) {
        const allPlacedestage = snapshot.val();
        const validPlacedestage = {};

        for (const id in allPlacedestage) {
          const places = allPlacedestage[id];
          validPlacedestage[id] = Object.values(places).filter(place => place.idInstitution);
        }

        this.placedestages = validPlacedestage;
      } else {
        console.error('Pas de placedestages disponibles');
        this.placedestages = [];
      }
    });

    const institutionsRef = ref(db, 'institutions/');
    onValue(institutionsRef, (snapshot) => {
      if (snapshot.exists()) {
        this.institutions = snapshot.val();
      } else {
        console.error('Pas d’institutions disponibles');
        this.institutions = {};
      }
    });
  }
};
</script>

<style scoped>
.container {
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.p-button-primary {
  background-color: #007bff;
  border: none;
}

.p-button-primary:hover {
  background-color: #0056b3;
}

.w-full {
  width: 100%;
}
</style>
