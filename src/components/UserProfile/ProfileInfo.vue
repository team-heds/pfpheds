<template>
  <div class="filter-menu">
    <div class="p-fluid p-pt-4 p-pb-4">
      <div class="">
        <!-- Affichage du composant CardNameProfile -->
        <CardNameProfile class="" />

        <!-- Résumé du stage utilisateur -->
        <ResumStageUserProfile class="w-4" />

        <!-- Section pour changer la photo de profil -->
        <div class="p-field m-4 card w-4">
          <label for="avatar-upload">Photo de profil actuelle :</label>
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
          <Button
            label="Enregistrer"
            class="p-mt-2 w-4"
            @click="saveProfile"
            icon="pi pi-save"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Button from 'primevue/button';
import { storage } from '../../../firebase.js';
import CardNameProfile from '@/components/Bibliotheque/Profile/CardNameProfile.vue';
import ResumStageUserProfile from '@/components/UserProfile/ResumStageUserProfile.vue';

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

// Fonction pour charger un profil utilisateur via son ID
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
    // Nécessite un utilisateur authentifié pour l'upload,
    // mais cela ne sert qu'à vérifier que vous avez l'accès.
    // Cependant, si vous souhaitez rester neutre, retirez l'obligation.
    // Ici on suppose que vous avez accès :

    const userId = user.value.uid;
    if (!userId) {
      alert('Aucun utilisateur chargé, impossible de sauvegarder.');
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
      alert('Photo de profil mise à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar :', error);
      alert('Erreur lors de l\'upload de l\'avatar');
    }
  } else {
    alert('Veuillez sélectionner une photo avant de sauvegarder.');
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
    await fetchUserProfileById(userId); // Charge le profil correspondant à l'ID
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
});
</script>

<style scoped>
.p-fluid {
  padding: 20px;
}

img {
  border: 2px solid #ccc;
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

@media (max-width: 600px) {
  .w-4 {
    width: 100% !important;
  }
}
</style>
