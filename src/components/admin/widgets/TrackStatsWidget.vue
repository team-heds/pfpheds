<template>
  <div class="track-stats-widget">
    <div class="widget-header">
      <h3><i class="pi pi-chart-bar"></i> Stats par Filière</h3>
      <Button icon="pi pi-refresh" class="p-button-text p-button-sm" @click="loadStats" :loading="loading" />
    </div>

    <div v-if="loading" class="loading-state">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else class="widget-content">
      <!-- Graphique barres SI vs PHY -->
      <div class="stats-comparison">
        <div class="track-bar si-bar">
          <div class="track-label">
            <span class="track-name">SI</span>
            <span class="track-value">{{ stats.si?.modules || 0 }} modules</span>
          </div>
          <div class="bar-container">
            <div class="bar-fill si" :style="{ width: siPercent + '%' }"></div>
          </div>
          <div class="track-details">
            <span><i class="pi pi-users"></i> {{ stats.si?.teachers || 0 }} enseignants</span>
            <span><i class="pi pi-user-edit"></i> {{ stats.si?.rm || 0 }} RM</span>
          </div>
        </div>

        <div class="track-bar phy-bar">
          <div class="track-label">
            <span class="track-name">PHY</span>
            <span class="track-value">{{ stats.phy?.modules || 0 }} modules</span>
          </div>
          <div class="bar-container">
            <div class="bar-fill phy" :style="{ width: phyPercent + '%' }"></div>
          </div>
          <div class="track-details">
            <span><i class="pi pi-users"></i> {{ stats.phy?.teachers || 0 }} enseignants</span>
            <span><i class="pi pi-user-edit"></i> {{ stats.phy?.rm || 0 }} RM</span>
          </div>
        </div>
      </div>

      <!-- Totaux -->
      <div class="totals-row">
        <div class="total-item">
          <span class="total-value">{{ stats.totalModules || 0 }}</span>
          <span class="total-label">Modules total</span>
        </div>
        <div class="total-item">
          <span class="total-value">{{ stats.totalUsersWithRoles || 0 }}</span>
          <span class="total-label">Utilisateurs avec rôles</span>
        </div>
        <div class="total-item warning" v-if="stats.modulesNoTrack > 0">
          <span class="total-value">{{ stats.modulesNoTrack }}</span>
          <span class="total-label">Sans filière</span>
        </div>
      </div>

      <!-- Modules sans RM -->
      <div v-if="modulesWithoutRM.length > 0" class="modules-without-rm">
        <div class="section-title">
          <i class="pi pi-exclamation-triangle"></i>
          Modules sans responsable ({{ modulesWithoutRM.length }})
        </div>
        <div class="modules-list">
          <div v-for="m in modulesWithoutRM.slice(0, 5)" :key="m.id" class="module-item">
            <span class="module-code">{{ m.code }}</span>
            <span class="module-title">{{ m.title }}</span>
            <Tag :value="m.track_id || '—'" :severity="m.track_id === 'SI' ? 'info' : 'success'" size="small" />
          </div>
          <div v-if="modulesWithoutRM.length > 5" class="more-link">
            <Button 
              label="Voir tout" 
              icon="pi pi-arrow-right" 
              class="p-button-text p-button-sm"
              @click="$router.push('/admin/role-management')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import { getGlobalStats, getModulesWithRM } from '@/service/adminDashboardService'

const loading = ref(true)
const stats = ref({})
const modules = ref([])

const siPercent = computed(() => {
  const total = (stats.value.si?.modules || 0) + (stats.value.phy?.modules || 0)
  if (total === 0) return 50
  return Math.round((stats.value.si?.modules || 0) / total * 100)
})

const phyPercent = computed(() => {
  return 100 - siPercent.value
})

const modulesWithoutRM = computed(() => {
  return modules.value.filter(m => !m.responsable_email)
})

async function loadStats() {
  loading.value = true
  try {
    const [globalStats, allModules] = await Promise.all([
      getGlobalStats(),
      getModulesWithRM()
    ])
    stats.value = globalStats
    modules.value = allModules
  } catch (error) {
    console.error('Erreur chargement stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.track-stats-widget {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.widget-header h3 {
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.stats-comparison {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.track-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.track-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.track-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.si-bar .track-name { color: #3b82f6; }
.phy-bar .track-name { color: #10b981; }

.track-value {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.bar-container {
  height: 12px;
  background: var(--surface-200);
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.bar-fill.si { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.bar-fill.phy { background: linear-gradient(90deg, #10b981, #34d399); }

.track-details {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.track-details i {
  margin-right: 0.25rem;
}

.totals-row {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.total-item {
  text-align: center;
}

.total-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.total-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.total-item.warning .total-value {
  color: #f59e0b;
}

.modules-without-rm {
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #f59e0b;
  margin-bottom: 0.75rem;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.module-code {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 120px;
}

.module-title {
  flex: 1;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-link {
  text-align: center;
  margin-top: 0.5rem;
}
</style>
