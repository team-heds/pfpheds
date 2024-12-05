<template>
  <div class="relative overflow-hidden flex flex-column justify-content-center">
    <div class="bg-circle opacity-50" :style="{ top: '-200px', left: '-700px' }"></div>
    <div class="bg-circle hidden lg:flex" :style="{ top: '50px', right: '-800px', transform: 'rotate(60deg)' }"></div>
    <div class="landing-wrapper">
      <div class="flex align-items-center justify-content-between relative lg:static py-4 px-1">
        <!-- Logo (à gauche) -->
        <div class="flex-shrink-0 px-8 mx-8">
          <a class="cursor-pointer" @click="navigateTo('/feed')">
            <img src="/public/pictoHEdS.png" alt="Logo" style="height: 50px" />
          </a>
        </div>

        <!-- Menu principal (au centre) -->
        <div class="flex-grow-1 flex justify-content-center">
          <ul class="list-none p-3 md:p-0 m-0 flex md:align-items-center select-none flex-row md:flex-row cursor-pointer">
            <li class="mx-3">
              <ButtonNavbar
                icon="pi pi-home"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/feed')"
              />
            </li>
            <li v-if="user" class="mx-3">
              <ButtonNavbar
                icon="pi pi-bookmark"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/institution')"
              />
            </li>
            <li v-if="user" class="mx-3">
              <ButtonNavbar
                icon="pi pi-check"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/votation')"
              />
            </li>
            <li v-if="user" class="mx-3">
              <ButtonNavbar
                icon="pi pi-map-marker"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/map')"
              />
            </li>
            <li v-if="user && hasAdminAccess" class="mx-3">
              <ButtonNavbar
                icon="pi pi-user-plus"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/admin')"
              />
            </li>
          </ul>
        </div>

        <!-- Barre de recherche et autres boutons alignés à droite -->
        <div class="flex items-center space-x-5 ml-auto">
          <!-- Barre de recherche -->
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
        </div>
      </div>

      <!-- Fenêtre de dialogue -->
      <Dialog
        v-model:visible="isSettingsDialogVisible"
        modal
        header="Paramètre"
        :style="{ width: '20rem', backgroundColor: 'var(--surface-card)', position: 'fixed', top: '100px', right: '20px' }"
        :closable="true"
        :baseZIndex="1000"
      >
        <div class="flex flex-column gap-3">
          <!-- Administration Profile -->
          <Button
            label="Profile"
            icon="pi pi-user"
            class="w-full p-button-outlined p-button-contrast"
            @click="navigateTo('/profile/' + user.uid)"
          />
          <!-- Paramètre -->
          <Button
            label="Paramètre"
            icon="pi pi-cog"
            class="w-full p-button-outlined p-button-contrast"
            @click="navigateTo('/settings')"
          />
          <!-- Se déconnecter -->
          <Button
            label="Se déconnecter"
            icon="pi pi-power-off"
            class="w-full p-button-outlined p-button-danger"
            @click="logout"
          />
        </div>
      </Dialog>
    </div>
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
const username = ref('');
const email = ref('');
const isSettingsDialogVisible = ref(false);
const isHidden = ref(true);
const userRoles = ref(null);
const hasAdminAccess = ref(false);

const toggleSearchBar = () => {
  showSearchBar.value = !showSearchBar.value;
  if (!showSearchBar.value) searchQuery.value = ''; // Clear the input if closed
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

const auth = getAuth();
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    onAuthStateChanged(auth, async (u) => {
      user.value = u;
      isHidden.value = !u;

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
.space-x-5 {
  gap: 1.25rem;
}

.search-input {
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid var(--surface-border);
  outline: none;
  margin-right: 10px;
}
</style>
