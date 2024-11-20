<template>
  <div class="relative overflow-hidden flex flex-column justify-content-center">
    <div class="bg-circle opacity-50" :style="{ top: '-200px', left: '-700px' }"></div>
    <div class="bg-circle hidden lg:flex" :style="{ top: '50px', right: '-800px', transform: 'rotate(60deg)' }"></div>
    <div class="landing-wrapper">
      <div class="flex align-items-center justify-content-between relative lg:static py-6 px-4 mx-0 md:px-7 lg:px-8 lg:py-6 lg:mx-8">
        <a class="cursor-pointer" @click="navigateTo('/')">
          <img src="/public/pictoHEdS.png" alt="Logo" style="height: 50px" />
        </a>

        <i class="pi pi-bars text-4xl cursor-pointer block md:hidden text-700"></i>
        <div class="align-items-center flex-grow-1 hidden md:flex absolute md:static w-full md:px-0 z-3 shadow-2 md:shadow-none fadein" :class="{ hidden: isHidden }" :style="{ top: '80px', right: '0%' }">


          <ul class="list-none p-3 md:p-0 m-0 ml-auto flex md:align-items-center select-none flex-row md:flex-row cursor-pointer surface-card md:surface-ground">
            <li class="mx-5">
              <ButtonNavbar
                icon="pi pi-home"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/')"
              />
            </li>

            <li v-if="!user" class="mx-5">
              <a @click="navigateTo('/sign_in')">
                <Button type="button" label="Se Connecter" class="m-0"></Button>
              </a>
            </li>

          <!--  <li v-if="user && hasAdminAccess" class="mx-2">
              <a @click="navigateTo('/newsfeed')" class="flex m-0 px-0 py-3 text-900 font-medium line-height-3">Feed</a>
            </li>
            -->

            <li v-if="user" class="mx-5">
              <ButtonNavbar
                icon="pi pi-bookmark"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/institution')"
              />
            </li>

            <li v-if="user && hasAdminAccess" class="mx-5">
              <ButtonNavbar
                icon="pi pi-file-edit"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/votation')"
              />
            </li>

            <li v-if="user" class="mx-5">
              <ButtonNavbar
                icon="pi pi-map-marker"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/map')"
              />
            </li>

            <li v-if="user && hasAdminAccess" class="mx-5">
              <ButtonNavbar
                icon="pi pi-user"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/profile')"
              />
            </li>

            <li v-if="user && hasAdminAccess" class="mx-5">
              <ButtonNavbar
                icon="pi pi-user-plus"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/admin')"
              />
            </li>


            <!-- Ajout du composant SwitchColor -->
            <li class="mx-5">
              <SwitchColor />
            </li>

            <li v-if="user" class="mx-5">
              <ButtonNavbar
                icon="pi pi-cog"
                :bgColor="'var(--surface-overlay)'"
                :hoverBgColor="'var(--surface-hover)'"
                :iconColor="'var(--primary-color)'"
                @click="navigateTo('/settings')"
              />
            </li>

            <li v-if="user" class="mx-5">
              <a @click="logout">
                <Button type="button" label="Déconnexion" class="m-0"></Button>
              </a>
            </li>



          </ul>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref as dbRef, get as dbGet } from "firebase/database"; // Import necessary functions from Firebase
import { db } from '../../../firebase.js';
import SwitchColor from '@/components/Bibliotheque/Buttons/SwitchColor.vue'
import ButtonNavbar from '@/components/Bibliotheque/Buttons/ButtonNavbar.vue'


const router = useRouter();
const user = ref(null);
const isHidden = ref(true);
const userRoles = ref(null); // New reactive variable to store user roles
const hasAdminAccess = ref(false); // New reactive variable to check for admin access

const navigateTo = (path) => {
  router.push(path);
};

const auth = getAuth();
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Maintenant la persistance de la session est assurée entre les rafraîchissements de page
    onAuthStateChanged(auth, async (u) => {
      user.value = u;
      isHidden.value = !u;

      if (u) {
        const userId = u.uid;
        try {
          // Fetch user roles from Firebase Realtime Database
          const userRef = dbRef(db, `Users/${userId}`);
          const snapshot = await dbGet(userRef);

          if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log('Données utilisateur récupérées:', userData);

            if (userData.Roles) {
              userRoles.value = userData.Roles;
              console.log('Rôles récupérés:', userRoles.value);

              // Check if the user has 'admin', 'editor', or 'viewer' role
              hasAdminAccess.value = !!userRoles.value.admin || !!userRoles.value.editor || !!userRoles.value.viewer;
            } else {
              console.log('Aucun rôle trouvé pour cet utilisateur.');
            }
          } else {
            console.log('Aucun utilisateur trouvé avec cet ID.');
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
.bg-primary {
  background-color: #007bff;
}

.mx-2 {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
</style>