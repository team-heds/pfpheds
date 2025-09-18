<template>
  <Navbar />
  <div class="layout-container">
    <!-- Sidebar gauche (fixe) -->
    <AdminSidebar class="layout-sidebar" />
    <!-- Zone principale -->
    <div class="layout-content-wrapper">
      <div v-if="isDefaultDashboard">
        <div class="grid">
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

          <!-- institutions partenaires card -->
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Institutions partenaires</span>
              <div class="flex justify-content-between align-items-start mt-3">
                <div class="w-6">
                  <span class="text-6xl font-bold text-900">{{ totalInstitutions }}</span>
                </div>
                <div class="w-6">
                  <!-- SVG icon (optionnel) -->
                  <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1 35.6498L2.24444 32.4319C3.48889 29.214 5.97778 22.7782 8.46667 20.3627C11.4556 17.9473 13.9444 19.5522 15.9333 21.7663C18.4222 23.9803 20.9111 26.8035 23.4 30.6606C25.8889 34.5176 28.3778 39.4085 30.8667 37.2137C33.3556 35.0189 35.8444 25.7383 38.3333 26.3765C40.8222 27.0146 43.3111 37.5714 45.8 38.9013C48.2889 40.2311 50.7778 32.3341 53.2667 31.692C55.7556 31.0499 58.2444 37.6628 60.7333 39.4617C63.2222 41.2607 65.7111 38.2458 68.2 34.9205C70.6889 31.5953 73.1778 27.9597 75.6667 23.5955C78.1556 19.2313 80.6444 14.1385 83.1333 13.8875C85.6222 13.6365 88.1111 18.2272 90.6 20.2425C93.0889 22.2578 95.5778 21.6977 98.0667 18.8159C100.556 15.9341 103.044 10.7306 105.533 7.37432C108.022 4.01806 110.511 2.50903 111.756 1.75451L113 1"
                      :style="{ strokeWidth: '1px', stroke: 'var(--primary-color)' }"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Étudiants card -->
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Étudiants</span>
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

          <!-- Praticiens Formateurs card -->
          <div class="col-12 md:col-6 xl:col-3">
            <div class="card h-full">
              <span class="font-semibold text-lg">Praticiens Formateurs</span>
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

          <!-- Section Gamification -->
          <div class="col-12">
            <div class="card">
              <div class="flex align-items-center justify-content-between mb-4">
                <span class="text-900 text-xl font-semibold">
                  <i class="pi pi-trophy mr-2" style="color: var(--primary-color)"></i>
                  Système de Gamification
                </span>
                <div class="flex align-items-center gap-2 px-3 py-2 border-round-3xl font-semibold text-white text-sm" 
                     :class="getRoleBadgeClass(currentUserRole)" v-if="currentUserRole">
                  <i :class="getRoleIcon(currentUserRole)"></i>
                  <span>{{ getRoleName(currentUserRole) }}</span>
                </div>
              </div>

              <!-- Statistiques Gamification -->
              <div class="grid mb-4">
                <div class="col-12 md:col-3">
                  <div class="surface-card p-4 border-round shadow-2 h-full flex align-items-center gap-3 hover:shadow-4 transition-all transition-duration-200">
                    <div class="w-4rem h-4rem border-round flex align-items-center justify-content-center text-white text-xl" style="background-color: #2E8B57;">
                      <i class="pi pi-trophy"></i>
                    </div>
                    <div class="flex-1">
                      <div class="text-900 font-bold text-2xl m-0">{{ gamificationStats.challenges?.total || 0 }}</div>
                      <div class="text-600 font-medium mb-1">Défis Totaux</div>
                      <div class="text-500 text-sm">{{ gamificationStats.challenges?.active || 0 }} actifs</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 md:col-3">
                  <div class="surface-card p-4 border-round shadow-2 h-full flex align-items-center gap-3 hover:shadow-4 transition-all transition-duration-200">
                    <div class="w-4rem h-4rem border-round flex align-items-center justify-content-center text-white text-xl" style="background-color: #4169E1;">
                      <i class="pi pi-flag"></i>
                    </div>
                    <div class="flex-1">
                      <div class="text-900 font-bold text-2xl m-0">{{ gamificationStats.quests?.total || 0 }}</div>
                      <div class="text-600 font-medium mb-1">Quêtes Totales</div>
                      <div class="text-500 text-sm">{{ gamificationStats.quests?.active || 0 }} actives</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 md:col-3">
                  <div class="surface-card p-4 border-round shadow-2 h-full flex align-items-center gap-3 hover:shadow-4 transition-all transition-duration-200">
                    <div class="w-4rem h-4rem border-round flex align-items-center justify-content-center text-white text-xl" style="background-color: #DC143C;">
                      <i class="pi pi-star"></i>
                    </div>
                    <div class="flex-1">
                      <div class="text-900 font-bold text-2xl m-0">{{ gamificationStats.badges?.total || 0 }}</div>
                      <div class="text-600 font-medium mb-1">Badges Totaux</div>
                      <div class="text-500 text-sm">{{ gamificationStats.badges?.unlocked || 0 }} débloqués</div>
                    </div>
                  </div>
                </div>

                <div class="col-12 md:col-3">
                  <div class="surface-card p-4 border-round shadow-2 h-full flex align-items-center gap-3 hover:shadow-4 transition-all transition-duration-200">
                    <div class="w-4rem h-4rem border-round flex align-items-center justify-content-center text-white text-xl" style="background-color: #FFD700;">
                      <i class="pi pi-users"></i>
                    </div>
                    <div class="flex-1">
                      <div class="text-900 font-bold text-2xl m-0">{{ gamificationStats.users?.active || 0 }}</div>
                      <div class="text-600 font-medium mb-1">Utilisateurs Actifs</div>
                      <div class="text-500 text-sm">7 derniers jours</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions Rapides Gamification -->
              <div class="grid">
                <div class="col-12 md:col-4" v-if="hasPermission('CREATE_CHALLENGES')">
                  <div class="surface-card p-4 border-round shadow-2 cursor-pointer transition-all transition-duration-300 hover:shadow-4 hover:surface-hover h-full flex flex-column gap-3" 
                       @click="navigateToGamification('/admin/challenges')">
                    <div class="w-3rem h-3rem border-round flex align-items-center justify-content-center text-white" style="background-color: #2E8B57;">
                      <i class="pi pi-trophy text-lg"></i>
                    </div>
                    <h4 class="text-900 font-semibold text-lg m-0">Gérer les Défis</h4>
                    <p class="text-600 line-height-3 m-0 flex-1">Créer, modifier et supprimer des défis</p>
                    <Button 
                      label="Accéder" 
                      icon="pi pi-arrow-right" 
                      class="p-button-sm p-button-outlined w-full"
                    />
                  </div>
                </div>

                <div class="col-12 md:col-4" v-if="hasPermission('CREATE_QUESTS')">
                  <div class="surface-card p-4 border-round shadow-2 cursor-pointer transition-all transition-duration-300 hover:shadow-4 hover:surface-hover h-full flex flex-column gap-3" 
                       @click="navigateToGamification('/admin/quests')">
                    <div class="w-3rem h-3rem border-round flex align-items-center justify-content-center text-white" style="background-color: #4169E1;">
                      <i class="pi pi-flag text-lg"></i>
                    </div>
                    <h4 class="text-900 font-semibold text-lg m-0">Gérer les Quêtes</h4>
                    <p class="text-600 line-height-3 m-0 flex-1">Créer, modifier et supprimer des quêtes</p>
                    <Button 
                      label="Accéder" 
                      icon="pi pi-arrow-right" 
                      class="p-button-sm p-button-outlined w-full"
                    />
                  </div>
                </div>

                <div class="col-12 md:col-4" v-if="hasPermission('CREATE_BADGES')">
                  <div class="surface-card p-4 border-round shadow-2 cursor-pointer transition-all transition-duration-300 hover:shadow-4 hover:surface-hover h-full flex flex-column gap-3" 
                       @click="navigateToGamification('/admin/badges')">
                    <div class="w-3rem h-3rem border-round flex align-items-center justify-content-center text-white" style="background-color: #DC143C;">
                      <i class="pi pi-star text-lg"></i>
                    </div>
                    <h4 class="text-900 font-semibold text-lg m-0">Gérer les Badges</h4>
                    <p class="text-600 line-height-3 m-0 flex-1">Créer, modifier et supprimer des badges</p>
                    <Button 
                      label="Accéder" 
                      icon="pi pi-arrow-right" 
                      class="p-button-sm p-button-outlined w-full"
                    />
                  </div>
                </div>

                <div class="col-12 md:col-4" v-if="hasPermission('MANAGE_USERS')">
                  <div class="surface-card p-4 border-round shadow-2 cursor-pointer transition-all transition-duration-300 hover:shadow-4 hover:surface-hover h-full flex flex-column gap-3" 
                       @click="navigateToGamification('/admin/users')">
                    <div class="w-3rem h-3rem border-round flex align-items-center justify-content-center text-white" style="background-color: #FFD700;">
                      <i class="pi pi-users text-lg"></i>
                    </div>
                    <h4 class="text-900 font-semibold text-lg m-0">Gérer les Utilisateurs</h4>
                    <p class="text-600 line-height-3 m-0 flex-1">Attribuer des rôles et permissions</p>
                    <Button 
                      label="Accéder" 
                      icon="pi pi-arrow-right" 
                      class="p-button-sm p-button-outlined w-full"
                    />
                  </div>
                </div>

                <div class="col-12 md:col-4" v-if="hasPermission('MANAGE_HOUSES')">
                  <div class="surface-card p-4 border-round shadow-2 cursor-pointer transition-all transition-duration-300 hover:shadow-4 hover:surface-hover h-full flex flex-column gap-3" 
                       @click="navigateToGamification('/admin/houses')">
                    <div class="w-3rem h-3rem border-round flex align-items-center justify-content-center text-white bg-blue-500">
                      <i class="pi pi-home text-lg"></i>
                    </div>
                    <h4 class="text-900 font-semibold text-lg m-0">Gérer les Maisons</h4>
                    <p class="text-600 line-height-3 m-0 flex-1">Points des maisons et statistiques</p>
                    <Button 
                      label="Accéder" 
                      icon="pi pi-arrow-right" 
                      class="p-button-sm p-button-outlined w-full"
                    />
                  </div>
                </div>

                <div class="col-12 md:col-4" v-if="hasPermission('VIEW_ANALYTICS')">
                  <div class="surface-card p-4 border-round shadow-2 cursor-pointer transition-all transition-duration-300 hover:shadow-4 hover:surface-hover h-full flex flex-column gap-3" 
                       @click="navigateToGamification('/admin/analytics')">
                    <div class="w-3rem h-3rem border-round flex align-items-center justify-content-center text-white bg-indigo-500">
                      <i class="pi pi-chart-line text-lg"></i>
                    </div>
                    <h4 class="text-900 font-semibold text-lg m-0">Analytics</h4>
                    <p class="text-600 line-height-3 m-0 flex-1">Statistiques détaillées et rapports</p>
                    <Button 
                      label="Accéder" 
                      icon="pi pi-arrow-right" 
                      class="p-button-sm p-button-outlined w-full"
                    />
                  </div>
                </div>
              </div>

              <!-- Activité Récente -->
              <div class="mt-4" v-if="recentGamificationLogs.length > 0">
                <h4 class="text-900 mb-3 font-semibold">Activité Récente - Gamification</h4>
                <div class="flex flex-column gap-3">
                  <div 
                    v-for="log in recentGamificationLogs.slice(0, 5)" 
                    :key="log.id"
                    class="flex align-items-center gap-3 p-3 border-round surface-50 border-left-3 border-primary"
                  >
                    <div class="w-2rem h-2rem border-round bg-primary flex align-items-center justify-content-center text-white">
                      <i :class="getActionIcon(log.action)"></i>
                    </div>
                    <div class="flex-1">
                      <p class="text-900 font-medium m-0 mb-1">
                        {{ getActionDescription(log.action, log.targetId) }}
                      </p>
                      <span class="text-600 text-sm">
                        {{ formatTime(log.timestamp) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Carte pour le Line Chart (Offre en formation) -->
          <div class="col-12 xl:col-9">
            <div class="card h-full">
              <div class="flex align-items-start justify-content-between mb-6">
                <span class="text-900 text-xl font-semibold">Offre en formation</span>
              </div>
              <Chart type="line" :data="lineData" :options="lineOptions" :height="300" />
            </div>
          </div>

          <!-- Graphique Pie Chart pour les Statistiques PFP1A -->
          <div class="col-12 xl:col-3">
            <div class="card h-full">
              <div class="text-900 text-xl font-semibold mb-6">Nombres d'étudiants par volée</div>
              <Chart type="pie" :data="pieData" :height="300" :options="pieOptions"></Chart>
            </div>
          </div>
        </div>
      </div>
      <!-- Si l'utilisateur navigue via les liens de la sidebar, le composant enfant est injecté ici -->
      <div v-else>
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import { useLayout } from '@/layout/composables/layout';
import { useRoute, useRouter } from 'vue-router';
import AdminSidebar from '@/components/admin/lists/AdminSidebar.vue';
import Navbar from '@/components/common/utils/Navbar.vue';
import Chart from 'primevue/chart';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import { db } from '../../../firebase';
import { ref as dbRef, onValue } from "firebase/database";
import { getAuth } from 'firebase/auth';
import AppSidebar from '@/layout/AppSidebar.vue'
import adminService from '../../service/adminService';
import rolesService, { ROLES, PERMISSIONS } from '../../service/rolesService';

const { layoutConfig } = useLayout();
const router = useRouter();
const auth = getAuth();

const totalPlaces = ref(0);
const totalInstitutions = ref(0);
const totalStudents = ref(0);
const totalFormateurs = ref(0);

// Gamification data
const gamificationStats = ref({});
const recentGamificationLogs = ref([]);
const currentUserRole = ref('');
const userPermissions = ref([]);

const pieOptions = ref({});
const barOptions = ref({});
const barData = ref({});
const pieData = ref({});

const lineData = ref({});
const lineOptions = ref({});

const institutions = ref([]);
const institutionsLoading = ref(true);

const students = ref([]);
const studentsLoading = ref(true);

const formateurs = ref([]);

const setChartData = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--text-color').trim();
  const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary').trim();
  const surfaceBorder = documentStyle.getPropertyValue('--surface-border').trim();

  // Pie chart : répartition par catégorie (exemple basé sur la propriété "Classe" des étudiants)
  const categoryCounts = {};
  students.value.forEach(inst => {
    const category = inst.Classe || 'Non spécifié';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
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
        ],
        hoverBackgroundColor: [
          documentStyle.getPropertyValue('--primary-600').trim(),
          documentStyle.getPropertyValue('--primary-300').trim(),
          documentStyle.getPropertyValue('--primary-200').trim(),
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

  // Bar chart : Totaux PFP (exemple)
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

  // Line chart : Évolution des étudiants (exemple)
  const monthlyStudentCounts = [
    { month: 'PFP1A', count: 32 },
    { month: 'PFP1B', count: 32 },
    { month: 'PFP2', count: 61 },
    { month: 'PFP3', count: 59 },
    { month: 'PFP4', count: 59 },
  ];

  const monthlyStudent = [
    { month: 'PFP1A', count: 42 },
    { month: 'PFP1B', count: 39 },
    { month: 'PFP2', count: 64 },
    { month: 'PFP3', count: 60 },
    { month: 'PFP4', count: 60 },
  ];

  lineData.value = {
    labels: monthlyStudentCounts.map(entry => entry.month),
    datasets: [
      {
        label: "Nombre de places utilisées",
        data: monthlyStudentCounts.map(entry => entry.count),
        fill: false,
        borderColor: documentStyle.getPropertyValue('--primary-500').trim(),
        tension: 0.4,
        pointBackgroundColor: documentStyle.getPropertyValue('--primary-500').trim(),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: documentStyle.getPropertyValue('--primary-500').trim(),
      },
      {
        label: "Nombre de places proposées",
        data: monthlyStudent.map(entry => entry.count),
        fill: false,
        borderColor: documentStyle.getPropertyValue('--info-500').trim(),
        tension: 0.4,
        pointBackgroundColor: documentStyle.getPropertyValue('--info-500').trim(),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: documentStyle.getPropertyValue('--info-500').trim(),
      }
    ]
  };

  lineOptions.value = {
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

onMounted(async () => {
  // institutions
  const institutionsRef = dbRef(db, 'institutions/');
  onValue(institutionsRef, (snapshot) => {
    const data = snapshot.val();
    institutions.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    totalInstitutions.value = institutions.value.length;
    institutionsLoading.value = false;
    setChartData();
  });

  // Étudiants
  const studentsRef = dbRef(db, 'Students/');
  onValue(studentsRef, (snapshot) => {
    const data = snapshot.val();
    students.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    totalStudents.value = students.value.length;
    studentsLoading.value = false;
    setChartData();
  });

  // Places de stages
  const placesRef = dbRef(db, 'Places/');
  onValue(placesRef, (snapshot) => {
    const data = snapshot.val();
    totalPlaces.value = data ? Object.keys(data).length : 0;
    setChartData();
  });

  // Praticiens Formateurs
  const formateursRef = dbRef(db, 'PraticienFormateurs/');
  onValue(formateursRef, (snapshot) => {
    const data = snapshot.val();
    formateurs.value = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    totalFormateurs.value = formateurs.value.length;
    setChartData();
  });

  setChartData();
  
  // Charger les données de gamification
  await loadGamificationData();
});

watch([institutions, students, totalPlaces, totalFormateurs], () => {
  setChartData();
}, { immediate: true });

const onWeekChange = () => {
  setChartData();
};

const route = useRoute();
const isDefaultDashboard = computed(() => route.path === '/admin' || route.path === '/admin/');

// Gamification computed properties
const hasPermission = computed(() => {
  return (permission) => {
    return userPermissions.value.includes(PERMISSIONS[permission])
  }
});

// Gamification methods
const loadGamificationData = async () => {
  try {
    if (!auth.currentUser) return;
    
    // Charger les données en parallèle
    const [statsData, logsData, userRole, permissions] = await Promise.all([
      adminService.getGeneralStats(),
      rolesService.getAdminLogs(10),
      rolesService.getUserRole(auth.currentUser.uid),
      rolesService.getUserPermissions(auth.currentUser.uid)
    ]);
    
    gamificationStats.value = statsData || {};
    recentGamificationLogs.value = logsData || [];
    currentUserRole.value = userRole;
    userPermissions.value = permissions;
    
  } catch (error) {
    console.error('Erreur lors du chargement des données gamification:', error);
  }
};

const navigateToGamification = (path) => {
  router.push(path);
};

const getRoleName = (role) => {
  const roleNames = {
    [ROLES.GAME_MASTER]: 'Maître du Jeu',
    [ROLES.HOUSE_COACH]: 'Coach de Maison',
    [ROLES.PROFESSOR]: 'Professeur',
    [ROLES.ADMIN]: 'Administrateur',
    [ROLES.STUDENT]: 'Étudiant'
  };
  return roleNames[role] || 'Inconnu';
};

const getRoleIcon = (role) => {
  const roleIcons = {
    [ROLES.GAME_MASTER]: 'pi pi-crown',
    [ROLES.HOUSE_COACH]: 'pi pi-shield',
    [ROLES.PROFESSOR]: 'pi pi-graduation-cap',
    [ROLES.ADMIN]: 'pi pi-cog',
    [ROLES.STUDENT]: 'pi pi-user'
  };
  return roleIcons[role] || 'pi pi-user';
};

const getRoleBadgeClass = (role) => {
  const roleClasses = {
    [ROLES.GAME_MASTER]: 'bg-purple-500',
    [ROLES.HOUSE_COACH]: 'bg-green-500',
    [ROLES.PROFESSOR]: 'bg-blue-500',
    [ROLES.ADMIN]: 'bg-red-500',
    [ROLES.STUDENT]: 'bg-gray-500'
  };
  return roleClasses[role] || 'bg-gray-500';
};

const getActionIcon = (action) => {
  const actionIcons = {
    create_challenge: 'pi pi-plus-circle',
    update_challenge: 'pi pi-pencil',
    delete_challenge: 'pi pi-trash',
    create_quest: 'pi pi-plus-circle',
    update_quest: 'pi pi-pencil',
    delete_quest: 'pi pi-trash',
    create_badge: 'pi pi-plus-circle',
    update_badge: 'pi pi-pencil',
    delete_badge: 'pi pi-trash',
    role_change: 'pi pi-user-edit'
  };
  return actionIcons[action] || 'pi pi-info-circle';
};

const getActionDescription = (action, targetId) => {
  const descriptions = {
    create_challenge: `Nouveau défi créé (${targetId})`,
    update_challenge: `Défi modifié (${targetId})`,
    delete_challenge: `Défi supprimé (${targetId})`,
    create_quest: `Nouvelle quête créée (${targetId})`,
    update_quest: `Quête modifiée (${targetId})`,
    delete_quest: `Quête supprimée (${targetId})`,
    create_badge: `Nouveau badge créé (${targetId})`,
    update_badge: `Badge modifié (${targetId})`,
    delete_badge: `Badge supprimé (${targetId})`,
    role_change: `Rôle utilisateur modifié (${targetId})`
  };
  return descriptions[action] || `Action ${action} sur ${targetId}`;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
};
</script>

<style scoped>
/* Layout styles - utilisant PrimeVue au maximum */
.layout-container {
  display: flex;
  align-items: flex-start;
  height: auto;
  overflow: auto;
}

.layout-sidebar {
  width: 280px;
  background: var(--surface-b);
  overflow-y: auto;
  height: auto;
  position: fixed;
  margin-left: 4rem;
}

.layout-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  justify-content: flex-start;
  max-width: none;
  min-width: 0;
  min-height: 100vh;
  margin-left: 4rem;
}
</style>
