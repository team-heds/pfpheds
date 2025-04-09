<template>
  <div>
    <Navbar />
    <h1>Places assignées</h1>
    
    <!-- Bouton global pour modifier le "Lieu signature" sur toutes les lignes -->
    <div style="margin-bottom: 20px; text-align: center;">
      <Button :label="toggleButtonLabel" @click="toggleLieuSignature" />
    </div>
    
    <!-- Tableau des affectations finales enrichies -->
    <div style="margin-top: 40px;">
      <DataTable :value="finalAssignments" responsiveLayout="scroll">
        <!-- Numérotation -->
        <Column header="#" style="width: 3rem;">
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>
        <Column header="Institution" field="institutionName" />
        <Column header="Nom de la Place" field="NomPlace" />
        <Column header="Nom" field="nom" />
        <Column header="Prénom" field="prenom" />
        <Column header="Répondant HES" field="repondantHES" />
        <Column header="Vote Rank" field="voteRank" />
        <Column header="Catégorie" field="category" />
        <Column header="Canton" field="canton" />
        <Column header="Localité" field="locality" />
        <Column header="Critères" field="validCriteria" />
        <Column header="Siège" field="seat" />
        <Column header="Praticien Prénom" field="praticienPrenom" />
        <Column header="Praticien Nom" field="praticienNom" />
        <Column header="Praticien Mail" field="praticienMail" />
        
        <!-- Colonne pour Lieu signature avec Dropdown -->
        <Column header="Lieu signature">
          <template #body="{ data }">
            <Dropdown
              v-model="lieuSignatureOverrides[data._key]"
              :options="signatureOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez"
            />
          </template>
        </Column>
        
        <!-- Nouvelle colonne pour "En charge de la signature" -->
        <Column header="En charge de la signature">
          <template #body="{ data }">
            <Dropdown
              v-model="signatureInChargeOverrides[data._key]"
              :options="teachersOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez un enseignant"
            />
          </template>
        </Column>
        
      </DataTable>
    </div>
    
    <!-- Boutons d'action -->
    <div style="margin-top: 20px; text-align: center;">
      <Button label="Assignation Automatique" @click="assignStudentsAutomatically" />
      <Button label="Exporter CSV" @click="exportCSV" style="margin-left: 10px;" />
      <Button label="Enregistrer signatures" @click="saveSignatureAssignments" style="margin-left: 10px;" />
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ref as firebaseRef, onValue, set } from "firebase/database";
import { db } from '@/firebase';
import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';

export default {
  name: 'PlacesAssigneds',
  components: {
    Navbar,
    DataTable,
    Column,
    Button,
    Dropdown
  },
  setup() {
    // Références réactives pour les données provenant de Firebase
    const placesData = ref({});
    const users = ref({});
    const institutions = ref({});
    const resultAlgo = ref({});
    const praticienFormateurs = ref({});
    const students = ref({});
    
    // Références pour les enseignants importés depuis Firebase (nœud "Enseignants")
    const teachers = ref({});
    
    // Objets réactifs pour stocker la valeur "Lieu signature" et "En charge de la signature" pour chaque ligne
    const lieuSignatureOverrides = reactive({});
    const signatureInChargeOverrides = reactive({});
    
    // Options du dropdown "Lieu signature"
    const signatureOptions = [
      { label: 'présence', value: 'présence' },
      { label: 'distance', value: 'distance' }
    ];
    const firstOption = signatureOptions[0].value;   // "présence"
    const secondOption = signatureOptions[1].value;    // "distance"
    
    // Importation des enseignants et création des options pour le dropdown
    const fetchTeachers = () => {
      const teachersRef = firebaseRef(db, 'Enseignants');
      onValue(teachersRef, snapshot => {
        teachers.value = snapshot.val() || {};
      });
    };
    const teachersOptions = computed(() => {
      return Object.keys(teachers.value).map(key => {
        const teacher = teachers.value[key];
        return { label: `${teacher.Forname} ${teacher.Name}`, value: key };
      });
    });
    
    // Fonctions de récupération des autres données depuis Firebase
    const fetchInstitutions = () => {
      const instRef = firebaseRef(db, 'Institutions');
      onValue(instRef, snapshot => {
        institutions.value = snapshot.val() || {};
      });
    };
    
    const fetchPlaces = () => {
      const placesRef = firebaseRef(db, 'Places');
      onValue(placesRef, snapshot => {
        placesData.value = snapshot.val() || {};
      });
    };
    
    const fetchUsers = () => {
      const usersRef = firebaseRef(db, 'Users');
      onValue(usersRef, snapshot => {
        users.value = snapshot.val() || {};
      });
    };
    
    const fetchStudents = () => {
      const studentsRef = firebaseRef(db, 'Students');
      onValue(studentsRef, snapshot => {
        students.value = snapshot.val() || {};
      });
    };
    
    const fetchResultAlgo = () => {
      const resultRef = firebaseRef(db, 'resultatVotationBA24PFP2');
      onValue(resultRef, snapshot => {
        resultAlgo.value = snapshot.val() || {};
      });
    };
    
    const fetchPraticienFormateurs = () => {
      const practRef = firebaseRef(db, 'PraticienFormateurs');
      onValue(practRef, snapshot => {
        praticienFormateurs.value = snapshot.val() || {};
      });
    };
    
    // Méthode d'assignation automatique des étudiants
    const assignStudentsAutomatically = () => {
      const finalAssignments = [];
      Object.keys(placesData.value).forEach(key => {
        const place = placesData.value[key];
        const count = parseInt(place.PFP4 || '0');
        for (let i = 1; i <= count; i++) {
          const studentKey = `selectedEtudiantBA22PFP4-${i}`;
          if (place[studentKey] && place[studentKey].trim() !== "") {
            finalAssignments.push({
              idPlace: key,
              idEtudiant: place[studentKey].trim(),
              voteRank: "déjà placé"
            });
          }
        }
      });
      const resultData = {
        finalAssignments: finalAssignments,
        manualAssignments: finalAssignments
      };
      set(firebaseRef(db, 'resultatVotationBA24PFP2'), resultData)
        .then(() => {
          alert("Les affectations ont été enregistrées dans Firebase !");
          fetchResultAlgo();
        })
        .catch(err => {
          console.error("Erreur lors de l'enregistrement dans Firebase:", err);
          alert("Erreur lors de l'enregistrement des affectations.");
        });
    };
    
    // Calcul des affectations finales enrichies
    const finalAssignments = computed(() => {
      const assignments = resultAlgo.value.finalAssignments || [];
      const groups = {};
      assignments.forEach(assignment => {
        if (!groups[assignment.idPlace]) {
          groups[assignment.idPlace] = [];
        }
        groups[assignment.idPlace].push(assignment);
      });
      const recalculated = [];
      for (const idPlace in groups) {
        groups[idPlace].forEach((assignment, index) => {
          recalculated.push({ ...assignment, seat: index + 1 });
        });
      }
      return recalculated.map(assignment => {
        const place = placesData.value[assignment.idPlace] || {};
        const idInstitution = place.IDPlace;
        const inst = (idInstitution && institutions.value[idInstitution]) ? institutions.value[idInstitution] : {};
        const student = students.value[assignment.idEtudiant] || {};
        const userObj = users.value[assignment.idEtudiant] || {};
    
        // Critères validants
        const criteriaKeys = ["AIGU", "AMBU", "DE", "FR", "REHAB", "MSQ", "NEUROGER"];
        const validCriteria = criteriaKeys.filter(key => {
          const val = place[key];
          return val === true || (typeof val === "string" && val.toLowerCase() === "true");
        });
    
        // Identification du praticien formateur
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
        const pract = praticienFormateurs.value[praticienFormateur] || {};
    
        // Création d'une clé unique pour chaque ligne
        const key = assignment.idPlace + '_' + assignment.idEtudiant;
        // Initialisation par défaut du "Lieu signature" si non défini
        if (!(key in lieuSignatureOverrides)) {
          lieuSignatureOverrides[key] = firstOption;
        }
        // Initialisation par défaut de "En charge de la signature"
        if (!(key in signatureInChargeOverrides)) {
          signatureInChargeOverrides[key] = "";
        }
    
        return {
          _key: key,
          idPlace: assignment.idPlace,
          NomPlace: place.NomPlace || "",
          idInstitution: place.IDPlace || "",
          idEtudiant: assignment.idEtudiant,
          nom: userObj.Nom || student.Nom || "",
          prenom: userObj.Prenom || student.Prenom || "",
          repondantHES: student.RepondantHES || "",
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
    });
    
    // Détermine l'état global pour le dropdown "Lieu signature"
    const globalLastValue = computed(() => {
      if (finalAssignments.value.length > 0) {
        const firstKey = finalAssignments.value[0]._key;
        return lieuSignatureOverrides[firstKey] || firstOption;
      }
      return firstOption;
    });
    
    // Libellé du bouton pour basculer entre "présence" et "distance"
    const toggleButtonLabel = computed(() => {
      return globalLastValue.value === firstOption 
        ? `Tout passer en ${secondOption}` 
        : `Tout passer en ${firstOption}`;
    });
    
    // Méthode pour basculer la valeur du "Lieu signature" sur toutes les lignes
    const toggleLieuSignature = () => {
      const newValue = globalLastValue.value === firstOption ? secondOption : firstOption;
      finalAssignments.value.forEach(assignment => {
        lieuSignatureOverrides[assignment._key] = newValue;
      });
    };
    
    // Méthode pour exporter les données au format CSV en incluant les colonnes "Lieu signature" et "En charge de la signature"
    const exportCSV = () => {
      const data = finalAssignments.value.map(assignment => {
        const teacherOpt = teachersOptions.value.find(opt => opt.value === signatureInChargeOverrides[assignment._key]);
        return {
          ...assignment,
          lieuSignature: lieuSignatureOverrides[assignment._key] || firstOption,
          enChargeDeLaSignature: teacherOpt ? teacherOpt.label : ""
        };
      });
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
        "repondantHES",
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
        "validCriteria",
        "lieuSignature",
        "enChargeDeLaSignature"
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
    };
    
    // Nouvelle méthode pour enregistrer les modifications des colonnes "Lieu signature"
    // et "En charge de la signature" dans une nouvelle table "signatureAssignments"
    const saveSignatureAssignments = () => {
      finalAssignments.value.forEach(assignment => {
        const teacherOpt = teachersOptions.value.find(opt => opt.value === signatureInChargeOverrides[assignment._key]);
        const record = {
          assignmentId: assignment._key,
          idPlace: assignment.idPlace,
          idEtudiant: assignment.idEtudiant,
          lieuSignature: lieuSignatureOverrides[assignment._key] || firstOption,
          enChargeDeLaSignature: teacherOpt ? teacherOpt.label : ""
        };
        set(firebaseRef(db, 'signatureAssignments/' + assignment._key), record)
          .catch(err => {
            console.error('Erreur lors de la sauvegarde de l\'affectation de signature :', err);
          });
      });
      alert('Les affectations de signature ont été enregistrées avec succès');
    };
    
    // Chargement de toutes les données lors du montage du composant
    onMounted(() => {
      fetchInstitutions();
      fetchPlaces();
      fetchUsers();
      fetchStudents();
      fetchResultAlgo();
      fetchPraticienFormateurs();
      fetchTeachers();
    });
    
    return {
      lieuSignatureOverrides,
      signatureOptions,
      firstOption,
      secondOption,
      finalAssignments,
      toggleButtonLabel,
      toggleLieuSignature,
      assignStudentsAutomatically,
      exportCSV,
      teachersOptions,
      signatureInChargeOverrides,
      saveSignatureAssignments
    };
  }
};
</script>

<style scoped>
h1, h2 {
  text-align: center;
  margin: 20px 0;
}
</style>
