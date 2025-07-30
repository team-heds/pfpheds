<<<<<<< HEAD:src/components/user/library/CardNameProfile.vue
<template>
  <!-- BANDEAU MAISON GAMIFICATION
  <BandeauMaison
    v-if="userGamification && userGamification.maison && userGamification.niveau"
    :maison="userGamification.maison"
    :niveau="userGamification.niveau"
    class="mb-4"
  />

  -->
  <!-- XP BAR
  <XPBar
    v-if="userGamification && userGamification.xp !== undefined && userGamification.xpToNext !== undefined"
    :xp="userGamification.xp"
    :xp-to-next="userGamification.xpToNext"
    :niveau="userGamification.niveau"
    :maison="userGamification.maison"
    class="mb-4"
  />
   -->
  <!-- FIN BANDEAU MAISON + XP -->
  <div class="mb-4 card-profile-responsive">
    <div class="avatar-wrapper">
      <img :src="user.photoURL || defaultAvatar" alt="Avatar" style="border-radius: 3rem;" />
      <h1 class="pl-4">{{ user.prenom }} {{ user.nom }}</h1>
    </div>
    <h5 class="mb-4">Informations personnelles</h5>
    <div class="surfaces-card info-grid">
      <div class="info-item">
        <i class="pi pi-envelope info-icon"></i>
        <span class="info-label">Email :</span>
        <span class="info-value">{{ user.email }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-user info-icon"></i>
        <span class="info-label">Nom, Prénom :</span>
        <span class="info-value">{{ user.nom }} {{user.prenom}}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-briefcase info-icon"></i>
        <span class="info-label">Classe :</span>
        <span class="info-value">{{ user.classe }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-map-marker info-icon"></i>
        <span class="info-label">Ville :</span>
        <span class="info-value">{{ user.ville }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-id-card info-icon"></i>
        <span class="info-label">Id :</span>
        <span class="info-value id">{{ user.uid }}</span>
      </div>
      <div class="info-item info-item-respondant">
        <i class="pi pi-users info-icon"></i>
        <span class="info-label">Répondant HES :</span>
        <br class="show-on-overflow"/>
        <span class="info-value">
          <template v-if="isAdmin">
            <Dropdown
              v-model="selectedTeacher"
              :options="teachersOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez un enseignant"
            />
          </template>
          <template v-else>
            {{ user.repondantHES }}
          </template>
        </span>
      </div>
      <div class="info-item info-item-full actions-row">
        <Button label="Sauvegarder le profil" @click="saveProfile" class="save-btn" />
      </div>
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
import BandeauMaison from '@/components/user/profile/BandeauMaison.vue'
import XPBar from '@/components/user/profile/XPBar.vue'

const defaultAvatar = '@/assets/images/avatar/01.jpg';

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
  repondantHES: '',
  maison: '',
  niveau: '',
  xp: 0,
  xpToNext: 100
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

// Exemple de récupération des infos gamification (à adapter à ta logique)
const userGamification = ref({
  maison: user.value.maison || 'harmonis',
  niveau: user.value.niveau || 1,
  xp: user.value.xp || 20,
  xpToNext: user.value.xpToNext || 100
});

const xpPercent = computed(() => {
  if (!userGamification.value.xpToNext) return 0;
  return Math.round((userGamification.value.xp / userGamification.value.xpToNext) * 100);
});
const xpColor = computed(() => {
  switch ((userGamification.value.maison || '').toLowerCase()) {
    case 'harmonis': return '#608E62';
    case 'elaris': return '#B15E56';
    case 'doloris': return '#D4B25B';
    case 'solencia': return '#668DA3';
    default: return '#6366F1';
  }
});
</script>

<style scoped>
.surfaces-card,
.info-item {
  box-sizing: border-box;
}

.actions-row,
.info-item-full {
  width: 100%;
  box-sizing: border-box;
}

.save-btn {
  width: auto;
  min-width: 200px;
  max-width: 100%;
}

.p-dropdown {
  max-width: 100%;
  min-width: 0;
}

.surfaces-card {
  margin: 1.5rem 0;
  background-color: var(--surface-card);
  padding: 1.5rem;
  border-radius: 2rem;
  overflow: hidden;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1rem;
}
@media (max-width: 700px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
.info-item {
  display: flex;
  align-items: center;
  background: var(--surface-overlay, #232946);
  border-radius: 1rem;
  padding: 0.7rem 1rem;
  gap: 0.7rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.info-icon {
  font-size: 1.25rem;
  color: var(--primary-color);
  flex-shrink: 0;
}
.info-label {
  font-size: 0.96rem;
  color: #aaa;
  margin-right: 0.5rem;
  min-width: 90px;
}
.info-value {
  font-size: 1.05rem;
  font-weight: 500;
  color: #fff;
  word-break: break-all;
}
.info-value.id {
  word-break: normal;
  overflow-x: auto;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}
.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}
.save-btn {
  font-weight: 600;
}
.info-item-full {
  grid-column: 1 / -1;
  justify-content: flex-end;
  display: flex;
}
@media (max-width: 600px) {
  .w-4 {
    width: 100% !important;
  }
}

.info-item-respondant {
  flex-wrap: wrap;
  align-items: flex-start;
}
.info-item-respondant .info-label {
  min-width: unset;
  margin-bottom: 0.2rem;
}
.info-item-respondant .info-value {
  display: block;
  width: 100%;
  word-break: break-word;
}

/* --- Responsive Mobile Styles --- */
@media (max-width: 991px) {
  .mb-4 {
    margin-bottom: 1rem !important;
  }
  .p-pt-4, .p-pb-4, .p-4 {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
  .surfaces-card {
    border-radius: 1rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .flex.align-items-center {
    flex-direction: column !important;
    align-items: center !important;
    gap: 0.5rem;
  }
  img[alt="Avatar"] {
    width: 90px !important;
    height: 90px !important;
    margin: 0 auto;
    display: block;
  }
  h1.pl-4 {
    padding-left: 0 !important;
    font-size: 1.2rem;
    text-align: center;
    margin-top: 0.4rem;
  }
  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .info-item {
    flex-direction: column !important;
    align-items: flex-start !important;
    font-size: 0.98rem;
    padding: 0.2rem 0.1rem;
  }
  .actions-row {
    justify-content: center !important;
    display: flex;
  }
  .save-btn {
    width: 100% !important;
    font-size: 1rem;
  }
}
@media (max-width: 600px) {
  .surfaces-card {
    padding: 0.3rem !important;
  }
  h1.pl-4 {
    font-size: 1rem;
  }
}

.card-profile-responsive {
  padding: 1.2rem 1rem 1.2rem 1rem;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 1rem;
}
.avatar-wrapper img[alt="Avatar"] {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
  display: block;
}
.avatar-wrapper h1 {
  padding-left: 0 !important;
  text-align: center;
  margin-top: 0.4rem;
}
@media (max-width: 991px) {
  .card-profile-responsive {
    padding: 1rem 0.7rem 1rem 0.7rem;
  }
  .avatar-wrapper img[alt="Avatar"] {
    width: 90px !important;
    height: 90px !important;
  }
  .avatar-wrapper {
    padding-bottom: 0.7rem;
  }
}
@media (max-width: 600px) {
  .card-profile-responsive {
    padding: 0.5rem 0.2rem 0.5rem 0.2rem;
  }
  .avatar-wrapper img[alt="Avatar"] {
    width: 70px !important;
    height: 70px !important;
  }
}
</style>
=======
<template>
  <!-- BANDEAU MAISON GAMIFICATION
  <BandeauMaison
    v-if="userGamification && userGamification.maison && userGamification.niveau"
    :maison="userGamification.maison"
    :niveau="userGamification.niveau"
    class="mb-4"
  />

  -->
  <!-- XP BAR
  <XPBar
    v-if="userGamification && userGamification.xp !== undefined && userGamification.xpToNext !== undefined"
    :xp="userGamification.xp"
    :xp-to-next="userGamification.xpToNext"
    :niveau="userGamification.niveau"
    :maison="userGamification.maison"
    class="mb-4"
  />
   -->
  <!-- FIN BANDEAU MAISON + XP -->
  <div class="mb-4 card-profile-responsive">
    <div class="avatar-wrapper">
      <img :src="user.photoURL || defaultAvatar" alt="Avatar" style="border-radius: 3rem;" />
      <h1 class="pl-4">{{ user.prenom }} {{ user.nom }}</h1>
    </div>
    <h5 class="mb-4">Informations personnelles</h5>
    <div class="surfaces-card info-grid">
      <div class="info-item">
        <i class="pi pi-envelope info-icon"></i>
        <span class="info-label">Email :</span>
        <span class="info-value">{{ user.email }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-user info-icon"></i>
        <span class="info-label">Nom, Prénom :</span>
        <span class="info-value">{{ user.nom }} {{user.prenom}}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-briefcase info-icon"></i>
        <span class="info-label">Classe :</span>
        <span class="info-value">{{ user.classe }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-map-marker info-icon"></i>
        <span class="info-label">Ville :</span>
        <span class="info-value">{{ user.ville }}</span>
      </div>
      <div class="info-item">
        <i class="pi pi-id-card info-icon"></i>
        <span class="info-label">Id :</span>
        <span class="info-value id">{{ user.uid }}</span>
      </div>
      <div class="info-item info-item-respondant">
        <i class="pi pi-users info-icon"></i>
        <span class="info-label">Répondant HES :</span>
        <br class="show-on-overflow"/>
        <span class="info-value">
          <template v-if="isAdmin">
            <Dropdown
              v-model="selectedTeacher"
              :options="teachersOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez un enseignant"
            />
          </template>
          <template v-else>
            {{ user.repondantHES }}
          </template>
        </span>
      </div>
      <div class="info-item info-item-full actions-row">
        <Button label="Sauvegarder le profil" @click="saveProfile" class="save-btn" />
      </div>
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
import BandeauMaison from '@/components/Profile/BandeauMaison.vue'
import XPBar from '@/components/Profile/XPBar.vue'

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
  repondantHES: '',
  maison: '',
  niveau: '',
  xp: 0,
  xpToNext: 100
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

// Exemple de récupération des infos gamification (à adapter à ta logique)
const userGamification = ref({
  maison: user.value.maison || 'harmonis',
  niveau: user.value.niveau || 1,
  xp: user.value.xp || 20,
  xpToNext: user.value.xpToNext || 100
});

const xpPercent = computed(() => {
  if (!userGamification.value.xpToNext) return 0;
  return Math.round((userGamification.value.xp / userGamification.value.xpToNext) * 100);
});
const xpColor = computed(() => {
  switch ((userGamification.value.maison || '').toLowerCase()) {
    case 'harmonis': return '#608E62';
    case 'elaris': return '#B15E56';
    case 'doloris': return '#D4B25B';
    case 'solencia': return '#668DA3';
    default: return '#6366F1';
  }
});
</script>

<style scoped>
.surfaces-card,
.info-item {
  box-sizing: border-box;
}

.actions-row,
.info-item-full {
  width: 100%;
  box-sizing: border-box;
}

.save-btn {
  width: auto;
  min-width: 200px;
  max-width: 100%;
}

.p-dropdown {
  max-width: 100%;
  min-width: 0;
}

.surfaces-card {
  margin: 1.5rem 0;
  background-color: var(--surface-card);
  padding: 1.5rem;
  border-radius: 2rem;
  overflow: hidden;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1rem;
}
@media (max-width: 700px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
.info-item {
  display: flex;
  align-items: center;
  background: var(--surface-overlay, #232946);
  border-radius: 1rem;
  padding: 0.7rem 1rem;
  gap: 0.7rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.info-icon {
  font-size: 1.25rem;
  color: var(--primary-color);
  flex-shrink: 0;
}
.info-label {
  font-size: 0.96rem;
  color: #aaa;
  margin-right: 0.5rem;
  min-width: 90px;
}
.info-value {
  font-size: 1.05rem;
  font-weight: 500;
  color: #fff;
  word-break: break-all;
}
.info-value.id {
  word-break: normal;
  overflow-x: auto;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}
.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}
.save-btn {
  font-weight: 600;
}
.info-item-full {
  grid-column: 1 / -1;
  justify-content: flex-end;
  display: flex;
}
@media (max-width: 600px) {
  .w-4 {
    width: 100% !important;
  }
}

.info-item-respondant {
  flex-wrap: wrap;
  align-items: flex-start;
}
.info-item-respondant .info-label {
  min-width: unset;
  margin-bottom: 0.2rem;
}
.info-item-respondant .info-value {
  display: block;
  width: 100%;
  word-break: break-word;
}

/* --- Responsive Mobile Styles --- */
@media (max-width: 991px) {
  .mb-4 {
    margin-bottom: 1rem !important;
  }
  .p-pt-4, .p-pb-4, .p-4 {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
  .surfaces-card {
    border-radius: 1rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .flex.align-items-center {
    flex-direction: column !important;
    align-items: center !important;
    gap: 0.5rem;
  }
  img[alt="Avatar"] {
    width: 90px !important;
    height: 90px !important;
    margin: 0 auto;
    display: block;
  }
  h1.pl-4 {
    padding-left: 0 !important;
    font-size: 1.2rem;
    text-align: center;
    margin-top: 0.4rem;
  }
  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .info-item {
    flex-direction: column !important;
    align-items: flex-start !important;
    font-size: 0.98rem;
    padding: 0.2rem 0.1rem;
  }
  .actions-row {
    justify-content: center !important;
    display: flex;
  }
  .save-btn {
    width: 100% !important;
    font-size: 1rem;
  }
}
@media (max-width: 600px) {
  .surfaces-card {
    padding: 0.3rem !important;
  }
  h1.pl-4 {
    font-size: 1rem;
  }
}

.card-profile-responsive {
  padding: 1.2rem 1rem 1.2rem 1rem;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 1rem;
}
.avatar-wrapper img[alt="Avatar"] {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto;
  display: block;
}
.avatar-wrapper h1 {
  padding-left: 0 !important;
  text-align: center;
  margin-top: 0.4rem;
}
@media (max-width: 991px) {
  .card-profile-responsive {
    padding: 1rem 0.7rem 1rem 0.7rem;
  }
  .avatar-wrapper img[alt="Avatar"] {
    width: 90px !important;
    height: 90px !important;
  }
  .avatar-wrapper {
    padding-bottom: 0.7rem;
  }
}
@media (max-width: 600px) {
  .card-profile-responsive {
    padding: 0.5rem 0.2rem 0.5rem 0.2rem;
  }
  .avatar-wrapper img[alt="Avatar"] {
    width: 70px !important;
    height: 70px !important;
  }
}
</style>
>>>>>>> prod:src/components/Bibliotheque/Profile/CardNameProfile.vue
