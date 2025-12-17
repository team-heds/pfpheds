<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Dashboard RM Soins Infirmiers" 
        subtitle="Vue d'ensemble de vos modules et enseignements SI" 
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
              <i class="pi pi-user-edit"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Responsables de modules</span>
              <span class="stat-value">{{ responsablesCount }}</span>
            </div>
          </div>
        </div>

        <!-- Mes modules -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="pi pi-book"></i> 
              Mes Modules
              <Badge :value="myModules.length" severity="success" class="ml-2" />
            </h3>
          </div>
          <div class="modules-list">
            <div v-for="module in myModules" :key="module.id" class="module-item my-module-card">
              <div class="module-info">
                <div class="module-header-info">
                  <span class="module-number-large">{{ module.number }}</span>
                  <div>
                    <h4>{{ module.title }}</h4>
                    <p class="module-subtitle">
                      <Tag :value="`Année ${module.year}`" severity="info" class="mr-2" />
                      <span v-if="module.credits">{{ module.credits }} crédits ECTS</span>
                      <span v-if="module.heures_contact"> • {{ module.heures_contact }}h contact</span>
                    </p>
                  </div>
                </div>
              </div>
              <div class="module-actions">
                <Button label="Gérer" icon="pi pi-cog" @click="manageModule(module)" severity="primary" />
                <Button label="Planning" icon="pi pi-calendar" @click="viewPlanning(module)" severity="info" outlined />
              </div>
            </div>
            <div v-if="myModules.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun module dont vous êtes responsable</p>
              <small class="text-500">Contactez l'administrateur pour vous assigner des modules</small>
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

        <!-- Responsables de modules -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="pi pi-users"></i> 
              Responsables de Modules
              <Badge :value="responsablesCount" severity="success" class="ml-2" />
            </h3>
          </div>
          
          <div class="responsables-grid">
            <div 
              v-for="(modules, responsable) in modulesByResponsable" 
              :key="responsable"
              class="responsable-card"
            >
              <div class="responsable-header">
                <div class="responsable-info">
                  <i class="pi pi-user text-primary"></i>
                  <h4>{{ responsable }}</h4>
                </div>
                <Badge :value="modules.length" severity="info" />
              </div>
              
              <div class="modules-list-compact">
                <div 
                  v-for="module in modules" 
                  :key="module.id"
                  class="module-item-compact"
                >
                  <span class="module-number">{{ module.number }}</span>
                  <span class="module-title">{{ module.title }}</span>
                  <div class="module-meta">
                    <Tag :value="`Année ${module.year}`" severity="info" class="tag-small" />
                    <Tag v-if="module.credits" :value="`${module.credits} crédits`" class="tag-small" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="section-card">
          <h3><i class="pi pi-bolt"></i> Actions Rapides</h3>
          <div class="quick-actions">
            <Button label="Attribution Enseignants" icon="pi pi-users" severity="primary" @click="$router.push('/admin/teachers-assignment')" />
            <Button label="Planning Hebdomadaire" icon="pi pi-calendar" class="p-button-outlined" @click="$router.push('/admin/planning/weekly')" />
            <Button label="Gestion Modules" icon="pi pi-book" class="p-button-outlined" @click="$router.push('/admin/modules')" />
            <Button label="Calendrier Semestriel" icon="pi pi-calendar-plus" class="p-button-outlined" @click="$router.push('/admin/planning/semester')" />
          </div>
        </div>

        <!-- Alertes et Notifications -->
        <div class="section-card alerts-section">
          <h3><i class="pi pi-bell"></i> Alertes & Notifications</h3>
          <div class="alerts-list">
            <div v-if="alerts.length > 0">
              <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.type">
                <i :class="alert.icon"></i>
                <div class="alert-content">
                  <span class="alert-title">{{ alert.title }}</span>
                  <span class="alert-message">{{ alert.message }}</span>
                </div>
                <Button icon="pi pi-times" class="p-button-rounded p-button-text p-button-sm" @click="dismissAlert(alert)" />
              </div>
            </div>
            <div v-else class="no-alerts">
              <i class="pi pi-check-circle"></i>
              <span>Aucune alerte en cours</span>
            </div>
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
import Tag from 'primevue/tag';
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

// Alertes
const alerts = ref([
  {
    id: 1,
    type: 'warning',
    icon: 'pi pi-exclamation-triangle',
    title: 'Modules sans enseignant',
    message: 'Certains modules n\'ont pas encore d\'enseignant assigné'
  },
  {
    id: 2,
    type: 'info',
    icon: 'pi pi-info-circle',
    title: 'Planning à valider',
    message: 'Le planning du semestre prochain est prêt pour validation'
  }
]);

// Données
const modules = ref([]);
const teachers = ref([]);
const siTeachers = ref([]);
const searchSI = ref('');

// Modules de l'utilisateur connecté (filtrés par responsable)
const myModules = computed(() => {
  const userEmail = authStore.user?.email;
  if (!userEmail) return [];
  
  return supabaseModules.value.filter(module => {
    // Matcher par email du responsable OU par nom (pour compatibilité)
    return module.responsable_email === userEmail || 
           module.responsable?.toLowerCase().includes(userEmail.split('@')[0].toLowerCase());
  });
});

// Modules Supabase
const { modules: supabaseModules, loadModules } = useModules();

// Responsables de modules
const modulesByResponsable = computed(() => {
  const byResponsable = {};
  
  supabaseModules.value.forEach(module => {
    const responsable = module.responsable || 'Non assigné';
    
    if (!byResponsable[responsable]) {
      byResponsable[responsable] = [];
    }
    
    byResponsable[responsable].push({
      id: module.id,
      title: module.title,
      number: module.number,
      year: module.year,
      credits: module.credits
    });
  });
  
  // Trier les modules par numéro pour chaque responsable
  Object.keys(byResponsable).forEach(resp => {
    byResponsable[resp].sort((a, b) => {
      if (a.number && b.number) {
        return a.number.localeCompare(b.number, undefined, { numeric: true });
      }
      return a.title.localeCompare(b.title);
    });
  });
  
  return byResponsable;
});

const responsablesCount = computed(() => {
  return Object.keys(modulesByResponsable.value).filter(r => r !== 'Non assigné').length;
});

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
  // Rediriger vers la page de gestion du module (à créer)
  router.push(`/admin/modules/${module.id}/manage`);
}

function viewPlanning(module) {
  console.log('Voir planning du module:', module);
  // Rediriger vers le planning avec filtre sur ce module
  router.push(`/admin/planning?module=${module.id}`);
}

function contactTeacher(teacher) {
  window.location.href = `mailto:${teacher.email}`;
}

function dismissAlert(alert) {
  alerts.value = alerts.value.filter(a => a.id !== alert.id);
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

/* Responsables de modules */
.responsables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
}

.responsable-card {
  background: var(--surface-ground);
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--surface-border);
}

.responsable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--surface-border);
}

.responsable-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.responsable-info h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
}

.responsable-info i {
  font-size: 1.2rem;
}

.modules-list-compact {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.module-item-compact {
  padding: 0.75rem;
  background: var(--surface-card);
  border-radius: 0.5rem;
  border-left: 3px solid var(--primary-color);
  transition: all 0.2s;
}

.module-item-compact:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.module-number {
  display: inline-block;
  font-weight: 700;
  color: var(--primary-color);
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.module-title {
  color: var(--text-color);
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.5rem;
}

.module-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-small {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

/* Mes modules - Cartes enrichies */
.my-module-card {
  border: 2px solid var(--surface-border);
  transition: all 0.3s;
}

.my-module-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.module-header-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.module-number-large {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  min-width: 80px;
  text-align: center;
  background: var(--primary-50);
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.module-subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.module-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mr-2 {
  margin-right: 0.5rem;
}

.text-500 {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  display: block;
}

/* Alertes */
.alerts-section {
  border-left: 4px solid var(--primary-color);
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--surface-ground);
}

.alert-item.warning {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
}

.alert-item.warning i {
  color: #f59e0b;
}

.alert-item.info {
  background: #dbeafe;
  border-left: 3px solid #3b82f6;
}

.alert-item.info i {
  color: #3b82f6;
}

.alert-item.error {
  background: #fee2e2;
  border-left: 3px solid #ef4444;
}

.alert-item.error i {
  color: #ef4444;
}

.alert-item.success {
  background: #dcfce7;
  border-left: 3px solid #10b981;
}

.alert-item.success i {
  color: #10b981;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.alert-title {
  font-weight: 600;
  color: var(--text-color);
}

.alert-message {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.no-alerts {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #dcfce7;
  border-radius: 0.5rem;
  color: #16a34a;
}

.no-alerts i {
  font-size: 1.25rem;
}
</style>
