<template>
  <div class="filter-menu">
    <div class="p-fluid p-pt-4 p-pb-4">
      <div class="surface-card p-4 shadow-2 border-round ">

        <!-- Section Avatar (Image de profil) -->
        <div class="field m-2 col-12 md:col-6">
          <div class="flex align-items-center">
            <img :src="user.photoURL || defaultAvatar" alt="Avatar" class="p-2" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover;" />
            <h1 class="pl-4">{{ user.prenom }} {{ user.nom }}</h1>
          </div>
        </div>
      </div>

      <h5 class="mb-4">Informations personnelles</h5>
      <div class="surface-card p-4 shadow-2 border-round mt-4 w-4 ">
        <div class="grid form-grid p-fluid">
          <div class="field mb-4 w-6 p-2">
            <h5>Email:</h5>
            <p>{{ user.email }}</p>

            <h5>Id :</h5>
            <p>{{ user.uid }}</p>

            <h5>Ville :</h5>
            <p>{{ user.ville }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../../../../firebase.js';

const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

const user = ref({
  uid: '',
  prenom: '',
  nom: '',
  bio: '',
  photoURL: '',
  email: '',
  ville: ''
});

const selectedAvatarFile = ref(null);

// Fonction pour récupérer le profil de l'utilisateur par son ID
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
  const db = getDatabase();
  const userRef = dbRef(db, `Users/${user.value.uid}`);

  if (selectedAvatarFile.value) {
    // Optionnel : Logic pour uploader l'avatar sur Firebase Storage
    // Ici, vous aurez besoin des credentials pour l'utilisateur ou faire autrement.
    // Pour simplifier, on suppose que vous avez déjà les droits.
    try {
      const avatarRef = storageRef(storage, `Users/${user.value.uid}/profile-picture.jpg`);
      await uploadBytes(avatarRef, selectedAvatarFile.value);
      const photoURL = await getDownloadURL(avatarRef);

      user.value.photoURL = photoURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar :', error);
      alert('Erreur lors de l\'upload de l\'avatar');
      return;
    }
  }

  await set(userRef, {
    Prenom: user.value.prenom,
    Nom: user.value.nom,
    Mail: user.value.email,
    Ville: user.value.ville,
    Bio: user.value.bio,
    PhotoURL: user.value.photoURL
  });

  alert('Profil mis à jour avec succès');
};

const onAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedAvatarFile.value = file;
  }
};

const route = useRoute();
onMounted(async () => {
  const userId = route.params.id; // Récupération de l'ID dans l'URL
  if (userId) {
    await fetchUserProfileById(userId); // Charger le profil correspondant
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
});
</script>

<style scoped>
.p-fluid {
  padding: 20px;
}

@media (max-width: 600px) {
  .w-4 {
    width: 100% !important;
  }
}
</style>
