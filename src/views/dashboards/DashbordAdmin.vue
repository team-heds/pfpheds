<script setup>
import { onMounted, ref, watch } from 'vue';
import { ProductService } from '@/service/ProductService';
import { FilterMatchMode } from 'primevue/api';
import { useLayout } from '@/layout/composables/layout';
import AppSidebar from '@/layout/AppSidebar.vue';
import Navbar from '@/components/Utils/Navbar.vue'

// PrimeVue components
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Rating from 'primevue/rating';
import Knob from 'primevue/knob';
import AppTopbar from '@/layout/AppTopbar.vue';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

// Firebase
import { db } from '../../../firebase.js';
import { ref as dbRef, onValue, remove } from "firebase/database";

// Layout configuration and reactive state
const { layoutConfig } = useLayout();
const knobValue = ref(90);
const products = ref([]);

// Week data and selection
const weeks = ref([
  {
    label: 'Dernier mois',
    value: 0,
    data: [
      [65, 59, 80, 81, 56, 55, 40],
      [28, 48, 40, 19, 86, 27, 90]
    ]
  },
  {
    label: 'Ce mois',
    value: 1,
    data: [
      [35, 19, 40, 61, 16, 55, 30],
      [48, 78, 10, 29, 76, 77, 10]
    ]
  }
]);
const selectedWeek = ref(weeks.value[0]);

// Chart options and data
const pieOptions = ref({});
const barOptions = ref({});
const barData = ref({});
const pieData = ref({});

// Sales table reference and filters
const salesTableRef = ref(null);
const filterSalesTable = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Institutions data
const institutions = ref([]);
const filters = ref({});
const loading = ref(true);
const globalFilter = ref('');

// Students data
const students = ref([]);
const studentFilters = ref({});
const studentLoading = ref(true);
const studentGlobalFilter = ref('');

// Fetch institutions data
onMounted(() => {
  const institutionsRef = dbRef(db, 'institutions/');
  onValue(institutionsRef, (snapshot) => {
    const data = snapshot.val();
    institutions.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    loading.value = false;
  });

  // Fetch students data
  const studentsRef = dbRef(db, 'students/');
  onValue(studentsRef, (snapshot) => {
    const data = snapshot.val();
    students.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    studentLoading.value = false;
  });
});

// Function to set chart data based on current layout configuration
const setChartData = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

  // Pie chart data and options
  pieData.value = {
    labels: ['Electronics', 'Fashion', 'Household'],
    datasets: [
      {
        data: [300, 50, 100],
        backgroundColor: [documentStyle.getPropertyValue('--primary-700'), documentStyle.getPropertyValue('--primary-400'), documentStyle.getPropertyValue('--primary-100')],
        hoverBackgroundColor: [documentStyle.getPropertyValue('--primary-600'), documentStyle.getPropertyValue('--primary-300'), documentStyle.getPropertyValue('--primary-200')]
      }
    ]
  };
  pieOptions.value = {
    animation: { duration: 0 },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          usePointStyle: true,
          font: { weight: 700 },
          padding: 28
        },
        position: 'bottom'
      }
    }
  };

  // Bar chart data and options
  barData.value = {
    labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    datasets: [
      {
        label: 'Revenue',
        backgroundColor: documentStyle.getPropertyValue('--primary-500'),
        barThickness: 12,
        borderRadius: 12,
        data: selectedWeek.value.data[0]
      },
      {
        label: 'Profit',
        backgroundColor: documentStyle.getPropertyValue('--primary-200'),
        barThickness: 12,
        borderRadius: 12,
        data: selectedWeek.value.data[1]
      }
    ]
  };
  barOptions.value = {
    animation: { duration: 0 },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          usePointStyle: true,
          font: { weight: 700 },
          padding: 28
        },
        position: 'bottom'
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
          font: { weight: 500 }
        },
        grid: { display: false, drawBorder: false }
      },
      y: {
        ticks: { color: textColorSecondary },
        grid: { color: surfaceBorder, drawBorder: false }
      }
    }
  };
};

// Fetch products and set initial chart data on component mount
onMounted(() => {
  const productService = new ProductService();
  productService.getProductsSmall().then(data => (products.value = data));
  selectedWeek.value = weeks.value[0];
  setChartData();
});

// Watch for changes in layout configuration to update chart data
watch([layoutConfig.colorScheme, layoutConfig.theme], () => {
  setChartData();
}, { immediate: true });

// Format currency values
const formatCurrency = (value) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Export sales table to CSV
const exportCSV = () => {
  salesTableRef.value.exportCSV();
};

// Update bar chart data on week change
const onWeekChange = () => {
  let newBarData = { ...barData.value };
  newBarData.datasets[0].data = selectedWeek.value.data[0];
  newBarData.datasets[1].data = selectedWeek.value.data[1];
  barData.value = newBarData;
  setChartData();
};

// Get badge severity based on inventory status
const getBadgeSeverity = (inventoryStatus) => {
  switch (inventoryStatus.toLowerCase()) {
    case 'instock':
      return 'success';
    case 'lowstock':
      return 'warning';
    case 'outofstock':
      return 'danger';
    default:
      return 'info';
  }
};

const supprimerInstitution = (institutionId) => {
  if (!institutionId) {
    alert("ID de l'institution est manquant ou incorrect.");
    return;
  }

  if (window.confirm("Êtes-vous sûr de vouloir supprimer cette institution ?")) {
    const instRef = dbRef(db, 'institutions/' + institutionId);
    remove(instRef)
      .then(() => {
        alert("L'institution a été supprimée avec succès.");
        // Reload institutions data
        const institutionsRef = dbRef(db, 'institutions/');
        onValue(institutionsRef, (snapshot) => {
          const data = snapshot.val();
          institutions.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
          loading.value = false;
        });
      })
      .catch((error) => {
        console.error("Erreur lors de la suppression de l'institution:", error);
        alert("Une erreur est survenue lors de la suppression de l'institution.");
      });
  }
};
</script>

<template>
  <Navbar />
  <div class="layout-container">
    <AppSidebar class="layout-sidebar" />
    <div class="layout-content-wrapper">
      <AppTopbar />
      <div class="layout">
        <div class="grid">
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Places de stages</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-4xl font-bold text-900">120</span>
                  <div class="text-green-500">
                    <span class="font-medium">+12%</span>
                    <i class="pi pi-arrow-up text-xs ml-2"></i>
                  </div>
                </div>
                <div class="w-6">
                  <svg width="100%" viewBox="0 0 258 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1 93.9506L4.5641 94.3162C8.12821 94.6817 15.2564 95.4128 22.3846 89.6451C29.5128 83.8774 36.641 71.6109 43.7692 64.4063C50.8974 57.2018 58.0256 55.0592 65.1538 58.9268C72.2821 62.7945 79.4103 72.6725 86.5385 73.5441C93.6667 74.4157 100.795 66.2809 107.923 65.9287C115.051 65.5765 122.179 73.0068 129.308 66.8232C136.436 60.6396 143.564 40.8422 150.692 27.9257C157.821 15.0093 164.949 8.97393 172.077 6.43766C179.205 3.9014 186.333 4.86425 193.462 12.0629C200.59 19.2616 207.718 32.696 214.846 31.0487C221.974 29.4014 229.103 12.6723 236.231 5.64525C243.359 -1.38178 250.487 1.29325 254.051 2.63076L257.615 3.96827"
                      :style="{ strokeWidth: '2px', stroke: 'var(--primary-color)' }"
                      stroke="10"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Similar card components for Revenue, Visitors, and Stock -->
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Institutions</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-4xl font-bold text-900">$4500</span>
                  <div class="text-green-500">
                    <span class="font-medium">+20%</span>
                    <i class="pi pi-arrow-up text-xs ml-2"></i>
                  </div>
                </div>
                <div class="w-6">
                  <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1 35.6498L2.24444 32.4319C3.48889 29.214 5.97778 22.7782 8.46667 20.3627C10.9556 17.9473 13.4444 19.5522 15.9333 21.7663C18.4222 23.9803 20.9111 26.8035 23.4 30.6606C25.8889 34.5176 28.3778 39.4085 30.8667 37.2137C33.3556 35.0189 35.8444 25.7383 38.3333 26.3765C40.8222 27.0146 43.3111 37.5714 45.8 38.9013C48.2889 40.2311 50.7778 32.3341 53.2667 31.692C55.7556 31.0499 58.2444 37.6628 60.7333 39.4617C63.2222 41.2607 65.7111 38.2458 68.2 34.9205C70.6889 31.5953 73.1778 27.9597 75.6667 23.5955C78.1556 19.2313 80.6444 14.1385 83.1333 13.8875C85.6222 13.6365 88.1111 18.2272 90.6 20.2425C93.0889 22.2578 95.5778 21.6977 98.0667 18.8159C100.556 15.9341 103.044 10.7306 105.533 7.37432C108.022 4.01806 110.511 2.50903 111.756 1.75451L113 1"
                      :style="{ strokeWidth: '1px', stroke: 'var(--primary-color)' }"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Élèves</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-4xl font-bold text-900">360</span>
                  <div class="text-pink-500">
                    <span class="font-medium">+24%</span>
                    <i class="pi pi-arrow-down text-xs ml-2"></i>
                  </div>
                </div>
                <div class="w-6">
                  <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1.5 1L2.74444 2.61495C3.98889 4.2299 6.47778 7.4598 8.96667 9.07151C11.4556 10.6832 13.9444 10.6767 16.4333 11.6127C18.9222 12.5487 21.4111 14.4271 23.9 16.6724C26.3889 18.9178 28.8778 21.5301 31.3667 20.1977C33.8556 18.8652 36.3444 13.5878 38.8333 11.3638C41.3222 9.13969 43.8111 9.96891 46.3 11.9894C48.7889 14.0099 51.2778 17.2217 53.7667 16.2045C56.2556 15.1873 58.7444 9.9412 61.2333 11.2783C63.7222 12.6155 66.2111 20.5359 68.7 21.4684C71.1889 22.401 73.6778 16.3458 76.1667 16.0009C78.6556 15.6561 81.1444 21.0217 83.6333 24.2684C86.1222 27.515 88.6111 28.6428 91.1 27.4369C93.5889 26.2311 96.0778 22.6916 98.5667 22.7117C101.056 22.7317 103.544 26.3112 106.033 29.7859C108.522 33.2605 111.011 36.6302 112.256 38.3151L113.5 40"
                      :style="{ strokeWidth: '1px', stroke: 'var(--pink-500)' }"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Formateurs</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-4xl font-bold text-900">164</span>
                  <div class="text-green-500">
                    <span class="font-medium">+30%</span>
                    <i class="pi pi-arrow-up text-xs ml-2"></i>
                  </div>
                </div>
                <div class="w-6 text-right">
                  <Knob v-model="knobValue" valueTemplate="90%" readonly :strokeWidth="2" :size="90"
                        class="-mt-5"></Knob>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue Overview Chart -->
          <div class="col-12 xl:col-9">
            <div class="card h-full">
              <div class="flex align-items-start justify-content-between mb-6">
                <span class="text-900 text-xl font-semibold">Stats PFP</span>
                <Dropdown :options="weeks" v-model="selectedWeek" class="w-10rem" optionLabel="label"
                          @change="onWeekChange"></Dropdown>
              </div>
              <Chart type="bar" :height="300" :data="barData" :options="barOptions"></Chart>
            </div>
          </div>

          <!-- Sales by Category Chart -->
          <div class="col-12 xl:col-3">
            <div class="card h-full">
              <div class="text-900 text-xl font-semibold mb-6">Stats PFP1A</div>
              <Chart type="pie" :data="pieData" :height="300" :options="pieOptions"></Chart>
            </div>
          </div>

          <!-- Institutions Table -->
          <div class="col-12 lg:col-6">
            <div class="card">
              <div class="flex flex-column md:flex-row md:align-items-start md:justify-content-between mb-3">
                <div class="text-900 text-xl font-semibold mb-3 md:mb-0">Institutions</div>
              </div>
              <DataTable ref="salesTableRef" :value="filteredInstitutions" dataKey="id" paginator :rows="10"
                         responsiveLayout="scroll" v-model:filters="filters" filterDisplay="menu" :loading="loading"
                         :globalFilterFields="['Name', 'Street', 'Lieu', 'Canton', 'URL']" showGridlines>
                <template #header>
                  <div class="flex justify-content-between flex-column sm:flex-row">
                    <IconField iconPosition="left">
                      <InputIcon class="pi pi-search" />
                      <InputText v-model="globalFilter" placeholder="Recherche" style="width: 100%" />
                    </IconField>
                  </div>
                </template>
                <template #empty> Aucun institution trouvée.</template>
                <template #loading> Chargement des données des institutions. Veuillez patienter.</template>
                <Column field="Name" header="Nom de l'institution" style="min-width: 12rem" class="text-center">
                  <template #body="{ data }">
                    {{ data.Name }}
                  </template>
                  <template #filter="{ filterModel }">
                    <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                               placeholder="Rechercher par nom" />
                  </template>
                </Column>
                <Column field="Street" header="Rue" style="min-width: 12rem" class="text-center">
                  <template #body="{ data }">
                    {{ data.Street }}
                  </template>
                  <template #filter="{ filterModel }">
                    <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                               placeholder="Rechercher par rue" />
                  </template>
                </Column>
                <Column field="Lieu" header="Lieu" style="min-width: 12rem" class="text-center">
                  <template #body="{ data }">
                    {{ data.Lieu }}
                  </template>
                  <template #filter="{ filterModel }">
                    <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                               placeholder="Rechercher par lieu" />
                  </template>
                </Column>
                <Column field="Canton" header="Canton" style="min-width: 12rem" class="text-center">
                  <template #body="{ data }">
                    {{ data.Canton }}
                  </template>
                  <template #filter="{ filterModel }">
                    <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                               placeholder="Rechercher par canton" />
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>

          <!-- Top Students List -->
          <div class="col-12 lg:col-6">
            <div class="card h-full">
              <div class="text-900 text-xl font-semibold mb-3">Étudiants</div>
              <ul class="list-none p-0 m-0">

                <DataTable
                  :value="filteredEtudiants"
                  :paginator="true"
                  :rows="10"
                  dataKey="id"
                  :rowHover="true"
                  v-model:filters="filters"
                  filterDisplay="menu"
                  :loading="loading"
                  :globalFilterFields="['Nom', 'Prenom', 'Classe', 'responsableDeStage', 'Email']"
                  showGridlines
                >
                  <template #header>
                    <div class="flex justify-content-between flex-column sm:flex-row">
                      <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="globalFilter" placeholder="Recherche" style="width: 100%" />
                      </IconField>
                    </div>
                  </template>
                  <template #empty> Aucun étudiants trouvés.</template>
                  <template #loading> Loading student data. Please wait.</template>
                  <Column field="Nom" header="Nom" style="min-width: 12rem" class="text-center">
                    <template #body="{ data }">
                      {{ data.Nom }}
                    </template>
                    <template #filter="{ filterModel }">
                      <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                                 placeholder="Search by name" />
                    </template>
                  </Column>
                  <Column field="Prenom" header="Prénom" style="min-width: 12rem" class="text-center">
                    <template #body="{ data }">
                      {{ data.Prenom }}
                    </template>
                    <template #filter="{ filterModel }">
                      <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                                 placeholder="Search by first name" />
                    </template>
                  </Column>
                  <Column field="Classe" header="Classe" style="min-width: 12rem" class="text-center">
                    <template #body="{ data }">
                      {{ data.Classe }}
                    </template>
                    <template #filter="{ filterModel }">
                      <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                                 placeholder="Search by class" />
                    </template>
                    <template #filterclear="{ filterCallback }">
                      <Button type="button" icon="pi pi-times" @click="filterCallback()" severity="secondary"></Button>
                    </template>
                    <template #filterapply="{ filterCallback }">
                      <Button type="button" icon="pi pi-check" @click="filterCallback()" severity="success"></Button>
                    </template>
                  </Column>
                  <Column field="responsableDeStage" header="Responsable de Stage" style="min-width: 12rem"
                          class="text-center">
                    <template #body="{ data }">
                      {{ data.responsableDeStage }}
                    </template>
                    <template #filter="{ filterModel }">
                      <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                                 placeholder="Search by supervisor" />
                    </template>
                  </Column>
                  <Column field="Email" header="E-Mail" style="min-width: 12rem">
                    <template #body="{ data }">
                      {{ data.Email }}
                    </template>
                    <template #filter="{ filterModel }">
                      <InputText type="text" v-model="filterModel.value" class="p-column-filter"
                                 placeholder="Search by email" />
                    </template>
                  </Column>
                  <Column field="SAE" header="SAE" style="min-width: 8rem" class="text-center">
                    <template #body="{ data }">
                      <input type="checkbox" :checked="data.SAE" disabled />
                    </template>
                    <template #filter="{ filterModel }">
                      <TriStateCheckbox v-model="filterModel.value" />
                    </template>
                  </Column>
                  <Column header="Action" style="min-width: 12rem" class="text-center">
                    <template #body="{ data }">
                      <Button label="Modifier" class="mb-2 mr-2" />
                      <Button label="Supprimer" class="mb-2 mr-2" @click="deleteStudent(data.id)" />
                    </template>
                  </Column>
                </DataTable>

              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh; /* Utiliser toute la hauteur de la vue */
}

.layout-sidebar {
  width: 280px; /* Largeur fixe pour la sidebar */
  background: var(--surface-b);
  overflow-y: auto; /* Permettre le défilement si le contenu dépasse la hauteur de l'écran */
  height: 100vh; /* Assurez-vous que la sidebar prend toute la hauteur de l'écran */
  position: fixed; /* Fixer la position de la sidebar */
}

.layout-content-wrapper {
  margin-left: 280px; /* Marge égale à la largeur de la sidebar */
  flex: 1;
  display: flex;
  flex-direction: column;
}

.layout-content {
  padding: 2rem;
  background: var(--surface-a);
  flex: 1;
  overflow-y: auto; /* Permettre le défilement du contenu */
}

.card {
  background: var(--surface-card);
  box-shadow: var(--shadow-2);
  border-radius: var(--border-radius);
  padding: 1.5rem;
}

.p-column-title {
  display: none;
}

@media screen and (max-width: 960px) {
  .p-column-title {
    display: inline;
    font-weight: bold;
    margin-right: 0.5rem;
  }
}
</style>