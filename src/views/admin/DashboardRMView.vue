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
        
        <!-- ═══ STATISTIQUES ═══ -->
        <div class="stats-row">
          <div class="stat-card stat-card--blue">
            <div class="stat-card__icon"><i class="pi pi-book"></i></div>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ modulesCount }}</span>
              <span class="stat-card__label">Modules gérés</span>
              <div class="stat-card__badges">
                <span class="stat-pill stat-pill--green">{{ activeModulesCount }} 1ère</span>
                <span class="stat-pill stat-pill--amber">{{ draftModulesCount }} 2ème</span>
                <span class="stat-pill stat-pill--slate">{{ archivedModulesCount }} 3ème</span>
              </div>
            </div>
          </div>

          <div class="stat-card stat-card--emerald">
            <div class="stat-card__icon"><i class="pi pi-users"></i></div>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ siTeachersCount }}</span>
              <span class="stat-card__label">Enseignants SI</span>
            </div>
          </div>

          <div class="stat-card stat-card--amber">
            <div class="stat-card__icon"><i class="pi pi-clock"></i></div>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ totalHours }}h</span>
              <span class="stat-card__label">Heures contact</span>
              <div class="stat-card__badges">
                <span class="stat-pill stat-pill--green">{{ hoursAssigned }}h assignées</span>
              </div>
            </div>
          </div>

          <div class="stat-card" :class="completionPercent >= 80 ? 'stat-card--emerald' : completionPercent >= 50 ? 'stat-card--amber' : 'stat-card--red'">
            <div class="stat-card__icon"><i class="pi pi-chart-pie"></i></div>
            <div class="stat-card__body">
              <span class="stat-card__value">{{ completionPercent }}%</span>
              <span class="stat-card__label">Assignation</span>
              <div class="progress-track">
                <div class="progress-track__fill" :style="{ width: completionPercent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ MES MODULES ═══ -->
        <section class="card-section">
          <div class="card-section__header">
            <div class="card-section__title">
              <i class="pi pi-book"></i>
              <h3>Mes Modules</h3>
              <Badge :value="myModules.length" severity="success" />
            </div>
          </div>
          <div class="modules-grid">
            <div v-for="module in myModules" :key="module.id" class="module-card">
              <div class="module-card__left">
                <span class="module-card__number">{{ module.number }}</span>
              </div>
              <div class="module-card__body">
                <h4 class="module-card__title">{{ module.title }}</h4>
                <div class="module-card__tags">
                  <Tag :value="`Année ${module.year}`" severity="info" />
                  <span v-if="module.credits" class="module-card__detail">{{ module.credits }} ECTS</span>
                  <span v-if="module.heures_contact" class="module-card__detail">{{ module.heures_contact }}h</span>
                </div>
                <div class="module-card__roles">
                  <Tag v-if="module.responsable_email === authStore.user?.email" value="Responsable" severity="success" />
                  <Tag v-if="module.coordinateur?.split(',').map(e => e.trim().toLowerCase()).includes(authStore.user?.email?.toLowerCase())" value="Coordinateur" severity="warning" />
                </div>
              </div>
              <div class="module-card__actions">
                <Button icon="pi pi-cog" severity="primary" rounded @click="manageModule(module)" v-tooltip.top="'Gérer'" />
                <Button icon="pi pi-calendar" severity="info" rounded outlined @click="viewPlanning(module)" v-tooltip.top="'Planning'" />
              </div>
            </div>
            <div v-if="myModules.length === 0" class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun module dont vous êtes responsable ou coordinateur</p>
              <small>Contactez l'administrateur pour vous assigner des modules</small>
            </div>
          </div>
        </section>

        <!-- ═══ MES COURS ═══ -->
        <section class="card-section card-section--accent">
          <div class="card-section__header">
            <div class="card-section__title">
              <i class="pi pi-calendar-plus"></i>
              <h3>Mes cours</h3>
              <Badge v-if="displayedSlots.length > 0" :value="displayedSlots.length" severity="success" />
            </div>
            <div class="card-section__toolbar">
              <Button 
                :label="mySlotsViewAll ? 'Par semaine' : 'Tous les cours'" 
                :icon="mySlotsViewAll ? 'pi pi-calendar' : 'pi pi-list'" 
                :severity="mySlotsViewAll ? 'secondary' : 'primary'" 
                size="small" rounded
                @click="toggleMySlotsView"
              />
              <Dropdown
                v-if="!mySlotsViewAll"
                v-model="mySlotsWeek"
                :options="mySlotsWeekOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Semaine"
                @change="loadMySlots"
                style="width: 220px"
              />
              <Button icon="pi pi-refresh" text rounded @click="mySlotsViewAll ? loadAllMySlots() : loadMySlots()" :loading="loadingMySlots" v-tooltip.top="'Rafraîchir'" />
              <Button label="Export .ics" icon="pi pi-download" severity="info" size="small" rounded @click="exportMyCoursesICS" :disabled="allMySlots.length === 0" v-tooltip.top="'Télécharger pour Outlook'" />
            </div>
          </div>

          <div v-if="loadingMySlots" class="text-center py-4">
            <ProgressSpinner style="width: 30px; height: 30px" />
          </div>

          <div v-else-if="displayedSlots.length === 0" class="empty-state-small">
            <i class="pi pi-calendar-times"></i>
            <p>{{ mySlotsViewAll ? 'Aucun cours trouvé' : 'Aucun cours cette semaine' }}</p>
          </div>

          <!-- Vue calendrier (par semaine) -->
          <div v-else-if="!mySlotsViewAll" class="week-calendar">
            <div v-for="col in calendarColumns" :key="col.key" class="week-col">
              <div class="week-col__head">
                <span class="week-col__day">{{ col.label }}</span>
                <span class="week-col__date">{{ col.date }}</span>
              </div>
              <div class="week-col__body">
                <div v-if="col.slots.length === 0" class="week-col__empty">—</div>
                <div v-for="slot in col.slots" :key="slot.id" class="cal-card" :style="{ borderLeftColor: getSlotModuleColor(slot.module_code) }">
                  <div class="cal-card__time">{{ slot.start_time }} – {{ slot.end_time }}</div>
                  <div class="cal-card__module">{{ getSlotModuleLabel(slot.module_code) }}</div>
                  <div v-if="slot.course_title" class="cal-card__course">{{ slot.course_title }}</div>
                  <div v-if="slot.activity" class="cal-card__activity">{{ slot.activity }}</div>
                  <div class="cal-card__footer">
                    <Tag :value="slot.class_code?.toUpperCase()" :style="getClassTagStyle(slot.class_code)" />
                    <Tag v-if="slot.room" :value="slot.room" severity="success" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Vue liste (tous les cours) -->
          <div v-else class="courses-timeline">
            <div v-for="group in displayedSlotsByDay" :key="group.key" class="day-block">
              <div class="day-block__header">
                <Tag v-if="group.weekLabel" :value="group.weekLabel" severity="info" />
                <span class="day-block__name">{{ group.label }}</span>
                <span class="day-block__date">{{ group.date }}</span>
                <Badge :value="group.slots.length" severity="secondary" class="ml-auto" />
              </div>
              <div class="day-block__slots">
                <div v-for="slot in group.slots" :key="slot.id" class="slot-row">
                  <div class="slot-row__time">
                    <strong>{{ slot.start_time }}</strong>
                    <span>{{ slot.end_time }}</span>
                  </div>
                  <div class="slot-row__bar" :style="{ background: getSlotModuleColor(slot.module_code) }"></div>
                  <div class="slot-row__content">
                    <strong>{{ getSlotModuleLabel(slot.module_code) }}</strong>
                    <span v-if="slot.course_title" class="slot-row__course">{{ slot.course_title }}</span>
                    <span v-if="slot.activity" class="slot-row__activity">{{ slot.activity }}</span>
                  </div>
                  <div class="slot-row__tags">
                    <Tag :value="slot.class_code?.toUpperCase()" :style="getClassTagStyle(slot.class_code)" />
                    <Tag v-if="slot.room" :value="slot.room" severity="success" />
                    <Tag v-else value="—" severity="warning" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ ACTIONS RAPIDES ═══ -->
        <section class="card-section">
          <div class="card-section__header">
            <div class="card-section__title">
              <i class="pi pi-bolt"></i>
              <h3>Actions Rapides</h3>
            </div>
          </div>
          <div class="quick-grid">
            <div class="quick-tile" @click="$router.push('/admin/teachers-assignment')">
              <div class="quick-tile__icon" style="background: #3b82f6;"><i class="pi pi-users"></i></div>
              <span class="quick-tile__label">Attribution Enseignants</span>
            </div>
            <div class="quick-tile" @click="$router.push('/admin/planning/weekly')">
              <div class="quick-tile__icon" style="background: #8b5cf6;"><i class="pi pi-calendar"></i></div>
              <span class="quick-tile__label">Planning Hebdomadaire</span>
            </div>
            <div class="quick-tile" @click="$router.push('/admin/modules')">
              <div class="quick-tile__icon" style="background: #10b981;"><i class="pi pi-book"></i></div>
              <span class="quick-tile__label">Gestion Modules</span>
            </div>
            <div class="quick-tile" @click="$router.push('/admin/planning')">
              <div class="quick-tile__icon" style="background: #f59e0b;"><i class="pi pi-th-large"></i></div>
              <span class="quick-tile__label">Structure Minibrique</span>
            </div>
          </div>
        </section>

        <!-- ═══ DEUX COLONNES : Enseignants + Responsables ═══ -->
        <div class="two-col">
          <!-- Enseignants de mes modules -->
          <section class="card-section">
            <div class="card-section__header">
              <div class="card-section__title">
                <i class="pi pi-users"></i>
                <h3>Enseignants de mes modules</h3>
                <Badge :value="myTeachers.length" severity="info" />
              </div>
            </div>
            <div class="people-list">
              <div v-for="teacher in myTeachers" :key="teacher.id" class="people-row">
                <div class="people-row__avatar">
                  <img v-if="teacher.avatar" :src="teacher.avatar" :alt="teacher.name" />
                  <i v-else class="pi pi-user"></i>
                </div>
                <div class="people-row__info">
                  <strong>{{ teacher.name }}</strong>
                  <span>{{ teacher.email }}</span>
                  <small>{{ teacher.modulesCount }} module(s)</small>
                </div>
                <div class="people-row__end">
                  <span class="hours-pill">{{ teacher.totalHours }}h</span>
                  <Button icon="pi pi-envelope" text rounded size="small" @click="contactTeacher(teacher)" />
                </div>
              </div>
              <div v-if="myTeachers.length === 0" class="empty-state-small">
                <i class="pi pi-inbox"></i>
                <p>Aucun enseignant assigné</p>
              </div>
            </div>
          </section>

          <!-- Responsables de modules -->
          <section class="card-section">
            <div class="card-section__header">
              <div class="card-section__title">
                <i class="pi pi-star"></i>
                <h3>Responsables de Modules</h3>
                <Badge :value="responsablesCount" severity="success" />
              </div>
            </div>
            <div class="responsables-grid">
              <div v-for="(modules, responsable) in modulesByResponsable" :key="responsable" class="responsable-card">
                <div class="responsable-card__header">
                  <i class="pi pi-user"></i>
                  <strong>{{ responsable }}</strong>
                  <Badge :value="modules.length" severity="info" class="ml-auto" />
                </div>
                <div class="responsable-card__modules">
                  <div v-for="module in modules" :key="module.id" class="mini-module">
                    <span class="mini-module__num">{{ module.number }}</span>
                    <span class="mini-module__title">{{ module.title }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- ═══ LISTE ENSEIGNANTS SI ═══ -->
        <section class="card-section">
          <div class="card-section__header">
            <div class="card-section__title">
              <i class="pi pi-id-card"></i>
              <h3>Liste des Enseignants SI</h3>
              <Badge :value="filteredSITeachers.length" severity="info" />
            </div>
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="searchSI" placeholder="Rechercher..." class="p-inputtext-sm" style="width: 220px" />
            </span>
          </div>
          <div class="people-list people-list--scroll">
            <div v-for="teacher in filteredSITeachers" :key="teacher.id" class="people-row people-row--compact">
              <div class="people-row__avatar people-row__avatar--sm">
                <i class="pi pi-user"></i>
              </div>
              <div class="people-row__info">
                <strong>{{ teacher.name }}</strong>
                <span>{{ teacher.email }}</span>
              </div>
              <Button icon="pi pi-envelope" text rounded size="small" @click="contactTeacher(teacher)" />
            </div>
            <div v-if="filteredSITeachers.length === 0" class="empty-state-small">
              <i class="pi pi-users"></i>
              <p>Aucun enseignant trouvé</p>
            </div>
          </div>
        </section>

        <!-- ═══ DEUX COLONNES : Planning + Alertes ═══ -->
        <div class="two-col">
          <!-- Vue globale Planning -->
          <section class="card-section">
            <div class="card-section__header">
              <div class="card-section__title">
                <i class="pi pi-calendar"></i>
                <h3>Vue globale du Planning</h3>
              </div>
              <Button icon="pi pi-refresh" text rounded @click="loadPlanningOverview" :loading="loadingPlanning" />
            </div>
            <div class="planning-circles">
              <div class="plan-circle">
                <div class="plan-circle__ring" :class="planningStats.validatedPercent >= 80 ? 'ring--green' : planningStats.validatedPercent >= 50 ? 'ring--amber' : 'ring--red'">
                  {{ planningStats.validatedPercent }}%
                </div>
                <span>Validés</span>
              </div>
              <div class="plan-circle">
                <div class="plan-circle__ring ring--blue">{{ planningStats.pendingCount }}</div>
                <span>En attente</span>
              </div>
              <div class="plan-circle">
                <div class="plan-circle__ring" :class="planningStats.conflictsCount > 0 ? 'ring--red' : 'ring--green'">{{ planningStats.conflictsCount }}</div>
                <span>Conflits</span>
              </div>
              <div class="plan-circle">
                <div class="plan-circle__ring" :class="planningStats.hoursDiff === 0 ? 'ring--green' : planningStats.hoursDiff > 0 ? 'ring--blue' : 'ring--amber'">
                  {{ planningStats.hoursDiff >= 0 ? '+' : '' }}{{ planningStats.hoursDiff }}h
                </div>
                <span>Écart</span>
              </div>
            </div>
            <div v-if="modulesWithIssues.length > 0" class="issues-list">
              <div v-for="issue in modulesWithIssues.slice(0, 5)" :key="issue.moduleId" class="issue-row">
                <Tag :value="issue.type" :severity="issue.severity" />
                <span>{{ issue.moduleName }}</span>
                <span class="issue-row__detail">{{ issue.details }}</span>
                <Button icon="pi pi-arrow-right" text size="small" @click="goToModule(issue.moduleId)" />
              </div>
            </div>
            <div v-else class="text-center py-3" style="color: var(--text-color-secondary);">
              <i class="pi pi-check-circle" style="color: #10b981; margin-right: 0.5rem;"></i>
              Tous les plannings sont en ordre
            </div>
          </section>

          <!-- Alertes et Notifications -->
          <section class="card-section">
            <div class="card-section__header">
              <div class="card-section__title">
                <i class="pi pi-bell"></i>
                <h3>Alertes & Notifications</h3>
              </div>
            </div>
            <div class="alerts-stack">
              <div v-if="alerts.length > 0">
                <div v-for="alert in alerts" :key="alert.id" class="alert-card" :class="'alert-card--' + alert.type">
                  <i :class="alert.icon" class="alert-card__icon"></i>
                  <div class="alert-card__body">
                    <strong>{{ alert.title }}</strong>
                    <span>{{ alert.message }}</span>
                  </div>
                  <Button icon="pi pi-times" text rounded size="small" @click="dismissAlert(alert)" />
                </div>
              </div>
              <div v-else class="no-alerts-banner">
                <i class="pi pi-check-circle"></i>
                <span>Aucune alerte en cours</span>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import InputText from 'primevue/inputtext';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';
import planningService from '@/service/planningService';
import { getMyModules, getModulesTeachers, calculateStats } from '@/services/rmDashboardService';
import { useModules } from '@/composables/useModules';
import { supabase } from '@/supabase';

const router = useRouter();
const authStore = useAuthStore();

const AUTO_REFRESH_MS = 120000;
let refreshIntervalId = null;

// Loading
const loading = ref(true);
const refreshInProgress = ref(false);

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

// Mes cours (section planning enseignant)
const loadingMySlots = ref(false);
const mySlots = ref([]);
const allMySlots = ref([]);
const mySlotsWeek = ref(null);
const mySlotsViewAll = ref(false);
const userDisplayName = ref('');
const courseModulesMap = ref([]);

const isoWeeksInYear = (year) => {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  return (jan1.getDay() === 4 || dec31.getDay() === 4) ? 53 : 52
}

const mySlotsWeekOptions = computed(() => {
  const weeks = []
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const aYear = currentMonth >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const maxAutumnWeek = isoWeeksInYear(aYear)
  for (let w = 38; w <= maxAutumnWeek; w++) weeks.push({ label: `Semaine ${w} (Automne)`, value: w })
  for (let w = 1; w <= 7; w++) weeks.push({ label: `Semaine ${w} (Automne)`, value: w })
  for (let w = 8; w <= 37; w++) weeks.push({ label: `Semaine ${w} (Printemps)`, value: w })
  return weeks
})

const displayedSlots = computed(() => mySlotsViewAll.value ? allMySlots.value : mySlots.value)

const mySlotsByDay = computed(() => {
  const dayLabels = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', distance: 'Distance' }
  const dayOrder = { lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, distance: 5 }
  const groups = {}
  mySlots.value.forEach(slot => {
    const day = slot.day || 'inconnu'
    if (!groups[day]) {
      groups[day] = { day, key: day, label: dayLabels[day] || day, date: slot.date || '', slots: [] }
    }
    groups[day].slots.push(slot)
  })
  return Object.values(groups)
    .sort((a, b) => (dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99))
    .map(g => { g.slots.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')); return g })
})

const allMySlotsByWeekDay = computed(() => {
  const dayLabels = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', distance: 'Distance' }
  const dayOrder = { lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, distance: 5 }
  const groups = {}
  allMySlots.value.forEach(slot => {
    const wk = slot.week_number || 0
    const day = slot.day || 'inconnu'
    const key = `${wk}-${day}`
    if (!groups[key]) {
      groups[key] = { key, day, week: wk, weekLabel: `S${wk}`, label: dayLabels[day] || day, date: slot.date || '', slots: [] }
    }
    groups[key].slots.push(slot)
  })
  // Trier par semaine académique (S38+ d'abord, puis S1-S37), puis par jour
  const weekSort = (w) => w >= 38 ? w - 38 : w + 53
  return Object.values(groups)
    .sort((a, b) => weekSort(a.week) - weekSort(b.week) || (dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99))
    .map(g => { g.slots.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')); return g })
})

const displayedSlotsByDay = computed(() => mySlotsViewAll.value ? allMySlotsByWeekDay.value : mySlotsByDay.value)

const calendarDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
const calendarDayLabels = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi' }

const calendarColumns = computed(() => {
  const source = displayedSlots.value
  const byDay = {}
  calendarDays.forEach(d => { byDay[d] = [] })
  source.forEach(slot => {
    const day = slot.day || 'inconnu'
    if (byDay[day]) byDay[day].push(slot)
  })
  // Calculer les dates pour chaque jour de la semaine sélectionnée
  const weekDates = {}
  if (mySlotsWeek.value) {
    calendarDays.forEach((d, i) => {
      weekDates[d] = planningService.getDateForWeekAndDay(mySlotsWeek.value, i)
    })
  }
  return calendarDays.map(d => ({
    key: d,
    label: calendarDayLabels[d],
    date: byDay[d][0]?.date || weekDates[d] || '',
    slots: byDay[d].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  }))
})

function toggleMySlotsView() {
  mySlotsViewAll.value = !mySlotsViewAll.value
  if (mySlotsViewAll.value && allMySlots.value.length === 0) {
    loadAllMySlots()
  }
}

const classColors = {
  'BAC25': { bg: '#2563EB', text: '#fff' },
  'BAC24': { bg: '#7C3AED', text: '#fff' },
  'BAC23': { bg: '#059669', text: '#fff' },
  'BAC25-EE': { bg: '#0891B2', text: '#fff' },
  'BAC24-EE': { bg: '#9333EA', text: '#fff' },
  'BAC23-EE': { bg: '#10B981', text: '#fff' },
}
const defaultClassColors = ['#E67E22', '#E74C3C', '#1ABC9C', '#3498DB', '#9B59B6', '#F39C12', '#2ECC71']

function getClassTagStyle(classCode) {
  const code = classCode?.toUpperCase()
  const preset = classColors[code]
  if (preset) return { background: preset.bg, color: preset.text, border: 'none' }
  let hash = 0
  for (let i = 0; i < (code || '').length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
  const color = defaultClassColors[Math.abs(hash) % defaultClassColors.length]
  return { background: color, color: '#fff', border: 'none' }
}

function getSlotModuleColor(code) {
  const mod = courseModulesMap.value.find(m => m.code === code)
  return mod?.color || '#94a3b8'
}

function getSlotModuleLabel(code) {
  const mod = courseModulesMap.value.find(m => m.code === code)
  return mod?.label || mod?.title || code || '—'
}

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
    
    // 10. Charger profil utilisateur + modules pour la section "Mes cours"
    await loadUserProfile();
    courseModulesMap.value = await planningService.getAllCourseModules();
    
    // Sélectionner la semaine courante
    const nowW = new Date()
    const jan4 = new Date(nowW.getFullYear(), 0, 4)
    const jan4Day = jan4.getDay() || 7
    const week1Monday = new Date(jan4)
    week1Monday.setDate(jan4.getDate() - jan4Day + 1)
    const diffW = Math.floor((nowW - week1Monday) / (7 * 24 * 60 * 60 * 1000))
    const currentWeek = diffW + 1
    if (currentWeek >= 1 && currentWeek <= 53) {
      mySlotsWeek.value = currentWeek
      await loadMySlots()
    }
    // Pré-charger tous les slots pour l'export ICS
    await loadAllMySlots();
    
    console.log('✅ Données RM chargées');
  } catch (error) {
    console.error('❌ Erreur chargement données RM:', error);
  } finally {
    loading.value = false;
  }
}

const refreshDashboard = async () => {
  if (refreshInProgress.value) return;
  refreshInProgress.value = true;
  try {
    await loadRMData();
  } finally {
    refreshInProgress.value = false;
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    refreshDashboard();
  }
};

const handleWindowFocus = () => {
  refreshDashboard();
};

onMounted(() => {
  refreshDashboard();
  refreshIntervalId = window.setInterval(refreshDashboard, AUTO_REFRESH_MS);
  window.addEventListener('focus', handleWindowFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
  window.removeEventListener('focus', handleWindowFocus);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
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
 * Charge le profil utilisateur pour récupérer le display_name
 */
async function loadUserProfile() {
  try {
    const userId = authStore.user?.id || authStore.user?.uid
    if (!userId) return
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name, forname, family_name, email')
      .eq('user_id', userId)
      .single()
    if (data) {
      userDisplayName.value = data.display_name || `${data.forname || ''} ${data.family_name || ''}`.trim() || data.email || ''
    }
  } catch (err) {
    console.warn('Profil utilisateur non trouvé:', err)
    userDisplayName.value = authStore.user?.email || ''
  }
}

/**
 * Filtre les slots où l'utilisateur est dans la liste des enseignants
 */
function filterMySlots(slots) {
  if (!userDisplayName.value) return []
  const nameLC = userDisplayName.value.toLowerCase()
  const emailLC = (authStore.user?.email || '').toLowerCase()
  return (slots || []).filter(s => {
    if (!s.teachers || !Array.isArray(s.teachers)) return false
    return s.teachers.some(t => {
      const tLC = (typeof t === 'string' ? t : t?.name || '').toLowerCase()
      return tLC === nameLC || tLC === emailLC || tLC.includes(nameLC) || nameLC.includes(tLC)
    })
  })
}

/**
 * Charge les cours de l'enseignant pour la semaine sélectionnée
 */
async function loadMySlots() {
  if (!mySlotsWeek.value) return
  loadingMySlots.value = true
  try {
    const { data, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .eq('week_number', mySlotsWeek.value)
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) throw error
    mySlots.value = filterMySlots(data)
  } catch (err) {
    console.error('Erreur chargement mes cours:', err)
    mySlots.value = []
  } finally {
    loadingMySlots.value = false
  }
}

/**
 * Charge TOUS les cours de l'année pour l'export ICS
 */
async function loadAllMySlots() {
  try {
    const { data, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .order('week_number', { ascending: true })
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) throw error
    allMySlots.value = filterMySlots(data)
  } catch (err) {
    console.error('Erreur chargement tous mes cours:', err)
    allMySlots.value = []
  }
}

/**
 * Parse une date au format DD.MM.YYYY en objet Date
 */
function parseDateDDMMYYYY(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split('.')
  if (parts.length !== 3) return null
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
}

/**
 * Formate une date+heure en format ICS (YYYYMMDDTHHMMSS)
 */
function toICSDateTime(dateObj, timeStr) {
  if (!dateObj || !timeStr) return ''
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  const [hh, mm] = timeStr.split(':')
  return `${y}${m}${d}T${(hh || '00').padStart(2, '0')}${(mm || '00').padStart(2, '0')}00`
}

/**
 * Exporte tous les cours de l'enseignant en fichier .ics pour Outlook
 */
async function exportMyCoursesICS() {
  if (allMySlots.value.length === 0) {
    await loadAllMySlots()
    if (allMySlots.value.length === 0) return
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HEdS//Planning//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Mes cours HEdS`
  ]

  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`

  for (const slot of allMySlots.value) {
    // Calculer la date si pas stockée
    let dateObj = parseDateDDMMYYYY(slot.date)
    if (!dateObj && slot.week_number && slot.day_index != null) {
      const dateStr = planningService.getDateForWeekAndDay(slot.week_number, slot.day_index)
      dateObj = parseDateDDMMYYYY(dateStr)
    }
    if (!dateObj || !slot.start_time || !slot.end_time) continue

    const dtStart = toICSDateTime(dateObj, slot.start_time)
    const dtEnd = toICSDateTime(dateObj, slot.end_time)

    const moduleLabel = getSlotModuleLabel(slot.module_code)
    const summary = `${moduleLabel}${slot.course_title ? ' — ' + slot.course_title : ''}`
    const classCode = slot.class_code?.toUpperCase() || ''
    const description = [
      `Module: ${moduleLabel}`,
      slot.course_title ? `Cours: ${slot.course_title}` : '',
      slot.activity ? `Activité: ${slot.activity}` : '',
      `Classe: ${classCode}`,
      slot.teachers?.length ? `Enseignants: ${slot.teachers.join(', ')}` : '',
      slot.notes ? `Notes: ${slot.notes}` : ''
    ].filter(Boolean).join('\\n')

    const location = slot.room || ''
    const uid = `${slot.id || dtStart}-${classCode}@heds-planning`

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART:${dtStart}`)
    lines.push(`DTEND:${dtEnd}`)
    lines.push(`SUMMARY:${summary.replace(/[,;]/g, ' ')}`)
    lines.push(`DESCRIPTION:${description}`)
    if (location) lines.push(`LOCATION:${location.replace(/[,;]/g, ' ')}`)
    lines.push(`CATEGORIES:HEdS,${classCode}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  const icsContent = lines.join('\r\n')
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mes-cours-heds-${userDisplayName.value.replace(/\s+/g, '-').toLowerCase() || 'export'}.ics`
  link.click()
  window.URL.revokeObjectURL(url)
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
/* ═══════════════════════════════════════════
   DASHBOARD RM — DESIGN SYSTEM
   ═══════════════════════════════════════════ */

.dashboard-rm { padding: 1.5rem 2rem; }
.dashboard-grid { display: flex; flex-direction: column; gap: 1.5rem; }

/* ── Loading ── */
.loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 1rem; }
.loading-container p { color: var(--text-color-secondary); font-size: 1.1rem; }

/* ═══ STAT CARDS ═══ */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

.stat-card {
  position: relative; overflow: hidden;
  background: var(--surface-card); border-radius: 1rem; padding: 1.25rem 1.5rem;
  display: flex; align-items: center; gap: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border-top: 3px solid transparent; transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
.stat-card--blue   { border-top-color: #3b82f6; }
.stat-card--emerald { border-top-color: #10b981; }
.stat-card--amber  { border-top-color: #f59e0b; }
.stat-card--red    { border-top-color: #ef4444; }

.stat-card__icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 1.25rem; flex-shrink: 0;
}
.stat-card--blue .stat-card__icon   { background: #3b82f6; }
.stat-card--emerald .stat-card__icon { background: #10b981; }
.stat-card--amber .stat-card__icon  { background: #f59e0b; }
.stat-card--red .stat-card__icon    { background: #ef4444; }

.stat-card__body { display: flex; flex-direction: column; min-width: 0; }
.stat-card__value { font-size: 1.6rem; font-weight: 800; color: var(--text-color); line-height: 1.1; }
.stat-card__label { font-size: 0.8rem; color: var(--text-color-secondary); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.03em; }
.stat-card__badges { display: flex; gap: 0.35rem; margin-top: 0.5rem; flex-wrap: wrap; }

.stat-pill {
  font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap;
}
.stat-pill--green { background: #dcfce7; color: #16a34a; }
.stat-pill--amber { background: #fef3c7; color: #d97706; }
.stat-pill--slate { background: #f1f5f9; color: #64748b; }

.progress-track { width: 100%; height: 6px; background: var(--surface-200); border-radius: 3px; overflow: hidden; margin-top: 0.5rem; }
.progress-track__fill { height: 100%; border-radius: 3px; background: currentColor; transition: width 0.5s ease; }
.stat-card--emerald .progress-track__fill { background: #10b981; }
.stat-card--amber .progress-track__fill { background: #f59e0b; }
.stat-card--red .progress-track__fill { background: #ef4444; }

/* ═══ CARD SECTION (shared wrapper) ═══ */
.card-section {
  background: var(--surface-card); border-radius: 1rem; padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.card-section--accent { border-left: 4px solid #3b82f6; }

.card-section__header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem; }
.card-section__title { display: flex; align-items: center; gap: 0.5rem; }
.card-section__title i { font-size: 1.1rem; color: var(--primary-color); }
.card-section__title h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-color); }
.card-section__toolbar { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

/* ═══ MODULES GRID ═══ */
.modules-grid { display: flex; flex-direction: column; gap: 0.75rem; }

.module-card {
  display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
  background: var(--surface-ground); border-radius: 0.75rem;
  border: 1px solid var(--surface-border); transition: all 0.25s;
}
.module-card:hover { border-color: var(--primary-color); box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }

.module-card__left { flex-shrink: 0; }
.module-card__number {
  display: flex; align-items: center; justify-content: center;
  width: 56px; height: 56px; border-radius: 14px;
  background: linear-gradient(135deg, var(--primary-color), #6366f1);
  color: white; font-weight: 800; font-size: 1.3rem;
}
.module-card__body { flex: 1; min-width: 0; }
.module-card__title { margin: 0 0 0.35rem; font-size: 1rem; font-weight: 600; color: var(--text-color); }
.module-card__tags { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.module-card__detail { font-size: 0.8rem; color: var(--text-color-secondary); }
.module-card__roles { display: flex; gap: 0.35rem; margin-top: 0.35rem; }
.module-card__actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

/* ═══ WEEK CALENDAR ═══ */
.week-calendar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; min-height: 200px; }

.week-col { display: flex; flex-direction: column; }

.week-col__head {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 0.6rem 0.25rem; background: var(--surface-100); border-radius: 8px 8px 0 0;
  border-bottom: 2px solid var(--primary-color);
}
.week-col__day { font-weight: 700; font-size: 0.85rem; color: var(--text-color); }
.week-col__date { font-size: 0.7rem; color: var(--text-color-secondary); }

.week-col__body {
  flex: 1; display: flex; flex-direction: column; gap: 0.4rem;
  padding: 0.5rem 0.25rem; background: var(--surface-50); border-radius: 0 0 8px 8px;
  min-height: 120px;
}

.week-col__empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--surface-400); font-size: 1.2rem;
}

.cal-card {
  padding: 0.5rem 0.6rem; border-radius: 8px;
  background: var(--surface-card); border-left: 4px solid var(--primary-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.15s; cursor: default;
}
.cal-card:hover { box-shadow: 0 3px 10px rgba(0,0,0,0.1); transform: translateY(-1px); }

.cal-card__time { font-size: 0.7rem; font-weight: 700; color: var(--primary-color); margin-bottom: 2px; }
.cal-card__module { font-size: 0.8rem; font-weight: 700; color: var(--text-color); line-height: 1.2; }
.cal-card__course { font-size: 0.72rem; color: var(--text-color-secondary); line-height: 1.2; margin-top: 1px; }
.cal-card__activity { font-size: 0.68rem; color: var(--text-color-secondary); font-style: italic; }
.cal-card__footer { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.35rem; }
.cal-card__footer :deep(.p-tag) { font-size: 0.65rem; padding: 1px 6px; }

/* ═══ COURSES TIMELINE (all-courses view) ═══ */
.courses-timeline { display: flex; flex-direction: column; gap: 1rem; }

.day-block__header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem; background: var(--surface-100); border-radius: 8px;
}
.day-block__name { font-weight: 700; font-size: 0.95rem; }
.day-block__date { font-size: 0.8rem; color: var(--text-color-secondary); }

.day-block__slots { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; padding-left: 0.5rem; }

.slot-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 1rem; background: var(--surface-ground); border-radius: 8px;
  transition: all 0.15s;
}
.slot-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); transform: translateX(2px); }

.slot-row__time { display: flex; flex-direction: column; align-items: center; min-width: 52px; font-size: 0.8rem; color: var(--text-color-secondary); gap: 1px; }
.slot-row__time strong { font-size: 0.95rem; color: var(--text-color); }

.slot-row__bar { width: 4px; height: 36px; border-radius: 2px; flex-shrink: 0; }

.slot-row__content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.slot-row__content strong { font-size: 0.9rem; }
.slot-row__course { font-size: 0.8rem; color: var(--text-color-secondary); }
.slot-row__activity { font-size: 0.75rem; color: var(--text-color-secondary); font-style: italic; }

.slot-row__tags { display: flex; gap: 0.4rem; align-items: center; flex-shrink: 0; }

/* ═══ QUICK ACTIONS TILES ═══ */
.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

.quick-tile {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: 1.25rem 1rem; border-radius: 1rem; cursor: pointer;
  background: var(--surface-ground); border: 1px solid var(--surface-border);
  transition: all 0.25s;
}
.quick-tile:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); border-color: var(--primary-color); }

.quick-tile__icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 1.25rem;
}
.quick-tile__label { font-size: 0.85rem; font-weight: 600; color: var(--text-color); text-align: center; }

/* ═══ TWO COLUMN LAYOUT ═══ */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

/* ═══ PEOPLE LIST ═══ */
.people-list { display: flex; flex-direction: column; gap: 0.5rem; }
.people-list--scroll { max-height: 400px; overflow-y: auto; }

.people-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.75rem; border-radius: 8px; transition: background 0.15s;
}
.people-row:hover { background: var(--surface-100); }
.people-row--compact { padding: 0.4rem 0.75rem; }

.people-row__avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; overflow: hidden;
}
.people-row__avatar--sm { width: 32px; height: 32px; }
.people-row__avatar img { width: 100%; height: 100%; object-fit: cover; }
.people-row__avatar i { font-size: 1rem; color: #6366f1; }

.people-row__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.people-row__info strong { font-size: 0.9rem; color: var(--text-color); }
.people-row__info span { font-size: 0.8rem; color: var(--text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.people-row__info small { font-size: 0.75rem; color: var(--text-color-secondary); }

.people-row__end { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

.hours-pill {
  background: linear-gradient(135deg, var(--primary-color), #6366f1);
  color: white; padding: 3px 10px; border-radius: 10px; font-size: 0.8rem; font-weight: 700;
}

/* ═══ RESPONSABLES ═══ */
.responsables-grid { display: flex; flex-direction: column; gap: 0.75rem; max-height: 500px; overflow-y: auto; }

.responsable-card {
  background: var(--surface-ground); border-radius: 10px; padding: 0.75rem 1rem;
  border: 1px solid var(--surface-border);
}
.responsable-card__header {
  display: flex; align-items: center; gap: 0.5rem;
  padding-bottom: 0.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--surface-border);
}
.responsable-card__header i { color: var(--primary-color); }
.responsable-card__header strong { font-size: 0.9rem; }

.responsable-card__modules { display: flex; flex-direction: column; gap: 0.35rem; }

.mini-module {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.5rem; border-radius: 6px; border-left: 3px solid var(--primary-color);
  background: var(--surface-card); transition: transform 0.15s;
}
.mini-module:hover { transform: translateX(3px); }
.mini-module__num { font-weight: 800; color: var(--primary-color); font-size: 0.85rem; min-width: 28px; }
.mini-module__title { font-size: 0.82rem; color: var(--text-color); }

/* ═══ PLANNING CIRCLES ═══ */
.planning-circles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }

.plan-circle { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
.plan-circle span { font-size: 0.8rem; color: var(--text-color-secondary); }

.plan-circle__ring {
  width: 56px; height: 56px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.85rem; color: white;
}
.ring--green { background: #10b981; }
.ring--amber { background: #f59e0b; }
.ring--red   { background: #ef4444; }
.ring--blue  { background: #3b82f6; }

.issues-list { border-top: 1px solid var(--surface-border); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; }
.issue-row {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.6rem; border-radius: 6px; background: var(--surface-50);
  font-size: 0.85rem; transition: background 0.15s;
}
.issue-row:hover { background: var(--surface-100); }
.issue-row__detail { margin-left: auto; font-size: 0.8rem; color: var(--text-color-secondary); }

/* ═══ ALERTS ═══ */
.alerts-stack { display: flex; flex-direction: column; gap: 0.5rem; }

.alert-card {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.85rem 1rem; border-radius: 10px; border-left: 4px solid transparent;
}
.alert-card--warning { background: #fffbeb; border-left-color: #f59e0b; }
.alert-card--warning .alert-card__icon { color: #f59e0b; }
.alert-card--info    { background: #eff6ff; border-left-color: #3b82f6; }
.alert-card--info .alert-card__icon    { color: #3b82f6; }
.alert-card--danger,
.alert-card--error   { background: #fef2f2; border-left-color: #ef4444; }
.alert-card--danger .alert-card__icon,
.alert-card--error .alert-card__icon   { color: #ef4444; }
.alert-card--success { background: #f0fdf4; border-left-color: #10b981; }
.alert-card--success .alert-card__icon { color: #10b981; }

.alert-card__icon { font-size: 1.1rem; margin-top: 2px; }
.alert-card__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.alert-card__body strong { font-size: 0.9rem; color: var(--text-color); }
.alert-card__body span { font-size: 0.82rem; color: var(--text-color-secondary); }

.no-alerts-banner {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1rem; background: #f0fdf4; border-radius: 10px; color: #16a34a;
}
.no-alerts-banner i { font-size: 1.25rem; }

/* ═══ EMPTY STATES ═══ */
.empty-state { text-align: center; padding: 2rem; color: var(--text-color-secondary); }
.empty-state i { font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.35; display: block; }
.empty-state small { color: var(--text-color-secondary); font-size: 0.85rem; }

.empty-state-small { text-align: center; padding: 2rem 1rem; color: var(--text-color-secondary); }
.empty-state-small i { font-size: 2rem; opacity: 0.35; display: block; margin-bottom: 0.5rem; }
.empty-state-small p { margin: 0; font-size: 0.9rem; }

/* ═══ UTILITIES ═══ */
.ml-2 { margin-left: 0.5rem; }
.ml-auto { margin-left: auto; }
.mr-2 { margin-right: 0.5rem; }

/* ═══ RESPONSIVE ═══ */
@media (max-width: 1200px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
  .week-calendar { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .dashboard-rm { padding: 1rem; }
  .stats-row { grid-template-columns: 1fr; }
  .two-col { grid-template-columns: 1fr; }
  .quick-grid { grid-template-columns: repeat(2, 1fr); }
  .planning-circles { grid-template-columns: repeat(2, 1fr); }
  .week-calendar { grid-template-columns: 1fr; }
  .slot-row { flex-direction: column; align-items: flex-start; }
  .slot-row__tags { flex-wrap: wrap; }
  .card-section__header { flex-direction: column; align-items: flex-start; }
  .card-section__toolbar { width: 100%; flex-wrap: wrap; }
}
</style>
