<template>
  <div>
    <!-- Critères Validés (Agrégation) -->
    <h5 class="mb-4">Critères Validés</h5>
    <div class="grid m-2" v-if="aggregatedCriteria && Object.keys(aggregatedCriteria).length">
      <div
        v-for="(value, key) in aggregatedCriteria"
        :key="key"
        class="col-2 sm:col-4 lg:col-2 flex flex-column align-items-center justify-content-center card w-12"
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

    <!-- Anciennes Institutions avec dépôt de documents -->
    <h5 class="mb-4">Anciennes Institutions</h5>
    <div class="card w-12" v-if="institutionsList && institutionsList.length">
      <div
        v-for="(inst, index) in institutionsList"
        :key="inst.InstitutionId"
        class="institution-card"
      >
        <div class="institution-content">
          <span class="formation-number">
            <h4>Formation Pratique {{ index + 1 }}</h4>
          </span>
          <h6 class="font-bold">{{ inst.Name || inst.NomInstitution }}</h6>
          <!-- Affiche le domaine et les critères validés, si présents -->
          <p v-if="inst.Domaines && inst.Domaines.length">
            Domaine : {{ inst.Domaines.join(', ') }}
            <span v-if="inst.CriteriaValides && inst.CriteriaValides.length">
              | Critères validés : {{ inst.CriteriaValides.join(', ') }}
            </span>
          </p>
        </div>
        <div class="action-button">
          <Button
            label="Voir les détails de l'institution"
            class="p-button-sm p-button-outlined p-button-primary"
            @click="navigateToInstitution(inst.InstitutionId)"
          />
        </div>

        <!-- Section d'upload pour la formation -->
        <div class="upload-section mt-3">
          <h6>Documents liés à cette formation pratique</h6>

          <!-- Liste des documents déjà uploadés -->
          <div v-if="uploads[institutionsKey(inst.InstitutionId)].docs.length > 0">
            <ul>
              <li
                v-for="(doc, docIndex) in uploads[institutionsKey(inst.InstitutionId)].docs"
                :key="doc.docId"
                class="document-list-item"
              >
                <!-- Mode Renommage ? -->
                <div v-if="doc.isRenaming" class="rename-box">
                  <!-- Champ pour changer le nom -->
                  <input v-model="doc.tempName" class="rename-input" />
                  <Button
                    label="Enregistrer"
                    class="p-button-sm p-button-text p-button-success ml-2"
                    @click="saveDocName(inst.InstitutionId, index + 1, doc)"
                  />
                  <Button
                    label="Annuler"
                    class="p-button-sm p-button-text p-button-secondary ml-2"
                    @click="cancelRename(doc)"
                  />
                </div>

                <!-- Mode Affichage normal -->
                <div v-else class="doc-display">
                  <!-- Nom du fichier cliquable -->
                  <span
                    class="file-link"
                    @click="openDocument(doc.documentURL)"
                    title="Cliquez pour ouvrir ce document"
                  >
                    {{ doc.fileName }}
                  </span>
                  <!-- Bouton de renom -->
                  <Button
                    icon="pi pi-pencil"
                    class="p-button-sm p-button-text p-button-secondary ml-2"
                    @click="initRename(doc)"
                  />
                  <!-- Bouton de suppression -->
                  <Button
                    icon="pi pi-trash"
                    class="p-button-sm p-button-text p-button-danger ml-2"
                    @click="confirmDelete(inst.InstitutionId, index + 1, doc.docId, doc.fileName)"
                  />
                </div>
              </li>
            </ul>
          </div>

          <!-- Aucun document -->
          <div v-else>
            <p class="text-secondary">Aucun document pour cette formation.</p>
          </div>

          <!-- Nouveau(x) fichier(s) à uploader -->
          <div class="new-file-section mt-2">

            <FileUpload
              type="file"
              chooseLabel="Ajouter"
              multiple
              @change="handleFileSelection($event, inst.InstitutionId)"
            />

            <Button
              label="Uploader les fichiers sélectionnés"
              class="p-button-sm p-button-outlined p-button-primary mt-2"
              @click="uploadDocuments(inst.InstitutionId, index + 1)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <p class="text-secondary">Aucune institution disponible pour cet utilisateur.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getDatabase, ref as dbRef, get, set, remove } from "firebase/database";
import Button from "primevue/button";
import { storage } from "@/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// --------------------------------------------------
// 1. Récupération des critères / user / institutions
// --------------------------------------------------
const route = useRoute();
const router = useRouter();
const userId = route.params.id;
const userProfile = ref(null);
const institutionsList = ref([]);

// Liste des critères pour aggregatedCriteria
const criteriaList = ["MSQ", "SYSINT", "NEUROGER", "AIGU", "REHAB", "AMBU", "FR", "DE"];

// Charge le profil student + institutions
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
        const validPfpEntries = pfpEntries.filter(place => place.ID_PFP);

        // Agrégation des domaines + critères
        const domainsByInstitution = {};
        const criteriaByInstitution = {};

        validPfpEntries.forEach(place => {
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
          criteriaList.forEach(crit => {
            if (place[crit] === true) {
              criteriaByInstitution[instId].add(crit);
            }
          });
        });

        // Récupération Institutions
        const dbPromises = validPfpEntries.map(place => {
          const instId = place.ID_PFP;
          return get(dbRef(db, `Institutions/${instId}`))
            .then(snapshot => snapshot.exists() ? { ...snapshot.val(), InstitutionId: instId } : null);
        });

        const fetchedInstitutions = await Promise.all(dbPromises);
        institutionsList.value = fetchedInstitutions
          .filter(inst => inst !== null)
          .map(inst => {
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

// Propriété calculée : agrège les critères
const aggregatedCriteria = computed(() => {
  const result = {};
  criteriaList.forEach(crit => (result[crit] = false));
  if (userProfile.value && userProfile.value.PFP_valided) {
    for (const place in userProfile.value.PFP_valided) {
      const pfp = userProfile.value.PFP_valided[place];
      criteriaList.forEach(crit => {
        if (pfp[crit] === true) {
          result[crit] = true;
        }
      });
    }
  }
  return result;
});

// --------------------------------------
// 2. Gestion des documents multiples PFP
// --------------------------------------

// Structure locale pour gérer le(s) document(s) de chaque institution
// Key: 'inst_{instId}', value : { docs: array of documents, newFiles: array of newly selected files }
const uploads = ref({});

// Génère une clé unique pour chaque institution
const institutionsKey = (instId) => `inst_${instId}`;

// Charge les docs existants pour chaque formation
const loadUploadedDocsForAll = async () => {
  institutionsList.value.forEach(async (inst, index) => {
    const formationNumber = index + 1;
    // Initialise l'objet local si besoin
    const key = institutionsKey(inst.InstitutionId);
    if (!uploads.value[key]) {
      uploads.value[key] = { docs: [], newFiles: [] };
    }

    const db = getDatabase();
    const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
    try {
      const snapshot = await get(dbRef(db, dbPath));
      if (snapshot.exists()) {
        // On suppose qu'il s'agit d'un tableau de docs
        const docsArray = snapshot.val();

        // On ajoute des champs internes pour la gestion du renom local
        docsArray.forEach(doc => {
          doc.isRenaming = false;     // pour basculer en mode "édition de nom"
          doc.tempName = doc.fileName; // champ temporaire pour l'input
        });

        uploads.value[key].docs = docsArray;
      } else {
        uploads.value[key].docs = [];
      }
    } catch (error) {
      console.error("Erreur lors du chargement des documents pour PFP", formationNumber, error);
    }
  });
};

// Gère la sélection de plusieurs fichiers pour un input
const handleFileSelection = (event, institutionId) => {
  const key = institutionsKey(institutionId);
  if (!uploads.value[key]) {
    uploads.value[key] = { docs: [], newFiles: [] };
  }
  const selectedFiles = Array.from(event.target.files);
  // On les stocke dans newFiles
  uploads.value[key].newFiles = selectedFiles;
};

// Upload les documents nouvellement sélectionnés pour la formation
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

  // Pour chaque nouveau fichier, on l'upload
  for (const file of newFiles) {
    try {
      const docId = Date.now().toString() + '_' + file.name;
      const fileRef = storageRef(storage, `documents/${institutionId}/${docId}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      // On ajoute le nouveau doc dans existingDocs
      existingDocs.push({
        docId: docId,
        fileName: file.name,
        documentURL: downloadURL,
        timestamp: Date.now(),
        // Champs pour la gestion du rename
        isRenaming: false,
        tempName: file.name
      });
    } catch (error) {
      console.error("Erreur d'upload pour le fichier", file.name, error);
    }
  }

  // Mettre à jour la DB (on réécrit tout le tableau)
  const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
  await set(dbRef(db, dbPath), existingDocs);
  console.log("Documents mis à jour pour institution", institutionId);

  // Mettre à jour la partie locale
  uploads.value[key].docs = existingDocs;
  // On vide la sélection de fichiers
  uploads.value[key].newFiles = [];
};

// Passage en mode "renommer"
const initRename = (doc) => {
  doc.isRenaming = true;
  doc.tempName = doc.fileName; // on prépare la valeur initiale dans l'input
};

// Annuler le renom
const cancelRename = (doc) => {
  doc.isRenaming = false;
  doc.tempName = doc.fileName;
};

// Sauvegarde du nouveau nom
// => On modifie fileName dans le tableau local et on met à jour la DB
const saveDocName = async (institutionId, formationNumber, doc) => {
  // Vérifier qu'on a un nom
  if (!doc.tempName) {
    alert("Le nom du fichier ne peut être vide.");
    return;
  }
  // On met à jour localement
  doc.fileName = doc.tempName;
  doc.isRenaming = false;

  // On met ensuite à jour TOUT le tableau dans la DB
  const key = institutionsKey(institutionId);
  const existingDocs = uploads.value[key].docs;
  const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
  try {
    await set(dbRef(getDatabase(), dbPath), existingDocs);
    console.log("Nouveau nom enregistré :", doc.fileName);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du nouveau nom :", error);
  }
};

// Suppression d'un document
const confirmDelete = (institutionId, formationNumber, docId, fileName) => {
  const confirmation = window.confirm(`Supprimer le document « ${fileName} » ?`);
  if (confirmation) {
    deleteDocument(institutionId, formationNumber, docId);
  }
};

// Supprime le doc du Storage et de la DB
const deleteDocument = async (institutionId, formationNumber, docId) => {
  const key = institutionsKey(institutionId);
  if (!uploads.value[key] || !uploads.value[key].docs) return;

  // Retrouver le doc
  const existingDocs = uploads.value[key].docs;
  const docToRemove = existingDocs.find(doc => doc.docId === docId);
  if (!docToRemove) return;

  // Supprimer du Storage
  const fileRef = storageRef(storage, `documents/${institutionId}/${docId}`);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Erreur lors de la suppression Storage pour docId =", docId, error);
  }

  // Filtrer localement
  const updatedDocs = existingDocs.filter(doc => doc.docId !== docId);

  // Mettre à jour la DB
  const db = getDatabase();
  const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
  await set(dbRef(db, dbPath), updatedDocs);

  // Mettre à jour local
  uploads.value[key].docs = updatedDocs;
  console.log("Document supprimé pour institutionId =", institutionId, "docId =", docId);
};

// Ouvrir un document (URL) dans un nouvel onglet
const openDocument = (url) => {
  if (url) {
    window.open(url, "_blank");
  }
};

// Navigation vers l'écran InstitutionView
const navigateToInstitution = (instId) => {
  if (instId) {
    router.push({ name: "InstitutionView", params: { id: instId } });
  }
};

// Au montage, on récupère le user et ses formations
onMounted(() => {
  if (userId) {
    fetchUserProfileById(userId);
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
});
</script>

<style scoped>
/* Styles Critères Validés */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

/* Styles Anciennes Institutions */
.institution-card {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background-color: var(--surface-card);
  transition: box-shadow 0.2s, transform 0.2s;
  margin-bottom: 1rem;
}
.institution-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.institution-content h6 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--text-color);
}
.institution-content p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
}
.action-button {
  margin-top: 0.5rem;
}
.text-secondary {
  color: var(--text-secondary-color);
}
.text-green-500 {
  color: var(--green-500);
}
.text-red-500 {
  color: var(--red-500);
}
/* Upload section */
.upload-section {
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background-color: var(--surface-card);
}
.new-file-section {
  margin-top: 1rem;
}
.document-actions {
  display: flex;
  align-items: center;
}
/* Liste documents */
.document-list-item {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}
.doc-display {
  display: flex;
  align-items: center;
}
.file-link {
  text-decoration: underline;
  cursor: pointer;
  margin-right: 0.5rem;
}
.rename-box {
  display: flex;
  align-items: center;
}
.rename-input {
  width: 200px;
  margin-right: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .text-3xl {
    font-size: 1.5rem;
  }
}
@media (max-width: 600px) {
  .w-12 {
    width: 100% !important;
  }
  .institution-card {
    align-items: flex-start;
  }
  .action-button {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
