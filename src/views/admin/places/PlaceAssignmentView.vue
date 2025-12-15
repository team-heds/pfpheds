<template>
  <div>
    <Navbar />
    <h1>Assignment des Places Disponibles</h1>

    <!-- Section : Votes PFP1A -->
    <div class="container scroll-table-container" style="margin-bottom: 40px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Votes des Étudiants PFP1A - Année 2026 ({{ pfp1aVotesCount }})</h2>
        <div style="display: flex; gap: 10px;">
          <Button icon="pi pi-refresh" label="Actualiser" @click="loadPFP1AVotes" size="small" />
          <Button icon="pi pi-download" label="Export CSV" severity="success" @click="exportPFP1AToCSV" size="small" />
        </div>
      </div>
      
      <DataTable 
        :value="pfp1aVotes" 
        :loading="loadingPFP1A"
        responsiveLayout="scroll"
        :paginator="true"
        :rows="25"
        :rowsPerPageOptions="[25, 50, 100]"
        sortField="nom"
        :sortOrder="1"
      >
        <Column header="#" style="width: 50px;">
          <template #body="slotProps">
            {{ slotProps.index + 1 }}
          </template>
        </Column>
        
        <Column field="nom" header="Nom" sortable style="min-width: 120px;" />
        <Column field="prenom" header="Prénom" sortable style="min-width: 120px;" />
        <Column field="classe" header="Classe" sortable style="width: 100px;" />
        
        <Column header="Choix 1" style="min-width: 250px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.choix1" style="padding: 8px; background: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
              <div style="font-weight: 600; color: #1976d2;">{{ slotProps.data.choix1 }}</div>
              <div v-if="slotProps.data.choix1Institution" style="font-size: 0.85em; color: #666; margin-top: 4px;">
                {{ slotProps.data.choix1Institution }}
              </div>
            </div>
            <span v-else style="color: #999;">-</span>
          </template>
        </Column>
        
        <Column header="Choix 2" style="min-width: 250px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.choix2" style="padding: 8px; background: #e0f2f1; border-left: 4px solid #00bcd4; border-radius: 4px;">
              <div style="font-weight: 600; color: #00838f;">{{ slotProps.data.choix2 }}</div>
              <div v-if="slotProps.data.choix2Institution" style="font-size: 0.85em; color: #666; margin-top: 4px;">
                {{ slotProps.data.choix2Institution }}
              </div>
            </div>
            <span v-else style="color: #999;">-</span>
          </template>
        </Column>
        
        <Column header="Choix 3" style="min-width: 250px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.choix3" style="padding: 8px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
              <div style="font-weight: 600; color: #e65100;">{{ slotProps.data.choix3 }}</div>
              <div v-if="slotProps.data.choix3Institution" style="font-size: 0.85em; color: #666; margin-top: 4px;">
                {{ slotProps.data.choix3Institution }}
              </div>
            </div>
            <span v-else style="color: #999;">-</span>
          </template>
        </Column>
        
        <Column header="Choix 4" style="min-width: 250px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.choix4" style="padding: 8px; background: #f5f5f5; border-left: 4px solid #9e9e9e; border-radius: 4px;">
              <div style="font-weight: 600; color: #424242;">{{ slotProps.data.choix4 }}</div>
              <div v-if="slotProps.data.choix4Institution" style="font-size: 0.85em; color: #666; margin-top: 4px;">
                {{ slotProps.data.choix4Institution }}
              </div>
            </div>
            <span v-else style="color: #999;">-</span>
          </template>
        </Column>
        
        <Column header="Choix 5" style="min-width: 250px;">
          <template #body="slotProps">
            <div v-if="slotProps.data.choix5" style="padding: 8px; background: #f5f5f5; border-left: 4px solid #757575; border-radius: 4px;">
              <div style="font-weight: 600; color: #424242;">{{ slotProps.data.choix5 }}</div>
              <div v-if="slotProps.data.choix5Institution" style="font-size: 0.85em; color: #666; margin-top: 4px;">
                {{ slotProps.data.choix5Institution }}
              </div>
            </div>
            <span v-else style="color: #999;">-</span>
          </template>
        </Column>
        
        <Column header="Statut" style="width: 120px;">
          <template #body="slotProps">
            <span v-if="slotProps.data.nbChoix === 5" style="color: green; font-weight: bold;">✓ Complet</span>
            <span v-else-if="slotProps.data.nbChoix > 0" style="color: orange; font-weight: bold;">⚠ {{ slotProps.data.nbChoix }}/5</span>
            <span v-else style="color: red; font-weight: bold;">✗ Aucun</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Section : Affichage des places disponibles avec assignation manuelle -->
    <div class="container scroll-table-container">
      <h2>Liste des Places Disponibles</h2>
      <DataTable :value="expandedSeats" responsiveLayout="scroll">
        <!-- Numérotation -->
        <Column header="#">
          <template #body="slotProps">
            {{ slotProps.data.rowNumber }}
          </template>
        </Column>
        <!-- Institution ID -->
        <Column header="Institution ID">
          <template #body="slotProps">
            <span>{{ slotProps.data.IdInstitution }}</span>
          </template>
        </Column>
        <!-- Nom Institution -->
        <Column header="Nom Institution">
          <template #body="slotProps">
            <span>{{ slotProps.data.InstitutionName }}</span>
          </template>
        </Column>
        <!-- Nom de la Place -->
        <Column header="Nom de la Place" field="NomPlace" />
        <!-- Affectation Étudiant -->
        <Column header="Assignation Étudiant">
          <template #body="slotProps">
            <div v-if="slotProps.data.assignedStudent">
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

      <!-- Section : Liste des Étudiants ayant voté -->
      <div style="margin-top: 20px;">
        <h2>Liste des Étudiants ayant voté</h2>
        <ul>
          <li v-for="voter in voters" :key="voter.id">
            <strong>ID:</strong> {{ voter.id }} – <strong>Nom:</strong> {{ voter.Nom || voter.name }} – <strong>Prénom:</strong> {{ voter.Prenom }}
            <div v-if="voter.votes && voter.votes.length">
              <em>Choix:</em>
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

      <!-- Section : Résumé des Places -->
      <div style="margin-top: 20px;">
        <h2>Résumé des Places</h2>
        <ul>
          <li v-for="place in placesSummary" :key="place.IdPlace">
            <strong>ID Place:</strong>
            <a :href="`/place/${place.IdPlace}`" target="_blank">{{ place.IdPlace }}</a>
            - <strong>Nom:</strong> {{ place.NomPlace }} - <strong>Total:</strong> {{ place.count }}
          </li>
        </ul>
      </div>

      <!-- Bouton d'assignation automatique -->
      <div style="margin-top: 20px; text-align: center;">
        <Button label="Assignation Automatique" @click="assignStudentsAutomatically" />
      </div>

      <!-- Section : Tableau des Affectations Finales -->
      <div style="margin-top: 20px;">
        <h2>Affectations Finales</h2>
        <DataTable :value="assignmentsTable" responsiveLayout="scroll">
          <Column header="ID Place" field="idPlace" />
          <Column header="ID Étudiant" field="idEtudiant" />
          <Column header="Vote Rank" field="voteRank" />
        </DataTable>
      </div>

      <!-- Section : Affectations Finales avec étudiant déjà inscrit -->
      <div style="margin-top: 20px;">
        <h2>Affectations Finales avec étudiant déjà inscrit</h2>
        <DataTable :value="manualAssignments" responsiveLayout="scroll">
          <Column header="ID Place" field="idPlace" />
          <Column header="ID Étudiant" field="idEtudiant" />
          <Column header="Vote Rank" field="voteRank" />
        </DataTable>
      </div>

      <!-- Section : Tous les Étudiants -->
      <div style="margin-top: 20px;">
        <h2>Tous les Étudiants</h2>
        <DataTable :value="allStudents" responsiveLayout="scroll">
          <Column header="ID Étudiant" field="idEtudiant" />
          <Column header="Nom" field="nom" />
          <Column header="Prénom" field="prenom" />
          <Column header="Vote Rank" field="voteRank" />
        </DataTable>
      </div>

      <!-- Section : Affichage du JSON complet des affectations -->
      <div style="margin-top: 20px;">
        <h2>Affectations JSON</h2>
        <pre>{{ JSON.stringify(assignmentsJSON, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/common/utils/Navbar.vue';
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
      expandedSeats: [],
      newAssignments: {},
      voters: [],
      voterCount: 0,
      assignmentsTable: [], // final assignments { idPlace, idEtudiant, voteRank }
      institutions: {}
    };
  },
  computed: {
    mergedSeats() {
      return this.expandedSeats;
    },
    placesSummary() {
      const summary = {};
      this.expandedSeats.forEach(seat => {
        const key = seat.IdPlace;
        if (summary[key]) {
          summary[key].count += 1;
        } else {
          summary[key] = {
            IdPlace: seat.IdPlace,
            NomPlace: seat.NomPlace,
            count: 1
          };
        }
      });
      return Object.values(summary);
    },
    // Affectations manuelles issues de "Places" avec voteRank fixé sur "déjà placé"
    manualAssignments() {
      return this.expandedSeats
        .filter(seat => seat.assignedStudent && seat.assignedStudent.trim() !== "")
        .map(seat => ({
          idPlace: seat.IdPlace || "",
          idEtudiant: seat.assignedStudent,
          voteRank: "déjà placé"
        }));
    },
    // Tableau regroupant tous les votants, avec Nom, Prénom et voteRank récupéré depuis les affectations finales si existant
    allStudents() {
      return this.voters.map(v => {
        // Recherche dans les affectations finales du voteRank de cet étudiant (s'il existe)
        const assignment = this.assignmentsTable.find(a => a.idEtudiant === v.id);
        return {
          idEtudiant: v.id,
          nom: v.Nom || v.name,      // Utilisation de "Nom" si disponible, sinon "name"
          prenom: v.Prenom || "",
          voteRank: assignment ? assignment.voteRank : "non voté"
        };
      });
    },
    // Objet JSON combiné des affectations finales et manuelles
    assignmentsJSON() {
      return {
        finalAssignments: this.assignmentsTable,
        manualAssignments: this.manualAssignments
      };
    }
  },
  methods: {
    // Récupère les institutions puis met à jour les places
    fetchInstitutions() {
      const instRef = ref(db, 'Institutions');
      onValue(instRef, snapshot => {
        this.institutions = snapshot.val() || {};
        this.updateExpandedSeats();
      });
    },
    // Mise à jour d'expandedSeats avec numérotation et nom de l'institution
    updateExpandedSeats() {
      const seats = [];
      const placesRef = ref(db, 'Places');
      onValue(placesRef, snapshot => {
        const placesData = snapshot.val() || {};
        Object.keys(placesData).forEach(key => {
          const place = placesData[key];
          place.IdPlace = key;
          place.IdInstitution = place.InstitutionId || place.IDPlace || "N/A";
          const instData = this.institutions[place.IdInstitution];
          place.InstitutionName = instData ? instData.Name : "N/A";
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
    // Affectation manuelle d'un étudiant à une place
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
    // Récupère les votants et leurs votes ainsi que leur Nom et Prénom depuis "Users"
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
                Nom: userData.Nom || "",
                Prenom: userData.Prenom || "",
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
    // Récupère les affectations sauvegardées dans Firebase sous /resultatVotationBA24PFP2
    fetchResultAlgo() {
      const resultRef = ref(db, 'resultatVotationBA24PFP2');
      onValue(resultRef, snapshot => {
        const data = snapshot.val() || {};
        this.resultAlgo = data.finalAssignments || [];
      });
    },
    // Assignation automatique avec matching et ajout du champ voteRank,
    // puis sauvegarde de l'objet JSON dans Firebase sous /resultatVotationBA24PFP2
    assignStudentsAutomatically() {
      const MAX_SEATS = 58
      const availableSeats = this.expandedSeats.slice(0, MAX_SEATS);

      // Séparation entre places déjà attribuées et places libres
      const alreadyAssigned = [];
      const unassignedSeats = [];
      availableSeats.forEach(seat => {
        if (seat.assignedStudent && seat.assignedStudent.trim() !== "") {
          alreadyAssigned.push(seat);
        } else {
          unassignedSeats.push(seat);
        }
      });

      // Étudiants non affectés (via les votes)
      const assignedStudentIds = alreadyAssigned.map(seat => seat.assignedStudent.trim());
      const remainingStudents = this.voters.filter(voter => !assignedStudentIds.includes(voter.id));

      // Construction du graphe des préférences pour les places libres
      const graph = [];
      for (let i = 0; i < remainingStudents.length; i++) {
        const student = remainingStudents[i];
        let preferredSeats = [];
        const votes = student.votes || [];
        votes.forEach(vote => {
          unassignedSeats.forEach((seat, index) => {
            if (vote.placeId === seat.IdPlace) {
              preferredSeats.push(index);
            }
          });
        });
        preferredSeats = [...new Set(preferredSeats)];
        graph.push(preferredSeats);
      }

      const numSeats = unassignedSeats.length;
      const numStudents = remainingStudents.length;
      const seatMatch = new Array(numSeats).fill(-1);
      const studentMatch = new Array(numStudents).fill(-1);

      function dfs(studentIndex, seen) {
        for (const seatIndex of graph[studentIndex]) {
          if (!seen[seatIndex]) {
            seen[seatIndex] = true;
            if (seatMatch[seatIndex] === -1 || dfs(seatMatch[seatIndex], seen)) {
              seatMatch[seatIndex] = studentIndex;
              studentMatch[studentIndex] = seatIndex;
              return true;
            }
          }
        }
        return false;
      }

      for (let i = 0; i < numStudents; i++) {
        dfs(i, new Array(numSeats).fill(false));
      }

      // Création des affectations issues du matching
      const matchingAssignments = [];
      const usedSeatIndices = new Set();
      for (let i = 0; i < numStudents; i++) {
        if (studentMatch[i] !== -1) {
          const seat = unassignedSeats[studentMatch[i]];
          usedSeatIndices.add(studentMatch[i]);
          let voteRank = "non voté";
          const votes = remainingStudents[i].votes || [];
          for (let k = 0; k < votes.length; k++) {
            if (votes[k].placeId === seat.IdPlace) {
              voteRank = k + 1;
              break;
            }
          }
          matchingAssignments.push({
            idPlace: seat.IdPlace,
            idEtudiant: remainingStudents[i].id,
            voteRank: voteRank
          });
        }
      }

      // Affectation des étudiants non appariés aux places restantes
      const unmatchedStudents = remainingStudents.filter((_, i) => studentMatch[i] === -1);
      const leftoverSeats = unassignedSeats.filter((_, index) => !usedSeatIndices.has(index));
      const leftoverAssignments = [];
      for (let i = 0; i < Math.min(unmatchedStudents.length, leftoverSeats.length); i++) {
        const seat = leftoverSeats[i];
        leftoverAssignments.push({
          idPlace: seat.IdPlace,
          idEtudiant: unmatchedStudents[i].id,
          voteRank: "non voté"
        });
      }

      // Regroupement des affectations finales : manuelles, matching et leftover
      const finalAssignments = [];
      alreadyAssigned.forEach(seat => {
        finalAssignments.push({
          idPlace: seat.IdPlace,
          idEtudiant: seat.assignedStudent,
          voteRank: "déjà placé"
        });
      });
      finalAssignments.push(...matchingAssignments, ...leftoverAssignments);

      this.assignmentsTable = finalAssignments.filter(a => a.idEtudiant && a.idEtudiant.trim() !== "");

      const resultData = {
        finalAssignments: finalAssignments,
        manualAssignments: this.manualAssignments.map(seat => ({
          idPlace: seat.idPlace || "",
          idEtudiant: seat.idEtudiant,
          voteRank: "déjà placé"
        }))
      };

      set(ref(db, 'resultatVotationBA24PFP2'), resultData)
        .then(() => {
          alert("Les affectations ont été enregistrées dans Firebase sous /resultatVotationBA24PFP2 !");
          this.fetchResultAlgo();
        })
        .catch(err => {
          console.error("Erreur lors de l'enregistrement dans Firebase:", err);
          alert("Erreur lors de l'enregistrement des affectations.");
        });
      
      console.table(this.assignmentsTable);
    }
  },
  mounted() {
    this.fetchInstitutions();
    this.updateExpandedSeats();
    this.fetchVotersData();
  }
};
</script>

<style scoped>
.scroll-table-container {
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-table-container::-webkit-scrollbar {
  display: none;
}
h1, h2, h3 {
  text-align: center;
  margin: 20px 0;
}
ul {
  list-style: none;
  padding: 0;
}
ul li {
  margin: 5px 0;
  text-align: center;
}
pre {
  background: #f5f5f5;
  padding: 10px;
  overflow-x: auto;
}
</style>
