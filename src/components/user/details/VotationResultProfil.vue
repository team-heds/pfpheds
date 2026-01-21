<template>
  <div class="p-4">
     <div class="flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0">Formation pratique en cours</h5>
     
    </div>
    <div v-if="assignedPlaces.length">
      <div class="grid">
        <div
          v-for="(place, idx) in assignedPlaces"
          :key="place._key || idx"
          class="surfaces-card shadow-2 mb-3 flex flex-column gap-2"
          style="min-height: 120px; border-radius: 2rem; background: var(--surface-card);"
        >
          <!-- En-tête de la carte avec boutons -->
          <div class="flex align-items-center justify-content-between mb-2" style="height: 32px;">
            <div class="flex gap-2">
              <Button
                label="Voir les détails"
                icon="pi pi-arrow-right"
                class="text-sm p-button-outlined p-button-primary details-btn"
                style="height: 32px; width: 200px; min-width: 200px;"
                @click="navigateToInstitution(place.InstitutionId || place.IDPlace)"
              />
              <Button
                v-if="isAdmin"
                label="Supprimer"
                icon="pi pi-trash"
                class="text-sm p-button-outlined p-button-danger"
                style="height: 32px; width: 120px; min-width: 120px;"
                @click="confirmDeleteAssignment(place)"
              />
            </div>
          </div>
          <div>
            <h6 class="m-2 font-bold">
              {{ place.Institution_name || place.Institution || getInstitutionNameById(place.InstitutionId) }}
            </h6>
            <p class="m-2">
              Domaine : {{ place.NomPlace }}<br />
              Critères : {{ getValidCriterias(place).join(', ') }}<br />
              <span v-if="getPraticienFormateurInfos(place)">
                Praticien formateur :
                <b>{{ getPraticienFormateurInfos(place) }}</b>
                <Button
                  v-if="isAdmin"
                  icon="pi pi-pencil"
                  class="p-button-text p-button-plain p-button-sm ml-2"
                  @click="editPraticienFormateur(place)"
                  v-tooltip="'Changer le praticien formateur'"
                />
                <br />
                <span v-if="getPraticienFormateurContact(place)">
                  Contact :
                  <a :href="'mailto:' + getPraticienFormateurContact(place)" class="text-primary font-bold" style="text-decoration: underline;">
                    {{ getPraticienFormateurContact(place) }}
                  </a>
                </span>
              </span>
            </p>
            <div class="mt-2" v-if="getVotationType(place)">
              <span class="text-sm font-semibold">
                Type d'attribution :
                <span :class="getVotationTypeClass(place)">
                  {{ getVotationType(place) }}
                </span>
              </span>
            </div>
          </div>
          <!-- Documents -->
        </div>
      </div>
    </div>
    <div v-else>
      <!-- Si aucune formation en cours n'est trouvée -->
      <div class="text-center p-4">
        <p class="text-secondary mb-4">
          <i class="pi pi-info-circle mr-2"></i>
          Aucune affectation PFP disponible pour cet utilisateur.
        </p>
        
        <!-- Bouton pour ajouter une affectation (admin seulement) -->
        <Button 
          v-if="isAdmin"
          label="Ajouter une affectation PFP"
          icon="pi pi-plus"
          class="p-button-primary"
          @click="openAddAssignmentDialog"
        />
      </div>
    </div>
  </div>

  <!-- Boîte de dialogue pour ajouter une affectation -->
  <Dialog 
    v-model:visible="showAddAssignmentDialog" 
    modal 
    header="Ajouter une affectation PFP" 
    :style="{ width: '600px' }"
  >
    <div class="flex flex-column gap-3">
      <div class="field">
        <label for="place">Sélectionner une place</label>
        <Dropdown 
          id="place"
          v-model="newAssignment.assigned_place_id" 
          :options="availablePlaces"
          optionLabel="label"
          optionValue="value"
          placeholder="Choisir une place existante"
          class="w-full"
          filter
          @change="onPlaceSelected"
        />
      </div>
      
      <div class="field">
        <label>PFP actuelles de l'étudiant</label>
        <div class="border-1 border-round p-3" style="max-height: 200px; overflow-y: auto; background: #f8f9fa;">
          <div 
            v-for="pfp in allStudentPfps"
            :key="pfp.id_pfp || pfp.ID_PFP || pfp._key"
            class="flex align-items-center justify-content-between p-2 border-bottom-1 cursor-pointer hover:bg-gray-100"
            @click="selectExistingPfp(pfp)"
          >
            <div class="flex-1">
              <div class="font-semibold">{{ pfp.NomPlace || pfp.nom_pfp || 'PFP sans nom' }}</div>
              <div class="text-sm text-secondary">{{ pfp.InstitutionName || pfp.institution_name || 'Institution inconnue' }}</div>
              <div class="text-xs text-gray-500">Type: {{ pfp.pfp_type || 'Non spécifié' }}</div>
            </div>
            <div class="flex gap-2">
              <Button
                icon="pi pi-check"
                class="p-button-text p-button-sm p-button-success"
                v-tooltip="'Sélectionner cette PFP'"
                @click="selectExistingPfp(pfp)"
              />
            </div>
          </div>
        </div>
      </div>
      


      <div class="field">
        <label for="pfpType">Type PFP</label>
        <InputText 
          id="pfpType"
          v-model="newAssignment.pfp_type" 
          placeholder="Type de PFP (PFP1A, PFP1B, etc.)"
          class="w-full"
        />
      </div>
      
      <div class="field">
        <label for="praticien">Praticien formateur</label>
        <Dropdown 
          id="praticien"
          v-model="newAssignment.praticien_formateur" 
          :options="availablePraticiens"
          optionLabel="label"
          optionValue="value"
          placeholder="Sélectionner un praticien formateur (pré-rempli depuis la PFP)"
          class="w-full"
          filter
        />
      </div>
    </div>
    
    <template #footer>
      <Button label="Annuler" severity="secondary" outlined @click="cancelAddAssignment" />
      <Button label="Ajouter" @click="confirmAddAssignment" />
    </template>
  </Dialog>



<!-- Boîte de dialogue pour modifier le praticien formateur -->
  <Dialog 
    v-model:visible="showEditPraticienDialog" 
    modal 
    header="Modifier le praticien formateur" 
    :style="{ width: '500px' }"
  >
    <div class="flex flex-column gap-3">
      <div class="field">
        <label for="praticien">Praticien formateur</label>
        <Dropdown 
          id="praticien"
          v-model="editPraticienFormateurData.praticien_formateur" 
          :options="availablePraticiens"
          optionLabel="label"
          optionValue="value"
          placeholder="Sélectionner un praticien formateur (pré-rempli depuis la PFP)"
          class="w-full"
          filter
        />
      </div>

    
    </div>
  
    <template #footer>
      <Button label="Annuler" severity="secondary" outlined @click="cancelEditPraticien" />
      <Button label="Enregistrer" @click="saveEditPraticien" />
    </template>
  </Dialog>
</template>

<script setup>

import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useInstitutionsStore } from '@/stores/institutionsStore';
import { supabase } from '@/supabase';

const institutionsStore = useInstitutionsStore();

const props = defineProps({
  userId: { type: String, required: true }
})

const router = useRouter()

// Firebase votation data removed - now using Supabase only

// Variable pour vérifier le rôle de l'utilisateur
const isAdmin = ref(false);

// Fonction pour récupérer l'utilisateur connecté et vérifier s'il est admin
const fetchCurrentUser = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    
    if (user) {
      // Récupère les données de l'utilisateur connecté depuis user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (profileData) {
        // Vérifie si l'utilisateur est un admin via le rôle
        isAdmin.value = profileData.role === 'admin';
      } else {
        isAdmin.value = false;
      }
    } else {
      isAdmin.value = false;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    isAdmin.value = false;
  }
}

// Variables pour la boîte de dialogue d'ajout
const showAddAssignmentDialog = ref(false)
const availablePlaces = ref([])
const availablePraticiens = ref([])
const newAssignment = ref({
  assigned_place_id: '',
  assigned_place_name: '',
  assigned_institution_name: '',
  pfp_type: '',
  year: new Date().getFullYear().toString(),
  praticien_formateur: ''
})

// Variables pour l'édition du praticien formateur
const showEditPraticienDialog = ref(false)
const editPraticienFormateurData = ref({
  placeId: '',
  praticien_formateur: ''
})
const currentEditingPlace = ref(null)

// Variables pour gérer toutes les PFP
const showManageAllPfpsDialog = ref(false)
const managePfpsSearchQuery = ref('')
const allStudentPfps = ref([])
const selectedPfpToManage = ref(null)

/* ---------------------------
   Chargement des affectations PFP depuis Supabase uniquement
--------------------------- */

// Supabase places data
const supabasePlaces = ref([])
const supabasePraticiens = ref({})
const publishedAssignments = ref([])
const studentPfpList = ref([]) // Ajout pour le filtrage des doublons

// Fonction pour récupérer les assignations publiées depuis student_result_vote
const fetchPublishedAssignments = async () => {
  try {
    console.log('[FETCH] Récupération des assignations publiées pour userId:', props.userId)

    const { data, error } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('user_id', props.userId)
      .eq('status', 'published')

    if (error) {
      console.error('Erreur lors de la récupération des assignations:', error)
      return
    }

    publishedAssignments.value = data || []
    console.log(`✅ ${data?.length || 0} assignations publiées trouvées pour l'étudiant`)
    console.log('Assignations:', publishedAssignments.value)
  } catch (err) {
    console.error('Erreur inattendue lors de la récupération des assignations:', err)
  }
}

// Fonction pour récupérer les places depuis Supabase
const fetchPlacesFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')

    if (error) {
      console.error('Erreur lors de la récupération des places depuis Supabase:', error)
      return
    }

    supabasePlaces.value = data || []
    console.log(`✅ ${data?.length || 0} places récupérées depuis Supabase`)
  } catch (err) {
    console.error('Erreur inattendue lors de la récupération des places:', err)
  }
}

// Fonction pour récupérer les praticiens formateurs depuis Supabase
const fetchPraticiensFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('*')

    if (error) {
      console.error('Erreur lors de la récupération des praticiens depuis Supabase:', error)
      return
    }

    // Convertir en map avec l'ID comme clé
    const praticiensMap = {}
    data?.forEach(praticien => {
      // Utiliser PraticienId ou id comme clé
      const key = praticien.PraticienId || praticien.id
      if (key) {
        praticiensMap[key] = praticien
      }
    })

    supabasePraticiens.value = praticiensMap
    console.log(`✅ ${data?.length || 0} praticiens formateurs récupérés depuis Supabase`)
  } catch (err) {
    console.error('Erreur inattendue lors de la récupération des praticiens:', err)
  }
}

// Computed pour les assignations publiées enrichies avec les données des places
const assignedPlacesFromPublished = computed(() => {
  if (publishedAssignments.value.length === 0) {
    console.log('[INFO] Aucune assignation publiée trouvée')
    return []
  }

  // Enrichir chaque assignation avec les données de la place
  const enrichedAssignments = publishedAssignments.value.map(assignment => {
    console.log('[ENRICH] Traitement assignation:', {
      assigned_place_id: assignment.assigned_place_id,
      assigned_place_name: assignment.assigned_place_name,
      assigned_institution_name: assignment.assigned_institution_name
    })

    // Trouver la place correspondante
    const place = supabasePlaces.value.find(p => p.PlaceId === assignment.assigned_place_id)

    if (!place) {
      console.warn('[WARN] Place non trouvée pour PlaceId:', assignment.assigned_place_id)
      // Retourner quand même l'assignation avec les infos basiques depuis student_result_vote
      console.log('[ENRICH] Place NON trouvée, utilisation données student_result_vote')
      return {
        IDPlace: assignment.assigned_place_id,
        InstitutionId: null,
        pfpLevel: assignment.pfp_type,
        assigned_rank: assignment.assigned_rank,
        _key: assignment.id
      }
    }

    // Retourner l'assignation enrichie avec les données de la place
    console.log('[ENRICH] Place trouvée:', {
      PlaceId: place.PlaceId,
      InstitutionId: place.InstitutionId,
      Institution: place.Institution,
      assigned_institution_name_from_result: assignment.assigned_institution_name
    })

    // PRIORITÉ: assigned_institution_name de student_result_vote (valeur sauvegardée lors de l'attribution)
    // FALLBACK 1: Institution_name enrichi depuis places
    // FALLBACK 2: Institution (ancien champ texte dans places)
    const institutionName = assignment.assigned_institution_name ||
      place.Institution_name ||
      place.Institution ||
      'Institution inconnue'

    const enriched = {
      ...place,
      IDPlace: place.PlaceId,
      InstitutionId: place.InstitutionId,
      Institution: institutionName,
      Institution_name: institutionName,
      pfpLevel: assignment.pfp_type,
      assigned_rank: assignment.assigned_rank,
      pfp_validee: assignment.pfp_validee,
      assigned_praticien_id: assignment.assigned_praticien_id,
      _key: assignment.id
    }

    console.log('[ENRICH] Résultat enrichi - Institution_name:', enriched.Institution_name)
    return enriched
  })

  console.log(`🎯 ${enrichedAssignments.length} assignations publiées enrichies`)
  if (enrichedAssignments.length > 0) {
    console.log('[DEBUG] Première assignation enrichie:', enrichedAssignments[0])
    console.log('[DEBUG] InstitutionId:', enrichedAssignments[0].InstitutionId)
    console.log('[DEBUG] Institution_name:', enrichedAssignments[0].Institution_name)
  }
  return enrichedAssignments
})

// Ajout : computed pour trouver toutes les places où l'utilisateur courant est affecté depuis Supabase (ANCIEN SYSTÈME - FALLBACK)
const assignedPlacesFromSupabase = computed(() => {
  const userId = props.userId
  const results = []

  supabasePlaces.value.forEach(place => {
    // Chercher dans les assignations JSONB des différentes PFP
    const pfpFields = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

    pfpFields.forEach(pfpField => {
      const pfpData = place[pfpField]

      if (pfpData && pfpData.assignations) {
        // Parcourir les assignations (ex: BA24-1, BA23-1, etc.)
        Object.entries(pfpData.assignations).forEach(([key, assignment]) => {
          if (assignment.active && assignment.etudiant === userId) {
            results.push({
              ...place,
              seatIndex: key.split('-').pop(),
              assignmentKey: key,
              pfpLevel: pfpField,
              praticienId: assignment.praticien || null
            })
          }
        })
      }
    })
  })

  console.log(`🎯 ${results.length} places trouvées pour l'étudiant ${userId} (ancien système)`)
  return results
})

// Computed pour afficher les assignations - NOUVEAU SYSTÈME EN PRIORITÉ
const assignedPlaces = computed(() => {
  // Si le dialogue d'ajout est ouvert, montrer toutes les places disponibles
  if (showAddAssignmentDialog.value) {
    console.log('[INFO] Dialogue d\'ajout ouvert - affichage de toutes les places')
    return supabasePlaces.value.map(place => ({
      ...place,
      IDPlace: place.PlaceId,
      InstitutionId: place.InstitutionId,
      NomPlace: place.NomPlace,
      Institution_name: place.InstitutionName || place.Institution || 'Institution inconnue',
      _key: place.PlaceId
    }))
  }

  // Filtrer pour exclure les PFP validées
  const publishedWithoutValidated = assignedPlacesFromPublished.value.filter(
    place => !place.pfp_validee
  )

  console.log('🔍 DEBUG - publishedWithoutValidated:', publishedWithoutValidated.length)
  console.log('🔍 DEBUG - studentPfpList:', studentPfpList.value.length)
  
  // Log détaillé de studentPfpList
  if (studentPfpList.value.length > 0) {
    console.log('🔍 DEBUG - studentPfpList détails:', studentPfpList.value.map(p => ({
      PlaceId: p.PlaceId,
      ID_PFP: p.ID_PFP,
      id_pfp: p.id_pfp,
      NomPlace: p.NomPlace
    })))
  }

  // Filtrer pour exclure les places déjà dans ResumStageUserProfile (basé sur IDPlace)
  const filteredWithoutDuplicates = publishedWithoutValidated.filter(
    place => {
      // Vérifier si cette place existe déjà dans StudentsPhysio.pfp_valided
      const placeId = place.IDPlace || place.assigned_place_id || place._key
      const hasInStudentsPhysio = studentPfpList.value.some(pfp => {
        const pfpId = pfp.PlaceId || pfp.ID_PFP || pfp.id_pfp
        const match = pfpId === placeId
        if (match) {
          console.log('🔍 DEBUG - Match trouvé:', { pfpId, placeId })
        }
        return match
      })
      if (hasInStudentsPhysio) {
        console.log('🚫 Place exclue (déjà dans StudentsPhysio):', placeId)
      }
      return !hasInStudentsPhysio
    }
  )

  console.log('🔍 DEBUG - filteredWithoutDuplicates:', filteredWithoutDuplicates.length)

  // Dédupliquer basé sur IDPlace pour éviter les doublons
  const uniquePlaces = new Map()
  filteredWithoutDuplicates.forEach(place => {
    const key = place.IDPlace || place.assigned_place_id || place._key
    if (!uniquePlaces.has(key)) {
      uniquePlaces.set(key, place)
    }
  })

  // Retourner les places uniques (nouveau système)
  if (uniquePlaces.size > 0) {
    console.log('[NEW] Utilisation des assignations depuis student_result_vote (excluant validées et doublons)')
    return Array.from(uniquePlaces.values())
  }

  // Si aucune place après filtrage, retourner tableau vide (pas de fallback)
  console.log('[INFO] Aucune place à afficher après filtrage')
  return []
});


const getInstitutionNameById = (idInstitution) => {
  // Utiliser le getter du store Pinia twst
  console.log("ID inst" + idInstitution + institutionsStore.getInstitutionNameById(idInstitution));
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

// Retourne l'ID du praticien formateur lié à la place et au seat (ex: selectedPraticiensBA23PFP3-1)
function getPraticienFormateurId(place) {
  // Priorité: assigned_praticien_id depuis student_result_vote
  if (place.assigned_praticien_id) {
    console.log('[DEBUG] assigned_praticien_id trouvé:', place.assigned_praticien_id)
    return place.assigned_praticien_id;
  }

  // Si c'est une place Supabase avec praticienId dans l'assignation
  if (place.praticienId) {
    console.log('[DEBUG] praticienId trouvé:', place.praticienId)
    return place.praticienId;
  }

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
  console.log('[DEBUG] ID praticien pour getPraticienFormateurInfos:', id)
  if (!id) return '';

  // Chercher dans Supabase
  const pract = supabasePraticiens.value && supabasePraticiens.value[id];

  console.log('[DEBUG] Praticien trouvé:', pract ? 'OUI' : 'NON')
  console.log('[DEBUG] Clés disponibles dans supabasePraticiens:', Object.keys(supabasePraticiens.value || {}).slice(0, 5))

  if (!pract) return '';
  const prenom = pract.prenom || pract.Prenom || '';
  const nom = pract.nom || pract.Nom || '';
  return `${prenom} ${nom}`.trim();
}

// Ajout utilitaire pour le contact du praticien formateur
function getPraticienFormateurContact(place) {
  if (place && place.praticienMail) {
    return place.praticienMail;
  }
  const praticienId = getPraticienFormateurId(place);

  // Chercher dans Supabase
  if (praticienId && supabasePraticiens.value[praticienId]) {
    return supabasePraticiens.value[praticienId].mail || supabasePraticiens.value[praticienId].Mail || '';
  }
  return '';
}

// Fonction pour déterminer le type de votation
function getVotationType(place) {
  // Vérifier si c'est depuis le nouveau système student_result_vote
  if (place._key) {
    const assignment = publishedAssignments.value.find(a => a.id === place._key);
    if (assignment) {
      // Si assigned_rank est un nombre entre 1 et 5, c'est un choix
      if (assignment.assigned_rank && assignment.assigned_rank >= 1 && assignment.assigned_rank <= 5) {
        return `Choix ${assignment.assigned_rank}`;
      }
      // Sinon, c'est un tirage aléatoire
      return 'Hors choix de votation';
    }
  }

  // Pour l'ancien système, on peut déterminer par le seatIndex
  if (place.seatIndex) {
    const seatNum = parseInt(place.seatIndex);
    if (seatNum >= 1 && seatNum <= 5) {
      return `Choix ${seatNum}`;
    }
  }

  // Par défaut, on considère que c'est un tirage aléatoire
  return 'Tirage aléatoire';
}

// Fonction pour obtenir la classe CSS selon le type de votation
function getVotationTypeClass(place) {
  const type = getVotationType(place);
  if (type.startsWith('Choix')) {
    return 'text-blue-600 font-bold'; // Bleu pour les choix
  }
  return 'text-green-600 font-bold'; // Vert pour le tirage aléatoire
}

const fetchInstitutions = async () => {
  try {
    await institutionsStore.fetchInstitutions();
    console.log('Institutions chargées depuis le store:', institutionsStore.institutions.length);
  } catch (error) {
    console.error('Erreur lors du chargement des institutions:', error);
  }
}

// Firebase assignments removed - using Supabase data only

// Document management removed - handled in ResumStageUserProfile

/* ---------------------------
   Navigation vers la page de l'institution
--------------------------- */
const navigateToInstitution = (instId) => {
  if (instId) {
    router.push({ name: 'InstitutionView', params: { id: instId } });
  }
};

// Fonction pour charger les PFP de l'étudiant (pour filtrer les doublons)
const fetchStudentPfpList = async () => {
  try {
    console.log('[FETCH] Chargement PFP pour userId:', props.userId)
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
    } else if (typeof pfpVal === 'string') {
      try {
        const parsed = JSON.parse(pfpVal)
        arr = Array.isArray(parsed) ? parsed : []
      } catch (parseError) {
        console.warn('⚠️ Impossible de parser pfp_valided:', pfpVal)
        arr = []
      }
    } else if (pfpVal && typeof pfpVal === 'object') {
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
    console.log('🔍 DEBUG - studentPfpList.value:', studentPfpList.value.length)
  } catch (e) {
    console.warn('⚠️ Erreur chargement PFP étudiant (Supabase):', e.message)
    studentPfpList.value = []
  }
}

// Watcher pour recharger les données périodiquement (toutes les 15 secondes)
let refreshInterval = null

// Watcher pour détecter les changements dans studentPfpList
watch(() => studentPfpList.value, () => {
  console.log('👀 studentPfpList changé, rechargement des assignations...')
  // Forcer le recalcul de assignedPlaces
  // Le computed va automatiquement se mettre à jour
}, { deep: true })

onMounted(async () => {
  await fetchInstitutions()
  await fetchCurrentUser() // Vérifier si l'utilisateur est admin
  await Promise.all([
    fetchPublishedAssignments(),  // NOUVEAU : Charger les assignations publiées
    fetchPlacesFromSupabase(),
    fetchPraticiensFromSupabase(),
    fetchStudentPfpList(), // Charger les PFP de l'étudiant pour filtrer les doublons
    fetchAvailablePlaces() // Charger les places disponibles pour le dropdown
  ])

  // Rafraîchissement automatique toutes les 15 secondes
  refreshInterval = setInterval(async () => {
    console.log('🔄 Rafraîchissement automatique des assignations...')
    await Promise.all([
      fetchPublishedAssignments(),
      fetchStudentPfpList()
    ])
  }, 15000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Fonctions pour gérer l'ajout d'affectation
const openAddAssignmentDialog = async () => {
  await Promise.all([
    fetchAvailablePlaces(),
    fetchAvailablePraticiens()
  ])
  showAddAssignmentDialog.value = true
}

const fetchAvailablePraticiens = async () => {
  try {
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .select('id, nom, prenom, institution')
      .order('nom')

    if (error) {
      console.error('Erreur lors du chargement des praticiens:', error)
      return
    }

    availablePraticiens.value = data.map(praticien => ({
      value: praticien.id,
      label: `${praticien.prenom} ${praticien.nom} - ${praticien.institution || ''}`
    }))
  } catch (error) {
    console.error('Erreur inattendue:', error)
  }
}

const fetchAvailablePlaces = async () => {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('NomPlace')

    if (error) {
      console.error('Erreur lors du chargement des places:', error)
      return
    }

    availablePlaces.value = data.map(place => {
      console.log('Place brute:', place);
      const placeObj = {
        value: place.PlaceId,
        label: `${place.NomPlace}${place.InstitutionName ? ' - ' + place.InstitutionName : ''}`
      };
      console.log('Place transformée:', placeObj);
      return placeObj;
    })
  } catch (error) {
    console.error('Erreur inattendue:', error)
  }
}

const onPlaceSelected = async (placeId) => {
  console.log("Place sélectionnée ID:", placeId, typeof placeId);
  console.log("availablePlaces.value:", availablePlaces.value);
  
  // S'assurer que placeId est un nombre
  const numericPlaceId = typeof placeId === 'string' ? parseInt(placeId) : placeId;
  console.log("Place ID converti:", numericPlaceId, typeof numericPlaceId);
  
  // Vérifier si c'est un objet problématique
  if (typeof placeId === 'object' && placeId !== null) {
    console.error("ERREUR: placeId est un objet!", placeId);
    console.error("Clés de l'objet:", Object.keys(placeId));
    return;
  }
  
  // Récupérer les détails complets de la place depuis la base
  try {
    const { data: placeData, error } = await supabase
      .from('places')
      .select('PlaceId, NomPlace, InstitutionName, InstitutionId')
      .eq('PlaceId', numericPlaceId)
      .single()
    
    if (error) {
      console.error('Erreur lors de la récupération de la place:', error)
      return
    }
    
    console.log('Données de la place:', placeData);
    
    // Utiliser le nom de la place depuis les données complètes
    newAssignment.value.assigned_place_name = placeData.NomPlace
    
    // Utiliser InstitutionName si disponible, sinon chercher via InstitutionId
    if (placeData.InstitutionName) {
      newAssignment.value.assigned_institution_name = placeData.InstitutionName
    } else if (placeData.InstitutionId) {
      // Utiliser la même logique que Management_repondant
      const institutionName = institutionsStore.getInstitutionNameById(placeData.InstitutionId)
      newAssignment.value.assigned_institution_name = institutionName
    } else {
      newAssignment.value.assigned_institution_name = 'Institution inconnue'
    }
    
    console.log('Nom de la place:', newAssignment.value.assigned_place_name);
    console.log('Nom de l\'institution:', newAssignment.value.assigned_institution_name);
    
    // S'assurer que assigned_place_id est bien rempli avec l'ID de la place
    newAssignment.value.assigned_place_id = placeData.InstitutionId;
    
    // Remplir automatiquement le praticien formateur avec celui de la PFP sélectionnée
    if (placeData && placeData.assigned_praticien_id) {
      newAssignment.value.praticien_formateur = placeData.assigned_praticien_id
    }
    
  } catch (error) {
    console.error('Erreur inattendue:', error)
  }
}

const cancelAddAssignment = () => {
  showAddAssignmentDialog.value = false
  newAssignment.value = {
    assigned_place_id: '',
    assigned_place_name: '',
    assigned_institution_name: '',
    pfp_type: '',
    year: new Date().getFullYear().toString(),
    praticien_formateur: ''
  }
}

const confirmAddAssignment = async () => {
  try {
    // Validation basique
 
    // Insérer dans student_result_vote
    const { error } = await supabase
      .from('student_result_vote')
      .insert({
        user_id: props.userId,
        assigned_place_id: newAssignment.value.assigned_place_id,
        assigned_place_name: newAssignment.value.assigned_place_name,
        assigned_institution_name: newAssignment.value.assigned_institution_name,
        pfp_type: newAssignment.value.pfp_type,
        year: newAssignment.value.year,
        assigned_praticien_id: newAssignment.value.praticien_formateur,
        status: 'published',
        pfp_validee: false,
        pfp_echec: false,
        pfp_arret: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Erreur lors de l\'ajout de l\'affectation:', error)
      alert('Erreur lors de l\'ajout de l\'affectation')
      return
    }

    console.log('✅ Affectation ajoutée avec succès')
    showAddAssignmentDialog.value = false
    cancelAddAssignment()
    
    // Recharger les données
    await fetchPublishedAssignments()
    
  } catch (error) {
    console.error('Erreur inattendue lors de l\'ajout:', error)
    alert('Erreur lors de l\'ajout de l\'affectation')
  }
}

// Fonctions pour gérer l'édition du praticien formateur
const editPraticienFormateur = async (place) => {
  await fetchAvailablePraticiens()
  currentEditingPlace.value = place
  editPraticienFormateurData.value = {
    placeId: place.IDPlace || place.assigned_place_id,
    praticien_formateur: place.assigned_praticien_id || ''
  }
  showEditPraticienDialog.value = true
}

const saveEditPraticien = async () => {
  try {
    if (!editPraticienFormateurData.value.praticien_formateur) {
      alert('Veuillez sélectionner un praticien formateur')
      return
    }

    // Mettre à jour dans student_result_vote
    const { error } = await supabase
      .from('student_result_vote')
      .update({
        assigned_praticien_id: editPraticienFormateurData.value.praticien_formateur
      })
      .eq('id', currentEditingPlace.value._key)

    if (error) {
      console.error('Erreur lors de la mise à jour du praticien:', error)
      alert('Erreur lors de la mise à jour du praticien')
      return
    }

    console.log('✅ Praticien formateur mis à jour avec succès')
    showEditPraticienDialog.value = false
    currentEditingPlace.value = null
    
    // Recharger les données
    await fetchPublishedAssignments()
    
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour:', error)
    alert('Erreur lors de la mise à jour du praticien')
  }
}

const cancelEditPraticien = () => {
  showEditPraticienDialog.value = false
  currentEditingPlace.value = null
  editPraticienFormateurData.value = {
    placeId: '',
    praticien_formateur: ''
  }
}

// Fonctions pour gérer toutes les PFP
const openManageAllPfpsDialog = async () => {
  await fetchAllStudentPfps()
  showManageAllPfpsDialog.value = true
}

const closeManageAllPfpsDialog = () => {
  showManageAllPfpsDialog.value = false
  managePfpsSearchQuery.value = ''
  selectedPfpToManage.value = null
}

const fetchAllStudentPfps = async () => {
  try {
    // Récupérer toutes les PFP depuis StudentsPhysio
    const { data, error } = await supabase
      .from('StudentsPhysio')
      .select('pfp_valided, pfp2_data')
      .eq('user_id', props.userId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      console.warn('Aucune PFP trouvée pour cet étudiant')
      allStudentPfps.value = []
      return
    }

    let allPfps = []

    // Traiter pfp_valided
    const pfpVal = data.pfp_valided
    if (Array.isArray(pfpVal)) {
      allPfps = pfpVal
    } else if (typeof pfpVal === 'string') {
      try {
        allPfps = JSON.parse(pfpVal)
      } catch (e) {
        console.warn('Erreur parsing pfp_valided:', e)
        allPfps = []
      }
    } else if (pfpVal && typeof pfpVal === 'object') {
      allPfps = Object.values(pfpVal)
    }

    // Traiter pfp2_data
    const pfp2Val = data.pfp2_data
    if (pfp2Val) {
      if (Array.isArray(pfp2Val)) {
        allPfps = [...allPfps, ...pfp2Val]
      } else if (typeof pfp2Val === 'object') {
        allPfps.push(pfp2Val)
      }
    }

    allStudentPfps.value = allPfps
    console.log('✅ Toutes les PFP chargées:', allPfps.length)
  } catch (error) {
    console.error('Erreur lors du chargement des PFP:', error)
    allStudentPfps.value = []
  }
}

const filteredAllStudentPfps = computed(() => {
  if (!managePfpsSearchQuery.value) {
    return allStudentPfps.value
  }

  return allStudentPfps.value.filter(pfp => {
    const searchText = managePfpsSearchQuery.value.toLowerCase()
    return (
      (pfp.NomPlace || pfp.nom_pfp || '').toLowerCase().includes(searchText) ||
      (pfp.InstitutionName || pfp.institution_name || '').toLowerCase().includes(searchText) ||
      (pfp.pfp_type || '').toLowerCase().includes(searchText)
    )
  })
})

const selectPfpToManage = (pfp) => {
  selectedPfpToManage.value = pfp
}

const selectExistingPfp = (pfp) => {
  // Pré-remplir le formulaire avec les données de la PFP sélectionnée
  newAssignment.value.assigned_place_id = pfp.id_pfp || pfp.ID_PFP || pfp._key
  newAssignment.value.assigned_place_name = pfp.NomPlace || pfp.nom_pfp || ''
  newAssignment.value.assigned_institution_name = pfp.InstitutionName || pfp.institution_name || ''
  newAssignment.value.pfp_type = pfp.pfp_type || ''
  newAssignment.value.praticien_formateur = pfp.assigned_praticien_id || ''
  
  console.log('PFP existante sélectionnée:', pfp.NomPlace || pfp.nom_pfp)
}

const getPfpStatusClass = (pfp) => {
  if (pfp.pfp_validee) return 'text-green-600 font-semibold'
  if (pfp.pfp_echec) return 'text-red-600 font-semibold'
  if (pfp.pfp_arret) return 'text-yellow-600 font-semibold'
  return 'text-gray-600'
}

const getPfpStatusText = (pfp) => {
  if (pfp.pfp_validee) return 'Validée'
  if (pfp.pfp_echec) return 'Échec'
  if (pfp.pfp_arret) return 'Arrêt'
  return 'En cours'
}

const editPfp = async (pfp) => {
  await fetchAvailablePraticiens()
  selectedPfpToManage.value = pfp
  
  // Ouvrir la boîte de dialogue d'édition avec les données actuelles
  editPraticienFormateurData.value = {
    placeId: pfp.id_pfp || pfp.ID_PFP || pfp._key,
    praticien_formateur: pfp.assigned_praticien_id || ''
  }
  showEditPraticienDialog.value = true
}

const deletePfp = async (pfp) => {
  const pfpName = pfp.NomPlace || pfp.nom_pfp || 'cette PFP'
  const institutionName = pfp.InstitutionName || pfp.institution_name || 'cette institution'
  
  const confirmation = window.confirm(
    `Êtes-vous sûr de vouloir supprimer la PFP "${pfpName}" à "${institutionName}" ?\n\nCette action est irréversible et affectera les données de l\'étudiant.`
  )
  
  if (!confirmation) return

  try {
    // Supprimer de StudentsPhysio
    const { error } = await supabase
      .from('StudentsPhysio')
      .update({
        pfp_valided: null, // Mettre à null pour supprimer toutes les PFP
        pfp2_data: null
      })
      .eq('user_id', props.userId)

    if (error) {
      console.error('Erreur lors de la suppression des PFP:', error)
      alert('Erreur lors de la suppression des PFP')
      return
    }

    console.log('✅ Toutes les PFP supprimées avec succès')
    
    // Recharger les données
    await fetchAllStudentPfps()
    await fetchPublishedAssignments()
    
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression:', error)
    alert('Erreur lors de la suppression des PFP')
  }
}

const confirmDeleteAssignment = async (place) => {
  const placeName = place.NomPlace || 'cette place'
  const institutionName = place.Institution_name || place.Institution || 'cette institution'
  
  const confirmation = window.confirm(
    `Êtes-vous sûr de vouloir supprimer l'affectation "${placeName}" à "${institutionName}" pour cet étudiant ?\n\nCette action est irréversible.`
  )
  
  if (!confirmation) {
    return
  }

  try {
    // Si c'est depuis student_result_vote (nouveau système)
    if (place._key) {
      const { error } = await supabase
        .from('student_result_vote')
        .delete()
        .eq('id', place._key)

      if (error) {
        console.error('Erreur lors de la suppression de l\'assignation:', error)
        alert('Erreur lors de la suppression')
        return
      }

      console.log('✅ Assignation supprimée avec succès')
    } else {
      // Pour l'ancien système, vous pourriez vouloir implémenter une autre logique
      console.warn('Suppression non implémentée pour l\'ancien système')
      alert('Suppression non disponible pour cette affectation')
      return
    }

    // Recharger les données
    await fetchPublishedAssignments()
    
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression:', error)
    alert('Erreur lors de la suppression')
  }
}
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
