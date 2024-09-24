<template>
  <Navbar />
  <section class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <div class="container flex">
      <!-- Colonne pour les cartes -->
      <div class="flex-grow">
        <h1 class="text-900 font-bold text-5xl text-center">Institutions</h1>
        <p class="text-600 font-normal text-xl text-center">Découvrez les institutions partenaires de notre réseau</p>
        <div class="grid flex justify-center">
          <div class="col-12 md:col-6 xl:col-3 p-3 flex justify-center" v-for="institution in paginatedInstitutions" :key="institution.id">
            <Card class="institution-card" style="width: 20rem; height: 100%;">
              <template #header>
                <div style="position: relative;">
                  <img :src="institution.ImageURL || '/default-image.jpg'" alt="institution" class="card-image" />
                  <Tag style="position: absolute; top: 20px; left: 20px;">{{ institution.Canton }}</Tag>
                </div>
                <p ref="institutionName" class="text-center text-xl text-900 font-bold m-1 mt-1">{{ institution.Name }}</p> <!-- Ajout de ref -->
              </template>
              <template #subtitle>
                <div class="text-center">
                  <p>{{ institution.Locality }} <Tag>{{ institution.Language }}</Tag></p>
                  <!-- Tronquer la description ici -->
                  <p :class="descriptionClass" class="m-0">{{ truncateText(institution.Description, 100) }}</p>
                </div>
              </template>
              <template #content>
                <div class="button-container">
                  <Button @click="goToDetails(institution.id)" label="Détails" icon="pi pi-info-circle" class="p-button-text" />
                  <a :href="institution.URL" target="_blank" class="p-button p-component" rel="noopener noreferrer">
                    <span class="p-button-icon pi pi-external-link"></span>
                    <span class="p-button-label ml-2">Site web</span>
                  </a>
                </div>
              </template>
            </Card>
          </div>
        </div>
        <Paginator :rows="itemsPerPage" :totalRecords="totalInstitutions" :rowsPerPageOptions="[12, 24, 36, 48, 60, 72, 84]" @page="onPageChange"></Paginator>
      </div>
    </div>
  </section>

  <AppDarkAndLightMode />
  <Footer />
</template>


<script>
import { db } from '../../../firebase.js';
import { ref as dbRef, onValue } from "firebase/database";
import AppDarkAndLightMode from '@/layout/AppDarkAndLightMode.vue';
import Navbar from '@/components/Utils/Navbar.vue';

export default {
  components: { Navbar, AppDarkAndLightMode },
  data() {
    return {
      allInstitutions: [],
      institutionDetailsPath: '/Institution/',
      currentPage: 1,
      itemsPerPage: 12,
      totalInstitutions: 0,
      descriptionClass: 'description', // Classe CSS par défaut
    };
  },
  computed: {
    paginatedInstitutions() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.allInstitutions.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.totalInstitutions / this.itemsPerPage);
    },
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
            id: key,
            ...data[key],
            ImageURL: data[key].ImageURL || '/default-image.jpg',
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
      const nameElement = this.$refs.institutionName;
      if (nameElement) {
        const lineHeight = parseInt(getComputedStyle(nameElement).lineHeight, 10);
        const nameHeight = nameElement.clientHeight;

        // Check if the name takes up more than two lines (assume 3 lines if the height is 3 times the line height)
        if (nameHeight > lineHeight * 2) {
          this.descriptionClass = 'description-two-lines'; // Change the class if the name takes up three lines
        } else {
          this.descriptionClass = 'description'; // Default class if the name is within two lines
        }
      }
    },
    updatePageData() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = Math.max(1, this.totalPages);
      }
      if (this.currentPage === 0 && this.totalInstitutions > 0) {
        this.currentPage = 1;
      }
    },
    onPageChange(event) {
      this.currentPage = event.page + 1;
      this.itemsPerPage = event.rows;
      this.$nextTick(() => {
        this.updatePageData();
      });
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
  height: 15rem;
  object-fit: cover;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
}

.description {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Show only three lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(3 * 1.5em); /* Adjust based on font size to fit three lines */
}

.description-two-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Show only two lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(2 * 1.5em); /* Adjust based on font size to fit two lines */
}

.institution-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.button-container {
  margin-top: auto; /* Push buttons to the bottom */
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

@media (min-width: 992px) {
  .container {
    display: flex;
    justify-content: center;
  }

  .grid {
    justify-content: center;
  }
}
</style>

