<template>
  <div>
    <!-- Critères Validés (Agrégation) -->
    <h5 class="mb-4">Critères Validés</h5>
    <div class="grid m-2" v-if="aggregatedCriteria && Object.keys(aggregatedCriteria).length">
      <div
        v-for="(value, key) in aggregatedCriteria"
        :key="key"
        class="col-2 sm:col-4 lg:col-2 flex flex-column align-items-center justify-content-center card w-3"
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

    <!-- Anciennes Institutions -->
    <h5 class="p-mb-4 p-mt-4">Anciennes Institutions</h5>
    <div v-if="institutionsList && institutionsList.length">
      <div
        v-for="(inst, index) in institutionsList"
        :key="inst.InstitutionId"
        class="p-mb-3"
      >
        <div class="card">
            <div class="p-d-flex p-jc-between p-ai-center">
              <h4>Formation Pratique {{ index + 1 }}</h4>
              <Button
                label="Voir les détails"
                icon="pi pi-arrow-right"
                class="p-button-sm mb-4 w-2"
                @click="navigateToInstitution(inst.InstitutionId)"
              />
            </div>
          <div>
            <h6 class="p-m-0 p-text-bold">
              {{ inst.Name || inst.NomInstitution }}
            </h6>
            <p v-if="inst.Domaines && inst.Domaines.length" class="p-m-0">
              Domaine : {{ inst.Domaines.join(", ") }}
              <span v-if="inst.CriteriaValides && inst.CriteriaValides.length">
                | Critères validés : {{ inst.CriteriaValides.join(", ") }}
              </span>
            </p>
          </div>
            <div>
              <h6>Documents liés à cette formation pratique</h6>
              <div
                class="mb-2"
                v-if="
                  uploads[institutionsKey(inst.InstitutionId)] &&
                  uploads[institutionsKey(inst.InstitutionId)].docs.length > 0
                "
              >
                <ul style="list-style: none; padding: 0;">
                  <li
                    v-for="(doc, docIndex) in uploads[institutionsKey(inst.InstitutionId)].docs"
                    :key="doc.docId"
                    class="p-d-flex p-ai-center p-mb-2"
                  >
                    <!-- Mode renommage -->
                    <div v-if="doc.isRenaming" class="p-d-flex p-ai-center">
                      <InputText
                        v-model="doc.tempName"
                        class="p-mr-2"
                        style="width:200px;"
                      />
                      <Button
                        label="Enregistrer"
                        class="p-button-sm p-button-success p-mr-2"
                        @click="saveDocName(inst.InstitutionId, index + 1, doc)"
                      />
                      <Button
                        label="Annuler"
                        class="p-button-sm p-button-secondary"
                        @click="cancelRename(doc)"
                      />
                    </div>
                    <!-- Mode affichage normal -->
                    <div v-else class="p-d-flex p-ai-center">
                      <span
                        class="p-mr-2"
                        style="cursor:pointer; text-decoration:underline;"
                        @click="openDocument(doc.documentURL)"
                        title="Cliquez pour ouvrir ce document"
                      >
                        {{ doc.fileName }}
                      </span>

                        <Button
                          icon="pi pi-trash"
                          class="p-button-sm p-button-danger ml-2"
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
                <p class="p-text-secondary">
                  Aucun document pour cette formation.
                </p>
              </div>
              <div class="p-mt-2 flex-auto">
                <!-- Permet la sélection des fichiers -->
                <FileUpload
                  mode="basic"
                  customUpload
                  multiple
                  chooseLabel="Sélectionner des fichiers"
                  @select="($event) => handleFileSelection($event, inst.InstitutionId)"
                  class="mb-2"
                />
                <!-- Bouton pour envoyer les documents sélectionnés -->
                <Button
                  label="Envoyer documents"
                  class="p-button-sm p-button-outlined p-button-primary p-ml-2 w-2"
                  @click="uploadDocuments(inst.InstitutionId, index + 1)"
                />
              </div>


            </div>

        </div>
      </div>
    </div>
    <div v-else>
      <p class="p-text-secondary">
        Aucune institution disponible pour cet utilisateur.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getDatabase,
  ref as dbRef,
  get,
  set,
  remove
} from "firebase/database";
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import FileUpload from "primevue/fileupload";
import { storage } from "@/firebase";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

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
          if (place.Domaine) {
            if (!domainsByInstitution[instId]) {
              domainsByInstitution[instId] = new Set();
            }
            domainsByInstitution[instId].add(place.Domaine);
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
            return {
              ...inst,
              Domaines: domainSet ? Array.from(domainSet) : [],
              CriteriaValides: criteriaSet ? Array.from(criteriaSet) : []
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
    alert("Aucun nouveau fichier sélectionné.");
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
    alert("Le nom du fichier ne peut être vide.");
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
