<template>
  <div class="relative overflow-hidden flex flex-column justify-content-center">
    <div class="bg-circle opacity-50" :style="{ top: '-200px', left: '-700px' }"></div>
    <div class="bg-circle hidden lg:flex" :style="{ top: '50px', right: '-800px', transform: 'rotate(60deg)' }"></div>
    <div class="landing-wrapper">
      <div class="flex align-items-center justify-content-between relative lg:static py-4 px-1">
        <!-- Logo (à gauche) -->
        <div class="flex-shrink-0 px-8 mx-8">
          <a class="cursor-pointer" @click="navigateTo('/')">
            <img src="/public/pictoHEdS.png" alt="Logo" style="height: 50px" />
          </a>
        </div>

        <!-- Menu principal (au centre) -->
        <div class="flex-grow-1 flex justify-content-center ">
          <ul class="list-none p-3 md:p-0 m-0 flex md:align-items-center select-none flex-row md:flex-row cursor-pointer ">
            <li class="mx-3">
              <ButtonNavbar
                icon="pi pi-home"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/')"
              />
            </li>

            <li v-if="!user" class="mx-3">
              <a @click="navigateTo('/login')">
                <Button type="button" label="Se Connecter" class="m-0"></Button>
              </a>
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

            <li v-if="user && hasAdminAccess" class="mx-3">
              <ButtonNavbar
                icon="pi pi-file-edit"
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
                icon="pi pi-user"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/profile')"
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

        <!-- Boutons alignés à droite -->
        <div class="flex items-center space-x-5 ml-auto">

          <!-- Recherche -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-search"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="navigateTo('/')"
          />

          <!-- Notifications -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-bell"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="navigateTo('/settings')"
          />

          <!-- Notifications -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-inbox"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="navigateTo('/settings')"
          />

          <!-- Boutons alignés à droite -->
          <div class="flex items-center space-x-5 ml-auto">
            <!-- Paramètres (ouvre la barre latérale) -->
            <ButtonNavbar
              v-if="user"
              icon="pi pi-cog"
              :bgColor="'var(--surface-overlay)'"
              :hoverBgColor="'var(--surface-hover)'"
              :iconColor="'var(--primary-color)'"
              @click="toggleSidebar"
            />
            <!-- SwitchColor -->
            <SwitchColor />
          </div>
        </div>
      </div>

      <!-- Barre latérale des paramètres -->
      <AppProfileSidebar :visible="isSidebarVisible" @close="isSidebarVisible = false" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref as dbRef, get as dbGet } from "firebase/database";
import { db } from '../../../firebase.js';
import SwitchColor from '@/components/Bibliotheque/Buttons/SwitchColor.vue';
import ButtonNavbar from '@/components/Bibliotheque/Buttons/ButtonNavbar.vue';
import AppProfileSidebar from '@/layout/AppProfileSidebar.vue'

const router = useRouter();
const user = ref(null);
const isHidden = ref(true);
const userRoles = ref(null);
const hasAdminAccess = ref(false);

const navigateTo = (path) => {
  router.push(path);
};

const isSidebarVisible = ref(false);

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
          const snapshot = await dbGet(userRef);

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

const logout = async () => {
  try {
    await signOut(auth);
    navigateTo('/');
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};
</script>


<style scoped>
.space-x-5 {
  gap: 1.25rem;
}
</style>
