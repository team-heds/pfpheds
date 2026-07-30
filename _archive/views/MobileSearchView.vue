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
        <li v-for="trend in trends" :key="trend" @click="searchTrend(trend)">{{ trend }}</li>
      </ul>
      <div v-if="recentSearches.length" class="mobile-search-recents-list">
        <h3 class="recents-title">Dernières recherches</h3>
        <ul>
          <li v-for="recent in recentSearches" :key="`${recent.label}-${recent.type}-${recent.link}`">
            <span class="icon-recent"><i class="pi pi-history" /></span>
            <span class="recent-label" @click="selectRecent(recent)">
              <template v-if="recent.type">{{ recent.type }} : </template>{{ recent.label }}
            </span>
            <span class="delete-recent" @click="deleteRecent(recent)"><i class="pi pi-times" /></span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderIcons from '@/components/common/utils/HeaderIcons.vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../../../../firebase';
import { ref as firebaseRef, get } from 'firebase/database';

const searchQuery = ref('');
const searchResults = ref([]);
const trends = ref([
  'Sion', 'Sierre', 'Valais', 'Hôpital', 'Brig',
]);
const recentSearches = ref([]);
const router = useRouter();

const RECENT_KEY = 'pfpheds_recent_searches';

const loadRecentSearches = () => {
  const saved = localStorage.getItem(RECENT_KEY);
  if (saved) recentSearches.value = JSON.parse(saved);
};
const saveRecentSearches = () => {
  localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches.value));
};

const addRecentSearch = (item) => {
  if (!item || !item.label) return;
  recentSearches.value = recentSearches.value.filter(q => q.label !== item.label || q.type !== item.type || q.link !== item.link);
  recentSearches.value.unshift(item);
  if (recentSearches.value.length > 10) recentSearches.value = recentSearches.value.slice(0, 10);
  saveRecentSearches();
};

const selectRecent = (item) => {
  if (item.link && item.link !== '#') {
    router.push(item.link);
  } else {
    searchQuery.value = item.label;
    performSearch();
  }
};

const deleteRecent = (item) => {
  recentSearches.value = recentSearches.value.filter(q => q.label !== item.label || q.type !== item.type || q.link !== item.link);
  saveRecentSearches();
};

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
    const institutionsRef = firebaseRef(db, 'institutions');
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
  addRecentSearch({ label: searchQuery.value, type: '', link: '' });
  await fetchSearchResults();
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
};

const goToResult = (result) => {
  addRecentSearch({ label: result.name, type: result.type, link: result.link });
  if (result.link && result.link !== '#') {
    router.push(result.link);
  }
};

const searchTrend = (trend) => {
  searchQuery.value = trend;
  performSearch();
};

onMounted(loadRecentSearches);
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
.mobile-search-recents-list {
  margin-top: 1.5em;
  margin-bottom: 1em;
  background: none;
}
.recents-title {
  color: #ffc700;
  font-size: 1.13em;
  font-weight: 700;
  margin-bottom: 0.5em;
  margin-left: 0.1em;
}
.mobile-search-recents-list ul {
  padding: 0;
  margin: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.mobile-search-recents-list li {
  display: flex;
  align-items: center;
  width: 100%;
  background: #14294c;
  border-radius: 18px;
  padding: 1.1em 1.2em 1.1em 1em;
  margin-bottom: 0.7em;
  color: #ffc700;
  font-size: 1.18em;
  border-bottom: none;
  box-shadow: 0 2px 8px 0 rgba(20,41,76,0.08);
  transition: background 0.16s, box-shadow 0.16s;
}
.mobile-search-recents-list li:hover {
  background: #1c3766;
}
.icon-recent {
  color: #ffc700;
  margin-right: 1.3em;
  font-size: 1.32em;
  display: flex;
  align-items: center;
}
.recent-label {
  flex: 1;
  cursor: pointer;
  color: #ffc700;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}
.delete-recent {
  margin-left: 1.3em;
  color: #ffc700;
  cursor: pointer;
  font-size: 1.22em;
  transition: color 0.14s;
  display: flex;
  align-items: center;
}
.delete-recent:hover {
  color: #ff4c4c;
}
</style>
