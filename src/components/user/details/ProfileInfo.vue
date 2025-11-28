
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
          <VotationResultProfil :userId="user.uid" class="w-full" />
          <!-- Radar profil stage + critères validés -->
          <RadarProfil :scores="radarScores" :totalStages="totalStages" />
          <!-- Résumé du stage utilisateur -->
          <ResumStageUserProfile :userProfile="userProfile" :userId="user.uid" class="w-full" />
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

// Importation des composants utilisés
import CardNameProfile from '@/components/user/library/CardNameProfile.vue';
import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'
import LeftSidebar from '@/components/social/library/LeftSidebar.vue';
import RightSidebar from '@/components/social/library/RightSidebar.vue';
import VotationResultProfil from '@/components/user/details/VotationResultProfil.vue'
import RadarProfil from '@/components/user/details/RadarProfil.vue'
import QuestsProfileCard from '@/components/gamification/QuestsProfileCard.vue'

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
const userId = route?.params?.id || null;

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

onMounted(async () => {
  if (userId) {
    user.value.uid = userId;
    await fetchUserProfileById(userId);
    await fetchUserHouseColor(userId);
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

// Agrégation des scores radar par critère (nombre de validations)
const radarScores = computed(() => {
  const scores = Object.fromEntries(criteriaLabels.map(k => [k, 0]));
  if (userProfile.value?.pfp_valided) {
    const pfpArray = parsePfpValided(userProfile.value.pfp_valided)
    
    pfpArray.forEach(place => {
      criteriaLabels.forEach(crit => {
        if (place[crit] === true) scores[crit]++;
      });
    });
  }
  return scores;
});

const totalStages = computed(() => {
  if (userProfile.value?.pfp_valided) {
    const pfpArray = parsePfpValided(userProfile.value.pfp_valided)
    return pfpArray.length
  }
  return 0;
});

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

