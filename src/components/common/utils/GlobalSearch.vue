<template>
  <div class="navbar">
    <!-- Bouton PrimeVue avec logo loupe SVG -->
    <Button
      class="search-navbar-btn"
      @click="toggleSearchBar"
      title="Rechercher (Ctrl+K)"
      aria-label="Rechercher"
    >
      <i class="pi pi-search search-navbar-icon" aria-hidden="true"></i>
    </Button>

    <!-- Barre de recherche globale amelioree -->
    <Dialog 
      v-model:visible="showSearchBar" 
      modal 
      :header="dialogHeader"
      :style="{ width: '60vw', maxWidth: '800px' }"
      :dismissableMask="true"
      @hide="onDialogHide"
    >
      <!-- Barre de recherche avec loading -->
      <div class="search-input-wrapper">
        <div class="p-inputgroup">
          <span class="p-inputgroup-addon">
            <i v-if="!isLoading" class="pi pi-search"></i>
            <i v-else class="pi pi-spin pi-spinner"></i>
          </span>
          <InputText 
            ref="searchInput"
            v-model="searchQuery" 
            @keyup.enter="performSearch"
            @keydown.down.prevent="navigateResults('down')"
            @keydown.up.prevent="navigateResults('up')"
            @keydown.escape="toggleSearchBar"
            placeholder="Rechercher pages, utilisateurs, institutions (villes), modules..." 
            class="w-full search-input" 
            autofocus
          />
          <Button 
            icon="pi pi-times" 
            class="p-button-text" 
            @click="toggleSearchBar"
            v-tooltip="'Echap pour fermer'" 
          />
        </div>
        
        <!-- Indicateur de nombre de resultats -->
        <div v-if="totalResults > 0" class="results-count">
          {{ totalResults }} resultat{{ totalResults > 1 ? 's' : '' }} trouve{{ totalResults > 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Historique de recherche -->
      <div v-if="showHistory && recentSearches.length > 0" class="search-history">
        <div class="history-header">
          <span class="history-title">
            <i class="pi pi-clock"></i> Recherches recentes
          </span>
          <Button 
            label="Effacer" 
            class="p-button-text p-button-sm" 
            @click="clearHistory"
          />
        </div>
        <div class="history-items">
          <div 
            v-for="(item, index) in recentSearches" 
            :key="index"
            class="history-item"
            @click="searchQuery = item"
          >
            <i class="pi pi-search"></i>
            <span>{{ item }}</span>
          </div>
        </div>
      </div>

      <!-- Resultats categorises -->
      <div v-if="searchQuery.length >= 2" class="search-results-container">
        <!-- Pages & Routes -->
        <div v-if="categorizedResults.pages.length > 0" class="result-category">
          <div class="category-header">
            <i class="pi pi-compass"></i>
            <span>Pages & Navigation ({{ categorizedResults.pages.length }})</span>
          </div>
          <div class="category-results">
            <div
              v-for="(result, index) in categorizedResults.pages"
              :key="result.path"
              :class="['result-item', { 'result-item-selected': selectedIndex === getCategoryIndex('pages', index) }]"
              @click="navigateTo(result)"
              @mouseenter="selectedIndex = getCategoryIndex('pages', index)"
            >
              <div class="result-icon page-icon">
                <i :class="result.icon"></i>
              </div>
              <div class="result-content">
                <div class="result-name" v-html="highlightText(result.name)"></div>
                <div class="result-meta">
                  <span class="result-badge">{{ result.category }}</span>
                  <span class="result-info">{{ result.path }}</span>
                </div>
              </div>
              <i class="pi pi-arrow-right result-arrow"></i>
            </div>
          </div>
        </div>

        <!-- Utilisateurs -->
        <div v-if="categorizedResults.users.length > 0" class="result-category">
          <div class="category-header">
            <i class="pi pi-users"></i>
            <span>Utilisateurs ({{ categorizedResults.users.length }})</span>
          </div>
          <div class="category-results">
            <div
              v-for="(result, index) in categorizedResults.users"
              :key="result.id"
              :class="['result-item', { 'result-item-selected': selectedIndex === getCategoryIndex('users', index) }]"
              @click="navigateTo(result)"
              @mouseenter="selectedIndex = getCategoryIndex('users', index)"
            >
              <div class="result-icon user-icon">
                <i class="pi pi-user"></i>
              </div>
              <div class="result-content">
                <div class="result-name" v-html="highlightText(result.name)"></div>
                <div class="result-meta">
                  <span v-if="result.role" class="result-badge">{{ result.role }}</span>
                  <span v-if="result.institution" class="result-info">{{ result.institution }}</span>
                </div>
              </div>
              <i class="pi pi-arrow-right result-arrow"></i>
            </div>
          </div>
        </div>

        <!-- Institutions -->
        <div v-if="categorizedResults.institutions.length > 0" class="result-category">
          <div class="category-header">
            <i class="pi pi-building"></i>
            <span>Institutions ({{ categorizedResults.institutions.length }})</span>
          </div>
          <div class="category-results">
            <div
              v-for="(result, index) in categorizedResults.institutions"
              :key="result.id"
              :class="['result-item', { 'result-item-selected': selectedIndex === getCategoryIndex('institutions', index) }]"
              @click="navigateTo(result)"
              @mouseenter="selectedIndex = getCategoryIndex('institutions', index)"
            >
              <div class="result-icon institution-icon">
                <i class="pi pi-building"></i>
              </div>
              <div class="result-content">
                <div class="result-name" v-html="highlightText(result.name)"></div>
                <div class="result-meta">
                  <span v-if="result.location" class="result-info">
                    <i class="pi pi-map-marker"></i> {{ result.location }}
                  </span>
                </div>
              </div>
              <i class="pi pi-arrow-right result-arrow"></i>
            </div>
          </div>
        </div>

        <!-- Modules Video -->
        <div v-if="categorizedResults.modules.length > 0" class="result-category">
          <div class="category-header">
            <i class="pi pi-video"></i>
            <span>Modules Video ({{ categorizedResults.modules.length }})</span>
          </div>
          <div class="category-results">
            <div
              v-for="(result, index) in categorizedResults.modules"
              :key="result.id"
              :class="['result-item', { 'result-item-selected': selectedIndex === getCategoryIndex('modules', index) }]"
              @click="navigateTo(result)"
              @mouseenter="selectedIndex = getCategoryIndex('modules', index)"
            >
              <div class="result-icon module-icon">
                <i class="pi pi-video"></i>
              </div>
              <div class="result-content">
                <div class="result-name" v-html="highlightText(result.name)"></div>
                <div class="result-meta">
                  <span v-if="result.videoCount" class="result-badge">{{ result.videoCount }} videos</span>
                  <span v-if="result.status" :class="['result-status', `status-${result.status}`]">{{ result.status }}</span>
                </div>
              </div>
              <i class="pi pi-arrow-right result-arrow"></i>
            </div>
          </div>
        </div>

        <!-- Aucun resultat -->
        <div v-if="totalResults === 0 && !isLoading && searchQuery.length >= 2" class="no-results">
          <i class="pi pi-search"></i>
          <p>Aucun resultat trouve pour "{{ searchQuery }}"</p>
          <small>Essayez avec d'autres mots-cles</small>
        </div>

        <!-- Message de recherche courte -->
        <div v-if="searchQuery.length > 0 && searchQuery.length < 2" class="search-hint">
          <i class="pi pi-info-circle"></i>
          Tapez au moins 2 caracteres pour rechercher
        </div>
      </div>

      <!-- Raccourcis clavier -->
      <div class="search-footer">
        <div class="keyboard-shortcuts">
          <span class="shortcut"><kbd>↑</kbd><kbd>↓</kbd> pour naviguer</span>
          <span class="shortcut"><kbd>Enter</kbd> pour selectionner</span>
          <span class="shortcut"><kbd>Esc</kbd> pour fermer</span>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '../../../../firebase';
import { ref as firebaseRef, get } from 'firebase/database';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useInstitutionsStore } from '@/stores/institutionsStore';

const router = useRouter();
const institutionsStore = useInstitutionsStore();
const showSearchBar = ref(false);
const searchQuery = ref('');
const searchInput = ref(null);
const isLoading = ref(false);
const selectedIndex = ref(0);
const recentSearches = ref([]);
const categorizedResults = ref({
  pages: [],
  users: [],
  institutions: [],
  modules: []
});

// Debounce timer
let debounceTimer = null;

// User role (pour filtrer les pages)
const currentUserRole = ref('user');

const dialogHeader = computed(() => {
  return isLoading.value ? 'Recherche en cours...' : 'Recherche globale';
});

const totalResults = computed(() => {
  return categorizedResults.value.pages.length +
         categorizedResults.value.users.length +
         categorizedResults.value.institutions.length +
         categorizedResults.value.modules.length;
});

const showHistory = computed(() => {
  return searchQuery.value.length === 0 && recentSearches.value.length > 0;
});

const allResults = computed(() => {
  return [
    ...categorizedResults.value.pages,
    ...categorizedResults.value.users,
    ...categorizedResults.value.institutions,
    ...categorizedResults.value.modules
  ];
});

// Charger l'historique depuis localStorage
const loadSearchHistory = () => {
  try {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      recentSearches.value = JSON.parse(history).slice(0, 5);
    }
  } catch (error) {
    console.error('Erreur chargement historique:', error);
  }
};

// Sauvegarder l'historique
const saveToHistory = (query) => {
  if (!query || query.length < 2) return;
  
  // Eviter les doublons
  recentSearches.value = recentSearches.value.filter(item => item !== query);
  recentSearches.value.unshift(query);
  recentSearches.value = recentSearches.value.slice(0, 5);
  
  try {
    localStorage.setItem('searchHistory', JSON.stringify(recentSearches.value));
  } catch (error) {
    console.error('Erreur sauvegarde historique:', error);
  }
};

// Effacer l'historique
const clearHistory = () => {
  recentSearches.value = [];
  localStorage.removeItem('searchHistory');
};

// Toggle avec focus
const toggleSearchBar = async () => {
  showSearchBar.value = !showSearchBar.value;
  
  if (showSearchBar.value) {
    await nextTick();
    searchInput.value?.$el?.focus();
    loadSearchHistory();
  } else {
    searchQuery.value = '';
    categorizedResults.value = { pages: [], users: [], institutions: [], modules: [] };
    selectedIndex.value = 0;
  }
};

// Callback fermeture dialog
const onDialogHide = () => {
  searchQuery.value = '';
  selectedIndex.value = 0;
};

// Calculer l'index global d'un resultat dans une categorie
const getCategoryIndex = (category, index) => {
  let offset = 0;
  const categories = ['pages', 'users', 'institutions', 'modules'];
  
  for (const cat of categories) {
    if (cat === category) {
      return offset + index;
    }
    offset += categorizedResults.value[cat].length;
  }
  return offset;
};

// Navigation clavier dans les resultats
const navigateResults = (direction) => {
  const total = allResults.value.length;
  if (total === 0) return;
  
  if (direction === 'down') {
    selectedIndex.value = (selectedIndex.value + 1) % total;
  } else if (direction === 'up') {
    selectedIndex.value = (selectedIndex.value - 1 + total) % total;
  }
  
  // Scroll vers l'element selectionne
  nextTick(() => {
    const selectedEl = document.querySelector('.result-item-selected');
    selectedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
};

// Fonction pour calculer le score de pertinence
const calculateRelevanceScore = (text, query) => {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  let score = 0;
  
  // Match exact = score max
  if (lowerText === lowerQuery) return 100;
  
  // Commence par la query = score eleve
  if (lowerText.startsWith(lowerQuery)) score += 50;
  
  // Contient la query = score moyen
  if (lowerText.includes(lowerQuery)) score += 25;
  
  // Mots en commun
  const textWords = lowerText.split(' ');
  const queryWords = lowerQuery.split(' ');
  queryWords.forEach(qWord => {
    if (textWords.some(tWord => tWord.includes(qWord))) {
      score += 10;
    }
  });
  
  return score;
};

// Highlight du texte recherche
const highlightText = (text) => {
  if (!searchQuery.value || !text) return text;
  
  const regex = new RegExp(`(${searchQuery.value})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// Definition des pages/routes de l'application
const getAvailablePages = () => {
  const role = currentUserRole.value;
  
  const allPages = [
    // Pages publiques
    { name: 'Accueil', path: '/', icon: 'pi-home', roles: ['all'], category: 'Navigation', keywords: ['home', 'accueil', 'dashboard'] },
    { name: 'Mon Profil', path: '/profile', icon: 'pi-user', roles: ['all'], category: 'Profil', keywords: ['profil', 'compte', 'settings'] },
    
    // Modules & Media
    { name: 'Modules Video', path: '/modules', icon: 'pi-video', roles: ['all'], category: 'Medias', keywords: ['video', 'cours', 'formation', 'modules'] },
    { name: 'Hub Multimedia', path: '/media', icon: 'pi-play-circle', roles: ['all'], category: 'Medias', keywords: ['media', 'multimedia', 'video'] },
    
    // Outils
    { name: 'Notes', path: '/notes', icon: 'pi-book', roles: ['all'], category: 'Outils', keywords: ['notes', 'bloc-notes', 'notepad'] },
    { name: 'Taches', path: '/tasklist', icon: 'pi-check-square', roles: ['all'], category: 'Outils', keywords: ['taches', 'todo', 'tasks'] },
    { name: 'Calendrier', path: '/calendar', icon: 'pi-calendar', roles: ['all'], category: 'Outils', keywords: ['calendrier', 'agenda', 'calendar'] },
    
    // PFP
    { name: 'PFP Gestion', path: '/pfp', icon: 'pi-briefcase', roles: ['all'], category: 'PFP', keywords: ['pfp', 'portfolio', 'formation'] },
    { name: 'PFP Liste', path: '/pfp/list', icon: 'pi-list', roles: ['all'], category: 'PFP', keywords: ['pfp', 'liste', 'formations'] },
    
    // Admin uniquement
    { name: 'Administration', path: '/admin', icon: 'pi-cog', roles: ['admin', 'editor'], category: 'Administration', keywords: ['admin', 'administration', 'settings'] },
    { name: 'Gestion Utilisateurs', path: '/admin/users', icon: 'pi-users', roles: ['admin'], category: 'Administration', keywords: ['utilisateurs', 'users', 'membres'] },
    { name: 'Gestion Institutions', path: '/admin/institutions', icon: 'pi-building', roles: ['admin'], category: 'Administration', keywords: ['institutions', 'etablissements', 'organisations'] },
    { name: 'Administration Modules', path: '/admin/modules', icon: 'pi-folder', roles: ['admin', 'editor'], category: 'Administration', keywords: ['modules', 'videos', 'vimeo', 'medias'] },
    { name: 'Votations', path: '/admin/votation', icon: 'pi-check-circle', roles: ['admin', 'editor'], category: 'Administration', keywords: ['votation', 'vote', 'sondage'] },
    { name: 'Test Vimeo', path: '/vimeo-test', icon: 'pi-video', roles: ['admin', 'editor'], category: 'Test', keywords: ['vimeo', 'test', 'video'] },
  ];
  
  // Filtrer par role
  return allPages.filter(page => {
    if (page.roles.includes('all')) return true;
    return page.roles.includes(role);
  });
};

// Fonction principale de recherche avec debounce
const fetchSearchResults = async () => {
  if (searchQuery.value.length < 2) {
    categorizedResults.value = { pages: [], users: [], institutions: [], modules: [] };
    return;
  }

  isLoading.value = true;

  try {
    const query = searchQuery.value.toLowerCase();
    
    // === PAGES/ROUTES ===
    const availablePages = getAvailablePages();
    const pages = availablePages
      .map(page => {
        // Calculer le score de pertinence
        const nameScore = calculateRelevanceScore(page.name, query);
        const categoryScore = calculateRelevanceScore(page.category, query) * 0.5;
        
        // Chercher dans les keywords
        let keywordScore = 0;
        page.keywords.forEach(keyword => {
          const score = calculateRelevanceScore(keyword, query);
          if (score > keywordScore) keywordScore = score;
        });
        keywordScore *= 0.8;
        
        const totalScore = Math.max(nameScore, categoryScore, keywordScore);
        
        return {
          ...page,
          score: totalScore,
          type: 'page'
        };
      })
      .filter(page => page.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    
    categorizedResults.value.pages = pages;
    
    // References Firebase pour Users et Modules (institutions depuis Supabase)
    const usersRef = firebaseRef(db, 'Users');
    const modulesRef = firebaseRef(db, 'Media/Modules');

    // Recuperer institutions depuis Supabase + autres depuis Firebase en parallele
    const [usersSnap, supabaseInstitutions, modulesSnap] = await Promise.all([
      get(usersRef).catch(() => null),
      institutionsStore.fetchInstitutions().then(() => institutionsStore.institutions).catch(() => []),
      get(modulesRef).catch(() => null),
    ]);

    // === UTILISATEURS ===
    const users = [];
    if (usersSnap && usersSnap.exists()) {
      Object.entries(usersSnap.val()).forEach(([id, user]) => {
        const nom = user.Nom || user.nom || '';
        const prenom = user.Prenom || user.prenom || '';
        const fullName = `${prenom} ${nom}`.trim();
        const email = user.Email || user.email || '';
        const role = user.Role || user.role || '';
        
        const nameScore = calculateRelevanceScore(fullName, query);
        const emailScore = calculateRelevanceScore(email, query) * 0.7;
        const totalScore = Math.max(nameScore, emailScore);
        
        if (totalScore > 0) {
          users.push({
            id,
            name: fullName,
            email,
            role: role === 'admin' ? 'Administrateur' : role === 'editor' ? 'Editeur' : 'Utilisateur',
            institution: user.Institution || '',
            link: `/profile/${id}`,
            score: totalScore,
            type: 'user'
          });
        }
      });
    }
    
    // Trier par pertinence
    users.sort((a, b) => b.score - a.score);
    categorizedResults.value.users = users.slice(0, 10);

    // === INSTITUTIONS (depuis Supabase) ===
    const institutions = [];
    if (supabaseInstitutions && Array.isArray(supabaseInstitutions)) {
      supabaseInstitutions.forEach((inst) => {
        const name = inst.Name || inst.nom || '';
        const ville = inst.Locality || inst.Ville || '';
        const canton = inst.Canton || '';
        const address = inst.Address || '';
        
        const nameScore = calculateRelevanceScore(name, query);
        const villeScore = calculateRelevanceScore(ville, query) * 0.8;
        const cantonScore = calculateRelevanceScore(canton, query) * 0.6;
        const addressScore = calculateRelevanceScore(address, query) * 0.5;
        const totalScore = Math.max(nameScore, villeScore, cantonScore, addressScore);
        
        if (totalScore > 0) {
          institutions.push({
            id: inst.InstitutionId || inst.id,
            name,
            location: [ville, canton].filter(Boolean).join(', '),
            link: `/institution/${inst.InstitutionId || inst.id}`,
            score: totalScore,
            type: 'institution'
          });
        }
      });
    }
    
    institutions.sort((a, b) => b.score - a.score);
    categorizedResults.value.institutions = institutions.slice(0, 10);

    // === MODULES VIDEO ===
    const modules = [];
    if (modulesSnap && modulesSnap.exists()) {
      Object.entries(modulesSnap.val()).forEach(([id, module]) => {
        const title = module.title || '';
        const description = module.description || '';
        const status = module.status || 'draft';
        
        const titleScore = calculateRelevanceScore(title, query);
        const descScore = calculateRelevanceScore(description, query) * 0.6;
        const totalScore = Math.max(titleScore, descScore);
        
        if (totalScore > 0) {
          modules.push({
            id,
            name: title,
            videoCount: module.videoCount || 0,
            status: status === 'active' ? 'Actif' : status === 'archived' ? 'Archive' : 'Brouillon',
            link: `/modules`,
            score: totalScore,
            type: 'module'
          });
        }
      });
    }
    
    modules.sort((a, b) => b.score - a.score);
    categorizedResults.value.modules = modules.slice(0, 10);

  } catch (error) {
    console.error('[GlobalSearch] Erreur recherche:', error);
  } finally {
    isLoading.value = false;
  }
};

// Watch avec debounce
watch(searchQuery, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  if (newValue.length >= 2) {
    debounceTimer = setTimeout(() => {
      fetchSearchResults();
    }, 300); // 300ms debounce
  } else {
    categorizedResults.value = { pages: [], users: [], institutions: [], modules: [] };
  }
});

// Navigation vers un resultat
const navigateTo = (result) => {
  if (!result) return;
  
  // Pages utilisent "path", autres utilisent "link"
  const destination = result.path || result.link;
  if (!destination) return;
  
  console.log('[GlobalSearch] Navigation vers:', destination);
  saveToHistory(searchQuery.value);
  router.push(destination);
  toggleSearchBar();
};

// Recherche sur Enter
const performSearch = () => {
  if (allResults.value.length > 0 && selectedIndex.value < allResults.value.length) {
    navigateTo(allResults.value[selectedIndex.value]);
  } else if (searchQuery.value.trim()) {
    console.log('[GlobalSearch] Recherche etendue:', searchQuery.value);
    saveToHistory(searchQuery.value);
    router.push({ path: '/search', query: { q: searchQuery.value } });
    toggleSearchBar();
  }
};

// Raccourci clavier global (Ctrl+K ou Cmd+K)
const handleGlobalShortcut = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    toggleSearchBar();
  }
};

onMounted(async () => {
  loadSearchHistory();
  window.addEventListener('keydown', handleGlobalShortcut);
  
  // Charger le role de l'utilisateur
  if (auth.currentUser) {
    const userRef = firebaseRef(db, `Users/${auth.currentUser.uid}`);
    const userSnap = await get(userRef).catch(() => null);
    if (userSnap && userSnap.exists()) {
      const userData = userSnap.val();
      currentUserRole.value = userData.Role || userData.role || 'user';
      console.log('[GlobalSearch] Role utilisateur:', currentUserRole.value);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut);
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});
</script>

<style scoped>
/* === BOUTON DE RECHERCHE === */
.search-navbar-btn {
  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-radius: 32%;
  color: var(--primary-color);
  background: var(--surface-overlay);
  box-shadow: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition-property: color, background-color, box-shadow, transform;
}

.search-navbar-icon {
  font-size: 20px;
  line-height: 1;
}

.search-navbar-btn:hover {
  background-color: var(--surface-hover) !important;
}

/* === INPUT WRAPPER === */
.search-input-wrapper {
  margin-bottom: 1rem;
}

.p-inputgroup {
  width: 100%;
  display: flex;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.search-input {
  font-size: 16px;
  padding: 0.75rem 1rem;
}

.results-count {
  margin-top: 0.5rem;
  font-size: 13px;
  color: var(--text-color-secondary);
  text-align: right;
}

/* === HISTORIQUE === */
.search-history {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-overlay);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.history-item:hover {
  background: var(--surface-hover);
  transform: translateX(4px);
}

.history-item i {
  color: var(--text-color-secondary);
  font-size: 12px;
}

/* === RESULTATS === */
.search-results-container {
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.search-results-container::-webkit-scrollbar {
  width: 8px;
}

.search-results-container::-webkit-scrollbar-track {
  background: var(--surface-ground);
  border-radius: 4px;
}

.search-results-container::-webkit-scrollbar-thumb {
  background: var(--surface-border);
  border-radius: 4px;
}

.search-results-container::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* === CATEGORIES === */
.result-category {
  margin-bottom: 1.5rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--surface-border);
}

.category-header i {
  font-size: 14px;
}

.category-results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* === ITEMS DE RESULTAT === */
.result-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: var(--surface-overlay);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover,
.result-item-selected {
  background: var(--surface-hover);
  border-color: var(--primary-color);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.result-item-selected {
  border-color: var(--primary-color);
  background: var(--primary-color-text);
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.page-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.institution-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.post-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.module-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.result-icon i {
  font-size: 18px;
}

.result-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.result-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-name :deep(mark) {
  background: var(--yellow-100);
  color: var(--yellow-900);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 13px;
  color: var(--text-color-secondary);
  flex-wrap: wrap;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--primary-color);
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.result-status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.status-Actif {
  background: var(--green-100);
  color: var(--green-700);
}

.status-Brouillon {
  background: var(--orange-100);
  color: var(--orange-700);
}

.status-Archive {
  background: var(--surface-200);
  color: var(--text-color-secondary);
}

.result-arrow {
  color: var(--text-color-secondary);
  font-size: 14px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.result-item:hover .result-arrow,
.result-item-selected .result-arrow {
  transform: translateX(4px);
  color: var(--primary-color);
}

/* === AUCUN RESULTAT === */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.no-results i {
  font-size: 48px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-results p {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.no-results small {
  font-size: 13px;
  color: var(--text-color-secondary);
}

/* === MESSAGE HINT === */
.search-hint {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--blue-50);
  border-left: 4px solid var(--blue-500);
  border-radius: 6px;
  color: var(--blue-700);
  font-size: 14px;
}

.search-hint i {
  font-size: 18px;
}

/* === FOOTER === */
.search-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.keyboard-shortcuts {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.shortcut {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.shortcut kbd {
  display: inline-block;
  padding: 3px 8px;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  min-width: 24px;
  text-align: center;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .search-results-container {
    max-height: 400px;
  }
  
  .result-item {
    padding: 0.75rem;
  }
  
  .result-icon {
    width: 36px;
    height: 36px;
  }
  
  .result-name {
    font-size: 14px;
  }
  
  .result-meta {
    font-size: 12px;
  }
  
  .keyboard-shortcuts {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* === ANIMATIONS === */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-category {
  animation: slideIn 0.3s ease;
}

.search-history {
  animation: slideIn 0.2s ease;
}
</style>
