<template>
  <Navbar />
  <div class="min-h-screen flex relative lg:static">
    <div class="min-h-screen flex flex-column relative flex-auto">
      <div class="p-5 flex flex-column flex-auto">
        <ProfileInfo v-if="activeTab === 0" :user="user" />
        <DocumentsUserProfile v-if="activeTab === 1" />
        <ResumStageUserProfile v-if="activeTab === 2" />
        <ChatProfil v-if="activeTab === 3" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import Navbar from '@/components/Utils/Navbar.vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ProfileInfo from '@/components/UserProfile/ProfileInfo.vue';
import ResumStageUserProfile from '@/components/UserProfile/ResumStageUserProfile.vue';
import DocumentsUserProfile from '@/components/UserProfile/DocumentsUserProfile.vue';
import ChatProfil from '@/components/UserProfile/ChatProfil.vue';
import AppDarkAndLightMode from '@/layout/AppDarkAndLightMode.vue';
import { storage } from '../../../firebase.js';

export default {
  name: 'Profile',
  components: {
    Navbar,
    AppDarkAndLightMode,
    InputText,
    Button,
    ProfileInfo,
    ResumStageUserProfile,
    DocumentsUserProfile,
    ChatProfil,
  },
  setup(props, { route }) {
    const activeTab = ref(0);
    const checked = ref(false);
    const selectedCountry = ref(null);
    const countries = [
      { name: 'Valais', code: 'VS' },
      { name: 'Vaud', code: 'VD' },
      { name: 'Genève', code: 'GE' },
    ];

    const sidebarIcons = ['pi-home', 'pi-folder', 'pi-users', 'pi-comments'];
    const topMenu = [
      { icon: 'pi-inbox', label: 'Inbox' },
      { icon: 'pi-bell', label: 'Notifications', badge: true },
    ];

    const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

    const user = reactive({
      nom: '',
      prenom: '',
      bio: '',
      email: '',
      photoURL: '',
      uid: '',
      ville: '',
      canton: '',
      userAvatar: ''
    });

    const logo = '../../../public/assets/images/hespicto.png';
    const userAvatar = ref(defaultAvatar);

    const toggleSidebar = () => {};
    const toggleTopMenu = () => {};

    // Fonction pour charger le profil d'un utilisateur via son ID (pas celui connecté)
    const fetchUserProfileById = async (userId) => {
      const db = getDatabase();
      const userRef = dbRef(db, `Users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        user.uid = userId;
        user.nom = userData.Nom || '';
        user.prenom = userData.Prenom || '';
        user.email = userData.Mail || '';
        user.ville = userData.Ville || '';
        user.bio = userData.Biography || '';
        user.photoURL = userData.PhotoURL || defaultAvatar;
        // Charger la photo depuis le storage si besoin
        if (userData.PhotoURL) {
          userAvatar.value = userData.PhotoURL;
        } else {
          userAvatar.value = defaultAvatar;
        }
      } else {
        console.error("Aucun profil trouvé pour l'ID :", userId);
      }
    };

    // Récupérer l'ID de l'utilisateur depuis la route
    onMounted(async () => {
      const userId = route.params.id; // Récupérer l'ID de l'utilisateur à afficher
      if (userId) {
        await fetchUserProfileById(userId);
      } else {
        console.error("Aucun ID d'utilisateur fourni dans l'URL");
      }
    });

    return {
      activeTab,
      checked,
      selectedCountry,
      countries,
      sidebarIcons,
      topMenu,
      user,
      logo,
      userAvatar,
      toggleSidebar,
      toggleTopMenu
    };
  }
};
</script>

<style scoped>
.bg-jaune-500 {
  background-color: #f59e0b;
}

.border-circle {
  border-radius: 50%;
  object-fit: cover;
}
</style>
