<template>
  <Navbar />
  <section class="px-4 py-8 md:px-6 lg:px-8">
    <div class="container flex justify-content-center">
      <div class="flex-grow">
        <h1 class="text-900 font-bold text-5xl text-center">Institutions</h1>
        <p class="text-600 font-normal text-xl text-center">
          Découvrez les institutions partenaires de notre réseau
        </p>

        <!-- Barre de recherche au centre -->
        <div class="flex justify-content-center my-4">
          <span class="p-input-icon-left">
            <InputText v-model="searchTerm" placeholder="Rechercher par nom" style="width: 300px;" />
          </span>
        </div>

        <!-- Grille avec toujours 4 colonnes et plus d'espace entre les cartes -->
        <div class="grid-container mb-4">
          <!-- Boucle sur les institutions + placeholders -->
          <div
            v-for="(institution, index) in displayedInstitutions"
            :key="index"
            class="card-wrapper"
            :class="{ 'empty': institution.isPlaceholder }"
          >
            <Card v-if="!institution.isPlaceholder" class="institution-card surface-card" style="width: 20rem; height: 100%;">
              <template #header>
                <div style="position: relative;">
                  <img :src="institution.ImageURL" alt="institution" class="card-image" />
                  <Tag style="position: absolute; top: 20px; left: 20px;">{{ institution.Canton }}</Tag>
                </div>
                <p ref="institutionName" class="text-center text-xl text-900 font-bold m-1 mt-1">{{ institution.Name }}</p>
              </template>
              <template #subtitle>
                <div class="text-center">
                  <p>{{ institution.Locality }} <Tag severity="primary">{{ institution.Language }}</Tag></p>
                  <p :class="descriptionClass" class="m-0">{{ truncateText(institution.Description, 100) }}</p>
                </div>
              </template>
              <template #content>
                <div class="button-container">
                  <Button class="m-1" @click="goToDetails(institution.InstitutionId)" label="Détails" icon="pi pi-info-circle" outlined />
                  <a :href="institution.URL || '#'" target="_blank" class="p-button p-component m-1" rel="noopener noreferrer">
                    <span class="p-button-icon pi pi-external-link"></span>
                    <span class="p-button-label ml-2">Site web</span>
                  </a>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <Paginator
          :rows="itemsPerPage"
          :totalRecords="totalFilteredInstitutions"
          :rowsPerPageOptions="[12, 24, 36, 48, 60, 72, 84]"
          @page="onPageChange"
          class="justify-content-center"
        ></Paginator>
      </div>
    </div>
  </section>
  <Footer />
</template>

<script>
import { db } from '../../../firebase.js';
import { ref as dbRef, onValue } from "firebase/database";
import Navbar from '@/components/Utils/Navbar.vue';
import InputText from 'primevue/inputtext';
import { onAuthStateChanged } from "firebase/auth";
import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Paginator from 'primevue/paginator';
import Footer from '@/components/Utils/Footer.vue';

export default {
  components: { Navbar, InputText, Button, Card, Tag, Paginator, Footer },
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
        institution.Name && institution.Name.toLowerCase().includes(this.searchTerm.toLowerCase())
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
      const remainder = result.length % 4;
      if (remainder !== 0) {
        const placeholdersToAdd = 4 - remainder;
        for (let i = 0; i < placeholdersToAdd; i++) {
          result.push({ isPlaceholder: true });
        }
      } else if (result.length === 0) {
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
            Description: data[key].Description || 'Pas de description disponible',
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
        nameElements.forEach((nameElement) => {
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
    },
  },
  mounted() {
    this.fetchInstitutionsFromFirebase();
  }
}
</script>

<style scoped>
.card-image {
  width: 100%;
  height: 13rem;
  object-fit: cover;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
}

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

/* Grille 4 colonnes, centrée, gap augmenté à 2rem */
.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 20rem);
  justify-content: center;
  gap: 2rem;
  margin: 0 auto;
}

.card-wrapper {
  width: 20rem;
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

.institution-image {
  width: 100%;
  max-width: 1200px;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  margin: auto;
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 600px) {
  .grid-container {
    grid-template-columns: 20rem; /* 1 colonne sur mobile */
  }
}

@media (min-width: 601px) and (max-width: 992px) {
  .grid-container {
    grid-template-columns: repeat(2, 20rem); /* 2 colonnes sur tablette */
  }
}
</style>
