<template>

  <!-- Critères Validés (Agrégation) -->
  <h5 class="mb-4 m-2">Critères Validés</h5>
  <div class="grid m-2" v-if="aggregatedCriteria && Object.keys(aggregatedCriteria).length">
    <div
      v-for="(value, key) in aggregatedCriteria"
      :key="key"
      style="height: 77px;"
      class="col-2 sm:col-4 lg:col-2 flex flex-column align-items-center justify-content-center w-3 card criteria-card"
    >
      <span class="font-bold text-center">{{ key }}</span>
      <i
        :class="{
            'pi pi-check-circle text-green-500': value,
            'pi pi-times-circle text-red-500': !value
          }"
        class="text-3xl mt-2"
      ></i>
    </div>
  </div>
  <div v-else>
    <p class="text-secondary">Aucun critère validé.</p>
  </div>

  <!-- institutions pour lesquelles l'étudiant a validé des critères -->
  <h5 class="mb-4 m-2">Anciennes places</h5>

  <!-- Bloc d'édition de la PFP1 -->
  <div v-if="isAdmin" class="card my-4 p-3">
    <h5>Modifier ma PFP1</h5>
    <div v-if="placesList.length">
      <!-- Recherche et sélection de la place -->
      <input
        v-model="searchQuery"
        class="form-control"
        type="text"
        placeholder="Rechercher une place..."
        autocomplete="off"
      />
      <ul v-if="searchQuery && filteredPlaces.length" class="list-group" style="max-height:200px;overflow:auto;">
        <li
          v-for="place in filteredPlaces"
          :key="place.IDPlace"
          class="list-group-item list-group-item-action"
          style="cursor:pointer"
          @click="selectPlace(place)"
        >
          {{ getPlaceLabel(place) }}
        </li>
      </ul>
      <div v-if="searchQuery && !filteredPlaces.length" class="text-secondary p-2">
        Aucun résultat.
      </div>
      <div v-if="selectedPFP1" class="mt-2">
        <strong>Place sélectionnée :</strong>
        <span>
    {{
            getPlaceLabel(
              placesList.find(p => p.IDPlace === selectedPFP1) || {}
            )
          }}
  </span>
      </div>
      <button
        class="btn btn-primary mt-2"
        @click="updatePFP1"
        :disabled="!selectedPFP1"
      >
        Enregistrer
      </button>

    </div>
    <div v-else>
      Chargement des places....
    </div>
  </div>


  <div v-if="institutionsList && institutionsList.length">
    <div
      v-for="(inst, index) in institutionsList"
      :key="inst.InstitutionId"
      class="surfaces-card mb-4 shadow-2 flex flex-column gap-2"
      style="min-height: 200px;"
    >
      <!-- Ligne du titre + bouton "Voir les détails" aligné à droite -->
      <div class="flex align-items-center ">
        <h4 class="m-2 w-2">Formation Pratique {{ index + 1 }}</h4>
        <Tag v-if="inst.State === 'Echec'" value="Non Validé" severity="danger" class="ml-2"></Tag>
        <div class="flex align-items-center m-2">
          <Button
            label="Voir les détails"
            icon="pi pi-arrow-right"
            class="text-sm p-button-outlined p-button-primary"
            @click="navigateToInstitution(inst.InstitutionId)"
          />
        </div>

      </div>

      <!-- Nom de l'institution + Domaine -->
      <div>
        <h6 class="m-2 font-bold">
          {{ inst.Name || inst.NomInstitution }}
        </h6>
        <p v-if="inst.Domaines && inst.Domaines.length" class="m-2">
          Domaine : {{ inst.Domaines.join(", ") }}
          <span v-if="inst.CriteriaValides && inst.CriteriaValides.length">
            | Critères validés : {{ inst.CriteriaValides.join(", ") }}
          </span>
        </p>
      </div>

      <!-- Documents -->
      <div>
        <h6 class="m-2">Documents liés à cette formation pratique</h6>
        <div
          class="mt-2"
          v-if="
            uploads[institutionsKey(inst.InstitutionId)] &&
            uploads[institutionsKey(inst.InstitutionId)].docs.length > 0
          "
        >
          <ul class="list-none p-0">
            <li
              v-for="(doc, docIndex) in uploads[institutionsKey(inst.InstitutionId)].docs"
              :key="doc.docId"
              class="flex align-items-center mb-2 gap-2"
            >
              <!-- Mode renommage -->
              <div v-if="doc.isRenaming" class="flex align-items-center gap-2 m-2">
                <InputText
                  v-model="doc.tempName"
                  style="width:200px;"
                />
                <Button
                  label="Enregistrer"
                  class="text-sm p-button-success"
                  @click="saveDocName(inst.InstitutionId, index + 1, doc)"
                />
                <Button
                  label="Annuler"
                  class="text-sm p-button-secondary"
                  @click="cancelRename(doc)"
                />
              </div>

              <!-- Mode affichage normal -->
              <div v-else class="flex align-items-center gap-2 m-2">
                <span
                  style="cursor: pointer; text-decoration: underline;"
                  @click="openDocument(doc.documentURL)"
                  title="Cliquez pour ouvrir ce document"
                >
                  {{ doc.fileName }}
                </span>
                <Button
                  icon="pi pi-trash"
                  class="text-sm p-button-danger"
                  @click="confirmDelete(
                    inst.InstitutionId,
                    index + 1,
                    doc.docId,
                    doc.fileName
                  )"
                />
              </div>
            </li>
          </ul>
        </div>
        <div v-else>
          <p class="text-secondary m-2">
            Aucun document pour cette formation.
          </p>
        </div>
      </div>

      <!-- Sélection et upload de fichiers alignés à droite -->
      <div class="flex justify-content-end align-items-center gap-8 w-6 m-2">
        <FileUpload
          mode="basic"
          customUpload
          multiple
          chooseLabel="Sélectionner"
          @select="($event) => handleFileSelection($event, inst.InstitutionId)"
        />
        <Button
          label="Envoyer documents"
          class="text-sm p-button-outlined p-button-primary"
          @click="uploadDocuments(inst.InstitutionId, index + 1)"
        />
      </div>
    </div>
  </div>
  <div v-else>
    <p class="text-secondary">
      Aucune institution disponible pour cet utilisateur.
    </p>
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from "vue";
import { db, auth } from '../../../../firebase.js'; // adapte le chemin si besoin
import { onAuthStateChanged } from "firebase/auth";

// Variable pour vérifier le rôle de l'utilisateur
const isAdmin = ref(false);

// Variables pour EditPFP1
const placesList = ref([]);
const selectedPFP1 = ref("");
const currentUserId = ref("");
const institutionsMap = ref({});
const searchQuery = ref("");
const filteredPlaces = computed(() =>
  placesList.value.filter(place =>
    getPlaceLabel(place).toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

function selectPlace(place) {
  selectedPFP1.value = place.IDPlace;
  searchQuery.value = getPlaceLabel(place);
}


// Fonction utilitaire pour afficher le label complet d'une place
function getPlaceLabel(place) {
  let label = place.NomPlace || '';
  if (place.InstitutionId && institutionsMap.value[place.InstitutionId] || institutionsMap.value[place.IDPlace]) {
    label += ' - ' + institutionsMap.value[place.InstitutionId || place.IDPlace].Name;
  }
  label += ' (ID: ' + (place.IDPlace || place.InstitutionId) + ')';
  return label;
}

function getPlaceName(place) {
  let label = place.NomPlace || '';
  if (place.InstitutionId && institutionsMap.value[place.InstitutionId] || institutionsMap.value[place.IDPlace]) {
    label += '' + institutionsMap.value[place.InstitutionId || place.IDPlace].Name;
  }
  return label;
}

// Récupère toutes les Places depuis Firebase
async function fetchPlaces() {
  const placesRef = dbRef(db, "Places");
  const snapshot = await get(placesRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    placesList.value = Object.entries(data).map(([key, value]) => ({
      ...value,
      key,
    }));
  }
}

// Récupère l'utilisateur connecté, sa PFP1 et vérifie s'il est admin
function fetchCurrentUser() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId.value = user.uid;
      // Récupère les données de l'utilisateur connecté, y compris les rôles
      const userRef = dbRef(db, `Users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        selectedPFP1.value = userData.PFP1 || "";
        // Vérifie si l'utilisateur est un admin
        isAdmin.value = !!(userData.Roles && userData.Roles.admin);
      } else {
        isAdmin.value = false;
      }
    } else {
      // Gérer le cas où l'utilisateur est déconnecté
      isAdmin.value = false;
      currentUserId.value = "";
    }
  });
}

onMounted(() => {
  fetchPlaces();
  fetchCurrentUser();
  fetchInstitutions();
});

// Récupère toutes les institutions depuis Firebase
async function fetchInstitutions() {
  const institutionsRef = dbRef(db, "institutions");
  const snapshot = await get(institutionsRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    institutionsMap.value = data;
  }
}


// Fonction de mise à jour de la PFP1
async function updatePFP1() {
  if (!currentUserId.value || !selectedPFP1.value) {
    console.warn('updatePFP1: currentUserId ou selectedPFP1 manquant', { currentUserId: currentUserId.value, selectedPFP1: selectedPFP1.value });
    return;
  }

  console.log("id " + currentUserId.value);

  // Correction de la référence pour utiliser currentUserId.value
  const studentRef = dbRef(db, `Students/${userId}`);
  console.log('updatePFP1: studentRef path', `Students/${currentUserId.value}`);

  // On récupère la place sélectionnée pour en extraire le nom
  const selectedPlace = placesList.value.find(p => p.IDPlace === selectedPFP1.value);
  const selectedPlaceName = getPlaceName(selectedPlace);
  console.log('updatePFP1: selectedPlace', selectedPlace);
  console.log('updatePFP1: selectedPlaceName', selectedPlaceName);

  // On récupère les données actuelles pour ne pas écraser le tableau PFP_valided
  const snapshot = await get(studentRef);
  if (snapshot.exists()) {
    const studentData = snapshot.val();
    console.log('updatePFP1: studentData avant modification', studentData);

    // --- Modification des données en local ---
    studentData.PFP1A = true;

    // S'assurer que PFPinfo et PFPinfo.PFP1 existent pour éviter les erreurs
    if (!studentData.PFPinfo) studentData.PFPinfo = {};
    if (!studentData.PFPinfo.PFP1) studentData.PFPinfo.PFP1 = {};
    studentData.PFPinfo.PFP1.selectedStageId = selectedPFP1.value;
    studentData.PFPinfo.PFP1.selectedStageName = selectedPlaceName;

    // Mise à jour ou création du tableau PFP_valided
    const institutionName = institutionsMap.value[selectedPlace.IDInstitution] || 'Institution inconnue';
    const fieldsToCopy = ['DE', 'FR', 'MSQ', 'REHAB', 'SYSINT', 'NEUROGER', 'AMBU', 'AIGU'];
    const placeCharacteristics = {};
    for (const field of fieldsToCopy) {
      placeCharacteristics[field] = selectedPlace[field] === 'true' || selectedPlace[field] === true;
    }

    const newPfpEntry = {
      ID_PFP: selectedPFP1.value,
      Nom_PFP: selectedPlace.NomPlace,
      Selected_Places: selectedPlace.key,
      Nom_Complet_PFP: selectedPlaceName,
      ...placeCharacteristics
    };

    // Logique de création/mise à jour de PFP_valided[0] simplifiée et plus robuste
    if (!studentData.PFP_valided || !Array.isArray(studentData.PFP_valided)) {
      studentData.PFP_valided = []; // Initialise le tableau s'il n'existe pas
    }

    // Prépare la nouvelle entrée en la fusionnant avec l'ancienne si elle existe
    const oldEntry = studentData.PFP_valided[0] || {};
    studentData.PFP_valided[0] = {
      ...oldEntry,
      ...newPfpEntry
    };
    console.log('updatePFP1: PFP_valided[0] créé/mis à jour.');
    // --- Fin des modifications ---

    console.log('updatePFP1: Données prêtes pour le "set"', studentData);
    console.log('updatePFP1: Données prêtes pour le "set"', studentRef);

    try {
      // TEST FINAL : Écrire sur un nœud complètement nouveau pour vérifier la connexion
      const testRef = dbRef(db, `test-writes/${currentUserId.value}`);
      await set(testRef, { timestamp: new Date().toISOString(), status: 'test-write-successful' });
      console.log('TEST FINAL: Écriture sur /test-writes réussie !');

      // On utilise "set" pour réécrire l'intégralité des données de l'étudiant
      await set(studentRef, studentData);
      console.log('updatePFP1: "set" terminé avec succès.');
    } catch (error) {
      console.error('updatePFP1: Erreur lors du "set" Firebase', error);
    }
  } else {
    console.warn('updatePFP1: Aucun étudiant trouvé à ce chemin !');
  }
}

import { useRoute, useRouter } from "vue-router";
import { useToast } from 'primevue/usetoast';
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import FileUpload from "primevue/fileupload";
import Tag from 'primevue/tag';
import { storage } from "root/firebase"; // Assurez-vous que le chemin est correct
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

const toast = useToast();
const route = useRoute();
const router = useRouter();
const userId = route.params.id;
const userProfile = ref(null);
const institutionsList = ref([]);

// Liste des critères pour l'agrégation
const criteriaList = [
  "MSQ",
  "SYSINT",
  "NEUROGER",
  "AIGU",
  "REHAB",
  "AMBU",
  "FR",
  "DE"
];

const fetchUserProfileById = async (userId) => {
  const db = getDatabase();
  try {
    const studentRef = dbRef(db, `Students/${userId}`);
    const snapshotStudent = await get(studentRef);
    if (snapshotStudent.exists()) {
      const studentData = snapshotStudent.val();
      userProfile.value = { ...studentData };
      if (studentData.PFP_valided) {
        const pfpEntries = Object.values(studentData.PFP_valided);
        const validPfpEntries = pfpEntries.filter((place) => place.ID_PFP);
        // Agrégation des domaines et critères
        const domainsByInstitution = {};
        const criteriaByInstitution = {};
        validPfpEntries.forEach((place) => {
          const instId = place.ID_PFP;
          if (place.Domaine || place.Nom_PFP  ) {
            if (!domainsByInstitution[instId]) {
              domainsByInstitution[instId] = new Set();
            }
            domainsByInstitution[instId].add(place.Domaine || place.Nom_PFP);
          }
          if (!criteriaByInstitution[instId]) {
            criteriaByInstitution[instId] = new Set();
          }
          criteriaList.forEach((crit) => {
            if (place[crit] === true) {
              criteriaByInstitution[instId].add(crit);
            }
          });
        });
        // Récupération des institutions
        const dbPromises = validPfpEntries.map((place) => {
          const instId = place.ID_PFP;
          return get(dbRef(db, `Institutions/${instId}`)).then((snapshot) =>
            snapshot.exists() ? { ...snapshot.val(), InstitutionId: instId } : null
          );
        });
        const fetchedInstitutions = await Promise.all(dbPromises);
        institutionsList.value = fetchedInstitutions
          .filter((inst) => inst !== null)
          .map((inst) => {
            const domainSet = domainsByInstitution[inst.InstitutionId];
            const criteriaSet = criteriaByInstitution[inst.InstitutionId];
            const originalPfp = validPfpEntries.find(p => p.ID_PFP === inst.InstitutionId);
            return {
              ...inst,
              Domaines: domainSet ? Array.from(domainSet) : [],
              CriteriaValides: criteriaSet ? Array.from(criteriaSet) : [],
              State: originalPfp ? originalPfp.State : undefined
            };
          });
        // Charger ensuite les documents pour chaque institution
        loadUploadedDocsForAll();
      }
    } else {
      console.error("Aucun profil trouvé pour l'ID :", userId);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
  }
};

const aggregatedCriteria = computed(() => {
  const result = {};
  criteriaList.forEach((crit) => (result[crit] = false));
  if (userProfile.value && userProfile.value.PFP_valided) {
    for (const place in userProfile.value.PFP_valided) {
      const pfp = userProfile.value.PFP_valided[place];
      criteriaList.forEach((crit) => {
        if (pfp[crit] === true) {
          result[crit] = true;
        }
      });
    }
  }
  return result;
});

// Gestion des documents par institution
const uploads = ref({});
const institutionsKey = (instId) => `inst_${instId}`;

const loadUploadedDocsForAll = async () => {
  institutionsList.value.forEach(async (inst, index) => {
    const formationNumber = index + 1;
    const key = institutionsKey(inst.InstitutionId);
    if (!uploads.value[key]) {
      uploads.value[key] = { docs: [], newFiles: [] };
    }
    const db = getDatabase();
    const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
    try {
      const snapshot = await get(dbRef(db, dbPath));
      if (snapshot.exists()) {
        const docsArray = snapshot.val();
        docsArray.forEach((doc) => {
          doc.isRenaming = false;
          doc.tempName = doc.fileName;
        });
        uploads.value[key].docs = docsArray;
      } else {
        uploads.value[key].docs = [];
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des documents pour PFP",
        formationNumber,
        error
      );
    }
  });
};

const handleFileSelection = (event, institutionId) => {
  const key = institutionsKey(institutionId);
  if (!uploads.value[key]) {
    uploads.value[key] = { docs: [], newFiles: [] };
  }
  // Pour FileUpload, l'événement contient un tableau de fichiers dans event.files
  const selectedFiles = Array.from(event.files || event.target.files);
  uploads.value[key].newFiles = selectedFiles;
};

const uploadDocuments = async (institutionId, formationNumber) => {
  const key = institutionsKey(institutionId);
  if (!uploads.value[key]) return;
  const newFiles = uploads.value[key].newFiles;
  if (!newFiles || newFiles.length === 0) {
    toast.add({ severity: 'warn', summary: 'Avertissement', detail: 'Aucun nouveau fichier sélectionné.', life: 4000 });
    return;
  }
  const db = getDatabase();
  const existingDocs = uploads.value[key].docs || [];
  for (const file of newFiles) {
    try {
      const docId = Date.now().toString() + "_" + file.name;
      const fileRef = storageRef(storage, `documents/${institutionId}/${docId}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      existingDocs.push({
        docId: docId,
        fileName: file.name,
        documentURL: downloadURL,
        timestamp: Date.now(),
        isRenaming: false,
        tempName: file.name
      });
    } catch (error) {
      console.error("Erreur d'upload pour le fichier", file.name, error);
    }
  }
  const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
  await set(dbRef(db, dbPath), existingDocs);
  uploads.value[key].docs = existingDocs;
  uploads.value[key].newFiles = [];
};

const initRename = (doc) => {
  doc.isRenaming = true;
  doc.tempName = doc.fileName;
};

const cancelRename = (doc) => {
  doc.isRenaming = false;
  doc.tempName = doc.fileName;
};

const saveDocName = async (institutionId, formationNumber, doc) => {
  if (!doc.tempName) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Le nom du fichier ne peut être vide.', life: 4000 });
    return;
  }
  doc.fileName = doc.tempName;
  doc.isRenaming = false;
  const key = institutionsKey(institutionId);
  const existingDocs = uploads.value[key].docs;
  const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
  try {
    await set(dbRef(getDatabase(), dbPath), existingDocs);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du nouveau nom :", error);
  }
};

const confirmDelete = (institutionId, formationNumber, docId, fileName) => {
  const confirmation = window.confirm(`Supprimer le document « ${fileName} » ?`);
  if (confirmation) {
    deleteDocument(institutionId, formationNumber, docId);
  }
};

const deleteDocument = async (institutionId, formationNumber, docId) => {
  const key = institutionsKey(institutionId);
  if (!uploads.value[key] || !uploads.value[key].docs) return;
  const existingDocs = uploads.value[key].docs;
  const docToRemove = existingDocs.find((doc) => doc.docId === docId);
  if (!docToRemove) return;
  const fileRef = storageRef(storage, `documents/${institutionId}/${docId}`);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Erreur lors de la suppression Storage pour docId =", docId, error);
  }
  const updatedDocs = existingDocs.filter((doc) => doc.docId !== docId);
  const db = getDatabase();
  const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
  await set(dbRef(db, dbPath), updatedDocs);
  uploads.value[key].docs = updatedDocs;
};

const openDocument = (url) => {
  if (url) {
    window.open(url, "_blank");
  }
};

const navigateToInstitution = (instId) => {
  if (instId) {
    router.push({ name: "InstitutionView", params: { id: instId } });
  }
};

onMounted(() => {
  if (userId) {
    fetchUserProfileById(userId);
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
});
</script>

<style scoped>
.surfaces-card {
  background-color: var(--surface-card);
  padding: 2rem;
  border-radius: 2rem;
}

/* --- Responsive Mobile Styles --- */
@media (max-width: 991px) {
  .grid.m-2 {
    gap: 1.2rem !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 0 1.2rem;
    justify-content: center;
  }
  .criteria-card {
    min-width: 130px;
    width: 90% !important;
    margin-bottom: 1rem;
    padding: 1.2rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    border-radius: 1rem;
  }
  .surfaces-card.mb-4.shadow-2.flex.flex-column.gap-2 {
    padding: 1.5rem 1.2rem !important;
    margin: 1.2rem 0 !important;
    min-width: 0;
    border-radius: 1.2rem;
    display: flex;
    align-items: center;
  }
  .flex.align-items-center {
    flex-direction: column !important;
    align-items: center !important;
    gap: 0.7rem;
    width: 100%;
  }
  h4.m-2.w-2 {
    margin-left: 0 !important;
    margin-right: 0 !important;
    width: 100% !important;
    text-align: center;
    font-size: 1.2rem;
  }
  .list-none.p-0 {
    padding: 0 !important;
  }
  .info-item, .m-2 {
    margin-left: 0.4rem !important;
    margin-right: 0.4rem !important;
  }
}
@media (max-width: 600px) {
  .grid.m-2, .surfaces-card.mb-4.shadow-2.flex.flex-column.gap-2 {
    padding-left: 0.4rem !important;
    padding-right: 0.4rem !important;
  }
  .criteria-card {
    min-width: 100px;
    padding: 1rem 0.5rem;
  }
}
</style>
