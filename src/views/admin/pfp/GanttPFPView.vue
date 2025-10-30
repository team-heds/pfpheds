<template>
  <AdminLayout>
    <div class="gantt-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-chart-line text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Gantt PFP</h1>
              <p class="text-600 m-0 mt-1">Planning visuel des pratiques de formation professionnelle</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-print" label="Imprimer" outlined />
            <Button icon="pi pi-download" label="Exporter PDF" outlined />
            <Button icon="pi pi-refresh" @click="loadData" />
          </div>
        </div>
      </div>

      <!-- Filtres et contrôles -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid align-items-end">
          <div class="col-12 md:col-3">
            <label class="block mb-2 font-semibold">Année académique</label>
            <Dropdown v-model="selectedYear" :options="years" class="w-full" />
          </div>
          <div class="col-12 md:col-3">
            <label class="block mb-2 font-semibold">Type PFP</label>
            <Dropdown v-model="filterType" :options="typesPFP" placeholder="Tous" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <label class="block mb-2 font-semibold">Filière</label>
            <Dropdown v-model="filterFiliere" :options="filieres" placeholder="Toutes" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <label class="block mb-2 font-semibold">Vue</label>
            <SelectButton v-model="viewMode" :options="viewModes" optionLabel="label" optionValue="value" class="w-full" />
          </div>
        </div>
      </div>

      <!-- Statistiques rapides -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round">
            <div class="text-600 text-sm mb-1">PFP en cours</div>
            <div class="text-2xl font-bold text-blue-500">{{ stats.enCours }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round">
            <div class="text-600 text-sm mb-1">À venir</div>
            <div class="text-2xl font-bold text-orange-500">{{ stats.aVenir }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round">
            <div class="text-600 text-sm mb-1">Terminés</div>
            <div class="text-2xl font-bold text-green-500">{{ stats.termines }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round">
            <div class="text-600 text-sm mb-1">Conflits</div>
            <div class="text-2xl font-bold text-red-500">{{ stats.conflits }}</div>
          </div>
        </div>
      </div>

      <!-- Gantt Chart Area -->
      <div class="surface-card p-4 border-round shadow-2">
        <div class="gantt-header flex align-items-center justify-content-between mb-3">
          <h3 class="text-lg font-bold text-900 m-0">Planning {{ selectedYear }}</h3>
          <div class="flex gap-2">
            <Button icon="pi pi-chevron-left" text @click="previousPeriod" />
            <Button label="Aujourd'hui" text @click="goToToday" />
            <Button icon="pi pi-chevron-right" text @click="nextPeriod" />
          </div>
        </div>

        <!-- Timeline Header -->
        <div class="gantt-timeline mb-3">
          <div class="flex border-bottom-1 surface-border pb-2">
            <div class="timeline-header" style="width: 200px; min-width: 200px;">
              <span class="font-semibold">Étudiant / Institution</span>
            </div>
            <div class="timeline-months flex-1">
              <div class="grid">
                <div v-for="month in months" :key="month" class="col text-center text-sm font-semibold">
                  {{ month }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Gantt Rows -->
        <div class="gantt-body" v-if="!loading">
          <div v-for="item in ganttData" :key="item.id" class="gantt-row flex align-items-center mb-2 p-2 border-round hover:surface-hover">
            <div class="gantt-label" style="width: 200px; min-width: 200px;">
              <div class="font-semibold text-sm">{{ item.etudiant }}</div>
              <div class="text-xs text-600">{{ item.institution }}</div>
            </div>
            <div class="gantt-bars flex-1 position-relative" style="height: 40px;">
              <div 
                v-for="(bar, idx) in item.bars" 
                :key="idx"
                class="gantt-bar position-absolute border-round"
                :style="getBarStyle(bar)"
                @click="showBarDetails(bar)"
              >
                <div class="bar-content text-xs text-white px-2">
                  {{ bar.label }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else class="text-center p-6">
          <ProgressSpinner />
          <p class="text-600 mt-3">Chargement du planning...</p>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && ganttData.length === 0" class="text-center p-6">
          <i class="pi pi-calendar text-4xl text-400 mb-3"></i>
          <p class="text-600">Aucun PFP pour cette période</p>
        </div>
      </div>

      <!-- Légende -->
      <div class="surface-card p-3 border-round shadow-2 mt-4">
        <div class="flex align-items-center gap-4 flex-wrap">
          <span class="font-semibold">Légende:</span>
          <div class="flex align-items-center gap-2">
            <div class="legend-box" style="background: #3B82F6;"></div>
            <span class="text-sm">PFP1A</span>
          </div>
          <div class="flex align-items-center gap-2">
            <div class="legend-box" style="background: #10B981;"></div>
            <span class="text-sm">PFP1B</span>
          </div>
          <div class="flex align-items-center gap-2">
            <div class="legend-box" style="background: #F59E0B;"></div>
            <span class="text-sm">PFP2</span>
          </div>
          <div class="flex align-items-center gap-2">
            <div class="legend-box" style="background: #8B5CF6;"></div>
            <span class="text-sm">PFP3</span>
          </div>
          <div class="flex align-items-center gap-2">
            <div class="legend-box" style="background: #EF4444;"></div>
            <span class="text-sm">Conflit</span>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import ProgressSpinner from 'primevue/progressspinner'

const loading = ref(false)
const selectedYear = ref('2024-2025')
const filterType = ref(null)
const filterFiliere = ref(null)
const viewMode = ref('month')

const years = ref(['2023-2024', '2024-2025', '2025-2026'])
const typesPFP = ref(['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'])
const filieres = ref(['Physiothérapie', 'Soins Infirmiers'])
const viewModes = ref([
  { label: 'Mois', value: 'month' },
  { label: 'Trimestre', value: 'quarter' }
])

const months = ref(['Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'])
const ganttData = ref([])

const stats = ref({
  enCours: 0,
  aVenir: 0,
  termines: 0,
  conflits: 0
})

const getBarStyle = (bar) => {
  return {
    left: `${bar.startPercent}%`,
    width: `${bar.widthPercent}%`,
    background: bar.color,
    top: '5px',
    height: '30px'
  }
}

const showBarDetails = (bar) => {
  console.log('Show details:', bar)
}

const previousPeriod = () => {
  console.log('Previous period')
}

const nextPeriod = () => {
  console.log('Next period')
}

const goToToday = () => {
  console.log('Go to today')
}

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.gantt-page {
  min-height: calc(100vh - 100px);
}

.gantt-bar {
  cursor: pointer;
  transition: all 0.2s;
}

.gantt-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.bar-content {
  line-height: 30px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legend-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.gantt-body {
  max-height: 600px;
  overflow-y: auto;
}
</style>
