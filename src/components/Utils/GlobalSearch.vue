<template>
  <div class="navbar">
    <!-- Icône de recherche avec design amélioré -->
    <ButtonNavbar
      icon="pi pi-search"
      :bgColor="'var(--surface-overlay)'"
      :hoverBgColor="'var(--surface-hover)'"
      :iconColor="'var(--primary-color)'"
      @click="toggleSearchBar"
      title="Rechercher"
    />

    <!-- Barre de recherche globale -->
    <Dialog v-model:visible="showSearchBar" modal header="Rechercher sur le site" :style="{ width: '50vw' }">
      <div class="p-inputgroup">
        <span class="p-inputgroup-addon">
          <i class="pi pi-search"></i>
        </span>
        <InputText v-model="searchQuery" @keyup.enter="performSearch" placeholder="Rechercher..." class="w-full" />
        <Button icon="pi pi-times" class="p-button-text" @click="toggleSearchBar" />
      </div>

      <!-- Suggestions -->
      <div v-if="searchQuery.length > 2" class="search-suggestions">
        <Listbox
          :options="searchResults"
          optionLabel="name"
          class="w-full"
          @change="navigateTo"
        />
        <div v-if="searchResults.length === 0" class="no-results">Aucun résultat trouvé</div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../../../firebase';
import { ref as firebaseRef, get } from 'firebase/database';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Listbox from 'primevue/listbox';
import ButtonNavbar from '@/components/Bibliotheque/Buttons/ButtonNavbar.vue';

const router = useRouter();
const showSearchBar = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);

const toggleSearchBar = () => {
  console.log("🔍 Toggle search bar", showSearchBar.value);
  showSearchBar.value = !showSearchBar.value;
  if (!showSearchBar.value) searchQuery.value = '';
};

// Fonction pour chercher dans Firebase
const fetchSearchResults = async () => {
  searchResults.value = [];

  if (searchQuery.value.length < 3) {
    return;
  }

  try {
    console.log(`🔎 Recherche en cours pour : "${searchQuery.value}"`);

    const usersRef = firebaseRef(db, 'Users');
    const institutionsRef = firebaseRef(db, 'Institutions');
    const postsRef = firebaseRef(db, 'Posts');

    const [usersSnap, institutionsSnap, postsSnap] = await Promise.all([
      get(usersRef),
      get(institutionsRef),
      get(postsRef),
    ]);

    if (usersSnap.exists()) {
      const users = Object.entries(usersSnap.val())
        .filter(([_, user]) =>
          `${user.Prenom} ${user.Nom}`.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
        .map(([id, user]) => ({
          id,
          name: `${user.Prenom} ${user.Nom}`,
          link: `/profile/${id}`
        }));

      console.log("👤 Utilisateurs trouvés :", users);
      searchResults.value.push(...users);
    }

    if (institutionsSnap.exists()) {
      const institutions = Object.entries(institutionsSnap.val())
        .filter(([_, inst]) => inst.Name.toLowerCase().includes(searchQuery.value.toLowerCase()))
        .map(([id, inst]) => ({
          id,
          name: inst.Name,
          link: `/institution/${id}`
        }));
      console.log("🏫 Institutions trouvées :", institutions);
      searchResults.value.push(...institutions);
    }

    if (postsSnap.exists()) {
      const posts = Object.entries(postsSnap.val())
        .filter(([_, post]) => post.Title.toLowerCase().includes(searchQuery.value.toLowerCase()))
        .map(([id, post]) => ({
          id,
          name: post.Title,
          link: `/post/${id}`
        }));
      console.log("📝 Posts trouvés :", posts);
      searchResults.value.push(...posts);
    }

    if (searchResults.value.length === 0) {
      console.log("🚫 Aucun résultat trouvé.");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la recherche Firebase :", error);
  }
};

watch(searchQuery, async (newValue) => {
  if (newValue.length >= 3) {
    await fetchSearchResults();
  } else {
    searchResults.value = [];
  }
});

const performSearch = () => {
  if (searchQuery.value.trim()) {
    console.log("🔍 Recherche envoyée :", searchQuery.value);
    router.push({ path: '/search', query: { q: searchQuery.value } });
    toggleSearchBar();
  }
};

const navigateTo = (event) => {
  if (event.value && event.value.link) {
    console.log("📌 Navigation vers :", event.value.link);
    router.push(event.value.link);
    toggleSearchBar();
  }
};
</script>

<style scoped>
.p-inputgroup {
  width: 100%;
  display: flex;
}

.search-suggestions {
  margin-top: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.no-results {
  padding: 1rem;
  text-align: center;
  font-size: 14px;
  color: var(--text-color-secondary);
}
</style>
