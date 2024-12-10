<template>
  <div class="relative overflow-hidden flex flex-column justify-content-center">
    <div class="bg-circle opacity-50" :style="{ top: '-200px', left: '-700px' }"></div>
    <div class="bg-circle hidden lg:flex" :style="{ top: '50px', right: '-800px', transform: 'rotate(60deg)' }"></div>

    <!-- Version Web (inchangée) -->
    <div class="landing-wrapper desktop-nav">
      <div class="flex align-items-center justify-content-between relative lg:static py-4 px-1">
        <!-- Logo (gauche) -->
        <div class="flex-shrink-0 px-8 mx-8">
          <a class="cursor-pointer" @click="navigateTo('/feed')">
            <img src="/public/pictoHEdS.png" alt="Logo" style="height: 50px" />
          </a>
        </div>

        <!-- Menu principal (centre) -->
        <div class="flex-grow-1 flex justify-content-center">
          <ul class="list-none p-3 md:p-0 m-0 flex md:align-items-center select-none flex-row md:flex-row cursor-pointer">
            <li class="mx-3">
              <ButtonNavbar
                icon="pi pi-home"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/feed')"
                title="Accueil"
              />
            </li>
            <li v-if="user" class="mx-3">
              <ButtonNavbar
                icon="pi pi-bookmark"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/institution')"
                title="Institution"
              />
            </li>
            <li v-if="user" class="mx-3">
              <ButtonNavbar
                icon="pi pi-check"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/votation')"
                title="Votation"
              />
            </li>
            <li v-if="user" class="mx-3">
              <ButtonNavbar
                icon="pi pi-map-marker"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/map')"
                title="Map"
              />
            </li>
            <li v-if="user && hasAdminAccess" class="mx-3">
              <ButtonNavbar
                icon="pi pi-user-plus"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/admin')"
                title="Admin"
              />
            </li>
          </ul>
        </div>

        <!-- Barre de recherche et autres boutons (droite) - inchangé -->
        <div class="flex items-center space-x-5 ml-auto">
          <div class="flex items-center relative">
            <input
              v-if="showSearchBar"
              v-model="searchQuery"
              @keyup.enter="performSearch"
              type="text"
              class="search-input"
              placeholder="Rechercher..."
            />
            <ButtonNavbar
              icon="pi pi-search"
              :bgColor="'var(--surface-overlay)'"
              :hoverBgColor="'var(--surface-hover)'"
              :iconColor="'var(--primary-color)'"
              @click="toggleSearchBar"
              title="Rechercher"
            />
          </div>

          <!-- Message -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-inbox"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="navigateTo('/chat')"
            class="ml-3"
            title="Message"
          />
          <!-- Notifications -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-bell"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="navigateTo('/feed')"
            class="ml-3"
            title="Notifications"
          />
          <!-- Paramètres -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-cog"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="openSettingsDialog"
            class="ml-3"
            title="Paramètres"
          />
          <!-- SwitchColor -->
          <SwitchColor
            class="ml-3"
            title="Thème"
          />
        </div>
      </div>
    </div>

    <!-- Version Mobile -->
    <!--
    <div class="mobile-top-nav" v-if="user">
      <div class="flex align-items-center justify-content-between py-2 px-2">
        <div class="flex-shrink-0 px-2">
          <a class="cursor-pointer" @click="navigateTo('/feed')">
            <img src="/public/pictoHEdS.png" alt="Logo" style="height: 40px" />
          </a>
        </div>
        <div class="flex items-center">

          <ButtonNavbar
            icon="pi pi-search"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="toggleSearchBarMobile"
          />

          <ButtonNavbar
            icon="pi pi-bars"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="toggleMobileMenu"
          />
        </div>
      </div>

      <div v-if="showMobileSearch" class="mobile-search-bar">
        <input
          v-model="searchQuery"
          @keyup.enter="performSearch"
          type="text"
          class="search-input w-full"
          placeholder="Rechercher..."
        />
        <Button
          icon="pi pi-times"
          class="p-button-rounded p-button-text"
          @click="toggleSearchBarMobile"
        />
      </div>
    </div>
   Barre de recherche mobile (au-dessus ou en overlay) -->
    <!-- Barre inférieure mobile (Home, Institution, Votation, Message) -->
    <div class="mobile-bottom-nav" v-if="user">
      <div class="flex justify-content-around align-items-center py-2 px-1">
        <ButtonNavbar
          icon="pi pi-home"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="navigateTo('/feed')"
        />
        <ButtonNavbar
          icon="pi pi-bookmark"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="navigateTo('/institution')"
        />
        <ButtonNavbar
          icon="pi pi-check"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="navigateTo('/votation')"
        />
        <ButtonNavbar
          icon="pi pi-inbox"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="navigateTo('/chat')"
        />
        <ButtonNavbar
          icon="pi pi-user"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="navigateTo('/profile/' + user.uid)"
        />
      </div>
    </div>

    <!-- Menu mobile (drawer ou overlay) -->
    <div v-if="showMobileMenuDrawer" class="mobile-menu-drawer">
      <div class="mobile-menu-drawer-content">
        <!-- Map -->
        <ButtonNavbar
          v-if="user"
          icon="pi pi-map-marker"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="navigateTo('/map')"
        />
        <!-- Admin -->
        <ButtonNavbar
          v-if="user && hasAdminAccess"
          icon="pi pi-user-plus"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="navigateTo('/admin')"
        />
        <!-- Notifications -->
        <ButtonNavbar
          v-if="user"
          icon="pi pi-bell"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="navigateTo('/feed')"
        />
        <!-- Paramètres -->
        <ButtonNavbar
          v-if="user"
          icon="pi pi-cog"
          :bgColor="'var(--surface-overlay)'"
          :hoverBgColor="'var(--surface-hover)'"
          :iconColor="'var(--primary-color)'"
          @click="openSettingsDialog"
        />
        <!-- SwitchColor -->
        <SwitchColor />

        <Button
          icon="pi pi-times"
          class="p-button-rounded p-button-text mt-3"
          label="Fermer"
          @click="toggleMobileMenu"
        />
      </div>
    </div>

    <!-- Fenêtre de dialogue Paramètres -->
    <Dialog
      v-model:visible="isSettingsDialogVisible"
      modal
      header="Paramètre"
      :style="{ width: '20rem', backgroundColor: 'var(--surface-card)', position: 'fixed', top: '100px', right: '20px' }"
      :closable="true"
      :baseZIndex="1000"
    >
      <div class="flex flex-column gap-3">
        <Button
          label="Profile"
          icon="pi pi-user"
          class="w-full p-button-outlined p-button-contrast"
          @click="navigateTo('/profile/' + user.uid)"
        />
        <Button
          label="Paramètre"
          icon="pi pi-cog"
          class="w-full p-button-outlined p-button-contrast"
          @click="navigateTo('/settings')"
        />
        <Button
          label="Se déconnecter"
          icon="pi pi-power-off"
          class="w-full p-button-outlined p-button-danger"
          @click="logout"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref as dbRef, get } from "firebase/database";
import { db } from '../../../firebase.js';
import SwitchColor from '@/components/Bibliotheque/Buttons/SwitchColor.vue';
import ButtonNavbar from '@/components/Bibliotheque/Buttons/ButtonNavbar.vue';
import Dialog from 'primevue/dialog';

const router = useRouter();
const user = ref(null);
const searchQuery = ref('');
const showSearchBar = ref(false);
const isSettingsDialogVisible = ref(false);
const userRoles = ref(null);
const hasAdminAccess = ref(false);

const showMobileSearch = ref(false);
const showMobileMenuDrawer = ref(false);

const toggleSearchBar = () => {
  showSearchBar.value = !showSearchBar.value;
  if (!showSearchBar.value) searchQuery.value = '';
};

const toggleSearchBarMobile = () => {
  showMobileSearch.value = !showMobileSearch.value;
  if (!showMobileSearch.value) searchQuery.value = '';
};

const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value } });
  }
};

const openSettingsDialog = () => {
  isSettingsDialogVisible.value = true;
};

const closeSettingsDialog = () => {
  isSettingsDialogVisible.value = false;
};

const logout = async () => {
  try {
    await signOut(auth);
    navigateTo('/');
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};

const navigateTo = (path) => {
  router.push(path);
};

const toggleMobileMenu = () => {
  showMobileMenuDrawer.value = !showMobileMenuDrawer.value;
};

const auth = getAuth();
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    onAuthStateChanged(auth, async (u) => {
      user.value = u;
      if (u) {
        const userId = u.uid;
        try {
          const userRef = dbRef(db, `Users/${userId}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.Roles) {
              userRoles.value = userData.Roles;
              hasAdminAccess.value = !!userRoles.value.admin || !!userRoles.value.editor || !!userRoles.value.viewer;
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des rôles utilisateur:', error);
        }
      }
    });
  })
  .catch((error) => {
    console.error('Erreur lors de la configuration de la persistance :', error);
  });
</script>

<style scoped>
.search-input {
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid var(--surface-border);
  outline: none;
  margin-right: 10px;
}

/* Version desktop inchangée */
.desktop-nav {
  display: flex;
  flex-direction: column;
}

/* Nav mobiles cachées par défaut sur grand écran */
.mobile-top-nav,
.mobile-bottom-nav,
.mobile-menu-drawer,
.mobile-search-bar {
  display: none;
}

/* Mobile */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .mobile-top-nav {
    display: block;
  }

  .mobile-bottom-nav {
    display: block;
    border-top: 1px solid var(--surface-border);
    background-color: var(--surface-overlay);
    position: fixed;
    bottom: 0;
    width: 100%;
    z-index: 999;
  }

  .mobile-search-bar {
    display: flex;
    align-items: center;
    background-color: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
    padding: 5px;
    margin-left: 3%;
  }

  .mobile-menu-drawer {
    display: flex;
    position: fixed;
    top: 50px;
    right: 10px;
    background-color: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 10px;
    flex-direction: column;
    z-index: 1000;
  }

  .mobile-menu-drawer-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}
</style>