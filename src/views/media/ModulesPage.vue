<template>
  <AdminLayout>
  <div class="modules-page">
    <div class="page-header">
      <h1>Modules Vidéo</h1>
      <p>Gestion et validation des modules de formation</p>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="search-bar">
        <InputText 
          v-model="searchQuery" 
          placeholder="Rechercher un module..." 
          class="search-input"
        />
        <Button icon="pi pi-search" class="search-btn" />
        <Button 
          icon="pi pi-refresh" 
          @click="refreshModules"
          :loading="loading"
          v-tooltip="'Actualiser les modules'"
          class="refresh-btn"
        />
      </div>
      
      <div class="filter-buttons">
        <Button 
          :class="{ 'active': selectedStatus === 'all' }"
          @click="selectedStatus = 'all'"
          label="Tous" 
          outlined 
        />
        <Button 
          :class="{ 'active': selectedStatus === 'pending' }"
          @click="selectedStatus = 'pending'"
          label="En attente" 
          outlined 
        />
        <Button 
          :class="{ 'active': selectedStatus === 'validated' }"
          @click="selectedStatus = 'validated'"
          label="Validés" 
          outlined 
        />
        <Button 
          :class="{ 'active': selectedStatus === 'rejected' }"
          @click="selectedStatus = 'rejected'"
          label="À revoir" 
          outlined 
        />
      </div>
    </div>

    <!-- Grille des modules -->
    <div class="modules-grid">
      <div 
        v-for="module in filteredModules" 
        :key="module.id"
        class="module-card"
        @click="navigateToModule(module.id)"
      >
        <!-- Thumbnail du module -->
        <div class="module-thumbnail">
          <img 
            :src="module.thumbnail || '/default-module.jpg'" 
            :alt="module.name"
            class="thumbnail-image"
          />
          <div class="video-count-badge">
            {{ module.videoCount }} vidéos
          </div>
          <div class="status-badge" :class="module.status">
            <i :class="getStatusIcon(module.status)"></i>
            {{ getStatusLabel(module.status) }}
          </div>
        </div>

        <!-- Informations du module -->
        <div class="module-info">
          <h3 class="module-title">{{ module.name }}</h3>
          <p class="module-description">{{ module.description }}</p>
          
          <div class="module-stats">
            <div class="stat">
              <i class="pi pi-video"></i>
              <span>{{ module.videoCount }} vidéos</span>
            </div>
            <div class="stat">
              <i class="pi pi-check-circle"></i>
              <span>{{ module.validatedCount }} validées</span>
            </div>
            <div class="stat">
              <i class="pi pi-clock"></i>
              <span>{{ module.pendingCount }} en attente</span>
            </div>
          </div>

          <div class="module-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: module.progressPercentage + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ module.progressPercentage }}% complété</span>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="module-actions">
          <Button 
            icon="pi pi-eye" 
            class="action-btn"
            @click.stop="navigateToModule(module.id)"
            v-tooltip="'Voir les vidéos'"
          />
          <Button 
            icon="pi pi-share-alt" 
            class="action-btn"
            @click.stop="shareModule(module)"
            v-tooltip="'Partager le module'"
          />
          <Button 
            icon="pi pi-cog" 
            class="action-btn"
            @click.stop="editModule(module)"
            v-tooltip="'Paramètres'"
          />
        </div>
      </div>
    </div>

    <!-- Message si aucun module -->
    <div v-if="filteredModules.length === 0" class="no-modules">
      <i class="pi pi-folder-open"></i>
      <h3>Aucun module trouvé</h3>
      <p>Aucun module ne correspond à vos critères de recherche.</p>
    </div>
  </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { getAllModules } from '@/service/mediaService'
import Navbar from '@/components/common/utils/Navbar.vue'

const router = useRouter()

// État réactif
const searchQuery = ref('')
const selectedStatus = ref('all')
const modules = ref([])
const loading = ref(false)

// Computed
const filteredModules = computed(() => {
  let filtered = modules.value

  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(module => 
      module.name.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query)
    )
  }

  // Filtrer par statut
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(module => module.status === selectedStatus.value)
  }

  return filtered
})

// Méthodes
const navigateToModule = (moduleId) => {
  router.push(`/modules/${moduleId}/videos`)
}

const shareModule = (module) => {
  const url = `${window.location.origin}/modules/${module.id}/videos`
  navigator.clipboard.writeText(url).then(() => {
    // Toast notification
    console.log('Lien du module copié !')
  })
}

const editModule = (module) => {
  console.log('Éditer module:', module.name)
  // Ouvrir modal d'édition
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'validated': return 'pi pi-check-circle'
    case 'rejected': return 'pi pi-times-circle'
    case 'pending': return 'pi pi-clock'
    default: return 'pi pi-circle'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'validated': return 'Validé'
    case 'rejected': return 'À revoir'
    case 'pending': return 'En attente'
    default: return 'Inconnu'
  }
}

const refreshModules = async () => {
  loading.value = true
  try {
    modules.value = await getAllModules()
    console.log('[ModulesPage] Modules actualisés:', modules.value)
  } catch (error) {
    console.error('[ModulesPage] Erreur lors de l\'actualisation des modules:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  try {
    modules.value = await getAllModules()
    console.log('[ModulesPage] Modules chargés:', modules.value)
  } catch (error) {
    console.error('[ModulesPage] Erreur lors du chargement des modules:', error)
  }
})
</script>

<style scoped>
.modules-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.page-header p {
  font-size: 1.1rem;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}

.search-input {
  flex: 1;
}

.refresh-btn {
  background: var(--primary-color);
  border: none;

}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-buttons .p-button.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.module-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.module-thumbnail {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-count-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-badge.validated {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.9);
  color: white;
}

.module-info {
  padding: 1.5rem;
}

.module-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.module-description {
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.module-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.stat i {
  color: var(--primary-color);
}

.module-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.module-actions {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.module-card:hover .module-actions {
  opacity: 1;
}

.action-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-modules {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.no-modules i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.no-modules h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .modules-page {
    padding: 1rem;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    max-width: none;
  }
  
  .modules-grid {
    grid-template-columns: 1fr;
  }
}
</style>
