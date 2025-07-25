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
          <!-- Affichage du nom et prénom de l'utilisateur -->
          <VotationResultProfil :userId="user.uid" class="w-full "  />

          <!-- Radar profil stage + critères validés -->
          <RadarProfil :scores="radarScores" :totalStages="totalStages" />
          <!-- Résumé du stage utilisateur -->
          <ResumStageUserProfile class="w-full" />


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
    <div class="sidebar-right">
      <RightSidebar />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

// Importation des composants utilisés
import CardNameProfile from '@/components/Bibliotheque/Profile/CardNameProfile.vue';
import ResumStageUserProfile from '@/components/UserProfile/ResumStageUserProfile.vue';
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue';
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue';
import VotationResultProfil from '@/components/UserProfile/VotationResultProfil.vue';
import RadarProfil from '@/components/UserProfile/RadarProfil.vue';

const toast = useToast();

// Définition d'un avatar par défaut
const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

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
  const db = getDatabase();
  try {
    const studentRef = dbRef(db, `Students/${userId}`);
    const snapshotStudent = await get(studentRef);
    if (snapshotStudent.exists()) {
      userProfile.value = { ...snapshotStudent.val() };
    } else {
      userProfile.value = null;
      console.error("Aucun profil trouvé pour l'ID :", userId);
    }
  } catch (error) {
    userProfile.value = null;
    console.error("Erreur lors de la récupération des données :", error);
  }
};

onMounted(async () => {
  if (userId) {
    user.value.uid = userId;
    await fetchUserProfileById(userId);
  }
});

// Agrégation des scores radar par critère (nombre de validations)
const radarScores = computed(() => {
  const scores = Object.fromEntries(criteriaLabels.map(k => [k, 0]));
  if (userProfile.value?.PFP_valided) {
    Object.values(userProfile.value.PFP_valided).forEach(place => {
      criteriaLabels.forEach(crit => {
        if (place[crit] === true) scores[crit]++;
      });
    });
  }
  return scores;
});

const totalStages = computed(() => {
  if (userProfile.value?.PFP_valided) {
    return Object.keys(userProfile.value.PFP_valided).length;
  }
  return 0;
});

// Fonction pour charger un profil utilisateur via son ID
const fetchUserProfile = async (userId) => {
  const db = getDatabase();
  const userRef = dbRef(db, `Users/${userId}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const userData = snapshot.val();
    user.value = {
      uid: userId,
      prenom: userData.Prenom || '',
      nom: userData.Nom || '',
      email: userData.Mail || '',
      ville: userData.Ville || '',
      bio: userData.Biography || '',
      photoURL: userData.PhotoURL || defaultAvatar
    };
  } else {
    console.error("Aucun profil trouvé pour l'ID :", userId);
  }
};

// Fonction pour sauvegarder la nouvelle photo de profil
const saveProfile = async () => {
  if (selectedAvatarFile.value) {
    const userId = user.value.uid;
    if (!userId) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Aucun utilisateur chargé, impossible de sauvegarder.', life: 4000 });
      return;
    }
    const avatarRef = storageRef(storage, `users/${userId}/profile-picture.jpg`);
    try {
      await uploadBytes(avatarRef, selectedAvatarFile.value);
      const photoURL = await getDownloadURL(avatarRef);
      const db = getDatabase();
      const userRef = dbRef(db, `Users/${userId}`);
      await update(userRef, {
        PhotoURL: photoURL
      });
      user.value.photoURL = photoURL;
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Photo de profil mise à jour avec succès', life: 4000 });
    } catch (error) {
      console.error("Erreur lors de l'upload de l'avatar :", error);
      toast.add({ severity: 'error', summary: 'Erreur', detail: "Erreur lors de l'upload de l'avatar", life: 4000 });
    }
  } else {
    toast.add({ severity: 'warn', summary: 'Avertissement', detail: 'Veuillez sélectionner une photo avant de sauvegarder.', life: 4000 });
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