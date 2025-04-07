<template>
  <div>
    <Navbar />
    <h1>Assignment des Places Disponibles</h1>

    <!-- Section : Affichage des places disponibles avec assignation manuelle -->
    <div>
      <h2>Liste des Places Disponibles</h2>
      <DataTable :value="expandedSeats" responsiveLayout="scroll">
        <!-- Colonne de numérotation (affiche 1, 2, 3, ...) -->
        <Column header="#">
          <template #body="slotProps">
            {{ slotProps.data.rowNumber }}
          </template>
        </Column>
        <!-- Colonne affichant l'ID de l'institution -->
        <Column header="Institution ID">
          <template #body="slotProps">
            <span>{{ slotProps.data.IdInstitution }}</span>
          </template>
        </Column>
        <!-- Colonne affichant le nom de la place -->
        <Column header="Nom de la Place" field="NomPlace" />
        <!-- Colonne pour l'assignation de l'étudiant -->
        <Column header="Assignation Étudiant">
          <template #body="slotProps">
            <div v-if="slotProps.data.assignedStudent">
              <!-- L'ID de l'étudiant s'affiche en lien -->
              <a :href="`/student/${slotProps.data.assignedStudent}`" target="_blank">
                {{ slotProps.data.assignedStudent }}
              </a>
            </div>
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

    <!-- Section : Affichage de la liste des votants et de leurs votes -->
    <div style="margin-top: 20px;">
      <h2>Liste des Étudiants ayant voté</h2>
      <ul>
        <li v-for="voter in voters" :key="voter.id">
          ID: {{ voter.id }} - Nom: {{ voter.name }}
          <div v-if="voter.votes && voter.votes.length">
            <strong>Choix:</strong>
            <ol>
              <li v-for="(vote, index) in voter.votes" :key="index">
                Top {{ index + 1 }} : {{ vote.InstitutionName }} - {{ vote.placeName }} (ID: {{ vote.placeId }})
              </li>
            </ol>
          </div>
        </li>
      </ul>
      <h3>Total de votants : {{ voterCount }}</h3>
    </div>

    <!-- Bouton pour l'assignation automatique -->
    <div style="margin-top: 20px; text-align: center;">
      <Button label="Assignation Automatique" @click="assignStudentsAutomatically" />
    </div>

    <!-- Section : Affichage des résultats enregistrés depuis la DB Firebase -->
    <div style="margin-top: 20px;">
      <h2>Résultats de l'assignation enregistrés</h2>
      <pre>{{ resultAlgo }}</pre>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { ref, onValue, update, set } from "firebase/database";
import { db } from 'root/firebase';

export default {
  name: 'PlacesAssignmentVoters',
  components: {
    Navbar,
    DataTable,
    Column,
    Button,
    InputText
  },
  data() {
    return {
      places: [],
      expandedSeats: [],
      newAssignments: {},
      voters: [],
      voterCount: 0,
      resultAlgo: [] // Contiendra les affectations lues depuis "ResultVotationAlgo"
    };
  },
  methods: {
    // Mise à jour des sièges disponibles avec numérotation (rowNumber)
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
    // Affectation manuelle d'un étudiant à un siège
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
    // Récupération des votants et de leurs votes depuis Firebase
    fetchVotersData() {
      const votesRef = ref(db, 'VotationBA22PFP4');
      onValue(votesRef, snapshot => {
        const votesData = snapshot.val() || {};
        const voterIds = Object.keys(votesData);
        this.voterCount = voterIds.length;
        const promises = voterIds.map(voterId => {
          return new Promise(resolve => {
            const userRef = ref(db, `Users/${voterId}`);
            onValue(userRef, (snapshot) => {
              const userData = snapshot.val() || {};
              const voteData = votesData[voterId] || {};
              const votesArray = voteData.votes || [];
              resolve({
                id: voterId,
                name: userData.Name || "Non spécifié",
                votes: votesArray
              });
            }, { onlyOnce: true });
          });
        });
        Promise.all(promises).then(result => {
          this.voters = result;
        });
      });
    },
    // Lit les résultats enregistrés dans "ResultVotationAlgo" et met à jour resultAlgo
    fetchResultAlgo() {
      const resultRef = ref(db, 'ResultVotationAlgo');
      onValue(resultRef, snapshot => {
        const data = snapshot.val() || [];
        this.resultAlgo = data;
      });
    },
    // Méthode d'assignation automatique
    assignStudentsAutomatically() {
      // Récupérer les 40 premiers sièges
      let availableSeats = this.expandedSeats.slice(0, 40);
      let seatList = availableSeats.slice();

      // Séparer les sièges déjà placés et les sièges non assignés
      let alreadyPlacedAssignments = [];
      let unassignedSeatIndices = [];
      seatList.forEach((seat, index) => {
        if (seat.assignedStudent && seat.assignedStudent.trim() !== "") {
          // Recherche du nom parmi les votants si possible
          let voter = this.voters.find(v => v.id === seat.assignedStudent);
          let studentName = voter ? voter.name : "";
          alreadyPlacedAssignments.push({
            studentId: seat.assignedStudent,
            studentName: studentName,
            studentLink: `<a href="/student/${seat.assignedStudent}" target="_blank">${seat.assignedStudent}</a>`,
            seat: seat.seatIndex,
            InstitutionID: seat.IdInstitution,
            NomPlace: seat.NomPlace,
            voteRank: "Déjà placé"
          });
        } else {
          unassignedSeatIndices.push(index);
        }
      });

      // Exclure les étudiants déjà placés de la liste des votants
      let remainingStudents = this.voters.filter(v => {
        return !alreadyPlacedAssignments.some(a => a.studentId === v.id);
      });

      // Construire le tableau des sièges non assignés
      let unassignedSeats = unassignedSeatIndices.map(i => seatList[i]);
      let numSeats = unassignedSeats.length;
      let numStudents = remainingStudents.length;

      // Construction du graphe pour le matching : pour chaque étudiant,
      // liste des indices dans unassignedSeats correspondant à un vote
      let graph = [];
      for (let i = 0; i < numStudents; i++) {
        let edges = [];
        const votes = remainingStudents[i].votes || [];
        for (let j = 0; j < numSeats; j++) {
          for (let k = 0; k < votes.length; k++) {
            if (votes[k].placeId === unassignedSeats[j].IdPlace) {
              edges.push(j);
              break;
            }
          }
        }
        graph.push(edges);
      }

      const matchSeat = new Array(numSeats).fill(-1);
      const studentMatch = new Array(numStudents).fill(-1);
      const dfs = (i, seen) => {
        for (const j of graph[i]) {
          if (!seen[j]) {
            seen[j] = true;
            if (matchSeat[j] === -1 || dfs(matchSeat[j], seen)) {
              matchSeat[j] = i;
              studentMatch[i] = j;
              return true;
            }
          }
        }
        return false;
      };

      for (let i = 0; i < numStudents; i++) {
        const seen = new Array(numSeats).fill(false);
        dfs(i, seen);
      }

      let matchingAssignments = [];
      let usedSeatIndices = new Set();
      for (let i = 0; i < numStudents; i++) {
        if (studentMatch[i] !== -1) {
          const seatIndex = studentMatch[i];
          usedSeatIndices.add(seatIndex);
          const seatObj = unassignedSeats[seatIndex];
          let voteRank = null;
          const votes = remainingStudents[i].votes || [];
          for (let k = 0; k < votes.length; k++) {
            if (votes[k].placeId === seatObj.IdPlace) {
              voteRank = k + 1;
              break;
            }
          }
          matchingAssignments.push({
            studentId: remainingStudents[i].id,
            studentName: remainingStudents[i].name,
            studentLink: `<a href="/student/${remainingStudents[i].id}" target="_blank">${remainingStudents[i].id}</a>`,
            seat: seatObj.seatIndex,
            InstitutionID: seatObj.IdInstitution,
            NomPlace: seatObj.NomPlace,
            voteRank: voteRank
          });
        }
      }

      // Affectation des étudiants non appariés aux sièges restants
      let remainingSeatIndices = [];
      for (let j = 0; j < numSeats; j++) {
        if (!usedSeatIndices.has(j)) {
          remainingSeatIndices.push(j);
        }
      }
      let nonMatchedStudents = [];
      for (let i = 0; i < numStudents; i++) {
        if (studentMatch[i] === -1) {
          nonMatchedStudents.push(remainingStudents[i]);
        }
      }
      let leftoverAssignments = [];
      for (let i = 0; i < nonMatchedStudents.length && remainingSeatIndices.length > 0; i++) {
        const j = remainingSeatIndices.shift();
        const seatObj = unassignedSeats[j];
        leftoverAssignments.push({
          studentId: nonMatchedStudents[i].id,
          studentName: nonMatchedStudents[i].name,
          studentLink: `<a href="/student/${nonMatchedStudents[i].id}" target="_blank">${nonMatchedStudents[i].id}</a>`,
          seat: seatObj.seatIndex,
          InstitutionID: seatObj.IdInstitution,
          NomPlace: seatObj.NomPlace,
          voteRank: null
        });
      }

      // Combiner toutes les affectations
      let assignments = [
        ...alreadyPlacedAssignments,
        ...matchingAssignments,
        ...leftoverAssignments
      ];

      // Enregistrement dans Firebase sous "ResultVotationAlgo"
      set(ref(db, 'ResultVotationAlgo'), assignments)
        .then(() => {
          alert("Les affectations (y compris les étudiants déjà placés) ont été enregistrées dans Firebase !");
          this.fetchResultAlgo();
        })
        .catch(err => {
          console.error("Erreur lors de l'enregistrement dans Firebase:", err);
          alert("Erreur lors de l'enregistrement des affectations.");
        });
    }
  },
  mounted() {
    this.updateExpandedSeats();
    this.fetchVotersData();
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
ul {
  list-style-type: none;
  padding: 0;
}
li {
  padding: 4px 0;
}
pre {
  background: #f5f5f5;
  padding: 10px;
  overflow-x: auto;
}
</style>
