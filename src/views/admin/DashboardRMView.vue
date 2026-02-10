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
              <span class="stat-label">Heures contact</span>
              <span class="stat-value">{{ totalHours }}h</span>
              <div class="stat-details">
                <span class="stat-badge active">{{ hoursAssigned }}h assignées</span>
              </div>
            </div>
          </div>

          <div class="stat-card completion-card">
            <div class="stat-icon" :style="{ background: completionPercent >= 80 ? '#10b981' : completionPercent >= 50 ? '#f59e0b' : '#ef4444' }">
              <i class="pi pi-chart-pie"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Taux d'assignation</span>
              <span class="stat-value">{{ completionPercent }}%</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: completionPercent + '%', background: completionPercent >= 80 ? '#10b981' : completionPercent >= 50 ? '#f59e0b' : '#ef4444' }"></div>
              </div>
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
                    <p class="module-roles mt-1">
                      <Tag v-if="module.responsable_email === authStore.user?.email" value="Responsable" severity="success" class="mr-1" />
                      <Tag v-if="module.coordinateur?.split(',').map(e => e.trim().toLowerCase()).includes(authStore.user?.email?.toLowerCase())" value="Coordinateur" severity="warning" />
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
              <p>Aucun module dont vous êtes responsable ou coordinateur</p>
              <small class="text-500">Contactez l'administrateur pour vous assigner des modules</small>
            </div>
          </div>
        </div>

        <!-- Enseignants de mes modules -->
        <div class="section-card">
          <div class="section-header">
            <h3>
              <i class="pi pi-users"></i> 
              Enseignants de mes modules
              <Badge :value="myTeachers.length" severity="info" class="ml-2" />
            </h3>
          </div>
          <div class="teachers-list">
            <div v-for="teacher in myTeachers" :key="teacher.id" class="teacher-item">
              <div class="teacher-avatar">
                <img v-if="teacher.avatar" :src="teacher.avatar" :alt="teacher.name" />
                <i v-else class="pi pi-user"></i>
              </div>
              <div class="teacher-info">
                <h4>{{ teacher.name }}</h4>
                <p>{{ teacher.email }}</p>
                <small class="text-500">{{ teacher.modulesCount }} module(s)</small>
              </div>
              <div class="teacher-hours">
                <span class="hours-badge">{{ teacher.totalHours }}h</span>
                <Button icon="pi pi-envelope" class="p-button-rounded p-button-text p-button-sm" @click="contactTeacher(teacher)" />
              </div>
            </div>
            <div v-if="myTeachers.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun enseignant assigné à vos modules</p>
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

        <!-- Vue globale Planning -->
        <div class="section-card planning-overview">
          <div class="section-header">
            <h3>
              <i class="pi pi-calendar"></i> 
              Vue globale du Planning
            </h3>
            <Button icon="pi pi-refresh" text @click="loadPlanningOverview" :loading="loadingPlanning" />
          </div>
          
          <div class="planning-stats-grid">
            <div class="planning-stat-item">
              <div class="stat-circle" :class="planningStats.validatedPercent >= 80 ? 'success' : planningStats.validatedPercent >= 50 ? 'warning' : 'danger'">
                {{ planningStats.validatedPercent }}%
              </div>
              <span>Validés</span>
            </div>
            <div class="planning-stat-item">
              <div class="stat-circle info">{{ planningStats.pendingCount }}</div>
              <span>En attente</span>
            </div>
            <div class="planning-stat-item">
              <div class="stat-circle" :class="planningStats.conflictsCount > 0 ? 'danger' : 'success'">{{ planningStats.conflictsCount }}</div>
              <span>Conflits</span>
            </div>
            <div class="planning-stat-item">
              <div class="stat-circle" :class="planningStats.hoursDiff === 0 ? 'success' : planningStats.hoursDiff > 0 ? 'info' : 'warning'">
                {{ planningStats.hoursDiff >= 0 ? '+' : '' }}{{ planningStats.hoursDiff }}h
              </div>
              <span>Écart heures</span>
            </div>
          </div>

          <!-- Modules avec problèmes -->
          <div v-if="modulesWithIssues.length > 0" class="issues-list mt-3">
            <h4 class="text-sm text-600 mb-2">Modules nécessitant attention :</h4>
            <div v-for="issue in modulesWithIssues.slice(0, 5)" :key="issue.moduleId" class="issue-item">
              <Tag :value="issue.type" :severity="issue.severity" class="text-xs" />
              <span class="ml-2">{{ issue.moduleName }}</span>
              <span class="text-500 text-sm ml-auto">{{ issue.details }}</span>
              <Button icon="pi pi-arrow-right" text size="small" @click="goToModule(issue.moduleId)" />
            </div>
          </div>
          <div v-else class="text-center py-3 text-500">
            <i class="pi pi-check-circle text-success mr-2"></i>
            Tous les plannings sont en ordre
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
import { getMyModules, getModulesTeachers, calculateStats } from '@/services/rmDashboardService';
import { useModules } from '@/composables/useModules';
import { supabase } from '@/supabase';

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

// Alertes dynamiques (calculées à partir des données)
const alerts = ref([]);

// Planning overview
const loadingPlanning = ref(false);
const planningStats = ref({
  validatedPercent: 0,
  pendingCount: 0,
  conflictsCount: 0,
  hoursDiff: 0
});
const modulesWithIssues = ref([]);

// Stats avancées
const modulesWithoutTeachers = ref([]);
const hoursAssigned = ref(0);
const hoursPlanned = ref(0);
const completionPercent = ref(0);

// Données
const modules = ref([]);
const teachers = ref([]);
const siTeachers = ref([]);
const searchSI = ref('');

// Modules dont l'utilisateur est responsable (chargés depuis le service)
const myModules = ref([]);

// Enseignants de mes modules
const myTeachers = ref([]);

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
 * Charge les données RM depuis Supabase
 */
async function loadRMData() {
  loading.value = true;
  
  try {
    const userId = authStore.user?.id || authStore.user?.uid;
    const userEmail = authStore.user?.email;
    
    if (!userId) {
      console.warn('⚠️ Aucun utilisateur connecté');
      loading.value = false;
      return;
    }
    
    console.log('🔄 Chargement données RM pour:', userEmail);
    
    // 1. Charger tous les modules (pour la vue d'ensemble)
    await loadModules();
    
    // 2. Charger MES modules (dont je suis responsable)
    myModules.value = await getMyModules(userId, userEmail);
    console.log('📚 Mes modules:', myModules.value.length);
    
    // 3. Charger les enseignants de mes modules
    if (myModules.value.length > 0) {
      myTeachers.value = await getModulesTeachers(myModules.value);
      console.log('👨‍🏫 Mes enseignants:', myTeachers.value.length);
    }
    
    // 4. Calculer les stats de mes modules
    const stats = calculateStats(myModules.value, myTeachers.value);
    modulesCount.value = stats.modulesCount;
    totalHours.value = stats.totalHours;
    activeModulesCount.value = stats.modulesByYear[1] || 0;
    draftModulesCount.value = stats.modulesByYear[2] || 0;
    archivedModulesCount.value = stats.modulesByYear[3] || 0;
    
    // 5. Stats enseignants
    siTeachersCount.value = myTeachers.value.length;
    teachers.value = myTeachers.value;
    siTeachers.value = myTeachers.value;
    
    // 6. Calculer heures assignées
    hoursAssigned.value = myTeachers.value.reduce((sum, t) => sum + (t.totalHours || 0), 0);
    hoursPlanned.value = totalHours.value;
    completionPercent.value = hoursPlanned.value > 0 
      ? Math.round((hoursAssigned.value / hoursPlanned.value) * 100) 
      : 0;
    
    // 7. Identifier modules sans enseignants
    modulesWithoutTeachers.value = myModules.value.filter(m => {
      const moduleTeachers = myTeachers.value.filter(t => 
        t.courses?.some(c => c.moduleId === m.id)
      );
      return moduleTeachers.length === 0;
    });
    
    // 8. Générer alertes dynamiques
    generateAlerts();
    
    // 9. Charger la vue d'ensemble du planning
    await loadPlanningOverview();
    
    console.log('✅ Données RM chargées');
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

function goToModule(moduleId) {
  router.push(`/admin/modules/${moduleId}/manage`);
}

/**
 * Charge la vue d'ensemble du planning pour tous les modules
 */
async function loadPlanningOverview() {
  if (myModules.value.length === 0) return;
  
  loadingPlanning.value = true;
  try {
    const moduleCodes = myModules.value.map(m => m.code).filter(Boolean);
    
    // 1. Charger les validations
    const { data: validations } = await supabase
      .from('planning_validations')
      .select('*')
      .in('module_code', moduleCodes);
    
    const validatedCount = (validations || []).filter(v => v.status === 'validated').length;
    const pendingCount = (validations || []).filter(v => v.status === 'pending').length;
    const totalModules = myModules.value.length;
    
    planningStats.value.validatedPercent = totalModules > 0 ? Math.round((validatedCount / totalModules) * 100) : 0;
    planningStats.value.pendingCount = pendingCount;
    
    // 2. Charger les créneaux pour détecter les conflits
    const { data: slots } = await supabase
      .from('planning_time_slots')
      .select('*')
      .in('module_code', moduleCodes);
    
    // Détecter les conflits (même prof, même jour, même heure)
    let conflictsCount = 0;
    const slotsList = slots || [];
    for (let i = 0; i < slotsList.length; i++) {
      for (let j = i + 1; j < slotsList.length; j++) {
        const a = slotsList[i], b = slotsList[j];
        if (a.week_number === b.week_number && a.day === b.day) {
          const overlap = (a.start_time || '00:00') < (b.end_time || '23:59') && 
                          (b.start_time || '00:00') < (a.end_time || '23:59');
          if (overlap) {
            const teachersA = (a.teachers || []).map(t => typeof t === 'object' ? t.name : t);
            const teachersB = (b.teachers || []).map(t => typeof t === 'object' ? t.name : t);
            if (teachersA.some(t => teachersB.includes(t))) {
              conflictsCount++;
            }
          }
        }
      }
    }
    planningStats.value.conflictsCount = conflictsCount;
    
    // 3. Charger les budgets heures
    const { data: budgets } = await supabase
      .from('module_hours_budget')
      .select('*')
      .in('module_code', moduleCodes);
    
    const plannedHours = slotsList.reduce((sum, s) => {
      if (!s.start_time || !s.end_time) return sum;
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      return sum + (eh + em/60) - (sh + sm/60);
    }, 0);
    
    const budgetHours = (budgets || []).reduce((sum, b) => sum + (b.planned_hours || 0), 0) || 
                        myModules.value.reduce((sum, m) => sum + (m.heures_contact || 0), 0);
    
    planningStats.value.hoursDiff = Math.round((plannedHours - budgetHours) * 10) / 10;
    
    // 4. Identifier les modules avec problèmes
    const issues = [];
    
    myModules.value.forEach(m => {
      const moduleSlots = slotsList.filter(s => s.module_code === m.code);
      const moduleValidation = (validations || []).find(v => v.module_code === m.code);
      
      // Pas de planning
      if (moduleSlots.length === 0) {
        issues.push({
          moduleId: m.id,
          moduleName: m.title,
          type: 'Sans planning',
          severity: 'danger',
          details: 'Aucune séance planifiée'
        });
      }
      
      // En attente de validation
      if (moduleValidation?.status === 'pending') {
        issues.push({
          moduleId: m.id,
          moduleName: m.title,
          type: 'En attente',
          severity: 'warning',
          details: 'Validation en attente'
        });
      }
      
      // Heures insuffisantes
      const moduleHours = moduleSlots.reduce((sum, s) => {
        if (!s.start_time || !s.end_time) return sum;
        const [sh, sm] = s.start_time.split(':').map(Number);
        const [eh, em] = s.end_time.split(':').map(Number);
        return sum + (eh + em/60) - (sh + sm/60);
      }, 0);
      const expectedHours = m.heures_contact || 0;
      if (expectedHours > 0 && moduleHours < expectedHours * 0.8) {
        issues.push({
          moduleId: m.id,
          moduleName: m.title,
          type: 'Heures manquantes',
          severity: 'info',
          details: `${Math.round(moduleHours)}h / ${expectedHours}h prévues`
        });
      }
    });
    
    modulesWithIssues.value = issues;
    
  } catch (error) {
    console.error('Erreur chargement planning overview:', error);
  } finally {
    loadingPlanning.value = false;
  }
}

/**
 * Génère les alertes dynamiques basées sur les données
 */
function generateAlerts() {
  const newAlerts = [];
  let alertId = 1;
  
  // Alerte: Modules sans enseignant
  if (modulesWithoutTeachers.value.length > 0) {
    newAlerts.push({
      id: alertId++,
      type: 'warning',
      icon: 'pi pi-exclamation-triangle',
      title: `${modulesWithoutTeachers.value.length} module(s) sans enseignant`,
      message: modulesWithoutTeachers.value.map(m => m.title).slice(0, 3).join(', ') + 
               (modulesWithoutTeachers.value.length > 3 ? '...' : '')
    });
  }
  
  // Alerte: Faible taux d'assignation
  if (completionPercent.value < 50 && myModules.value.length > 0) {
    newAlerts.push({
      id: alertId++,
      type: 'danger',
      icon: 'pi pi-times-circle',
      title: 'Taux d\'assignation faible',
      message: `Seulement ${completionPercent.value}% des heures sont assignées (${hoursAssigned.value}h / ${hoursPlanned.value}h)`
    });
  } else if (completionPercent.value >= 50 && completionPercent.value < 80) {
    newAlerts.push({
      id: alertId++,
      type: 'info',
      icon: 'pi pi-info-circle',
      title: 'Assignation en cours',
      message: `${completionPercent.value}% des heures assignées - continuez !`
    });
  }
  
  // Alerte: Tous les modules assignés
  if (completionPercent.value >= 80 && myModules.value.length > 0) {
    newAlerts.push({
      id: alertId++,
      type: 'success',
      icon: 'pi pi-check-circle',
      title: 'Bonne progression !',
      message: `${completionPercent.value}% des heures sont assignées`
    });
  }
  
  // Alerte: Aucun module
  if (myModules.value.length === 0) {
    newAlerts.push({
      id: alertId++,
      type: 'info',
      icon: 'pi pi-info-circle',
      title: 'Aucun module assigné',
      message: 'Contactez l\'administrateur pour vous assigner des modules en tant que responsable ou coordinateur'
    });
  }
  
  alerts.value = newAlerts;
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

/* Barre de progression */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--surface-200);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.alert-item.error,
.alert-item.danger {
  background: #fee2e2;
  border-left: 3px solid #ef4444;
}

.alert-item.error i,
.alert-item.danger i {
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

/* Teacher avatar et heures */
.teacher-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface-200);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.teacher-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-avatar i {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
}

.teacher-hours {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.teacher-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.teacher-item:hover {
  background: var(--surface-100);
}

/* Header avec sélecteur de filière */
.header-with-track {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.track-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.track-selector :deep(.p-selectbutton) {
  border-radius: 0.5rem;
}

.track-selector :deep(.p-selectbutton .p-button) {
  padding: 0.5rem 1rem;
  font-weight: 600;
}

.track-selector :deep(.p-selectbutton .p-button.p-highlight) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

/* Planning Overview */
.planning-overview {
  border-left: 4px solid var(--primary-color);
}

.planning-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.planning-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
}

.stat-circle.success { background: #10b981; }
.stat-circle.warning { background: #f59e0b; }
.stat-circle.danger { background: #ef4444; }
.stat-circle.info { background: #3b82f6; }

.issues-list {
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: var(--surface-50);
  margin-bottom: 0.5rem;
}

.issue-item:hover {
  background: var(--surface-100);
}

@media (max-width: 768px) {
  .planning-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
