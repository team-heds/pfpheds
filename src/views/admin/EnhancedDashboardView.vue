<template>
  <AdminLayout>
    <Toast />
    <div class="enhanced-dashboard p-4">
      <!-- Header principal -->
      <div class="dashboard-header mb-4">
        <div class="flex align-items-center gap-3">
          <Avatar
            icon="pi pi-chart-bar"
            size="xlarge"
            shape="circle"
            style="background-color: var(--primary-color); color: white"
          />
          <div>
            <h1 class="text-4xl font-bold text-900 m-0">Dashboard Admin</h1>
            <p class="text-600 m-0 mt-1">Vue d'ensemble complète avec KPI modulables</p>
          </div>
        </div>
        
        <div class="flex gap-2">
          <Button
            icon="pi pi-bell"
            label="Notifications"
            severity="secondary"
            outlined
            badge="3"
            badgeSeverity="danger"
          />
          <Button
            icon="pi pi-cog"
            label="Paramètres"
            severity="secondary"
            outlined
          />
        </div>
      </div>

      <!-- Tabs pour les différentes sections -->
      <TabView v-model:activeIndex="activeTab">
        <!-- Tab 1: Vue d'ensemble -->
        <TabPanel header="Vue d'ensemble">
          <template #header>
            <i class="pi pi-home mr-2"></i>
            <span>Vue d'ensemble</span>
          </template>

          <!-- KPI Grid modulable avec drag & drop -->
          <DashboardKpiGrid
            ref="kpiGridRef"
            :kpis="allKpis"
            title="Tous les KPI"
            subtitle="Indicateurs clés de performance - Glissez pour réorganiser"
            storage-key="admin-dashboard-kpi-config"
            @kpi-action="handleKpiAction"
            @config-changed="onConfigChanged"
            class="mb-4"
          />

          <!-- Quick stats -->
          <div class="grid mb-4">
            <div class="col-12 md:col-6 lg:col-3">
              <Card class="stat-card">
                <template #content>
                  <div class="flex align-items-center justify-content-between">
                    <div>
                      <div class="text-600 font-semibold mb-2">KPI Actifs</div>
                      <div class="text-3xl font-bold text-900">{{ visibleKpiCount }}</div>
                    </div>
                    <Avatar
                      icon="pi pi-chart-bar"
                      size="large"
                      style="background-color: #3b82f620; color: #3b82f6"
                    />
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-3">
              <Card class="stat-card">
                <template #content>
                  <div class="flex align-items-center justify-content-between">
                    <div>
                      <div class="text-600 font-semibold mb-2">Alertes actives</div>
                      <div class="text-3xl font-bold text-900">{{ activeAlertsCount }}</div>
                    </div>
                    <Avatar
                      icon="pi pi-exclamation-triangle"
                      size="large"
                      style="background-color: #f59e0b20; color: #f59e0b"
                    />
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-3">
              <Card class="stat-card">
                <template #content>
                  <div class="flex align-items-center justify-content-between">
                    <div>
                      <div class="text-600 font-semibold mb-2">Dashboards</div>
                      <div class="text-3xl font-bold text-900">4</div>
                    </div>
                    <Avatar
                      icon="pi pi-th-large"
                      size="large"
                      style="background-color: #10b98120; color: #10b981"
                    />
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-3">
              <Card class="stat-card">
                <template #content>
                  <div class="flex align-items-center justify-content-between">
                    <div>
                      <div class="text-600 font-semibold mb-2">Dernière MAJ</div>
                      <div class="text-lg font-bold text-900">{{ lastUpdateTime }}</div>
                    </div>
                    <Avatar
                      icon="pi pi-clock"
                      size="large"
                      style="background-color: #8b5cf620; color: #8b5cf6"
                    />
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </TabPanel>

        <!-- Tab 2: Comparaison -->
        <TabPanel header="Comparaison">
          <template #header>
            <i class="pi pi-chart-line mr-2"></i>
            <span>Comparaison</span>
          </template>

          <PeriodComparisonPanel
            :kpis="allKpis"
            @compare="handleComparison"
          />
        </TabPanel>

        <!-- Tab 3: Alertes -->
        <TabPanel header="Alertes">
          <template #header>
            <i class="pi pi-bell mr-2"></i>
            <span>Alertes</span>
            <Badge v-if="activeAlertsCount > 0" :value="activeAlertsCount" severity="danger" class="ml-2" />
          </template>

          <div class="alerts-section">
            <div class="flex align-items-center justify-content-between mb-4">
              <h3 class="text-2xl font-bold m-0">Configuration des alertes KPI</h3>
              <Button
                label="Nouvelle alerte"
                icon="pi pi-plus"
                @click="showAlertManager = true"
              />
            </div>

            <!-- Liste des alertes actives -->
            <div class="grid">
              <div
                v-for="kpi in kpisWithAlerts"
                :key="kpi.id"
                class="col-12 md:col-6 lg:col-4"
              >
                <Card>
                  <template #header>
                    <div class="p-3 flex align-items-center justify-content-between">
                      <div class="flex align-items-center gap-2">
                        <i :class="kpi.icon" :style="{ color: kpi.color }"></i>
                        <span class="font-semibold">{{ kpi.label }}</span>
                      </div>
                      <Button
                        icon="pi pi-pencil"
                        @click="editAlert(kpi)"
                        text
                        rounded
                        size="small"
                      />
                    </div>
                  </template>

                  <template #content>
                    <div v-if="kpi.alert">
                      <Message :severity="kpi.alert.severity" :closable="false">
                        {{ kpi.alert.message }}
                      </Message>
                      
                      <div class="mt-3">
                        <div class="flex align-items-center justify-content-between text-sm">
                          <span class="text-600">Type:</span>
                          <Tag :value="kpi.alert.type" />
                        </div>
                        <div class="flex align-items-center justify-content-between text-sm mt-2">
                          <span class="text-600">Seuil:</span>
                          <span class="font-bold">{{ kpi.alert.threshold }}</span>
                        </div>
                        <div class="flex align-items-center justify-content-between text-sm mt-2">
                          <span class="text-600">Notification:</span>
                          <i :class="kpi.alert.notify ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                        </div>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>

            <!-- État vide -->
            <div v-if="kpisWithAlerts.length === 0" class="text-center p-5">
              <i class="pi pi-bell-slash text-6xl text-300 mb-3"></i>
              <p class="text-600">Aucune alerte configurée</p>
              <Button label="Créer une alerte" icon="pi pi-plus" @click="showAlertManager = true" />
            </div>
          </div>
        </TabPanel>

        <!-- Tab 4: Dashboards spécialisés -->
        <TabPanel header="Dashboards">
          <template #header>
            <i class="pi pi-table mr-2"></i>
            <span>Dashboards</span>
          </template>

          <div class="dashboards-grid grid">
            <div class="col-12 md:col-6 lg:col-3">
              <Card class="dashboard-link-card" @click="navigateTo('/admin/dashboard-general')">
                <template #content>
                  <div class="text-center p-4">
                    <Avatar
                      icon="pi pi-cog"
                      size="xlarge"
                      style="background-color: #3b82f620; color: #3b82f6"
                      class="mb-3"
                    />
                    <h3 class="text-xl font-bold m-0 mb-2">Général</h3>
                    <p class="text-600 text-sm">Administration système</p>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-3">
              <Card class="dashboard-link-card" @click="navigateTo('/admin/dashboard-pfp')">
                <template #content>
                  <div class="text-center p-4">
                    <Avatar
                      icon="pi pi-briefcase"
                      size="xlarge"
                      style="background-color: #10b98120; color: #10b981"
                      class="mb-3"
                    />
                    <h3 class="text-xl font-bold m-0 mb-2">PFP</h3>
                    <p class="text-600 text-sm">Formation pratique</p>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-3">
              <Card class="dashboard-link-card" @click="navigateTo('/admin/dashboard-academique')">
                <template #content>
                  <div class="text-center p-4">
                    <Avatar
                      icon="pi pi-book"
                      size="xlarge"
                      style="background-color: #8b5cf620; color: #8b5cf6"
                      class="mb-3"
                    />
                    <h3 class="text-xl font-bold m-0 mb-2">Académique</h3>
                    <p class="text-600 text-sm">Enseignement & cours</p>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-6 lg:col-3">
              <Card class="dashboard-link-card" @click="navigateTo('/admin/dashboard-gamification')">
                <template #content>
                  <div class="text-center p-4">
                    <Avatar
                      icon="pi pi-star-fill"
                      size="xlarge"
                      style="background-color: #f59e0b20; color: #f59e0b"
                      class="mb-3"
                    />
                    <h3 class="text-xl font-bold m-0 mb-2">Gamification</h3>
                    <p class="text-600 text-sm">Engagement & quêtes</p>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <!-- Dialog Alert Manager -->
    <KpiAlertManager
      v-model="showAlertManager"
      :kpi="selectedKpi"
      @save="handleAlertSave"
      @remove="handleAlertRemove"
    />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DashboardKpiGrid from '@/components/admin/widgets/DashboardKpiGrid.vue'
import PeriodComparisonPanel from '@/components/admin/widgets/PeriodComparisonPanel.vue'
import KpiAlertManager from '@/components/admin/widgets/KpiAlertManager.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import { useKpiManager } from '@/composables/useKpiManager'

const router = useRouter()
const toast = useToast()

const activeTab = ref(0)
const showAlertManager = ref(false)
const selectedKpi = ref(null)
const kpiGridRef = ref(null)
const lastUpdateTime = ref('Il y a 2 min')

// Charger tous les KPI des 4 dashboards
const { kpisWithData: generalKpis, loadKpis: loadGeneral } = useKpiManager('general')
const { kpisWithData: pfpKpis, loadKpis: loadPfp } = useKpiManager('pfp')
const { kpisWithData: academiqueKpis, loadKpis: loadAcademique } = useKpiManager('academique')
const { kpisWithData: gamificationKpis, loadKpis: loadGamification } = useKpiManager('gamification')

// Tous les KPI combinés
const allKpis = computed(() => [
  ...generalKpis.value,
  ...pfpKpis.value,
  ...academiqueKpis.value,
  ...gamificationKpis.value
])

// KPI visibles (non cachés)
const visibleKpiCount = computed(() => {
  return allKpis.value.filter(kpi => !kpi.hidden).length
})

// KPI avec alertes
const kpisWithAlerts = computed(() => {
  return allKpis.value.filter(kpi => kpi.alert)
})

const activeAlertsCount = computed(() => kpisWithAlerts.value.length)

function handleKpiAction(kpi) {
  console.log('KPI action:', kpi)
  
  // Navigation selon le KPI
  const routes = {
    total_users: '/user_list',
    total_roles: '/admin/user-roles',
    students_count: '/etudiant_list',
    institutions_count: '/institution_list',
    teachers_count: '/admin/teachers-si',
    courses_count: '/admin/planning/manage',
    challenges_active: '/admin/gamification/challenges',
    quests_completed: '/admin/gamification/quests'
  }
  
  if (routes[kpi.id]) {
    router.push(routes[kpi.id])
  }
}

function onConfigChanged(config) {
  console.log('Config changed:', config)
  toast.add({
    severity: 'success',
    summary: 'Configuration sauvegardée',
    detail: 'Votre personnalisation a été enregistrée',
    life: 2000
  })
}

function handleComparison(data) {
  console.log('Comparison data:', data)
  toast.add({
    severity: 'info',
    summary: 'Comparaison générée',
    detail: `Période: ${data.currentPeriod} vs ${data.comparePeriod}`,
    life: 3000
  })
}

function editAlert(kpi) {
  selectedKpi.value = kpi
  showAlertManager.value = true
}

function handleAlertSave(kpiId, alert) {
  if (kpiGridRef.value) {
    kpiGridRef.value.setKpiAlert(kpiId, alert)
  }
  
  toast.add({
    severity: 'success',
    summary: 'Alerte configurée',
    detail: 'L\'alerte a été enregistrée avec succès',
    life: 3000
  })
}

function handleAlertRemove(kpiId) {
  if (kpiGridRef.value) {
    kpiGridRef.value.setKpiAlert(kpiId, null)
  }
  
  toast.add({
    severity: 'info',
    summary: 'Alerte supprimée',
    detail: 'L\'alerte a été retirée',
    life: 2000
  })
}

function navigateTo(path) {
  router.push(path)
}

onMounted(async () => {
  // Charger tous les KPI
  await Promise.all([
    loadGeneral(),
    loadPfp(),
    loadAcademique(),
    loadGamification()
  ])
  
  // Mettre à jour le temps
  setInterval(() => {
    const now = new Date()
    lastUpdateTime.value = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }, 60000)
})
</script>

<style scoped>
.enhanced-dashboard {
  min-height: 100vh;
  background: var(--surface-ground);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.stat-card {
  transition: all 0.3s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.dashboard-link-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.dashboard-link-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

.dashboards-grid .dashboard-link-card {
  height: 100%;
}

.alerts-section {
  padding: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
