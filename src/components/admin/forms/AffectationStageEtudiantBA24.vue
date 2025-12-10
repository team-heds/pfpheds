<template>
  <Navbar />
  <div class=" px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg">
      <h1 class="text-4xl font-bold mb-4">Affecter un stage PFP2 à un étudiant (BA24)</h1>
    </section>
    <section class="mt-5">
      <div class="card p-4 max-w-4xl mx-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th>Nom et Prénom</th>
              <th>PFP2</th>
              <th>LESE</th>
              <th>SAE</th>
              <th>CAS</th>
              <th>Affecter</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="etudiant in etudiantsBA24" :key="etudiant.id">
              <td>{{ etudiant.nom }}</td>
              <td>
                <Dropdown
                  v-model="affectationsPFP2[etudiant.id]"
                  :options="stagesOptions"
                  optionLabel="titre"
                  optionValue="id"
                  placeholder="Sélectionnez PFP2"
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
                  :disabled="!affectationsPFP2[etudiant.id]"
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
import Dropdown from 'primevue/dropdown';
import { db } from '../../../../firebase.js'; // Ajusté pour le chemin
import { ref, onValue, update } from 'firebase/database';
import { supabase } from '@/supabase'; // Import du client Supabase

export default {
  name: 'AffectationStageEtudiantBA24',
  components: { Navbar, InputText, Button, Checkbox, Dropdown },
  data() {
    return {
      etudiantsBA24: [],
      affectationsPFP2: {}, // Pour PFP2
      conditionsPFP2: {}, // { [studentId]: { lese, sae, cas } }
      stagesOptions: [],
      stagesRaw: {},
      message: '',
    };
  },
  async mounted() {
    // Charger dynamiquement les étudiants BA24
    onValue(ref(db, 'Students'), (snapshot) => {
      const studentsData = snapshot.val() || {};
      onValue(ref(db, 'Users'), async (usersSnap) => {
        const usersData = usersSnap.val() || {};
        // Filtrer BA24 et construire nom complet
        const ba24 = await Promise.all(Object.entries(studentsData)
          .filter(([id, val]) => val && (val.Classe === 'BA24' || val.Class === 'BA24'))
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
        this.etudiantsBA24 = ba24;

        // --- Récupération des affectations et conditions déjà enregistrées ---
        const affectationsPFP2 = {};
        const conditionsPFP2 = {};
        Object.entries(studentsData).forEach(([id, val]) => {
          if (val && Array.isArray(val.PFP_valided)) {
            // PFP2 (index 1 dans le tableau PFP_valided)
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
        this.affectationsPFP2 = affectationsPFP2;
        this.conditionsPFP2 = conditionsPFP2;
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
      if (pfp === 'PFP2') {
        const prev = this.conditionsPFP2[id] || {};
        this.conditionsPFP2 = {
          ...this.conditionsPFP2,
          [id]: { ...prev, [field]: value }
        };
      }
    },
    async affecterStage(etudiantId) {
      // PFP2
      const stageId2 = this.affectationsPFP2[etudiantId];

      // Construction objet PFP2
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

      // 1. Mise à jour dans Firebase (Profil Étudiant)
      // On doit d'abord récupérer le tableau actuel pour ne pas écraser PFP1 s'il existe
      // Cependant, pour simplifier ici et vu que c'est BA24 (probablement pas de PFP1 encore ou géré séparément),
      // nous allons faire une mise à jour ciblée de l'index 1.
      
      try {
        const updates = {};
        updates[`Students/${etudiantId}/PFP_valided/1`] = affectationData2;
        
        await update(ref(db), updates);
        
        // 2. Mise à jour dans Supabase (Table StudentsPhysio)
        await this.syncToSupabase(etudiantId, affectationData2);

        this.message = `Affectations PFP2 mises à jour pour l'étudiant ${etudiantId}`;
      } catch (e) {
        console.error("Erreur lors de l'affectation:", e);
        this.message = "Erreur lors de l'affectation.";
      }
    },
    async syncToSupabase(firebaseUserId, pfpData) {
      if (!pfpData) return;

      try {
        // On cherche l'étudiant dans StudentsPhysio par firebase_id uniquement
        // car user_id est un UUID Supabase, pas un Firebase ID
        
        const { data: existingStudent, error: findError } = await supabase
          .from('StudentsPhysio')
          .select('id, pfp2_data')
          .eq('firebase_id', firebaseUserId)
          .maybeSingle();

        if (findError) {
            console.error("Erreur recherche étudiant Supabase:", findError);
            return;
        }

        if (existingStudent) {
            // Mise à jour
            const { error: updateError } = await supabase
                .from('StudentsPhysio')
                .update({
                    pfp2_place_id: pfpData.ID_Place,
                    pfp2_data: pfpData // On stocke tout l'objet JSON
                })
                .eq('id', existingStudent.id);

            if (updateError) {
                console.error("Erreur update Supabase:", updateError);
            } else {
                console.log("Synchro Supabase OK pour", firebaseUserId);
            }
        } else {
            console.warn("Étudiant non trouvé dans StudentsPhysio pour synchro PFP2:", firebaseUserId);
            // Optionnel : Créer l'étudiant s'il n'existe pas ? Pour l'instant on log juste.
        }

      } catch (err) {
        console.error("Exception lors de la synchro Supabase:", err);
      }
    }
  },
};
</script>

<style scoped>
th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}
</style>
