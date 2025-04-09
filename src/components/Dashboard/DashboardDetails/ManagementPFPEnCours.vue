<template>
    <div>
      <Navbar />
      <h1>Management PFP En Cours</h1>
      
      <!-- Tableau récapitulatif enrichi -->
      <div style="margin-top: 40px;">
        <DataTable :value="managementAssignments" responsiveLayout="scroll">
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
          
          <!-- Lieu signature éditable -->
          <Column header="Lieu signature">
            <template #body="{ data }">
              <Dropdown
                v-model="lieuSignatureOverrides[data._key]"
                :options="signatureOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionnez"
                @change="updateSignatureAssignment(data._key)"
              />
            </template>
          </Column>
          
          <!-- En charge de la signature éditable -->
          <Column header="En charge de la signature">
            <template #body="{ data }">
              <Dropdown
                v-model="signatureInChargeOverrides[data._key]"
                :options="teachersOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionnez un enseignant"
                @change="updateSignatureAssignment(data._key)"
              />
            </template>
          </Column>
          
          <!-- Remarque étudiant avec bouton d'édition -->
          <Column header="Remarque étudiant">
            <template #body="slotProps">
              <span>{{ slotProps.data.remarqueEtudiant || 'Aucune' }}</span>
              <Button icon="pi pi-pencil" class="p-button-text" @click="openRemarkDialog(slotProps.data)" />
            </template>
          </Column>
          
          <!-- Remarques places -->
          <Column header="Remarques places">
            <template #body="slotProps">
              <span>{{ slotProps.data.remarquesPlaces || 'Aucune' }}</span>
            </template>
          </Column>
          
          <!-- Remarque Signature avec bouton d'édition -->
          <Column header="Remarque Signature">
            <template #body="slotProps">
              <span>{{ signatureRemarks[slotProps.data._key] || 'Aucune' }}</span>
              <Button icon="pi pi-pencil" class="p-button-text" @click="openSignatureRemarkDialog(slotProps.data)" />
            </template>
          </Column>
          
        </DataTable>
      </div>
      
      <!-- Boutons d'action -->
      <div style="margin-top: 20px; text-align: center;">
        <Button label="Exporter CSV" @click="exportCSV" style="margin-right: 10px;" />
        <Button label="Valider" @click="saveSignatureAssignments" />
      </div>
      
      <!-- Dialog pour modifier la remarque étudiant -->
      <Dialog header="Modifier la Remarque Étudiant" v-model:visible="displayRemarkDialog" modal>
        <div class="remark-dialog">
          <textarea v-model="editedRemarks" rows="5" style="width:100%;" placeholder="Saisir vos remarques ici..."></textarea>
          <div class="dialog-buttons" style="margin-top:1em; text-align:right;">
            <Button label="Annuler" class="p-button-text" @click="cancelRemarkEdit" />
            <Button label="Confirmer" class="p-button-success" @click="confirmRemarkUpdate" />
          </div>
        </div>
      </Dialog>
      
      <!-- Dialog pour modifier la remarque Signature -->
      <Dialog header="Modifier la Remarque Signature" v-model:visible="displaySignatureRemarkDialog" modal>
        <div class="remark-dialog">
          <textarea v-model="editedSignatureRemark" rows="5" style="width:100%;" placeholder="Saisir la remarque signature ici..."></textarea>
          <div class="dialog-buttons" style="margin-top:1em; text-align:right;">
            <Button label="Annuler" class="p-button-text" @click="cancelSignatureRemarkEdit" />
            <Button label="Confirmer" class="p-button-success" @click="confirmSignatureRemarkUpdate" />
          </div>
        </div>
      </Dialog>
      
    </div>
  </template>
  
  <script>
  import { ref, reactive, computed, onMounted } from 'vue';
  import { ref as firebaseRef, onValue, update, set } from "firebase/database";
  import Navbar from '@/components/Utils/Navbar.vue';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Dialog from 'primevue/dialog';
  import Button from 'primevue/button';
  import Dropdown from 'primevue/dropdown';
  import { db } from 'root/firebase';
  
  export default {
    name: 'ManagementPFPEnCours',
    components: {
      Navbar,
      DataTable,
      Column,
      Dialog,
      Button,
      Dropdown
    },
    setup() {
      // Références pour récupérer les données nécessaires depuis Firebase
      const signatureAssignmentsData = ref({}); // données de "signatureAssignments"
      const placesData = ref({});
      const institutions = ref({});
      const users = ref({});
      const students = ref({});
      const praticienFormateurs = ref({});
      const teachers = ref({});
      
      // Objets réactifs pour la gestion des dropdowns
      const lieuSignatureOverrides = reactive({});
      const signatureInChargeOverrides = reactive({});
      // Objet réactif pour stocker la remarque Signature
      const signatureRemarks = reactive({});
      
      // Options pour le dropdown "Lieu signature"
      const signatureOptions = [
        { label: 'présence', value: 'présence' },
        { label: 'distance', value: 'distance' }
      ];
      const firstOption = signatureOptions[0].value;
      const secondOption = signatureOptions[1].value;
      
      // Dialog pour la Remarque Étudiant
      const displayRemarkDialog = ref(false);
      const selectedAssignment = ref(null);
      const editedRemarks = ref("");
      
      const openRemarkDialog = (data) => {
        selectedAssignment.value = data;
        editedRemarks.value = data.remarqueEtudiant || "";
        displayRemarkDialog.value = true;
      };
      
      const cancelRemarkEdit = () => {
        displayRemarkDialog.value = false;
        selectedAssignment.value = null;
        editedRemarks.value = "";
      };
      
      const confirmRemarkUpdate = () => {
        const studentRef = firebaseRef(db, `Users/${selectedAssignment.value.idEtudiant}`);
        update(studentRef, { StudentNote: editedRemarks.value })
          .then(() => console.log("StudentNote mise à jour"))
          .catch(err => console.error("Erreur lors de la mise à jour du StudentNote :", err));
        displayRemarkDialog.value = false;
        selectedAssignment.value = null;
        editedRemarks.value = "";
      };
      
      // Dialog pour la Remarque Signature
      const displaySignatureRemarkDialog = ref(false);
      const selectedSignatureAssignment = ref(null);
      const editedSignatureRemark = ref("");
      
      const openSignatureRemarkDialog = (data) => {
        selectedSignatureAssignment.value = data;
        editedSignatureRemark.value = signatureRemarks[data._key] || "";
        displaySignatureRemarkDialog.value = true;
      };
      
      const cancelSignatureRemarkEdit = () => {
        displaySignatureRemarkDialog.value = false;
        selectedSignatureAssignment.value = null;
        editedSignatureRemark.value = "";
      };
      
      const confirmSignatureRemarkUpdate = () => {
        const key = selectedSignatureAssignment.value._key;
        const sigAssignRef = firebaseRef(db, `signatureAssignments/${key}`);
        update(sigAssignRef, { remarqueSignature: editedSignatureRemark.value })
          .then(() => {
            signatureRemarks[key] = editedSignatureRemark.value;
            console.log("remarqueSignature mise à jour pour", key);
          })
          .catch(err => console.error("Erreur lors de la mise à jour de remarqueSignature :", err));
        displaySignatureRemarkDialog.value = false;
        selectedSignatureAssignment.value = null;
        editedSignatureRemark.value = "";
      };
      
      // Récupération des enseignants
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
      
      // Autres fetch depuis Firebase
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
      
      const fetchPraticienFormateurs = () => {
        const practRef = firebaseRef(db, 'PraticienFormateurs');
        onValue(practRef, snapshot => {
          praticienFormateurs.value = snapshot.val() || {};
        });
      };
      
      // Récupération des affectations de signature depuis Firebase
      // On peuple à la fois signatureAssignmentsData mais aussi les overrides et la remarque signature
      const fetchSignatureAssignments = () => {
        const sigAssignRef = firebaseRef(db, 'signatureAssignments');
        onValue(sigAssignRef, snapshot => {
          const sigData = snapshot.val() || {};
          signatureAssignmentsData.value = sigData;
          Object.keys(sigData).forEach(key => {
            const record = sigData[key];
            if (record.lieuSignature) {
              lieuSignatureOverrides[key] = record.lieuSignature;
            }
            if (record.teacherKey) {
              signatureInChargeOverrides[key] = record.teacherKey;
            } else if (record.enChargeDeLaSignature) {
              const opt = teachersOptions.value.find(opt => opt.label === record.enChargeDeLaSignature);
              signatureInChargeOverrides[key] = opt ? opt.value : "";
            }
            // Récupération de la remarque signature
            signatureRemarks[key] = record.remarqueSignature || "";
          });
        });
      };
      
      // Computed qui enrichit chaque affectation de signature avec les données supplémentaires
      const managementAssignments = computed(() => {
        const sigAssigns = signatureAssignmentsData.value || {};
        const assignmentsArray = [];
        Object.keys(sigAssigns).forEach(key => {
          const record = sigAssigns[key];
          // Récupération des données associées
          const place = placesData.value[record.idPlace] || {};
          const institution = (place.IDPlace && institutions.value[place.IDPlace]) ? institutions.value[place.IDPlace] : {};
          const student = students.value[record.idEtudiant] || {};
          const userObj = users.value[record.idEtudiant] || {};
          // Calcul des critères validés à partir du Place
          const criteriaKeys = ["AIGU", "AMBU", "DE", "FR", "REHAB", "MSQ", "NEUROGER"];
          const validCriteria = criteriaKeys.filter(k => {
            const val = place[k];
            return val === true || (typeof val === "string" && val.toLowerCase() === "true");
          });
          // Pour Vote Rank et Seat, on peut utiliser des valeurs par défaut (puisque non enregistrées dans le record)
          const voteRank = record.voteRank || "non voté";
          const seat = record.seat || "";
          // Récupération des informations du praticien formateur depuis le Place
          let praticienFormateurKey = "";
          if (Array.isArray(place.praticiensFormateurs)) {
            if (place.praticiensFormateurs.length === 1) {
              praticienFormateurKey = place.praticiensFormateurs[0];
            } else {
              praticienFormateurKey = place.praticiensFormateurs[0] || "";
            }
          }
          const pract = praticienFormateurs.value[praticienFormateurKey] || {};
    
          assignmentsArray.push({
            _key: key,
            idPlace: record.idPlace,
            NomPlace: place.NomPlace || "",
            idInstitution: place.IDPlace || "",
            institutionName: institution.Name || "non défini",
            idEtudiant: record.idEtudiant,
            nom: userObj.Nom || student.Nom || "",
            prenom: userObj.Prenom || student.Prenom || "",
            repondantHES: student.RepondantHES || "",
            voteRank,
            category: institution.Category || "non défini",
            canton: institution.Canton || "non défini",
            locality: institution.Locality || "non défini",
            validCriteria: validCriteria.join(", "),
            seat,
            praticienPrenom: pract.Prenom || "",
            praticienNom: pract.Nom || "",
            praticienMail: pract.Mail || "",
            lieuSignature: record.lieuSignature || firstOption,
            enChargeDeLaSignature: record.enChargeDeLaSignature || "",
            remarqueEtudiant: userObj.StudentNote || student.StudentNote || "",
            remarquesPlaces: place.Remarques || "",
            remarqueSignature: record.remarqueSignature || ""
          });
        });
        return assignmentsArray;
      });
      
      // Gestion du dropdown "Lieu signature" global (pour basculer sur toutes les lignes)
      const globalLastValue = computed(() => {
        if (managementAssignments.value.length > 0) {
          const firstKey = managementAssignments.value[0]._key;
          return lieuSignatureOverrides[firstKey] || firstOption;
        }
        return firstOption;
      });
      
      const toggleButtonLabel = computed(() => {
        return globalLastValue.value === firstOption ? `Tout passer en ${secondOption}` : `Tout passer en ${firstOption}`;
      });
      
      const toggleLieuSignature = () => {
        const newValue = globalLastValue.value === firstOption ? secondOption : firstOption;
        managementAssignments.value.forEach(assignment => {
          lieuSignatureOverrides[assignment._key] = newValue;
          updateSignatureAssignment(assignment._key);
        });
      };
      
      // Mise à jour de l'enregistrement de signature dans Firebase pour un enregistrement donné
      const updateSignatureAssignment = (key) => {
        const assignment = managementAssignments.value.find(a => a._key === key);
        if (!assignment) {
          console.error('Affectation non trouvée pour la clé', key);
          return;
        }
        const teacherOpt = teachersOptions.value.find(opt => opt.value === signatureInChargeOverrides[key]);
        const record = {
          assignmentId: key,
          idPlace: assignment.idPlace,
          idEtudiant: assignment.idEtudiant,
          lieuSignature: lieuSignatureOverrides[key] || firstOption,
          teacherKey: signatureInChargeOverrides[key] || "",
          enChargeDeLaSignature: teacherOpt ? teacherOpt.label : "",
          remarqueSignature: signatureRemarks[key] || ""
        };
        update(firebaseRef(db, 'signatureAssignments/' + key), record)
          .then(() => {
            console.log('Mise à jour live réussie pour', key);
          })
          .catch(err => {
            console.error("Erreur lors de la mise à jour live de signatureAssignments:", err);
          });
      };
      
      // Méthode pour exporter les données du tableau au format CSV
      const exportCSV = () => {
        const data = managementAssignments.value.map(assignment => {
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
          "praticienPrenom",
          "praticienNom",
          "praticienMail",
          "validCriteria",
          "lieuSignature",
          "enChargeDeLaSignature",
          "remarqueEtudiant",
          "remarquesPlaces",
          "remarqueSignature"
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
        link.setAttribute("download", "management_pfp_en_cours.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      // Méthode pour sauvegarder les mises à jour (mise à jour pour chaque enregistrement)
      const saveSignatureAssignments = () => {
        managementAssignments.value.forEach(assignment => {
          updateSignatureAssignment(assignment._key);
        });
        alert('Les affectations ont été enregistrées avec succès');
      };
      
      onMounted(() => {
        fetchInstitutions();
        fetchPlaces();
        fetchUsers();
        fetchStudents();
        fetchPraticienFormateurs();
        fetchTeachers();
        fetchSignatureAssignments();
      });
      
      return {
        managementAssignments,
        lieuSignatureOverrides,
        signatureOptions,
        firstOption,
        secondOption,
        toggleButtonLabel,
        toggleLieuSignature,
        exportCSV,
        teachersOptions,
        signatureInChargeOverrides,
        saveSignatureAssignments,
        updateSignatureAssignment,
        // Dialog de remarque étudiant
        displayRemarkDialog,
        selectedAssignment,
        editedRemarks,
        openRemarkDialog,
        cancelRemarkEdit,
        confirmRemarkUpdate,
        // Dialog de remarque signature
        signatureRemarks,
        displaySignatureRemarkDialog,
        selectedSignatureAssignment,
        editedSignatureRemark,
        openSignatureRemarkDialog,
        cancelSignatureRemarkEdit,
        confirmSignatureRemarkUpdate
      };
    }
  };
  </script>
  
  <style scoped>
  h1, h2 {
    text-align: center;
    margin: 20px 0;
  }
  .remark-dialog textarea {
    resize: vertical;
  }
  </style>
  