<template>
  <div class="container">
    <section class="pt-5">
      <div class="container">

        <!-- Menu de sélection PFP -->
        <div class="mb-3">
          <h1>Créer une PFP</h1>
          <label for="pfpSelection" class="form-label">Sélectionnez un PFP</label>
          <select class="form-select" id="pfpSelection" v-model="selectedPFP" @change="filterPlacedestage">
            <option value="">Tous les PFPs</option>
            <option value="PFP1A">PFP1A</option>
            <option value="PFP1B">PFP1B</option>
            <option value="PFP2">PFP2</option>
            <option value="PFP3">PFP3</option>
            <option value="PFP4">PFP4</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="classInput" class="form-label">Classe d'Étudiants SAE</label>
          <input type="text" id="classInput" v-model="classInput" class="form-control" @input="fetchStudents" />
          <label for="classInput" class="form-label">Date de début</label>

          <input type="date" v-model="dateDebut" class="form-control" placeholder="Date de début" />
          <label for="classInput" class="form-label">Date de fin</label>

          <input type="date" v-model="dateFin" class="form-control" placeholder="Date de fin" />
          <label for="classInput" class="form-label">Année Académique</label>

          <input type="text" v-model="anneeAcademique" class="form-control" placeholder="Année Académique" />

        </div>
        <div v-if="Object.keys(filteredPlacedestages).length">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>ID Institution</th>
                <th>Secteur</th>
                <th>Praticien Formateur</th>
                <th>Nom Institution</th>
                <th>AIGU </th>
                <th>REA </th>
                <th>MSQ </th>
                <th>SYSINT </th>
                <th>NEUROGER </th>
                <th>AMBU </th>
                <th>Cas particulier</th>
                <th>Étudiant SAE</th>

              </tr>
            </thead>
            <tbody>
              <template v-for="(places, id) in filteredPlacedestages">
                <tr v-for="place in places" :key="place.id">
                  <td>{{ place.idInstitution }}</td>
                  <td>{{ place.Sector }}</td>
                  <td>{{ place.NpmPractitionerTrainer }}</td>
                  <td>{{ getInstitutionName(place.idInstitution) }}</td>

                  <td><input type="checkbox" :checked="place.AIGU" @change="updateFirebase('AIGU', place)" /></td>
                  <td><input type="checkbox" :checked="place.REA" @change="updateFirebase('REA', place)" /></td>
                  <td><input type="checkbox" :checked="place.MSQ" @change="updateFirebase('MSQ', place)" /></td>
                  <td><input type="checkbox" :checked="place.SYSINT" @change="updateFirebase('SYSINT', place)" /></td>
                  <td><input type="checkbox" :checked="place.NEUROGER" @change="updateFirebase('NEUROGER', place)" /></td>
                  <td><input type="checkbox" :checked="place.AMBU" @change="updateFirebase('AMBU', place)" /></td>
                  <td><input type="checkbox" :checked="place.SAE" @change="updateFirebase('SAE', place)" /></td>
                  <td>
                    <select :disabled="!place.SAE" v-model="place.selectedStudent" @change="updateStudentName(place)">
                      <option v-for="student in studentsSAE" :value="student">{{ student.Nom }} {{ student.Prenom }}
                      </option>
                    </select>
                  </td>

                </tr>

              </template>
            </tbody>
          </table>
          <button @click="createPFP" class="btn btn-primary">Créer PFP</button>

        </div>
        <p v-else>Pas de places de stage disponibles</p>
      </div>
    </section>
  </div>
</template>



<script>
import { db } from '../../../../firebase.js';
import { ref, onValue, set, off, update, push } from "firebase/database";
import { watch } from 'vue'; // Importer le hook 'watch'
export default {
  name: 'PFPDetails',
  data() {
    return {
      placedestages: [],
      institutions: {},
      selectedPFP: '',
      filteredPlacedestages: {},
      classInput: '',
      studentsSAE: [],
      dateDebut: '',
      dateFin: '',
      anneeAcademique: '',
    };
  },
  watch: {
    selectedPFP(newPFP) {
      this.filterPlacedestage(newPFP);
      console.log(newPFP);
    }
  },
  methods:
  {

    async createPFP() {
      const newPFP = {
        // Suppose que vous avez toutes les données nécessaires dans le data de votre composant
        dateDebut: this.dateDebut,
        dateFin: this.dateFin,
        anneeAcademique: this.anneeAcademique,
        placedestages: this.filteredPlacedestages,
        classInput: this.classInput,
        // ... autres données à inclure
      };

      try {
        const stagesRef = ref(db, 'stages/');
        const newStageRef = push(stagesRef); // Crée une nouvelle entrée avec un ID unique.
        await set(newStageRef, newPFP); // Enregistre les données du nouveau PFP.
        alert('PFP créé avec succès!');
      } catch (error) {
        console.error('Erreur lors de la création du PFP:', error);
        alert('Erreur lors de la création du PFP. Veuillez réessayer.');
      }
    },


    fetchStudents() {
      if (!this.classInput) {
        this.studentsSAE = [];
        return;
      }

      // Assurez-vous que le chemin est correct
      const studentsRef = ref(db, 'etudiants/');

      onValue(studentsRef, (snapshot) => {
        if (snapshot.exists()) {
          const allStudents = snapshot.val();
          this.studentsSAE = Object.values(allStudents).filter(student =>
            student.Classe === this.classInput && student.SAE === true
          );
        } else {
          console.error(`Pas d'étudiants trouvés pour la classe ${this.classInput}`);
          this.studentsSAE = [];
        }
      });
    },
    updateStudentName(place) {
      if (!place.selectedStudent) return;

      const { Nom, Prenom, id } = place.selectedStudent; // id suppose que chaque étudiant a un id unique.
      const studentRef = ref(db, `placedestage/${place.idInstitution}/${place.id}`); // Mettez à jour avec le chemin réel à votre place dans Firebase


      try {
        update(studentRef, { Nom, Prenom });
      } catch (error) {
        console.error('Erreur de mise à jour de Firebase:', error);
      }
    },
    filterPlacedestage() {
      const filtered = {};
      for (const id in this.placedestages) {
        const places = this.placedestages[id];
        filtered[id] = Object.values(places).filter(place => place[this.selectedPFP] === true);
      }
      this.filteredPlacedestages = filtered;
    },




    async updateFirebase(field, place) {
      const placeRef = ref(db, `placedestage/${place.idInstitution}/${place.id}`); // Mettez à jour avec le chemin réel à votre place dans Firebase
      try {
        await update(placeRef, { [field]: !place[field] }); // Mettre à jour la valeur dans Firebase


      } catch (error) {
        console.error('Erreur de mise à jour de Firebase:', error);
      }
    },


    getInstitutionName(idInstitution) {
      return this.institutions[idInstitution]?.Name || 'Nom incondnu';
    },
  },
  mounted() {

    const placedestageRef = ref(db, 'placedestage/');
    onValue(placedestageRef, (snapshot) => {
      if (snapshot.exists()) {
        this.placedestages = snapshot.val();
        this.filterPlacedestage();
      } else {
        console.error('Pas de placedestages disponibles');
        this.placedestages = {};
        this.filteredPlacedestages = {};
      }
    });

  }

};
</script>

<style scoped>
/* Vos styles CSS ici si nécessaire */
</style>
