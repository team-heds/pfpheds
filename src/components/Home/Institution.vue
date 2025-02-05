<template>
  <Navbar />
  <!-- Layout principal avec sidebars et contenu central -->
  <div class="institutions-layout">
    <!-- Sidebar Gauche -->
    <div class="sidebar-left">
      <LeftSidebar />
    </div>

    <!-- Contenu Principal -->
    <div class="main-content">
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
              <InputText v-model="searchTerm" placeholder="Rechercher par nom" class="search-input" />
            </span>
          </div>

          <!-- Zone défilante pour la grille -->
          <div class="grid-scrollable-wrapper">
            <!-- Grille auto-adaptative pour les cartes -->
            <div class="grid-container">
              <div
                v-for="(institution, index) in displayedInstitutions"
                :key="index"
                class="card-wrapper"
                :class="{ 'empty': institution.isPlaceholder }"
              >
                <Card
                  v-if="!institution.isPlaceholder"
                  class="institution-card surface-card"
                  style="width: 20rem; height: 100%;"
                >
                  <template #header>
                    <div class="card-header">
                      <img :src="institution.ImageURL" alt="institution" class="card-image" />
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
                        {{ truncateText(institution.Description, 100) }}
                      </p>
                    </div>
                  </template>
                  <template #content>
                    <div class="button-container">
                      <Button
                        class="action-button"
                        @click="goToDetails(institution.InstitutionId)"
                        label="Détails"
                        icon="pi pi-info-circle"
                        outlined
                      />
                      <a
                        :href="institution.URL || '#'"
                        target="_blank"
                        class="external-link"
                        rel="noopener noreferrer"
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

          <!-- Pagination (statique) -->
          <Paginator
            :rows="itemsPerPage"
            :totalRecords="totalFilteredInstitutions"
            :rowsPerPageOptions="[12, 24, 36, 48, 60, 72, 84]"
            @page="onPageChange"
            class="paginator"
          ></Paginator>
        </div>
      </section>
    </div>

    <!-- Sidebar Droite -->
    <div class="sidebar-right">
      <RightSidebar />
    </div>
  </div>
</template>

<script>
import { db } from '../../../firebase.js';
import { ref as dbRef, onValue } from "firebase/database";
import Navbar from '@/components/Utils/Navbar.vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Paginator from 'primevue/paginator';
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue';
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue';

export default {
  name: 'Institutions',
  components: {
    Navbar,
    InputText,
    Button,
    Card,
    Tag,
    Paginator,
    LeftSidebar,
    RightSidebar
  },
  data() {
    return {
      allInstitutions: [],
      currentPage: 1,
      itemsPerPage: 12,
      totalInstitutions: 0,
      descriptionClass: 'description',
      searchTerm: '',
    };
  },
  computed: {
    filteredInstitutions() {
      if (!this.searchTerm) {
        return this.allInstitutions;
      }
      return this.allInstitutions.filter(institution =>
        institution.Name &&
        institution.Name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    },
    paginatedFilteredInstitutions() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredInstitutions.slice(start, end);
    },
    totalFilteredInstitutions() {
      return this.filteredInstitutions.length;
    },
    displayedInstitutions() {
      const result = [...this.paginatedFilteredInstitutions];
      // Compléter la dernière rangée avec des placeholders si nécessaire
      const remainder = result.length % 4;
      if (remainder !== 0) {
        const placeholdersToAdd = 4 - remainder;
        for (let i = 0; i < placeholdersToAdd; i++) {
          result.push({ isPlaceholder: true });
        }
      } else if (result.length === 0) {
        // Si aucun résultat, ajouter 4 placeholders
        for (let i = 0; i < 4; i++) {
          result.push({ isPlaceholder: true });
        }
      }
      return result;
    }
  },
  methods: {
    truncateText(text, length) {
      if (text && text.length > length) {
        return text.substring(0, length) + '...';
      }
      return text;
    },
    fetchInstitutionsFromFirebase() {
      const institutionsRef = dbRef(db, 'Institutions/');
      onValue(institutionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.allInstitutions = Object.keys(data).map(key => ({
            InstitutionId: key,
            ...data[key],
            ImageURL: data[key].ImageURL || '/default-image.jpg',
            Description: data[key].Description || 'Pas de description disponible'
          }));
          this.totalInstitutions = this.allInstitutions.length;
          this.$nextTick(() => {
            this.adjustDescriptionHeight();
          });
        } else {
          this.allInstitutions = [];
          this.totalInstitutions = 0;
        }
      });
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
    onPageChange(event) {
      this.currentPage = event.page + 1;
      this.itemsPerPage = event.rows;
    },
    goToDetails(id) {
      if (id) {
        this.$router.push({ name: 'InstitutionView', params: { id: id } });
      } else {
        console.error("L'ID est indéfini pour cette institution.");
      }
    }
  },
  mounted() {
    this.fetchInstitutionsFromFirebase();
  }
};
</script>

<style scoped>
/* Layout principal pour les Institutions avec sidebars */
.institutions-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr; /* Sidebar gauche, contenu central, sidebar droite */
  gap: 1.5rem;
  min-height: 100vh;
}

/* Sidebar Gauche et Droite */
.sidebar-left,
.sidebar-right {
  overflow-y: auto;
}

/* Contenu Principal */
.main-content {
  overflow-y: auto;
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
  max-height: 990px; /* Ajustez cette hauteur selon vos besoins */
  overflow-y: auto;
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
.card-wrapper.empty {
  visibility: hidden;
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

/* Pagination */
.paginator {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}
</style>
