<template>
  <div class="navbar">
    <!-- Bouton PrimeVue avec logo loupe SVG -->
    <Button
      class="search-navbar-btn"
      :style="buttonStyle"
      @click="toggleSearchBar"
      title="Rechercher"
      aria-label="Rechercher"
    >
      <svg class="search-icon-svg" width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22" r="18" stroke="var(--primary-color)" stroke-width="6"/>
        <line x1="34" y1="42" x2="40" y2="50" stroke="var(--primary-color)" stroke-width="6" stroke-linecap="round"/>
      </svg>
    </Button>

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
import { ref, watch, computed } from 'vue';
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

const buttonStyle = computed(() => ({
  backgroundColor: 'var(--surface-overlay)',
  border: 'none',
  borderRadius: '32%',
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.3s ease',
  cursor: 'pointer',
}));

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
.search-navbar-btn .search-icon-svg {
  width: 44px;
  height: 44px;
  display: block;
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
