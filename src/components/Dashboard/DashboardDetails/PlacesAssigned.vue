<template>
  <div>
    <Navbar />
    <h1>Places de Stages</h1>

    <!-- Section : Affichage des places disponibles avec assignation -->
    <div>
      <h2>Liste des Places Disponibles</h2>
      <DataTable :value="mergedSeats" responsiveLayout="scroll">
        <!-- Numérotation des sièges -->
        <Column header="#">
          <template #body="slotProps">
            {{ slotProps.data.rowNumber }}
          </template>
        </Column>
        <!-- ID de l'institution -->
        <Column header="Institution ID">
          <template #body="slotProps">
            <span>{{ slotProps.data.IdInstitution }}</span>
          </template>
        </Column>
        <!-- Nom de la place -->
        <Column header="Nom de la Place" field="NomPlace" />
        <!-- Numéro de siège utilisé -->
        <Column header="Siège">
          <template #body="slotProps">
            {{ slotProps.data.usedSeat }}
          </template>
        </Column>
        <!-- Affectation d'un étudiant -->
        <Column header="Assignation Étudiant">
          <template #body="slotProps">
            <!-- Si le siège a été assigné via ResultVotationAlgo, on affiche directement le lien -->
            <div v-if="slotProps.data.assignedStudent && slotProps.data.autoAssigned">
              <div v-html="slotProps.data.studentLink"></div>
            </div>
            <!-- Si une assignation manuelle existe, on affiche le lien classique -->
            <div v-else-if="slotProps.data.assignedStudent">
              <a :href="`/student/${slotProps.data.assignedStudent}`" target="_blank">
                {{ slotProps.data.assignedStudent }}
              </a>
            </div>
            <!-- Sinon, on affiche le champ de saisie pour affecter un étudiant -->
            <div v-else>
              <InputText
                v-model="newAssignments[`${slotProps.data.IdPlace}-${slotProps.data.seatIndex}`]"
                placeholder="ID Étudiant"
              />
              <Button label="Assigner" @click="assignStudent(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { ref, onValue, update } from "firebase/database";
import { db } from '@/firebase';

export default {
  name: 'PlacesAssigneds',
  components: {
    Navbar,
    DataTable,
    Column,
    Button,
    InputText
  },
  data() {
    return {
      expandedSeats: [],    // Données issues de "Places"
      newAssignments: {},   // Pour l'assignation manuelle
      resultAlgo: []        // Données issues de "ResultVotationAlgo"
    };
  },
  computed: {
    // Fusionne les sièges issus de "Places" avec les affectations enregistrées dans "ResultVotationAlgo"
    mergedSeats() {
      // Création d'un index de correspondance basé sur la clé composite : InstitutionID-NomPlace-seat
      let lookup = {};
      this.resultAlgo.forEach(item => {
        let key = `${item.InstitutionID}-${item.NomPlace}-${item.seat}`;
        lookup[key] = item;
      });
      // Pour chaque siège, on vérifie si une affectation existe dans resultAlgo et on définit usedSeat en conséquence
      return this.expandedSeats.map(seat => {
        let key = `${seat.IdInstitution}-${seat.NomPlace}-${seat.seatIndex}`;
        if (lookup[key]) {
          let assignment = lookup[key];
          return {
            ...seat,
            assignedStudent: assignment.studentId,
            studentLink: assignment.studentLink,
            studentName: assignment.studentName,
            voteRank: assignment.voteRank,
            autoAssigned: true,  // Indique que l'affectation provient de ResultVotationAlgo
            usedSeat: assignment.seat
          };
        } else {
          return {
            ...seat,
            usedSeat: seat.seatIndex
          };
        }
      });
    }
  },
  methods: {
    // Récupère et numérote les places disponibles depuis "Places"
    updateExpandedSeats() {
      const seats = [];
      const placesRef = ref(db, 'Places');
      onValue(placesRef, snapshot => {
        const placesData = snapshot.val() || {};
        Object.keys(placesData).forEach(key => {
          const place = placesData[key];
          place.IdPlace = key;
          place.IdInstitution = place.InstitutionId || place.IDPlace || "N/A";
          const count = parseInt(place.PFP4 || '0');
          for (let i = 1; i <= count; i++) {
            const studentKey = `selectedEtudiantBA22PFP4-${i}`;
            const dynamicKey = `selectedActiveBA22PFP4-${i}`;
            const assignedStudent = (place[studentKey] && place[studentKey].trim() !== "")
              ? place[studentKey].trim()
              : "";
            if (place[dynamicKey] === true) {
              seats.push({
                ...place,
                seatIndex: i,
                dynamicKey: dynamicKey,
                assignedStudent: assignedStudent,
                rowNumber: seats.length + 1
              });
            }
          }
        });
        this.expandedSeats = seats;
      });
    },
    // Affectation manuelle d'un étudiant
    assignStudent(seat) {
      const assignmentKey = `${seat.IdPlace}-${seat.seatIndex}`;
      const studentId = this.newAssignments[assignmentKey];
      if (!studentId || studentId.trim() === "") {
        alert("Veuillez saisir un ID étudiant.");
        return;
      }
      const placeRef = ref(db, `Places/${seat.IdPlace}`);
      const studentField = `selectedEtudiantBA22PFP4-${seat.seatIndex}`;
      update(placeRef, { [studentField]: studentId })
        .then(() => {
          alert("Étudiant assigné avec succès!");
          this.$set(this.newAssignments, assignmentKey, "");
          this.updateExpandedSeats();
        })
        .catch(err => {
          console.error("Erreur d'assignation:", err);
          alert("Erreur lors de l'assignation.");
        });
    },
    // Récupère les affectations depuis "ResultVotationAlgo"
    fetchResultAlgo() {
      const resultRef = ref(db, 'ResultVotationAlgo');
      onValue(resultRef, snapshot => {
        const data = snapshot.val() || [];
        this.resultAlgo = data;
      });
    }
  },
  mounted() {
    this.updateExpandedSeats();
    this.fetchResultAlgo();
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin: 20px 0;
}
h2 {
  margin-top: 20px;
}
</style>
