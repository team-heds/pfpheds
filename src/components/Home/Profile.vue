<template>
  <div class="min-h-screen flex relative lg:static surface-ground">
    <div id="app-sidebar" class="h-full lg:h-auto hidden lg:block flex-shrink-0 absolute lg:static left-0 top-0 z-1 border-right-1 surface-border w-full md:w-auto">
      <div class="flex h-full">
        <div class="flex flex-column h-full bg-primary-500 flex-shrink-0 select-none">
          <div class="flex align-items-center justify-content-center flex-shrink-0 bg-primary-500" style="height:60px">
            <a href="/">
              <img :src="logo" alt="Image" height="30"/>
            </a>
          </div>
          <div class="overflow-y-auto mt-3">
            <ul class="list-none py-3 px-2 m-0">
              <li class="mb-2" v-for="(icon, index) in sidebarIcons" :key="index">
                <a class="flex align-items-center cursor-pointer p-3 lg:justify-content-center hover:bg-primary-400 border-round text-indigo-100 hover:text-primary-50 transition-duration-150 transition-colors" @click="activeTab = index" :class="{'bg-primary-400': activeTab === index}">
                  <i :class="`pi ${icon} text-lg`"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="min-h-screen flex flex-column relative flex-auto">
      <div class="flex justify-content-between align-items-center px-5 surface-section border-bottom-1 surface-border relative lg:static" style="height:60px">
        <div class="flex align-items-center">
          <a class="cursor-pointer block lg:hidden text-700 mr-3 mt-1" @click="toggleSidebar">
            <i class="pi pi-bars text-4xl"></i>
          </a>
        </div>
        <a class="cursor-pointer block lg:hidden text-700" @click="toggleTopMenu">
          <i class="pi pi-ellipsis-v text-2xl"></i>
        </a>
        <ul class="list-none p-0 m-0 hidden lg:flex lg:align-items-center select-none lg:flex-row surface-section border-1 lg:border-none surface-border right-0 top-100 z-1 shadow-2 lg:shadow-none absolute lg:static">
          <li class="border-top-1 surface-border lg:border-top-none">
            <a class="flex p-3 lg:px-3 lg:py-2 align-items-center hover:surface-100 font-medium border-round cursor-pointer transition-duration-150 transition-colors">
              <img :src="userAvatar" class="border-circle" style="width: 32px; height: 32px;" />
              <div class="block lg:hidden">
                <div class="text-900 font-medium">{{ user.nom || 'User' }}</div>
                <span class="text-600 font-medium text-sm">{{ user.email }}</span>
              </div>
            </a>
          </li>
        </ul>
      </div>
      <div class="p-5 flex flex-column flex-auto">
        <ProfileInfo v-if="activeTab === 0" :user="user" />
        <DocumentsUserProfile v-if="activeTab === 1" />
        <ResumStageUserProfile v-if="activeTab === 2" />
      <!--  <ChatProfil v-if="activeTab === 3" /> -->
      </div>
    </div>
  </div>
  <AppDarkAndLightMode />
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

export default {
  name: 'Profile',
  components: {
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
