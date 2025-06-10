<template>
  <div class="mobile-search-page">
    <HeaderIcons />
    <div class="search-bar-wrapper">
      <span class="search-icon"><i class="pi pi-search"></i></span>
      <input
        v-model="searchQuery"
        @input="onInput"
        @keyup.enter="performSearch"
        type="text"
        placeholder="Rechercher..."
        class="search-input"
        autofocus
      />
      <button v-if="searchQuery.length" class="clear-btn" @click="clearSearch">
        <i class="pi pi-times"></i>
      </button>
    </div>
    <div v-if="searchQuery.length >= 3" class="search-suggestions">
      <ul v-if="searchResults.length">
        <li v-for="result in searchResults" :key="result.id" @click="goToResult(result)">
          <span class="result-type" v-if="result.type">{{ result.type }}:</span> {{ result.name }}
        </li>
      </ul>
      <div v-else class="no-results">Aucun résultat trouvé</div>
    </div>
    <div v-else class="mobile-search-trends">
      <h3>Tendances</h3>
      <ul>
        <li v-for="trend in trends" :key="trend" @click="searchQuery = trend">{{ trend }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import HeaderIcons from '@/components/Utils/HeaderIcons.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../../firebase';
import { ref as firebaseRef, get } from 'firebase/database';

const searchQuery = ref('');
const searchResults = ref([]);
const trends = ref([
  'Santé', 'Communautés', 'Stages', 'Votation', 'Institutions', 'Jeux',
]);
const router = useRouter();

const onInput = async () => {
  if (searchQuery.value.length >= 3) {
    await fetchSearchResults();
  } else {
    searchResults.value = [];
  }
};

const fetchSearchResults = async () => {
  searchResults.value = [];
  if (searchQuery.value.length < 3) return;
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
          link: `/profile/${id}`,
          type: 'Utilisateur',
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
          link: `/institution/${id}`,
          type: 'Institution',
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
          link: `/post/${id}`,
          type: 'Post',
        }));
      searchResults.value.push(...posts);
    }
    if (searchResults.value.length === 0) {
      searchResults.value.push({ id: 'none', name: 'Aucun résultat trouvé', link: '#', type: '' });
    }
  } catch (error) {
    searchResults.value = [{ id: 'error', name: 'Erreur lors de la recherche', link: '#', type: '' }];
  }
};

const performSearch = async () => {
  await fetchSearchResults();
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
};

const goToResult = (result) => {
  if (result.link && result.link !== '#') {
    router.push(result.link);
  }
};
</script>

<style scoped>
.mobile-search-page {
  background: var(--surface-ground, #f6f7fb);
  min-height: 100vh;
  padding: 0;
}
.search-bar-wrapper {
  display: flex;
  align-items: center;
  background: var(--surface-card, #fff);
  border-radius: 22px;
  margin: 18px 12px 12px 12px;
  box-shadow: 0 2px 12px rgba(60,60,60,0.09);
  padding: 7px 14px 7px 10px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.15em;
  flex: 1;
  padding: 7px 5px;
  color: var(--text-color, #222);
}
.search-icon {
  color: var(--primary-color, #f3c300);
  font-size: 1.3em;
  margin-right: 7px;
}
.clear-btn {
  background: none;
  border: none;
  color: var(--text-color, #888);
  font-size: 1.1em;
  cursor: pointer;
  margin-left: 2px;
}
.search-suggestions ul {
  list-style: none;
  margin: 0;
  padding: 0 12px;
}
.search-suggestions li {
  padding: 13px 0 13px 2px;
  border-bottom: 1px solid var(--surface-border, #ececec);
  cursor: pointer;
  font-size: 1.09em;
}
.search-suggestions li:last-child {
  border-bottom: none;
}
.no-results {
  padding: 20px 0 0 15px;
  color: var(--text-color-secondary, #999);
}
.mobile-search-trends {
  margin: 30px 0 0 0;
}
.mobile-search-trends h3 {
  font-size: 1.07em;
  font-weight: 600;
  color: var(--primary-color, #f3c300);
  margin-left: 16px;
}
.mobile-search-trends ul {
  list-style: none;
  margin: 0;
  padding: 0 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.mobile-search-trends li {
  background: var(--surface-card, #fff);
  border-radius: 15px;
  padding: 7px 15px;
  box-shadow: 0 1px 6px rgba(60,60,60,0.05);
  font-size: 1em;
  color: var(--primary-color, #f3c300);
  cursor: pointer;
  margin-bottom: 7px;
}
.result-type {
  font-size: 0.9em;
  color: var(--text-color-secondary, #999);
  margin-right: 5px;
}
</style>
