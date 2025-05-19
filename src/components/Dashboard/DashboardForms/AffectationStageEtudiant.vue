<template>
  <Navbar />
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg">
      <h1 class="text-4xl font-bold mb-4">Affecter un stage à un étudiant</h1>
    </section>
    <section class="mt-5">
      <div class="card p-4 max-w-2xl mx-auto">
        <form @submit.prevent="affecterStage">
          <div class="field mb-4">
            <label for="etudiant" class="block mb-2">Étudiant</label>
            <Dropdown id="etudiant" v-model="selectedEtudiant" :options="etudiantsOptions" optionLabel="nom" optionValue="id" class="w-full" placeholder="Sélectionnez un étudiant" filter filterPlaceholder="Rechercher un étudiant..."/>
          </div>
          <div class="field mb-4">
            <label for="stage" class="block mb-2">Stage(s)</label>
            <MultiSelect id="stage" v-model="selectedStages" :options="stagesOptions" optionLabel="titre" optionValue="id" class="w-full" placeholder="Sélectionnez un ou plusieurs stages" filter filterPlaceholder="Rechercher un stage..."/>
          </div>
          <div class="flex justify-content-end">
            <Button type="submit" label="Affecter" class="p-button-success" :disabled="!selectedEtudiant || selectedStages.length === 0" />
          </div>
        </form>
        <div v-if="message" class="mt-4 text-green-600">{{ message }}</div>
      </div>
    </section>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import { db } from '../../../../firebase.js';
import { ref, onValue, update } from "firebase/database";

export default {
  name: 'AffectationStageEtudiant',
  components: { Navbar, Dropdown, MultiSelect, Button, Divider },
  data() {
    return {
      etudiantsOptions: [], // [{ id, nom }]
      stagesOptions: [],    // [{ id, titre }]
      stagesRaw: {},         // Données brutes des places
      selectedEtudiant: null,
      selectedStages: [],
      message: '',
    };
  },
  mounted() {
    // Charger les étudiants (IDs)
    onValue(ref(db, 'Students'), (snapshot) => {
      const studentsData = snapshot.val() || {};
      onValue(ref(db, 'Users'), (usersSnap) => {
        const usersData = usersSnap.val() || {};
        this.etudiantsOptions = Object.entries(studentsData).map(([id, val]) => {
          const user = usersData[id];
          let label = id;
          if (user && user.Nom && user.Prenom) label = user.Nom + ' ' + user.Prenom;
          else if (user && user.Nom) label = user.Nom;
          else if (user && user.Prenom) label = user.Prenom;
          return { id, nom: label };
        });
      });
    });
    // Charger les places de stage avec infos d'institution
    onValue(ref(db, 'Places'), (snapshot) => {
      const placesData = snapshot.val() || {};
      this.stagesRaw = placesData; // Stocke les données brutes
      onValue(ref(db, 'Institutions'), (institSnap) => {
        const institutionsData = institSnap.val() || {};
        this.stagesOptions = Object.entries(placesData)
          .filter(([id, val]) => val && (val.NomPlace || val.Titre) && id)
          .map(([id, val]) => {
            let nomPlace = val.NomPlace || '';
            let titrePlace = val.Titre || '';
            let institutionName = '';
            let institutionId = val.InstitutionId || val.IDInstitution  || val.IDPlace || '';
            if (institutionId && institutionsData[institutionId]) {
              institutionName = institutionsData[institutionId].Name || '';
            }
            // Critères validés
            const criteriaKeys = ['MSQ','NEUROGER','REHAB','AMBU','FR','AIGU','DE','SYSINT'];
            let validCriteria = criteriaKeys.filter(k => val[k] === true || (typeof val[k] === 'string' && val[k].toLowerCase() === 'true'));
            let critLabel = validCriteria.length ? ' | Critères : ' + validCriteria.join(', ') : '';
            // Construction du label complet
            let labelParts = [];
            if (institutionName) labelParts.push(institutionName);
            if (titrePlace) labelParts.push(titrePlace);
            if (nomPlace && nomPlace !== titrePlace) labelParts.push(nomPlace);
            let titre = labelParts.join(' – ') + critLabel;
            return { id, titre };
          });
      });
    });
  },
  methods: {
    async affecterStage() {
      if (!this.selectedEtudiant || this.selectedStages.length === 0) return;
      try {
        const pfp2 = [];
        const PFP_valided = [];
        for (const stageId of this.selectedStages) {
          const place = this.stagesOptions.find(opt => opt.id === stageId);
          const fullPlace = this.stagesRaw && this.stagesRaw[stageId] ? this.stagesRaw[stageId] : null;
          if (!place) continue;
          pfp2.push({
            id: stageId,
            nom: place.titre || ''
          });
          if (fullPlace) {
            const obj = {};
            obj.Domaine = fullPlace.Domaine || fullPlace.Titre || '';
            obj.ID_PFP = stageId;
            obj.MSQ = !!fullPlace.MSQ;
            obj.NEUROGER = !!fullPlace.NEUROGER;
            obj.REHAB = !!fullPlace.REHAB;
            obj.AMBU = !!fullPlace.AMBU;
            obj.FR = !!fullPlace.FR;
            obj.AIGU = !!fullPlace.AIGU;
            obj.DE = !!fullPlace.DE;
            obj.SYSINT = !!fullPlace.SYSINT;
            PFP_valided.push(obj);
          }
        }
        // Met à jour PFP_2 à la racine
        await update(ref(db, `Students/${this.selectedEtudiant}`), {
          'PFP_valided/1': pfp2,
        });
        // Met à jour PFP_valided dans le sous-noeud '1'
        await update(ref(db, `Students/${this.selectedEtudiant}`), {
          'PFP_valided/1': PFP_valided[0]
        });
        this.message = "Stage(s) affecté(s) avec succès !";
      } catch (e) {
        this.message = "Erreur lors de l'affectation.";
      }
    },
  }
}
</script>

<style scoped>
.card {
  background: var(--surface-card);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
</style>