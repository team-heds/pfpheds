<template>
  <Navbar />
  <div class="min-h-screen flex relative lg:static ">
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
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, reactive, onMounted } from 'vue';
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ProfileInfo from '@/components/UserProfile/ProfileInfo.vue'
import ResumStageUserProfile from '@/components/UserProfile/ResumStageUserProfile.vue'
import DocumentsUserProfile from '@/components/UserProfile/DocumentsUserProfile.vue'
import ChatProfil from '@/components/UserProfile/ChatProfil.vue'
import Calendar from '@/views/apps/Calendar.vue'
import AppDarkAndLightMode from '@/layout/AppDarkAndLightMode.vue'
import Navbar from '@/components/Utils/Navbar.vue'

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
  setup() {
    const activeTab = ref(0);
    const checked = ref(false);
    const selectedCountry = ref(null);
    const countries = [
      { name: 'Valais', code: 'VS' },
      { name: 'Vaud', code: 'VD' },
      { name: 'Genève', code: 'GE' },
      // Ajoutez plus de pays selon vos besoins
    ];

    const sidebarIcons = ['pi-home', 'pi-folder', 'pi-users', 'pi-comments'];
    const topMenu = [
      { icon: 'pi-inbox', label: 'Inbox' },
      { icon: 'pi-bell', label: 'Notifications', badge: true },
    ];

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
    const userAvatar = ref('../../../public/assets/images/avatar/01.jpg'); // URL par défaut si aucune photo n'est trouvée

    const toggleSidebar = () => {
      // Logique pour basculer la barre latérale
    };

    const toggleTopMenu = () => {
      // Logique pour basculer le menu supérieur
    };

    // Méthode pour récupérer l'URL de la photo de profil depuis Firebase Storage
    const fetchProfilePhotoURL = async (uid) => {
      const storage = getStorage();
      const avatarRef = storageRef(storage, `users/${uid}/profile-picture.jpg`); // Chemin où la photo de profil est stockée

      try {
        const url = await getDownloadURL(avatarRef);
        userAvatar.value = url; // Mettre à jour l'URL de l'avatar avec celle de Firebase Storage
      } catch (error) {
        console.error("Erreur lors de la récupération de l'URL de la photo de profil:", error);
        // Si une erreur survient, conserver l'avatar par défaut
      }
    };

    onMounted(() => {
      const auth = getAuth();
      onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          user.nom = currentUser.displayName;
          user.email = currentUser.email;
          user.photoURL = currentUser.photoURL;
          user.uid = currentUser.uid;

          // Récupérer l'URL de la photo de profil depuis Firebase Storage
          fetchProfilePhotoURL(currentUser.uid);
        }
      });
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
  },
};
</script>


<style scoped>
/* Vos styles spécifiques au composant ici */
.bg-jaune-500 {
  background-color: #f59e0b;
}

.border-circle {
  border-radius: 50%;
  object-fit: cover;
}
</style>
