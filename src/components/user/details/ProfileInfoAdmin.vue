<template>
  <div class="filter-layout">
    <!-- Contenu Principal -->
    <div class="main-content profileinfo-scrollable">
      <div class="filter-menu p-fluid p-pt-4 p-pb-4">
        <div>
          <CardNameProfile />
          <VotationResultProfil :userId="user.uid" class="w-full" />
          <!-- Radar profil stage + critères validés -->
          <RadarProfil :scores="radarScores" :totalStages="totalStages" />
          <!-- Résumé du stage utilisateur -->
          <ResumStageUserProfile :userProfile="userProfile" :userId="user.uid" class="w-full" />
          <!-- On passe l'ID de l'utilisateur au composant -->

          <!-- Section pour changer la photo de profil
          <div class="p-field mt-4 surfaces-card w-full">
            <label for="avatar-upload">Photo de profils actuelle :</label>
            <div class="p-d-flex p-ai-center">
              <img
                :src="user.photoURL"
                alt="Avatar"
                class="p-mr-2"
                style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;"
              />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                @change="onAvatarChange"
                class="p-ml-2"
              />
            </div>
            <div class="actions-row">
              <Button
                label="Enregistrer"
                class="save-btn"
                @click="saveProfile"
                icon="pi pi-save"
              />
            </div>
          </div> -->
        </div>
      </div>
    </div>

    <!-- Sidebar Droite -->
    <div class="sidebar-right">
      <ProfileAdminRightSidebar />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/supabase';

import CardNameProfile from '@/components/user/library/CardNameProfile.vue'
import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'
import VotationResultProfil from '@/components/user/details/VotationResultProfil.vue'
import ProfileAdminRightSidebar from '@/components/user/library/ProfileAdminRightSidebar.vue'
import RadarProfil from '@/components/user/details/RadarProfil.vue'

const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

const user = ref({
  uid: '',
  prenom: '',
  nom: '',
  bio: '',
  photoURL: defaultAvatar,
  email: '',
  ville: ''
});

const fetchUserProfileById = async (userId) => {
  try {
    // Récupérer le profil étudiant depuis Supabase
    const { data, error } = await supabase
      .from('StudentsPhysio')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Profil StudentsPhysio non trouvé aba:', error.message);
      userProfile.value = null;
      return;
    }

    if (data && data.length > 0) {
      const latestRow = data[0]
      let mergedPfpValided = []
      let mergedPfp2Data = []

      data.forEach((row) => {
        mergedPfpValided = [...mergedPfpValided, ...parsePfpValided(row?.pfp_valided)]
        mergedPfp2Data = [...mergedPfp2Data, ...parsePfpValided(row?.pfp2_data)]
      })

      userProfile.value = {
        ...latestRow,
        pfp_valided: mergedPfpValided,
        pfp2_data: mergedPfp2Data
      };
    } else {
      // Profil pas encore créé dans StudentsPhysio - c'est normal pour certains utilisateurs
      userProfile.value = null;
    }
  } catch (error) {
    userProfile.value = null;
    console.warn('Erreur chargement profil étudiant aba:', error.message);
  }
};

const route = useRoute();

const userProfile = ref(null);
const validatedAssignments = ref([])
const placesCriteriaMap = ref(new Map())
const criteriaLabels = [
  "MSQ",
  "SYSINT",
  "NEUROGER",
  "AIGU",
  "REHAB",
  "AMBU",
  "FR",
  "DE"
];

// Parser pfp_valided (peut être string JSON, array ou objet)
const parsePfpValided = (pfpVal) => {
  if (!pfpVal) return []
  if (Array.isArray(pfpVal)) return pfpVal
  if (typeof pfpVal === 'string') {
    try {
      const parsed = JSON.parse(pfpVal)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  if (typeof pfpVal === 'object') return Object.values(pfpVal)
  return []
}

const parseBoolean = (value) => {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
  }
  return false
}

const normalizePfp = (pfpType) => (pfpType === 'PFP1A' || pfpType === 'PFP1B' ? 'PFP1' : pfpType)

const getUnifiedPhysioStages = (profile) => {
  if (!profile) return []
  const pfpStages = parsePfpValided(profile.pfp_valided)
  const pfp2Stages = parsePfpValided(profile.pfp2_data)
  return [...pfpStages, ...pfp2Stages]
}

const buildStageKey = (placeId, pfpType, fallback) => {
  if (!placeId && !pfpType) return fallback
  return `${placeId || 'unknown'}__${normalizePfp(pfpType || '') || 'unknown'}`
}

const loadValidatedHistory = async (userId) => {
  if (!userId) return
  try {
    const [{ data: assignmentRows, error: assignmentError }, { data: placesRows, error: placesError }] = await Promise.all([
      supabase
        .from('student_result_vote')
        .select('assigned_place_id, pfp_type, pfp_validee')
        .eq('user_id', userId),
      supabase
        .from('places')
        .select('PlaceId, MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE')
    ])

    if (assignmentError) {
      console.warn('Erreur chargement student_result_vote (profil):', assignmentError.message)
      validatedAssignments.value = []
    } else {
      validatedAssignments.value = (assignmentRows || []).filter(row => parseBoolean(row?.pfp_validee))
    }

    if (placesError) {
      console.warn('Erreur chargement places (profil):', placesError.message)
      placesCriteriaMap.value = new Map()
    } else {
      const map = new Map()
      ;(placesRows || []).forEach(place => {
        map.set(place.PlaceId, place)
      })
      placesCriteriaMap.value = map
    }
  } catch (error) {
    console.warn('Erreur chargement historique validé (profil):', error.message)
    validatedAssignments.value = []
    placesCriteriaMap.value = new Map()
  }
}

// Agrégation des scores radar par critère (nombre de validations)
const radarScores = computed(() => {
  const scores = Object.fromEntries(criteriaLabels.map(k => [k, 0]));
  const seenStages = new Set()

  getUnifiedPhysioStages(userProfile.value).forEach((place, idx) => {
    const placeId = place?.PlaceId || place?.ID_PFP || place?.id_pfp || null
    const pfpType = place?.pfp_type || place?.pfpLevel || null
    const stageKey = buildStageKey(placeId, pfpType, `physio_${idx}`)
    if (seenStages.has(stageKey)) return
    seenStages.add(stageKey)

    criteriaLabels.forEach(crit => {
      if (parseBoolean(place?.[crit]) || parseBoolean(place?.[crit.toLowerCase()])) scores[crit]++
    })
  })

  validatedAssignments.value.forEach((assignment, idx) => {
    const placeId = assignment?.assigned_place_id || null
    const pfpType = assignment?.pfp_type || null
    const stageKey = buildStageKey(placeId, pfpType, `assignment_${idx}`)
    if (seenStages.has(stageKey)) return
    seenStages.add(stageKey)

    const placeData = placesCriteriaMap.value.get(placeId)
    if (!placeData) return
    criteriaLabels.forEach(crit => {
      if (parseBoolean(placeData?.[crit])) scores[crit]++
    })
  })

  return scores;
});

const totalStages = computed(() => {
  const seenStages = new Set()

  getUnifiedPhysioStages(userProfile.value).forEach((place, idx) => {
    const placeId = place?.PlaceId || place?.ID_PFP || place?.id_pfp || null
    const pfpType = place?.pfp_type || place?.pfpLevel || null
    seenStages.add(buildStageKey(placeId, pfpType, `physio_${idx}`))
  })

  validatedAssignments.value.forEach((assignment, idx) => {
    const placeId = assignment?.assigned_place_id || null
    const pfpType = assignment?.pfp_type || null
    seenStages.add(buildStageKey(placeId, pfpType, `assignment_${idx}`))
  })

  return seenStages.size;
});

onMounted(async () => {
  const userId = route.params.id; // Récupère l'ID depuis l'URL
  if (userId) {
    user.value.uid = userId;
    await Promise.all([
      fetchUserProfileById(userId),
      loadValidatedHistory(userId)
    ])
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
});
</script>


<style scoped>
/* Layout global avec sidebars et contenu central */
.filter-layout {
  display: grid;
  grid-template-columns: 3fr 1fr;
  /* Contenu principal, sidebar droite */
  gap: 1.5rem;
  min-height: 100vh;
}

/* Sidebar Droite */
.sidebar-right {
  overflow-y: auto;
}

/* Contenu Principal */
.main-content {
  max-width: 880px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  overflow-y: auto;
  height: 100vh;
  padding-bottom: 7rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.main-content::-webkit-scrollbar {
  display: none;
}

/* Responsive pour le layout global */
@media (max-width: 1024px) {
  .filter-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .filter-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Styles spécifiques au composant FilterMenu */
.filter-menu {
  padding: 1rem;
}

/* Exemple de style pour les images et boutons */
img {
  border: 2px solid #ccc;
}

/* Quelques utilitaires */
.p-pt-4 {
  padding-top: 1rem;
}

.p-pb-4 {
  padding-bottom: 1rem;
}

.p-mt-4 {
  margin-top: 1rem;
}

.p-mr-2 {
  margin-right: 0.5rem;
}

.p-ml-2 {
  margin-left: 0.5rem;
}

/* Responsive */
@media (max-width: 600px) {
  .w-4 {
    width: 100% !important;
  }
}

/* Styles pour la section de modification de photo de profil */
.surfaces-card {
  background-color: var(--surface-card);
  padding: 1.5rem;
  border-radius: 2rem;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.save-btn {
  min-width: 200px;
  font-weight: 600;
}
</style>