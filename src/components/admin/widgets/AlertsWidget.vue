<template>
  <Card class="alerts-widget">
    <template #header>
      <div class="widget-header">
        <div class="header-left">
          <i class="pi pi-bell" :class="{ 'bell-animation': hasNewAlerts }"></i>
          <h3>Alertes KPI</h3>
          <Badge v-if="activeAlertCount > 0" :value="activeAlertCount" severity="danger" />
        </div>
        <div class="header-actions">
          <Button
            icon="pi pi-refresh"
            rounded
            text
            severity="secondary"
            @click="refresh"
            :loading="loading"
          />
          <Button
            icon="pi pi-cog"
            rounded
            text
            severity="secondary"
            @click="showSettings = true"
          />
        </div>
      </div>
    </template>

    <template #content>
      <!-- Statistiques d'alertes -->
      <div class="alerts-stats">
        <div class="stat-card critical">
          <i class="pi pi-exclamation-circle"></i>
          <div class="stat-info">
            <span class="stat-value">{{ stats.critical }}</span>
            <span class="stat-label">Critique</span>
          </div>
        </div>
        <div class="stat-card warning">
          <i class="pi pi-exclamation-triangle"></i>
          <div class="stat-info">
            <span class="stat-value">{{ stats.warning }}</span>
            <span class="stat-label">Avertissement</span>
          </div>
        </div>
        <div class="stat-card info">
          <i class="pi pi-info-circle"></i>
          <div class="stat-info">
            <span class="stat-value">{{ stats.info }}</span>
            <span class="stat-label">Info</span>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Liste des alertes -->
      <div v-if="alerts.length === 0" class="empty-state">
        <i class="pi pi-check-circle"></i>
        <p>Aucune alerte active</p>
        <small>Vos KPI sont dans les normes</small>
      </div>

      <div v-else class="alerts-list">
        <TransitionGroup name="alert-list">
          <div
            v-for="alert in paginatedAlerts"
            :key="alert.timestamp"
            class="alert-item"
            :class="`alert-${alert.severity}`"
          >
            <div class="alert-icon">
              <i :class="getAlertIcon(alert.type)"></i>
            </div>
            <div class="alert-content">
              <div class="alert-header">
                <span class="alert-title">{{ alert.title }}</span>
                <Tag
                  :value="alert.severity.toUpperCase()"
                  :severity="alert.severity"
                  size="small"
                />
              </div>
              <p class="alert-message">{{ alert.message }}</p>
              <div class="alert-footer">
                <small class="alert-time">
                  <i class="pi pi-clock"></i>
                  {{ formatTime(alert.timestamp) }}
                </small>
                <Button
                  v-if="alert.action"
                  :label="alert.action"
                  size="small"
                  text
                  severity="primary"
                  @click="handleAction(alert)"
                />
              </div>
            </div>
            <div class="alert-actions">
              <Button
                icon="pi pi-check"
                rounded
                text
                size="small"
                severity="success"
                @click="resolveAlert(alert)"
                v-tooltip.left="'Marquer comme résolu'"
              />
              <Button
                icon="pi pi-times"
                rounded
                text
                size="small"
                severity="danger"
                @click="dismissAlert(alert)"
                v-tooltip.left="'Ignorer'"
              />
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="alerts-pagination">
        <Paginator
          :rows="itemsPerPage"
          :totalRecords="alerts.length"
          @page="onPageChange"
        />
      </div>

      <!-- Bouton voir tout -->
      <div class="alerts-footer">
        <Button
          label="Voir toutes les alertes"
          icon="pi pi-arrow-right"
          text
          @click="goToAlertsPage"
        />
      </div>
    </template>
  </Card>

  <!-- Dialog paramètres -->
  <Dialog
    v-model:visible="showSettings"
    header="Paramètres des Alertes"
    :modal="true"
    :style="{ width: '500px' }"
  >
    <div class="settings-content">
      <div class="setting-item">
        <label>Notifications sonores</label>
        <InputSwitch v-model="settings.soundEnabled" />
      </div>
      <div class="setting-item">
        <label>Notifications push</label>
        <InputSwitch v-model="settings.pushEnabled" />
      </div>
      <div class="setting-item">
        <label>Afficher les alertes résolues</label>
        <InputSwitch v-model="settings.showResolved" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'
import intelligentAlerts from '@/service/intelligentAlertsService'

const props = defineProps({
  maxItems: {
    type: Number,
    default: 5
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 30000 // 30 secondes
  }
})

const router = useRouter()

const loading = ref(false)
const alerts = ref([])
const stats = ref({
  total: 0,
  critical: 0,
  warning: 0,
  info: 0,
  resolved: 0
})
const currentPage = ref(0)
const itemsPerPage = ref(props.maxItems)
const showSettings = ref(false)
const settings = ref({
  soundEnabled: true,
  pushEnabled: false,
  showResolved: false
})
const hasNewAlerts = ref(false)

const activeAlertCount = computed(() => {
  return alerts.value.filter(a => !a.resolved).length
})

const paginatedAlerts = computed(() => {
  const start = currentPage.value * itemsPerPage.value
  const end = start + itemsPerPage.value
  return alerts.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(alerts.value.length / itemsPerPage.value)
})

function getAlertIcon(type) {
  const icons = {
    critical: 'pi pi-times-circle',
    warning: 'pi pi-exclamation-triangle',
    threshold: 'pi pi-chart-line',
    trend: 'pi pi-arrow-down-right',
    info: 'pi pi-info-circle'
  }
  return icons[type] || 'pi pi-bell'
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000) // secondes

  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

async function refresh() {
  loading.value = true
  try {
    const allAlerts = intelligentAlerts.getActiveAlerts()
    
    // Détecter nouvelles alertes
    if (allAlerts.length > alerts.value.length) {
      hasNewAlerts.value = true
      if (settings.value.soundEnabled) {
        playNotificationSound()
      }
      setTimeout(() => {
        hasNewAlerts.value = false
      }, 3000)
    }
    
    alerts.value = allAlerts
    stats.value = intelligentAlerts.getAlertStats()
  } catch (error) {
    console.error('Erreur chargement alertes:', error)
  } finally {
    loading.value = false
  }
}

function resolveAlert(alert) {
  intelligentAlerts.resolveAlert(alert.timestamp)
  alerts.value = alerts.value.filter(a => a.timestamp !== alert.timestamp)
  stats.value = intelligentAlerts.getAlertStats()
}

function dismissAlert(alert) {
  alerts.value = alerts.value.filter(a => a.timestamp !== alert.timestamp)
}

function handleAction(alert) {
  // Navigation ou action selon le type d'alerte
  console.log('Action alerte:', alert.action)
}

function onPageChange(event) {
  currentPage.value = event.page
}

function goToAlertsPage() {
  router.push('/admin/alerts')
}

function playNotificationSound() {
  // Audio notification (optionnel)
  const audio = new Audio('/notification.mp3')
  audio.volume = 0.3
  audio.play().catch(() => {})
}

// Auto-refresh
let refreshTimer
watch(() => props.autoRefresh, (enabled) => {
  if (enabled) {
    refreshTimer = setInterval(refresh, props.refreshInterval)
  } else if (refreshTimer) {
    clearInterval(refreshTimer)
  }
}, { immediate: true })

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.alerts-widget {
  height: 100%;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.header-left .pi-bell {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.bell-animation {
  animation: ring 1s ease-in-out infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-15deg); }
  20%, 40% { transform: rotate(15deg); }
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.alerts-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-card.critical {
  background: var(--red-50);
  border-color: var(--red-500);
}

.stat-card.warning {
  background: var(--yellow-50);
  border-color: var(--yellow-500);
}

.stat-card.info {
  background: var(--blue-50);
  border-color: var(--blue-500);
}

.stat-card i {
  font-size: 2rem;
}

.stat-card.critical i { color: var(--red-500); }
.stat-card.warning i { color: var(--yellow-600); }
.stat-card.info i { color: var(--blue-500); }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 4rem;
  color: var(--green-500);
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
  background: var(--surface-50);
  transition: all 0.3s ease;
}

.alert-item:hover {
  background: var(--surface-100);
  transform: translateX(4px);
}

.alert-item.alert-error {
  border-color: var(--red-500);
  background: var(--red-50);
}

.alert-item.alert-warn {
  border-color: var(--yellow-500);
  background: var(--yellow-50);
}

.alert-item.alert-info {
  border-color: var(--blue-500);
  background: var(--blue-50);
}

.alert-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
  font-size: 1.25rem;
}

.alert-error .alert-icon { color: var(--red-500); }
.alert-warn .alert-icon { color: var(--yellow-600); }
.alert-info .alert-icon { color: var(--blue-500); }

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.alert-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.alert-message {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.alert-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.alert-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.alerts-footer {
  margin-top: 1rem;
  text-align: center;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 6px;
  background: var(--surface-50);
}

/* Animations */
.alert-list-enter-active {
  transition: all 0.4s ease;
}

.alert-list-leave-active {
  transition: all 0.3s ease;
}

.alert-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.alert-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .alerts-stats {
    grid-template-columns: 1fr;
  }

  .alert-item {
    flex-direction: column;
  }

  .alert-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>
