<template>
  <div class="mb-4">
    <div class="p-pt-4 p-pb-4">
      <div class="surface-card p-4 shadow-2 border-round">
        <!-- Section Avatar (Image de profil) -->
        <div class="field m-2 col-12 md:col-6 w-full">
          <div class="flex align-items-center">
            <img :src="user.photoURL || defaultAvatar" alt="Avatar" class="p-2" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover;" />
            <h1 class="pl-4">{{ user.prenom }} {{ user.nom }}</h1>
          </div>
        </div>
      </div>

      <h5 class="mb-4">Informations personnelles</h5>
      <div class="surface-card p-4 shadow-2 border-round mt-4 w-full">
        <div class="grid form-grid p-fluid">
          <div class="field mb-4 w-6 p-2">
            <h5>Email:</h5>
            <p>{{ user.email }}</p>

            <h5>Nom, Prénom :</h5>
            <p>{{ user.nom }} {{user.prenom}}</p>


            <h5>Classe:</h5>
            <p>{{ user.classe }}</p>

            <h5>Ville :</h5>
            <p>{{ user.ville }}</p>

            <h5>Répondant HES:</h5>
            <!-- Seul l'administrateur (l'utilisateur connecté) peut modifier le répondant -->
            <div v-if="isAdmin">
              <Dropdown
                v-model="selectedTeacher"
                :options="teachersOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionnez un enseignant"
              />
            </div>
            <div v-else>
              <p>{{ user.repondantHES }}</p>
            </div>

            <h5>Id :</h5>
            <p>{{ user.uid }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bouton pour sauvegarder le profil -->
    <div>
      <Button label="Sauvegarder le profil" @click="saveProfile"  class="mt-4 flex grid w-2 m-2"/>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { storage } from '../../../../firebase.js';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';

const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

// Profil consulté (celui affiché)
const user = ref({
  uid: '',
  prenom: '',
  nom: '',
  bio: '',
  photoURL: '',
  email: '',
  ville: '',
  classe: '',
  repondantHES: ''
});

// Profil de l'utilisateur connecté (pour vérifier s'il est admin)
const currentUserProfile = ref({
  uid: '',
  Roles: {}
});

const selectedAvatarFile = ref(null);
// Référence pour la sélection d'un enseignant dans le dropdown (pour modifier Répondant HES)
const selectedTeacher = ref("");

// Computed pour déterminer si l'utilisateur connecté est admin
const isAdmin = computed(() => {
  return currentUserProfile.value.Roles && currentUserProfile.value.Roles.admin === true;
});

// Récupération du profil consulté depuis /Users (basé sur l'ID de l'URL)
const fetchUserProfileById = async (userId) => {
  const db = getDatabase();
  const userRef = dbRef(db, `Users/${userId}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const userData = snapshot.val();
    user.value = {
      ...user.value,
      uid: userId,
      prenom: userData.Prenom || '',
      nom: userData.Nom || '',
      email: userData.Mail || '',
      ville: userData.Ville || '',
      bio: userData.Biography || '',
      photoURL: userData.PhotoURL || defaultAvatar,
      // Ici, on ne se sert pas du rôle pour modifier l'affichage (c'est le currentUserProfile qui compte)
    };
  } else {
    console.error("Aucun profil trouvé pour l'ID :", userId);
  }
};

// Récupération des données étudiant depuis /Students
const fetchStudentProfileById = async (userId) => {
  const db = getDatabase();
  const studentRef = dbRef(db, `Students/${userId}`);
  const snapshot = await get(studentRef);
  if (snapshot.exists()) {
    const studentData = snapshot.val();
    user.value.classe = studentData.Classe || studentData.Class || '';
    user.value.repondantHES = studentData.RepondantHES || '';
  } else {
    console.error("Aucun profil étudiant trouvé pour l'ID :", userId);
  }
};

// Récupération du profil de l'utilisateur connecté depuis /Users à l'aide de Firebase Auth
const fetchCurrentUserProfile = async (currentUserId) => {
  const db = getDatabase();
  const currentUserRef = dbRef(db, `Users/${currentUserId}`);
  const snapshot = await get(currentUserRef);
  if (snapshot.exists()) {
    currentUserProfile.value = snapshot.val();
    currentUserProfile.value.uid = currentUserId;
  } else {
    console.error("Aucun profil trouvé pour l'utilisateur connecté :", currentUserId);
  }
};

// Importation des enseignants depuis /Enseignants
const teachers = ref({});
const fetchTeachers = () => {
  const db = getDatabase();
  const teachersRef = dbRef(db, `Enseignants`);
  get(teachersRef)
    .then(snapshot => {
      if (snapshot.exists()) {
        teachers.value = snapshot.val() || {};
      }
    })
    .catch(error => {
      console.error("Erreur lors de la récupération des enseignants :", error);
    });
};

// Construction des options pour le dropdown des enseignants
const teachersOptions = computed(() => {
  return Object.keys(teachers.value).map(key => {
    const teacher = teachers.value[key];
    return { label: `${teacher.Forname} ${teacher.Name}`, value: key };
  });
});

// Pré-remplissage du dropdown si un répondeant est déjà présent et si l'utilisateur connecté est admin
watch(teachersOptions, (newOptions) => {
  if (user.value.repondantHES && isAdmin.value) {
    const teacherMatch = newOptions.find(opt => opt.label === user.value.repondantHES);
    if (teacherMatch) {
      selectedTeacher.value = teacherMatch.value;
    } else {
      selectedTeacher.value = "";
    }
  }
}, { immediate: true });

// Fonction de sauvegarde du profil : met à jour Users et Students
const saveProfile = async () => {
  const db = getDatabase();
  // Si un nouvel avatar a été sélectionné, on l'upload
  if (selectedAvatarFile.value) {
    try {
      const avatarRef = storageRef(storage, `Users/${user.value.uid}/profile-picture.jpg`);
      await uploadBytes(avatarRef, selectedAvatarFile.value);
      const photoURL = await getDownloadURL(avatarRef);
      user.value.photoURL = photoURL;
    } catch (error) {
      console.error("Erreur lors de l'upload de l'avatar :", error);
      alert("Erreur lors de l'upload de l'avatar");
      return;
    }
  }
  
  // Mise à jour du profil dans Users
  const userRef = dbRef(db, `Users/${user.value.uid}`);
  await update(userRef, {
    Prenom: user.value.prenom,
    Nom: user.value.nom,
    Mail: user.value.email,
    Ville: user.value.ville,
    Bio: user.value.bio,
    PhotoURL: user.value.photoURL
  });

  // Seul un administrateur connecté peut modifier le champ Répondant HES
  if (isAdmin.value && selectedTeacher.value) {
    const teacherOpt = teachersOptions.value.find(opt => opt.value === selectedTeacher.value);
    const teacherLabel = teacherOpt ? teacherOpt.label : '';
    user.value.repondantHES = teacherLabel;
  }
  
  // Mise à jour du profil étudiant dans Students
  const studentRef = dbRef(db, `Students/${user.value.uid}`);
  await update(studentRef, {
    RepondantHES: user.value.repondantHES
  });

  alert("Profil mis à jour avec succès");
};

const onAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedAvatarFile.value = file;
  }
};

const route = useRoute();
const auth = getAuth();
onMounted(async () => {
  // Récupérer l'ID de l'utilisateur dont le profil est consulté (depuis l'URL)
  const userId = route.params.id;
  if (userId) {
    await fetchUserProfileById(userId);
    await fetchStudentProfileById(userId);
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
  // Récupérer l'utilisateur connecté via Firebase Auth
  onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      await fetchCurrentUserProfile(currentUser.uid);
    }
  });
  // Charger la liste des enseignants
  await fetchTeachers();
});
</script>

<style scoped>
@media (max-width: 600px) {
  .w-4 {
    width: 100% !important;
  }
}
</style>
