<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-5xl font-bold mb-4">Modifier l'étudiant</h1>
    </div>
    <form @submit.prevent="updateEtudiant" class="p-fluid grid">
      <div class="field mb-4 col-6">
        <label for="prenom" class="block text-xl mb-2">Prénom</label>
        <InputText id="prenom" v-model="etudiant.Prenom" required class="w-full" />
      </div>
      <div class="field mb-4 col-6">
        <label for="nom" class="block text-xl mb-2">Nom</label>
        <InputText id="nom" v-model="etudiant.Nom" required class="w-full" />
      </div>
      <div class="field mb-4 col-6">
        <label for="classe" class="block text-xl mb-2">Classe</label>
        <InputText id="classe" v-model="etudiant.Classe" class="w-full" />
      </div>
      <div class="field mb-4 col-6">
        <label for="email" class="block text-xl mb-2">Email</label>
        <InputText id="email" v-model="etudiant.Mail" required type="email" class="w-full" />
      </div>

      <!-- Case à cocher pour SAE (Cas Particulier) -->
      <div class="field mb-4 col-6">
        <label for="sae" class="block text-xl mb-2">SAE (Cas Particulier)</label>
        <input id="sae" type="checkbox" v-model="etudiant.Cas_Particulier" class="w-full" />
      </div>

      <!-- Dropdown pour PFP1 (institution de stage) -->
      <div class="field mb-4 col-6">
        <label for="pfp1" class="block text-xl mb-2">PFP1 - Institution</label>
        <Dropdown
          id="pfp1"
          v-model="selectedPFP1"
          :options="institutionOptions"
          optionLabel="institutionName"
          optionValue="institutionKey"
          class="w-full"
          placeholder="Sélectionner une institution pour PFP1"
          @change="updatePFP1Info"
        />
      </div>

      <div class="text-center mt-5 col-12">
        <Button type="submit" label="Mettre à jour" class="p-button-primary w-full lg:w-auto" />
      </div>
    </form>
  </div>
</template>

<script>
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';

export default {
  name: 'EtudiantFormModif',
  components: {
    InputText,
    Dropdown,
    Button
  },
  props: {
    etuId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      etudiant: {
        Prenom: '',
        Nom: '',
        Classe: '',
        Mail: '',
        Cas_Particulier: false, // Ajout de la case SAE (Cas particulier)
        PFP1_info: { institutionId: '', institutionName: '' }, // Stocke la clé de l'institution et son nom
      },
      selectedPFP1: '', // Contient la clé de l'institution sélectionnée
      institutionOptions: [],
    };
  },
  async mounted() {
    await this.fetchEtudiantDetails();
    await this.fetchInstitutionOptions();
  },
  methods: {
    async fetchEtudiantDetails() {
      try {
        const db = getDatabase();
        const studentsRef = dbRef(db, 'Students');
        const snapshot = await get(studentsRef);
        if (snapshot.exists()) {
          const studentsData = snapshot.val();
          for (const classKey in studentsData) {
            if (studentsData[classKey][this.etuId]) {
              const studentData = studentsData[classKey][this.etuId];
              this.etudiant = { ...studentData, Classe: classKey };

              // Pré-remplir la clé de l'institution pour PFP1
              this.selectedPFP1 = studentData.PFP1_info?.institutionId || '';

              console.log("Données de l'étudiant récupérées : ", this.etudiant);
              break;
            }
          }
        } else {
          console.error('Aucun étudiant trouvé');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de l\'étudiant', error);
      }
    },
    async fetchInstitutionOptions() {
      try {
        const db = getDatabase();
        const placesRef = dbRef(db, 'places');
        const institutionsRef = dbRef(db, 'institutions');

        const [placesSnapshot, institutionsSnapshot] = await Promise.all([
          get(placesRef),
          get(institutionsRef)
        ]);

        if (placesSnapshot.exists() && institutionsSnapshot.exists()) {
          const places = placesSnapshot.val();
          const institutions = institutionsSnapshot.val();

          // Mapper les clés des institutions avec leurs ID de places
          this.institutionOptions = Object.keys(places).map(placeKey => {
            const institutionKey = places[placeKey].IDPlace;
            const institutionName = institutions[institutionKey]?.Name || institutionKey;
            return {
              institutionKey, // Clé de l'institution
              institutionName, // Nom de l'institution
            };
          });

          console.log("Options d'institutions récupérées : ", this.institutionOptions);
        } else {
          console.error('Aucune place de stage ou institution trouvée');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des options d\'institutions', error);
      }
    },
    updatePFP1Info() {
      // Met à jour la clé et le nom de l'institution dans etudiant.PFP1_info
      const selectedInstitution = this.institutionOptions.find(option => option.institutionKey === this.selectedPFP1);
      if (selectedInstitution) {
        this.etudiant.PFP1_info = {
          institutionId: selectedInstitution.institutionKey,
          institutionName: selectedInstitution.institutionName
        };
      }
    },
    async updateEtudiant() {
      if (confirm('Êtes-vous sûr de vouloir mettre à jour cet étudiant ?')) {
        try {
          const db = getDatabase();
          const etudiantRef = dbRef(db, `Students/${this.etudiant.Classe}/${this.etuId}`);

          // Mettre à jour les informations de l'étudiant
          await set(etudiantRef, this.etudiant);

          alert('Données mises à jour avec succès');
          this.$router.push({ name: 'EtudiantList' });
        } catch (error) {
          console.error('Erreur lors de la mise à jour de l\'étudiant', error);
        }
      }
    }
  }
};
</script>

<style scoped>
/* Ajoutez vos styles personnalisés ici */
</style>
