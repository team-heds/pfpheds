<template>
  <AdminLayout>
    <div class="alertes-page p-4">
      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4" style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white;">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-bell text-4xl" style="color: white;"></i>
            <div>
              <h1 class="text-2xl font-bold m-0" style="color: white;">Centre d'Alertes PFP</h1>
              <p class="m-0 mt-1" style="color: rgba(255,255,255,0.8);">Surveillance automatique des données de formation pratique</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2">
            <Button
              icon="pi pi-refresh"
              label="Analyser"
              class="p-button-sm"
              style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white;"
              @click="runAnalysis"
              :loading="loading"
            />
          </div>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="grid mb-4">
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold" :class="stats.critical > 0 ? 'text-red-500' : 'text-green-500'">{{ stats.critical }}</div>
            <div class="text-600 text-sm mt-1">Critiques</div>
            <div class="mt-2"><i class="pi pi-exclamation-circle text-red-400"></i></div>
          </div>
        </div>
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-orange-500">{{ stats.warning }}</div>
            <div class="text-600 text-sm mt-1">Avertissements</div>
            <div class="mt-2"><i class="pi pi-exclamation-triangle text-orange-400"></i></div>
          </div>
        </div>
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-blue-500">{{ stats.info }}</div>
            <div class="text-600 text-sm mt-1">Informations</div>
            <div class="mt-2"><i class="pi pi-info-circle text-blue-400"></i></div>
          </div>
        </div>
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-900">{{ stats.total }}</div>
            <div class="text-600 text-sm mt-1">Total alertes</div>
            <div class="mt-2"><i class="pi pi-bell text-500"></i></div>
          </div>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center gap-2 mb-3 flex-wrap">
          <Button
            v-for="cat in categories"
            :key="cat.value"
            :label="`${cat.label} (${getCategoryCount(cat.value)})`"
            :icon="cat.icon"
            :class="['p-button-sm', selectedCategory === cat.value ? '' : 'p-button-outlined']"
            :severity="selectedCategory === cat.value ? undefined : 'secondary'"
            @click="selectedCategory = cat.value"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="surface-card p-6 border-round shadow-2 text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <p class="text-600">Analyse des données en cours...</p>
      </div>

      <!-- No alerts -->
      <div v-else-if="filteredAlerts.length === 0 && !loading" class="surface-card p-6 border-round shadow-2 text-center">
        <i class="pi pi-check-circle text-5xl text-green-500 mb-3"></i>
        <h3 class="text-900 m-0">Aucune alerte</h3>
        <p class="text-600 mt-2">
          {{ alerts.length === 0 ? 'Cliquez sur "Analyser" pour lancer une analyse des données.' : 'Aucune alerte dans cette catégorie.' }}
        </p>
      </div>

      <!-- Alerts List -->
      <div v-else class="flex flex-column gap-3">
        <div
          v-for="(alert, index) in filteredAlerts"
          :key="index"
          class="surface-card border-round shadow-2 overflow-hidden"
        >
          <div class="flex">
            <!-- Severity bar -->
            <div
              class="flex-shrink-0"
              :style="{
                width: '6px',
                background: getSeverityColor(alert.severity)
              }"
            ></div>

            <div class="flex-1 p-3">
              <div class="flex align-items-start justify-content-between gap-3">
                <div class="flex-1">
                  <div class="flex align-items-center gap-2 mb-2">
                    <Tag
                      :value="getSeverityLabel(alert.severity)"
                      :severity="getSeverityTagSeverity(alert.severity)"
                      class="text-xs"
                    />
                    <Tag
                      :value="getCategoryLabel(alert.category)"
                      severity="info"
                      class="text-xs"
                      style="background: #EEF2FF; color: #6366F1;"
                    />
                    <span v-if="alert.pfpType" class="text-xs font-bold px-2 py-1 border-round" style="background: #F0FDF4; color: #16A34A;">
                      {{ alert.pfpType }}
                    </span>
                  </div>

                  <h4 class="text-900 font-bold m-0 mb-1">{{ alert.title }}</h4>
                  <p class="text-600 text-sm m-0 mb-2">{{ alert.message }}</p>

                  <!-- Data details -->
                  <div v-if="alert.data" class="flex gap-3 flex-wrap">
                    <span
                      v-for="(val, key) in getDisplayData(alert.data)"
                      :key="key"
                      class="text-xs px-2 py-1 border-round surface-200 text-700"
                    >
                      <strong>{{ formatDataKey(key) }}:</strong> {{ val }}
                    </span>
                  </div>
                </div>

                <!-- Action -->
                <div v-if="alert.action" class="flex-shrink-0 text-right">
                  <div class="text-xs text-500 mb-1">Action recommandée</div>
                  <div class="text-sm font-semibold text-primary">{{ alert.action }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category breakdown -->
      <div v-if="alerts.length > 0" class="grid mt-4">
        <div v-for="cat in categories" :key="cat.value" class="col-12 md:col-4 lg:col-2">
          <div class="surface-card p-3 border-round shadow-1 text-center">
            <i :class="[cat.icon, 'text-2xl mb-2']" style="color: #6366F1;"></i>
            <div class="text-xl font-bold text-900">{{ getCategoryCount(cat.value) }}</div>
            <div class="text-xs text-600">{{ cat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import { PfpAlertsService } from '@/service/pfpAlertsService'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { supabase } from '@/supabase'

const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()

const loading = ref(false)
const alerts = ref([])
const selectedCategory = ref('all')

const pfpAlertsService = new PfpAlertsService()

const categories = [
  { value: 'all', label: 'Toutes', icon: 'pi pi-list' },
  { value: 'offres', label: 'Offres', icon: 'pi pi-table' },
  { value: 'criteres', label: 'Critères', icon: 'pi pi-check-circle' },
  { value: 'evaluations', label: 'Évaluations', icon: 'pi pi-star' },
  { value: 'cas_particuliers', label: 'Cas Particuliers', icon: 'pi pi-exclamation-triangle' },
  { value: 'institutions', label: 'Institutions', icon: 'pi pi-building' }
]

const stats = computed(() => pfpAlertsService.getStats())

const filteredAlerts = computed(() => {
  if (selectedCategory.value === 'all') return alerts.value
  return alerts.value.filter(a => a.category === selectedCategory.value)
})

function getCategoryCount(cat) {
  if (cat === 'all') return alerts.value.length
  return alerts.value.filter(a => a.category === cat).length
}

function getSeverityColor(severity) {
  const colors = { error: '#EF4444', warn: '#F59E0B', info: '#3B82F6' }
  return colors[severity] || '#9CA3AF'
}

function getSeverityLabel(severity) {
  const labels = { error: 'Critique', warn: 'Attention', info: 'Info' }
  return labels[severity] || severity
}

function getSeverityTagSeverity(severity) {
  const map = { error: 'danger', warn: 'warning', info: 'info' }
  return map[severity] || 'secondary'
}

function getCategoryLabel(category) {
  const cat = categories.find(c => c.value === category)
  return cat?.label || category
}

function getDisplayData(data) {
  const display = {}
  for (const [key, val] of Object.entries(data)) {
    if (key === 'students' || key === 'institutions') continue
    if (typeof val === 'number' || typeof val === 'string') {
      display[key] = val
    }
  }
  return display
}

function formatDataKey(key) {
  const labels = {
    count: 'Nombre',
    total: 'Total',
    percent: 'Pourcentage',
    offres: 'Offres',
    propositions: 'Propositions',
    diff: 'Différence',
    validated: 'Validés',
    criteria: 'Critère'
  }
  return labels[key] || key
}

async function runAnalysis() {
  loading.value = true
  try {
    // Fetch all data in parallel
    const [places, institutions, studentsRes, evalsRes, casesRes] = await Promise.all([
      placesStore.fetchPlaces({ force: true }),
      institutionsStore.fetchInstitutions(),
      supabase.from('physio_result').select('*'),
      supabase.from('physio_result').select('id, pfp1_cpt, pfp2_cpt, pfp3_cpt, pfp4_cpt, pfp1_eval, pfp2_eval, pfp3_eval, pfp4_eval'),
      supabase.from('physio_result').select('id, etudiant, pfp1, pfp1_prime, pfp2, pfp2_prime, pfp3, pfp3_prime, pfp4, pfp4_prime')
    ])

    const currentYear = new Date().getFullYear().toString()

    // Build student criteria data
    const criteriaLabels = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
    const students = (studentsRes?.data || []).map(s => ({
      scores: Object.fromEntries(criteriaLabels.map(c => [c, s[c] || 0]))
    }))

    const evaluations = evalsRes?.data || []
    const cases = casesRes?.data || []

    // Run analysis
    const result = pfpAlertsService.runFullAnalysis({
      places: places || [],
      year: currentYear,
      students,
      evaluations,
      cases,
      institutions: institutions || []
    })

    alerts.value = result
  } catch (err) {
    console.error('Erreur analyse alertes:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  runAnalysis()
})
</script>

<style scoped>
.alertes-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
