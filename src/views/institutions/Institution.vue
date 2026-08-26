<template>
  <div class="institution-page">
    <div v-if="isMobile">
      <HeaderIcons />
    </div>
    <Navbar />
    <!-- Layout principal avec sidebars et contenu central -->
    <SocialThreeColumnLayout>
      <!-- Sidebar Gauche -->
      <template #left>
        <LeftSidebar />
      </template>

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

            <div class="mobile-filters">
              <FilterSidebar
                id-prefix="institution-list-mobile-filters"
                v-model:filters="activeFilters"
                v-model:search-term="searchTerm"
                :cantons="cantonsList"
                :result-count="filteredInstitutions.length"
                @clear="clearFilters"
              />
            </div>

            <!-- Zone défilante pour la grille -->
            <div class="grid-scrollable-wrapper">
              <!-- Grille auto-adaptative pour les cartes -->
              <EmptyState v-if="filteredInstitutions.length === 0" title="Aucune institution trouvée" description="Modifiez votre recherche ou effacez les filtres actifs." action-label="Effacer les filtres" @action="clearFilters" />
              <div v-else class="grid-container">
                <div
                  v-for="(institution, index) in filteredInstitutions"
                  :key="institution.InstitutionId || institution.id || index"
                  class="card-wrapper"
                >
                  <Card
                    class="institution-card surface-card"
                  >
                    <template #header>
                      <div class="card-header">
                        <img :src="getInstitutionImage(institution)" :alt="`Illustration de ${institution.Name}`" class="card-image" />
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
      <template #right>
        <FilterSidebar
          id-prefix="institution-list-desktop-filters"
          v-model:filters="activeFilters"
          v-model:search-term="searchTerm"
          :cantons="cantonsList"
          :result-count="filteredInstitutions.length"
          @clear="clearFilters"
        />
      </template>
    </SocialThreeColumnLayout>
  </div>
</template>

<script>
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import Navbar from '@/components/common/utils/Navbar.vue'
import PrimeButton from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import LeftSidebar from '@/components/social/library/LeftSidebar.vue'
import FilterSidebar from '@/components/common/filters/FilterSidebar.vue'
import HeaderIcons from '@/components/common/utils/HeaderIcons.vue'
import EmptyState from '@/components/common/states/EmptyState.vue'
import SocialThreeColumnLayout from '@/components/common/layouts/SocialThreeColumnLayout.vue'
import { filterInstitutions, getAvailableCantons } from '@/service/institutionFiltersService'

export default {
  name: 'InstitutionPage',
  components: {
    FilterSidebar,
    Navbar,
    PrimeButton,
    Card,
    Tag,
    LeftSidebar,
    HeaderIcons,
    EmptyState,
    SocialThreeColumnLayout
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
    filteredInstitutions() {
      return filterInstitutions({
        institutions: this.allInstitutions,
        places: this.placesStore?.places || [],
        filters: this.activeFilters,
        searchTerm: this.searchTerm,
      });
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
        this.cantonsList = getAvailableCantons(this.allInstitutions);
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
    clearFilters() {
      this.searchTerm = '';
      this.activeFilters = { cantons: [], criter: [], pfp: [], languages: [] };
    },
    updateIsMobile() {
      this.isMobile = window.innerWidth < 768;
    }
  },
  mounted() {
    this.fetchInstitutions();
    this.placesStore.fetchPlaces();
    // Gestion responsive
    window.addEventListener('resize', this.updateIsMobile);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateIsMobile);
  },
};
</script>

<style scoped>
/* Contenu Principal */
.main-content {
  height: 100%;
  overflow-y: auto; /* Scroll central uniquement */
}

/* Section de contenu */
.content-section {
  padding: 2rem;
}

.mobile-filters { display: none; margin-bottom: 1.5rem; }

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
  width: 100%;
  max-width: 20rem;
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

@media (max-width: 63.99rem) {
  .mobile-filters { display: block; }
}

@media (max-width: 38rem) {
  .institution-center-scrollable,
  .content-section { padding-inline: 1rem; }
  .title { font-size: 2.25rem; }
  .subtitle { font-size: 1rem; }
  .grid-container { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
}
</style>
