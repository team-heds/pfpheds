<template>
  <div>
    <div class="flex flex-wrap lg:flex-nowrap">
      <div class="col-fixed lg:col-2 mr-4 flex p-0 flex-column w-full lg:w-3">
        <Divider class="w-full m-0 p-0" />
        <Accordion :multiple="true" class="-mb-1 mt-3" :activeIndex="[0,1,2,3]">
          <AccordionTab :header="'Catégories (' + selectedColors.length + ')'">
            <div class="transition-all transition-duration-400 transition-ease-in-out">
              <div class="grid mb-3">
                <!-- Dynamically create category filters -->
                <div class="col-4 flex flex-column align-items-center" v-for="category in categories" :key="category.name">
                  <div :class="['w-3rem h-3rem border-circle', category.class, 'cursor-pointer border-none flex justify-content-center align-items-center']" @click="toggleSelection(category.name)">
                    <i class="pi pi-check text-2xl text-white" v-if="selectedColors.includes(category.name)"></i>
                  </div>
                  <p class="text-900 text-sm text-center mt-1">{{ category.name }}</p>
                </div>
              </div>
            </div>
          </AccordionTab>
          <AccordionTab :header="'Cantons (' + selectedBrand_1.length + ') '">
            <div class="transition-all transition-duration-400 transition-ease-in-out">
              <div class="mb-3">
              <span class="p-input-icon-right w-full">
                <i class="pi pi-search"></i>
                <InputText placeholder="Search" class="w-full" />
              </span>
              </div>
              <!-- Dynamically create canton filters -->
              <div class="flex w-full justify-content-between" v-for="canton in visibleCantons" :key="canton.name">
                <div class="field-checkbox">
                  <Checkbox :value="canton.name" :id="canton.name" v-model="selectedBrand_1"></Checkbox>
                  <label :for="canton.name" class="text-900">{{ canton.name }}</label>
                </div>
                <Badge :value="canton.count" class="mr-2 bg-gray-200 text-gray-900 p-0 border-circle"></Badge>
              </div>
              <a tabindex="0" class="block cursor-pointer my-3 text-primary font-medium" @click="showMoreCantons">Voir plus...</a>
            </div>
          </AccordionTab>
        </Accordion>
      </div>
      <div class="w-full border-2 border-dashed border-round surface-border surface-section mt-3 lg:mt-0" style="min-height:25rem;">
        <div id="newMap" style="height: 600px;"></div>
      </div>
    </div>
    <Dialog v-model:visible="dialogVisible" appendTo="body" :modal="true" :breakpoints="{'960px': '75vw', '640px': '100vw'}" :style="{width: '40vw'}">
      <template #header>
        <div class="flex align-items-center">
      <span class="flex align-items-center justify-content-center bg-primary-100 text-primary-800 mr-3 border-circle" style="width:32px;height:32px">
        <i class="pi pi-map-marker text-lg"></i>
      </span>
          <span class="font-medium text-2xl text-900">{{ selectedInstitution.Name }}</span>
        </div>
      </template>
      <div class="line-height-3 p-0 m-0">
        <div>
          <i class="pi pi-map-marker text-primary"></i>
          {{ selectedInstitution.Lieu }}
        </div>
        <div>
          <i class="pi pi-flag text-primary"></i>
          {{ selectedInstitution.Canton }}
        </div>
        <a :href="selectedInstitution.URL.startsWith('https://') ? selectedInstitution.URL : 'https://' + selectedInstitution.URL" class="btn btn-primary mt-3" target="_blank">
          <i class="pi pi-globe"></i>
          Site Web
        </a>
      </div>
      <template #footer>
        <div class="border-top-1 surface-border pt-3">
          <Button icon="pi pi-times" @click="dialogVisible = false" label="Retour" class="p-button-text mr-3"></Button>
          <Button icon="pi pi-globe" @click="dialogVisible = false" label="Site web"></Button>
        </div>
      </template>
    </Dialog>
  </div>
  <AppDarkAndLightMode />
</template>

<script>
import L from 'leaflet';
import { db } from '../../../firebase.js';
import { ref, onValue } from "firebase/database";

export default {
  components: { AppDarkAndLightMode },
  data() {
    return {
      categories: [
        { name: 'AIGU', class: 'bg-gray-500' },
        { name: 'AMBU', class: 'bg-orange-500' },
        { name: 'MSQ', class: 'bg-indigo-500' },
        { name: 'NEURO_GER', class: 'bg-pink-500' },
        { name: 'REA', class: 'bg-cyan-500' },
        { name: 'SYSINT', class: 'bg-pink-500' }
      ],
      cantons: [
        { name: 'Valais / VS', count: 42, visible: true },
        { name: 'Berne / BE', count: 18, visible: true },
        { name: 'Vaud / VD', count: 7, visible: true },
        { name: 'Genève / GE', count: 36, visible: true },
        { name: 'Jura / JU', count: 36, visible: false },
        { name: 'Zurich / ZH', count: 50, visible: false },
        { name: 'Lucerne / LU', count: 22, visible: false },
        { name: 'Fribourg / FR', count: 22, visible: false }
        // Ajoutez d'autres cantons ici avec visible: false pour les cacher initialement
      ],
      selectedBrand_1: [],
      selectedColors: [],
      map: null,
      markers: [],
      allInstitutions: [],
      selectedInstitution: null,
      dialogVisible: false,
      showAllCantons: false
    }
  },
  mounted() {
    this.initMap();
    this.fetchInstitutionsFromFirebase();
  },
  methods: {
    initMap() {
      this.map = L.map('newMap').setView([46.22292, 7.3668], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
    },
    fetchInstitutionsFromFirebase() {
      const institutionsRef = ref(db, 'institutions/');
      onValue(institutionsRef, (snapshot) => {
        const data = snapshot.val();
        this.allInstitutions = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        this.addLocationsToMap();
      });
    },
    clearMarkers() {
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
    },
    addLocationsToMap() {
      this.clearMarkers();
      this.filteredInstitutions.forEach(institution => {
        const marker = L.marker([institution.Latitude, institution.Longitude]).addTo(this.map)
          .on('click', () => {
            this.selectedInstitution = institution;
            this.dialogVisible = true;
          });
        this.markers.push(marker);
      });
    },
    toggleSelection(category) {
      const index = this.selectedColors.indexOf(category);
      if (index === -1) {
        this.selectedColors.push(category);
      } else {
        this.selectedColors.splice(index, 1);
      }
      this.addLocationsToMap();
    },
    showMoreCantons() {
      this.showAllCantons = true;
      this.cantons.forEach(canton => canton.visible = true);
    }
  },
  computed: {
    filteredInstitutions() {
      return this.allInstitutions.filter(institution => {
        const matchesColors = this.selectedColors.length === 0 || this.selectedColors.some(color => institution.categories.includes(color));
        const matchesCantons = this.selectedBrand_1.length === 0 || this.selectedBrand_1.includes(institution.Canton);
        return matchesColors && matchesCantons;
      });
    },
    visibleCantons() {
      return this.showAllCantons ? this.cantons : this.cantons.filter(canton => canton.visible);
    }
  }
};
</script>



<style scoped>

</style>
