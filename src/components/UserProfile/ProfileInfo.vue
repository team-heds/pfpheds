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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Button from 'primevue/button';
import { storage } from '../../../firebase.js';
import CardNameProfile from '@/components/Bibliotheque/Profile/CardNameProfile.vue';
import ResumStageUserProfile from '@/components/UserProfile/ResumStageUserProfile.vue';

// Définir l'URL de l'avatar par défaut
const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

// Données utilisateur
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

// Méthode pour récupérer le profil utilisateur depuis Firebase
const fetchUserProfile = async (email) => {
  const db = getDatabase();
  const usersRef = dbRef(db, 'Users');
  const snapshot = await get(usersRef);
  if (snapshot.exists()) {
    const usersData = snapshot.val();
    for (const userId in usersData) {
      const userData = usersData[userId];
      if (userData.Mail && userData.Mail.toLowerCase() === email.toLowerCase()) {
        user.value = {
          uid: userId,
          prenom: userData.Forname || '',
          nom: userData.Name || '',
          email: userData.Mail || '',
          ville: userData.Ville || '',
          bio: userData.Biography || '',
          photoURL: userData.PhotoURL || defaultAvatar
        };
        return;
      }
    }
  }
};

// Méthode pour sauvegarder uniquement la photo de profil dans Firebase
const saveProfile = async () => {
  if (selectedAvatarFile.value) {
    const auth = getAuth();
    const authUser = auth.currentUser;
    if (!authUser) {
      alert('Veuillez vous authentifier avant de changer l\'avatar');
      return;
    }

    const avatarRef = storageRef(storage, `users/${authUser.uid}/profile-picture.jpg`);

    try {
      // Upload de l'avatar dans Firebase Storage
      await uploadBytes(avatarRef, selectedAvatarFile.value);
      const photoURL = await getDownloadURL(avatarRef);

      // Mettre à jour uniquement le champ `PhotoURL` dans la base Firebase
      const db = getDatabase();
      const userRef = dbRef(db, `Users/${user.value.uid}`);
      await update(userRef, {
        PhotoURL: photoURL
      });

      // Mettre à jour la photo affichée localement
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

// Gérer le changement d'avatar
const onAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedAvatarFile.value = file;
  }
};

// Méthode pour observer les changements d'état de l'authentification
onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      await fetchUserProfile(authUser.email);
    } else {
      user.value = {};
    }
  });
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
</style>
