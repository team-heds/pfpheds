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
          {{ result.name }}
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
// Adapter fetchSearchResults selon ta logique de recherche
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
  // Exemple : à adapter avec ta logique (Firebase, API, etc)
  // searchResults.value = await ...
  searchResults.value = [
    { id: 1, name: 'Résultat exemple 1' },
    { id: 2, name: 'Résultat exemple 2' },
  ];
};

const performSearch = async () => {
  await fetchSearchResults();
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
};

const goToResult = (result) => {
  // Adapter la navigation selon la nature des résultats
  // router.push(...)
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
</style>
