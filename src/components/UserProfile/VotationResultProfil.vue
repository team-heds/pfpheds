<template>
  <div class="pfp-en-cours">
    <h5 class="mb-5">Formation pratique en cours</h5>
    <div v-if="assignedPlaces.length">
      <div class="grid">
        <div
          v-for="(place, idx) in assignedPlaces"
          :key="place._key || idx"
          class="surfaces-card shadow-2 mb-3 flex flex-column gap-2"
          style="min-height: 120px; border-radius: 2rem; background: var(--surface-card);"
        >
          <!-- Ligne du titre + bouton Voir les détails aligné à droite -->
          <div class="flex align-items-center justify-content-between mb-2" style="height: 32px;">
            <h4 class="m-0">Formation Pratique attribuée</h4>
            <Button
              label="Voir les détails"
              icon="pi pi-arrow-right"
              class="text-sm p-button-outlined p-button-primary details-btn ml-3"
              style="height: 32px; width: 200px; min-width: 200px;"
              @click="navigateToInstitution(place.IDPlace)"
            />
          </div>
          <div>
            <h6 class="m-2 font-bold">
              {{ getInstitutionNameById(place.IDPlace) }}
            </h6>
            <p class="m-2">
              Domaine : {{ place.NomPlace }}<br />
              Critères : {{ getValidCriterias(place).join(', ') }}<br />
              <span v-if="getPraticienFormateurInfos(place)">
                Praticien formateur :
                <b>{{ getPraticienFormateurInfos(place) }}</b><br />
                <span v-if="getPraticienFormateurContact(place)">
                  Contact :
                  <a :href="'mailto:' + getPraticienFormateurContact(place)" class="text-primary font-bold" style="text-decoration: underline;">
                    {{ getPraticienFormateurContact(place) }}
                  </a>
                </span>
              </span>
            </p>
          </div>
          <!-- Documents -->
        </div>
      </div>
    </div>
    <div v-else>
      <!-- Si aucune affectation n'est trouvée pour cet utilisateur, ce message s'affiche -->
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
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps({
  userId: { type: String, required: true }
})

const router = useRouter()

/* ---------------------------
   Chargement des données de votation
--------------------------- */
const votationData = ref({})
const fetchVotationData = async () => {
  try {
    const votationRef = firebaseRef(db, 'VotationResult')
    const snapshot = await get(votationRef)
    if (snapshot.exists()) {
      votationData.value = snapshot.val()
    } else {
      console.error('Aucune donnée de votation disponible.')
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données de votation :', error)
  }
}
onMounted(() => {
  fetchVotationData()
})
const filteredVotationData = computed(() => {
  const result = {}
  const uid = props.userId
  if (!votationData.value) return result
  for (const groupKey in votationData.value) {
    const group = votationData.value[groupKey]
    const newGroup = {}
    for (const subKey in group) {
      const filteredArray = group[subKey].filter((item) => item.studentId === uid)
      if (filteredArray.length > 0) {
        newGroup[subKey] = filteredArray
      }
    }
    if (Object.keys(newGroup).length > 0) {
      result[groupKey] = newGroup
    }
  }
  return result
})
const hasVotationData = computed(() => Object.keys(filteredVotationData.value).length > 0)

/* ---------------------------
   Chargement des affectations PFP et autres données associées
--------------------------- */
const assignmentsData = ref({})
const placesData = ref({})
const institutions = ref({})
const users = ref({})
const students = ref({})
const praticienFormateurs = ref({})

// Ajout : computed pour trouver toutes les places où l'utilisateur courant est affecté via les clés selectedEtudiant...
const assignedPlaces = computed(() => {
  const userId = props.userId;
  const results = [];
  Object.values(placesData.value || {}).forEach(place => {
    Object.entries(place).forEach(([key, value]) => {
      if (
        key.startsWith('selectedEtudiant') &&
        typeof value === 'string' &&
        value === userId
      ) {
        // On extrait l'index (numéro de place) pour l'affichage
        const seatIndex = key.split('-').pop();
        results.push({ ...place, seatIndex, assignmentKey: key });
      }
    });
  });
  return results;
});


const getInstitutionNameById = (idInstitution) => {
  const inst = institutions.value[idInstitution];
  return inst && inst.Name ? inst.Name : 'Institution inconnue';
};

// Retourne la liste des critères à true pour une place donnée
function getValidCriterias(place) {
  const criteriaKeys = ['AMBU', 'DE', 'FR', 'MSQ', 'NEUROGER', 'REHAB', 'SYSINT', 'AIGU'];
  return criteriaKeys.filter(key => {
    const val = place[key];
    return val === true || (typeof val === 'string' && val.toLowerCase() === 'true');
  });
}

// Retourne l'ID du praticien formateur lié à la place et au seat (ex: selectedPraticiensBA23PFP3-1)
function getPraticienFormateurId(place) {
  // On essaie de déterminer la clé du praticien selon le seatIndex
  // Correction : fallback sur place.praticiensFormateurs[0] si rien trouvé
  const seat = place.seatIndex;
  if (!seat) {
    if (Array.isArray(place.praticiensFormateurs) && place.praticiensFormateurs.length > 0) {
      return place.praticiensFormateurs[0];
    }
    return '';
  }
  const keysToTry = [
    `selectedPraticiensBA23PFP3-${seat}`,
    `selectedPraticienBA23PFP3-${seat}`,
    `selectedPraticiensBA22PFP4-${seat}`,
    `selectedPraticienBA22PFP4-${seat}`
  ];
  for (const key of keysToTry) {
    if (place[key]) return place[key];
  }
  if (Array.isArray(place.praticiensFormateurs) && place.praticiensFormateurs.length > 0) {
    return place.praticiensFormateurs[0];
  }
  return '';
}

// Retourne "Prénom Nom" du praticien formateur lié à la place et au seat
function getPraticienFormateurInfos(place) {
  const id = getPraticienFormateurId(place);
  if (!id) return '';
  const pract = praticienFormateurs.value && praticienFormateurs.value[id];
  if (!pract) return '';
  const prenom = pract.Prenom ? pract.Prenom.trim() : '';
  const nom = pract.Nom ? pract.Nom.trim() : '';
  return `${prenom} ${nom}`.trim();
}

// Ajout utilitaire pour le contact du praticien formateur
function getPraticienFormateurContact(place) {
  if (place && place.praticienMail) {
    return place.praticienMail;
  }
  const praticienId = getPraticienFormateurId(place);
  if (praticienId && praticienFormateurs.value[praticienId]) {
    return praticienFormateurs.value[praticienId].Mail || praticienFormateurs.value[praticienId].mail || '';
  }
  return '';
}

const fetchAssignmentsData = () => {
  const assignRef = firebaseRef(db, 'signatureAssignments')
  onValue(assignRef, (snapshot) => {
    assignmentsData.value = snapshot.val() || {}
  })
}
const fetchInstitutions = () => {
  const instRef = firebaseRef(db, 'Institutions')
  onValue(instRef, (snapshot) => {
    institutions.value = snapshot.val() || {}
  })
}
const fetchPlaces = () => {
  const placesRef = firebaseRef(db, 'Places')
  onValue(placesRef, (snapshot) => {
    placesData.value = snapshot.val() || {}
  })
}
const fetchUsers = () => {
  const usersRef = firebaseRef(db, 'Users')
  onValue(usersRef, (snapshot) => {
    users.value = snapshot.val() || {}
  })
}
const fetchStudents = () => {
  const studentsRef = firebaseRef(db, 'Students')
  onValue(studentsRef, (snapshot) => {
    students.value = snapshot.val() || {}
  })
}
const fetchPraticienFormateurs = () => {
  const practRef = firebaseRef(db, 'PraticienFormateurs')
  onValue(practRef, (snapshot) => {
    praticienFormateurs.value = snapshot.val() || {}
  })
}

// Map temporaire pour les cas sans seat déjà défini
const seatsMap = {}

// Construction du tableau d'affectations en récupérant directement le seat depuis la DB si présent
const assignments = computed(() => {
  const data = assignmentsData.value || {}
  const result = []
  Object.keys(data).forEach((key) => {
    const record = data[key]
    if (record.idEtudiant === props.userId) {
      const place = placesData.value[record.idPlace] || {}
      const institution =
        (place.IDPlace && institutions.value[place.IDPlace]) ||  (place.InstitutionId && institutions.value[place.InstitutionId]) ||
        {}


      const student = students.value[record.idEtudiant] || {}
      const userObj = users.value[record.idEtudiant] || {}
      const criteriaKeys = ['AIGU', 'AMBU', 'DE', 'FR', 'REHAB', 'MSQ', 'NEUROGER']
      const validCriteria = criteriaKeys.filter((k) => {
        const val = place[k]
        return val === true || (typeof val === 'string' && val.toLowerCase() === 'true')
      })
      const voteRank = record.voteRank || 'non voté'
      // Utilisation du seat stocké dans la DB s'il existe, sinon calcul dynamique
      let seat = record.seat
      if (!seat) {
        if (!seatsMap[record.idPlace]) {
          seatsMap[record.idPlace] = 1
          seat = 1
        } else {
          seatsMap[record.idPlace] += 1
          seat = seatsMap[record.idPlace]
        }
      }

      // Calcul de la clé du praticien formateur en fonction du seat
      let praticienFormateurKey = ''
      if (Array.isArray(place.praticiensFormateurs)) {
        if (place.praticiensFormateurs.length === 1) {
          praticienFormateurKey = place.praticiensFormateurs[0]
        } else {
          // Pour plusieurs praticiens, on sélectionne avec la clé dynamique en fonction du seat
          praticienFormateurKey = place['selectedPraticiensBA22PFP4-' + seat] || place['selectedPraticienBA22PFP4-' + seat] ||  ''
        }
      }
      const pract = praticienFormateurs.value[praticienFormateurKey] || {}

      result.push({
        _key: key,
        idPlace: record.idPlace,
        NomPlace: place.NomPlace || '',
        idInstitution: place.IDPlace || place.InstitutionId || '',
        institutionName: institution.Name || 'non défini',
        idEtudiant: record.idEtudiant,
        nom: userObj.Nom || student.Nom || '',
        prenom: userObj.Prenom || student.Prenom || '',
        repondantHES: student.RepondantHES || '',
        voteRank,
        category: institution.Category || 'non défini',
        canton: institution.Canton || 'non défini',
        locality: institution.Locality || 'non défini',
        validCriteria: validCriteria.join(', '),
        seat,  // Valeur directement récupérée de la DB ou calculée sinon
        praticienPrenom: pract.Prenom || '',
        praticienNom: pract.Nom || '',
        praticienMail: pract.Mail || ''
      })
    }
  })
  return result
})

/* ---------------------------
   Gestion des documents pour chaque affectation
--------------------------- */
const upload = ref({})

const handleFileSelection = (event, assignmentKey) => {
  if (!upload.value[assignmentKey]) {
    upload.value[assignmentKey] = []
  }
  const selectedFiles = Array.from(event.files || event.target.files)
  selectedFiles.forEach((file) => {
    const docId = Date.now().toString() + '_' + file.name
    // Création d'un objet document temporaire
    const doc = {
      docId,
      fileName: file.name,
      tempName: file.name,
      file, // conserver le fichier pour l'upload
      isRenaming: false,
      documentURL: ''
    }
    upload.value[assignmentKey].push(doc)
  })
}

const uploadDocuments = async (assignmentKey) => {
  if (!upload.value[assignmentKey] || upload.value[assignmentKey].length === 0) {

    toast.add({ severity: 'warn', summary: 'Avertissement', detail: 'Aucun nouveau fichier sélectionné.', life: 4000 });
    return;

    alert('Aucun nouveau fichier sélectionné.')
    return

  }
  const docsArray = upload.value[assignmentKey]
  const updatedDocs = []
  for (const doc of docsArray) {
    try {
      const fileRef = storageRef(storage, `documents/${assignmentKey}/${doc.docId}`)
      await uploadBytes(fileRef, doc.file)
      const downloadURL = await getDownloadURL(fileRef)
      doc.documentURL = downloadURL
      updatedDocs.push(doc)
    } catch (error) {
      console.error("Erreur d'upload pour le fichier", doc.fileName, error)
    }
  }
  // Une fois uploadés, mise à jour de la liste des documents
  upload.value[assignmentKey] = updatedDocs
}

const openDocument = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

const saveDocName = async (assignmentKey, doc) => {
  if (!doc.tempName) {

    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Le nom du fichier ne peut être vide.', life: 4000 });
    return;

    alert('Le nom du fichier ne peut être vide.')
    return

  }
  doc.fileName = doc.tempName
  doc.isRenaming = false
  // Ici, mettez à jour la BDD si nécessaire
}

const cancelRename = (doc) => {
  doc.isRenaming = false
  doc.tempName = doc.fileName
}

const confirmDelete = async (assignmentKey, docId, fileName) => {
  const confirmation = window.confirm(`Supprimer le document « ${fileName} » ?`)
  if (!confirmation) return
  if (!upload.value[assignmentKey]) return
  const docsArray = upload.value[assignmentKey]
  const docToRemove = docsArray.find((doc) => doc.docId === docId)
  if (!docToRemove) return
  const fileRef = storageRef(storage, `documents/${assignmentKey}/${docId}`)
  try {
    await deleteObject(fileRef)
  } catch (error) {
    console.error('Erreur lors de la suppression du document avec docId =', docId, error)
  }
  upload.value[assignmentKey] = docsArray.filter((doc) => doc.docId !== docId)
}

/* ---------------------------
   Navigation vers la page de l'institution
--------------------------- */
const navigateToInstitution = (instId) => {
  if (instId) {
    router.push({ name: 'InstitutionView', params: { id: instId } });
  }
};

onMounted(() => {
  fetchInstitutions()
  fetchPlaces()
  fetchUsers()
  fetchStudents()
  fetchPraticienFormateurs()
  fetchAssignmentsData()
})
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

.surfaces-card {
  background-color: var(--surface-card);
  padding: 2rem;
  border-radius: 2rem;
}

.details-btn {
  min-width: 200px;
  width: 200px;
  height: 32px;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.ml-3 {
  margin-left: 1rem;
}

/* --- Responsive Mobile Styles --- */
@media (max-width: 991px) {
  .grid {
    gap: 1.2rem !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 0 1.2rem;
    justify-content: center;
  }
  .surfaces-card.shadow-2.mb-3.flex.flex-column.gap-2 {
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
  h4.m-0 {
    margin: 0 !important;
    width: 100% !important;
    text-align: center;
    font-size: 1.2rem;
  }
  .list-none.p-0.m-2 {
    padding: 0 !important;
    margin: 0 !important;
  }
  .m-2 {
    margin-left: 0.4rem !important;
    margin-right: 0.4rem !important;
  }
}
@media (max-width: 600px) {
  .grid, .surfaces-card.shadow-2.mb-3.flex.flex-column.gap-2 {
    padding-left: 0.4rem !important;
    padding-right: 0.4rem !important;
  }
}
</style>
