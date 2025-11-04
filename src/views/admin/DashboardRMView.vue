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
      <div class="dashboard-grid">
        
        <!-- Statistiques rapides -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon" style="background: #3b82f6;">
              <i class="pi pi-book"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Modules gérés</span>
              <span class="stat-value">{{ modulesCount }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #10b981;">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-info">
              <span class="stat-label">Enseignants</span>
              <span class="stat-value">{{ teachersCount }}</span>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';

const router = useRouter();

// Stats
const modulesCount = ref(0);
const teachersCount = ref(0);
const totalHours = ref(0);
const studentsCount = ref(0);

// Données
const modules = ref([]);
const teachers = ref([]);

onMounted(async () => {
  // TODO: Charger les données réelles depuis Supabase
  modulesCount.value = 3;
  teachersCount.value = 8;
  totalHours.value = 120;
  studentsCount.value = 45;
  
  // Données de démo
  modules.value = [
    { id: 1, name: 'Anatomie', code: 'ANA101', hours: 40 },
    { id: 2, name: 'Physiologie', code: 'PHY101', hours: 50 },
    { id: 3, name: 'Pathologie', code: 'PAT101', hours: 30 }
  ];
  
  teachers.value = [
    { id: 1, name: 'Dr. Martin Dubois', email: 'martin.dubois@heds.ch', hours: 20 },
    { id: 2, name: 'Prof. Sophie Renaud', email: 'sophie.renaud@heds.ch', hours: 30 }
  ];
});

function manageModule(module) {
  console.log('Gérer module:', module);
  // TODO: Navigation vers la gestion du module
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
</style>
