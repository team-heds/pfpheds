<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        :title="pageTitle" 
        :subtitle="pageSubtitle" 
        icon="pi pi-graduation-cap" 
      />
    </template>

    <div class="dashboard-enseignant">
      <!-- Loading spinner -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Chargement des données...</p>
      </div>

      <EmptyState
        v-else-if="audienceError"
        icon="pi pi-user-minus"
        title="Profil enseignant SI introuvable"
        :description="audienceError"
        action-label="Retour au dashboard SI"
        @action="router.push('/admin/soins-infirmiers/dashboard')"
      />

      <div v-else class="dashboard-grid">

        <div v-if="isPreviewMode" class="section-card preview-context">
          <div class="preview-context-head">
            <div>
              <strong>Profil affiché:</strong> {{ previewTeacherName || previewTeacherEmail || 'Enseignant SI' }}
              <p class="text-500 mt-1 mb-0">Vue personnalisée de l'enseignant (cours, modules, planning, exports).</p>
            </div>
            <Button label="Retour secrétariat" icon="pi pi-arrow-left" size="small" text @click="router.push('/admin/soins-infirmiers/dashboard')" />
          </div>
        </div>
        
        <section class="hero-card">
          <div class="hero-card__content">
            <span class="hero-card__eyebrow">{{ heroEyebrow }}</span>
            <h2 class="hero-card__title">{{ teacherDisplayName }}</h2>
            <p class="hero-card__subtitle">{{ heroSubtitle }}</p>
            <div class="hero-card__meta">
              <span v-if="teacherEmail" class="hero-card__meta-item">
                <i class="pi pi-at"></i>
                {{ teacherEmail }}
              </span>
              <span class="hero-card__meta-item">
                <i class="pi pi-users"></i>
                {{ studentsCount }} étudiant<span v-if="studentsCount !== 1">s</span>
              </span>
              <span class="hero-card__meta-item">
                <i class="pi pi-th-large"></i>
                {{ teacherModulesCount }} module<span v-if="teacherModulesCount !== 1">s</span>
              </span>
            </div>
            <div class="hero-card__actions">
              <Button label="Voir mon planning" icon="pi pi-calendar" severity="primary" size="small" @click="$router.push('/admin/planning/weekly')" />
              <Button label="Exporter mon planning" icon="pi pi-file-pdf" size="small" text severity="secondary" @click="exportMyPlanning" />
            </div>
          </div>
          <div class="hero-card__metrics">
            <div class="hero-metric">
              <span class="hero-metric__label">Cours assignés</span>
              <span class="hero-metric__value">{{ coursesCount }}</span>
            </div>
            <div class="hero-metric">
              <span class="hero-metric__label">Périodes présence</span>
              <span class="hero-metric__value">{{ workloadMetrics.totalPresencePeriods }}p</span>
              <small class="hero-metric__hint">{{ annualPlanningHours }}h planifiées</small>
            </div>
            <div class="hero-metric">
              <span class="hero-metric__label">Séances programmées</span>
              <span class="hero-metric__value">{{ upcomingSessions.length }}</span>
              <small class="hero-metric__hint">Prochaines semaines</small>
            </div>
            <div class="hero-metric">
              <span class="hero-metric__label">Périodes pondérées</span>
              <span class="hero-metric__value">{{ workloadMetrics.totalWeightedPeriods }}p</span>
            </div>
          </div>
        </section>

        <div class="dashboard-sections">

          <section class="section-card quick-actions-section full-width">
            <div class="section-header">
              <h3><i class="pi pi-bolt"></i> Actions rapides</h3>
            </div>
            <div class="quick-actions">
              <Button label="Planning hebdomadaire" icon="pi pi-calendar" severity="primary" @click="$router.push('/admin/planning/weekly')" />
              <Button label="Calendrier semestriel" icon="pi pi-calendar-plus" outlined @click="$router.push('/admin/planning/semester')" />
              <Button label="Liste des modules" icon="pi pi-book" outlined @click="$router.push('/admin/modules')" />
              <Button label="Cours en postulation" icon="pi pi-thumbs-up" outlined severity="warning" @click="$router.push('/admin/soins-infirmiers/cours-postulation')" />
              <Button label="Ressources pédagogiques" icon="pi pi-folder" outlined @click="$router.push('/admin/academic/video-library')" />
            </div>
          </section>

          <section class="section-card schedule-section">
            <div class="section-header-row">
              <div class="section-heading">
                <h3><i class="pi pi-calendar"></i> Mon Calendrier</h3>
                <p class="section-subtitle">{{ scheduleSlotsCount }} créneaux planifiés au total</p>
              </div>
              <div class="section-header-controls">
                <Tag :value="`${upcomingSessions.length} à venir`" severity="info" rounded />
                <div class="view-toggle">
                <Button 
                  :icon="calendarView === 'week' ? 'pi pi-check' : 'pi pi-calendar'" 
                  label="Semaine" 
                  :severity="calendarView === 'week' ? 'primary' : 'secondary'" 
                  size="small"
                  @click="calendarView = 'week'" 
                />
                <Button 
                  :icon="calendarView === 'list' ? 'pi pi-check' : 'pi pi-list'" 
                  label="Liste" 
                  :severity="calendarView === 'list' ? 'primary' : 'secondary'" 
                  size="small"
                  @click="calendarView = 'list'" 
                />
                </div>
              </div>
            </div>

            <div v-if="calendarView === 'week'" class="week-schedule">
              <div v-for="day in weekSchedule" :key="day.name" class="day-column">
                <h4>{{ day.name }}</h4>
                <div class="courses-list">
                  <div v-for="course in day.courses" :key="course.id" class="course-block-detailed" :style="{ borderLeftColor: course.color }">
                    <div class="course-time-badge">{{ course.time }}</div>
                    <div class="course-content">
                      <span class="course-name">{{ course.name }}</span>
                      <span class="course-code">{{ course.code }}</span>
                      <div class="course-details-row">
                        <Tag :value="course.type || 'Cours'" :severity="getTypeSeverity(course.type)" class="text-xs" />
                        <span v-if="course.class" class="class-badge">{{ course.class }}</span>
                        <span class="room-info"><i class="pi pi-map-marker"></i> {{ course.room }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="day.courses.length === 0" class="no-course">
                    <i class="pi pi-sun"></i>
                    <span>Libre</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="calendar-list-view">
              <DataTable 
                :value="allMySlots" 
                :rows="10" 
                :paginator="allMySlots.length > 10"
                responsiveLayout="scroll"
                stripedRows
                class="p-datatable-sm"
                sortField="sortKey"
                :sortOrder="1"
              >
                <Column field="weekNumber" header="Sem." style="width: 60px" sortable>
                  <template #body="{ data }">
                    <Tag :value="'S' + data.week_number" severity="info" />
                  </template>
                </Column>
                <Column field="day" header="Jour" style="width: 90px" />
                <Column field="time" header="Horaire" style="width: 110px">
                  <template #body="{ data }">
                    {{ data.start_time?.substring(0,5) }} - {{ data.end_time?.substring(0,5) }}
                  </template>
                </Column>
                <Column field="course_title" header="Cours">
                  <template #body="{ data }">
                    <div>
                      <strong>{{ data.course_title || data.module_code }}</strong>
                      <div class="text-sm text-500">{{ data.module_code }}</div>
                    </div>
                  </template>
                </Column>
                <Column field="activity" header="Type" style="width: 80px">
                  <template #body="{ data }">
                    <Tag :value="data.activity || 'Cours'" :severity="getTypeSeverity(data.activity)" />
                  </template>
                </Column>
                <Column field="class_code" header="Classe" style="width: 80px">
                  <template #body="{ data }">
                    <span class="class-badge">{{ data.class_code }}</span>
                  </template>
                </Column>
                <Column field="room" header="Salle" style="width: 100px" />
                <template #empty>
                  <div class="text-center py-4">
                    <i class="pi pi-calendar text-4xl text-400"></i>
                    <p class="mt-2 text-600">Aucun cours planifié</p>
                  </div>
                </template>
              </DataTable>
            </div>
          </section>

          <section class="section-card reminder-section">
            <div class="section-header">
              <h3>
                <i class="pi pi-bell"></i> 
                À ne pas oublier
                <Badge :value="nextWeekCourses.length" severity="warning" class="ml-2" />
              </h3>
            </div>
            <div class="reminder-list">
              <div v-for="(course, idx) in nextWeekCourses" :key="idx" class="reminder-item" :class="{ 'today': course.isToday, 'tomorrow': course.isTomorrow }">
                <div class="reminder-when">
                  <span v-if="course.isToday" class="today-badge">Aujourd'hui</span>
                  <span v-else-if="course.isTomorrow" class="tomorrow-badge">Demain</span>
                  <span v-else class="date-badge">{{ course.day }}</span>
                  <span class="time">{{ course.time }}</span>
                </div>
                <div class="reminder-content">
                  <strong>{{ course.course }}</strong>
                  <span class="text-500">{{ course.module }} - {{ course.class }}</span>
                </div>
                <div class="reminder-room">
                  <i class="pi pi-map-marker"></i>
                  {{ course.room }}
                </div>
              </div>
              <div v-if="nextWeekCourses.length === 0" class="empty-state small">
                <i class="pi pi-check-circle text-success"></i>
                <p>Aucun cours dans les prochains jours</p>
              </div>
            </div>
          </section>

          <section class="section-card upcoming-section">
            <div class="section-header upcoming-header">
              <div class="section-header__left">
                <h3>
                  <i class="pi pi-calendar-plus"></i> 
                  Prochaines séances
                </h3>
                <Badge :value="upcomingSessions.length" severity="info" />
              </div>
              <div class="section-header__actions">
                <Button icon="pi pi-file-pdf" label="PDF" severity="secondary" size="small" @click="exportMyPlanning" />
                <Button icon="pi pi-file-excel" label="Excel" severity="success" size="small" outlined @click="exportMyPlanningExcel" />
              </div>
            </div>
            <div class="upcoming-list">
              <div v-for="session in upcomingSessions.slice(0, 8)" :key="session.id" class="upcoming-item">
                <div class="upcoming-date">
                  <span class="day">{{ session.day }}</span>
                  <span class="week">S{{ session.weekNumber }}</span>
                </div>
                <div class="upcoming-info">
                  <span class="course-name">{{ session.course }}</span>
                  <span class="course-details">
                    <i class="pi pi-clock"></i> {{ session.time }}
                    <i class="pi pi-map-marker ml-2"></i> {{ session.room }}
                    <Tag :value="session.class" severity="secondary" class="ml-2" />
                  </span>
                </div>
                <Tag :value="session.type" :severity="getTypeSeverity(session.type)" />
              </div>
              <div v-if="upcomingSessions.length === 0" class="empty-state">
                <i class="pi pi-calendar"></i>
                <p>Aucune séance à venir</p>
              </div>
              <div v-if="upcomingSessions.length > 8" class="text-center mt-2">
                <Button label="Voir tout" icon="pi pi-arrow-right" text @click="$router.push('/admin/planning/weekly')" />
              </div>
            </div>
          </section>

          <section class="section-card courses-section">
            <div class="section-header courses-header">
              <div class="section-header__left">
                <h3>
                  <i class="pi pi-book"></i> 
                  Mes cours
                </h3>
                <p class="section-subtitle">{{ filteredAndSortedCourses.length }} cours • {{ totalCoursesHours }}h déclarées</p>
                <Badge :value="filteredAndSortedCourses.length" severity="info" />
              </div>
              <div class="courses-toolbar">
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText v-model="courseSearch" placeholder="Rechercher un cours..." class="p-inputtext-sm" style="width: 220px" />
                </span>
                <Dropdown v-model="courseModuleFilter" :options="courseModuleOptions" optionLabel="label" optionValue="value" class="p-inputtext-sm" style="min-width: 180px" />
                <Dropdown v-model="courseSort" :options="courseSortOptions" optionLabel="label" optionValue="value" class="p-inputtext-sm" style="min-width: 170px" />
                <Button
                  icon="pi pi-thumbs-up"
                  label="Cours en postulation"
                  severity="warning"
                  size="small"
                  outlined
                  @click="$router.push('/admin/soins-infirmiers/cours-postulation')"
                />
                <Button icon="pi pi-file-excel" label="Excel cours" severity="success" size="small" outlined @click="exportMyCoursesExcel" />
              </div>
            </div>
            <DataTable
              :value="filteredAndSortedCourses"
              responsiveLayout="scroll"
              stripedRows
              class="p-datatable-sm"
              :rows="12"
              :paginator="filteredAndSortedCourses.length > 12"
            >
              <Column field="moduleName" header="Module" sortable>
                <template #body="{ data }">
                  <div class="module-cell">
                    <span class="module-color-dot" :style="{ backgroundColor: data.moduleColor || data.color || '#3b82f6' }" />
                    <div>
                      <div class="font-semibold">{{ data.moduleName }}</div>
                      <small class="text-500">{{ data.moduleCode || '—' }}</small>
                    </div>
                  </div>
                </template>
              </Column>
              <Column field="name" header="Cours" sortable>
                <template #body="{ data }">
                  <div>
                    <div class="font-semibold">{{ data.name }}</div>
                    <small class="text-500">{{ data.code || '—' }}</small>
                  </div>
                </template>
              </Column>
              <Column field="type" header="Type" style="width: 110px">
                <template #body="{ data }">
                  <Tag :value="data.type || 'CM'" :severity="getTypeSeverity(data.type || 'CM')" />
                </template>
              </Column>
              <Column field="hours" header="Heures déclarées" sortable style="width: 90px">
                <template #body="{ data }">{{ data.hours }}h</template>
              </Column>
              <Column field="nextSessionLabel" header="Prochaine séance" sortable>
                <template #body="{ data }">
                  <span>{{ data.nextSessionLabel || 'Non planifiée' }}</span>
                </template>
              </Column>
              <Column header="Action" style="width: 120px">
                <template #body="{ data }">
                  <Button
                    label="Détails"
                    icon="pi pi-eye"
                    class="p-button-sm p-button-text"
                    @click="viewCourse(data)"
                    :disabled="!canNavigateToCourse(data)"
                  />
                </template>
              </Column>
              <template #empty>
                <div class="text-center py-4">
                  <i class="pi pi-inbox text-3xl text-400"></i>
                  <p class="mt-2">{{ normalizedMyCourses.length === 0 ? 'Aucun cours assigné' : 'Aucun cours avec ces filtres' }}</p>
                </div>
              </template>
            </DataTable>
          </section>

          <section class="section-card modules-section">
            <div class="section-header">
              <h3>
                <i class="pi pi-th-large"></i>
                Modules où j'interviens
              </h3>
              <Badge :value="myModules.length" severity="success" />
            </div>
            <div class="modules-list">
              <div v-for="module in myModules" :key="module.id" class="module-item">
                <div class="module-icon" :style="{ background: module.color || 'var(--primary-100)' }">
                  <i class="pi pi-folder"></i>
                </div>
                <div class="module-info">
                  <h4>{{ module.title }}</h4>
                  <p>{{ module.credits }} ECTS • Année {{ module.year }}</p>
                  <small class="text-500">Responsable : {{ module.responsable || module.responsable_email || '—' }}</small>
                </div>
                <div class="module-year">
                  <Tag :value="module.code || ('BA' + module.year)" severity="info" />
                </div>
              </div>
              <div v-if="myModules.length === 0" class="empty-state">
                <i class="pi pi-inbox"></i>
                <p>Aucun module associé</p>
                <small>Contactez le secrétariat pour vérifier vos attributions.</small>
              </div>
            </div>
          </section>

          <section class="section-card hours-section">
            <div class="section-header">
              <h3><i class="pi pi-chart-bar"></i> Récapitulatif charge</h3>
            </div>
            <div class="hours-grid">
              <div class="hour-stat">
                <span class="hour-value">{{ workloadMetrics.totalPresencePeriods }}p</span>
                <span class="hour-label">Périodes présence</span>
              </div>
              <div class="hour-stat">
                <span class="hour-value">{{ stats.upcomingHours || 0 }}h</span>
                <span class="hour-label">À venir</span>
              </div>
              <div class="hour-stat">
                <span class="hour-value">{{ workloadMetrics.totalWeightedPeriods }}p</span>
                <span class="hour-label">Périodes pondérées</span>
              </div>
              <div class="hour-stat">
                <span class="hour-value">{{ totalCoursesHours }}h</span>
                <span class="hour-label">Heures déclarées</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import EmptyState from '@/components/common/states/EmptyState.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { loadEnseignantDashboard } from '@/service/enseignantDashboardService';
import { getSITeachers } from '@/service/academicKpiService';
import workloadService, { teacherKey, normalizeTeacherName } from '@/service/workloadService';
import { useAcademicYear } from '@/composables/useAcademicYear';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();
const { activeAcademicYear, loadActiveAcademicYear } = useAcademicYear();

// Loading
const loading = ref(true);
const audienceError = ref('');

// Stats
const stats = ref({
  coursesCount: 0,
  weeklyHours: 0,
  nextCourse: 'N/A',
  studentsCount: 0,
  modulesCount: 0,
  totalHours: 0
});

// Données
const myCourses = ref([]);
const myModules = ref([]);
const weekSchedule = ref([]);
const upcomingSessions = ref([]);
const allMySlots = ref([]);
const calendarView = ref('week');
const courseSearch = ref('');
const courseModuleFilter = ref('all');
const courseSort = ref('date-asc');
const workloadMetrics = ref({
  totalPresencePeriods: 0,
  totalWeightedPeriods: 0
});

const courseSortOptions = [
  { label: 'Date (prochaine)', value: 'date-asc' },
  { label: 'Module (A-Z)', value: 'module-asc' },
  { label: 'Module (Z-A)', value: 'module-desc' },
  { label: 'Cours (A-Z)', value: 'name-asc' },
  { label: 'Heures (desc)', value: 'hours-desc' }
];

const previewTeacherName = computed(() => String(route.query.teacher || '').trim())
const previewTeacherEmail = computed(() => String(route.query.email || '').trim())
const previewTeacherId = computed(() => String(route.query.teacherId || '').trim())
const isPreviewMode = computed(() => !!previewTeacherId.value || !!previewTeacherName.value || !!previewTeacherEmail.value)

const pageTitle = computed(() => isPreviewMode.value ? 'Dashboard Enseignant SI (profil ciblé)' : 'Dashboard Enseignant')
const pageSubtitle = computed(() => {
  if (!isPreviewMode.value) return 'Votre emploi du temps et vos cours'
  const label = previewTeacherName.value || previewTeacherEmail.value
  return `Vue de l'enseignant: ${label}`
})

const annualPlanningHours = computed(() => {
  const total = (allMySlots.value || []).reduce((sum, slot) => {
    const [sh, sm] = String(slot.start_time || '').split(':').map(Number)
    const [eh, em] = String(slot.end_time || '').split(':').map(Number)
    if ([sh, sm, eh, em].some(Number.isNaN)) return sum
    const diff = (eh + em / 60) - (sh + sm / 60)
    return sum + (diff > 0 ? diff : 0)
  }, 0)
  return Math.round(total * 10) / 10
})

const exportTeacherLabel = computed(() => {
  if (isPreviewMode.value) {
    return previewTeacherName.value || previewTeacherEmail.value || 'enseignant'
  }
  return authStore.user?.displayName || authStore.user?.email?.split('@')[0] || 'enseignant'
})

// Computed: prochains cours (aujourd'hui + demain + cette semaine)
const nextWeekCourses = computed(() => {
  const now = new Date();
  const today = now.getDay(); // 0=Dim, 1=Lun...
  const todayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][today];
  const tomorrowName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][(today + 1) % 7];
  
  return upcomingSessions.value.slice(0, 10).map(session => ({
    ...session,
    isToday: session.day === todayName,
    isTomorrow: session.day === tomorrowName
  }));
});

// Computed pour stats
const coursesCount = computed(() => stats.value.coursesCount);
const nextCourse = computed(() => stats.value.nextCourse);
const studentsCount = computed(() => stats.value.studentsCount);

const teacherDisplayName = computed(() => {
  if (isPreviewMode.value) {
    return previewTeacherName.value || previewTeacherEmail.value || 'Enseignant SI';
  }
  return authStore.user?.displayName || authStore.user?.name || authStore.user?.email || 'Mon profil enseignant';
});

const teacherEmail = computed(() => {
  if (isPreviewMode.value) return previewTeacherEmail.value || '';
  return authStore.user?.email || '';
});

const teacherModulesCount = computed(() => myModules.value.length);

const heroEyebrow = computed(() => (isPreviewMode.value ? 'Profil enseignant ciblé' : 'Mon tableau de bord pédagogique'));

const heroSubtitle = computed(() => {
  const next = nextCourse.value;
  if (next && next !== 'N/A') {
    return `Prochaine séance : ${next}`;
  }
  if (upcomingSessions.value.length > 0) {
    return `Prochaines séances prévues : ${upcomingSessions.value.length}`;
  }
  return 'Suivez vos cours, horaires et ressources en un coup d’œil';
});

function normalizeModuleCode(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatClassCodeForPlanning(classCode) {
  const raw = String(classCode || '').trim();
  if (!raw) return null;
  if (raw.toLowerCase().startsWith('bac')) return raw.toLowerCase();
  if (/^[a-zA-Z]\d{1,2}/.test(raw)) {
    return `bac${raw.substring(1).toLowerCase()}`;
  }
  return raw.toLowerCase();
}

function getSessionSortKey(session) {
  if (!session) return Number.MAX_SAFE_INTEGER;
  const dayOrder = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 7 };
  const start = String(session.time || '').split(' - ')[0] || '';
  const [h, m] = start.split(':').map(Number);
  const hh = Number.isNaN(h) ? 99 : h;
  const mm = Number.isNaN(m) ? 99 : m;
  return (Number(session.weekNumber) || 999) * 100000 + (dayOrder[session.day] || 99) * 1000 + hh * 10 + Math.floor(mm / 10);
}

function getNextSessionForCourse(course) {
  const targetModule = normalizeModuleCode(course.moduleCode);
  const targetName = normalizeText(course.name);
  const targetCode = normalizeText(course.code);
  const sessions = upcomingSessions.value || [];

  const strictCandidates = sessions.filter(session => {
    const sessionCourse = normalizeText(session.course);
    if (targetName && sessionCourse && sessionCourse.includes(targetName)) return true;
    if (targetCode && sessionCourse && sessionCourse.includes(targetCode)) return true;
    return false;
  });

  const candidates = strictCandidates.length
    ? strictCandidates
    : sessions.filter(session => {
      const sessionModule = normalizeModuleCode(session.module);
      return targetModule && sessionModule && targetModule === sessionModule;
    });

  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => getSessionSortKey(a) - getSessionSortKey(b));
  return sorted[0];
}

const moduleById = computed(() => {
  const map = new Map();
  (myModules.value || []).forEach(m => {
    if (m?.id) map.set(m.id, m);
  });
  return map;
});

const moduleByCode = computed(() => {
  const map = new Map();
  (myModules.value || []).forEach(m => {
    if (m?.code) map.set(normalizeModuleCode(m.code), m);
  });
  return map;
});

const normalizedMyCourses = computed(() => {
  return (myCourses.value || []).map(course => {
    const byId = course?.moduleId ? moduleById.value.get(course.moduleId) : null;
    const byCode = course?.moduleCode ? moduleByCode.value.get(normalizeModuleCode(course.moduleCode)) : null;
    const module = byId || byCode || null;
    const moduleName = module?.title || course?.moduleName || (course?.moduleCode ? `Module ${course.moduleCode}` : 'Module inconnu');
    const moduleCode = module?.code || course?.moduleCode || '';
    const moduleColor = module?.color || course?.moduleColor || null;
    const nextSession = getNextSessionForCourse({ ...course, moduleCode, moduleName });
    const nextSessionInfo = nextSession
      ? {
          id: nextSession.id || null,
          weekNumber: nextSession.weekNumber || null,
          day: nextSession.day || null,
          time: nextSession.time || null,
          module: nextSession.module || null,
          class: nextSession.class || null,
          room: nextSession.room || null
        }
      : null;
    const nextSessionLabel = nextSessionInfo ? `${nextSessionInfo.day} ${nextSessionInfo.time} (S${nextSessionInfo.weekNumber})` : '';
    const nextSortKey = getSessionSortKey(nextSessionInfo);

    return {
      ...course,
      moduleName,
      moduleCode,
      moduleColor,
      nextSession: nextSessionInfo,
      nextSessionLabel,
      nextSortKey,
      hours: Math.round((Number(course?.hours) || 0) * 10) / 10
    };
  });
});

const scheduleSlotsCount = computed(() => (allMySlots.value || []).length)

const totalCoursesHours = computed(() => {
  const total = (normalizedMyCourses.value || []).reduce((sum, course) => sum + (Number(course?.hours) || 0), 0)
  return Math.round(total * 10) / 10
})

async function loadTeacherWorkloadMetrics(targetUserId, targetUserEmail, teacherNameForPlanning) {
  const data = await workloadService.computeWorkload('all', activeAcademicYear.value?.id || null);
  const allTeachers = data?.teachers || [];

  const currentTeacherId = String(targetUserId || '').trim();
  const currentTeacherEmail = String(targetUserEmail || '').trim().toLowerCase();
  const currentTeacherKey = teacherKey(normalizeTeacherName(teacherNameForPlanning) || teacherNameForPlanning || '');

  const matched = allTeachers.find((w) => {
    const wId = String(w?.teacher?.id || '').trim();
    if (currentTeacherId && wId && wId === currentTeacherId) return true;

    const wEmail = String(w?.teacher?.email || '').trim().toLowerCase();
    if (currentTeacherEmail && wEmail && wEmail === currentTeacherEmail) return true;

    const wKey = teacherKey(normalizeTeacherName(w?.teacher?.name) || w?.teacher?.name || '');
    return !!(currentTeacherKey && wKey && currentTeacherKey === wKey);
  });

  workloadMetrics.value = {
    totalPresencePeriods: matched?.totalPresencePeriods || 0,
    totalWeightedPeriods: matched?.totalWeightedPeriods || 0
  };
}

const courseModuleOptions = computed(() => {
  const options = [{ label: 'Tous les modules', value: 'all' }];
  const moduleNames = [...new Set(normalizedMyCourses.value.map(c => c.moduleName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  moduleNames.forEach(name => options.push({ label: name, value: name }));
  return options;
});

const filteredAndSortedCourses = computed(() => {
  const term = String(courseSearch.value || '').trim().toLowerCase();

  let courses = normalizedMyCourses.value.filter(course => {
    if (courseModuleFilter.value !== 'all' && course.moduleName !== courseModuleFilter.value) return false;
    if (!term) return true;
    return [course.name, course.code, course.moduleName, course.moduleCode, course.type]
      .some(v => String(v || '').toLowerCase().includes(term));
  });

  courses = [...courses].sort((a, b) => {
    switch (courseSort.value) {
      case 'date-asc':
        return (Number(a.nextSortKey) || Number.MAX_SAFE_INTEGER) - (Number(b.nextSortKey) || Number.MAX_SAFE_INTEGER);
      case 'module-desc':
        return String(b.moduleName || '').localeCompare(String(a.moduleName || ''), 'fr');
      case 'name-asc':
        return String(a.name || '').localeCompare(String(b.name || ''), 'fr');
      case 'hours-desc':
        return (Number(b.hours) || 0) - (Number(a.hours) || 0);
      case 'module-asc':
      default:
        return String(a.moduleName || '').localeCompare(String(b.moduleName || ''), 'fr') || String(a.name || '').localeCompare(String(b.name || ''), 'fr');
    }
  });

  return courses;
});


/**
 * Charge les données enseignant depuis Supabase
 */
async function loadTeacherData() {
  loading.value = true;
  audienceError.value = '';
  
  try {
    await loadActiveAcademicYear();
    const currentUserId = authStore.user?.id || authStore.user?.uid;
    const currentUserEmail = authStore.user?.email;
    const currentDisplayName = authStore.user?.displayName || authStore.user?.name || null;
    let targetUserId = isPreviewMode.value ? (previewTeacherId.value || null) : currentUserId;
    let targetUserEmail = isPreviewMode.value ? (previewTeacherEmail.value || null) : currentUserEmail;
    let teacherNameForPlanning = isPreviewMode.value ? previewTeacherName.value : currentDisplayName;
    
    if (!targetUserId && !targetUserEmail && !teacherNameForPlanning) {
      console.warn('⚠️ Aucun utilisateur connecté');
      loading.value = false;
      return;
    }

    const siTeachers = await getSITeachers();
    const requestedId = String(targetUserId || '').trim();
    const requestedEmail = String(targetUserEmail || '').trim().toLowerCase();
    const requestedName = normalizeText(teacherNameForPlanning);
    const matchedTeacher = siTeachers.find(teacher => {
      if (requestedId && String(teacher.id || '').trim() === requestedId) return true;
      if (requestedEmail && String(teacher.email || '').trim().toLowerCase() === requestedEmail) return true;
      return requestedName && normalizeText(teacher.name) === requestedName;
    });

    if (!matchedTeacher) {
      audienceError.value = 'Ce compte ne possède pas un rôle EnseignantSoins actif. Aucune donnée enseignant n’a été chargée.';
      return;
    }

    targetUserId = matchedTeacher.id;
    targetUserEmail = matchedTeacher.email;
    teacherNameForPlanning = matchedTeacher.name;
    
    console.log('🔄 Chargement données enseignant pour:', targetUserEmail || teacherNameForPlanning);
    
    const data = await loadEnseignantDashboard(targetUserId, targetUserEmail, teacherNameForPlanning);
    
    // Mettre à jour les stats
    stats.value = data.stats;
    
    // Mettre à jour les données
    myCourses.value = data.courses;
    myModules.value = data.modules;
    weekSchedule.value = data.weekPlanning;
    upcomingSessions.value = data.upcomingSessions || [];
    allMySlots.value = data.allSlots || [];
    await loadTeacherWorkloadMetrics(targetUserId, targetUserEmail, teacherNameForPlanning);
    
    console.log('✅ Données enseignant chargées:', {
      courses: myCourses.value.length,
      modules: myModules.value.length
    });
  } catch (error) {
    console.error('❌ Erreur chargement données enseignant:', error);
  } finally {
    loading.value = false;
  }
}

watch(
  [previewTeacherId, previewTeacherEmail, previewTeacherName],
  () => {
    loadTeacherData();
  },
  { immediate: true }
)

function viewCourse(course) {
  if (course?.nextSession) {
    const query = {
      week: course.nextSession.weekNumber || undefined,
      classCode: formatClassCodeForPlanning(course.nextSession.class) || undefined,
      day: course.nextSession.day ? String(course.nextSession.day).toLowerCase() : undefined,
      start: course.nextSession.time ? String(course.nextSession.time).split(' - ')[0] : undefined,
      moduleCode: course.moduleCode || undefined,
      courseCode: course.code || undefined,
      slotId: course.nextSession.id ? String(course.nextSession.id) : undefined
    };

    Object.keys(query).forEach(key => {
      if (query[key] == null || query[key] === '') delete query[key];
    });

    router.push({ path: '/admin/planning/weekly', query });
    return;
  }

  if (!course?.id || course?.canOpenDetails === false) return;
  router.push(`/admin/courses/${course.id}`);
}

function canNavigateToCourse(course) {
  if (!course) return false;
  if (course.nextSession) return true;
  return !!(course.id && course.canOpenDetails !== false);
}

function getTypeSeverity(type) {
  const severities = {
    'Cours': 'primary',
    'CM': 'primary',
    'TP': 'success',
    'TD': 'warning',
    'Examen': 'danger',
    'Atelier': 'info'
  };
  return severities[type] || 'secondary';
}

async function exportMyPlanning() {
  if (upcomingSessions.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Aucune donnée',
      detail: 'Aucune séance à exporter',
      life: 3000
    });
    return;
  }
  
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  
  const userName = exportTeacherLabel.value;
  
  // Créer le PDF
  const doc = new jsPDF('landscape');
  
  // Titre
  doc.setFontSize(18);
  doc.text(`Mon Planning - ${userName}`, 14, 20);
  
  // Sous-titre
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-CH')} | ${upcomingSessions.value.length} séances à venir`, 14, 28);
  doc.text(`Total: ${stats.value.upcomingHours || 0}h planifiées`, 14, 34);
  doc.setTextColor(0);
  
  // Préparer les données pour la table
  const tableData = upcomingSessions.value.map(session => [
    `S${session.weekNumber}`,
    session.day,
    session.date || '',
    session.time,
    session.course,
    session.type,
    session.class || '',
    session.room
  ]);
  
  // Générer la table
  autoTable(doc, {
    head: [['Sem.', 'Jour', 'Date', 'Horaire', 'Cours', 'Type', 'Classe', 'Salle']],
    body: tableData,
    startY: 42,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  });
  
  // Télécharger
  doc.save(`Planning_${userName}_${new Date().toISOString().split('T')[0]}.pdf`);
  
  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: `${upcomingSessions.value.length} séances exportées en PDF`,
    life: 3000
  });
}

async function exportMyPlanningExcel() {
  if (upcomingSessions.value.length === 0) return;
  
  const XLSX = await import('xlsx');
  
  const userName = exportTeacherLabel.value;
  
  const data = upcomingSessions.value.map(session => ({
    'Semaine': session.weekNumber,
    'Jour': session.day,
    'Date': session.date || '',
    'Horaire': session.time,
    'Cours': session.course,
    'Module': session.module || '',
    'Type': session.type,
    'Classe': session.class || '',
    'Salle': session.room
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mon Planning');
  XLSX.writeFile(wb, `Planning_${userName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  toast.add({
    severity: 'success',
    summary: 'Export Excel réussi',
    detail: `${upcomingSessions.value.length} séances exportées`,
    life: 3000
  });
}

function sanitizeSheetName(name, fallback = 'Feuille') {
  const cleaned = String(name || fallback)
    .replace(/[\\/*?:[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || fallback).slice(0, 31);
}

async function exportMyCoursesExcel() {
  if (normalizedMyCourses.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Aucune donnée', detail: 'Aucun cours à exporter', life: 3000 });
    return;
  }

  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const today = new Date().toISOString().split('T')[0];
  const userName = exportTeacherLabel.value;

  const overviewRows = normalizedMyCourses.value.map(course => ({
    'Module': course.moduleName,
    'Code module': course.moduleCode || '',
    'Cours': course.name || '',
    'Code cours': course.code || '',
    'Type': course.type || '',
    'Heures': course.hours || 0,
    'Source': course.role || 'Enseignant'
  }));

  const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Vue ensemble');

  const byModule = new Map();
  normalizedMyCourses.value.forEach(course => {
    const key = course.moduleName || 'Module inconnu';
    if (!byModule.has(key)) byModule.set(key, []);
    byModule.get(key).push(course);
  });

  const usedSheetNames = new Set(['Vue ensemble']);
  byModule.forEach((courses, moduleName) => {
    const rows = courses.map(course => ({
      'Cours': course.name || '',
      'Code cours': course.code || '',
      'Type': course.type || '',
      'Heures': course.hours || 0,
      'Code module': course.moduleCode || '',
      'Source': course.role || 'Enseignant'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    let sheetName = sanitizeSheetName(moduleName, 'Module');
    let suffix = 2;
    while (usedSheetNames.has(sheetName)) {
      const base = sanitizeSheetName(moduleName, 'Module').slice(0, 28);
      sheetName = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSheetNames.add(sheetName);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, `Cours_${userName}_${today}.xlsx`);

  toast.add({
    severity: 'success',
    summary: 'Export Excel réussi',
    detail: `${normalizedMyCourses.value.length} cours exportés (${byModule.size + 1} onglets)`,
    life: 3000
  });
}
</script>

<style scoped>
.dashboard-enseignant {
  padding: 2rem;
  max-width: 1680px;
  margin: 0 auto;
}

.dashboard-grid {
  display: grid;
  gap: 1.5rem;
}

.hero-card {
  background: linear-gradient(130deg, #0f766e 0%, #1d4ed8 100%);
  border-radius: 1rem;
  padding: 1.75rem;
  color: #fff;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 1.5rem;
  box-shadow: 0 10px 24px rgba(15, 118, 110, 0.22);
}

.hero-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.hero-card__eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.18);
}

.hero-card__title {
  margin: 0;
  font-size: clamp(1.5rem, 2.2vw, 2rem);
  line-height: 1.1;
}

.hero-card__subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
}

.hero-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.14);
  font-size: 0.85rem;
}

.hero-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.hero-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.hero-metric {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.9rem;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hero-metric__label {
  font-size: 0.78rem;
  opacity: 0.9;
}

.hero-metric__value {
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1;
}

.hero-metric__hint {
  font-size: 0.75rem;
  opacity: 0.82;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
  grid-template-areas:
    'quick quick'
    'schedule schedule'
    'courses courses'
    'upcoming reminder'
    'modules hours';
  gap: 1.2rem;
  align-items: start;
}

.span-2 {
  grid-column: span 2;
}

.quick-actions-section {
  grid-area: quick;
}

.schedule-section {
  grid-area: schedule;
}

.reminder-section {
  grid-area: reminder;
}

.hours-section {
  grid-area: hours;
}

.upcoming-section {
  grid-area: upcoming;
}

.courses-section {
  grid-area: courses;
}

.modules-section {
  grid-area: modules;
}

.courses-section {
  min-height: 420px;
}

.schedule-section {
  min-height: 520px;
}

.hours-section {
  border-left: 4px solid #f59e0b;
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
  border: 1px solid var(--surface-border);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.section-card.full-width {
  grid-column: 1 / -1;
}

.preview-context {
  border-left: 4px solid #0ea5e9;
}

.preview-context-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.section-card h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.week-schedule {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.day-column h4 {
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--surface-border);
  color: var(--text-color);
  text-align: center;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 200px;
}

.course-block {
  padding: 0.75rem;
  border-radius: 0.5rem;
  border-left: 3px solid var(--primary-color);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-time {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
}

.course-name {
  font-size: 0.9rem;
  color: var(--text-color);
}

.course-room {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.no-course {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-secondary);
  gap: 0.5rem;
}

.no-course i {
  font-size: 2rem;
  opacity: 0.3;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.course-card {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.courses-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 0.75rem;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.course-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 1rem;
}

.course-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.course-card p {
  margin: 0 0 0.75rem 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
}

.quick-actions :deep(.p-button) {
  width: 100%;
  justify-content: center;
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

/* Tâches */
.tasks-section {
  border-left: 4px solid var(--primary-color);
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.section-subtitle {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.82rem;
}

.section-header-controls {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.section-header-row h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.task-item:hover {
  background: var(--surface-100);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-title {
  font-weight: 500;
  color: var(--text-color);
}

.task-title.completed {
  text-decoration: line-through;
  color: var(--text-color-secondary);
}

.task-due {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.no-tasks {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #dcfce7;
  border-radius: 0.5rem;
  color: #16a34a;
}

.no-tasks i {
  font-size: 1.25rem;
}

/* Course meta et footer */
.course-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.module-chip {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.module-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 10px;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

/* Modules list */
.modules-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 740px;
  overflow: auto;
  padding-right: 0.25rem;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.module-item:hover {
  background: var(--surface-100);
}

.module-icon {
  width: 45px;
  height: 45px;
  border-radius: 0.75rem;
  background: var(--primary-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-icon i {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.module-info {
  flex: 1;
}

.module-info h4 {
  margin: 0 0 0.25rem 0;
  color: var(--text-color);
  font-size: 1rem;
}

.module-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.module-year {
  flex-shrink: 0;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 2.5rem;
  opacity: 0.3;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0;
  font-weight: 500;
}

.empty-state small {
  margin-top: 0.25rem;
}

/* Section header */
.section-header {
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* Prochaines séances */
.upcoming-section {
  border-left: 4px solid #10b981;
}

.upcoming-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.upcoming-item:hover {
  background: var(--surface-100);
}

.upcoming-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  padding: 0.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: 0.5rem;
}

.upcoming-date .day {
  font-weight: 700;
  font-size: 0.9rem;
}

.upcoming-date .week {
  font-size: 0.75rem;
  opacity: 0.8;
}

.upcoming-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.upcoming-info .course-name {
  font-weight: 600;
  color: var(--text-color);
}

.upcoming-info .course-details {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

/* Statistiques heures */
.hours-stats {
  border-left: 4px solid #f59e0b;
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.hour-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.75rem;
  text-align: center;
}

.hour-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.hour-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

@media (max-width: 1280px) {
  .dashboard-sections {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'quick quick'
      'schedule schedule'
      'courses courses'
      'upcoming reminder'
      'modules hours';
  }

  .modules-list {
    max-height: none;
  }

  .week-schedule {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 992px) {
  .dashboard-enseignant {
    padding: 1.25rem;
  }

  .dashboard-sections {
    grid-template-columns: 1fr;
    grid-template-areas:
      'quick'
      'schedule'
      'reminder'
      'hours'
      'upcoming'
      'courses'
      'modules';
  }

  .week-schedule {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hours-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header-row {
    flex-direction: column;
    gap: 0.65rem;
  }
}

@media (max-width: 768px) {
  .hero-card {
    grid-template-columns: 1fr;
    padding: 1.25rem;
  }

  .hero-card__metrics {
    grid-template-columns: 1fr;
  }

  .dashboard-enseignant {
    padding: 1rem;
  }

  .week-schedule {
    grid-template-columns: 1fr;
  }

  .hours-grid {
    grid-template-columns: 1fr;
  }
}

/* Section header row avec toggle */
.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

/* Course block détaillé */
.course-block-detailed {
  background: var(--surface-ground);
  border-left: 4px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.course-time-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.course-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-content .course-name {
  font-weight: 600;
  color: var(--text-color);
}

.course-content .course-code {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.course-details-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.class-badge {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.room-info {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* Section rappels */
.reminder-section {
  border-left: 4px solid #ef4444;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.reminder-item:hover {
  background: var(--surface-100);
}

.reminder-item.today {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
}

.reminder-item.tomorrow {
  background: #dbeafe;
  border-left: 3px solid #3b82f6;
}

.reminder-when {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.today-badge {
  background: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.tomorrow-badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
}

.date-badge {
  font-weight: 600;
  color: var(--text-color);
}

.reminder-when .time {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.reminder-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.reminder-room {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

/* Calendar list view */
.calendar-list-view {
  margin-top: 1rem;
}

/* Course meta */
.course-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.course-meta i {
  margin-right: 0.25rem;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}
</style>
