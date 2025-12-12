<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Dashboard Responsable Module" 
        subtitle="Vue d'ensemble de vos modules et enseignements" 
        icon="pi pi-chart-line" 
      />
    </template>

    <div class="dashboard-rm">
      <!-- Loading spinner -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Chargement des données...</p>
      </div>

      <div v-else class="dashboard-grid">
        
        <!-- Statistiques rapides -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon" style="background: #3b82f6;">
              <i class="pi pi-book"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Modules gérés</span>
              <span class="stat-value">{{ modulesCount }}</span>
              <div class="stat-details">
                <span class="stat-badge active">{{ activeModulesCount }} 1ère année</span>
                <span class="stat-badge draft">{{ draftModulesCount }} 2ème année</span>
                <span class="stat-badge archived">{{ archivedModulesCount }} 3ème année</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #10b981;">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Enseignants SI</span>
              <span class="stat-value">{{ siTeachersCount }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #f59e0b;">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Heures totales</span>
              <span class="stat-value">{{ totalHours }}h</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #8b5cf6;">
              <i class="pi pi-graduation-cap"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Étudiants</span>
              <span class="stat-value">{{ studentsCount }}</span>
            </div>
          </div>
        </div>

        <!-- Mes modules -->
        <div class="section-card">
          <h3><i class="pi pi-book"></i> Mes Modules</h3>
          <div class="modules-list">
            <div v-for="module in modules" :key="module.id" class="module-item">
              <div class="module-info">
                <h4>{{ module.name }}</h4>
                <p>{{ module.code }} - {{ module.hours }}h</p>
              </div>
              <Button label="Gérer" icon="pi pi-cog" @click="manageModule(module)" />
            </div>
            <div v-if="modules.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun module assigné</p>
            </div>
          </div>
        </div>

        <!-- Enseignants du module -->
        <div class="section-card">
          <h3><i class="pi pi-users"></i> Mes Enseignants</h3>
          <div class="teachers-list">
            <div v-for="teacher in teachers" :key="teacher.id" class="teacher-item">
              <div class="teacher-info">
                <h4>{{ teacher.name }}</h4>
                <p>{{ teacher.email }}</p>
              </div>
              <span class="hours-badge">{{ teacher.hours }}h</span>
            </div>
            <div v-if="teachers.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun enseignant assigné</p>
            </div>
          </div>
        </div>

        <!-- Tous les Enseignants SI -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="pi pi-id-card"></i> 
              Liste des Enseignants SI
              <Badge :value="filteredSITeachers.length" severity="info" class="ml-2" />
            </h3>
            <span class="p-input-icon-left search-box">
              <i class="pi pi-search" />
              <InputText v-model="searchSI" placeholder="Rechercher..." class="p-inputtext-sm" />
            </span>
          </div>
          
          <div class="teachers-list scrollable-list">
            <div v-for="teacher in filteredSITeachers" :key="teacher.id" class="teacher-item">
              <div class="teacher-info">
                <h4>{{ teacher.name }}</h4>
                <p>{{ teacher.email }}</p>
              </div>
              <Button icon="pi pi-envelope" class="p-button-rounded p-button-text p-button-sm" @click="contactTeacher(teacher)" />
            </div>
            <div v-if="filteredSITeachers.length === 0" class="empty-state">
              <i class="pi pi-users"></i>
              <p>Aucun enseignant trouvé</p>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="section-card">
          <h3><i class="pi pi-bolt"></i> Actions Rapides</h3>
          <div class="quick-actions">
            <Button label="Gérer les Enseignants" icon="pi pi-users" class="p-button-outlined" @click="$router.push('/admin/teachers-si')" />
            <Button label="Planning" icon="pi pi-calendar" class="p-button-outlined" @click="$router.push('/admin/planning/weekly')" />
            <Button label="Liste des Cours" icon="pi pi-list" class="p-button-outlined" @click="$router.push('/admin/courses/list')" />
            <Button label="Créer un Cours" icon="pi pi-plus" @click="$router.push('/admin/courses/create')" />
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import InputText from 'primevue/inputtext';
import Badge from 'primevue/badge';
import { getAllRMData } from '@/services/academicKpiService';
import { useModules } from '@/composables/useModules';

const router = useRouter();
const authStore = useAuthStore();

// Loading
const loading = ref(true);

// Stats
const modulesCount = ref(0);
const teachersCount = ref(0);
const totalHours = ref(0);
const studentsCount = ref(0);

// Stats modules détaillées
const activeModulesCount = ref(0);
const draftModulesCount = ref(0);
const archivedModulesCount = ref(0);

// Stats enseignants détaillées
const siTeachersCount = ref(0);

// Données
const modules = ref([]);
const teachers = ref([]);
const siTeachers = ref([]);
const searchSI = ref('');

// Modules Supabase
const { modules: supabaseModules, loadModules } = useModules();

const filteredSITeachers = computed(() => {
  if (!searchSI.value) return siTeachers.value;
  const term = searchSI.value.toLowerCase();
  return siTeachers.value.filter(t => 
    t.name.toLowerCase().includes(term) || 
    t.email.toLowerCase().includes(term)
  );
});

/**
 * Charge les données RM depuis Supabase/Firebase
 */
async function loadRMData() {
  loading.value = true;
  
  try {
    const userId = authStore.user?.id || authStore.user?.uid;
    
    if (!userId) {
      console.warn('⚠️ Aucun utilisateur connecté');
      loading.value = false;
      return;
    }
    
    console.log('🔄 Chargement données RM pour:', userId);
    
    // Charger les modules depuis Supabase
    await loadModules();
    
    // Calculer les stats par année (pour les modules Supabase)
    // Les modules Supabase ont une propriété 'year' (1, 2, 3)
    const year1Modules = supabaseModules.value.filter(m => m.year === 1).length;
    const year2Modules = supabaseModules.value.filter(m => m.year === 2).length;
    const year3Modules = supabaseModules.value.filter(m => m.year === 3).length;
    
    activeModulesCount.value = year1Modules;
    draftModulesCount.value = year2Modules;
    archivedModulesCount.value = year3Modules;
    
    const data = await getAllRMData(userId);
    
    // Mettre à jour les données
    modules.value = data.modules;
    teachers.value = data.teachers;
    siTeachers.value = data.siTeachers || [];
    
    // Calculer les stats enseignants
    siTeachersCount.value = siTeachers.value.length;
    
    // Mettre à jour les stats
    modulesCount.value = supabaseModules.value.length; // Utiliser le comptage réel des modules
    teachersCount.value = data.stats.teachersCount;
    totalHours.value = data.stats.totalHours;
    studentsCount.value = data.stats.studentsCount;
    
    console.log('✅ Données RM chargées');
    console.log('📚 Modules:', {
      total: modulesCount.value,
      active: activeModulesCount.value,
      draft: draftModulesCount.value,
      archived: archivedModulesCount.value
    });
    console.log('👥 Enseignants SI:', siTeachersCount.value);
  } catch (error) {
    console.error('❌ Erreur chargement données RM:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadRMData();
});

function manageModule(module) {
  console.log('Gérer module:', module);
  router.push(`/admin/courses/${module.id}`);
}

function contactTeacher(teacher) {
  window.location.href = `mailto:${teacher.email}`;
}
</script>

<style scoped>
.dashboard-rm {
  padding: 2rem;
}

.dashboard-grid {
  display: grid;
  gap: 1.5rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-details {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.stat-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  white-space: nowrap;
}

.stat-badge.active {
  background: #dcfce7;
  color: #16a34a;
}

.stat-badge.draft {
  background: #fef3c7;
  color: #d97706;
}

.stat-badge.archived {
  background: #f3f4f6;
  color: #6b7280;
}

.stat-badge.si {
  background: #dbeafe;
  color: #2563eb;
}

.section-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-card h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modules-list, .teachers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scrollable-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.module-item, .teacher-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.module-info h4, .teacher-info h4 {
  margin: 0 0 0.25rem 0;
  color: var(--text-color);
}

.module-info p, .teacher-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.hours-badge {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.loading-container p {
  color: var(--text-color-secondary);
  font-size: 1.1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
}

.search-box {
  width: 250px;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>
