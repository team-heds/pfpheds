<template>
  <div>
    <!-- Critères Validés (Agrégation des critères de toutes les places de stage) -->
    <h5 class="mb-4">Critères Validés</h5>
    <div class="grid m-2" v-if="aggregatedCriteria && Object.keys(aggregatedCriteria).length">
      <div v-for="(value, key) in aggregatedCriteria" :key="key"
        class="col-2 sm:col-4 lg:col-2 flex flex-column align-items-center justify-content-center card w-12">
        <span class="font-bold text-center">{{ key }}</span>
        <i :class="{
          'pi pi-check-circle text-green-500': value,
          'pi pi-times-circle text-red-500': !value
        }" class="text-3xl mt-2"></i>
      </div>
    </div>
    <div v-else>
      <p class="text-secondary">Aucun critère validé.</p>
    </div>

    <!-- Anciennes Institutions avec dépôt de document -->
    <h5 class="mb-4">Anciennes Institutions</h5>
    <div class="card w-12" v-if="institutionsList && institutionsList.length">
      <div v-for="(inst, index) in institutionsList" :key="inst.InstitutionId" class="institution-card">
        <div class="institution-content">
          <!-- Affiche le nom de l'institution et le numéro de formation -->
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
          <Button label="Voir les détails de l'institution" class="p-button-sm p-button-outlined p-button-primary"
            @click="navigateToInstitution(inst.InstitutionId)" />
        </div>
        <!-- Section de dépôt de document pour l'institution -->
        <div class="upload-section mt-3">
          <h6>Votre document personnel en lien avec cette formation pratique</h6>
          <!-- Si aucun document n'est enregistré, afficher l'upload -->
          <template v-if="!(uploads[inst.InstitutionId] && uploads[inst.InstitutionId].documentURL)">
            <input type="file" @change="handleFileUpload($event, inst.InstitutionId)" />
            <Button label="Télécharger" class="p-button-sm p-button-outlined p-button-primary mt-2"
              @click="uploadDocument(inst.InstitutionId, index + 1)" />
          </template>
          <!-- Sinon, afficher le document déposé et l'option de suppression -->
          <template v-else>
            <div class="document-actions">
              <Button label="Accéder au document" class="p-button-sm p-button-outlined p-button-primary"
                @click="openDocument(uploads[inst.InstitutionId].documentURL)" />
              <Button icon="pi pi-trash" class="p-button-sm p-button-outlined p-button-secondary ml-2"
                @click="confirmDelete(inst.InstitutionId, index + 1)" />
            </div>
          </template>



        </div>

      </div>
    </div>
    <div v-else>
      <p class="text-secondary">Aucune institution disponible pour cet utilisateur.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getDatabase, ref as dbRef, get, set, remove } from "firebase/database";
import Button from "primevue/button";
import { storage } from "@/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Ouvre l'URL du document dans un nouvel onglet
const openDocument = (url) => {
  if (url) {
    window.open(url, '_blank');
  }
};

// Demande confirmation avant suppression, puis appelle deleteDocument si confirmé
const confirmDelete = (institutionId, formationNumber) => {
  const confirmation = window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?");
  if (confirmation) {
    deleteDocument(institutionId, formationNumber);
  }
};


// Références pour les données utilisateur et institutions
const userProfile = ref(null);
const institutionsList = ref([]);

// Objet réactif pour gérer l'état d'upload par institution
const uploads = ref({});

// Récupérer l'ID utilisateur depuis l'URL et l'utiliser dans la DB
const route = useRoute();
const router = useRouter();
const userId = route.params.id;

// Liste des critères à agréger
const criteriaList = ["MSQ", "SYSINT", "NEUROGER", "AIGU", "REHAB", "AMBU", "FR", "DE"];

// Propriété calculée qui agrège les critères de toutes les places de stage
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

// Chargement du profil utilisateur et des institutions depuis Firebase Realtime Database
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

        // Agrégation des domaines et des critères validés par institution
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

        // Récupération des institutions associées aux places validées
        const dbPromises = validPfpEntries.map(place => {
          const instId = place.ID_PFP;
          return get(dbRef(db, `Institutions/${instId}`))
            .then(snapshot => {
              if (snapshot.exists()) {
                return { ...snapshot.val(), InstitutionId: instId };
              } else {
                return null;
              }
            });
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
        // Une fois les institutions chargées, on récupère les documents existants
        loadUploadedDocuments();
      }
    } else {
      console.error("Aucun profil trouvé pour l'ID :", userId);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
  }
};

// Fonction qui charge pour chaque formation (basée sur l'ordre dans institutionsList) le document dans la DB
const loadUploadedDocuments = async () => {
  const db = getDatabase();
  institutionsList.value.forEach(async (inst, index) => {
    const formationNumber = index + 1;
    const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
    try {
      const snapshot = await get(dbRef(db, dbPath));
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (!uploads.value[inst.InstitutionId]) {
          uploads.value[inst.InstitutionId] = { file: null, documentURL: null, fileName: null };
        }
        uploads.value[inst.InstitutionId].documentURL = data.documentURL;
        uploads.value[inst.InstitutionId].fileName = data.fileName;
      }
    } catch (error) {
      console.error("Erreur lors du chargement du document pour Formation Pratique", formationNumber, error);
    }
  });
};

// Navigation vers les détails de l'institution
const navigateToInstitution = (instId) => {
  if (instId) {
    router.push({ name: 'InstitutionView', params: { id: instId } });
  }
};

// Gestion de la sélection du fichier pour une institution donnée
const handleFileUpload = (event, institutionId) => {
  if (!uploads.value[institutionId]) {
    uploads.value[institutionId] = { file: null, documentURL: null, fileName: null };
  }
  uploads.value[institutionId].file = event.target.files[0];
};

// Upload du document sur Firebase Storage et enregistrement dans la DB pour une institution donnée
const uploadDocument = async (institutionId, formationNumber) => {
  const uploadData = uploads.value[institutionId];
  if (!uploadData || !uploadData.file) {
    console.error("Aucun fichier sélectionné pour l'institution", institutionId);
    return;
  }
  const file = uploadData.file;
  // Stocker le document dans un dossier spécifique à l'institution
  const fileRef = storageRef(storage, `documents/${institutionId}/${file.name}`);
  try {
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    uploads.value[institutionId].documentURL = downloadURL;
    uploads.value[institutionId].fileName = file.name;
    console.log("Document uploadé pour l'institution", institutionId, "URL :", downloadURL);

    // Enregistrement dans la DB au chemin /Students/IDUSER/document/PFP<formationNumber>/
    const db = getDatabase();
    const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
    await set(dbRef(db, dbPath), {
      documentURL: downloadURL,
      fileName: file.name,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Erreur lors du téléchargement pour l'institution", institutionId, error);
  }
};

// Supprime le document à la fois du Storage et de la DB pour la formation donnée
const deleteDocument = async (institutionId, formationNumber) => {
  const uploadData = uploads.value[institutionId];
  if (!uploadData || !uploadData.documentURL || !uploadData.fileName) {
    console.error("Aucun document à supprimer pour l'institution", institutionId);
    return;
  }
  const db = getDatabase();
  const fileRef = storageRef(storage, `documents/${institutionId}/${uploadData.fileName}`);
  try {
    await deleteObject(fileRef);
    const dbPath = `Students/${userId}/document/PFP${formationNumber}`;
    await remove(dbRef(db, dbPath));
    uploads.value[institutionId].file = null;
    uploads.value[institutionId].documentURL = null;
    uploads.value[institutionId].fileName = null;
    console.log("Document supprimé pour l'institution", institutionId);
  } catch (error) {
    console.error("Erreur lors de la suppression pour l'institution", institutionId, error);
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

/* Styles pour l'upload de document */
.upload-section {
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background-color: var(--surface-card);
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

.document-actions {
  display: flex;
  align-items: center;
}

</style>
