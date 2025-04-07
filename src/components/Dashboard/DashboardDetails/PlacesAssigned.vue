<template>
  <div>
    <Navbar />
    <h1>Places assignées</h1>

    <!-- Tableau des affectations finales enrichies -->
    <div style="margin-top: 40px;">
      <DataTable :value="finalAssignments" responsiveLayout="scroll">
        <!-- Numérotation -->
        <Column header="#" style="width: 3rem;">
          <template #body="slotProps">
            {{ slotProps.index + 1 }}
          </template>
        </Column>
        <Column header="ID Place" field="idPlace" />
        <Column header="Nom de la Place" field="NomPlace" />
        <Column header="ID de l'institution" field="idInstitution" />
        <Column header="ID Étudiant" field="idEtudiant" />
        <Column header="Nom" field="nom" />
        <Column header="Prénom" field="prenom" />
        <Column header="Vote Rank" field="voteRank" />
        <Column header="Catégorie" field="category" />
        <Column header="Canton" field="canton" />
        <Column header="Localité" field="locality" />
        <Column header="Institution" field="institutionName" />
        <!-- Nouvelle colonne pour afficher les critères validants -->
        <Column header="Critères" field="validCriteria" />
        <!-- Colonne pour le numéro de siège recalculé -->
        <Column header="Siège" field="seat" />
        <!-- Colonne pour l'ID du praticien formateur -->
        <Column header="ID Praticien Formateur" field="praticienFormateur" />
        <!-- Colonnes pour les infos du praticien -->
        <Column header="Praticien Prénom" field="praticienPrenom" />
        <Column header="Praticien Nom" field="praticienNom" />
        <Column header="Praticien Mail" field="praticienMail" />
      </DataTable>
    </div>

    <!-- Boutons d'action -->
    <div style="margin-top: 20px; text-align: center;">
      <Button label="Assignation Automatique" @click="assignStudentsAutomatically" />
      <Button label="Exporter CSV" @click="exportCSV" style="margin-left: 10px;" />
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { ref, onValue, set } from "firebase/database";
import { db } from '@/firebase';

export default {
  name: 'PlacesAssigneds',
  components: {
    Navbar,
    DataTable,
    Column,
    Button
  },
  data() {
    return {
      placesData: {},         // Données de /Places
      users: {},              // Données de /Users
      institutions: {},       // Données de /Institutions
      resultAlgo: {},         // Affectations enregistrées (de /resultatVotationBA24PFP2)
      praticienFormateurs: {} // Données de /PraticienFormateurs
    };
  },
  computed: {
    finalAssignments() {
      // Récupération des affectations enregistrées dans Firebase
      const assignments = this.resultAlgo.finalAssignments || [];
      // Regrouper par idPlace pour recalculer le numéro de siège
      const groups = {};
      assignments.forEach(assignment => {
        if (!groups[assignment.idPlace]) {
          groups[assignment.idPlace] = [];
        }
        groups[assignment.idPlace].push(assignment);
      });
      // Réassigner un numéro de siège séquentiel pour chaque groupe
      const recalculated = [];
      for (const idPlace in groups) {
        groups[idPlace].forEach((assignment, index) => {
          recalculated.push({ ...assignment, seat: index + 1 });
        });
      }
      // Enrichir chaque affectation avec les infos de la place, de l'institution, de l'utilisateur,
      // déterminer le praticien formateur et construire la liste des critères validants.
      return recalculated.map(assignment => {
        const place = this.placesData[assignment.idPlace] || {};
        const idInstitution = place.IDPlace;
        const inst = (idInstitution && this.institutions[idInstitution]) ? this.institutions[idInstitution] : {};
        const user = this.users[assignment.idEtudiant] || {};
        
        // Liste des critères à vérifier
        const criteriaKeys = ["AIGU", "AMBU", "DE", "FR", "REHAB", "MSQ", "NEUROGER"];
        const validCriteria = criteriaKeys.filter(key => {
          const val = place[key];
          return val === true || (typeof val === "string" && val.toLowerCase() === "true");
        });
        
        // Détermination de l'ID du praticien formateur :
        let praticienFormateur = "";
        if (Array.isArray(place.praticiensFormateurs)) {
          if (place.praticiensFormateurs.length === 1) {
            praticienFormateur = place.praticiensFormateurs[0];
          } else {
            const seatNum = assignment.seat;
            praticienFormateur = place["selectedPraticienBA22PFP4-" + seatNum] ||
                                  place["selectedPraticiensBA22PFP4-" + seatNum] || "";
          }
        }
        // Récupération des infos du praticien depuis /PraticienFormateurs
        const pract = this.praticienFormateurs[praticienFormateur] || {};
        
        return {
          idPlace: assignment.idPlace,
          NomPlace: place.NomPlace || "",
          idInstitution: place.IDPlace || "",
          idEtudiant: assignment.idEtudiant,
          nom: user.Nom || user.name || "",
          prenom: user.Prenom || "",
          voteRank: assignment.voteRank || "non voté",
          category: inst.Category || "non défini",
          canton: inst.Canton || "non défini",
          locality: inst.Locality || "non défini",
          institutionName: inst.Name || "non défini",
          seat: assignment.seat,
          praticienFormateur: praticienFormateur,
          praticienPrenom: pract.Prenom || "",
          praticienNom: pract.Nom || "",
          praticienMail: pract.Mail || "",
          validCriteria: validCriteria.join(", ")
        };
      });
    }
  },
  methods: {
    fetchInstitutions() {
      const instRef = ref(db, 'Institutions');
      onValue(instRef, snapshot => {
        this.institutions = snapshot.val() || {};
      });
    },
    fetchPlaces() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, snapshot => {
        this.placesData = snapshot.val() || {};
      });
    },
    fetchUsers() {
      const usersRef = ref(db, 'Users');
      onValue(usersRef, snapshot => {
        this.users = snapshot.val() || {};
      });
    },
    fetchResultAlgo() {
      const resultRef = ref(db, 'resultatVotationBA24PFP2');
      onValue(resultRef, snapshot => {
        this.resultAlgo = snapshot.val() || {};
      });
    },
    fetchPraticienFormateurs() {
      const practRef = ref(db, 'PraticienFormateurs');
      onValue(practRef, snapshot => {
        this.praticienFormateurs = snapshot.val() || {};
      });
    },
    // Méthode d'assignation automatique : génère les affectations sans numéro de siège,
    // le numéro de siège sera recalculé dans le computed.
    assignStudentsAutomatically() {
      const finalAssignments = [];
      Object.keys(this.placesData).forEach(key => {
        const place = this.placesData[key];
        const count = parseInt(place.PFP4 || '0');
        for (let i = 1; i <= count; i++) {
          const studentKey = `selectedEtudiantBA22PFP4-${i}`;
          if (place[studentKey] && place[studentKey].trim() !== "") {
            finalAssignments.push({
              idPlace: key,
              idEtudiant: place[studentKey].trim(),
              voteRank: "déjà placé"
              // Le champ 'seat' sera recalculé dans le computed.
            });
          }
        }
      });
      const resultData = {
        finalAssignments: finalAssignments,
        manualAssignments: finalAssignments
      };
      set(ref(db, 'resultatVotationBA24PFP2'), resultData)
        .then(() => {
          alert("Les affectations ont été enregistrées dans Firebase !");
          this.fetchResultAlgo();
        })
        .catch(err => {
          console.error("Erreur lors de l'enregistrement dans Firebase:", err);
          alert("Erreur lors de l'enregistrement des affectations.");
        });
    },
    // Méthode pour exporter les affectations au format CSV en UTF-8 avec BOM
    exportCSV() {
      const data = this.finalAssignments;
      if (!data || !data.length) {
        alert("Aucune donnée à exporter.");
        return;
      }
      const headers = [
        "idPlace",
        "NomPlace",
        "idInstitution",
        "idEtudiant",
        "nom",
        "prenom",
        "voteRank",
        "category",
        "canton",
        "locality",
        "institutionName",
        "seat",
        "praticienFormateur",
        "praticienPrenom",
        "praticienNom",
        "praticienMail",
        "validCriteria"
      ];
      const csvRows = [];
      csvRows.push(headers.join(','));
      data.forEach(item => {
        const row = headers.map(header => {
          let val = item[header] !== undefined ? item[header] : "";
          if (typeof val === "string") {
            val = val.replace(/"/g, '""');
            if (val.search(/("|,|\n)/g) >= 0) {
              val = `"${val}"`;
            }
          }
          return val;
        });
        csvRows.push(row.join(','));
      });
      // Ajout du BOM pour garantir l'encodage UTF-8
      const csvString = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "affectations.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
  mounted() {
    this.fetchInstitutions();
    this.fetchPlaces();
    this.fetchUsers();
    this.fetchResultAlgo();
    this.fetchPraticienFormateurs();
  }
};
</script>

<style scoped>
h1, h2 {
  text-align: center;
  margin: 20px 0;
}
</style>
