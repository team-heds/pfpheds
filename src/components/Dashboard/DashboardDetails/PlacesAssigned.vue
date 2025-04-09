<template>
  <div>
    <Navbar />
    <h1>Places assignées</h1>
    
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
              @change="updateSignatureAssignment(data._key)"
            />
          </template>
        </Column>
        
        <!-- Colonne pour En charge de la signature -->
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
        
        <!-- Colonne pour Remarque étudiant -->
        <Column header="Remarque étudiant">
          <template #body="slotProps">
            <span>{{ slotProps.data.remarqueEtudiant || 'Aucune' }}</span>
            <Button icon="pi pi-pencil" class="p-button-text" @click="openRemarkDialog(slotProps.data)" />
          </template>
        </Column>
        
        <!-- Colonne pour Remarques places -->
        <Column header="Remarques places">
          <template #body="slotProps">
            <span>{{ slotProps.data.remarquesPlaces || 'Aucune' }}</span>
          </template>
        </Column>
        
        <!-- Colonne pour Remarque Signature -->
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
      <Button :label="toggleButtonLabel" @click="toggleLieuSignature" />
      <Button label="Exporter CSV" @click="exportCSV" style="margin-left: 10px;" />
      <Button label="Copier Répondant HES" @click="copyRepondantHesToSignature" style="margin-left: 10px;" />
      <Button label="Valider" @click="saveSignatureAssignments" style="margin-left: 10px;" />
    </div>
    
    <!-- Dialog pour StudentNote -->
    <Dialog header="Modifier le StudentNote de l'étudiant" v-model:visible="displayRemarkDialog" modal>
      <div class="remark-dialog">
        <textarea v-model="editedRemarks" rows="5" style="width:100%;" placeholder="Saisir vos remarques ici..."></textarea>
        <div class="dialog-buttons" style="margin-top:1em; text-align:right;">
          <Button label="Annuler" class="p-button-text" @click="cancelRemarkEdit" />
          <Button label="Confirmer" class="p-button-success" @click="confirmRemarkUpdate" />
        </div>
      </div>
    </Dialog>
    
    <!-- Dialog pour Remarque Signature -->
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
  name: 'PlacesAssigneds',
  components: {
    Navbar,
    DataTable,
    Column,
    Dialog,
    Button,
    Dropdown
  },
  setup() {
    // Références pour charger les données Firebase
    const placesData = ref({});
    const users = ref({});
    const institutions = ref({});
    const resultAlgo = ref({});
    const praticienFormateurs = ref({});
    const students = ref({});
    const teachers = ref({});

    // Objets réactifs pour gérer les Dropdowns et les remarques
    const lieuSignatureOverrides = reactive({});
    const signatureInChargeOverrides = reactive({});
    const signatureRemarks = reactive({}); // Stockage de la remarque signature

    // Options pour le dropdown "Lieu signature" avec trois choix
    const signatureOptions = [
      { label: 'présence', value: 'présence' },
      { label: 'distance', value: 'distance' },
      { label: 'étudiant', value: 'etudiant' }
    ];
    const firstOption = signatureOptions[0].value; // "présence"
    
    // Gestion de la remarque étudiant
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
        .then(() => {
          console.log("StudentNote mise à jour");
        })
        .catch(err => console.error("Erreur lors de la mise à jour du StudentNote :", err));
      displayRemarkDialog.value = false;
      selectedAssignment.value = null;
      editedRemarks.value = "";
    };

    // Gestion de la remarque signature
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

    // Récupération d'autres données
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

    // Récupération des affectations de signature depuis Firebase
    const fetchSignatureAssignments = () => {
      const sigAssignRef = firebaseRef(db, 'signatureAssignments');
      onValue(sigAssignRef, snapshot => {
        const sigData = snapshot.val() || {};
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
          signatureRemarks[key] = record.remarqueSignature || "";
        });
      });
    };

    // Calcul des affectations finales enrichies (ajout de repondHESID depuis '/Students')
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
        const idInstitution = place.IDPlace || place.InstitutionId;
        const inst = (idInstitution && institutions.value[idInstitution])
          ? institutions.value[idInstitution] : {};
        const student = students.value[assignment.idEtudiant] || {}; // données de '/Students'
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
            praticienFormateur =
              place["selectedPraticienBA22PFP4-" + seatNum] ||
              place["selectedPraticiensBA22PFP4-" + seatNum] || "";
          }
        }
        const pract = praticienFormateurs.value[praticienFormateur] || {};

        // Clé unique pour chaque ligne
        const key = assignment.idPlace + '_' + assignment.idEtudiant;
        if (!(key in lieuSignatureOverrides)) {
          lieuSignatureOverrides[key] = firstOption;
        }
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
          repondHESID: student.repondHESID || "",
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
          validCriteria: validCriteria.join(", "),
          remarqueEtudiant: userObj.StudentNote || student.StudentNote || "",
          remarquesPlaces: place.Remarques || "",
          remarqueSignature: signatureRemarks[key] || ""
        };
      });
    });

    // Valeur globale du dropdown "Lieu signature" pour le premier élément
    const globalLastValue = computed(() => {
      if (finalAssignments.value.length > 0) {
        const firstKey = finalAssignments.value[0]._key;
        return lieuSignatureOverrides[firstKey] || firstOption;
      }
      return firstOption;
    });

    // Calcul de la prochaine option dans le cycle (présence -> distance -> étudiant -> présence)
    const nextSignatureOption = computed(() => {
      const current = globalLastValue.value;
      if (current === 'présence') {
        return 'distance';
      } else if (current === 'distance') {
        return 'etudiant';
      } else {
        return 'présence';
      }
    });

    // Libellé du bouton de bascule
    const toggleButtonLabel = computed(() => {
      return `Tout passer en ${nextSignatureOption.value}`;
    });

    // Fonction de bascule adaptée au cycle à trois valeurs
    const toggleLieuSignature = () => {
      const newValue = nextSignatureOption.value;
      finalAssignments.value.forEach(assignment => {
        lieuSignatureOverrides[assignment._key] = newValue;
        updateSignatureAssignment(assignment._key);
      });
    };

    // Mise à jour live dans Firebase pour une affectation donnée
 // Mise à jour live dans Firebase pour une affectation donnée avec ajout du praticien formateur
const updateSignatureAssignment = (key) => {
  const assignment = finalAssignments.value.find(a => a._key === key);
  if (!assignment) {
    console.error('Affectation non trouvée pour la clé', key);
    return;
  }
  const teacherValue = signatureInChargeOverrides[key] || "";
  const teacherOpt = teachersOptions.value.find(opt => opt.value === teacherValue);
  
  // On ajoute la donnée du praticien formateur ici
  const record = {
    assignmentId: key,
    idPlace: assignment.idPlace,
    idEtudiant: assignment.idEtudiant,
    lieuSignature: lieuSignatureOverrides[key] || firstOption,
    teacherKey: teacherValue,
    enChargeDeLaSignature: teacherOpt ? teacherOpt.label : teacherValue,
    remarqueSignature: signatureRemarks[key] || "",
    praticienFormateur: assignment.praticienFormateur || ""
  };

  update(firebaseRef(db, 'signatureAssignments/' + key), record)
    .then(() => {
      console.log('Mise à jour live réussie pour', key);
    })
    .catch(err => {
      console.error("Erreur lors de la mise à jour live de signatureAssignments:", err);
    });
};

    // Copie le repondHESID dans signatureInChargeOverrides pour chaque assignation
    const copyRepondantHesToSignature = () => {
      finalAssignments.value.forEach(assignment => {
        signatureInChargeOverrides[assignment._key] = assignment.repondHESID || "";
        updateSignatureAssignment(assignment._key);
      });
      alert("Les ID du répondant HES ont été copiés dans la colonne 'En charge de la signature' et mis à jour dans Firebase !");
    };

    // Export CSV
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

    // Sauvegarde groupée des affectations
    const saveSignatureAssignments = () => {
      finalAssignments.value.forEach(assignment => {
        updateSignatureAssignment(assignment._key);
      });
      alert('Les affectations de signature ont été enregistrées avec succès');
    };

    // Chargement initial de toutes les données
    onMounted(() => {
      fetchInstitutions();
      fetchPlaces();
      fetchUsers();
      fetchStudents();
      fetchResultAlgo();
      fetchPraticienFormateurs();
      fetchTeachers();
      fetchSignatureAssignments();
    });

    return {
      lieuSignatureOverrides,
      signatureOptions,
      firstOption,
      finalAssignments,
      toggleButtonLabel,
      toggleLieuSignature,
      exportCSV,
      teachersOptions,
      signatureInChargeOverrides,
      saveSignatureAssignments,
      updateSignatureAssignment,
      copyRepondantHesToSignature,
      // Dialogs et fonctions pour les remarques
      displayRemarkDialog,
      selectedAssignment,
      editedRemarks,
      openRemarkDialog,
      cancelRemarkEdit,
      confirmRemarkUpdate,
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
