<template>
  <div class="votation-result">
    <!-- Barre de navigation -->
    <Navbar />

    <h1>Résultats de Votation (BA24 - PFP1A)</h1>

    <!-- Tableau des résultats -->
    <div class="table-container">
      <table class="result-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Nom de l'Institution</th>
            <th>Domaine</th>
            <th>Choix</th>
            <th>Sélection</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(result, index) in results" 
            :key="index" 
            :class="{ validated: result.validated }"
          >
            <td>{{ result.userNom }}</td>
            <td>{{ result.userPrenom }}</td>
            <td>{{ result.Name }}</td>
            <td>{{ result.Domaine }}</td>
            <td>{{ result.choiceNumber }}</td>
            <td>
              <input 
                type="checkbox" 
                v-model="result.selected" 
                :disabled="result.validated" 
              />
              <Checkbox v-model="result.selected" :disabled="result.validated" />
            </td>
            <td>
              <Button class=" primary" @click="openEditModal(result, index)">
                Edit
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="results.length === 0" class="no-data">
        Aucune donnée disponible.
      </div>
    </div>

    <!-- Bouton de validation de la PFP -->
    <div class="action-buttons">
      <button @click="validatePFP" class="validate-button">
        Valider la PFP
      </button>
    </div>

    <!-- Overlay Modal pour l'édition (sélection d'une nouvelle place) -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Modifier la Place</h2>
        <div class="places-list">
          <ul>
            <li 
              v-for="(place, pIndex) in places" 
              :key="pIndex" 
              @click="selectPlace(place)"
            >
              {{ place.IDPlace }} - (Key: {{ place.NomPlace }})
            </li>
          </ul>
        </div>
        <div class="modal-actions">
          <button @click="closeEditModal">Annuler</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, get, update } from "firebase/database";
import { db } from "@/firebase.js";
import Navbar from "@/components/Utils/Navbar.vue";

export default {
  name: "VotationResultView",
  components: {
    Navbar
  },
  data() {
    return {
      results: [],
      showEditModal: false,
      editingIndex: null,
      editingResult: null,
      places: [] // Liste des places récupérées depuis Firebase pour l'édition
    };
  },
  methods: {
    /**
     * Récupère les résultats de votation depuis Firebase
     * et pour chaque résultat, récupère les informations utilisateur
     * (Nom et Prénom) depuis la table "Users".
     */
    fetchVotationResults() {
      const resultsRef = ref(db, "VotationResult/BA24/PFP1A");
      get(resultsRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            let data = snapshot.val();
            let arr = [];
            if (Array.isArray(data)) {
              arr = data;
            } else {
              // Conversion de l'objet en tableau en sauvegardant la clé
              for (const key in data) {
                if (data.hasOwnProperty(key)) {
                  let item = data[key];
                  item._key = key; // Clé pour mise à jour dans Firebase
                  arr.push(item);
                }
              }
            }
            // Initialiser les propriétés locales "selected" et "validated"
            arr = arr.map((item) => {
              if (typeof item.selected === "undefined") item.selected = false;
              if (typeof item.validated === "undefined") item.validated = false;
              return item;
            });
            // Pour chaque résultat, récupérer les infos utilisateur depuis "Users"
            const promises = arr.map(async (item) => {
              if (item.studentId) {
                try {
                  const userSnap = await get(ref(db, "Users/" + item.studentId));
                  if (userSnap.exists()) {
                    const userData = userSnap.val();
                    item.userNom = userData.Nom || "";
                    item.userPrenom = userData.Prenom || "";
                  } else {
                    item.userNom = "";
                    item.userPrenom = "";
                  }
                } catch (err) {
                  console.error("Erreur lors de la récupération de l'utilisateur :", err);
                  item.userNom = "";
                  item.userPrenom = "";
                }
              }
              return item;
            });
            Promise.all(promises).then((updatedArr) => {
              this.results = updatedArr;
            });
          } else {
            console.log("Aucune donnée disponible");
            this.results = [];
          }
        })
        .catch((error) => {
          console.error("Erreur de récupération :", error);
        });
    },

    /**
     * Valide la PFP pour chaque étudiant sélectionné en mettant à jour Firebase.
     * La case se désactive et la ligne est marquée comme validée.
     */
    validatePFP() {
      this.results.forEach((result, index) => {
        if (result.selected && !result.validated) {
          let recordKey = result._key || index;
          const updateRef = ref(db, "VotationResult/BA24/PFP1A/" + recordKey);
          update(updateRef, { validated: true })
            .then(() => {
              // Mise à jour locale : désactive la case et réinitialise "selected"
              this.$set(this.results, index, {
                ...result,
                validated: true,
                selected: false
              });
            })
            .catch((error) => {
              console.error("Erreur lors de la validation :", error);
            });
        }
      });
    },

    /**
     * Ouvre le modal d'édition pour une ligne donnée
     * et charge la liste des places depuis Firebase.
     */
    openEditModal(result, index) {
      this.editingResult = result;
      this.editingIndex = index;
      this.showEditModal = true;
      this.fetchPlaces();
    },

    /**
     * Ferme le modal d'édition.
     */
    closeEditModal() {
      this.showEditModal = false;
      this.editingResult = null;
      this.editingIndex = null;
    },

    /**
     * Récupère la liste des places depuis Firebase.
     */
    fetchPlaces() {
      const placesRef = ref(db, "Places");
      get(placesRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            let data = snapshot.val();
            let arr = [];
            if (Array.isArray(data)) {
              arr = data;
            } else {
              for (const key in data) {
                if (data.hasOwnProperty(key)) {
                  let item = data[key];
                  item._key = key;
                  arr.push(item);
                }
              }
            }
            this.places = arr;
          } else {
            console.log("Aucune place trouvée.");
            this.places = [];
          }
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération des places :", error);
        });
    },

    /**
     * Lors de la sélection d'une place dans le modal, met à jour la ligne éditée
     * en modifiant la valeur de "placeKey" et "Name" (nom de l'institution)
     * dans Firebase et en local.
     */
    selectPlace(place) {
      if (this.editingResult) {
        let recordKey = this.editingResult._key || this.editingIndex;
        const updateRef = ref(db, "VotationResult/BA24/PFP1A/" + recordKey);
        // Ici, nous utilisons "IDPlace" comme identifiant de la place et "NomPlace" pour le nom de l'institution.
        update(updateRef, {
          placeKey: place.IDPlace,
          Name: place.NomPlace
        })
          .then(() => {
            this.$set(this.results, this.editingIndex, {
              ...this.editingResult,
              placeKey: place.IDPlace,
              Name: place.NomPlace
            });
            this.closeEditModal();
          })
          .catch((error) => {
            console.error("Erreur lors de la mise à jour de la place :", error);
          });
      }
    }
  },
  mounted() {
    this.fetchVotationResults();
  }
};
</script>

<style scoped>
/* Style général */
.votation-result {
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

/* Tableau */
.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
}

.result-table th,
.result-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.result-table thead {
  background-color: #007bff;
  color: #fff;
}

.result-table tbody tr:nth-child(even) {
}

.result-table tbody tr:hover {
}

/* Lignes validées : fond vert pâle et texte grisé */
.result-table tbody tr.validated {
  color: #6c757d;
}

/* Bouton Edit */
.edit-button {
  padding: 5px 10px;
  background-color: #ffc107;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #000;
}

.edit-button:hover {
  background-color: #e0a800;
}

/* Bouton de validation */
.action-buttons {
  text-align: center;
  margin-bottom: 20px;
}

.validate-button {
  padding: 10px 20px;
  background-color: #28a745;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #fff;
}

.validate-button:hover {
  background-color: #218838;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--surface-overlay);
  padding: 20px;
  width: 400px;
  border-radius: 8px;
  text-align: center;
}

.modal-content h2 {
  margin-top: 0;
}

.places-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.places-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.places-list li {
  padding: 10px;
  border: 1px solid var(--surface-hover);
  margin-bottom: 5px;
  cursor: pointer;
  border-radius: 4px;
}

.places-list li:hover {
  background-color: var(--surface-hover);
}

.modal-actions button {
  padding: 8px 16px;
  background-color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #fff;
}

.modal-actions button:hover {
  background-color: #c82333;
}

/* Message d'absence de données */
.no-data {
  text-align: center;
  font-style: italic;
  color: #888;
}
</style>
