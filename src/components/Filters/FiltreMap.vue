<template>
  <div class="px-4 py-8 md:px-6 lg:px-8">
    <div class="text-900 font-bold text-5xl text-center">Carte interactive</div>
    <p class="text-600 font-normal text-xl text-center">Liste des différentes places de formation pratique de la filière physiothérapie de la HES-SO Valais-Wallis</p>
    <Divider class="w-full"/>
    <div class="flex flex-wrap lg:flex-nowrap">
      <div class="col-fixed lg:col-2 mr-4 flex p-0 flex-column w-full lg:w-3">
        <Divider class="w-full m-0 p-0" />
        <Accordion :multiple="true" class="-mb-1 mt-3" :activeIndex="[0,1,2,3]">
          <AccordionTab :header="'Catégories (' + selectedCategories.length + ')'">
            <div class="transition-all transition-duration-400 transition-ease-in-out">
              <div class="grid mb-3">
                <div class="col-4 flex flex-column align-items-center" v-for="category in categories" :key="category.name">
                  <div :class="['w-3rem h-3rem', category.class, 'cursor-pointer border-round flex justify-content-center align-items-center']" @click="toggleCategory(category.name)">
                    <i class="pi pi-check text-2xl text-white" v-if="selectedCategories.includes(category.name)"></i>
                  </div>
                  <p class="text-900 text-sm text-center mt-1">{{ category.name }}</p>
                </div>
              </div>
            </div>
          </AccordionTab>
          <AccordionTab :header="'Cantons (' + selectedCantons.length + ') '">
            <div class="transition-all transition-duration-400 transition-ease-in-out">
              <div class="mb-3">
              <span class="p-input-icon-right w-full">
                <i class="pi pi-search"></i>
                <InputText placeholder="Recherche" v-model="searchCanton" class="w-full" />
              </span>
              </div>
              <div class="flex w-full justify-content-between" v-for="canton in filteredCantons" :key="canton.name">
                <div class="field-checkbox">
                  <Checkbox :value="canton.name" :id="canton.name" v-model="selectedCantons" @change="filterInstitutions"></Checkbox>
                  <label :for="canton.name" class="text-900">{{ canton.name }}</label>
                </div>
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
          <span class="font-medium text-2xl text-900">{{ selectedInstitution ? selectedInstitution.Name : '' }}</span>
        </div>
      </template>
      <template #default>
        <div class="grid">
          <div class="col-12 md:col-4">
            <img :src="selectedInstitution && selectedInstitution.imageUrl ? selectedInstitution.imageUrl : 'https://eduport.webestica.com/assets/images/courses/4by3/21.jpg'" alt="Institution Image" class="w-full institution-image shadow">
          </div>
          <div class="col-12 md:col-8">
            <div class="line-height-3 p-0 m-0 mt-3">
              <div class="mb-3 text-900 text-xl">
                <i class="pi pi-globe text-primary mb-3"></i>
                {{ selectedInstitution ? selectedInstitution.URL : '' }}
              </div>
              <div class="mb-3 text-900 text-xl">
                <i class="pi pi-map-marker text-primary mb-3"></i>
                {{ selectedInstitution ? selectedInstitution.Street : '' }}
              </div>
              <div class="text-900 text-xl">
                <i class="pi pi-flag text-primary "></i>
                {{ selectedInstitution ? selectedInstitution.Canton : '' }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="border-top-1 surface-border pt-3">
          <Button icon="pi pi-times" @click="dialogVisible = false" label="Retour" class="button-text mr-3"></Button>
          <Button icon="pi pi-info-circle" @click="navigateToDetails(selectedInstitution.id)" label="Détails" class="button-text mr-3"></Button>
          <Button icon="pi pi-globe" @click="openWebsite(selectedInstitution.URL)" label="Site web"></Button>
        </div>
      </template>
    </Dialog>
  </div>

</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../../../firebase.js';
import { ref as firebaseRef, onValue } from 'firebase/database';
import L from 'leaflet';


const router = useRouter();
const categories = ref([
  { name: 'AIGU', class: 'bg-primary-500' },
  { name: 'AMBU', class: 'bg-orange-500' },
  { name: 'MSQ', class: 'bg-indigo-500' },
  { name: 'NEUROGER', class: 'bg-pink-500' },
  { name: 'REA', class: 'bg-cyan-500' },
  { name: 'SYSINT', class: 'bg-pink-500' }
]);
const cantons = ref([
  { name: 'VS', count: 42, visible: true },
  { name: 'BE', count: 18, visible: true },
  { name: 'VD', count: 7, visible: true },
  { name: 'GE', count: 36, visible: true },
  { name: 'JU', count: 36, visible: false },
  { name: 'ZH', count: 50, visible: false },
  { name: 'LU', count: 22, visible: false },
  { name: 'FR', count: 22, visible: false }
]);
const selectedCategories = ref([]);
const selectedCantons = ref([]);
const searchCanton = ref('');
const map = ref(null);
const markers = ref([]);
const allInstitutions = ref([]);
const selectedInstitution = ref(null);
const dialogVisible = ref(false);
const showAllCantons = ref(false);

const initMap = () => {
  map.value = L.map('newMap').setView([46.22292, 7.3668], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);
};

const fetchInstitutionsFromFirebase = () => {
  const institutionsRef = firebaseRef(db, 'institutions/');
  onValue(institutionsRef, (snapshot) => {
    const data = snapshot.val();
    allInstitutions.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    filterInstitutions();
  });
};

const clearMarkers = () => {
  markers.value.forEach(marker => marker.remove());
  markers.value = [];
};

const addLocationsToMap = (institutions) => {
  clearMarkers();
  institutions.forEach(institution => {
    const marker = L.marker([institution.Latitude, institution.Longitude]).addTo(map.value)
      .on('click', () => {
        selectedInstitution.value = institution;
        dialogVisible.value = true;
      });
    markers.value.push(marker);
  });
};

const toggleCategory = (category) => {
  const index = selectedCategories.value.indexOf(category);
  if (index === -1) {
    selectedCategories.value.push(category);
  } else {
    selectedCategories.value.splice(index, 1);
  }
  filterInstitutions();
};

const filterInstitutions = () => {
  const filtered = allInstitutions.value.filter(institution => {
    const matchesCategories = selectedCategories.value.length === 0 || selectedCategories.value.some(category => institution[category]);
    const matchesCantons = selectedCantons.value.length === 0 || selectedCantons.value.includes(institution.Canton);
    return matchesCategories && matchesCantons;
  });
  addLocationsToMap(filtered);
};

const showMoreCantons = () => {
  showAllCantons.value = true;
  cantons.value.forEach(canton => canton.visible = true);
};

const navigateToDetails = (id) => {
  router.push({ name: 'InstitutionView', params: { id } });
};

const openWebsite = (url) => {
  if (url) {
    const completeUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`;
    window.open(completeUrl, '_blank');
  }
};

const filteredCantons = computed(() => {
  return cantons.value.filter(canton => canton.name.toLowerCase().includes(searchCanton.value.toLowerCase()));
});

watch([selectedCategories, selectedCantons], () => {
  filterInstitutions();
});

onMounted(() => {
  initMap();
  fetchInstitutionsFromFirebase();
});
</script>

<style scoped>
.institution-image {
  width: 100%;
  max-width: 1200px;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  margin: auto;
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow to the image */
}

.shadow {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow to the map */
}
</style>
