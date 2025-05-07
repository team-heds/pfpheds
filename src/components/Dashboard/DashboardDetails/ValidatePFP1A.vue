<template>

      <Navbar />

  <div>
    <div class="page-title">
      <h1>Validation PFP1A</h1>
      <div class="actions-bar">
        <span class="students-count">Nombre d'étudiants : {{ pfp1aResults.length }}</span>
        <button class="btn-main" @click="validateAll">Mettre en validé tous les étudiants</button>
        <button class="btn-main" @click="showValidationAlert">Valider les résultats de la PFP1A</button>
      </div>
    </div>
    <div class="container">
      <div class="validate-table-wrapper">
        <table class="custom-datatable validate-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Institution</th>
              <th>Domaine</th>
              <th>idInstitution</th>
              <th>idPlace</th>
              <th>Nom PF</th>
                <th>Remarques place</th>
              <th>Remarques étudiant</th>
              <th>Remarques Stages</th>
              <th>Réussi</th>
              <th>Échec</th>
              <th>Arrêt</th>
              <th>ID ligne Validation</th>
              <th>Éditer place</th>
            </tr>
          </thead>
          <tbody v-if="!loading">
            <tr v-for="(result, idx) in pfp1aResults" :key="idx">
              <td>{{ result.nom }}</td>
              <td>{{ result.Name }}</td>
              <td>{{ result.Domaine }}</td>
              <td>{{ result.IdInstitution }}</td>
              <td>{{ result.placeKey }}</td>
              <td>{{ getPraticienName(result.IdInstitution) }}</td>
              <td>
                <input type="text" v-model="result.remarquesPlace" class="table-input" @change="saveRow(result)" placeholder="Remarques place..." />
              </td>
              <td>
                <input type="text" v-model="result.remarquesEtudiant" class="table-input" @change="saveRow(result)" placeholder="Remarques étudiant..." />
              </td>
              <td>
                <textarea v-model="result.remarquesStages" class="remarques-stages-input" placeholder="Remarques..." rows="2" @change="saveRow(result)"></textarea>
              </td>
              <td><input type="checkbox" :checked="result.status === 'reussi'" @change="selectStatus(result, 'reussi')" /></td>
              <td><input type="checkbox" :checked="result.status === 'echec'" @change="selectStatus(result, 'echec')" /></td>
              <td><input type="checkbox" :checked="result.status === 'arret'" @change="selectStatus(result, 'arret')" /></td>
              <td>{{ (result.studentId || '') + '_' + (result.placeKey || '') }}</td>
              <td>
                <button class="btn-main" @click="openPlaceSelector(idx)">Éditer place</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="pfp1aResults.length === 0">Aucun résultat trouvé.</div>
      </div>
    </div>
  </div>
  <template v-if="showPlaceModal">
    <div class="modal-overlay" @click.self="closePlaceSelector">
      <div class="modal-content">
        <h3>Choisir une nouvelle place</h3>
        <div style="margin-bottom: 1rem;">
          <input
            v-model="searchPlace"
            type="text"
            placeholder="Rechercher une place ou une institution..."
            class="table-input"
            style="width: 100%; padding: 0.5em; border-radius: 6px; border: 1px solid #ccc;"
          />
        </div>
        <ul class="places-list">
          <li v-for="(place, key) in filteredPlaces" :key="key">
            <button class="place-select-btn" @click="selectPlace(selectedRowIdx, key)">
              ({{ institutionsNames[place.IDPlace] || institutionsNames[place.InstitutionId] || '...' }}) - {{ place.NomPlace }}
            </button>
          </li>
        </ul>
        <button class="btn-main cancel-btn" @click="closePlaceSelector">Annuler</button>
      </div>
    </div>
  </template>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import { ref as dbRef, onValue, set, get, child, update } from 'firebase/database';
import { db } from 'root/firebase';

import Navbar from "@/components/Utils/Navbar.vue";

export default {
  name: 'ValidatePFP1A',
  components: { Navbar },



export default {
  name: 'ValidatePFP1A',

  setup() {
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
      console.log(key);
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
      console.log(validationKey);
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

    return {
      pfp1aResults,
      loading,
      getStudentName,
      getIdPlace,
      getIdPraticien,
      getPraticienName,
      getInstitutionNameFromPlace,
      getPlaceRemark,
      getStudentRemark,
      validateAll,
      showValidationAlert,
      saveRow,
      selectStatus,
      openPlaceSelector,
      closePlaceSelector,
      selectPlace,
      showPlaceModal,
      selectedRowIdx,
      placesMap,
      institutionsNames,
      searchPlace,
      filteredPlaces
    };
  }
};
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  text-align: center;
}

.validate-table-wrapper {
  overflow-x: auto;
}

.container {
  background-color: var(--surface-card, #fff);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(80, 100, 180, 0.08);
  padding: 2rem 1.5rem;
  margin: 0 auto 2rem auto;
  max-width: 1200px;
}

.custom-datatable.validate-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--surface-card, #fff);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(80, 100, 180, 0.06);
  overflow: hidden;
  table-layout: fixed;
}

.custom-datatable th, .custom-datatable td {
  padding: 0.9rem 0.7rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  white-space: normal;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.custom-datatable th {
  background: var(--surface-card, #f4f6fa);
  color: var(--text-color, #374151);
  font-size: 1.07rem;
  font-weight: 600;
}

.custom-datatable tr:last-child td {
  border-bottom: none;
}

.custom-datatable tr {
  transition: border-bottom 0.18s;
}

.custom-datatable tr:hover {
  background: inherit;
  border-bottom: 3px solid #6366f1;
}

.custom-datatable input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  accent-color: #6366f1;
  cursor: pointer;
}

.actions-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.2rem;
  margin-bottom: 0.7rem;
}

.btn-main {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.45rem 1.1rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.18s;
}

.btn-main:hover {
  background: #4f46e5;
}

.students-count {
  font-size: 1.06rem;
  font-weight: 500;
  margin-right: 1.2rem;
  color: #444;
}

.remarques-stages-input {
  width: 100%;
  min-width: 100px;
  max-width: 220px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 0.32rem 0.5rem;
  font-size: 0.98rem;
  background: #f8fafc;
  transition: border-color 0.18s;
  font-family: inherit;
  font-weight: bold;
  color: #222;
  resize: vertical;
}

.remarques-stages-input:focus {
  outline: none;
  border-color: #6366f1;
  background: #fff;
}

.table-input {
  width: 100%;
  min-width: 60px;
  max-width: 180px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 0.25rem 0.4rem;
  font-size: 0.98rem;
  background: #f8fafc;
  transition: border-color 0.18s;
  font-family: inherit;
  color: #222;
}

.table-input:focus {
  outline: none;
  border-color: #6366f1;
  background: #fff;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(60, 60, 80, 0.28);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #fff;
  padding: 2rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 6px 32px rgba(80, 100, 180, 0.13);
  min-width: 320px;
  max-width: 420px;
}

.places-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 1.5rem 0;
  max-height: 260px;
  overflow-y: auto;
}

.place-select-btn {
  display: block;
  width: 100%;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.7rem 1rem;
  margin-bottom: 0.5rem;
  text-align: left;
  font-size: 1rem;
  color: #222;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.place-select-btn:hover {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

.cancel-btn {
  background: #e5e7eb;
  color: #222;
  margin-top: 0.7rem;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

.institution-name-modal {
  font-size: 0.95em;
  color: #666;
  margin-left: 8px;
}

@media (max-width: 992px) {
  .custom-datatable th, .custom-datatable td {
    font-size: 0.82rem;
    padding: 0.4rem;
  }
  .container {
    padding: 1rem 0.5rem;
  }
}

@media (max-width: 768px) {
  .custom-datatable {
    width: 100%;
  }
  .container {
    padding: 0.5rem 0.2rem;
  }
  .page-title h1 {
    font-size: 1.3rem;
  }
}

@media (max-width: 576px) {
  .custom-datatable th, .custom-datatable td {
    font-size: 0.75rem;
    padding: 0.3rem;
  }
  .page-title h1 {
    font-size: 1.1rem;
  }
}
</style>
