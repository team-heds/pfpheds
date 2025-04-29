<template>
  <div class="navbar">
    <!-- Bouton natif avec logo loupe SVG -->
    <button
      @click="toggleSearchBar"
      style="background:var(--surface-overlay);border:none;border-radius:25%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.2s;"
      title="Rechercher"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="7" stroke="var(--primary-color)" stroke-width="2"/>
        <line x1="16.018" y1="16.4853" x2="20" y2="20.4673" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

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

const router = useRouter();
const showSearchBar = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);

const toggleSearchBar = () => {
  console.log(" Toggle search bar", showSearchBar.value);
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
    const usersRef = firebaseRef(db, 'Users');
    const institutionsRef = firebaseRef(db, 'Institutions');
    const postsRef = firebaseRef(db, 'Posts');

    const [usersSnap, institutionsSnap, postsSnap] = await Promise.all([
      get(usersRef).catch(() => null),
      get(institutionsRef).catch(() => null),
      get(postsRef).catch(() => null),
    ]);

    // USERS
    if (usersSnap && usersSnap.exists()) {
      const users = Object.entries(usersSnap.val())
        .filter(([_, user]) => {
          const nom = user.Nom || user.nom || '';
          const prenom = user.Prenom || user.prenom || '';
          return `${prenom} ${nom}`.toLowerCase().includes(searchQuery.value.toLowerCase());
        })
        .map(([id, user]) => ({
          id,
          name: `${user.Prenom || user.prenom || ''} ${user.Nom || user.nom || ''}`.trim(),
          link: `/profile/${id}`
        }));
      searchResults.value.push(...users);
    }

    // INSTITUTIONS
    if (institutionsSnap && institutionsSnap.exists()) {
      const institutions = Object.entries(institutionsSnap.val())
        .filter(([_, inst]) => {
          const name = inst.Name || inst.nom || '';
          const ville = inst.Locality || inst.Ville || '';
          const canton = inst.Canton || '';
          return (
            name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            ville.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            canton.toLowerCase().includes(searchQuery.value.toLowerCase())
          );
        })
        .map(([id, inst]) => ({
          id,
          name: inst.Name || inst.nom || '',
          link: `/institution/${id}`
        }));
      searchResults.value.push(...institutions);
    }

    // POSTS
    if (postsSnap && postsSnap.exists()) {
      const posts = Object.entries(postsSnap.val())
        .filter(([_, post]) => {
          const title = post.Title || post.titre || '';
          return title.toLowerCase().includes(searchQuery.value.toLowerCase());
        })
        .map(([id, post]) => ({
          id,
          name: post.Title || post.titre || '',
          link: `/post/${id}`
        }));
      searchResults.value.push(...posts);
    }

    if (searchResults.value.length === 0) {
      // Affiche un résultat factice si rien trouvé
      searchResults.value.push({ id: 'none', name: 'Aucun résultat trouvé', link: '#' });
    }
  } catch (error) {
    console.error(' Erreur lors de la recherche Firebase :', error);
    searchResults.value = [{ id: 'error', name: 'Erreur lors de la recherche', link: '#' }];
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
    console.log(" Recherche envoyée :", searchQuery.value);
    router.push({ path: '/search', query: { q: searchQuery.value } });
    toggleSearchBar();
  }
};

const navigateTo = (event) => {
  if (event.value && event.value.link) {
    console.log(" Navigation vers :", event.value.link);
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
