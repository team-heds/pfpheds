<template>
  <section class="position-relative overflow-hidden pt-5 pt-lg-3">
    <div class="container">
      <div class="row">
        <div class="col-lg-8 col-xl-9">
          <h1>Place de formation pratique (PFP)</h1>
          <br>
          <div class="row mb-4 align-items-center">
            <div class="col-xl-6">
              <form class="border rounded p-2">
                <div class="input-group input-borderless">
                  <input class="form-control me-1" type="search" placeholder="Trouver la place">
                  <button type="button" class="btn btn-primary mb-0 rounded z-index-1"><i class="fas fa-search"></i></button>
                </div>
              </form>
            </div>
            <div class="col-xl-3 mt-3 mt-xl-0">
              <form class="border rounded p-2 input-borderless">
                <select class="form-select form-select-sm js-choice border-0" aria-label=".form-select-sm">
                  <option value="">Derniers ajouté</option>
                  <option>Premier ajouté</option>
                </select>
              </form>
            </div>
            <div class="col-12 col-xl-3 d-flex justify-content-between align-items-center mt-3 mt-xl-0">
              <button class="btn btn-primary mb-0 d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasSidebar" aria-controls="offcanvasSidebar">
                <i class="fas fa-sliders-h me-1"></i> Voir le filtre
              </button>
              <p class="mb-0 text-end">voir les {{ displayedRangeStart }}-{{ displayedRangeEnd }} sur {{ totalPlaces }} résultats</p>
            </div>
          </div>
          <div class="row g-4">
            <div class="col-sm-6 col-xl-4" v-for="place in paginatedPlaces" :key="place.id">
              <div class="card shadow h-100" @click="goToDetails(place.id)">
                <img src="https://eduport.webestica.com/assets/images/courses/4by3/21.jpg" class="card-img-top img-cards" alt="place image">
                <div class="card-body pb-0">
                  <div class="d-flex justify-content-between mb-2">

                  </div>
                  <h5 class="card-title fw-normal">
                    <a :href="'/place/' + place.id">{{ place.Sector }}</a>
                  </h5>
                  <p class="mb-2 text-truncate-2">{{ place.NpmPractitionerTrainer }}</p>
                  <p class="mb-2 text-truncate-2">{{ place.idInstitution }}</p>
                </div>
                <div class="card-footer pt-0 pb-3">
                  <hr>
                  <div class="d-flex justify-content-between">

                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12">
            <nav class="mt-4 d-flex justify-content-center" aria-label="navigation">
              <ul class="pagination pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
                <li class="page-item">
                  <button class="page-link shadow-sm" @click="previousPage" :disabled="currentPage === 1">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                </li>
                <li class="page-item" v-for="page in totalPages" :key="page" :class="{ active: page === currentPage }">
                  <button class="page-link shadow-sm" @click="currentPage = page">{{ page }}</button>
                </li>
                <li class="page-item">
                  <button class="page-link shadow-sm" @click="nextPage" :disabled="currentPage === totalPages">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div class="col-lg-4 col-xl-3 pt-7">
          <div class="offcanvas-lg offcanvas-end" tabindex="-1" id="offcanvasSidebar">
            <div class="offcanvas-header bg-light">
              <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Filtre avancé</h5>
              <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#offcanvasSidebar" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body p-3 p-lg-0">
              <form>
                <div class="card card-body shadow p-4 mb-4">
                  <h4 class="mb-3">{{ category.title }}</h4>
                  <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center" v-for="(value, key) in category.categories" :key="key">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" v-model="category.categories[key]" :id="key">
                        <label class="form-check-label" :for="key">{{ key }}</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card card-body shadow p-4 mb-4">
                  <h4 class="mb-3">{{ canton.title }}</h4>
                  <div class="row">
                    <div class="col-6" v-for="(value, key) in canton.cantons" :key="key">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="form-check">
                          <input class="form-check-input" type="checkbox" v-model="canton.cantons[key]" :id="key">
                          <label class="form-check-label" :for="key">{{ key }}</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card card-body shadow p-4 mb-4">
                  <h4 class="mb-3">PFP</h4>
                  <ul class="list-inline mb-0">
                    <li class="list-inline-item mb-2" v-for="(value, key) in level" :key="key">
                      <input type="checkbox" class="btn-check" :id="'btn-check-' + key">
                      <label class="btn btn-light btn-primary-soft-check btn-language" :for="'btn-check-' + key">{{ key }}</label>
                    </li>
                  </ul>
                </div>
                <div class="card card-body shadow p-4 mb-4">
                  <h4 class="mb-3">Langues</h4>
                  <ul class="list-inline mb-0 g-3">
                    <li class="list-inline-item mb-2" v-for="(value, key) in language" :key="key">
                      <input type="checkbox" class="btn-check" :id="'btn-check-' + key">
                      <label class="btn btn-light btn-primary-soft-check btn-language" :for="'btn-check-' + key">{{ key }}</label>
                    </li>
                  </ul>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { db } from '../../../firebase';
import { ref, onValue } from "firebase/database";

export default {
  name: 'Place',
  data() {
    return {
      allPlaces: [],
      places: [],
      currentPage: 1,
      itemsPerPage: 21,
      totalPlaces: 0,
      category: {
        title: "Catégories",
        categories: {
          AIGU: false,
          REA: false,
          MSQ: false,
          SYSINT: false,
          NEURO_GER: false,
          AMBU: false,
        }
      },
      language: {
        Français: false,
        Allemand: false,
        Anglais: false,
        Italien: false,
      },
      level: {
        PFP1A: false,
        PFP1B: false,
        PFP2: false,
        PFP3: false,
        PFP4: false,
      },
      canton: {
        title: "Cantons",
        cantons: {
          VD: false,
          VS: false,
          GE: false,
          FR: false,
          NE: false,
          JU: false,
          BE: false,
          SO: false,
          BS: false,
          BL: false,
          AG: false,
          ZH: false,
          SH: false,
          TG: false,
          TI: false,
          GR: false,
          LU: false,
          OW: false,
          NW: false,
          UR: false,
          SZ: false,
          ZG: false,
          GL: false,
          SG: false,
          AR: false,
          AI: false,
          Étranger: false,
        }
      }
    };
  },
  computed: {
    paginatedPlaces() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredPlaces.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredPlaces.length / this.itemsPerPage);
    },
    displayedRangeStart() {
      return (this.currentPage - 1) * this.itemsPerPage + 1;
    },
    displayedRangeEnd() {
      return Math.min(this.currentPage * this.itemsPerPage, this.totalPlaces);
    },
    filteredPlaces() {
      return this.allPlaces.filter(place => {
        let matchesCategory = true;
        let matchesCanton = true;
        let matchesLanguage = true;
        let matchesLevel = true;

        const selectedCategories = Object.keys(this.category.categories).filter(key => this.category.categories[key]);
        if (selectedCategories.length) {
          matchesCategory = selectedCategories.every(category => {
            return place.checkBoxItems.includes(category) || place[category] === "x";
          });
        }

        const selectedCantons = Object.keys(this.canton.cantons).filter(key => this.canton.cantons[key]);
        if (selectedCantons.length) {
          matchesCanton = selectedCantons.includes(place.Canton);
        }

        const selectedLanguages = Object.keys(this.language).filter(key => this.language[key]);
        if (selectedLanguages.length) {
          matchesLanguage = selectedLanguages.some(lang => place.Language && place.Language.includes(lang));
        }

        const selectedLevels = Object.keys(this.level).filter(key => this.level[key]);
        if (selectedLevels.length) {
          matchesLevel = selectedLevels.includes(place.Level);
        }

        return matchesCategory && matchesCanton && matchesLanguage && matchesLevel;
      });
    }
  },
  mounted() {
    this.fetchPlacesFromFirebase();
  },
  methods: {
    fetchPlacesFromFirebase() {
      const placesRef = ref(db, 'placedestage/');
      onValue(placesRef, (snapshot) => {
        const institutionsData = snapshot.val();
        this.allPlaces = [];
        if (institutionsData) {
          Object.keys(institutionsData).forEach((institutionId) => {
            const stages = institutionsData[institutionId];
            Object.keys(stages).forEach((stageId) => {
              const stage = stages[stageId];
              this.allPlaces.push({
                id: stageId,
                idInstitution: institutionId,
                ...stage
              });
            });
          });
          this.totalPlaces = this.allPlaces.length;
        } else {
          this.totalPlaces = 0;
        }
      });
    },
    applyFilters() {
      this.places = this.filteredPlaces;
      this.totalPlaces = this.places.length;
      this.currentPage = 1;
    },
    resetFilters() {
      Object.keys(this.category.categories).forEach(key => this.category.categories[key] = false);
      Object.keys(this.language).forEach(key => this.language[key] = false);
      Object.keys(this.level).forEach(key => this.level[key] = false);
      Object.keys(this.canton.cantons).forEach(key => this.canton.cantons[key] = false);
      this.places = [...this.allPlaces];
      this.currentPage = 1;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    goToDetails(id) {
      if (id) {
        this.$router.push({ name: 'PlaceDetail', params: { id: id } });
      } else {
        console.error("ID is undefined for this place.");
      }
    }
  }
}
</script>

<style scoped>
.card {
  cursor: pointer;
}
.img-cards{
  width: 100%;
  height: 220px;
  border-radius: 0.5rem;
  object-fit: cover;
}

.btn-language {
  height: 40.05px;
  width: 101.05px;
}
</style>
