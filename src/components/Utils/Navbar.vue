<template>
  <div class="relative overflow-hidden flex flex-column justify-content-center">
    <!-- Effets de fond -->
    <div class="bg-circle opacity-50" :style="{ top: '-200px', left: '-700px' }"></div>
    <div class="bg-circle hidden lg:flex" :style="{ top: '50px', right: '-800px', transform: 'rotate(60deg)' }"></div>

    <!-- ✅ Navbar Desktop -->
    <div class="landing-wrapper desktop-nav">
      <div class="flex align-items-center py-4 px-1 navbar-container">

        <!-- ✅ Logo (gauche) -->
        <div class="flex-shrink-0 px-4">
          <a class="cursor-pointer" @click="navigateTo('/feed')">
            <img src="/pictoHEdS.png" alt="Logo" style="height: 44px; width: 44px; border-radius: 32%;" />
          </a>
        </div>

        <!-- ✅ Menu principal (centre) -->
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

        <!-- ✅ Barre de recherche et autres boutons (droite) -->
        <div class="flex-shrink-0 flex align-items-center px-4">

          <!-- 🔍 Global Search -->
          <GlobalSearch
          class="mx-3"
          />

          <!-- 📩 Messages -->
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

          <!-- 🔔 Notifications -->
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

          <!-- ⚙️ Paramètres -->
          <ButtonNavbar
            v-if="user"
            icon="pi pi-cog"
            :bgColor="'var(--surface-overlay)'"
            :hoverBgColor="'var(--surface-hover)'"
            :iconColor="'var(--primary-color)'"
            @click="openSettingsDialog"
            class="mx-3"
            title="Paramètres"
          />

          <!-- 🎨 Switch Color -->
          <SwitchColor class="mx-3" title="Thème" />

        </div>
      </div>
    </div>

    <!-- ✅ Fenêtre de dialogue Paramètres -->
    <Dialog v-model:visible="isSettingsDialogVisible" modal header="Paramètre" :style="{ width: '20rem' }">
      <div class="flex flex-column gap-3">
        <Button label="Profil" icon="pi pi-user" class="w-full p-button-outlined" @click="navigateTo(`/profile/${user.uid}`)" />
        <Button label="Paramètres" icon="pi pi-cog" class="w-full p-button-outlined" @click="navigateTo('/settings')" />
        <Button label="Se déconnecter" icon="pi pi-power-off" class="w-full p-button-danger" @click="logout" />
      </div>
      <br>
      @Copyright HEdS
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
import GlobalSearch from '@/components/Utils/GlobalSearch.vue';

const router = useRouter();
const user = ref(null);
const isSettingsDialogVisible = ref(false);
const userRoles = ref(null);
const hasAdminAccess = ref(false);

const menuItems = [
  { icon: "pi pi-home", link: "/feed", title: "Accueil" },
  { icon: "pi pi-bookmark", link: "/institution", title: "Institutions" },
  { icon: "pi pi-check", link: "/votation", title: "Votation" },
  { icon: "pi pi-map-marker", link: "/map", title: "Map" },
  { icon: "pi pi-user-plus", link: "/admin", title: "Admin", adminOnly: true }
];

const openSettingsDialog = () => isSettingsDialogVisible.value = true;
const navigateTo = (path) => router.push(path);
const logout = async () => {
  try { await signOut(auth); navigateTo('/home'); }
  catch (error) { console.error('Erreur de déconnexion:', error); }
};

const auth = getAuth();
setPersistence(auth, browserLocalPersistence).then(() => {
  onAuthStateChanged(auth, async (u) => {
    user.value = u;
    if (u) {
      const userId = u.uid;
      try {
        const userRef = dbRef(db, `Users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          userRoles.value = snapshot.val().Roles;
          hasAdminAccess.value = !!userRoles.value.admin;
        }
      } catch (error) {
        console.error('Erreur récupération rôles utilisateur:', error);
      }
    }
  });
}).catch(error => console.error('Erreur de persistance:', error));
</script>

<style scoped>
/* ✅ Ajustements pour la navbar */
.desktop-nav { 
  display: flex;
  flex-direction: column;
  padding-left: 10rem;
  padding-right: 10rem;
}

.inputcolor {
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
  border: none;
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

/* ✅ Ajustements pour mobile */
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
