<template>
  <Navbar />
  <div>
    <div>
      <h1>Validation PFP1A</h1>
      <div>
        <span>Nombre d'étudiants : {{ pfp1aResults.length }}</span>
        <Button label="Mettre en réussi tous les étudiants" class="p-button-primary" @click="validateAll" />
        <Button label="Valider les résultats de la PFP1A" class="p-button-success" @click="showValidationAlert" />
      </div>
    </div>
    <div>
      <DataTable :value="pfp1aResults" :loading="loading" responsiveLayout="scroll" v-if="!loading">
        <Column field="nom" header="Nom" />
        <Column field="Name" header="Institution" />
        <Column field="Domaine" header="Domaine" />
        <Column field="IdInstitution" header="idInstitution" />
        <Column field="placeKey" header="idPlace" />
        <Column header="Nom PF">
          <template #body="slotProps">{{ getPraticienName(slotProps.data.IdInstitution) }}</template>
        </Column>
        <Column header="Remarques place">
          <template #body="slotProps">
            <InputText v-model="slotProps.data.remarquesPlace" @change="saveRow(slotProps.data)" placeholder="Remarques place..." />
          </template>
        </Column>
        <Column header="Remarques étudiant">
          <template #body="slotProps">
            <InputText v-model="slotProps.data.remarquesEtudiant" @change="saveRow(slotProps.data)" placeholder="Remarques étudiant..." />
          </template>
        </Column>
        <Column header="Remarques Stages">
          <template #body="slotProps">
            <Textarea v-model="slotProps.data.remarquesStages" autoResize rows="2" @change="saveRow(slotProps.data)" placeholder="Remarques..." />
          </template>
        </Column>
        <Column header="Réussi">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.status" :binary="true" true-value="reussi" false-value="" @change="selectStatus(slotProps.data, 'reussi')" :checked="slotProps.data.status === 'reussi'" />
          </template>
        </Column>
        <Column header="Échec">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.status" :binary="true" true-value="echec" false-value="" @change="selectStatus(slotProps.data, 'echec')" :checked="slotProps.data.status === 'echec'" />
          </template>
        </Column>
        <Column header="Cas particulier">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.status" :binary="true" true-value="arret" false-value="" @change="selectStatus(slotProps.data, 'arret')" :checked="slotProps.data.status === 'arret'" />
          </template>
        </Column>
        <Column header="ID ligne Validation">
          <template #body="slotProps">{{ (slotProps.data.studentId || '') + '_' + (slotProps.data.placeKey || '') }}</template>
        </Column>
        <Column header="Éditer place">
          <template #body="slotProps">
            <Button label="Éditer place" class="p-button-info" @click="openPlaceSelector(pfp1aResults.indexOf(slotProps.data))" />
          </template>
        </Column>
      </DataTable>
      <div v-if="pfp1aResults.length === 0">Aucun résultat trouvé.</div>
    </div>
  </div>
  <Dialog v-model:visible="showPlaceModal" header="Choisir une nouvelle place" :modal="true" :closable="true" @hide="closePlaceSelector">
    <div style="margin-bottom: 1rem;">
      <InputText v-model="searchPlace" placeholder="Rechercher une place ou une institution..." style="width: 100%;" />
    </div>
    <ul>
      <li v-for="(place, key) in filteredPlaces" :key="key">
        <Button label="Sélectionner" class="p-button-text" @click="selectPlace(selectedRowIdx, key)" />
        {{ place }}
      </li>
    </ul>
  </Dialog>
</template>

<script setup>
import Navbar from '@/components/common/utils/Navbar.vue';
import { ref, onMounted, watch, computed } from 'vue';
import { ref as dbRef, onValue, set, get, child, update } from 'firebase/database';
import { db } from 'root/firebase';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';

const pfp1aResults = ref([]);
const loading = ref(true);
const usersMap = ref({});
const placesMap = ref({});
const praticiensMap = ref({});
const validationPath = '/ValidationEnAttente/BA24/PFP1A';
let initialLoad = true;
const showPlaceModal = ref(false);
const selectedRowIdx = ref(null);
const institutionsNameCache = ref({});
const institutionsNames = ref({});
const searchPlace = ref('');

onMounted(async () => {
  const usersRef = dbRef(db, '/Users');
  onValue(usersRef, (snapshot) => {
    const usersData = snapshot.val() || {};
    usersMap.value = usersData;
  });

  const placesRef = dbRef(db, '/Places');
  onValue(placesRef, (snapshot) => {
    const placesData = snapshot.val() || {};
    placesMap.value = placesData;
  });

  const praticiensRef = dbRef(db, '/PraticienFormateurs');
  onValue(praticiensRef, (snapshot) => {
    const praticiensData = snapshot.val() || {};
    praticiensMap.value = praticiensData;
  });

  const validationRef = dbRef(db, validationPath);
  const validationSnap = await get(validationRef);
  let validationData = validationSnap.exists() ? validationSnap.val() : {};

  const resultRef = dbRef(db, '/VotationResult/BA24/PFP1A');
  onValue(resultRef, (snapshot) => {
    const data = snapshot.val();
    let arr = [];
    if (Array.isArray(data)) {
      arr = data;
    } else if (data && typeof data === 'object') {
      arr = Object.values(data);
    }
    pfp1aResults.value = arr.map(result => {
      const key = result.studentId + '_' + (result.placeKey || '');
      const val = validationData[key] || {};
      return {
        ...result,
        status: val.status || '',
        remarquesStages: val.remarquesStages || '',
        nom: val.nom || getStudentName(result.studentId),
        Name: val.Name || result.Name,
        Domaine: val.Domaine || result.Domaine,
        IdInstitution: val.IdInstitution || result.IdInstitution,
        placeKey: val.placeKey || result.placeKey,
        remarquesPlace: val.remarquesPlace || getPlaceRemark(result.IdInstitution),
        remarquesEtudiant: val.remarquesEtudiant || getStudentRemark(result.studentId)
      };
    });
    loading.value = false;
    initialLoad = false;
  });
});

watch(pfp1aResults, (newVal) => {
  if (initialLoad) return;
  const updates = {};
  newVal.forEach(result => {
    const key = result.studentId + '_' + (result.placeKey || '');
    updates[key] = {
      status: result.status || '',
      remarquesStages: result.remarquesStages || '',
      nom: result.nom || '',
      Name: result.Name || '',
      Domaine: result.Domaine || '',
      IdInstitution: result.IdInstitution || '',
      placeKey: result.placeKey || '',
      remarquesPlace: result.remarquesPlace || '',
      remarquesEtudiant: result.remarquesEtudiant || ''
    };
  });
  update(dbRef(db, validationPath), updates);
}, { deep: true });

async function preloadInstitutionNames() {
  const allPlaces = Object.values(placesMap.value);
  for (const place of allPlaces) {
    const institutionId = place.InstitutionId || place.idInstitution || place.IDPlace;
    if (institutionId && !institutionsNames.value[place.IDPlace]  ) {
      try {
        const snap = await get(dbRef(db, `/Institutions/${institutionId}`));
        if (snap.exists()) {
          const institution = snap.val();
          institutionsNames.value[place.IDPlace] = institution.Name || institution.NomInstitution || institution.Nom || institutionId;
        } else {
          institutionsNames.value[place.IDPlace] = institutionId;
        }
      } catch (e) {
        institutionsNames.value[place.IDPlace] = institutionId;
      }
    }
  }
}

function getStudentName(studentId) {
  const user = usersMap.value[studentId];
  if (user) {
    return `${user.Prenom || ''} ${user.Nom || ''}`.trim();
  }
  return studentId;
}

function getIdPlace(idInstitution) {
  const places = Object.values(placesMap.value);
  const place = places.find(p => p.IDPlace === idInstitution);
  return place && place.IDPlace ? place.IDPlace : '';
}

function getIdPraticien(idInstitution) {
  const places = Object.values(placesMap.value);
  const place = places.find(p => p.IDPlace === idInstitution);
  return place && place.praticiensFormateurs && place.praticiensFormateurs.length > 0 ? place.praticiensFormateurs[0] : '';
}

function getPraticienName(idInstitution) {
  const places = Object.values(placesMap.value);
  const place = places.find(p => p.IDPlace === idInstitution);
  if (place && place.praticiensFormateurs && place.praticiensFormateurs.length > 0) {
    const idPF = place.praticiensFormateurs[0];
    const pf = praticiensMap.value[idPF];
    if (pf) {
      return `${pf.Prenom || ''} ${pf.Nom || ''}`.trim();
    }
  }
  return '';
}

async function getInstitutionNameFromPlace(placeKey) {
  if (!placeKey) return '';
  // Trouver la place correspondante dans placesMap
  const place = Object.values(placesMap.value).find(p => p.IDPlace === placeKey || p.key === placeKey);
  if (!place) return '';
  // Récupérer l'ID de l'institution liée à la place
  const institutionId = place.IDInstitution || place.idInstitution || place.IDPlace;
  if (!institutionId) return '';
  // Vérifier le cache local
  if (institutionsNameCache.value[institutionId]) {
    return institutionsNameCache.value[institutionId].Name;
  }
  // Fetch depuis Firebase si pas en cache
  try {
    const snap = await get(dbRef(db, `/Institutions/${institutionId}`));
    if (snap.exists()) {
      const institution = snap.val();
      const name = institution.Name || institution.NomInstitution || institution.Nom || institutionId;
      institutionsNameCache.value[institutionId] = name;
      return name;
    } else {
      institutionsNameCache.value[institutionId] = institutionId;
      return institutionId;
    }
  } catch (e) {
    return institutionId;
  }
}

function getPlaceRemark(idInstitution) {
  const places = Object.values(placesMap.value);
  const place = places.find(p => p.IDPlace === idInstitution);
  return place && place.Remarques ? place.Remarques : '';
}

function getStudentRemark(studentId) {
  const user = usersMap.value[studentId];
  return user && user.Bio ? user.Bio : '';
}

function validateAll() {
  pfp1aResults.value.forEach(result => {
    result.status = 'reussi';
  });
}

function showValidationAlert() {
  alert('Validation des résultats de la PFP1A !');
}

function saveRow(result) {
  // La clé d'identification ne doit jamais être modifiée ni sauvegardée comme champ
  const key = result.studentId + '_' + (result.placeKey || '');
  // On extrait uniquement les champs à sauvegarder
  const {
    status,
    remarquesStages,
    nom,
    Name,
    Domaine,
    IdInstitution,
    placeKey,
    remarquesPlace,
    remarquesEtudiant
  } = result;
  // On met à jour la base sous la clé calculée, sans jamais inclure l'ID ligne Validation
  update(dbRef(db, validationPath), {
    [key]: {
      status: status || '',
      remarquesStages: remarquesStages || '',
      nom: nom || '',
      Name: Name || '',
      Domaine: Domaine || '',
      IdInstitution: IdInstitution || '',
      placeKey: placeKey || '',
      remarquesPlace: remarquesPlace || '',
      remarquesEtudiant: remarquesEtudiant || ''
    }
  })
    .then(() => {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Sauvegarde réussie', type: 'success' } }));
    })
    .catch((error) => {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Erreur lors de la sauvegarde', type: 'error' } }));
      console.error('Erreur lors de la sauvegarde :', error);
    });
}

function selectStatus(result, value) {
  result.status = value;
  saveRow(result);
}

function openPlaceSelector(idx) {
  selectedRowIdx.value = idx;
  showPlaceModal.value = true;
  preloadInstitutionNames();
}

function closePlaceSelector() {
  showPlaceModal.value = false;
  selectedRowIdx.value = null;
}

function selectPlace(rowIdx, placeKey) {
  const oldResult = pfp1aResults.value[rowIdx];
  const nomInstitution = institutionsNames.value[placesMap.value[placeKey]?.IDPlace] || institutionsNames.value[placesMap.value[placeKey]?.InstitutionId] || '';
  const nomPlace = placesMap.value[placeKey]?.NomPlace || '';
  const confirmation = window.confirm(
    `Voulez-vous vraiment modifier la place de cet étudiant ?\n\nNouvelle place : ${nomPlace}\nInstitution : ${nomInstitution}`
  );
  if (!confirmation) {
    closePlaceSelector();
    return;
  }
  // Clé de validation AVANT modification (toujours la même, même si placeKey change)
  const validationKey = (oldResult.studentId || '') + '_' + (oldResult.placeKey || '');
  // Met à jour tous les champs dépendants de la nouvelle place
  oldResult.placeKey = placeKey;
  const newPlace = placesMap.value[placeKey];
  oldResult.idPlace = newPlace.IDPlace || newPlace.idPlace || placeKey;
  oldResult.Domaine = newPlace.Domaine || '';
  oldResult.IdInstitution = newPlace.InstitutionId || newPlace.IDInstitution || newPlace.idInstitution || '';
  oldResult.idInstitution = newPlace.InstitutionId || newPlace.IDInstitution || newPlace.idInstitution || '';
  oldResult.praticienName = newPlace.praticiensFormateurs && newPlace.praticiensFormateurs[0]
    ? (praticiensMap.value[newPlace.praticiensFormateurs[0]]?.Nom || '')
    : '';
  // Sauvegarde sous la clé d'origine, jamais une nouvelle clé
  // update(dbRef(db, validationPath), { [validationKey]: oldResult });
  closePlaceSelector();
}

const filteredPlaces = computed(() => {
  const term = searchPlace.value.trim().toLowerCase();
  if (!term) return Object.values(placesMap.value);
  return Object.values(placesMap.value).filter(place => {
    const nomPlace = (place.NomPlace || '').toLowerCase();
    const nomInstitution = (institutionsNames.value[place.IDPlace] || institutionsNames.value[place.InstitutionId] || '').toLowerCase();
    return nomPlace.includes(term) || nomInstitution.includes(term);
  });
});

</script>
