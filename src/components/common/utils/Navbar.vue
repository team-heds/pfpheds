<template>
  <div class="relative overflow-hidden flex flex-column justify-content-center">
    <!-- Effets de fond -->
    <div class="bg-circle opacity-50" :style="{ top: '-200px', left: '-700px' }"></div>
    <div class="bg-circle hidden lg:flex" :style="{ top: '50px', right: '-800px', transform: 'rotate(60deg)' }"></div>

    <!-- Ô£à Navbar Desktop -->
    <div class="landing-wrapper desktop-nav">
      <div class="flex align-items-center py-4 px-1 navbar-container">

        <!-- Ô£à Logo (gauche) -->
        <div class="flex-shrink-0 px-4">
          <a class="cursor-pointer" @click="navigateTo('/feed')">
            <img src="/pictoHEdS.png" alt="Logo" style="height: 44px; width: 44px; border-radius: 12px;" />
          </a>
        </div>

        <!-- Ô£à Menu principal (centre) -->
        <div class="flex-auto flex justify-content-center align-items-center">
          <ul class="list-none p-3 m-0 flex align-items-center select-none flex-row cursor-pointer center-menu">
            <li class="mx-3" v-for="item in menuItems" :key="item.title">
              <ButtonNavbar
                :icon="item.icon"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo(item.link)"
                :title="item.title"
              />
            </li>
          </ul>
        </div>

        <!-- Ô£à Barre de recherche et autres boutons (droite) -->
        <div class="flex-shrink-0 flex align-items-center px-4">

          <!-- ­ƒöì Global Search -->
          <GlobalSearch
          class="mx-3"
          />

          <!-- ­ƒô® Messages -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-inbox"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="navigateTo('/chat')"
            class="mx-3"
            title="Message"
          />

          <!-- ­ƒöö Notifications -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-bell"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="navigateTo('/feed')"
            class="mx-3"
            title="Notifications"
          />

          <!-- ÔÜÖ´©Å Param├¿tres -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-cog"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="openSettingsDialog"
            class="mx-3"
            title="Param├¿tres"
          />

          <!-- ­ƒÄ¿ Switch Color -->
          <SwitchColor class="mx-3" title="Th├¿me" />

        </div>
      </div>
    </div>

    <!-- Ô£à Fen├¬tre de dialogue Param├¿tres -->
    <Dialog v-model:visible="isSettingsDialogVisible" modal header="Paramètre" :style="{ width: '20rem' }">
      <div class="flex flex-column gap-3">
        <Button label="Profil" icon="pi pi-user" class="w-full p-button-outlined" @click="navigateToProfile" />
        <Button label="Paramètres" icon="pi pi-cog" class="w-full p-button-outlined" @click="navigateTo('/settings')" />
        <Button label="Se déconnecter" icon="pi pi-power-off" class="w-full p-button-danger" @click="logout" />

      </div>
      <br>
      @Copyright HEdS
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ref as dbRef, get } from "firebase/database";
import { db } from '../../../../firebase.js';
import { useAuthStore } from '@/stores/authStore';
import SwitchColor from '@/components/ui/buttons/SwitchColor.vue';
import ButtonNavbar from '@/components/ui/buttons/ButtonNavbar.vue';
import Dialog from 'primevue/dialog';
import GlobalSearch from '@/components/common/utils/GlobalSearch.vue';

const router = useRouter();
const authStore = useAuthStore();
const user = ref(null);
const isSettingsDialogVisible = ref(false);
const userRoles = ref(null);
const hasAdminAccess = ref(false);

const menuItems = [
  { icon: "pi pi-home", link: "/feed", title: "Accueil" },
  { icon: "pi pi-bookmark", link: "/institution", title: "institutions" },
  { icon: "pi pi-check", link: "/votation", title: "Votation" },
  { icon: "pi pi-map-marker", link: "/map", title: "Map" },
  { icon: "pi pi-user-plus", link: "/admin", title: "Admin", adminOnly: true }
];

const openSettingsDialog = () => isSettingsDialogVisible.value = true;
const navigateTo = (path) => router.push(path);

const navigateToProfile = () => {
  const currentUser = authStore.user;
  if (currentUser) {
    // Pour Firebase, on utilise uid
    if (authStore.isFirebaseUser) {
      navigateTo(`/profile/${currentUser.uid}`);
    }
    // Pour Supabase, on utilise id
    else if (authStore.isSupabaseUser) {
      navigateTo(`/profile/${currentUser.id}`);
    }
  }
};

const logout = async () => {
  try { 
    await authStore.signOut(); 
    navigateTo('/home'); 
  }
  catch (error) { 
    console.error('Erreur de déconnexion:', error); 
  }
};

onMounted(async () => {
  // Initialiser l'état d'authentification
  await authStore.checkAuthState();
  
  // Écouter les changements d'état d'authentification
  const updateUserState = async () => {
    const currentUser = authStore.user;
    user.value = currentUser;
    
    if (currentUser) {
      console.log('Navbar - Utilisateur connecté:', currentUser.email || currentUser.uid);
      console.log('Navbar - Provider:', authStore.authProvider);
      
      // Pour les utilisateurs Firebase, charger les rôles depuis Firebase
      if (authStore.isFirebaseUser) {
        const userId = currentUser.uid;
        try {
          const userRef = dbRef(db, `Users/${userId}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            userRoles.value = userData.Roles || {};
            hasAdminAccess.value = userData.Roles?.admin || userData.Roles?.editor || false;
          } else {
            console.warn('Aucune donnée utilisateur trouvée dans Firebase.');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
        }
      }
      // Pour les utilisateurs Supabase, on peut définir des rôles par défaut
      else if (authStore.isSupabaseUser) {
        console.log('Navbar - Utilisateur Supabase, rôles par défaut');
        userRoles.value = { user: true }; // Rôle par défaut
        hasAdminAccess.value = false; // Pas d'accès admin par défaut pour Supabase
      }
    } else {
      console.log('Navbar - Aucun utilisateur connecté');
      userRoles.value = null;
      hasAdminAccess.value = false;
    }
  };
  
  // Appel initial
  await updateUserState();
  
  // Écouter les changements (vous pouvez implémenter un watcher si nécessaire)
  // Pour l'instant, on se contente de l'appel initial
});
</script>

<style scoped>
/* Ô£à Ajustements pour la navbar */
.desktop-nav {
  display: flex;
  flex-direction: column;
  padding-left: 10rem;
  padding-right: 10rem;
}



.navbar-container {
  padding-left: 4rem;
  padding-right: 4rem;
}

.center-menu {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* Ô£à Ajustements pour mobile */
@media (max-width: 768px) {
  .desktop-nav { display: none; }
}

/* Ajustements pour les appareils plus petits */
@media (max-width: 992px) {
  .navbar-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
</style>
