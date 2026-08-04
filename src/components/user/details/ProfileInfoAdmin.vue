<template>
  <div class="filter-layout">
    <!-- Contenu Principal -->
    <div class="main-content profileinfo-scrollable">
      <div class="filter-menu p-fluid p-pt-4 p-pb-4">
        <div>
          <CardNameProfile />
          <VotationResultProfil v-if="user.uid" :userId="user.uid" class="w-full" />
          <div v-if="isProfileLoading" class="profile-loading-card">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            Chargement du profil et des stages...
          </div>
          <div v-else-if="profileLoadError" class="profile-loading-card error">
            <i class="pi pi-exclamation-triangle mr-2"></i>
            {{ profileLoadError }}
          </div>
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
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/supabase';
import { extractStudentsPhysioFieldEntries } from '@/utils/profileStages';

import CardNameProfile from '@/components/user/library/CardNameProfile.vue'
import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'
import VotationResultProfil from '@/components/user/details/VotationResultProfil.vue'
import ProfileAdminRightSidebar from '@/components/user/library/ProfileAdminRightSidebar.vue'

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
      const mergedPfpValided = extractStudentsPhysioFieldEntries(data, ['pfp_valided'])
      const mergedPfp2Data = extractStudentsPhysioFieldEntries(data, ['pfp2_data'])

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
const isProfileLoading = ref(false)
const profileLoadError = ref('')

const loadProfileData = async (userId) => {
  if (!userId) {
    user.value.uid = ''
    userProfile.value = null
    profileLoadError.value = "Aucun ID d'utilisateur fourni dans l'URL"
    return
  }

  isProfileLoading.value = true
  profileLoadError.value = ''
  user.value.uid = userId

  try {
    await fetchUserProfileById(userId)
  } catch (error) {
    profileLoadError.value = 'Erreur pendant le chargement du profil.'
    console.warn('Erreur loadProfileData:', error?.message || error)
  } finally {
    isProfileLoading.value = false
  }
}

watch(
  () => route.params.id,
  async (newId) => {
    await loadProfileData(newId)
  },
  { immediate: true }
)
</script>


<style scoped>
/* Layout global avec sidebars et contenu central */
.filter-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
  align-items: start;
  gap: clamp(1rem, 2vw, 2rem);
  width: min(100%, 90rem);
  min-height: 0;
  margin-inline: auto;
  padding-inline: clamp(1rem, 2vw, 2rem);
}

/* Sidebar Droite */
.sidebar-right {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* Contenu Principal */
.main-content {
  max-width: 64rem;
  min-width: 0;
  width: 100%;
  margin-inline: auto;
  padding-bottom: 7rem;
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

.profile-loading-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 0.8rem;
  padding: 0.9rem 1rem;
  margin: 0.8rem 0;
  font-weight: 500;
  color: var(--text-color, #1f2937);
  display: flex;
  align-items: center;
}

.profile-loading-card.error {
  border-color: #f87171;
  color: #b91c1c;
}

.save-btn {
  min-width: 200px;
  font-weight: 600;
}
</style>
