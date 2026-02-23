<template>
  <div>
  <!-- Critères Validés (Agrégation) -->
  <h5 class="mb-4 m-2">Critères Validéss</h5>
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
          <h4 class="m-0">Formation Pratique {{ place._fpNumber || (index + 1) }}</h4>
          <Tag v-if="place.year" :value="place.year" severity="secondary" class="text-xs" />
          <Tag :value="getStatusLabel(place.status)" :severity="getStatusSeverity(place.status)" :icon="getStatusIcon(place.status)" />
        </div>
        <Button
          label="Voir les détails"
          icon="pi pi-arrow-right"
          class="text-sm p-button-outlined p-button-primary details-btn"
          style="height: 32px; width: 200px; min-width: 200px;"
          @click="navigateToInstitution(place.IDPlace)"
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
            uploads[institutionsKey(place.IDPlace)] &&
            uploads[institutionsKey(place.IDPlace)].docs.length > 0
          "
        >
          <ul class="list-none p-0">
            <li
              v-for="(doc, docIndex) in uploads[institutionsKey(place.IDPlace)].docs"
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
                  @click="saveDocName(place.IDPlace, index + 1, doc)"
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
                    place.IDPlace,
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
          @select="($event) => handleFileSelection($event, place.IDPlace)"
        />
        <Button
          label="Envoyer documents"
          class="text-sm p-button-outlined p-button-primary"
          @click="uploadDocuments(place.IDPlace, index + 1)"
        />
      </div>
    </div>
  </div>
  <div v-else>
    <p class="text-secondary">
      Aucune affectation PFP disponible pour cet utilisateur.
    </p>
  </div>
  </div>
</template>


<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import { supabase } from '@/supabase';

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
        IDPlace: place.id || place.place_id,
        NomPlace: place.name || place.nom_place,
        InstitutionId: place.institution_id,
        key: place.id
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
watch(() => props.userProfile, (newVal) => {
  if (newVal) {
    console.log('👀 userProfile changé, retraitement...')
    processUserProfile()
  }
}, { immediate: true })

// Watcher pour rafraîchir les PFP quand les validations changent
watch(() => props.userId, (newUserId) => {
  if (newUserId) {
    console.log('👀 userId changé, rechargement PFP...')
    fetchStudentPfpList()
  }
}, { immediate: true })

// Watcher pour détecter les changements dans les données de l'utilisateur
watch(() => props.userProfile, (newProfile) => {
  if (newProfile) {
    console.log('👀 userProfile changé, retraitement...')
    processUserProfile()
  }
}, { immediate: true, deep: true })

// Watcher pour recharger les données périodiquement (toutes les 15 secondes)
let refreshInterval = null

onMounted(async () => {
  console.log('🚀 ResumStageUserProfile monté')
  // Charger les places disponibles et l'utilisateur courant (pour l'édition)
  await fetchPlaces();
  await fetchCurrentUser();
  await fetchAllInstitutions();
  // Charger les institutions depuis le store
  await institutionsStore.fetchInstitutions();
  // Charger les praticiens formateurs
  await fetchPraticienFormateurs();
  // Charger la liste PFP de l'étudiant
  await fetchStudentPfpList();
  // Charger les documents pour toutes les places
  await loadUploadedDocsForAll();
  // Traiter le profil utilisateur
  if (props.userProfile) {
    await processUserProfile();
  }

  // Rafraîchissement automatique toutes les 15 secondes
  refreshInterval = setInterval(async () => {
    console.log('🔄 Rafraîchissement automatique des PFP...')
    await fetchStudentPfpList()
    if (props.userProfile) {
      await processUserProfile()
    }
  }, 15000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
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
async function updatePFP1() {
  if (!currentUserId.value || !selectedPFP1.value) {
    console.warn('updatePFP1: currentUserId ou selectedPFP1 manquant', { currentUserId: currentUserId.value, selectedPFP1: selectedPFP1.value });
    return;
  }

  console.log("id " + currentUserId.value);

  try {
    // Récupérer l'étudiant depuis Supabase
    const { data: studentData, error: fetchError } = await supabase
      .from('StudentsPhysio')
      .select('*')
      .eq('user_id', currentUserId.value)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (studentData) {
      console.log('updatePFP1: studentData avant modification', studentData);

      // On récupère la place sélectionnée pour en extraire le nom
      const selectedPlace = placesList.value.find(p => p.IDPlace === selectedPFP1.value);
      const selectedPlaceName = getPlaceName(selectedPlace);
      console.log('updatePFP1: selectedPlace', selectedPlace);
      console.log('updatePFP1: selectedPlaceName', selectedPlaceName);

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

      console.log('updatePFP1: Mise à jour terminée avec succès.');
    } else {
      console.warn('updatePFP1: Aucun étudiant trouvé pour cet utilisateur !');
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
import Institution from "@/views/institutions/Institution.vue";

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

// Construit la liste des places en fusionnant student_result_vote (priorité) + pfp_valided (backup/legacy)
const assignedPlaces = computed(() => {
  const results = []
  const seenKeys = new Set() // Pour dédupliquer par placeId + pfp_type
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

  // 1. Source prioritaire : student_result_vote (stages attribués par l'algo)
  ;(studentResultVotes.value || []).forEach((rv, idx) => {
    const placeId = rv.assigned_place_id || ''
    const pfpType = rv.pfp_type || ''
    const dedupKey = `${placeId}_${pfpType}`
    if (seenKeys.has(dedupKey)) return
    seenKeys.add(dedupKey)

    let status = 'en_attente'
    if (rv.pfp_validee) status = 'validee'
    else if (rv.pfp_echec) status = 'echec'
    else if (rv.pfp_arret) status = 'arret'

    // Déduire le numéro de Formation Pratique depuis le pfp_type
    const fpNumberMap = { 'PFP1A': 1, 'PFP1B': 1, 'PFP2': 2, 'PFP3': 3, 'PFP4': 4 }
    const item = {
      _key: `rv_${idx}`,
      IDPlace: placeId,
      InstitutionId: '',
      NomPlace: rv.assigned_place_name || '',
      seatIndex: null,
      Institutionname: rv.assigned_institution_name || getInstitutionNameById(placeId) || '',
      pfp_type: pfpType,
      _fpNumber: fpNumberMap[pfpType] || null,
      status,
      commentaire_arret: rv.commentaire_arret || null,
      assigned_rank: rv.assigned_rank || null,
      year: rv.year || null
    }
    // Charger les critères depuis la place si disponible
    const placeData = placesFullMap.value.get(placeId)
    if (placeData) {
      Object.entries(criteriaMap).forEach(([up, low]) => {
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
    const pfpType = pfp.pfp_type || pfp.type_pfp || pfp.PfpType || ''
    const dedupKey = `${placeId}_${pfpType}`
    if (seenKeys.has(dedupKey)) return // Déjà présent depuis student_result_vote
    seenKeys.add(dedupKey)

    const item = {
      _key: `pfp_${idx}`,
      IDPlace: placeId,
      InstitutionId: pfp.InstitutionId || pfp.Institution_id || pfp.institution_id || '',
      NomPlace: pfp.NomPlace || pfp.nom_pfp || pfp.Nom_PFP || pfp.domaine || pfp.Domaine || '',
      seatIndex: pfp.seat || null,
      Institutionname: pfp.InstitutionName || pfp.Institution || getInstitutionNameById(pfp.ID_PFP || pfp.PlaceId) || '',
      pfp_type: pfpType || null,
      _fpNumber: idx + 1,
      status: pfp.status || 'validee',
      commentaire_arret: pfp.commentaire_arret || pfp.commentaireArret || pfp.CommentaireArret || null,
      year: pfp.year || null
    }
    Object.entries(criteriaMap).forEach(([up, low]) => {
      item[up] = pfp[low] === true || pfp[up] === true
    })
    results.push(item)
  })

  // Trier par _fpNumber puis par année
  results.sort((a, b) => {
    const fpA = a._fpNumber || 99
    const fpB = b._fpNumber || 99
    if (fpA !== fpB) return fpA - fpB
    return (a.year || '').localeCompare(b.year || '')
  })

  console.log('🎯 assignedPlaces (trié par _fpNumber):', results.map(r => ({
    fp: r._fpNumber, pfp_type: r.pfp_type, nom: r.NomPlace
  })))
  return results
})

const getInstitutionNameById = (idInstitution) => {
  console.log("ID inst" + idInstitution + " - " + institutionsStore.getInstitutionNameById(idInstitution));
  return institutionsStore.getInstitutionNameById(idInstitution);
};

// Retourne la liste des critères à true pour une place donnée
function getValidCriterias(place) {
  const criteriaKeys = ['AMBU', 'DE', 'FR', 'MSQ', 'NEUROGER', 'REHAB', 'SYSINT', 'AIGU'];
  return criteriaKeys.filter(key => {
    const val = place[key];
    return val === true || (typeof val === 'string' && val.toLowerCase() === 'true');
  });
}

// Retourne "Prénom Nom" du praticien formateur lié à l'institution
function getPraticienFormateurInfos(place) {
  const instId = place.IDPlace || place.InstitutionId
  const list = praticiensByInstitution.value[instId] || []
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
  const instId = place.IDPlace || place.InstitutionId
  const list = praticiensByInstitution.value[instId] || []
  if (list.length > 0) {
    return list[0].Mail || ''
  }
  return ''
}

const fetchPraticienFormateurs = async () => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('id, institution_id, prenom, nom, mail')
    if (error) throw error
    const map = {}
    const byInst = {}
    ;(data || []).forEach(p => {
      map[p.id] = { Prenom: p.prenom || '', Nom: p.nom || '', Mail: p.mail || '' }
      const instId = p.institution_id
      if (instId) {
        if (!byInst[instId]) byInst[instId] = []
        byInst[instId].push({ Prenom: p.prenom || '', Nom: p.nom || '', Mail: p.mail || '', id: p.id })
      }
    })
    praticienFormateurs.value = map
    praticiensByInstitution.value = byInst
  } catch (e) {
    console.warn('Erreur chargement praticiens formateurs (Supabase):', e.message)
    praticienFormateurs.value = {}
    praticiensByInstitution.value = {}
  }
}

const fetchStudentPfpList = async () => {
  try {
    console.log('🔍 Chargement PFP pour userId:', props.userId)

    // Charger student_result_vote (source prioritaire)
    const { data: rvData, error: rvError } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('user_id', props.userId)
    if (rvError) console.warn('⚠️ Erreur chargement student_result_vote:', rvError.message)
    studentResultVotes.value = rvData || []
    console.log('✅ student_result_vote chargé:', studentResultVotes.value.length, 'entrées')

    // Construire la map des places pour les critères
    if (placesFullMap.value.size === 0) {
      const { data: placesData } = await supabase.from('places').select('*')
      if (placesData) {
        placesData.forEach(p => {
          const id = p.PlaceId || p.id || p.place_id
          if (id) placesFullMap.value.set(id, p)
        })
      }
    }

    // Charger pfp_valided (source backup)
    const { data, error } = await supabase
      .from('StudentsPhysio')
      .select('pfp_valided, pfp2_data')
      .eq('user_id', props.userId)
      .maybeSingle()
    if (error) throw error
    console.log('✅ Données StudentsPhysio:', data)
    
    if (!data) {
      console.warn('⚠️ Aucune entrée StudentsPhysio pour cet utilisateur')
      studentPfpList.value = []
      return
    }

    let arr = []
    
    // Traiter pfp_valided (PFP1)
    const pfpVal = data.pfp_valided
    if (Array.isArray(pfpVal)) {
      arr = pfpVal
    }
    // Cas 2: pfp_valided est une string JSON (ex: "[]" ou "[{...}]")
    else if (typeof pfpVal === 'string') {
      try {
        const parsed = JSON.parse(pfpVal)
        arr = Array.isArray(parsed) ? parsed : []
      } catch (parseError) {
        console.warn('⚠️ Impossible de parser pfp_valided:', pfpVal)
        arr = []
      }
    }
    // Cas 3: pfp_valided est un objet (legacy Firebase)
    else if (pfpVal && typeof pfpVal === 'object') {
      arr = Object.values(pfpVal)
    }
    
    // Traiter pfp2_data (PFP2 BA24)
    const pfp2Val = data.pfp2_data
    if (pfp2Val) {
      if (Array.isArray(pfp2Val)) {
        arr = [...arr, ...pfp2Val]
      } else if (typeof pfp2Val === 'object') {
        arr.push(pfp2Val)
      }
    }
    
    studentPfpList.value = arr
    console.log('✅ PFP list chargée:', arr.length, 'entrées (pfp_valided + pfp2_data)', arr)
  } catch (e) {
    console.warn('⚠️ Erreur chargement PFP étudiant (Supabase):', e.message)
    studentPfpList.value = []
  }
}

// Fonction pour traiter les données du profil utilisateur
const processUserProfile = async () => {
  if (!props.userProfile) {
    console.warn('⚠️ Aucun userProfile fourni en prop');
    institutionsList.value = [];
    return;
  }

  try {
    console.log('🔍 ResumStage: Traitement profil pour userId:', props.userId)
    console.log('✅ Données userProfile reçues:', props.userProfile)
    
    const studentData = props.userProfile;
    
    if (studentData.pfp_valided || studentData.pfp2_data) {
      // Parser pfp_valided (peut être string JSON, array ou objet)
      let pfpArray = []
      const pfpVal = studentData.pfp_valided
      
      if (Array.isArray(pfpVal)) {
        pfpArray = pfpVal
      } else if (typeof pfpVal === 'string') {
        try {
          const parsed = JSON.parse(pfpVal)
          pfpArray = Array.isArray(parsed) ? parsed : []
        } catch (e) {
          console.warn('⚠️ Impossible de parser pfp_valided:', pfpVal)
          pfpArray = []
        }
      } else if (pfpVal && typeof pfpVal === 'object') {
        pfpArray = Object.values(pfpVal)
      }
      
      // Traiter pfp2_data (PFP2 BA24)
      const pfp2Val = studentData.pfp2_data
      if (pfp2Val) {
        if (Array.isArray(pfp2Val)) {
          pfpArray = [...pfpArray, ...pfp2Val]
        } else if (typeof pfp2Val === 'object') {
          pfpArray.push(pfp2Val)
        }
      }
      
      console.log('✅ PFP array parsé:', pfpArray.length, 'entrées (pfp_valided + pfp2_data)', pfpArray)
      const validPfpEntries = pfpArray.filter((place) => place.id_pfp || place.ID_PFP || place.PlaceId);
      console.log('✅ Entrées PFP valides:', validPfpEntries.length)
        
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
          if (place[crit] === true) {
            criteriaByInstitution[instId].add(crit);
          }
        });
      });
      
      console.log('✅ Agrégation terminée:', Object.keys(domainsByInstitution).length, 'institutions');
      const instIds = validPfpEntries.map((place) => place.id_pfp || place.ID_PFP || place.PlaceId).filter(Boolean);
      console.log('🔍 Chargement institutions pour IDs:', instIds)
      if (instIds.length > 0) {
        const { data: institutions, error: instError } = await supabase
          .from('institutions')
          .select('*')
          .in('id', instIds);

        if (instError) throw instError;
        console.log('✅ Institutions chargées:', institutions?.length || 0)

        institutionsList.value = (institutions || [])
          .map((inst) => {
            const instId = inst.id || inst.institution_id;
            const domainSet = domainsByInstitution[instId];
            const criteriaSet = criteriaByInstitution[instId];
            const originalPfp = validPfpEntries.find(p => (p.id_pfp || p.ID_PFP) === instId);
            return {
              ...inst,
              InstitutionId: instId,
              Name: inst.name || inst.nom_institution,
              Domaines: domainSet ? Array.from(domainSet) : [],
              CriteriaValides: criteriaSet ? Array.from(criteriaSet) : [],
              State: originalPfp ? (originalPfp.state || originalPfp.State) : undefined
            };
          });
        console.log('✅ Liste institutions finale:', institutionsList.value.length, 'entrées')
      }
    }
  } catch (error) {
    console.warn('Erreur traitement profil étudiant:', error.message);
    institutionsList.value = [];
  }
};

const aggregatedCriteria = computed(() => {
  const result = {};
  criteriaList.forEach((crit) => (result[crit] = false));
  if (props.userProfile && (props.userProfile.pfp_valided || props.userProfile.pfp2_data)) {
    let pfpArray = []

    // Traiter pfp_valided
    const pfpVal = props.userProfile.pfp_valided
    if (Array.isArray(pfpVal)) {
      pfpArray = pfpVal
    } else if (typeof pfpVal === 'string') {
      try {
        const parsed = JSON.parse(pfpVal)
        pfpArray = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        pfpArray = []
      }
    } else if (pfpVal && typeof pfpVal === 'object') {
      pfpArray = Object.values(pfpVal)
    }

    // Traiter pfp2_data
    const pfp2Val = props.userProfile.pfp2_data
    if (pfp2Val) {
      if (Array.isArray(pfp2Val)) {
        pfpArray = [...pfpArray, ...pfp2Val]
      } else if (typeof pfp2Val === 'object') {
        pfpArray.push(pfp2Val)
      }
    }

    pfpArray.forEach((pfp) => {
      criteriaList.forEach((crit) => {
        if (pfp[crit] === true) {
          result[crit] = true;
        }
      });
    });
  }
  return result;
});

// Vérifie si l'étudiant a une PFP1 validée
const hasPFP1 = computed(() => {
  return (studentPfpList.value || []).some(pfp => {
    const pfpType = pfp.pfp_type || pfp.type_pfp || ''
    return pfpType === 'PFP1A' || pfpType === 'PFP1B' || pfpType === 'PFP1'
  })
});

// Gestion des documents par institution
const uploads = ref({});
const institutionsKey = (instId) => `inst_${instId}`;

const loadUploadedDocsForAll = async () => {
  const places = assignedPlaces.value;
  for (let index = 0; index < places.length; index++) {
    const place = places[index];
    const formationNumber = index + 1;
    const key = institutionsKey(place.IDPlace);
    if (!uploads.value[key]) {
      uploads.value[key] = { docs: [], newFiles: [] };
    }
    
    try {
      // Récupérer les documents depuis Supabase
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('user_id', props.userId)
        .eq('pfp_number', formationNumber)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const docsArray = data.map(doc => ({
          docId: doc.id,
          fileName: doc.file_name,
          documentURL: doc.document_url,
          timestamp: new Date(doc.created_at).getTime(),
          isRenaming: false,
          tempName: doc.file_name
        }));
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
  }
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
  
  const existingDocs = uploads.value[key].docs || [];
  for (const file of newFiles) {
    try {
      const timestamp = Date.now();
      const fileName = `${props.userId}/${institutionId}/${timestamp}_${file.name}`;
      
      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName);

      const downloadURL = urlData.publicUrl;

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
      const urlParts = docData.document_url.split('/student-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0]; // Enlever les query params
        
        // Supprimer du Storage
        const { error: storageError } = await supabase.storage
          .from('student-documents')
          .remove([filePath]);

        if (storageError) {
          console.warn("Erreur lors de la suppression Storage:", storageError);
        }
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


const getPfpTagSeverity = (pfpType) => {
  if (pfpType === 'PFP1A' || pfpType === 'PFP1B') return 'info'
  if (pfpType === 'PFP2') return 'warning'
  if (pfpType === 'PFP3') return 'success'
  if (pfpType === 'PFP4') return 'secondary'
  return null
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
