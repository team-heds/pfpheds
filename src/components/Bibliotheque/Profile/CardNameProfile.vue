<template>
  <div class="mb-4">
    <div class="p-pt-4 p-pb-4">
      <div class="surface-card p-4 shadow-2 border-round">
        <!-- Section Avatar (Image de profil) -->
        <div class="field m-2 col-12 md:col-6 w-full">
          <div class="flex align-items-center">
            <img
              :src="user.photoURL || defaultAvatar"
              alt="Avatar"
              class="p-2"
              style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover;"
            />
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

            <h5>Nom :</h5>
            <p>{{ user.nom }}</p>

            <h5>Prénom :</h5>
            <p>{{ user.prenom }}</p>

            <h5>Classe:</h5>
            <p>{{ user.classe }}</p>

            <h5>Ville :</h5>
            <p>{{ user.ville }}</p>

            <h5>Répondant HES:</h5>
            <!-- Seul l'administrateur peut modifier le répondant via le dropdown -->
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
    <div style="margin-top: 20px; text-align: center;">
      <Button label="Sauvegarder le profil" @click="saveProfile" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../../../../firebase.js';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';

const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

// Objet utilisateur (profil regroupant Users et Students)
const user = ref({
  uid: '',
  prenom: '',
  nom: '',
  bio: '',
  photoURL: '',
  email: '',
  ville: '',
  classe: '',
  repondantHES: '',
  Roles: {} // On ajoute la propriété Roles pour vérifier le rôle admin
});

const selectedAvatarFile = ref(null);
// Référence pour la sélection d'un enseignant dans le dropdown
// Ce dropdown ne sera visible que si l'utilisateur connecté a le rôle admin
const selectedTeacher = ref("");

// Computed pour déterminer si l'utilisateur connecté est admin
const isAdmin = computed(() => {
  return user.value.Roles && user.value.Roles.admin == true;
});

// Récupération du profil utilisateur depuis la table Users
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
      Roles: userData.Roles || {}
    };
  } else {
    console.error("Aucun profil trouvé pour l'ID :", userId);
  }
};

// Récupération des données étudiant depuis la table Students
const fetchStudentProfileById = async (userId) => {
  const db = getDatabase();
  const studentRef = dbRef(db, `Students/${userId}`);
  const snapshot = await get(studentRef);
  if (snapshot.exists()) {
    const studentData = snapshot.val();
    // Utilisation de "Classe" ou "Class" selon la structure
    user.value.classe = studentData.Classe || studentData.Class || '';
    user.value.repondantHES = studentData.RepondantHES || '';
  } else {
    console.error("Aucun profil étudiant trouvé pour l'ID :", userId);
  }
};

// Importation des enseignants depuis Firebase (nœud "Enseignants")
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

// Construction de la liste d'options pour le dropdown des enseignants
// Chaque option affiche "Forname Name" et la valeur est l'ID de l'enseignant
const teachersOptions = computed(() => {
  return Object.keys(teachers.value).map(key => {
    const teacher = teachers.value[key];
    return { label: `${teacher.Forname} ${teacher.Name}`, value: key };
  });
});

// Pré-remplir le dropdown si un répondeant est déjà présent et si l'utilisateur est admin
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

// Fonction de sauvegarde du profil utilisateur et étudiant
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
  
  // Mettre à jour le profil dans Users
  const userRef = dbRef(db, `Users/${user.value.uid}`);
  await update(userRef, {
    Prenom: user.value.prenom,
    Nom: user.value.nom,
    Mail: user.value.email,
    Ville: user.value.ville,
    Bio: user.value.bio,
    PhotoURL: user.value.photoURL
  });

  // Pour un utilisateur admin, si une sélection a été faite, mettre à jour le profil étudiant
  if (isAdmin.value && selectedTeacher.value) {
    const teacherOpt = teachersOptions.value.find(opt => opt.value === selectedTeacher.value);
    const teacherLabel = teacherOpt ? teacherOpt.label : '';
    user.value.repondantHES = teacherLabel;
  }
  
  // Mettre à jour le profil dans Students
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
onMounted(async () => {
  const userId = route.params.id; // Récupération de l'ID dans l'URL
  if (userId) {
    await fetchUserProfileById(userId);     // Charger le profil depuis Users (incluant Roles)
    await fetchStudentProfileById(userId);    // Charger les données depuis Students
    await fetchTeachers();                    // Charger la liste des enseignants
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
});
</script>

<style scoped>
@media (max-width: 600px) {
  .w-4 {
    width: 100% !important;
  }
}
</style>
