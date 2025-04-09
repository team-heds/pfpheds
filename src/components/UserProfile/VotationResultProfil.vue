<template>
  <div class="pfp-en-cours">
    <!-- Section Formation pratique en cours -->
    <h5 class="mb-4">Formation pratique en cours</h5>
    <div v-if="assignments.length">
      <div class="grid">
        <div
          v-for="(assignment, index) in assignments"
          :key="assignment._key"
          class="surface-card shadow-2 border-round mb-3 p-3 flex flex-column gap-2"
          style="min-height: 200px;"
        >
          <!-- En-tête de la carte avec titre et bouton -->
          <div class="flex align-items-center">
            <h4 class="m-0">
              Formation Pratique en cours
            </h4>
            <div class="flex align-items-center m-2">
              <Button
                label="Voir les détails"
                icon="pi pi-arrow-right"
                class="text-sm p-button-outlined p-button-primary"
                @click="viewAssignmentDetails(assignment)"
              />
            </div>
          </div>

          <!-- Bloc d'informations de l'affectation -->
          <div>
            <h6 class="m-2 font-bold">
              {{ assignment.institutionName }}
            </h6>
            <p class="m-2">
              Domaine : {{ assignment.NomPlace }} | Critères validités : {{ assignment.validCriteria }}
            </p>
            <p class="m-2">
              Praticien Formateur : {{ assignment.praticienNom }} {{ assignment.praticienPrenom }} |
              <a :href="'mailto:' + assignment.praticienMail" style="color: var(--text-primary); text-decoration: underline;">
                {{ assignment.praticienMail }}
              </a>
            </p>
          </div>

          <!-- Bloc Documents liés -->
          <div>
            <h6 class="m-2">Documents liés à cette formation pratique</h6>
            <div
              v-if="upload[assignment._key] && upload[assignment._key].length > 0"
              class="mt-2"
            >
              <ul class="list-none p-0 m-2">
                <li
                  v-for="(doc, docIndex) in upload[assignment._key]"
                  :key="doc.docId"
                  class="flex align-items-center justify-content-between mb-2 gap-2"
                >
                  <!-- Affichage du nom du document avec clic pour l'ouvrir -->
                  <span
                    style="cursor: pointer; text-decoration: underline;"
                    @click="openDocument(doc.documentURL)"
                    title="Cliquez pour ouvrir ce document"
                  >
                    {{ doc.fileName }}
                  </span>
                  <!-- Boutons pour renommage et suppression -->
                  <div v-if="doc.isRenaming" class="flex align-items-center gap-2">
                    <input type="text" v-model="doc.tempName" style="width:200px;" />
                    <Button
                      label="Enregistrer"
                      class="text-sm p-button-success"
                      @click="saveDocName(assignment._key, doc)"
                    />
                    <Button
                      label="Annuler"
                      class="text-sm p-button-secondary"
                      @click="cancelRename(doc)"
                    />
                  </div>
                  <div v-else class="flex align-items-center gap-2">
                    <Button
                      icon="pi pi-trash"
                      class="text-sm p-button-danger"
                      @click="confirmDelete(assignment._key, doc.docId, doc.fileName)"
                    />
                  </div>
                </li>
              </ul>
            </div>
            <div v-else class="m-2">
              <p class="text-secondary">Aucun document pour cette formation.</p>
            </div>
          </div>

          <!-- Sélection et upload de nouveaux fichiers -->
          <div class="flex justify-content-end align-items-center gap-8 w-4 m-2">
            <FileUpload
              mode="basic"
              customUpload
              multiple
              chooseLabel="Sélectionner"
              @select="($event) => handleFileSelection($event, assignment._key)"
            />
            <Button
              label="Envoyer documents"
              class="text-sm p-button-outlined p-button-primary"
              @click="uploadDocuments(assignment._key)"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <p>Aucune affectation PFP disponible pour cet utilisateur.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ref as firebaseRef, onValue, get } from 'firebase/database';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import { db, storage } from 'root/firebase';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

const props = defineProps({
  userId: { type: String, required: true }
});

const router = useRouter();

/* ---------------------------
   Chargement des données de votation
--------------------------- */
const votationData = ref({});
const fetchVotationData = async () => {
  try {
    const votationRef = firebaseRef(db, 'VotationResult');
    const snapshot = await get(votationRef);
    if (snapshot.exists()) {
      votationData.value = snapshot.val();
    } else {
      console.error("Aucune donnée de votation disponible.");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données de votation :", error);
  }
};
onMounted(() => {
  fetchVotationData();
});
const filteredVotationData = computed(() => {
  const result = {};
  const uid = props.userId;
  if (!votationData.value) return result;
  for (const groupKey in votationData.value) {
    const group = votationData.value[groupKey];
    const newGroup = {};
    for (const subKey in group) {
      const filteredArray = group[subKey].filter(item => item.studentId === uid);
      if (filteredArray.length > 0) {
        newGroup[subKey] = filteredArray;
      }
    }
    if (Object.keys(newGroup).length > 0) {
      result[groupKey] = newGroup;
    }
  }
  return result;
});
const hasVotationData = computed(() => Object.keys(filteredVotationData.value).length > 0);

/* ---------------------------
   Chargement des affectations PFP et autres données associées
--------------------------- */
const assignmentsData = ref({});
const placesData = ref({});
const institutions = ref({});
const users = ref({});
const students = ref({});
const praticienFormateurs = ref({});

const fetchAssignmentsData = () => {
  const assignRef = firebaseRef(db, 'signatureAssignments');
  onValue(assignRef, snapshot => {
    assignmentsData.value = snapshot.val() || {};
  });
};
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

const assignments = computed(() => {
  const data = assignmentsData.value || {};
  const result = [];
  Object.keys(data).forEach(key => {
    const record = data[key];
    if (record.idEtudiant === props.userId) {
      const place = placesData.value[record.idPlace] || {};
      const institution =
        (place.IDPlace && institutions.value[place.IDPlace])
          ? institutions.value[place.IDPlace]
          : {};
      const student = students.value[record.idEtudiant] || {};
      const userObj = users.value[record.idEtudiant] || {};
      const criteriaKeys = ["AIGU", "AMBU", "DE", "FR", "REHAB", "MSQ", "NEUROGER"];
      const validCriteria = criteriaKeys.filter(k => {
        const val = place[k];
        return val === true || (typeof val === "string" && val.toLowerCase() === "true");
      });
      const voteRank = record.voteRank || "non voté";
      const seat = record.seat || "";
      let praticienFormateurKey = "";
      if (Array.isArray(place.praticiensFormateurs)) {
        praticienFormateurKey = place.praticiensFormateurs[0] || "";
      }
      const pract = praticienFormateurs.value[praticienFormateurKey] || {};
      result.push({
        _key: key,
        idPlace: record.idPlace,
        NomPlace: place.NomPlace || "",
        idInstitution: place.IDPlace || place.InstitutionId || "",
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
        praticienMail: pract.Mail || ""
      });
    }
  });
  return result;
});

/* ---------------------------
   Gestion des documents pour chaque affectation
--------------------------- */
const upload = ref({});

const handleFileSelection = (event, assignmentKey) => {
  if (!upload.value[assignmentKey]) {
    upload.value[assignmentKey] = [];
  }
  const selectedFiles = Array.from(event.files || event.target.files);
  selectedFiles.forEach(file => {
    const docId = Date.now().toString() + "_" + file.name;
    // Création d'un objet document temporaire
    const doc = {
      docId,
      fileName: file.name,
      tempName: file.name,
      file, // conserver le fichier pour l'upload
      isRenaming: false,
      documentURL: ''
    };
    upload.value[assignmentKey].push(doc);
  });
};

const uploadDocuments = async (assignmentKey) => {
  if (!upload.value[assignmentKey] || upload.value[assignmentKey].length === 0) {
    alert("Aucun nouveau fichier sélectionné.");
    return;
  }
  const docsArray = upload.value[assignmentKey];
  const updatedDocs = [];
  for (const doc of docsArray) {
    try {
      const fileRef = storageRef(storage, `documents/${assignmentKey}/${doc.docId}`);
      await uploadBytes(fileRef, doc.file);
      const downloadURL = await getDownloadURL(fileRef);
      doc.documentURL = downloadURL;
      updatedDocs.push(doc);
    } catch (error) {
      console.error("Erreur d'upload pour le fichier", doc.fileName, error);
    }
  }
  // Une fois uploadés, mise à jour de la liste des documents
  upload.value[assignmentKey] = updatedDocs;
};

const openDocument = (url) => {
  if (url) {
    window.open(url, "_blank");
  }
};

const saveDocName = async (assignmentKey, doc) => {
  if (!doc.tempName) {
    alert("Le nom du fichier ne peut être vide.");
    return;
  }
  doc.fileName = doc.tempName;
  doc.isRenaming = false;
  // Ici, mettez à jour la BDD si nécessaire
};

const cancelRename = (doc) => {
  doc.isRenaming = false;
  doc.tempName = doc.fileName;
};

const confirmDelete = async (assignmentKey, docId, fileName) => {
  const confirmation = window.confirm(`Supprimer le document « ${fileName} » ?`);
  if (!confirmation) return;
  if (!upload.value[assignmentKey]) return;
  const docsArray = upload.value[assignmentKey];
  const docToRemove = docsArray.find(doc => doc.docId === docId);
  if (!docToRemove) return;
  const fileRef = storageRef(storage, `documents/${assignmentKey}/${docId}`);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Erreur lors de la suppression du document avec docId =", docId, error);
  }
  upload.value[assignmentKey] = docsArray.filter(doc => doc.docId !== docId);
};

/* ---------------------------
   Navigation vers la page de l'institution
--------------------------- */
const viewAssignmentDetails = (assignment) => {
  // Navigation vers la page de l'institution
  // Ici, nous utilisons l'id de l'institution (assignment.idInstitution)
  router.push({ name: 'InstitutionView', params: { id: assignment.idInstitution } });
};

onMounted(() => {
  fetchInstitutions();
  fetchPlaces();
  fetchUsers();
  fetchStudents();
  fetchPraticienFormateurs();
  fetchAssignmentsData();
});
</script>

<style scoped>
.pfp-en-cours {
  padding: 1rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.surface-card {
  background-color: var(--surface-card, #fff);
}
.vote-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0.75rem;
  background-color: var(--surface-card, #fff);
}
</style>
