<template>
  <header class="navbar-shell">
    <!-- Effets de fond -->
    <div class="bg-circle opacity-50" :style="{ top: '-200px', left: '-700px' }"></div>
    <div class="bg-circle hidden lg:flex" :style="{ top: '50px', right: '-800px', transform: 'rotate(60deg)' }"></div>

    <!-- Navigation desktop et tablette -->
    <div class="landing-wrapper desktop-nav">
      <nav class="navbar-container" aria-label="Navigation principale">

        <!-- Logo (gauche) -->
        <div class="navbar-brand">
          <router-link class="navbar-brand__link" to="/feed" aria-label="HEdS — Accueil">
            <img :src="hedsIcon" alt="" class="navbar-brand__image" />
          </router-link>
        </div>

        <!-- Menu principal (centre) -->
        <div class="navbar-primary-scroll">
          <ul class="center-menu">
            <li v-for="item in filteredMenuItems" :key="item.title">
              <router-link
                :to="resolveMenuLink(item)"
                class="navbar-destination"
                :class="{ 'navbar-destination--active': isMenuItemActive(item) }"
                :title="item.title"
                :aria-label="item.title"
                :aria-current="isMenuItemActive(item) ? 'page' : undefined"
              >
                <i :class="item.icon" aria-hidden="true"></i>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Recherche et actions (droite) -->
        <div class="navbar-actions" aria-label="Actions utilisateur">

          <!-- ­ƒöì Global Search -->
          <GlobalSearch />

          <!-- ­ƒô® Messages
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
          -->

          <!-- ÔÜÖ´©Å Param├¿tres -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-cog"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="openSettingsDialog"
            title="Paramètres"
            aria-label="Ouvrir les paramètres"
          />

          <!-- Thème -->
          <SwitchColor />

        </div>
      </nav>
    </div>

    <!-- Ô£à Fen├¬tre de dialogue Param├¿tres -->
    <Dialog v-model:visible="isSettingsDialogVisible" modal header="Paramètres" :style="{ width: 'min(20rem, calc(100vw - 2rem))' }">
      <div class="flex flex-column gap-3">
        <Button label="Profil" icon="pi pi-user" class="w-full p-button-outlined" @click="navigateToProfile" />
        <Button label="Paramètres" icon="pi pi-cog" class="w-full p-button-outlined" @click="navigateTo('/admin/settings')" />
        <Button label="Se déconnecter" icon="pi pi-power-off" class="w-full p-button-danger" @click="logout" />

      </div>
      <br>
      @Copyright HEdS
    </Dialog>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import SwitchColor from '@/components/ui/buttons/SwitchColor.vue';
import ButtonNavbar from '@/components/ui/buttons/ButtonNavbar.vue';
import Dialog from 'primevue/dialog';
import GlobalSearch from '@/components/common/utils/GlobalSearch.vue';
import hedsIcon from '@/assets/images/hespicto.png';
import { getVotationDestination } from '@/composables/useNavigationDestinations';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const userStore = useUserStore();
const user = ref(null);
const isSettingsDialogVisible = ref(false);
const userRoles = ref(null);
const hasAdminAccess = ref(false);
const permissions = ref([]);

const isAcademicRestricted = computed(() =>
  permissions.value.includes('academic.restricted')
);

const allMenuItems = [
  { icon: "pi pi-home", link: "/feed", title: "Accueil" },
  { icon: "pi pi-bookmark", link: "/institution", title: "Institutions" },
  { icon: "pi pi-check", link: "votation_dynamic", title: "Votation", isVotation: true },
  { icon: "pi pi-map-marker", link: "/map", title: "Carte" },
  { icon: "pi pi-user-plus", link: "/admin", title: "Admin", adminOnly: true },
  { icon: "pi pi-chart-bar", link: "/admin/dashboard-rm", title: "Dashboard", restrictedAcademicOnly: true }
];

// Computed property pour filtrer les items selon le profil de l'utilisateur
const filteredMenuItems = computed(() => {
  // Les utilisateurs avec le rôle academic_restricted ne voient que le dashboard.
  if (isAcademicRestricted.value) {
    return allMenuItems.filter(item => item.title === 'Dashboard');
  }

  return allMenuItems.filter(item => {
    // Si l'item nécessite un accès admin
    if (item.adminOnly && !hasAdminAccess.value) {
      return false;
    }
    
    // Si l'item a une restriction restrictedAcademicOnly
    if (item.restrictedAcademicOnly) {
      return false;
    }
    
    // Bouton votation unique — résoudre le lien dynamiquement
    if (item.isVotation) {
      return true;
    }
    
    // Afficher tous les autres items
    return true;
  });
});

const openSettingsDialog = () => isSettingsDialogVisible.value = true;

// Résoudre le lien de votation selon le pfp_cohort de l'étudiant
const getVotationLink = () => {
  return getVotationDestination(userStore.profile);
};

const navigateTo = (path) => {
  if (path === 'votation_dynamic') {
    router.push(getVotationLink());
  } else {
    router.push(path);
  }
};

const resolveMenuLink = (item) => item.isVotation ? getVotationLink() : item.link;

const isMenuItemActive = (item) => {
  const target = resolveMenuLink(item);
  if (target === '/feed') return route.path === '/feed';
  return route.path === target || route.path.startsWith(`${target}/`);
};

const navigateToProfile = () => {
  const currentUser = authStore.user;
  if (currentUser) {
    if (authStore.isSupabaseUser) {
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

// Fonction pour charger/recharger le profil utilisateur
const updateUserState = async () => {
  const currentUser = authStore.user;
  user.value = currentUser;
  
  if (currentUser) {
    // Le profil Supabase est initialisé une seule fois au bootstrap puis maintenu
    // à jour par le store. Ne pas le recharger à chaque navigation.
    if (authStore.isSupabaseUser) {
      if (!userStore.initialized) {
        await userStore.init({
          session: authStore.session,
          sessionResolved: authStore.initialized,
        });
      }
      
      const userProfile = userStore.profile;
      let profilePermissions = userProfile?.permissions;
      if (typeof profilePermissions === 'string') {
        try {
          profilePermissions = JSON.parse(profilePermissions);
        } catch {
          profilePermissions = [];
        }
      }

      permissions.value = Array.isArray(profilePermissions) ? profilePermissions : [];
      userRoles.value = { user: true }; // Rôle par défaut
      hasAdminAccess.value = userProfile?.role === 'admin';
    }
  } else {
    userRoles.value = null;
    permissions.value = [];
    hasAdminAccess.value = false;
  }
};

// Mettre à jour les droits seulement quand l'identité ou le rôle change.
// Un changement de route ne doit déclencher aucun appel Supabase.
watch(
  () => [authStore.user?.id, userStore.profile?.role, userStore.profile?.permissions],
  () => { void updateUserState(); },
);

onMounted(async () => {
  // Réutilise la session déjà résolue par le bootstrap (sans appel réseau répété).
  await authStore.initializeAuth();
  
  // Appel initial
  await updateUserState();
});
</script>

<style scoped>
.navbar-shell {
  position: relative;
  z-index: 20;
  min-width: 0;
}

.desktop-nav {
  display: flex;
  flex-direction: column;
  width: min(100%, 90rem);
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 4rem);
}

.navbar-container {
  --navbar-control-size: 44px;
  position: relative;
  display: grid;
  grid-template-columns: minmax(44px, 1fr) auto minmax(44px, 1fr);
  align-items: center;
  column-gap: clamp(0.5rem, 1.5vw, 1.25rem);
  width: 100%;
  min-width: 0;
  padding-block: 1rem;
}

.navbar-brand,
.navbar-actions {
  flex-shrink: 0;
}

.navbar-brand__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--navbar-control-size);
  height: var(--navbar-control-size);
  border-radius: 12px;
}

.navbar-brand__link:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
}

.navbar-brand__image {
  display: block;
  width: var(--navbar-control-size);
  height: var(--navbar-control-size);
  border-radius: 12px;
}

.navbar-primary-scroll {
  min-width: 0;
}

.navbar-primary-scroll::-webkit-scrollbar {
  display: none;
}

.center-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.5rem, 1.5vw, 1.25rem);
  width: max-content;
  margin: 0;
  padding: 0;
  list-style: none;
}

.navbar-actions {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: clamp(0.5rem, 1.25vw, 1rem);
}

.navbar-destination {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--navbar-control-size);
  min-width: var(--navbar-control-size);
  height: var(--navbar-control-size);
  border-radius: 12px;
  color: var(--primary-color);
  background: var(--surface-overlay);
  text-decoration: none;
  transition: background-color 150ms ease, color 150ms ease, transform 100ms ease;
}

.navbar-destination i {
  font-size: 20px;
}

.navbar-destination:hover {
  background: var(--surface-hover);
}

.navbar-destination--active,
.navbar-destination--active:hover {
  color: var(--surface-overlay);
  background: var(--primary-color);
}

.navbar-destination:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
}

.navbar-destination:active {
  transform: scale(0.96);
}

/* La navigation mobile dédiée prend le relais. */
@media (max-width: 768px) {
  .desktop-nav { display: none; }
}

/* Sur les tablettes étroites, les destinations restent visibles sur une seconde ligne. */
@media (min-width: 769px) and (max-width: 1000px) {
  .desktop-nav {
    padding-inline: 1rem;
  }

  .navbar-container {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem 1rem;
  }

  .navbar-primary-scroll {
    position: static;
    grid-column: 1 / -1;
    grid-row: 2;
    min-width: 0;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scrollbar-width: none;
    transform: none;
  }

  .center-menu {
    justify-content: center;
    gap: clamp(0.5rem, 4vw, 2rem);
    min-width: 100%;
    padding: 0.35rem;
  }

  .navbar-actions {
    grid-column: 2;
    grid-row: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .navbar-destination {
    transition: none;
  }
}

@media (forced-colors: active) {
  .navbar-brand__link:focus-visible,
  .navbar-destination:focus-visible {
    outline-color: CanvasText;
  }
}
</style>
