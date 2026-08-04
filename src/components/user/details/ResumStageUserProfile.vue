<template>
  <div>
  <!-- Critères Validés (Agrégation) -->
  <h5 class="mb-4 m-2">Critères Validéss</h5>
  <div v-if="isStagesLoading" class="profile-section-state">
    <i class="pi pi-spin pi-spinner mr-2"></i>
    Chargement des stages et critères...
  </div>
  <div v-else-if="stagesLoadError" class="profile-section-state error">
    <i class="pi pi-exclamation-triangle mr-2"></i>
    {{ stagesLoadError }}
  </div>
  <template v-else>
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
    <p class="text-secondary empty-state-text">Aucun critère validé.</p>
  </div>

  <!-- institutions pour lesquelles l'étudiant a validé des critères -->
  <h5 class="mb-4 m-2">Anciennes places</h5>


  <div v-if="assignedPlaces && assignedPlaces.length">
    <div
      v-for="(place, index) in assignedPlaces"
      :key="place._key"
      class="stage-card mb-4 shadow-2 flex flex-column gap-2"
      :class="getStageCardClass(place.status)"
    >
      <!-- Ligne du titre + statut + bouton -->
      <div class="flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
        <div class="flex align-items-center gap-2 flex-wrap">
          <h4 class="m-0">Formation Pratique {{ place._displayFpNumber || (index + 1) }}</h4>
          <Tag v-if="place.year" :value="place.year" severity="secondary" class="text-xs" />
          <Tag :value="getStatusLabel(place.status)" :severity="getStatusSeverity(place.status)" :icon="getStatusIcon(place.status)" />
        </div>
        <Button
          label="Voir les détails"
          icon="pi pi-arrow-right"
          class="text-sm p-button-outlined p-button-primary details-btn"
          style="height: 32px; width: 200px; min-width: 200px;"
          :disabled="!place.InstitutionId"
          @click="navigateToInstitution(place.InstitutionId)"
        />
      </div>

      <!-- Bandeau d'échec -->
      <div v-if="place.status === 'echec'" class="status-banner status-banner-echec">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-times-circle text-red-600 text-xl"></i>
          <div>
            <span class="font-bold text-red-600">Échec de la formation</span>
            <span class="text-sm text-red-600 ml-2">
              Uniquement critère de langue : 
              <span class="font-bold">{{ place.DE ? 'DE (Allemand)' : (place.FR ? 'FR (Français)' : '') }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Bandeau d'arrêt -->
      <div v-if="place.status === 'arret'" class="status-banner status-banner-arret">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-ban text-yellow-600 text-xl"></i>
          <div>
            <span class="font-bold text-yellow-700">Arrêt de la formation</span>
            <div v-if="place.commentaire_arret" class="text-base text-yellow-600 mt-1">
              {{ place.commentaire_arret }}
            </div>
          </div>
        </div>
      </div>

      <!-- Bandeau réussi -->
      <div v-if="place.status === 'validee'" class="status-banner status-banner-validee">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-check-circle text-green-600 text-xl"></i>
          <span class="font-bold text-green-700">Formation validée — tous les critères acquis</span>
        </div>
      </div>

      <!-- Bandeau en attente -->
      <div v-if="!place.status || place.status === 'en_attente'" class="status-banner status-banner-attente">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-clock text-blue-600 text-xl"></i>
          <span class="font-bold text-blue-700">En attente de validation</span>
        </div>
      </div>

      <!-- Nom de l'institution + Domaine -->
      <div>
        <h6 class="m-2 font-bold">
          {{place.Institutionname}}
        </h6>
        <div class="m-2 flex flex-column gap-1">
          <div><span class="text-600">Domaine :</span> {{ place.NomPlace }}</div>
          <div class="flex align-items-center gap-1 flex-wrap">
            <span class="text-600">Critères :</span>
            <Tag v-for="crit in getValidCriterias(place)" :key="crit" :value="crit" severity="info" class="text-xs" />
            <span v-if="getValidCriterias(place).length === 0" class="text-400 text-sm">Aucun</span>
          </div>
          <div v-if="getPraticienFormateurInfos(place)">
            <span class="text-600">Praticien formateur :</span>
            <b>{{ getPraticienFormateurInfos(place) }}</b>
            <span v-if="getPraticienFormateurContact(place)" class="ml-2">
              — <a :href="'mailto:' + getPraticienFormateurContact(place)" class="text-primary font-bold" style="text-decoration: underline;">
                {{ getPraticienFormateurContact(place) }}
              </a>
            </span>
          </div>
        </div>
      </div>

      <!-- Documents -->
      <div>
        <h6 class="m-2">Documents liés à cette formation pratique</h6>
        <div
          class="mt-2"
          v-if="
            uploads[stageUploadsKey(place._displayFpNumber || (index + 1))] &&
            uploads[stageUploadsKey(place._displayFpNumber || (index + 1))].docs.length > 0
          "
        >
          <ul class="list-none p-0">
            <li
              v-for="doc in uploads[stageUploadsKey(place._displayFpNumber || (index + 1))].docs"
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
                  @click="saveDocName(doc)"
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
                    place._displayFpNumber || (index + 1),
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
          @select="($event) => handleFileSelection($event, place._displayFpNumber || (index + 1))"
        />
        <Button
          label="Envoyer documents"
          class="text-sm p-button-outlined p-button-primary"
          @click="uploadDocuments(place, place._displayFpNumber || (index + 1))"
        />
      </div>
    </div>
  </div>
  <div v-else>
    <p class="text-secondary empty-state-text">
      Aucune affectation PFP disponible pour cet utilisateur.
    </p>
  </div>
  </template>
  </div>
</template>


<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { supabase } from '@/supabase';
import {
  computeAggregatedCriteriaFromSources,
  extractStudentsPhysioFieldEntries,
  normalizeProfileStageEntries,
  parsePfpEntries
} from '@/utils/profileStages';

// Props reçues du parent
const props = defineProps({
  userProfile: {
    type: Object,
    default: null
  },
  userId: {
    type: String,
    required: true
  }
});

// Variable pour vérifier le rôle de l'utilisateur
const isAdmin = ref(false);

// Variables pour EditPFP1
const placesList = ref([]);
const selectedPFP1 = ref("");
const currentUserId = ref("");
const institutionsMap = ref({});
const searchQuery = ref("");
// eslint-disable-next-line no-unused-vars
const filteredPlaces = computed(() =>
  placesList.value.filter(place =>
    getPlaceLabel(place).toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

// eslint-disable-next-line no-unused-vars
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

// Récupère toutes les Places depuis Supabase
async function fetchPlaces() {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*');
    
    if (error) throw error;
    
    if (data) {
      placesList.value = data.map((place) => ({
        ...place,
        IDPlace: place.PlaceId || place.id || place.place_id,
        NomPlace: place.NomPlace || place.name || place.nom_place,
        InstitutionId: place.InstitutionId || place.institution_id,
        key: place.PlaceId || place.id || place.place_id
      }));
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des places:', error);
  }
}

// Récupère l'utilisateur connecté, sa PFP1 et vérifie s'il est admin
async function fetchCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    
    if (user) {
      currentUserId.value = user.id;
      
      // Récupère les données de l'utilisateur connecté depuis user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (profileData) {
        selectedPFP1.value = profileData.pfp1 || "";
        // Vérifie si l'utilisateur est un admin via le rôle
        isAdmin.value = profileData.role === 'admin';
      } else {
        isAdmin.value = false;
      }
    } else {
      isAdmin.value = false;
      currentUserId.value = "";
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    isAdmin.value = false;
    currentUserId.value = "";
  }
}

// Watcher pour détecter les changements de userProfile
watch(() => props.userProfile, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    processUserProfile()
  }
})

// Watcher pour rafraîchir les PFP quand les validations changent
watch(() => props.userId, async (newUserId, oldUserId) => {
  if (newUserId && (!oldUserId || newUserId !== oldUserId)) {
    await fetchStudentPfpList()
  }
})

onMounted(async () => {
  // Charger les places disponibles et l'utilisateur courant (pour l'édition)
  await fetchPlaces();
  await fetchCurrentUser();
  await fetchAllInstitutions();
  // Charger les institutions depuis le store
  await institutionsStore.fetchInstitutions();
  // Charger les praticiens formateurs
  await fetchPraticienFormateurs();
  // Charger explicitement les stages au montage (fiabilité affichage)
  await fetchStudentPfpList();
  if (props.userProfile) {
    await processUserProfile();
  }
})

// Récupère toutes les institutions depuis Supabase
async function fetchAllInstitutions() {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*');
    
    if (error) throw error;
    
    if (data) {
      // Convertir le tableau en map avec l'ID comme clé
      institutionsMap.value = data.reduce((acc, inst) => {
        const instId = inst.id || inst.institution_id;
        acc[instId] = {
          ...inst,
          Name: inst.name || inst.nom_institution
        };
        return acc;
      }, {});
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des institutions:', error);
  }
}


// Fonction de mise à jour de la PFP1
// eslint-disable-next-line no-unused-vars
async function updatePFP1() {
  if (!currentUserId.value || !selectedPFP1.value) {
    return;
  }

  try {
    // Récupérer l'étudiant depuis Supabase
    const { data: studentData, error: fetchError } = await supabase
      .from('StudentsPhysio')
      .select('*')
      .eq('user_id', currentUserId.value)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (studentData) {

      // On récupère la place sélectionnée pour en extraire le nom
      const selectedPlace = placesList.value.find(p => p.IDPlace === selectedPFP1.value);
      const selectedPlaceName = getPlaceName(selectedPlace);

      // --- Modification des données en local ---
      const fieldsToCopy = ['DE', 'FR', 'MSQ', 'REHAB', 'SYSINT', 'NEUROGER', 'AMBU', 'AIGU'];
      const placeCharacteristics = {};
      for (const field of fieldsToCopy) {
        placeCharacteristics[field] = selectedPlace[field] === 'true' || selectedPlace[field] === true;
      }

      const newPfpEntry = {
        id_pfp: selectedPFP1.value,
        nom_pfp: selectedPlace.NomPlace,
        selected_places: selectedPlace.key,
        nom_complet_pfp: selectedPlaceName,
        ...placeCharacteristics
      };

      // Préparer les données à mettre à jour
      let pfpValided = studentData.pfp_valided || [];
      if (!Array.isArray(pfpValided)) {
        pfpValided = [];
      }

      // Mettre à jour ou ajouter la nouvelle entrée
      const oldEntry = pfpValided[0] || {};
      pfpValided[0] = {
        ...oldEntry,
        ...newPfpEntry
      };

      const pfpInfo = studentData.pfpinfo || {};
      if (!pfpInfo.pfp1) pfpInfo.pfp1 = {};
      pfpInfo.pfp1.selected_stage_id = selectedPFP1.value;
      pfpInfo.pfp1.selected_stage_name = selectedPlaceName;

      // Mettre à jour dans Supabase
      const { error: updateError } = await supabase
        .from('StudentsPhysio')
        .update({
          pfp1a: true,
          pfpinfo: pfpInfo,
          pfp_valided: pfpValided,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUserId.value);

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('updatePFP1: Erreur lors de la mise à jour:', error);
  }
}

import { useRouter } from "vue-router";
import { useToast } from 'primevue/usetoast';
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import FileUpload from "primevue/fileupload";
import Tag from "primevue/tag";
import { useInstitutionsStore } from '@/stores/institutionsStore';

const toast = useToast();
const router = useRouter();
const institutionsStore = useInstitutionsStore();
const institutionsList = ref([]);

// Variables pour les praticiens formateurs
const praticienFormateurs = ref({});
const praticiensByInstitution = ref({});

// Liste PFP validées pour l'étudiant (depuis StudentsPhysio)
const studentPfpList = ref([]);
// Liste des résultats de votation (depuis student_result_vote)
const studentResultVotes = ref([]);
// Map des places pour récupérer les critères
const placesFullMap = ref(new Map());
const isStagesLoading = ref(false)
const stagesLoadError = ref('')

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

const getYearSortValue = (value) => {
  if (!value) return -1
  const str = String(value)
  const rangeMatch = str.match(/(\d{4})\s*-\s*(\d{4})/)
  if (rangeMatch) {
    const endYear = Number(rangeMatch[2])
    return Number.isFinite(endYear) ? endYear : -1
  }
  const singleMatch = str.match(/\d{4}/)
  if (singleMatch) {
    const year = Number(singleMatch[0])
    return Number.isFinite(year) ? year : -1
  }
  return -1
}

const normalizeLegacyPfpType = (entry) => {
  const explicitType = entry?.pfp_type || entry?.type_pfp || entry?.PfpType || ''
  if (explicitType) return explicitType

  const numericStage = Number(entry?.pfp_number || entry?.fp_number || entry?.formation_number)
  if (Number.isFinite(numericStage) && numericStage >= 1 && numericStage <= 4) {
    return `PFP${numericStage}`
  }

  return ''
}

// Construit la liste des places en fusionnant student_result_vote (priorité) + pfp_valided (backup/legacy)
const assignedPlaces = computed(() => {
  const results = []
  const seenStageKeys = new Set() // Déduplication globale entre les 2 sources
  const criteriaMap = {
    AMBU: 'ambu',
    DE: 'de',
    FR: 'fr',
    MSQ: 'msq',
    NEUROGER: 'neuroger',
    REHAB: 'rehab',
    SYSINT: 'sysint',
    AIGU: 'aigu',
  }

  // Normaliser PFP1A/PFP1B → PFP1
  const normalizePfp = (t) => (t === 'PFP1A' || t === 'PFP1B') ? 'PFP1' : t
  const fpNumberMap = { 'PFP1': 1, 'PFP2': 2, 'PFP3': 3, 'PFP4': 4 }

  // 1. Source prioritaire : student_result_vote (stages attribués par l'algo)
  ;(studentResultVotes.value || []).forEach((rv, idx) => {
    const placeId = rv.assigned_place_id || ''
    if (!placeId) return

    const placeName = rv.assigned_place_name || ''

    const pfpType = rv.pfp_type || ''
    const yearKey = rv.year ? String(rv.year) : 'no-year'
    const normalizedType = normalizePfp(pfpType)
    const dedupKey = (placeId || normalizedType)
      ? `${placeId || 'no-place'}_${normalizedType || 'no-type'}_${yearKey}`
      : `published_${idx}`
    if (seenStageKeys.has(dedupKey)) return
    seenStageKeys.add(dedupKey)

    let status = 'en_attente'
    if (rv.pfp_validee) status = 'validee'
    else if (rv.pfp_echec) status = 'echec'
    else if (rv.pfp_arret) status = 'arret'
    const placeData = getPlaceFromStage(rv)

    const item = {
      _key: `rv_${idx}`,
      IDPlace: placeId,
      InstitutionId: placeData?.InstitutionId || '',
      NomPlace: placeName || placeData?.NomPlace || placeData?.name || '',
      seatIndex: null,
      Institutionname: rv.assigned_institution_name || placeData?.InstitutionName || placeData?.Institution || getInstitutionNameById(placeData?.InstitutionId) || '',
      pfp_type: normalizedType,
      _fpNumber: fpNumberMap[normalizedType] || null,
      status,
      commentaire_arret: rv.commentaire_arret || null,
      assigned_rank: rv.assigned_rank || null,
      assigned_praticien_id: rv.assigned_praticien_id || null,
      year: rv.year || null
    }
    // Charger les critères depuis la place si disponible
    if (placeData) {
      Object.entries(criteriaMap).forEach(([up]) => {
        item[up] = placeData[up] === true || placeData[up] === 'true' || placeData[up] === 1
      })
    } else {
      Object.keys(criteriaMap).forEach(up => { item[up] = false })
    }
    results.push(item)
  })

  // 2. Source backup : pfp_valided (stages historiques/legacy)
  ;(studentPfpList.value || []).forEach((pfp, idx) => {
    const placeId = pfp.id_pfp || pfp.ID_PFP || pfp.PlaceId || ''
    if (!placeId) return

    const placeData = getPlaceFromStage(pfp)
    const placeName = pfp.NomPlace || pfp.nom_pfp || pfp.Nom_PFP || placeData?.NomPlace || placeData?.name || ''

    const rawType = normalizeLegacyPfpType(pfp)
    const pfpType = normalizePfp(rawType)
    const yearKey = pfp.year ? String(pfp.year) : 'no-year'
    const dedupKey = (placeId || pfpType)
      ? `${placeId || 'no-place'}_${pfpType || 'no-type'}_${yearKey}`
      : `legacy_${idx}`
    if (seenStageKeys.has(dedupKey)) return
    seenStageKeys.add(dedupKey)

    const item = {
      _key: `pfp_${idx}`,
      IDPlace: placeId,
      InstitutionId: pfp.InstitutionId || pfp.Institution_id || pfp.institution_id || placeData?.InstitutionId || '',
      NomPlace: placeName,
      seatIndex: pfp.seat || null,
      Institutionname: pfp.InstitutionName || pfp.institution_name || pfp.Institution || placeData?.InstitutionName || placeData?.Institution || getInstitutionNameById(pfp.InstitutionId || pfp.Institution_id || pfp.institution_id || placeData?.InstitutionId) || '',
      pfp_type: pfpType || null,
      _fpNumber: fpNumberMap[pfpType] || Number(pfp.pfp_number || pfp.fp_number || pfp.formation_number) || null,
      status: pfp.status || 'validee',
      commentaire_arret: pfp.commentaire_arret || pfp.commentaireArret || pfp.CommentaireArret || null,
      assigned_praticien_id: pfp.assigned_praticien_id || null,
      year: pfp.year || null
    }
    Object.entries(criteriaMap).forEach(([up, low]) => {
      item[up] =
        normalizeCriterionValue(pfp[low]) ||
        normalizeCriterionValue(pfp[up]) ||
        normalizeCriterionValue(placeData?.[up])
    })
    results.push(item)
  })

  // Pour les stages en attente sur la même place, garder uniquement l'entrée la plus récente
  const latestPendingByPlace = new Map()
  results.forEach((item) => {
    const isPending = !item.status || item.status === 'en_attente'
    const placeId = item.IDPlace || null
    if (!isPending || !placeId) return

    const current = latestPendingByPlace.get(placeId)
    if (!current) {
      latestPendingByPlace.set(placeId, item)
      return
    }

    const currentYear = getYearSortValue(current.year)
    const itemYear = getYearSortValue(item.year)
    if (itemYear > currentYear) {
      latestPendingByPlace.set(placeId, item)
      return
    }
    if (itemYear === currentYear) {
      const currentFp = current._fpNumber || 0
      const itemFp = item._fpNumber || 0
      if (itemFp > currentFp) {
        latestPendingByPlace.set(placeId, item)
      }
    }
  })

  const filteredResults = results.filter((item) => {
    const isPending = !item.status || item.status === 'en_attente'
    const placeId = item.IDPlace || null
    if (!isPending || !placeId) return true
    return latestPendingByPlace.get(placeId) === item
  })

  results.length = 0
  results.push(...filteredResults)

  // Trier d'abord par année (chronologique), puis par type de FP
  results.sort((a, b) => {
    const yearA = getYearSortValue(a.year)
    const yearB = getYearSortValue(b.year)
    if (yearA !== yearB) return yearA - yearB
    const fpA = a._fpNumber || 99
    const fpB = b._fpNumber || 99
    if (fpA !== fpB) return fpA - fpB
    return String(a._key || '').localeCompare(String(b._key || ''))
  })

  results.forEach((item, idx) => {
    item._displayFpNumber = idx + 1
  })

  return results
})

const getInstitutionNameById = (idInstitution) => {
  return institutionsStore.getInstitutionNameById(idInstitution);
};

const getPlaceFromMap = (placeId) => {
  if (!placeId) return null
  const direct = placesFullMap.value.get(placeId)
  if (direct) return direct
  const asString = placesFullMap.value.get(String(placeId))
  if (asString) return asString
  const asNumber = Number(placeId)
  if (Number.isFinite(asNumber)) {
    return placesFullMap.value.get(asNumber) || null
  }
  return null
}

const normalizeCriterionValue = (value) =>
  value === true ||
  value === 1 ||
  value === '1' ||
  (typeof value === 'string' && value.toLowerCase() === 'true')

const normalizeLookupValue = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const getStageResolvedPlaceId = (stage) =>
  stage?.assigned_place_id ||
  stage?.id_pfp ||
  stage?.ID_PFP ||
  stage?.PlaceId ||
  stage?.IDPlace ||
  stage?.selected_places ||
  stage?.selected_stage_id ||
  stage?.place_id ||
  null

const getPlaceInstitutionName = (place) =>
  place?.InstitutionName ||
  place?.Institution ||
  getInstitutionNameById(place?.InstitutionId) ||
  ''

const getStagePlaceName = (stage) =>
  normalizeLookupValue(
    stage?.NomPlace ||
      stage?.nom_pfp ||
      stage?.Nom_PFP ||
      stage?.selected_stage_name ||
      stage?.nom_complet_pfp ||
      stage?.domaine ||
      stage?.Domaine
  )

const getStageInstitutionName = (stage) => {
  const explicitInstitutionName =
    stage?.InstitutionName || stage?.institution_name || stage?.Institution || ''

  if (explicitInstitutionName) {
    return normalizeLookupValue(explicitInstitutionName)
  }

  const fullLabel = String(stage?.nom_complet_pfp || stage?.Nom_Complet_PFP || '').trim()
  const rawPlaceName =
    stage?.NomPlace || stage?.nom_pfp || stage?.Nom_PFP || stage?.selected_stage_name || ''

  if (!fullLabel || !rawPlaceName) return ''

  const normalizedFullLabel = normalizeLookupValue(fullLabel)
  const normalizedPlaceName = normalizeLookupValue(rawPlaceName)
  if (!normalizedFullLabel.startsWith(normalizedPlaceName)) return ''

  return normalizeLookupValue(fullLabel.slice(rawPlaceName.length))
}

const getUniquePlacesFromMap = () => {
  const seen = new Set()
  const places = []
  placesFullMap.value.forEach((place) => {
    if (!place) return
    const placeId = place.PlaceId || place.IDPlace || place.id || place.place_id || ''
    const dedupKey =
      String(placeId) ||
      `${normalizeLookupValue(place.NomPlace || place.name || place.nom_place)}__${normalizeLookupValue(getPlaceInstitutionName(place))}`
    if (!dedupKey || seen.has(dedupKey)) return
    seen.add(dedupKey)
    places.push(place)
  })
  return places
}

const getPlaceFromStage = (stage) => {
  const targetPlaceName = getStagePlaceName(stage)
  const explicitInstitutionId = stage?.InstitutionId || stage?.Institution_id || stage?.institution_id || null
  const targetInstitutionName = getStageInstitutionName(stage)

  const idCandidates = [
    getStageResolvedPlaceId(stage),
    stage?.selected_places,
    stage?.selected_stage_id,
    stage?.id
  ]

  for (const candidate of idCandidates) {
    const place = getPlaceFromMap(candidate)
    if (!place) continue

    if (!targetPlaceName) return place

    const resolvedPlaceName = normalizeLookupValue(place?.NomPlace || place?.name || place?.nom_place)
    if (resolvedPlaceName === targetPlaceName) return place
  }
  if (!targetPlaceName) return null

  const targetInstitutionId =
    explicitInstitutionId ||
    stage?.id_pfp ||
    stage?.ID_PFP ||
    null

  return (
    getUniquePlacesFromMap().find((place) => {
      const placeName = normalizeLookupValue(place?.NomPlace || place?.name || place?.nom_place)
      if (placeName !== targetPlaceName) return false

      if (targetInstitutionId) {
        return String(place?.InstitutionId || place?.institution_id || '') === String(targetInstitutionId)
      }

      if (targetInstitutionName) {
        return normalizeLookupValue(getPlaceInstitutionName(place)) === targetInstitutionName
      }

      return true
    }) || null
  )
}

// eslint-disable-next-line no-unused-vars
const applyCriteriaFromSource = (target, source) => {
  if (!source) return
  criteriaList.forEach((crit) => {
    const rawValue =
      source[crit] !== undefined && source[crit] !== null ? source[crit] : source[crit.toLowerCase()]
    if (normalizeCriterionValue(rawValue)) {
      target[crit] = true
    }
  })
}

// Retourne la liste des critères à true pour une place donnée
function getValidCriterias(place) {
  return criteriaList.filter((key) => normalizeCriterionValue(place?.[key]))
}

// Retourne "Prénom Nom" du praticien formateur lié à l'institution
function getPraticienFormateurInfos(place) {
  if (place.assigned_praticien_id && praticienFormateurs.value[place.assigned_praticien_id]) {
    const p = praticienFormateurs.value[place.assigned_praticien_id]
    const prenom = p.Prenom ? p.Prenom.trim() : ''
    const nom = p.Nom ? p.Nom.trim() : ''
    return `${prenom} ${nom}`.trim()
  }

  const instId = place.InstitutionId || place.IDPlace
  const list = praticiensByInstitution.value[instId] || praticiensByInstitution.value[String(instId)] || []
  if (list.length > 0) {
    const p = list[0]
    const prenom = p.Prenom ? p.Prenom.trim() : ''
    const nom = p.Nom ? p.Nom.trim() : ''
    return `${prenom} ${nom}`.trim()
  }
  return ''
}

// Retourne le contact (email) du praticien formateur
function getPraticienFormateurContact(place) {
  if (place.assigned_praticien_id && praticienFormateurs.value[place.assigned_praticien_id]) {
    return praticienFormateurs.value[place.assigned_praticien_id].Mail || ''
  }

  const instId = place.InstitutionId || place.IDPlace
  const list = praticiensByInstitution.value[instId] || praticiensByInstitution.value[String(instId)] || []
  if (list.length > 0) {
    return list[0].Mail || ''
  }
  return ''
}

const fetchPraticienFormateurs = async () => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('id, institution, prenom, nom, mail')
    if (error) throw error
    const map = {}
    const byInst = {}
    ;(data || []).forEach(p => {
      map[p.id] = { Prenom: p.prenom || '', Nom: p.nom || '', Mail: p.mail || '' }
      map[String(p.id)] = { Prenom: p.prenom || '', Nom: p.nom || '', Mail: p.mail || '' }
      const instId = p.institution
      if (instId) {
        if (!byInst[instId]) byInst[instId] = []
        if (!byInst[String(instId)]) byInst[String(instId)] = byInst[instId]
        byInst[instId].push({ Prenom: p.prenom || '', Nom: p.nom || '', Mail: p.mail || '', id: p.id })
      }
    })
    praticienFormateurs.value = map
    praticiensByInstitution.value = byInst
  } catch (e) {
    praticienFormateurs.value = {}
    praticiensByInstitution.value = {}
  }
}

async function fetchStudentPfpList() {
  isStagesLoading.value = true
  stagesLoadError.value = ''
  try {
    // Charger student_result_vote (source prioritaire)
    const { data: rvData } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('user_id', props.userId)
    studentResultVotes.value = rvData || []
    // Construire la map des places pour les critères
    if (placesFullMap.value.size === 0) {
      const { data: placesData } = await supabase.from('places').select('*')
      if (placesData) {
        placesData.forEach(p => {
          const id = p.PlaceId || p.id || p.place_id
          if (id) {
            placesFullMap.value.set(id, p)
            placesFullMap.value.set(String(id), p)
            const numericId = Number(id)
            if (Number.isFinite(numericId)) {
              placesFullMap.value.set(numericId, p)
            }
          }
        })
      }
    }

    // Charger pfp_valided (source backup)
    const { data, error } = await supabase
      .from('StudentsPhysio')
      .select('pfp_valided, pfp2_data')
      .eq('user_id', props.userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    if (!data || data.length === 0) {
      studentPfpList.value = []
      return
    }

    const arr = extractStudentsPhysioFieldEntries(data, ['pfp_valided', 'pfp2_data'])
    
    studentPfpList.value = arr
    await loadUploadedDocsForAll()
  } catch (e) {
    studentPfpList.value = []
    stagesLoadError.value = 'Impossible de charger les stages pour le moment.'
  } finally {
    isStagesLoading.value = false
  }
}

// Fonction pour traiter les données du profil utilisateur
const processUserProfile = async () => {
  if (!props.userProfile) {
    institutionsList.value = [];
    return;
  }

  try {
    const studentData = props.userProfile;
    
    if (studentData.pfp_valided || studentData.pfp2_data) {
      // Parser pfp_valided (peut être string JSON, array ou objet)
      let pfpArray = normalizeProfileStageEntries(parsePfpEntries(studentData.pfp_valided))
      
      // Traiter pfp2_data (PFP2 BA24)
      const pfp2Val = studentData.pfp2_data
      if (pfp2Val) {
        if (Array.isArray(pfp2Val)) {
          pfpArray = [...pfpArray, ...pfp2Val]
        } else if (typeof pfp2Val === 'object') {
          pfpArray.push(pfp2Val)
        }
      }
      const validPfpEntries = pfpArray.filter((place) => {
        if (!(place.id_pfp || place.ID_PFP || place.PlaceId)) return false
        const rawStatus = String(place.status || place.Status || '').trim().toLowerCase()
        if (!rawStatus) return true
        return rawStatus === 'validee' || rawStatus === 'validée'
      });
      // Agrégation des domaines et critères
      const domainsByInstitution = {};
      const criteriaByInstitution = {};
      validPfpEntries.forEach((place) => {
        const instId = place.id_pfp || place.ID_PFP || place.PlaceId;
        if (place.domaine || place.NomPlace) {
          if (!domainsByInstitution[instId]) {
            domainsByInstitution[instId] = new Set();
          }
          domainsByInstitution[instId].add(place.domaine || place.NomPlace);
        }
        if (!criteriaByInstitution[instId]) {
          criteriaByInstitution[instId] = new Set();
        }
        criteriaList.forEach((crit) => {
          if (normalizeCriterionValue(place[crit]) || normalizeCriterionValue(place[crit.toLowerCase()])) {
            criteriaByInstitution[instId].add(crit);
          }
        });
      });
      const instIds = validPfpEntries
        .map((place) => place.InstitutionId || place.Institution_id || place.institution_id)
        .filter(Boolean);
      if (instIds.length > 0) {
        const { data: institutions, error: instError } = await supabase
          .from('institutions')
          .select('*')
          .in('InstitutionId', instIds);

        if (instError) throw instError;
        institutionsList.value = (institutions || [])
          .map((inst) => {
            const instId = inst.InstitutionId || inst.id || inst.institution_id;
            const domainSet = domainsByInstitution[instId];
            const criteriaSet = criteriaByInstitution[instId];
            const originalPfp = validPfpEntries.find(p => (p.InstitutionId || p.Institution_id || p.institution_id) === instId);
            return {
              ...inst,
              InstitutionId: instId,
              Name: inst.Name || inst.name || inst.nom_institution,
              Domaines: domainSet ? Array.from(domainSet) : [],
              CriteriaValides: criteriaSet ? Array.from(criteriaSet) : [],
              State: originalPfp ? (originalPfp.state || originalPfp.State) : undefined
            };
          });
      }
    }
  } catch (error) {
    institutionsList.value = [];
  }
};

const aggregatedCriteria = computed(() => {
  return computeAggregatedCriteriaFromSources({
    studentResultVotes: studentResultVotes.value || [],
    userProfile: props.userProfile,
    studentPfpList: studentPfpList.value || [],
    resolvePlaceFromStage: getPlaceFromStage,
    criteriaKeys: criteriaList
  });
});

// Vérifie si l'étudiant a une PFP1 validée
// eslint-disable-next-line no-unused-vars
const hasPFP1 = computed(() => {
  return (studentPfpList.value || []).some(pfp => {
    const pfpType = pfp.pfp_type || pfp.type_pfp || ''
    return pfpType === 'PFP1A' || pfpType === 'PFP1B' || pfpType === 'PFP1' // legacy data may still have PFP1A/PFP1B
  })
});

// Gestion des documents par institution
const uploads = ref({});
const stageUploadsKey = (formationNumber) => `pfp_${String(formationNumber || 'unknown')}`;
const STUDENT_DOCUMENT_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const STUDENT_DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;
const getStudentDocumentPath = (value) => {
  if (!value) return null;
  const marker = '/student-documents/';
  const markerIndex = value.indexOf(marker);
  return markerIndex >= 0
    ? decodeURIComponent(value.slice(markerIndex + marker.length).split('?')[0])
    : value;
};

const loadUploadedDocsForAll = async () => {
  try {
    const { data, error } = await supabase
      .from('student_documents')
      .select('*')
      .eq('user_id', props.userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const docsByFormation = new Map()
    ;(data || []).forEach((doc) => {
      const formationNumber = Number(doc.pfp_number)
      if (!Number.isFinite(formationNumber)) return
      if (!docsByFormation.has(formationNumber)) docsByFormation.set(formationNumber, [])
      docsByFormation.get(formationNumber).push({
        docId: doc.id,
        fileName: doc.file_name,
        documentURL: doc.document_url,
        timestamp: new Date(doc.created_at).getTime(),
        isRenaming: false,
        tempName: doc.file_name
      })
    })

    const nextUploads = {}
    assignedPlaces.value.forEach((place, index) => {
      const formationNumber = Number(place._displayFpNumber || (index + 1))
      const key = stageUploadsKey(formationNumber)
      nextUploads[key] = {
        docs: docsByFormation.get(formationNumber) || [],
        newFiles: uploads.value[key]?.newFiles || []
      }
    })

    uploads.value = nextUploads
  } catch (error) {
    console.error('Erreur lors du chargement des documents profil:', error)
  }
};

const handleFileSelection = (event, formationNumber) => {
  const key = stageUploadsKey(formationNumber);
  if (!uploads.value[key]) {
    uploads.value[key] = { docs: [], newFiles: [] };
  }
  // Pour FileUpload, l'événement contient un tableau de fichiers dans event.files
  const selectedFiles = Array.from(event.files || event.target.files);
  const invalidFile = selectedFiles.find((file) =>
    !STUDENT_DOCUMENT_ALLOWED_TYPES.includes(file.type) || file.size > STUDENT_DOCUMENT_MAX_SIZE
  );

  if (invalidFile) {
    const reason = !STUDENT_DOCUMENT_ALLOWED_TYPES.includes(invalidFile.type)
      ? `Type non supporte pour ${invalidFile.name}`
      : `${invalidFile.name} depasse la limite de 10 MB`;
    toast.add({ severity: 'warn', summary: 'Document', detail: reason, life: 4000 });
    return;
  }

  uploads.value[key].newFiles = selectedFiles;
};

const uploadDocuments = async (place, formationNumber) => {
  const key = stageUploadsKey(formationNumber);
  if (!uploads.value[key]) return;
  const newFiles = uploads.value[key].newFiles;
  if (!newFiles || newFiles.length === 0) {
    toast.add({ severity: 'warn', summary: 'Avertissement', detail: 'Aucun nouveau fichier sélectionné.', life: 4000 });
    return;
  }
  
  const existingDocs = uploads.value[key].docs || [];
  for (const file of newFiles) {
    try {
      const timestamp = Date.now();
      const placeId = place?.IDPlace || place?.InstitutionId || 'unknown-place'
      const institutionId = place?.InstitutionId || place?.IDPlace || null
      const fileName = `${props.userId}/pfp-${formationNumber}/${placeId}/${timestamp}_${file.name}`;
      
      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store the private object path. A short-lived signed URL is created only when opening it.
      const downloadURL = fileName;

      // Créer une entrée dans la table student_documents
      const { data: docData, error: docError } = await supabase
        .from('student_documents')
        .insert({
          user_id: props.userId,
          institution_id: institutionId,
          pfp_number: formationNumber,
          file_name: file.name,
          document_url: downloadURL,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (docError) throw docError;

      existingDocs.push({
        docId: docData.id,
        fileName: file.name,
        documentURL: downloadURL,
        timestamp: timestamp,
        isRenaming: false,
        tempName: file.name
      });
      
      toast.add({ severity: 'success', summary: 'Succès', detail: `Document "${file.name}" uploadé avec succès`, life: 3000 });
    } catch (error) {
      console.error("Erreur d'upload pour le fichier", file.name, error);
      toast.add({ severity: 'error', summary: 'Erreur', detail: `Erreur lors de l'upload de "${file.name}"`, life: 4000 });
    }
  }
  
  uploads.value[key].docs = existingDocs;
  uploads.value[key].newFiles = [];
};

const cancelRename = (doc) => {
  doc.isRenaming = false;
  doc.tempName = doc.fileName;
};

const saveDocName = async (doc) => {
  if (!doc.tempName) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Le nom du fichier ne peut être vide.', life: 4000 });
    return;
  }
  
  try {
    // Mettre à jour le nom du fichier dans Supabase
    const { error } = await supabase
      .from('student_documents')
      .update({ file_name: doc.tempName })
      .eq('id', doc.docId);

    if (error) throw error;

    doc.fileName = doc.tempName;
    doc.isRenaming = false;
    
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Nom du document mis à jour', life: 3000 });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du nouveau nom :", error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde', life: 4000 });
  }
};

const confirmDelete = (formationNumber, docId, fileName) => {
  const confirmation = window.confirm(`Supprimer le document « ${fileName} » ?`);
  if (confirmation) {
    deleteDocument(formationNumber, docId);
  }
};

const deleteDocument = async (formationNumber, docId) => {
  const key = stageUploadsKey(formationNumber);
  if (!uploads.value[key] || !uploads.value[key].docs) return;
  const existingDocs = uploads.value[key].docs;
  const docToRemove = existingDocs.find((doc) => doc.docId === docId);
  if (!docToRemove) return;

  try {
    // Récupérer le document pour obtenir l'URL de stockage
    const { data: docData, error: fetchError } = await supabase
      .from('student_documents')
      .select('document_url')
      .eq('id', docId)
      .single();

    if (fetchError) throw fetchError;

    // Extraire le chemin du fichier depuis l'URL
    if (docData && docData.document_url) {
      const filePath = getStudentDocumentPath(docData.document_url);
      if (filePath) {
        // Supprimer du Storage
        const { error: storageError } = await supabase.storage
          .from('student-documents')
          .remove([filePath]);

        void storageError
      }
    }

    // Supprimer l'entrée de la base de données
    const { error: deleteError } = await supabase
      .from('student_documents')
      .delete()
      .eq('id', docId);

    if (deleteError) throw deleteError;

    const updatedDocs = existingDocs.filter((doc) => doc.docId !== docId);
    uploads.value[key].docs = updatedDocs;
    
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Document supprimé', life: 3000 });
  } catch (error) {
    console.error("Erreur lors de la suppression du document:", error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression', life: 4000 });
  }
};

const openDocument = async (storedPath) => {
  const filePath = getStudentDocumentPath(storedPath);
  if (!filePath) return;
  const { data, error } = await supabase.storage
    .from('student-documents')
    .createSignedUrl(filePath, 60);
  if (error) {
    toast.add({ severity: 'error', summary: 'Document', detail: 'Impossible d’ouvrir ce document.', life: 4000 });
    return;
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
};

const navigateToInstitution = (instId) => {
  if (instId) {
    router.push({ name: "InstitutionView", params: { id: instId } });
  }
};

// --- Fonctions d'affichage du statut ---
const getStatusLabel = (status) => {
  if (status === 'validee') return 'Réussi'
  if (status === 'echec') return 'Échec'
  if (status === 'arret') return 'Arrêt'
  return 'En attente'
}

const getStatusSeverity = (status) => {
  if (status === 'validee') return 'success'
  if (status === 'echec') return 'danger'
  if (status === 'arret') return 'warning'
  return 'info'
}

const getStatusIcon = (status) => {
  if (status === 'validee') return 'pi pi-check-circle'
  if (status === 'echec') return 'pi pi-times-circle'
  if (status === 'arret') return 'pi pi-ban'
  return 'pi pi-clock'
}

const getStageCardClass = (status) => {
  if (status === 'validee') return 'stage-card-validee'
  if (status === 'echec') return 'stage-card-echec'
  if (status === 'arret') return 'stage-card-arret'
  return 'stage-card-attente'
}


</script>

<style scoped>
/* --- Stage card base --- */
.stage-card {
  background-color: var(--surface-card);
  padding: 1.5rem 2rem;
  border-radius: 12px;
  border-left: 5px solid #cbd5e1;
  transition: box-shadow 0.2s;
  min-height: 200px;
}
.stage-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* --- Status-specific card borders --- */
.stage-card-validee {
  border-left-color: #22c55e;
}
.stage-card-echec {
  border-left-color: #ef4444;
}
.stage-card-arret {
  border-left-color: #f59e0b;
}
.stage-card-attente {
  border-left-color: #3b82f6;
}

/* --- Status banners --- */
.status-banner {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.25rem;
}
.status-banner-validee {
  background-color: #f0fdf4;
  border-left: 3px solid #22c55e;
}
.status-banner-echec {
  background-color: #fef2f2;
  border-left: 3px solid #ef4444;
}
.status-banner-arret {
  background-color: #fffbeb;
  border-left: 3px solid #f59e0b;
}
.status-banner-attente {
  background-color: #eff6ff;
  border-left: 3px solid #3b82f6;
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

.profile-section-state {
  background: var(--surface-card);
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 0.8rem;
  padding: 0.85rem 1rem;
  margin: 0.75rem 0.5rem 1rem;
  font-weight: 500;
  color: var(--text-color, #1f2937);
  display: flex;
  align-items: center;
}

.profile-section-state.error {
  border-color: #fca5a5;
  color: #b91c1c;
}

.empty-state-text {
  background: var(--surface-card);
  border: 1px dashed var(--surface-border, #cbd5e1);
  border-radius: 0.7rem;
  padding: 0.7rem 0.9rem;
  margin: 0.2rem 0.5rem 1rem;
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
  .stage-card {
    padding: 1.5rem 1.2rem !important;
    margin: 1.2rem 0 !important;
    min-width: 0;
    border-radius: 12px;
  }
  h4.m-0 {
    margin: 0 !important;
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
  .grid.m-2, .stage-card {
    padding-left: 0.4rem !important;
    padding-right: 0.4rem !important;
  }
  .criteria-card {
    min-width: 100px;
    padding: 1rem 0.5rem;
  }
}
</style>

