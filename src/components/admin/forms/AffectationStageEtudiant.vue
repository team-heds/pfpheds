<template>
  <Navbar />
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg">
      <h1 class="text-4xl font-bold mb-4">Affecter un stage à un étudiant (SBA23)</h1>
    </section>
    <section class="mt-5">
      <div class="card p-4 max-w-4xl mx-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th>Nom et Prénom</th>
              <th>PFP1</th>
              <th>LESE</th>
              <th>SAE</th>
              <th>CAS</th>
              <th>PFP2</th>
              <th>LESE</th>
              <th>SAE</th>
              <th>CAS</th>
              <th>Affecter</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="etudiant in etudiantsSBA23" :key="etudiant.id">
              <td>{{ etudiant.nom }}</td>
              <td>
                <Dropdown
  v-model="affectations[etudiant.id]"
  :options="stagesOptions"
  optionLabel="titre"
  optionValue="id"
  placeholder="Sélectionnez PFP1"
  class="w-full"
  filter
  filterPlaceholder="Rechercher un stage..."
/>
              </td>
              <td>
                <div style="display: flex; flex-direction: column; align-items: center;">
  <Checkbox :binary="true" :inputId="'lese-' + etudiant.id" :modelValue="!!((conditionsPFP1[etudiant.id] || {}).lese)" @change="updateCondition('PFP1', etudiant.id, 'lese', $event.target.checked)" />
  <span style="font-size: 0.8em; margin-top: 2px;"></span>
</div>
              </td>
              <td>
                <div style="display: flex; flex-direction: column; align-items: center;">
  <Checkbox :binary="true" :inputId="'sae-' + etudiant.id" :modelValue="!!((conditionsPFP1[etudiant.id] || {}).sae)" @change="updateCondition('PFP1', etudiant.id, 'sae', $event.target.checked)" />
  <span style="font-size: 0.8em; margin-top: 2px;"></span>
</div>
              </td>
              <td>
                <div style="display: flex; flex-direction: column; align-items: center;">
  <Checkbox :binary="true" :inputId="'cas-' + etudiant.id" :modelValue="!!((conditionsPFP1[etudiant.id] || {}).cas)" @change="updateCondition('PFP1', etudiant.id, 'cas', $event.target.checked)" />
  <span style="font-size: 0.8em; margin-top: 2px;"></span>
</div>
              </td>
              <td>
                <Dropdown
                  v-model="affectationsPFP2[etudiant.id]"
                  :options="stagesOptions"
                  optionLabel="titre"
                  optionValue="id"
                  placeholder="Sélectionnez  PFP2"
                  class="w-full"
                  filter
                  filterPlaceholder="Rechercher un stage..."
                />
              </td>
              <td>
                <div style="display: flex; justify-content: center; align-items: center; min-width:32px;">
  <Checkbox :binary="true" :inputId="'lese2-' + etudiant.id" :modelValue="!!((conditionsPFP2[etudiant.id] || {}).lese)" @change="updateCondition('PFP2', etudiant.id, 'lese', $event.target.checked)" style="transform: scale(0.9);" />
</div>
              </td>
              <td>
                <div style="display: flex; justify-content: center; align-items: center; min-width:32px;">
  <Checkbox :binary="true" :inputId="'sae2-' + etudiant.id" :modelValue="!!((conditionsPFP2[etudiant.id] || {}).sae)" @change="updateCondition('PFP2', etudiant.id, 'sae', $event.target.checked)" style="transform: scale(0.9);" />
</div>
              </td>
              <td>
                <div style="display: flex; justify-content: center; align-items: center; min-width:32px;">
  <Checkbox :binary="true" :inputId="'cas2-' + etudiant.id" :modelValue="!!((conditionsPFP2[etudiant.id] || {}).cas)" @change="updateCondition('PFP2', etudiant.id, 'cas', $event.target.checked)" style="transform: scale(0.9);" />
</div>
              </td>
              <td>
                <Button
                  label="Affecter"
                  class="p-button-success"
                  :disabled="!affectations[etudiant.id]"
                  @click="affecterStage(etudiant.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="message" class="mt-4 text-green-600">{{ message }}</div>
      </div>
    </section>
  </div>
</template>


<script>
import Navbar from '@/components/common/utils/Navbar.vue';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import { db, getUserNameById } from 'root/firebase.js';
import { ref, onValue, update } from 'firebase/database';

export default {
  name: 'AffectationStageEtudiant',
  components: { Navbar, InputText, Button, Checkbox },
  data() {
    return {
      etudiantsSBA23: [], // Will be filled from Firebase
      affectations: {},   // Pour PFP1
      affectationsPFP2: {}, // Pour PFP2
      conditionsPFP1: {}, // { [studentId]: { lese, sae, cas } }
      conditionsPFP2: {}, // { [studentId]: { lese, sae, cas } }
      stagesOptions: [], // Pour dropdown ou multiselect
      stagesRaw: {},     // Pour accès brut si besoin
      message: '',
    };
  },
  async mounted() {
    // Charger dynamiquement les étudiants BA23
    onValue(ref(db, 'Students'), (snapshot) => {
      const studentsData = snapshot.val() || {};
      onValue(ref(db, 'Users'), async (usersSnap) => {
        const usersData = usersSnap.val() || {};
        // Filtrer BA23 et construire nom complet
        const ba23 = await Promise.all(Object.entries(studentsData)
          .filter(([id, val]) => val && (val.Classe === 'BA23' || val.Class === 'BA23'))
          .map(async ([id]) => {
            let nom = '';
            const user = usersData[id];
            if (user && user.Nom && user.Prenom) nom = user.Nom + ' ' + user.Prenom;
            else if (user && user.Nom) nom = user.Nom;
            else if (user && user.Prenom) nom = user.Prenom;
            else nom = id;
            return { id, nom };
          })
        );
        this.etudiantsSBA23 = ba23;

        // --- Récupération des affectations et conditions déjà enregistrées ---
        const affectations = {};
        const affectationsPFP2 = {};
        const conditionsPFP1 = {};
        const conditionsPFP2 = {};
        Object.entries(studentsData).forEach(([id, val]) => {
          if (val && Array.isArray(val.PFP_valided)) {
            // PFP1
            if (val.PFP_valided[0]) {
              const pfp1 = val.PFP_valided[0];
              if (pfp1.ID_Place) affectations[id] = pfp1.ID_Place;
              conditionsPFP1[id] = {
                lese: !!pfp1.LESE,
                sae: !!pfp1.SAE,
                cas: !!pfp1.CAS
              };
            }
            // PFP2
            if (val.PFP_valided[1]) {
              const pfp2 = val.PFP_valided[1];
              if (pfp2.ID_Place) affectationsPFP2[id] = pfp2.ID_Place;
              conditionsPFP2[id] = {
                lese: !!pfp2.LESE,
                sae: !!pfp2.SAE,
                cas: !!pfp2.CAS
              };
            }
          }
        });
        this.affectations = affectations;
        this.affectationsPFP2 = affectationsPFP2;
        this.conditionsPFP1 = conditionsPFP1;
        this.conditionsPFP2 = conditionsPFP2;
        // --- FIN récupération ---
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
            let titre = labelParts.join(' – ') ;
            return { id, titre };
          });
      });
    });
  },
  methods: {
    updateCondition(pfp, id, field, value) {
      if (pfp === 'PFP1') {
        const prev = this.conditionsPFP1[id] || {};
        this.conditionsPFP1 = {
          ...this.conditionsPFP1,
          [id]: { ...prev, [field]: value }
        };
      } else if (pfp === 'PFP2') {
        const prev = this.conditionsPFP2[id] || {};
        this.conditionsPFP2 = {
          ...this.conditionsPFP2,
          [id]: { ...prev, [field]: value }
        };
      }
    },
    async affecterStage(etudiantId) {
      // PFP1
      const stageId1 = this.affectations[etudiantId];
      // PFP2
      const stageId2 = this.affectationsPFP2[etudiantId];

      // Construction objet PFP1
      let affectationData1 = null;
      if (stageId1 && this.stagesRaw[stageId1]) {
        const stageData1 = this.stagesRaw[stageId1];
        const conds1 = this.conditionsPFP1[etudiantId] || {};
        affectationData1 = {
          AIGU: stageData1.AIGU === true || stageData1.AIGU === 'true',
          AMBU: stageData1.AMBU === true || stageData1.AMBU === 'true',
          DE: stageData1.DE === true || stageData1.DE === 'true',
          Domaine: stageData1.Domaine || stageData1.NomPlace || '',
          FR: stageData1.FR === true || stageData1.FR === 'true',
          ID_PFP: stageData1.IDPlace || stageData1.InstitutionId || '',
          ID_Place: stageId1,
          MSQ: stageData1.MSQ === true || stageData1.MSQ === 'true',
          NEUROGER: stageData1.NEUROGER === true || stageData1.NEUROGER === 'true',
          REHAB: stageData1.REHAB === true || stageData1.REHAB === 'true',
          SYSINT: stageData1.SYSINT === true || stageData1.SYSINT === 'true',
          LESE: !!conds1.lese,
          SAE: !!conds1.sae,
          CAS: !!conds1.cas
        };
      }
      // Construction objet PFP2 (identique à PFP1)
      let affectationData2 = null;
      if (stageId2 && this.stagesRaw[stageId2]) {
        const stageData2 = this.stagesRaw[stageId2];
        const conds2 = this.conditionsPFP2[etudiantId] || {};
        affectationData2 = {
          AIGU: stageData2.AIGU === true || stageData2.AIGU === 'true',
          AMBU: stageData2.AMBU === true || stageData2.AMBU === 'true',
          DE: stageData2.DE === true || stageData2.DE === 'true',
          Domaine: stageData2.Domaine || stageData2.NomPlace || '',
          FR: stageData2.FR === true || stageData2.FR === 'true',
          ID_PFP: stageData2.IDPlace || stageData2.InstitutionId || '',
          ID_Place: stageId2,
          MSQ: stageData2.MSQ === true || stageData2.MSQ === 'true',
          NEUROGER: stageData2.NEUROGER === true || stageData2.NEUROGER === 'true',
          REHAB: stageData2.REHAB === true || stageData2.REHAB === 'true',
          SYSINT: stageData2.SYSINT === true || stageData2.SYSINT === 'true',
          LESE: !!conds2.lese,
          SAE: !!conds2.sae,
          CAS: !!conds2.cas
        };
      }
      // Construire le tableau pour PFP_valided
      const pfpValidedArray = [];
      if (affectationData1) pfpValidedArray[0] = affectationData1;
      if (affectationData2) pfpValidedArray[1] = affectationData2;
      try {
        await update(ref(db, `Students/${etudiantId}`), {
          'PFP_valided': pfpValidedArray
        });
        this.message = `Affectations mises à jour pour l'étudiant ${etudiantId}`;
      } catch (e) {
        this.message = "Erreur lors de l'affectation.";
      }
    },
  },
};
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
th, td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}
th {
  background: #f3f4f6;
  color:black;

}

.card {
  background: var(--surface-card);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
</style>
