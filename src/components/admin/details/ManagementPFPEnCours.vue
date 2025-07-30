<template>
  <div>
    <Navbar />
    <h1>Management PFP En Cours</h1>

    <!-- Tableau récapitulatif enrichi -->
    <div class="scroll-table-container compact-table">
      <DataTable
        :value="managementAssignments"
        responsiveLayout="scroll"
        :paginator="true"
        :rows="10"
        class="p-datatable-sm"
      >
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
      <Button label="Enregistrer Seats" @click="saveSeats" style="margin-right: 10px;" />
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
import { ref as firebaseRef, onValue, update } from "firebase/database";
import Navbar from '@/components/common/utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import { db } from 'root/firebase';
import { EffectComposer } from 'three-stdlib';

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
    // Références aux données Firebase
    const signatureAssignmentsData = ref({});
    const placesData = ref({});
    const institutions = ref({});
    const users = ref({});
    const students = ref({});
    const pfInfos = ref({}); // Infos du PF (Praticien Formateur)
    const teachers = ref({});
    const praticienFormateurs = ref({});

    const fetchPraticienFormateurs = () => {
      const practRef = firebaseRef(db, 'PraticienFormateurs');
      onValue(practRef, snapshot => {
        praticienFormateurs.value = snapshot.val() || {};
      });
    };

    // Objets réactifs pour les dropdowns et remarques
    const lieuSignatureOverrides = reactive({});
    const signatureInChargeOverrides = reactive({});
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

    // Récupération d'autres données depuis Firebase
    const fetchInstitutions = () => {
      const instRef = firebaseRef(db, 'institutions');
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

    // Fonction dédiée pour récupérer les infos du PF (Praticien Formateur)
    const fetchPFInfos = () => {
      const pfRef = firebaseRef(db, 'PraticienFormateurs');
      onValue(pfRef, snapshot => {
        pfInfos.value = snapshot.val() || {};
      });
    };

    // Récupération des affectations de signature
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
          signatureRemarks[key] = record.remarqueSignature || "";
        });
      });
    };

    // Computed qui enrichit chaque affectation avec les données supplémentaires, y compris les infos PF
    const managementAssignments = computed(() => {
      const sigAssigns = signatureAssignmentsData.value || {};
      const assignmentsArray = [];
      // Création d'une map pour suivre le nombre de sièges affectés par place
      const seatsMap = {};

      Object.keys(sigAssigns).forEach(key => {
        const record = sigAssigns[key];
        const place = placesData.value[record.idPlace] || {};
        const idInstitution = place.IDPlace || place.InstitutionId;
        const institution = (idInstitution && institutions.value[idInstitution])
          ? institutions.value[idInstitution]
          : {};
        const student = students.value[record.idEtudiant] || {};
        const userObj = users.value[record.idEtudiant] || {};

        // Calcul des critères validés
        const criteriaKeys = ["AIGU", "AMBU", "DE", "FR", "REHAB", "MSQ", "NEUROGER"];
        const validCriteria = criteriaKeys.filter(k => {
          const val = place[k];
          return val === true || (typeof val === "string" && val.toLowerCase() === "true");
        });
        const voteRank = record.voteRank || "non voté";

        // --- Calcul dynamique du numéro de siège ---
        // On vérifie dans seatsMap si des affectations existent déjà pour cette place.
        let seat;
        if (!seatsMap[record.idPlace]) {
          // Première affectation pour cette place, on commence avec 1.
          seatsMap[record.idPlace] = 1;
          seat = 1;
        } else {
          // Incrémentez le compteur pour cette place.
          seatsMap[record.idPlace] += 1;
          seat = seatsMap[record.idPlace];
        }

        // --- Calcul de la clé du praticien formateur ---
        let praticienFormateur = "";
        if (Array.isArray(place.praticiensFormateurs)) {
          if (place.praticiensFormateurs.length === 1) {
            praticienFormateur = place.praticiensFormateurs[0];
          } else {
            // Utilisation du numéro de siège pour sélectionner le praticien
            praticienFormateur =
              place["selectedPraticienBA22PFP4-" + seat] ||
              place["selectedPraticiensBA22PFP4-" + seat] ||
              "";
          }
        }
        const pract = praticienFormateurs.value[praticienFormateur] || {};

        assignmentsArray.push({
          _key: key,
          idPlace: record.idPlace,
          NomPlace: place.NomPlace || "",
          idInstitution: idInstitution || "",
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
          seat,  // Numéro de siège calculé dynamiquement
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

    // Gestion du dropdown "Lieu signature" global
    const globalLastValue = computed(() => {
      if (managementAssignments.value.length > 0) {
        const firstKey = managementAssignments.value[0]._key;
        return lieuSignatureOverrides[firstKey] || firstOption;
      }
      return firstOption;
    });

    const toggleButtonLabel = computed(() => {
      return globalLastValue.value === firstOption
        ? `Tout passer en ${secondOption}`
        : `Tout passer en ${firstOption}`;
    });

    const toggleLieuSignature = () => {
      const newValue = globalLastValue.value === firstOption ? secondOption : firstOption;
      managementAssignments.value.forEach(assignment => {
        lieuSignatureOverrides[assignment._key] = newValue;
        updateSignatureAssignment(assignment._key);
      });
    };

    // Mise à jour d'une affectation de signature dans Firebase avec prise en compte du praticien formateur
    const updateSignatureAssignment = (key) => {
      // Récupération de l'affectation correspondante dans la liste calculée
      const assignment = managementAssignments.value.find(a => a._key === key);
      if (!assignment) {
        console.error('Affectation non trouvée pour la clé', key);
        return;
      }

      // Récupération de l'option enseignant choisi
      const teacherOpt = teachersOptions.value.find(
        opt => opt.value === signatureInChargeOverrides[key]
      );

      // Récupération de la place associée à l'affectation
      const place = placesData.value[assignment.idPlace] || {};

      // Calcul du nouvel ID du praticien formateur en se basant sur la logique de la ligne :
      // S'il n'y a qu'un praticien formateur, on le prend directement,
      // sinon, on utilise le numéro de siège pour choisir le praticien via des clés dynamiques.
      let newPractitionerKey = "";
      if (Array.isArray(place.praticiensFormateurs)) {
        if (place.praticiensFormateurs.length === 1) {
          newPractitionerKey = place.praticiensFormateurs[0];
        } else {
          newPractitionerKey =
            place["selectedPraticienBA22PFP4-" + assignment.seat] ||
            place["selectedPraticiensBA22PFP4-" + assignment.seat] ||
            "";
        }
      }

      // Construction de l'objet de mise à jour : on conserve la nouvelle clé
      // et on force la suppression (mise à null) des anciens champs du praticien.
      const record = {
        assignmentId: key,
        idPlace: assignment.idPlace,
        idEtudiant: assignment.idEtudiant,
        lieuSignature: lieuSignatureOverrides[key] || firstOption,
        teacherKey: signatureInChargeOverrides[key] || "",
        enChargeDeLaSignature: teacherOpt ? teacherOpt.label : "",
        remarqueSignature: signatureRemarks[key] || "",
        praticienFormateurKey: newPractitionerKey,
        // Suppression des anciens champs liés au praticien
        praticienFormateur: null,
        praticienPrenom: null,
        praticienNom: null,
        praticienMail: null
      };

      update(firebaseRef(db, 'signatureAssignments/' + key), record)
        .then(() => {
          console.log('Mise à jour live réussie pour', key);
        })
        .catch(err => {
          console.error("Erreur lors de la mise à jour live de signatureAssignments:", err);
        });
    };

    // Nouveau bouton : sauvegarde uniquement du numéro de siège (seat) dans Firebase pour chaque affectation
    const saveSeats = () => {
      managementAssignments.value.forEach(assignment => {
        const record = { seat: assignment.seat };
        update(firebaseRef(db, 'signatureAssignments/' + assignment._key), record)
          .then(() => {
            console.log('Seat mis à jour pour', assignment._key);
          })
          .catch(err => console.error('Erreur lors de la mise à jour du seat pour', assignment._key, err));
      });
      alert('Les sièges ont été enregistrés avec succès');
    };

    // Sauvegarde groupée des mises à jour (incluant les mises à jour du lieu, de l’enseignant, et du praticien formateur)
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
      fetchPFInfos(); // Récupération des infos du PF
      fetchTeachers();
      fetchPraticienFormateurs();  // Chargement des praticiens formateurs
      fetchSignatureAssignments();
    });

    return {
      managementAssignments,
      praticienFormateurs,
      lieuSignatureOverrides,
      signatureOptions,
      firstOption,
      secondOption,
      toggleButtonLabel,
      toggleLieuSignature,
      teachersOptions,
      signatureInChargeOverrides,
      saveSignatureAssignments,
      updateSignatureAssignment,
      // Nouveau bouton pour sauvegarder les seat
      saveSeats,
      // Dialog Remarque Étudiant
      displayRemarkDialog,
      selectedAssignment,
      editedRemarks,
      openRemarkDialog,
      cancelRemarkEdit,
      confirmRemarkUpdate,
      // Dialog Remarque Signature
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
.scroll-table-container {
  padding: 20px;
  height: calc(100vh - 120px); /* Ajuste 120px si besoin selon la hauteur réelle de ta navbar + titre */
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-table-container::-webkit-scrollbar {
  display: none;
}
.compact-table .p-datatable {
  font-size: 0.92em;
}
.compact-table .p-datatable th,
.compact-table .p-datatable td {
  padding: 0.35em 0.5em;
}
@media (max-width: 900px) {
  .scroll-table-container {
    padding: 6px;
  }
  .compact-table .p-datatable {
    font-size: 0.85em;
  }
  .compact-table .p-datatable th,
  .compact-table .p-datatable td {
    padding: 0.2em 0.3em;
  }
}
</style>
