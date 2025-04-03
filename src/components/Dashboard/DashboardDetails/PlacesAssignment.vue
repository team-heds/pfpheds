<template>
    <div>
      <Navbar />
      <h1>Assignment des Places Disponibles</h1>
  
      <!-- Section : Affichage des places disponibles avec assignation -->
      <div>
        <h2>Liste des Places Disponibles</h2>
        <DataTable :value="expandedSeats" responsiveLayout="scroll">
          <!-- Colonne de numérotation -->
          <Column header="#" :body="indexBody"></Column>
          <!-- Colonne affichant l'ID de l'institution -->
          <Column header="Institution ID">
            <template #body="slotProps">
              <span>{{ slotProps.data.IdInstitution }}</span>
            </template>
          </Column>
          <!-- Colonne affichant le nom de la place -->
          <Column header="Nom de la Place" field="NomPlace"></Column>
          <!-- Colonne pour l'assignation de l'étudiant -->
          <Column header="Assignation Étudiant">
            <template #body="slotProps">
              <InputText 
                v-model="newAssignments[`${slotProps.data.IdPlace}-${slotProps.data.seatIndex}`]" 
                placeholder="ID Étudiant" 
              />
              <Button label="Assigner" @click="assignStudent(slotProps.data)" />
            </template>
          </Column>
        </DataTable>
      </div>
  
      <!-- Section : Affichage de la liste des votants et de leur nom -->
      <div style="margin-top: 20px;">
        <h2>Liste des Étudiants ayant voté</h2>
        <ul>
          <li v-for="voter in voters" :key="voter.id">
            ID: {{ voter.id }} - Nom: {{ voter.name }}
          </li>
        </ul>
        <h3>Total de votants : {{ voterCount }}</h3>
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
        // Objet pour stocker les valeurs saisies (clé = "IdPlace-seatIndex")
        newAssignments: {},
        // Liste des votants (avec id et nom récupéré depuis /Users)
        voters: [],
        voterCount: 0
      };
    },
    methods: {
      // Permet d'afficher l'index de la ligne (commence à 1)
      indexBody(slotProps) {
        return slotProps.index + 1;
      },
      // Récupère les données des places depuis Firebase
      fetchPlacesData() {
        const placesRef = ref(db, 'Places');
        onValue(placesRef, snapshot => {
          const placesData = snapshot.val() || {};
          const placesArray = [];
          Object.keys(placesData).forEach(key => {
            placesArray.push({
              ...placesData[key],
              IdPlace: key,
              // L'ID de l'institution est récupéré soit depuis InstitutionId, soit depuis IDPlace selon les données
              IdInstitution: placesData[key].InstitutionId || placesData[key].IDPlace || "N/A"
            });
          });
          this.places = placesArray;
          this.updateExpandedSeats();
        });
      },
      // Génère la liste des sièges disponibles en fonction de PFP4 et des assignations déjà réalisées
      updateExpandedSeats() {
        const rows = [];
        this.places.forEach(place => {
          const count = parseInt(place.PFP4 || '0');
          if (!isNaN(count) && count >= 1) {
            for (let i = 1; i <= count; i++) {
              const studentKey = `selectedEtudiantBA22PFP4-${i}`;
              const alreadySelected = place[studentKey] && place[studentKey].trim() !== "";
              if (!alreadySelected) {
                const dynamicKey = `selectedActiveBA22PFP4-${i}`;
                if (place[dynamicKey] === true) {
                  rows.push({
                    ...place,
                    seatIndex: i,
                    dynamicKey: dynamicKey
                  });
                }
              }
            }
          }
        });
        this.expandedSeats = rows;
      },
      // Affecte l'ID étudiant saisi à la place pour le siège concerné
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
            this.fetchPlacesData();
          })
          .catch(err => {
            console.error("Erreur d'assignation:", err);
            alert("Erreur lors de l'assignation.");
          });
      },
      // Récupère la liste des votants et pour chacun, son nom depuis la collection /Users
      fetchVotersData() {
        const votesRef = ref(db, 'VotationBA22PFP4');
        onValue(votesRef, snapshot => {
          const votesData = snapshot.val() || {};
          const voterIds = Object.keys(votesData);
          this.voterCount = voterIds.length;
          // Pour chaque votant, on récupère son nom depuis /Users
          const promises = voterIds.map(voterId => {
            return new Promise(resolve => {
              const userRef = ref(db, `Users/${voterId}`);
              onValue(userRef, (snapshot) => {
                const userData = snapshot.val() || {};
                resolve({ id: voterId, name: userData.Name || "Non spécifié" });
              }, { onlyOnce: true });
            });
          });
          Promise.all(promises).then(result => {
            this.voters = result;
          });
        });
      }
    },
    mounted() {
      this.fetchPlacesData();
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
  </style>
  