<template>
  <div class="institution-page">
    <div v-if="isMobile">
      <HeaderIcons />
    </div>
    <Navbar />
    <!-- Layout principal avec sidebars et contenu central -->
    <div class="institutions-layout">
      <!-- Sidebar Gauche -->
      <div class="sidebar-left">
        <LeftSidebar />
      </div>

      <!-- Contenu Principal scrollable -->
      <div class="main-content institution-center-scrollable">
        <section class="content-section">
          <div class="container">
            <header class="page-header">
              <h1 class="title">Institutions</h1>
              <p class="subtitle">
                Découvrez les institutions partenaires de notre réseau
              </p>
            </header>

            <!-- Barre de recherche au centre -->
            <div class="search-bar">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchTerm" placeholder="Rechercher par nom, ville, canton ou id" class="search-input style-bar" />
              </span>
            </div>

            <div class="results-summary" role="status">
              <span>{{ filteredInstitutions.length }} institution{{ filteredInstitutions.length === 1 ? '' : 's' }}</span>
              <div v-if="selectedFilterLabels.length" class="filter-chips" aria-label="Filtres actifs">
                <span v-for="filter in selectedFilterLabels" :key="filter" class="filter-chip">{{ filter }}</span>
                <button type="button" @click="clearFilters">Effacer les filtres</button>
              </div>
            </div>

            <!-- Zone défilante pour la grille -->
            <div class="grid-scrollable-wrapper">
              <!-- Grille auto-adaptative pour les cartes -->
              <EmptyState v-if="filteredInstitutions.length === 0" title="Aucune institution trouvée" description="Modifiez votre recherche ou effacez les filtres actifs." action-label="Effacer les filtres" @action="clearFilters" />
              <div v-else class="grid-container">
                <div
                  v-for="(institution, index) in filteredInstitutions"
                  :key="index"
                  class="card-wrapper"
                >
                  <Card
                    class="institution-card surface-card"
                    style="width: 20rem; height: 100%;"
                  >
                    <template #header>
                      <div class="card-header">
                        <img :src="getInstitutionImage(institution)" alt="institution" class="card-image" />
                        <Tag class="card-tag">{{ institution.Canton }}</Tag>
                      </div>
                      <p ref="institutionName" class="card-title">{{ institution.Name }}</p>
                    </template>
                    <template #subtitle>
                      <div class="card-subtitle">
                        <p>
                          {{ institution.Locality }}
                          <Tag severity="primary">{{ institution.Language }}</Tag>
                        </p>
                        <p :class="descriptionClass" class="card-description">
                          {{ truncateText(institution.Description || 'Pas de description disponible', 100) }}
                        </p>
                      </div>
                    </template>
                    <template #content>
                      <div class="button-container">
                        <PrimeButton
                          class="action-button"
                          @click="goToDetails(institution.InstitutionId)"
                          label="Détails"
                          icon="pi pi-info-circle"
                          outlined
                        />
                        <a
                          :href="formatUrl(institution.URL)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="external-link"
                          :class="{ 'link-disabled': !institution.URL }"
                        >
                          <span class="p-button-icon pi pi-external-link"></span>
                          <span class="link-label">Site web</span>
                        </a>
                      </div>
                    </template>
                  </Card>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      <!-- Sidebar Droite -->
      <div class="sidebar-right">
        <FilterSidebar :key="filterResetKey" :cantons="cantonsList" @filters-changed="handleSidebarFilters" />
      </div>
    </div>
  </div>
</template>

<script>
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import Navbar from '@/components/common/utils/Navbar.vue'
import InputText from 'primevue/inputtext';
import PrimeButton from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import LeftSidebar from '@/components/social/library/LeftSidebar.vue'
import FilterSidebar from '@/components/common/filters/FilterSidebar.vue'
import HeaderIcons from '@/components/common/utils/HeaderIcons.vue'
import filterData from '@/components/common/filters/filter.json'
import EmptyState from '@/components/common/states/EmptyState.vue'

export default {
  name: 'InstitutionPage',
  components: {
    FilterSidebar,
    Navbar,
    InputText,
    PrimeButton,
    Card,
    Tag,
    LeftSidebar,
    HeaderIcons,
    EmptyState
  },
  data() {
    return {
      descriptionClass: 'description',
      searchTerm: '',
      activeFilters: {
        cantons: [],
        criter: [],
        pfp: [],
        languages: []
      },
      cantonsList: [], // Liste dynamique des cantons
      isMobile: window.innerWidth < 768,
      filterResetKey: 0,
      filterData: filterData
    };
  },
  setup() {
    const institutionsStore = useInstitutionsStore();
    const placesStore = usePlacesStore();
    return { institutionsStore, placesStore };
  },
  computed: {
    allInstitutions() {
      return this.institutionsStore.institutions;
    },
    criteriaByInstitution() {
      const map = new Map();
      const places = this.placesStore?.places || [];
      places.forEach(p => {
        const instId = p?.InstitutionId;
        const placeId = p?.PlaceId;
        if (!instId || !placeId) return;
        const entry = this.filterData.find(it => it.IDPlace === placeId);
        if (!entry || !Array.isArray(entry.criteria)) return;
        const key = String(instId);
        if (!map.has(key)) map.set(key, new Set());
        entry.criteria.forEach(c => map.get(key).add(c));
      });
      const obj = {};
      for (const [k, set] of map.entries()) obj[k] = Array.from(set);
      return obj;
    },
    filteredInstitutions() {
      return this.allInstitutions.filter(inst => {
        if (inst?.is_hidden === true) {
          return false;
        }
        // Recherche textuelle
        if (this.searchTerm) {
          const search = this.searchTerm.toLowerCase();
          if (!(
            (inst.Name && inst.Name.toLowerCase().includes(search)) ||
            (inst.Locality && inst.Locality.toLowerCase().includes(search)) ||
            (inst.InstitutionId && String(inst.InstitutionId).toLowerCase().includes(search)) ||
            (inst.Canton && inst.Canton.toLowerCase().includes(search))
          )) {
            return false;
          }
        }
        // Filtre par canton
        if (this.activeFilters.cantons.length > 0 && (!inst.Canton || !this.activeFilters.cantons.includes(inst.Canton))) {
          return false;
        }
        const key = String(inst?.InstitutionId ?? inst?.id ?? '');
        const crit = this.criteriaByInstitution[key] || [];
        // Filtre par critères généraux
        if (this.activeFilters.criter.length > 0 && !this.activeFilters.criter.every(c => crit.includes(c))) {
          return false;
        }
        // Filtre par langue (l'institution doit avoir toutes les langues sélectionnées)
        if (this.activeFilters.languages.length > 0 && !this.activeFilters.languages.every(lang => crit.includes(lang))) {
          return false;
        }
        // Filtre par PFP
        if (this.activeFilters.pfp.length > 0 && !this.activeFilters.pfp.some(p => crit.includes(p))) {
          return false;
        }
        return true;
      });
    },
    selectedFilterLabels() {
      return Object.values(this.activeFilters).flat();
    }
  },
  methods: {
    getInstitutionImage(institution) {
      // Le store normalise ImageURL en array, on prend le premier élément
      if (Array.isArray(institution.ImageURL) && institution.ImageURL.length > 0) {
        return institution.ImageURL[0];
      }
      // Image par défaut si pas d'image disponible
      return 'https://eduport.webestica.com/assets/images/courses/4by3/21.jpg';
    },
    truncateText(text, length) {
      if (text && text.length > length) {
        return text.substring(0, length) + '...';
      }
      return text;
    },
    async fetchInstitutions() {
      try {
        console.log('📥 Fetching institutions from store...');
        await this.institutionsStore.fetchInstitutions();
        console.log('✅ Institutions loaded:', this.allInstitutions.length);
        
        // Génère la liste unique des cantons présents
        const allCantons = this.allInstitutions.map(inst => inst.Canton).filter(Boolean);
        this.cantonsList = [...new Set(allCantons)].sort();
        console.log('📍 Available cantons:', this.cantonsList);
        
        this.$nextTick(() => {
          this.adjustDescriptionHeight();
        });
      } catch (error) {
        console.error('❌ Error fetching institutions:', error);
      }
    },
    adjustDescriptionHeight() {
      const nameElements = this.$refs.institutionName;
      if (nameElements && Array.isArray(nameElements)) {
        nameElements.forEach(nameElement => {
          const lineHeight = parseInt(getComputedStyle(nameElement).lineHeight, 10);
          const nameHeight = nameElement.clientHeight;
          if (nameHeight > lineHeight * 2) {
            this.descriptionClass = 'description-two-lines';
          } else {
            this.descriptionClass = 'description';
          }
        });
      }
    },
    formatUrl(url) {
      if (!url) return '#'
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      return 'https://' + url
    },
    goToDetails(id) {
      if (id) {
        this.$router.push({ name: 'InstitutionView', params: { id: id } });
      }
    },
    handleSidebarFilters(filters) {
      this.activeFilters = filters;
    },
    clearFilters() {
      this.searchTerm = '';
      this.activeFilters = { cantons: [], criter: [], pfp: [], languages: [] };
      this.filterResetKey += 1;
    }
  },
  mounted() {
    this.fetchInstitutions();
    this.placesStore.fetchPlaces();
    // Gestion responsive
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });
  },
  beforeUnmount() {
    window.removeEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });
  },
};
</script>

<style scoped>
/* Layout principal pour les institutions avec sidebars */
.institutions-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr; /* Sidebar gauche, contenu central, sidebar droite */
  gap: 1.5rem;
  height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  max-height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  overflow: hidden;
}

/* Sidebar Gauche et Droite */
.sidebar-left,
.sidebar-right {
  height: 100%;
  overflow-y: hidden; /* Sidebars statiques */
}

/* Contenu Principal */
.main-content {
  height: 100%;
  overflow-y: auto; /* Scroll central uniquement */
}

/* Responsive pour le layout global */
@media (max-width: 1024px) {
  .institutions-layout {
    grid-template-columns: 1fr 2fr;
  }
  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .institutions-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .sidebar-left {
    display: none;
  }
}

/* Section de contenu */
.results-summary { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin:0 auto 1rem; color:var(--text-color-secondary); font-size:.875rem; }
.filter-chips { display:flex; align-items:center; justify-content:flex-end; gap:.5rem; flex-wrap:wrap; }
.filter-chip { padding:.25rem .625rem; border-radius:999px; background:var(--surface-card); color:var(--text-color); }
.filter-chips button { min-height:2rem; padding:.25rem .625rem; border:0; background:transparent; color:var(--primary-color); font:inherit; cursor:pointer; }
.filter-chips button:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
.content-section {
  padding: 2rem;
}

/* Header de la page */
.page-header {
  text-align: center;
  margin-bottom: 2rem;
}
.title {
  color: var(--text-color);
  font-size: 3rem;
  font-weight: bold;
}
.subtitle {
  color: var(--text-color-secondary);
  font-size: 1.25rem;
}

/* Barre de recherche */
.search-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}
.search-input {
  width: 300px;
}

/* Zone scrollable pour la grille (scrollbar masquée) */
.grid-scrollable-wrapper {
  margin-bottom: 2rem;
  /* Masquer la scrollbar pour Webkit */
  -webkit-overflow-scrolling: touch;
}
.grid-scrollable-wrapper::-webkit-scrollbar {
  display: none;
}
.grid-scrollable-wrapper {
  -ms-overflow-style: none; /* IE et Edge */
  scrollbar-width: none; /* Firefox */
}

/* Grille auto-adaptative pour les cartes */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: 2rem;
  margin: 0 auto;
}

/* Cartes et wrappers */
.card-wrapper {
  display: flex;
  justify-content: center;
}
.institution-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
.card-image {
  width: 100%;
  height: 13rem;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

/* Description */
.description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(3 * 1.5em);
}
.description-two-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(2 * 1.5em);
}

/* Carte Header et Titre */
.card-header {
  position: relative;
}
.card-tag {
  position: absolute;
  top: 20px;
  left: 20px;
}
.card-title {
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

/* Carte Subtitle et Description */
.card-subtitle {
  text-align: center;
}
.card-description {
  margin: 0;
}

/* Boutons dans la carte */
.button-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}
.action-button {
  margin: 0.5rem;
}
.external-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}
.link-label {
  margin-left: 0.5rem;
}
.link-disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Pagination */
.paginator {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.style-bar {
  background-color: var(--surface-card);
  border-radius: 1.2rem;
}

.institution-center-scrollable {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 2rem;
  padding-bottom: 6rem;
  scrollbar-width: none;
}
.institution-center-scrollable::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
