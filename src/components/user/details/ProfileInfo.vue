
<template>
  <div class="filter-layout">
    <!-- Sidebar Gauche -->
    <div class="sidebar-left">
      <LeftSidebar />
    </div>

    <!-- Contenu Principal -->
    <div class="main-content profileinfo-scrollable ">
      <div class="filter-menu p-fluid p-pt-4 p-pb-4">
        <div>
          <!-- Affichage du composant CardNameProfile -->
          <CardNameProfile />
          <VotationResultProfil :userId="effectiveUserId" class="w-full" />
          <!-- Radar profil stage + critères validés -->
          <RadarProfil :scores="radarScores" :totalStages="totalStages" />

          <!-- Résumé du stage utilisateur -->
          <ResumStageUserProfile :userProfile="userProfile" :userId="effectiveUserId" class="w-full" />
          <!-- On passe l'ID de l'utilisateur au composant -->



          <!-- Section pour changer la photo de profil
          <div class="p-field mt-4 surfaces-card w-full">
            <label for="avatar-upload">Photo de profil actuelle :</label>
            <div class="p-d-flex p-ai-center">
              <img
                :src="user.photoURL"
                alt="Avatar"
                class="p-mr-2 mt-2"
                style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;"
              />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                @change="onAvatarChange"
                class="p-ml-2 mt-2"
              />
            </div>
            <Button
              label="Enregistrer"
              class="p-mt-2 w-2 mt-2"
              @click="saveProfile"
              icon="pi pi-save"
            />
          </div> -->
        </div>
      </div>
    </div>

    <!-- Sidebar Droite -->
    <div class="sidebar-right" v-if="!props.embed">
      <RightSidebar />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/supabase';
import { useAuthStore } from '@/stores/authStore';

// Importation des composants utilisés
import CardNameProfile from '@/components/user/library/CardNameProfile.vue';
import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'
import LeftSidebar from '@/components/social/library/LeftSidebar.vue';
import RightSidebar from '@/components/social/library/RightSidebar.vue';
import VotationResultProfil from '@/components/user/details/VotationResultProfil.vue'
import RadarProfil from '@/components/user/details/RadarProfil.vue'

const props = defineProps({
  embed: { type: Boolean, default: false }
})

// Définition d'un avatar par défaut
const defaultAvatar = '@/assets/images/avatar/01.jpg';

// Réactive l'objet utilisateur
const user = ref({
  uid: '',
  prenom: '',
  nom: '',
  bio: '',
  photoURL: defaultAvatar,
  email: '',
  ville: ''
});

const selectedAvatarFile = ref(null);

// Couleur de la maison de l'utilisateur (pour le composant Quêtes)
const userHouseColor = ref('#2E8B57'); // Harmonis par défaut

const houseColors = {
  harmonis: '#2E8B57',
  elaris: '#DC143C',
  doloris: '#FFD700',
  solencia: '#4169E1',
  gamemaster: '#9333ea'
};

// Fonction pour récupérer la couleur de la maison de l'utilisateur
const fetchUserHouseColor = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('gamification_data')
      .select('house_id')
      .eq('user_id', userId)
      .single();
    
    if (data && data.house_id) {
      // Récupérer le nom de la maison
      const { data: houseData } = await supabase
        .from('houses')
        .select('name')
        .eq('id', data.house_id)
        .single();
      
      if (houseData) {
        const houseName = houseData.name.toLowerCase();
        userHouseColor.value = houseColors[houseName] || '#2E8B57';
      }
    }
  } catch (err) {
    console.error('Erreur récupération couleur maison:', err);
  }
};

// --- Ajout récupération profil étudiant et scores radar ---
const userProfile = ref(null);
const studentResultVotes = ref([])
const placesById = ref(new Map())
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

const route = useRoute();
const authStore = useAuthStore();
const routeUserId = computed(() => route?.params?.id || null);
const effectiveUserId = computed(() => routeUserId.value || authStore.user?.id || authStore.user?.uid || null);

const fetchUserProfileById = async (userId) => {
  try {
    // Récupérer le profil étudiant depuis Supabase
    const { data, error } = await supabase
      .from('StudentsPhysio')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Profil StudentsPhysio non trouvé:', error.message);
      userProfile.value = null;
      return;
    }

    if (data) {
      userProfile.value = { ...data };
    } else {
      // Profil pas encore créé dans StudentsPhysio - c'est normal pour certains utilisateurs
      userProfile.value = null;
    }
  } catch (error) {
    userProfile.value = null;
    console.warn('Erreur chargement profil étudiant:', error.message);
  }
};

const normalizePfpType = (type, idx = 0) => {
  const fallback = ['PFP1', 'PFP2', 'PFP3', 'PFP4'][idx] || ''
  const raw = type || fallback
  return raw === 'PFP1A' || raw === 'PFP1B' ? 'PFP1' : raw
}

const fetchRadarSources = async (userId) => {
  try {
    const { data: rvData, error: rvError } = await supabase
      .from('student_result_vote')
      .select('*')
      .eq('user_id', userId)

    if (rvError) {
      console.warn('Erreur chargement student_result_vote pour radar:', rvError.message)
      studentResultVotes.value = []
    } else {
      studentResultVotes.value = rvData || []
    }

    const legacyEntries = parseLegacyStageEntries(userProfile.value)
    const ids = new Set()

    studentResultVotes.value.forEach((rv) => {
      if (rv?.assigned_place_id) ids.add(String(rv.assigned_place_id))
    })

    legacyEntries.forEach((entry) => {
      const legacyId = entry?.id_pfp || entry?.ID_PFP || entry?.PlaceId
      if (legacyId) ids.add(String(legacyId))
    })

    if (!ids.size) {
      placesById.value = new Map()
      return
    }

    const { data: placesData, error: placesError } = await supabase
      .from('places')
      .select('IDPlace, PlaceId, id, place_id, MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE')

    if (placesError) {
      console.warn('Erreur chargement places pour radar:', placesError.message)
      placesById.value = new Map()
      return
    }

    const map = new Map()
    ;(placesData || []).forEach((p) => {
      const keys = [p.IDPlace, p.PlaceId, p.id, p.place_id].filter(Boolean).map(String)
      if (!keys.some((k) => ids.has(k))) return
      keys.forEach((k) => map.set(k, p))
    })
    placesById.value = map
  } catch (error) {
    console.warn('Erreur chargement sources radar:', error?.message || error)
    studentResultVotes.value = []
    placesById.value = new Map()
  }
}

onMounted(async () => {
  if (!authStore.user) {
    await authStore.checkAuthState();
  }

  if (effectiveUserId.value) {
    user.value.uid = effectiveUserId.value;
    await fetchUserProfile(effectiveUserId.value);
    await fetchUserProfileById(effectiveUserId.value);
    await fetchRadarSources(effectiveUserId.value);
    await fetchUserHouseColor(effectiveUserId.value);
  }
});

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

const parseLegacyStageEntries = (profile) => {
  if (!profile) return []
  const pfpArray = parsePfpValided(profile.pfp_valided)
  const pfp2Val = profile.pfp2_data

  if (pfp2Val) {
    if (Array.isArray(pfp2Val)) {
      return [...pfpArray, ...pfp2Val]
    }
    if (typeof pfp2Val === 'object') {
      return [...pfpArray, pfp2Val]
    }
  }

  return pfpArray
}

const isValidatedFlag = (value) => value === true || value === 'true' || value === 1 || value === '1'

const isStageEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return false
  if (criteriaLabels.some((crit) => Object.prototype.hasOwnProperty.call(entry, crit))) return true
  return Boolean(entry.id_pfp || entry.selected_stage_id || entry.nom_pfp)
}

const parsedStageEntries = computed(() => {
  const parsed = parseLegacyStageEntries(userProfile.value)
  return parsed.filter(isStageEntry)
})

const mergedAllStageEntries = computed(() => {
  const results = []
  const seen = new Set()

  ;(studentResultVotes.value || []).forEach((rv) => {
    const placeId = rv?.assigned_place_id ? String(rv.assigned_place_id) : ''
    const pfpType = normalizePfpType(rv?.pfp_type)
    const key = `${placeId}_${pfpType}`
    if (!placeId || seen.has(key)) return
    seen.add(key)

    const placeData = placesById.value.get(placeId)
    const stageEntry = {}
    criteriaLabels.forEach((crit) => {
      stageEntry[crit] = isValidatedFlag(placeData?.[crit])
    })
    stageEntry._validated = isValidatedFlag(rv?.pfp_validee)
    results.push(stageEntry)
  })

  ;(parsedStageEntries.value || []).forEach((entry, idx) => {
    const placeId = String(entry?.id_pfp || entry?.ID_PFP || entry?.PlaceId || '')
    const pfpType = normalizePfpType(entry?.pfp_type || entry?.type_pfp || entry?.PfpType, idx)
    const key = `${placeId}_${pfpType}`
    if (placeId && seen.has(key)) return
    if (placeId) seen.add(key)
    results.push({ ...entry, _validated: true })
  })

  return results
})

const mergedValidatedStageEntries = computed(() => {
  return mergedAllStageEntries.value.filter((entry) => entry?._validated)
})

// Agrégation des scores radar par critère (nombre de validations)
const radarScores = computed(() => {
  const scores = Object.fromEntries(criteriaLabels.map(k => [k, 0]));
  mergedValidatedStageEntries.value.forEach(place => {
    criteriaLabels.forEach(crit => {
      if (isValidatedFlag(place?.[crit])) scores[crit]++;
    });
  });
  return scores;
});

const totalStages = computed(() => {
  return mergedAllStageEntries.value.length;
});

const displayName = computed(() => {
  const full = `${user.value.prenom || ''} ${user.value.nom || ''}`.trim()
  return full || 'Profil utilisateur'
})

const validatedCriteriaCount = computed(() => {
  return criteriaLabels.filter((k) => Number(radarScores.value[k] || 0) > 0).length
})

const completionPercent = computed(() => {
  const totalPossible = Math.max(1, totalStages.value * criteriaLabels.length)
  const totalValidated = criteriaLabels.reduce((acc, k) => acc + Number(radarScores.value[k] || 0), 0)
  return Math.min(100, Math.round((totalValidated / totalPossible) * 100))
})

// Fonction pour charger un profil utilisateur via son ID depuis Supabase
const fetchUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Erreur Supabase:', error);
      return;
    }
    
    if (data) {
      user.value = {
        uid: userId,
        prenom: data.forname || '',
        nom: data.family_name || '',
        email: data.email || '',
        ville: data.city || '',
        bio: data.bio || '',
        photoURL: data.avatar_url || data.profile_picture_url || defaultAvatar
      };
    } else {
      console.warn("Aucun profil trouvé pour l'ID :", userId);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
  }
};

// Fonction pour sauvegarder la nouvelle photo de profil avec Supabase Storage
const saveProfile = async () => {
  if (selectedAvatarFile.value) {
    const userId = user.value.uid;
    if (!userId) {
      console.error('Aucun utilisateur chargé, impossible de sauvegarder.');
      return;
    }
    
    try {
      const fileName = `${userId}/profile-picture-${Date.now()}.jpg`;
      
      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedAvatarFile.value, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const photoURL = urlData.publicUrl;
      
      // Mettre à jour le profil dans user_profiles
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: photoURL,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      user.value.photoURL = photoURL;
      console.log('✅ Photo de profil mise à jour avec succès');
    } catch (error) {
      console.error("❌ Erreur lors de l'upload de l'avatar :", error);
    }
  } else {
    console.warn('Veuillez sélectionner une photo avant de sauvegarder.');
  }
};

// Gestion du changement d'avatar
const onAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedAvatarFile.value = file;
  }
};
</script>

<style scoped>
/* Layout global avec sidebars et contenu central */
.filter-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr; /* Sidebar gauche, contenu central, sidebar droite */
  gap: 1.5rem;
  min-height: 100vh;
}

/* Sidebar Gauche et Droite */
.sidebar-left,
.sidebar-right {
  overflow-y: auto;
}

/* Contenu Principal */
.main-content {
  max-width: 880px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.surfaces-card {
  background-color: var(--surface-card);
  padding: 1.5rem;
  border-radius: 2rem;
}

/* Responsive pour le layout global */
@media (max-width: 1024px) {
  .filter-layout {
    grid-template-columns: 1fr 2fr;
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
  .sidebar-left {
    display: none;
  }
}

/* Styles spécifiques au composant FilterMenu */
.filter-menu {
  padding: 20px;
}

.profile-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
  margin-bottom: 1.1rem;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.14), rgba(16, 185, 129, 0.1));
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.profile-hero--inline {
  margin-top: 0.5rem;
}

.profile-hero__left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.profile-avatar-wrap {
  width: 72px;
  height: 72px;
  border-radius: 1rem;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.75);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-color, #0f172a);
}

.profile-email {
  margin: 0.2rem 0 0.5rem;
  color: var(--text-color-secondary, #475569);
}

.profile-badges {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.profile-badge {
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  background: rgba(15, 23, 42, 0.08);
  color: var(--text-color, #0f172a);
}

.profile-badge--accent {
  background: rgba(14, 165, 233, 0.2);
}

.profile-kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(130px, 1fr));
  gap: 0.6rem;
}

.kpi-card {
  background: var(--surface-card, #fff);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 0.85rem;
  padding: 0.55rem 0.75rem;
  min-width: 140px;
}

.kpi-label {
  display: block;
  font-size: 0.76rem;
  color: var(--text-color-secondary, #64748b);
}

.kpi-value {
  color: var(--text-color, #0f172a);
  font-size: 1rem;
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
@media (max-width: 991px) {
  .filter-layout {
    flex-direction: column !important;
    display: flex;
  }
  .sidebar-left,
  .sidebar-right {
    display: none !important;
  }
  .main-content {
    width: 100% !important;
    padding: 0 0.5rem;
    min-width: 0;
    box-sizing: border-box;
  }
  .filter-menu {
    padding: 0.5rem 0 !important;
  }
}
@media (max-width: 600px) {
  .main-content {
    padding: 0 0.2rem;
  }

  .profile-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .profile-kpis {
    grid-template-columns: 1fr;
  }
}

.profileinfo-scrollable {
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 2rem;
  padding-bottom: 9rem;
  scrollbar-width: none; /* Firefox */
}
.profileinfo-scrollable::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>

