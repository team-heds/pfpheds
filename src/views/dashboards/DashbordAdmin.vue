<template>
  <Navbar />
  <div class="layout-container">
    <AppSidebar class="layout-sidebar" />
    <div class="layout-content-wrapper">
      <div class="">
        <div class="grid">
          <!-- Cartes de Statistiques -->

          <!-- Places de stages card -->
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Places de stages</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-6xl font-bold text-900">{{ totalPlaces }}</span>

                </div>
                <div class="w-6">
                  <!-- SVG icon (optionnel) -->
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

          <!-- Institutions card -->
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Institutions</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-6xl font-bold text-900">{{ totalInstitutions }}</span>
                </div>
                <div class="w-6">
                  <!-- SVG icon (optionnel) -->
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

          <!-- Élèves card -->
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Élèves</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-6xl font-bold text-900">{{ totalStudents }}</span>
                </div>
                <div class="w-6">
                  <!-- SVG icon (optionnel) -->
                  <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1.5 1L2.74444 2.61495C3.98889 4.2299 6.47778 7.4598 8.96667 9.07151C11.4556 10.6832 13.9444 10.6767 16.4333 11.6127C18.9222 12.5487 21.4111 14.4271 23.9 16.6724C26.3889 18.9178 28.8778 21.5301 31.3667 20.1977C33.8556 18.8652 36.3444 13.5878 38.8333 11.3638C41.3222 9.13969 43.8111 9.96891 46.3 11.9894C48.7889 14.0099 51.2778 17.2217 53.7667 16.2045C56.2556 15.1873 58.7444 9.9412 61.2333 11.2783C63.7222 12.6155 66.2111 20.5359 68.7 21.4684C71.1889 22.401 73.6778 16.3458 76.1667 16.0009C78.6556 15.6561 81.1444 21.0217 83.6333 24.2684C86.1222 27.515 88.6111 28.6428 91.1 27.4369C93.5889 26.2311 96.0778 22.6916 98.5667 22.7117C101.056 22.7317 103.544 26.3112 106.033 29.7859C108.522 33.2605 111.011 36.6302 112.256 38.3151L113.5 40"
                      :style="{ strokeWidth: '1px', stroke: 'var(--primary-color)' }"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Formateurs card -->
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Formateurs</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-6xl font-bold text-900">{{ totalFormateurs }}</span>

                </div>
                <div class="w-6">
                  <!-- SVG icon (optionnel) -->
                  <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1.5 1L2.74444 2.61495C3.98889 4.2299 6.47778 7.4598 8.96667 9.07151C11.4556 10.6832 13.9444 10.6767 16.4333 11.6127C18.9222 12.5487 21.4111 14.4271 23.9 16.6724C26.3889 18.9178 28.8778 21.5301 31.3667 20.1977C33.8556 18.8652 36.3444 13.5878 38.8333 11.3638C41.3222 9.13969 43.8111 9.96891 46.3 11.9894C48.7889 14.0099 51.2778 17.2217 53.7667 16.2045C56.2556 15.1873 58.7444 9.9412 61.2333 11.2783C63.7222 12.6155 66.2111 20.5359 68.7 21.4684C71.1889 22.401 73.6778 16.3458 76.1667 16.0009C78.6556 15.6561 81.1444 21.0217 83.6333 24.2684C86.1222 27.515 88.6111 28.6428 91.1 27.4369C93.5889 26.2311 96.0778 22.6916 98.5667 22.7117C101.056 22.7317 103.544 26.3112 106.033 29.7859C108.522 33.2605 111.011 36.6302 112.256 38.3151L113.5 40"
                      :style="{ strokeWidth: '1px', stroke: 'var(--primary-color)' }"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Graphique Bar Chart pour les Stats PFP -->
          <div class="col-12 xl:col-9">
            <div class="card h-full">
              <div class="flex align-items-start justify-content-between mb-6">
                <span class="text-900 text-xl font-semibold">Stats PFP</span>
                <Dropdown :options="weeks" v-model="selectedWeek" class="w-10rem" optionLabel="label" @change="onWeekChange"></Dropdown>
              </div>
              <Chart type="bar" :height="300" :data="barData" :options="barOptions"></Chart>
            </div>
          </div>

          <!-- Graphique Pie Chart pour les Stats PFP1A -->
          <div class="col-12 xl:col-3">
            <div class="card h-full">
              <div class="text-900 text-xl font-semibold mb-6">Stats Institutions PFP1A</div>
              <Chart type="pie" :data="pieData" :height="300" :options="pieOptions"></Chart>
            </div>
          </div>


        </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useLayout } from '@/layout/composables/layout';
import AppSidebar from '@/layout/AppSidebar.vue';
import Navbar from '@/components/Utils/Navbar.vue';

// PrimeVue components
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';

// Firebase
import { db } from '../../../firebase.js';
import { ref as dbRef, onValue, remove } from "firebase/database";

// Layout configuration and reactive state
const { layoutConfig } = useLayout();

// Statistiques
const totalPlaces = ref(0);
const totalInstitutions = ref(0);
const totalStudents = ref(0);
const totalFormateurs = ref(0);

// Chart data and options
const pieOptions = ref({});
const barOptions = ref({});
const barData = ref({});
const pieData = ref({});

// DataTables
const institutionsTableRef = ref(null);
const studentsTableRef = ref(null);
const filterInstitutionsTable = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const filterStudentsTable = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Institutions data
const institutions = ref([]);
const institutionsFilters = ref({});
const institutionsLoading = ref(true);
const institutionsGlobalFilter = ref('');

// Students data
const students = ref([]);
const studentsFilters = ref({});
const studentsLoading = ref(true);
const studentsGlobalFilter = ref('');

// Formateurs data (PraticienFormateurs)
const formateurs = ref([]);

// Charts
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

// Knob value
const knobValue = ref(90);

// Récupération des données depuis Firebase
onMounted(() => {
  // Fetch institutions
  const institutionsRef = dbRef(db, 'Institutions/');
  onValue(institutionsRef, (snapshot) => {
    const data = snapshot.val();
    institutions.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    totalInstitutions.value = institutions.value.length;
    console.log('Institutions:', institutions.value);
    institutionsLoading.value = false;

    // Mettre à jour les graphiques après la récupération des institutions
    setChartData();
  });

  // Fetch students
  const studentsRef = dbRef(db, 'Students/');
  onValue(studentsRef, (snapshot) => {
    const data = snapshot.val();
    students.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    totalStudents.value = students.value.length;
    console.log('Students:', students.value);
    studentsLoading.value = false;

    // Mettre à jour les graphiques après la récupération des étudiants
    setChartData();
  });

  // Fetch places
  const placesRef = dbRef(db, 'Places/');
  onValue(placesRef, (snapshot) => {
    const data = snapshot.val();
    totalPlaces.value = data ? Object.keys(data).length : 0;
    console.log('Total Places:', totalPlaces.value);

    // Mettre à jour les graphiques après la récupération des places
    setChartData();
  });

  // Fetch formateurs
  const formateursRef = dbRef(db, 'PraticienFormateurs/');
  onValue(formateursRef, (snapshot) => {
    const data = snapshot.val();
    formateurs.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    totalFormateurs.value = formateurs.value.length;
    console.log('Formateurs:', formateurs.value);

    // Mettre à jour les graphiques après la récupération des formateurs
    setChartData();
  });

  // Initialiser les données des graphiques
  setChartData();
});

// Fonction pour calculer et mettre à jour les données des graphiques
const setChartData = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color').trim();
  const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary').trim();
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border').trim();

  // Pie chart: Répartition des institutions par catégorie
  const categoryCounts = {};
  institutions.value.forEach(inst => {
    const category = inst.Category || 'Non spécifié';
    if (categoryCounts[category]) {
      categoryCounts[category] += 1;
    } else {
      categoryCounts[category] = 1;
    }
  });

  pieData.value = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.values(categoryCounts),
        backgroundColor: [
          documentStyle.getPropertyValue('--primary-700').trim(),
          documentStyle.getPropertyValue('--primary-400').trim(),
          documentStyle.getPropertyValue('--primary-100').trim(),
          // Ajoutez plus de couleurs si nécessaire
        ],
        hoverBackgroundColor: [
          documentStyle.getPropertyValue('--primary-600').trim(),
          documentStyle.getPropertyValue('--primary-300').trim(),
          documentStyle.getPropertyValue('--primary-200').trim(),
          // Ajoutez plus de couleurs si nécessaire
        ]
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

  // Bar chart: Totaux PFP
  const pfp1aCounts = institutions.value.reduce((acc, inst) => acc + (parseInt(inst.PFP1A) || 1), 0);
  const pfp1bCounts = institutions.value.reduce((acc, inst) => acc + (parseInt(inst.PFP1B) || 0.7), 0);
  const pfp2Counts = institutions.value.reduce((acc, inst) => acc + (parseInt(inst.PFP2) || 0.8), 0);
  const pfp4Counts = institutions.value.reduce((acc, inst) => acc + (parseInt(inst.PFP4) || 0.4), 0);
  const pfp3Counts = institutions.value.reduce((acc, inst) => acc + (parseInt(inst.PFP3) || 0.5), 0);

  barData.value = {
    labels: ['PFP2', 'PFP1A', 'PFP1B', 'PFP4', 'PFP3'],
    datasets: [
      {
        label: 'Total',
        backgroundColor: documentStyle.getPropertyValue('--primary-500').trim(),
        barThickness: 12,
        borderRadius: 12,
        data: [pfp2Counts, pfp1aCounts, pfp1bCounts, pfp4Counts, pfp3Counts]
      }
    ]
  };

  barOptions.value = {
    animation: { duration: 1 },
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

// Watchers pour mettre à jour les graphiques lorsque les données changent
watch([institutions, students, totalPlaces, totalFormateurs], () => {
  setChartData();
}, { immediate: true });

// Fonction pour changer la semaine (si nécessaire)
const onWeekChange = () => {
  // Logique pour mettre à jour les données du graphique en fonction de la semaine sélectionnée
  // Vous pouvez ajuster cette logique selon vos besoins spécifiques
  setChartData();
};

</script>

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
