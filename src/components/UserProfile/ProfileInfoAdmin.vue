<template>
  <div class="filter-layout">
    <!-- Sidebar Gauche -->
    <div class="sidebar-left">
      <LeftSidebar />
    </div>

    <!-- Contenu Principal -->
    <div class="main-content profileinfo-scrollable">
      <div class="filter-menu p-fluid p-pt-4 p-pb-4">
        <div>
          <CardNameProfile />
          <VotationResultProfil :userId="user.uid" class="w-full" />
          <ResumStageUserProfile class="w-full" />
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
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

import CardNameProfile from '@/components/Bibliotheque/Profile/CardNameProfile.vue';
import ResumStageUserProfile from '@/components/UserProfile/ResumStageUserProfile.vue';
import VotationResultProfil from '@/components/UserProfile/VotationResultProfil.vue';
import ProfileAdminRightSidebar from '@/components/Bibliotheque/Profile/ProfileAdminRightSidebar.vue';
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue';

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

const selectedAvatarFile = ref(null);

const toast = useToast();

const fetchUserProfileById = async (userId) => {
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

const onAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedAvatarFile.value = file;
  }
};

const route = useRoute();

onMounted(async () => {
  const userId = route.params.id; // Récupère l'ID depuis l'URL
  if (userId) {
    await fetchUserProfileById(userId);
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
});
</script>


<style scoped>
/* Layout global avec sidebars et contenu central */
.filter-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  /* Sidebar gauche, contenu central, sidebar droite */
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
