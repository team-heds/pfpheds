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
          <!-- En-tête de la carte avec titre et bouton -->
          <div class="flex align-items-center justify-content-between mb-2" style="height: 32px;">
            <h4 class="m-0">Formation Pratique attribuée</h4>
            <Button
              label="Voir les détails"
              icon="pi pi-arrow-right"
              class="text-sm p-button-outlined p-button-primary details-btn ml-3"
              style="height: 32px; width: 200px; min-width: 200px;"
              @click="navigateToInstitution(place.InstitutionId || place.IDPlace)"
            />
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
                <b>{{ getPraticienFormateurInfos(place) }}</b><br />
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
      <!-- Si aucune affectation n'est trouvée pour cet utilisateur, ce message s'affiche -->
      <p>Aucune affectation PFP disponible pour cet utilisateur.</p>
    </div>
  </div>
</template>

<script setup>

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useInstitutionsStore } from '@/stores/institutionsStore';
import { supabase } from '@/supabase';

const institutionsStore = useInstitutionsStore();

const props = defineProps({
  userId: { type: String, required: true }
})

const router = useRouter()

// Firebase votation data removed - now using Supabase only

/* ---------------------------
   Chargement des affectations PFP depuis Supabase uniquement
--------------------------- */

// Supabase places data
const supabasePlaces = ref([])
const supabasePraticiens = ref({})
const publishedAssignments = ref([])

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
        NomPlace: assignment.assigned_place_name || 'Place inconnue',
        Institution: assignment.assigned_institution_name || 'Institution inconnue',
        Institution_name: assignment.assigned_institution_name || 'Institution inconnue',
        pfpLevel: assignment.pfp_type,
        assigned_rank: assignment.assigned_rank,
        _key: assignment.id
      }
    }

    // Retourner l'assignation enrichie avec les données de la place
    console.log('[ENRICH] Place trouvée:', {
      PlaceId: place.PlaceId,
      NomPlace: place.NomPlace,
      InstitutionId: place.InstitutionId,
      Institution: place.Institution,
      Institution_name: place.Institution_name,
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
  // Prioriser les assignations publiées depuis student_result_vote
  if (publishedAssignments.value.length > 0) {
    console.log('[NEW] Utilisation des assignations depuis student_result_vote')
    return assignedPlacesFromPublished.value
  }
  
  // Fallback sur l'ancien système si aucune assignation publiée
  console.log('[OLD] Fallback sur ancien système d\'assignations')
  return assignedPlacesFromSupabase.value
});


const getInstitutionNameById = (idInstitution) => {
  // Utiliser le getter du store Pinia twst
  console.log("ID inst" + idInstitution);
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
  // Si c'est une place Supabase avec praticienId dans l'assignation
  if (place.praticienId) {
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
  if (!id) return '';
  
  // Chercher dans Supabase
  const pract = supabasePraticiens.value && supabasePraticiens.value[id];
  
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
      return 'Tirage aléatoire';
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

onMounted(async () => {
  await fetchInstitutions()
  await Promise.all([
    fetchPublishedAssignments(),  // NOUVEAU : Charger les assignations publiées
    fetchPlacesFromSupabase(),
    fetchPraticiensFromSupabase()
  ])
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