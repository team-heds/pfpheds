<template>
  <Navbar />
  <ProfileInfo v-if="activeTab === 0" :user="user" />
  <DocumentsUserProfile v-if="activeTab === 1" />
  <ResumStageUserProfile v-if="activeTab === 2" />
  <ChatProfil v-if="activeTab === 3" />
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
import Navbar from '@/components/common/utils/Navbar.vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ProfileInfo from '@/components/user/details/ProfileInfo.vue'
import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'
import DocumentsUserProfile from '@/components/user/details/DocumentsUserProfile.vue'
import ChatProfil from '@/components/user/details/ChatProfil.vue'
import { useRoute } from 'vue-router';

export default {
  name: 'Profile',
  components: {
    Navbar,
    InputText,
    Button,
    ProfileInfo,
    ResumStageUserProfile,
    DocumentsUserProfile,
    ChatProfil,
  },
  setup(props) {
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

    const defaultAvatar = '@/assets/images/avatar/01.jpg';

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

    const logo = '@/assets/images/hespicto.png';
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

    const route = useRoute();
    // Récupérer l'ID de l'utilisateur depuis la route
    onMounted(async () => {
      const userId = route?.params?.id || null; 
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
/* ProfileView est maintenant juste un wrapper simple */
/* Le layout avec sidebars est géré par ProfileInfo.vue */
</style>
