<template>
  <div class="filter-menu">
    <div class="p-fluid p-pt-4 p-pb-4">
      <div class="surface-card p-4 shadow-2 border-round ">

        <!-- Section Avatar (Image de profil) -->
        <div class="field m-2 col-12 md:col-6">
          <div class="flex align-items-center">
            <img :src="user.photoURL || defaultAvatar" alt="Avatar" class="p-2" style="width: 150px; height: 150px; border-radius: 50%;" />
            <h1 class="pl-4">{{user.prenom }} {{ user.nom }}</h1>
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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import {  ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import {  storage} from '../../../../firebase.js';


// Définir l'URL de l'avatar par défaut
const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

// Données utilisateur
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
          photoURL: userData.photoURL || defaultAvatar
        };
        return;
      }
    }
  }
};

// Méthode pour sauvegarder le profil utilisateur dans Firebase
const saveProfile = async () => {
  const db = getDatabase();
  const userRef = dbRef(db, `Users/${user.value.uid}`);

  if (selectedAvatarFile.value) {
    // Vérification de l'authentification avant l'upload
    const auth = getAuth();
    const authUser = auth.currentUser;
    if (!authUser) {
      alert('Veuillez vous authentifier avant de changer l\'avatar');
      return;
    }

    const avatarRef = storageRef(storage, `Users/${authUser.uid}/profile-picture.jpg`);

    try {
      // Upload de l'avatar dans Firebase Storage
      await uploadBytes(avatarRef, selectedAvatarFile.value);
      const photoURL = await getDownloadURL(avatarRef);

      // Mettre à jour l'URL de l'avatar dans le profil utilisateur
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

.table-dark-gray {
  background-color: #343a40;
  color: #fff;
}

.table-dark-gray th,
.table-dark-gray td {
  border-color: #454d55;
}

.text-danger {
  color: red !important;
}

.text-green-500 {
  color: green !important;
}

.text-red-500 {
  color: red !important;
}

.p-table {
  width: 100%;
  border-collapse: collapse;
}

.p-table th,
.p-table td {
  border: 1px solid #ccc;
  padding: 8px;
}

.p-table th {
  background-color: #f4f4f4;
}

.pi-check-circle {
  color: green;
}

.pi-times-circle {
  color: red;
}
</style>
