<template>
  <AdminLayout>
    <Toast />
    <div class="personalized-dashboard p-4">
      <!-- Header personnalisé -->
      <div class="dashboard-welcome mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <Avatar
              :label="userInitials"
              size="xlarge"
              shape="circle"
              style="background-color: var(--primary-color); color: white"
            />
            <div>
              <h1 class="text-4xl font-bold text-900 m-0">
                Bonjour{{ userName ? ', ' + userName : '' }} 👋
              </h1>
              <p class="text-600 m-0 mt-1">
                Votre dashboard personnalisé - {{ currentDate }}
              </p>
            </div>
          </div>
          
          <div class="flex gap-2 flex-wrap">
            <!-- Sélecteur de période -->
            <PeriodSelector 
              v-model="selectedPeriod" 
              :show-custom="false"
              :show-info="false"
              @change="handlePeriodChange"
            />
            
            <Button
              icon="pi pi-bell"
              label="Alertes"
              severity="warning"
              outlined
              :badge="activeAlertsCount"
              badgeSeverity="danger"
              @click="router.push('/admin/alerts')"
            />
            <Button
              icon="pi pi-cog"
              label="Personnaliser"
              @click="activeTab = 3"
              severity="secondary"
              outlined
            />
          </div>
        </div>
      </div>

      <!-- Tabs Dashboard -->
      <TabView v-model:activeIndex="activeTab">
        <!-- Tab 1: Mes KPI -->
        <TabPanel>
          <template #header>
            <i class="pi pi-chart-bar mr-2"></i>
            <span>Mes KPI</span>
          </template>

          <!-- Grid KPI personnalisable -->
          <DashboardKpiGrid
            ref="kpiGridRef"
            :kpis="userKpis"
            title="Mes indicateurs"
            subtitle="Personnalisez votre vue avec drag & drop"
            :storage-key="userStorageKey"
            @kpi-action="handleKpiAction"
            @config-changed="onConfigChanged"
            class="mb-4"
          />

          <!-- Widget Alertes KPI -->
          <div class="mb-4">
            <AlertsWidget 
              :max-items="5" 
              :auto-refresh="true"
              :refresh-interval="30000"
            />
          </div>

          <!-- Quick Stats - Widgets Redimensionnables -->
          <div class="mb-4">
            <div class="flex align-items-center justify-content-between mb-3">
              <h3 class="text-xl font-semibold m-0">Statistiques rapides</h3>
              <Button
                :icon="widgetEditMode ? 'pi pi-check' : 'pi pi-cog'"
                :label="widgetEditMode ? 'Terminer' : 'Personnaliser taille'"
                @click="widgetEditMode = !widgetEditMode"
                :severity="widgetEditMode ? 'success' : 'secondary'"
                outlined
                size="small"
              />
            </div>
            
            <ResizableWidgetGrid
              :widgets="quickStatsWidgets"
              :edit-mode="widgetEditMode"
              :storage-key="`${userStorageKey}-widgets`"
              @config-changed="onWidgetConfigChanged"
            >
              <!-- Template pour chaque widget -->
              <template #widget_places="{ widget, size }">
                <Card class="stat-card h-full">
                  <template #content>
                    <div class="flex align-items-center justify-content-between">
                      <div :class="size === 'large' ? 'flex-1' : ''">
                        <div class="text-600 font-semibold mb-2">{{ widget.label }}</div>
                        <div :class="size === 'large' ? 'text-5xl' : 'text-3xl'" class="font-bold text-900">
                          {{ widget.value }}
                        </div>
                        <div class="text-sm text-500 mt-1">Disponibles</div>
                      </div>
                      <Avatar
                        :icon="widget.icon"
                        :size="size === 'large' ? 'xlarge' : 'large'"
                        :style="{ backgroundColor: widget.color + '20', color: widget.color }"
                      />
                    </div>
                  </template>
                </Card>
              </template>
              
              <template #widget_institutions="{ widget, size }">
                <Card class="stat-card h-full">
                  <template #content>
                    <div class="flex align-items-center justify-content-between">
                      <div>
                        <div class="text-600 font-semibold mb-2">{{ widget.label }}</div>
                        <div :class="size === 'large' ? 'text-5xl' : 'text-3xl'" class="font-bold text-900">
                          {{ widget.value }}
                        </div>
                        <div class="text-sm text-500 mt-1">Partenaires</div>
                      </div>
                      <Avatar
                        :icon="widget.icon"
                        :size="size === 'large' ? 'xlarge' : 'large'"
                        :style="{ backgroundColor: widget.color + '20', color: widget.color }"
                      />
                    </div>
                  </template>
                </Card>
              </template>
              
              <template #widget_students="{ widget, size }">
                <Card class="stat-card h-full">
                  <template #content>
                    <div class="flex align-items-center justify-content-between">
                      <div>
                        <div class="text-600 font-semibold mb-2">{{ widget.label }}</div>
                        <div :class="size === 'large' ? 'text-5xl' : 'text-3xl'" class="font-bold text-900">
                          {{ widget.value }}
                        </div>
                        <div class="text-sm text-500 mt-1">Inscrits</div>
                      </div>
                      <Avatar
                        :icon="widget.icon"
                        :size="size === 'large' ? 'xlarge' : 'large'"
                        :style="{ backgroundColor: widget.color + '20', color: widget.color }"
                      />
                    </div>
                  </template>
                </Card>
              </template>
              
              <template #widget_formateurs="{ widget, size }">
                <Card class="stat-card h-full">
                  <template #content>
                    <div class="flex align-items-center justify-content-between">
                      <div>
                        <div class="text-600 font-semibold mb-2">{{ widget.label }}</div>
                        <div :class="size === 'large' ? 'text-5xl' : 'text-3xl'" class="font-bold text-900">
                          {{ widget.value }}
                        </div>
                        <div class="text-sm text-500 mt-1">Praticiens</div>
                      </div>
                      <Avatar
                        :icon="widget.icon"
                        :size="size === 'large' ? 'xlarge' : 'large'"
                        :style="{ backgroundColor: widget.color + '20', color: widget.color }"
                      />
                    </div>
                  </template>
                </Card>
              </template>
            </ResizableWidgetGrid>
          </div>
        </TabPanel>

        <!-- Tab 2: Comparaison -->
        <TabPanel>
          <template #header>
            <i class="pi pi-chart-line mr-2"></i>
            <span>Comparaison</span>
          </template>

          <PeriodComparisonPanel
            :kpis="userKpis"
            @compare="handleComparison"
          />
        </TabPanel>

        <!-- Tab 3: Alertes -->
        <TabPanel>
          <template #header>
            <i class="pi pi-bell mr-2"></i>
            <span>Alertes</span>
            <Badge v-if="activeAlertsCount > 0" :value="activeAlertsCount" severity="danger" class="ml-2" />
          </template>

          <div class="alerts-section">
            <div class="flex align-items-center justify-content-between mb-4">
              <div>
                <h3 class="text-2xl font-bold m-0 mb-2">Mes alertes KPI</h3>
                <p class="text-600 m-0">Configurez des alertes pour être notifié des changements importants</p>
              </div>
              <Button
                label="Nouvelle alerte"
                icon="pi pi-plus"
                @click="showAlertManager = true"
              />
            </div>

            <!-- Liste alertes actives -->
            <div v-if="kpisWithAlerts.length > 0" class="grid">
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
                      <div class="flex gap-1">
                        <Button
                          icon="pi pi-pencil"
                          @click="editAlert(kpi)"
                          text
                          rounded
                          size="small"
                        />
                        <Button
                          icon="pi pi-trash"
                          @click="removeAlert(kpi.id)"
                          text
                          rounded
                          size="small"
                          severity="danger"
                        />
                      </div>
                    </div>
                  </template>

                  <template #content>
                    <Message :severity="kpi.alert.severity" :closable="false">
                      {{ kpi.alert.message }}
                    </Message>
                    
                    <div class="mt-3 flex flex-column gap-2">
                      <div class="flex align-items-center justify-content-between text-sm">
                        <span class="text-600">Type:</span>
                        <Tag :value="kpi.alert.type" />
                      </div>
                      <div class="flex align-items-center justify-content-between text-sm">
                        <span class="text-600">Seuil:</span>
                        <span class="font-bold">{{ kpi.alert.threshold }}</span>
                      </div>
                      <div class="flex align-items-center justify-content-between text-sm">
                        <span class="text-600">Notification:</span>
                        <i :class="kpi.alert.notify ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>

            <!-- État vide -->
            <div v-else class="text-center p-6">
              <i class="pi pi-bell-slash text-6xl text-300 mb-3"></i>
              <p class="text-600 text-lg">Aucune alerte configurée</p>
              <p class="text-500 text-sm mb-3">Créez des alertes pour être notifié automatiquement</p>
              <Button 
                label="Créer ma première alerte" 
                icon="pi pi-plus" 
                @click="showAlertManager = true"
              />
            </div>
          </div>
        </TabPanel>

        <!-- Tab 4: Paramètres -->
        <TabPanel>
          <template #header>
            <i class="pi pi-cog mr-2"></i>
            <span>Paramètres</span>
          </template>

          <div class="settings-section">
            <h3 class="text-2xl font-bold mb-4">Personnalisation de votre dashboard</h3>

            <div class="grid">
              <!-- Export/Import -->
              <div class="col-12 lg:col-6">
                <Card>
                  <template #title>
                    <i class="pi pi-download mr-2"></i>
                    Export / Import
                  </template>
                  <template #content>
                    <p class="text-600 mb-3">Sauvegardez ou restaurez votre configuration personnalisée</p>
                    
                    <div class="flex flex-column gap-2">
                      <Button
                        label="Exporter ma configuration"
                        icon="pi pi-download"
                        @click="exportUserConfig"
                        class="w-full"
                      />
                      <Button
                        label="Importer une configuration"
                        icon="pi pi-upload"
                        @click="showImportDialog = true"
                        severity="secondary"
                        outlined
                        class="w-full"
                      />
                    </div>
                  </template>
                </Card>
              </div>

              <!-- Reset -->
              <div class="col-12 lg:col-6">
                <Card>
                  <template #title>
                    <i class="pi pi-refresh mr-2"></i>
                    Réinitialisation
                  </template>
                  <template #content>
                    <p class="text-600 mb-3">Restaurez la configuration par défaut</p>
                    
                    <Button
                      label="Réinitialiser mon dashboard"
                      icon="pi pi-refresh"
                      @click="confirmReset"
                      severity="danger"
                      outlined
                      class="w-full"
                    />
                  </template>
                </Card>
              </div>

              <!-- Dashboards spécialisés -->
              <div class="col-12">
                <h4 class="text-xl font-semibold mb-3">Accès rapide aux dashboards spécialisés</h4>
                
                <div class="grid">
                  <div class="col-12 md:col-6 lg:col-3">
                    <Card class="dashboard-link-card" @click="navigateTo('/admin/dashboard-general')">
                      <template #content>
                        <div class="text-center p-3">
                          <Avatar
                            icon="pi pi-cog"
                            size="xlarge"
                            style="background-color: #3b82f620; color: #3b82f6"
                            class="mb-3"
                          />
                          <h3 class="text-lg font-bold m-0 mb-2">Général</h3>
                          <p class="text-600 text-sm">Système & admin</p>
                        </div>
                      </template>
                    </Card>
                  </div>

                  <div class="col-12 md:col-6 lg:col-3">
                    <Card class="dashboard-link-card" @click="navigateTo('/admin/dashboard-pfp')">
                      <template #content>
                        <div class="text-center p-3">
                          <Avatar
                            icon="pi pi-briefcase"
                            size="xlarge"
                            style="background-color: #10b98120; color: #10b981"
                            class="mb-3"
                          />
                          <h3 class="text-lg font-bold m-0 mb-2">PFP</h3>
                          <p class="text-600 text-sm">Formation pratique</p>
                        </div>
                      </template>
                    </Card>
                  </div>

                  <div class="col-12 md:col-6 lg:col-3">
                    <Card class="dashboard-link-card" @click="navigateTo('/admin/dashboard-academique')">
                      <template #content>
                        <div class="text-center p-3">
                          <Avatar
                            icon="pi pi-book"
                            size="xlarge"
                            style="background-color: #8b5cf620; color: #8b5cf6"
                            class="mb-3"
                          />
                          <h3 class="text-lg font-bold m-0 mb-2">Académique</h3>
                          <p class="text-600 text-sm">Enseignement</p>
                        </div>
                      </template>
                    </Card>
                  </div>

                  <div class="col-12 md:col-6 lg:col-3">
                    <Card class="dashboard-link-card" @click="navigateTo('/admin/dashboard-gamification')">
                      <template #content>
                        <div class="text-center p-3">
                          <Avatar
                            icon="pi pi-star-fill"
                            size="xlarge"
                            style="background-color: #f59e0b20; color: #f59e0b"
                            class="mb-3"
                          />
                          <h3 class="text-lg font-bold m-0 mb-2">Gamification</h3>
                          <p class="text-600 text-sm">Engagement</p>
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <!-- Dialogs -->
    <KpiAlertManager
      v-model="showAlertManager"
      :kpi="selectedKpi"
      @save="handleAlertSave"
      @remove="handleAlertRemove"
    />

    <Dialog
      v-model:visible="showImportDialog"
      header="Importer une configuration"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-column gap-3">
        <p class="text-600">Collez votre configuration JSON:</p>
        <Textarea
          v-model="importConfigText"
          rows="10"
          placeholder='{"order": [...], "hidden": [...], ...}'
          class="w-full"
        />
      </div>
      
      <template #footer>
        <Button label="Annuler" @click="showImportDialog = false" severity="secondary" outlined />
        <Button label="Importer" @click="importUserConfig" icon="pi pi-upload" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showExportDialog"
      header="Configuration exportée"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-column gap-3">
        <p class="text-600">Copiez cette configuration:</p>
        <Textarea
          :model-value="exportedConfig"
          rows="10"
          readonly
          class="w-full"
        />
        <Button
          label="Copier"
          icon="pi pi-copy"
          @click="copyToClipboard"
          class="w-full"
        />
      </div>
      
      <template #footer>
        <Button label="Fermer" @click="showExportDialog = false" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { auth } from '@/firebase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DashboardKpiGrid from '@/components/admin/widgets/DashboardKpiGrid.vue'
import ResizableWidgetGrid from '@/components/admin/widgets/ResizableWidgetGrid.vue'
import PeriodComparisonPanel from '@/components/admin/widgets/PeriodComparisonPanel.vue'
import KpiAlertManager from '@/components/admin/widgets/KpiAlertManager.vue'
import PeriodSelector from '@/components/admin/widgets/PeriodSelector.vue'
import AlertsWidget from '@/components/admin/widgets/AlertsWidget.vue'
import { fetchQuickStats, subscribeToQuickStats } from '@/service/dashboardQuickStatsService'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Tooltip from 'primevue/tooltip'
import { useKpiManager } from '@/composables/useKpiManager'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// User info
const user = computed(() => auth.currentUser)
const userId = computed(() => user.value?.uid || 'default')
const userName = computed(() => user.value?.displayName || user.value?.email?.split('@')[0] || 'Admin')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

// Storage key personnalisé par utilisateur
const userStorageKey = computed(() => `dashboard-kpi-config-${userId.value}`)

// État
const activeTab = ref(0)
const showAlertManager = ref(false)
const showImportDialog = ref(false)
const showExportDialog = ref(false)
const selectedKpi = ref(null)
const kpiGridRef = ref(null)
const importConfigText = ref('')
const exportedConfig = ref('')
const notificationCount = ref('3')
const selectedPeriod = ref('month')

// Date actuelle
const currentDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('fr-FR', options)
})

// Charger tous les KPI
const { kpisWithData: generalKpis, loadKpis: loadGeneral } = useKpiManager('general')
const { kpisWithData: pfpKpis, loadKpis: loadPfp } = useKpiManager('pfp')
const { kpisWithData: academiqueKpis, loadKpis: loadAcademique } = useKpiManager('academique')
const { kpisWithData: gamificationKpis, loadKpis: loadGamification } = useKpiManager('gamification')

// Tous les KPI de l'utilisateur
const userKpis = computed(() => [
  ...generalKpis.value,
  ...pfpKpis.value,
  ...academiqueKpis.value,
  ...gamificationKpis.value
])

// KPI avec alertes
const kpisWithAlerts = computed(() => userKpis.value.filter(kpi => kpi.alert))
const activeAlertsCount = computed(() => kpisWithAlerts.value.length)

// Supabase data (temps réel)
const totalPlaces = ref(0)
const totalInstitutions = ref(0)
const totalStudents = ref(0)
const totalFormateurs = ref(0)
const quickStatsLoading = ref(true)
const unsubscribeQuickStats = ref(null)

// Mode édition widgets
const widgetEditMode = ref(false)

// Widgets redimensionnables
const quickStatsWidgets = computed(() => [
  {
    id: 'widget_places',
    label: 'Places de stages',
    icon: 'pi pi-map-marker',
    value: totalPlaces.value,
    color: '#3b82f6',
    size: 'small'
  },
  {
    id: 'widget_institutions',
    label: 'Institutions',
    icon: 'pi pi-building',
    value: totalInstitutions.value,
    color: '#10b981',
    size: 'small'
  },
  {
    id: 'widget_students',
    label: 'Étudiants',
    icon: 'pi pi-users',
    value: totalStudents.value,
    color: '#8b5cf6',
    size: 'small'
  },
  {
    id: 'widget_formateurs',
    label: 'Formateurs',
    icon: 'pi pi-id-card',
    value: totalFormateurs.value,
    color: '#f59e0b',
    size: 'small'
  }
])

// Actions
function handleKpiAction(kpi) {
  const routes = {
    total_users: '/user_list',
    total_roles: '/admin/user-roles',
    students_count: '/etudiant_list',
    institutions_count: '/institution_list',
    teachers_count: '/admin/teachers-si',
    challenges_active: '/admin/gamification/challenges'
  }
  
  if (routes[kpi.id]) {
    router.push(routes[kpi.id])
  }
}

function onConfigChanged(config) {
  toast.add({
    severity: 'success',
    summary: 'Configuration sauvegardée',
    detail: 'Votre personnalisation a été enregistrée',
    life: 2000
  })
}

function onWidgetConfigChanged(config) {
  toast.add({
    severity: 'success',
    summary: 'Widgets personnalisés',
    detail: 'Taille des widgets sauvegardée',
    life: 2000
  })
}

function handleComparison(data) {
  toast.add({
    severity: 'info',
    summary: 'Comparaison générée',
    detail: `${data.currentPeriod} vs ${data.comparePeriod}`,
    life: 3000
  })
}

function editAlert(kpi) {
  selectedKpi.value = kpi
  showAlertManager.value = true
}

function removeAlert(kpiId) {
  if (kpiGridRef.value) {
    kpiGridRef.value.setKpiAlert(kpiId, null)
  }
  toast.add({
    severity: 'info',
    summary: 'Alerte supprimée',
    life: 2000
  })
}

function handleAlertSave(kpiId, alert) {
  if (kpiGridRef.value) {
    kpiGridRef.value.setKpiAlert(kpiId, alert)
  }
  toast.add({
    severity: 'success',
    summary: 'Alerte configurée',
    life: 3000
  })
}

function handleAlertRemove(kpiId) {
  removeAlert(kpiId)
}

function exportUserConfig() {
  const saved = localStorage.getItem(userStorageKey.value)
  if (saved) {
    const config = JSON.parse(saved)
    exportedConfig.value = JSON.stringify({
      version: '1.0',
      user: userName.value,
      timestamp: new Date().toISOString(),
      ...config
    }, null, 2)
    showExportDialog.value = true
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Aucune configuration',
      detail: 'Personnalisez d\'abord votre dashboard',
      life: 3000
    })
  }
}

function importUserConfig() {
  try {
    const config = JSON.parse(importConfigText.value)
    
    localStorage.setItem(userStorageKey.value, JSON.stringify({
      order: config.order || [],
      hidden: config.hidden || [],
      alerts: config.alerts || {}
    }))
    
    showImportDialog.value = false
    importConfigText.value = ''
    
    toast.add({
      severity: 'success',
      summary: 'Configuration importée',
      detail: 'Rechargez la page pour voir les changements',
      life: 3000
    })
    
    setTimeout(() => location.reload(), 2000)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Format JSON invalide',
      life: 3000
    })
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(exportedConfig.value).then(() => {
    toast.add({
      severity: 'success',
      summary: 'Copié!',
      life: 2000
    })
  })
}

function confirmReset() {
  confirm.require({
    message: 'Voulez-vous vraiment réinitialiser votre dashboard ?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      if (kpiGridRef.value) {
        kpiGridRef.value.resetConfig()
      }
      localStorage.removeItem(userStorageKey.value)
      
      toast.add({
        severity: 'success',
        summary: 'Dashboard réinitialisé',
        detail: 'Configuration par défaut restaurée',
        life: 3000
      })
      
      setTimeout(() => location.reload(), 1500)
    }
  })
}

function navigateTo(path) {
  router.push(path)
}

function handlePeriodChange(period) {
  console.log('Période changée:', period)
  // La comparaison sera gérée automatiquement par useKpiManager
  // qui intègre periodComparison
  toast.add({
    severity: 'info',
    summary: 'Période mise à jour',
    detail: `Comparaison avec la période: ${period}`,
    life: 3000
  })
}

// Charger données Supabase en temps réel
async function loadSupabaseData() {
  quickStatsLoading.value = true
  
  try {
    // Charger les stats initiales
    const stats = await fetchQuickStats()
    
    totalPlaces.value = stats.places || 0
    totalInstitutions.value = stats.institutions || 0
    totalStudents.value = stats.students || 0
    totalFormateurs.value = stats.formateurs || 0
    
    // S'abonner aux mises à jour temps réel
    unsubscribeQuickStats.value = subscribeToQuickStats((newStats) => {
      totalPlaces.value = newStats.places || 0
      totalInstitutions.value = newStats.institutions || 0
      totalStudents.value = newStats.students || 0
      totalFormateurs.value = newStats.formateurs || 0
    })
    
    quickStatsLoading.value = false
  } catch (error) {
    console.error('Error loading Supabase data:', error)
    quickStatsLoading.value = false
    
    toast.add({
      severity: 'warn',
      summary: 'Erreur de chargement',
      detail: 'Impossible de charger les statistiques',
      life: 3000
    })
  }
}

onMounted(async () => {
  // Charger KPI
  await Promise.all([
    loadGeneral(),
    loadPfp(),
    loadAcademique(),
    loadGamification()
  ])
  
  // Charger données Supabase
  await loadSupabaseData()
  
  // Message de bienvenue
  toast.add({
    severity: 'info',
    summary: `Bienvenue ${userName.value}!`,
    detail: 'Personnalisez votre dashboard avec drag & drop',
    life: 4000
  })
})

onUnmounted(() => {
  // Nettoyer l'abonnement Supabase
  if (unsubscribeQuickStats.value) {
    unsubscribeQuickStats.value()
  }
})
</script>

<style scoped>
.personalized-dashboard {
  min-height: 100vh;
}

.dashboard-welcome {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.dashboard-welcome h1 {
  color: var(--text-color) !important;
}

.dashboard-welcome p {
  color: var(--text-color-secondary) !important;
}

/* ========================================
   TABVIEW - Style Moderne
   ======================================== */

/* Conteneur principal */
:deep(.p-tabview) {
  background: transparent !important;
}

/* Liste des onglets */
:deep(.p-tabview-nav) {
  background: var(--surface-card) !important;
  border: none !important;
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  gap: 0.5rem;
  display: flex;
  margin-bottom: 2rem;
}

/* Chaque onglet */
:deep(.p-tabview-nav-link) {
  background: transparent !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 1rem 1.5rem !important;
  transition: all 0.3s ease !important;
  font-weight: 500 !important;
  color: var(--text-color-secondary) !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Onglet au survol */
:deep(.p-tabview-nav-link:hover) {
  background: var(--surface-hover) !important;
  color: var(--text-color) !important;
}

/* Onglet actif */
:deep(.p-tabview-nav-link:focus),
:deep(.p-highlight .p-tabview-nav-link) {
  background: var(--primary-color) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3) !important;
}

/* Icônes dans les onglets */
:deep(.p-tabview-nav-link i) {
  font-size: 1.1rem;
}

/* Badge dans les onglets */
:deep(.p-tabview-nav-link .p-badge) {
  margin-left: 0.5rem;
}

/* Panels (contenu) */
:deep(.p-tabview-panels) {
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
}

:deep(.p-tabview-panel) {
  background: transparent !important;
  padding: 1.5rem 0 !important;
}

/* Animation d'entrée du contenu */
:deep(.p-tabview-panel) {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  height: 100%;
}

.dashboard-link-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

.alerts-section,
.settings-section {
  padding: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-welcome {
    text-align: center;
  }
  
  .dashboard-welcome h1 {
    font-size: 2rem;
  }
}
</style>
