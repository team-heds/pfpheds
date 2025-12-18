<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        :title="module ? module.title : 'Gestion du module'" 
        :subtitle="`Module ${module?.number || ''} - Année ${module?.year || ''}`"
        icon="pi pi-cog"
      >
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin/dashboard-rm" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300"></i>
            <span class="text-900">Gestion du module</span>
          </div>
        </template>
      </PageHeader>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Chargement du module...</p>
    </div>

    <!-- Permission refusée -->
    <div v-else-if="!canEdit" class="permission-denied">
      <Card>
        <template #content>
          <div class="text-center p-5">
            <i class="pi pi-lock text-6xl text-red-500 mb-3"></i>
            <h2>Accès refusé</h2>
            <p class="text-600">{{ permissionError }}</p>
            <Button label="Retour au dashboard" icon="pi pi-arrow-left" @click="$router.push('/admin/dashboard-rm')" class="mt-3" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Contenu principal -->
    <div v-else class="module-manage-container">
      
      <!-- Actions rapides -->
      <div class="module-actions-bar">
        <Button 
          icon="pi pi-calendar" 
          label="Planning du module" 
          severity="info"
          @click="$router.push(`/admin/modules/${moduleId}/planning`)"
        />
        <Button 
          icon="pi pi-users" 
          label="Enseignants" 
          severity="secondary"
          outlined
          @click="activeTab = 1"
        />
      </div>
      
      <!-- Onglets de gestion -->
      <TabView>
        
        <!-- Onglet: Informations générales -->
        <TabPanel header="Informations générales">
          <Card>
            <template #content>
              <form @submit.prevent="saveModule" class="p-fluid">
                <div class="grid">
                  <!-- Numéro du module -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="number">Numéro du module *</label>
                      <InputText 
                        id="number" 
                        v-model="moduleForm.number" 
                        placeholder="Ex: M1.1"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Année -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="year">Année *</label>
                      <Dropdown 
                        id="year" 
                        v-model="moduleForm.year" 
                        :options="[1, 2, 3]" 
                        placeholder="Sélectionner l'année"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Titre -->
                  <div class="col-12">
                    <div class="field">
                      <label for="title">Titre du module *</label>
                      <InputText 
                        id="title" 
                        v-model="moduleForm.title" 
                        placeholder="Ex: Anatomie et physiologie humaine"
                      />
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="col-12">
                    <div class="field">
                      <label for="description">Description</label>
                      <Textarea 
                        id="description" 
                        v-model="moduleForm.description" 
                        rows="5"
                        placeholder="Description détaillée du module..."
                      />
                    </div>
                  </div>

                  <!-- Responsable -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="responsable">Responsable</label>
                      <InputText 
                        id="responsable" 
                        v-model="moduleForm.responsable" 
                        placeholder="Nom du responsable"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Email du responsable -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="responsable_email">Email du responsable</label>
                      <InputText 
                        id="responsable_email" 
                        v-model="moduleForm.responsable_email" 
                        type="email"
                        placeholder="email@hevs.ch"
                        :disabled="!isAdmin"
                      />
                      <small class="text-500">L'email détermine qui peut gérer ce module</small>
                    </div>
                  </div>

                  <!-- Crédits ECTS -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="credits">Crédits ECTS</label>
                      <InputNumber 
                        id="credits" 
                        v-model="moduleForm.credits" 
                        :min="0"
                        :max="30"
                      />
                    </div>
                  </div>

                  <!-- Heures de contact -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="heures_contact">Heures de contact</label>
                      <InputNumber 
                        id="heures_contact" 
                        v-model="moduleForm.heures_contact" 
                        :min="0"
                      />
                    </div>
                  </div>

                  <!-- Couleur -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="color">Couleur (planning)</label>
                      <ColorPicker v-model="moduleForm.color" format="hex" />
                    </div>
                  </div>

                  <!-- Code court -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="short_code">Code court</label>
                      <InputText 
                        id="short_code" 
                        v-model="moduleForm.short_code" 
                        placeholder="Ex: ANAT"
                      />
                    </div>
                  </div>

                  <!-- Coordinateur -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="coordinateur">Coordinateur</label>
                      <InputText 
                        id="coordinateur" 
                        v-model="moduleForm.coordinateur" 
                        placeholder="Nom du coordinateur"
                      />
                    </div>
                  </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex justify-content-end gap-2 mt-4">
                  <Button 
                    label="Annuler" 
                    icon="pi pi-times" 
                    severity="secondary" 
                    outlined
                    @click="$router.push('/admin/dashboard-rm')" 
                  />
                  <Button 
                    label="Enregistrer" 
                    icon="pi pi-check" 
                    type="submit"
                    :loading="saving"
                  />
                </div>
              </form>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Enseignants -->
        <TabPanel header="Enseignants">
          <Card>
            <template #content>
              <div class="mb-3">
                <Button 
                  label="Ajouter un enseignant" 
                  icon="pi pi-plus" 
                  @click="showAddTeacherDialog = true"
                />
              </div>

              <DataTable :value="moduleTeachers" responsiveLayout="scroll">
                <Column field="name" header="Nom"></Column>
                <Column field="email" header="Email"></Column>
                <Column field="hours" header="Heures">
                  <template #body="slotProps">
                    {{ slotProps.data.hours }}h
                  </template>
                </Column>
                <Column header="Actions">
                  <template #body="slotProps">
                    <Button 
                      icon="pi pi-trash" 
                      severity="danger" 
                      text 
                      @click="removeTeacher(slotProps.data)"
                    />
                  </template>
                </Column>
                <template #empty>
                  <div class="text-center p-4">
                    <i class="pi pi-users text-4xl text-400 mb-2"></i>
                    <p class="text-600">Aucun enseignant assigné</p>
                  </div>
                </template>
              </DataTable>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Planning -->
        <TabPanel header="Planning">
          <Card>
            <template #content>
              <!-- Header avec filtres -->
              <div class="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div class="flex align-items-center gap-3">
                  <h3 class="m-0">Planning du module</h3>
                  <Tag :value="`${filteredPlanning.length} séances`" severity="info" />
                </div>
                <div class="flex align-items-center gap-2 flex-wrap">
                  <Dropdown 
                    v-model="selectedYear"
                    :options="yearOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Année"
                    class="w-10rem"
                    @change="loadModulePlanning"
                  />
                  <Dropdown 
                    v-model="selectedClass"
                    :options="classOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Toutes les classes"
                    class="w-12rem"
                    showClear
                  />
                  <Button 
                    icon="pi pi-refresh" 
                    severity="secondary" 
                    outlined
                    @click="loadModulePlanning"
                    :loading="loadingPlanning"
                    v-tooltip="'Actualiser'"
                  />
                  <Button 
                    icon="pi pi-file-excel" 
                    severity="success" 
                    outlined
                    @click="exportPlanningToExcel"
                    :disabled="filteredPlanning.length === 0"
                    v-tooltip="'Exporter en Excel'"
                  />
                  <div class="flex border-round overflow-hidden">
                    <Button 
                      icon="pi pi-list" 
                      :severity="planningView === 'list' ? 'primary' : 'secondary'"
                      :outlined="planningView !== 'list'"
                      @click="planningView = 'list'"
                      v-tooltip="'Vue liste'"
                      class="border-noround-right"
                    />
                    <Button 
                      icon="pi pi-calendar" 
                      :severity="planningView === 'calendar' ? 'primary' : 'secondary'"
                      :outlined="planningView !== 'calendar'"
                      @click="planningView = 'calendar'"
                      v-tooltip="'Vue calendrier'"
                      class="border-noround-left"
                    />
                  </div>
                  <Button 
                    label="Gérer le planning" 
                    icon="pi pi-external-link" 
                    @click="$router.push(`/admin/modules/${moduleId}/planning`)"
                  />
                </div>
              </div>

              <!-- Liste des séances -->
              <div v-if="loadingPlanning" class="text-center p-4">
                <ProgressSpinner style="width: 40px; height: 40px" />
              </div>
              
              <div v-else-if="filteredPlanning.length === 0" class="text-center p-5">
                <i class="pi pi-calendar-times text-6xl text-400 mb-3"></i>
                <h4>Aucune séance planifiée</h4>
                <p class="text-600 mb-3">Ce module n'a pas encore de séances dans le planning</p>
                <Button 
                  label="Ajouter des séances" 
                  icon="pi pi-plus" 
                  @click="$router.push(`/admin/modules/${moduleId}/planning`)"
                />
              </div>

              <!-- Vue Liste -->
              <div v-else-if="planningView === 'list'" class="planning-list">
                <DataTable 
                  :value="filteredPlanning" 
                  responsiveLayout="scroll"
                  :paginator="filteredPlanning.length > 10"
                  :rows="10"
                  stripedRows
                >
                  <Column field="week_number" header="Semaine" sortable style="width: 80px">
                    <template #body="{ data }">
                      <Tag :value="`S${data.week_number}`" severity="secondary" />
                    </template>
                  </Column>
                  <Column field="day" header="Jour" sortable style="width: 100px">
                    <template #body="{ data }">
                      {{ formatDay(data.day) }}
                    </template>
                  </Column>
                  <Column field="date" header="Date" sortable style="width: 100px" />
                  <Column header="Horaire" style="width: 120px">
                    <template #body="{ data }">
                      <span class="font-semibold">{{ data.start_time?.substring(0,5) }} - {{ data.end_time?.substring(0,5) }}</span>
                    </template>
                  </Column>
                  <Column field="course_title" header="Cours" style="width: 180px">
                    <template #body="{ data }">
                      <span class="font-medium">{{ data.course_title || module?.title || '—' }}</span>
                    </template>
                  </Column>
                  <Column field="teacher_name" header="Enseignant" style="width: 150px">
                    <template #body="{ data }">
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-user text-500"></i>
                        <span>{{ data.teacher_name || '—' }}</span>
                      </div>
                    </template>
                  </Column>
                  <Column field="activity" header="Type" style="width: 100px">
                    <template #body="{ data }">
                      <Tag :value="data.activity || 'Cours'" :severity="getActivitySeverity(data.activity)" />
                    </template>
                  </Column>
                  <Column field="room" header="Salle" style="width: 100px">
                    <template #body="{ data }">
                      {{ data.room || '—' }}
                    </template>
                  </Column>
                  <Column field="class_code" header="Classe" style="width: 80px">
                    <template #body="{ data }">
                      <Tag 
                        :value="normalizeClass(data.class_code)" 
                        size="small"
                        :style="{ backgroundColor: '#' + getClassDisplayColor(data.class_code), color: getClassTextColor(data.class_code) }"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>

              <!-- Vue Calendrier -->
              <div v-else class="planning-calendar">
                <div v-for="week in calendarWeeks" :key="week.number" class="calendar-week mb-4">
                  <div class="week-header flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                    <Tag :value="`Semaine ${week.number}`" severity="info" />
                    <span class="text-600 text-sm">{{ week.dateRange }}</span>
                  </div>
                  
                  <div class="grid">
                    <div v-for="day in ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']" 
                         :key="day" 
                         class="col-12 md:col"
                    >
                      <div class="day-column surface-card border-round p-3 h-full" 
                           :class="{ 'surface-100': !getDaySlots(week.number, day).length }">
                        <div class="day-header font-semibold mb-2 text-primary">
                          {{ formatDay(day) }}
                        </div>
                        
                        <div v-if="getDaySlots(week.number, day).length === 0" 
                             class="text-400 text-sm text-center py-3">
                          —
                        </div>
                        
                        <div v-for="slot in getDaySlots(week.number, day)" 
                             :key="slot.id" 
                             class="calendar-slot mb-2 p-2 border-round border-left-3"
                             :style="{ 
                               borderLeftColor: '#' + getClassDisplayColor(slot.class_code),
                               backgroundColor: '#' + getClassDisplayColor(slot.class_code) + '20'
                             }">
                          <div class="flex justify-content-between align-items-center mb-1">
                            <span class="text-xs text-600">
                              {{ slot.start_time?.substring(0,5) }} - {{ slot.end_time?.substring(0,5) }}
                            </span>
                            <Tag 
                              :value="normalizeClass(slot.class_code)" 
                              size="small"
                              class="text-xs"
                              :style="{ backgroundColor: '#' + getClassDisplayColor(slot.class_code), color: getClassTextColor(slot.class_code) }"
                            />
                          </div>
                          <div class="font-medium text-sm mb-1">
                            {{ slot.course_title || module?.title || 'Cours' }}
                          </div>
                          <div v-if="slot.teacher_name" class="flex align-items-center gap-1 text-xs text-600">
                            <i class="pi pi-user" style="font-size: 0.7rem"></i>
                            {{ slot.teacher_name }}
                          </div>
                          <div class="flex gap-1 mt-2 flex-wrap">
                            <Tag :value="slot.activity || 'Cours'" :severity="getActivitySeverity(slot.activity)" class="text-xs" />
                            <Tag v-if="slot.room" :value="slot.room" severity="secondary" class="text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="calendarWeeks.length === 0" class="text-center p-4 text-600">
                  Aucune semaine à afficher
                </div>
              </div>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Statistiques -->
        <TabPanel header="Statistiques">
          <div class="grid">
            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-users text-4xl text-primary mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleStats.totalStudents }}</div>
                    <div class="text-600">Étudiants</div>
                  </div>
                </template>
              </Card>
            </div>
            
            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-clock text-4xl text-green-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleForm.heures_contact || 0 }}h</div>
                    <div class="text-600">Heures de contact</div>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-star-fill text-4xl text-orange-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleForm.credits || 0 }}</div>
                    <div class="text-600">Crédits ECTS</div>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-book text-4xl text-purple-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleTeachers.length }}</div>
                    <div class="text-600">Enseignants</div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </TabPanel>

      </TabView>
    </div>

    <!-- Dialog: Ajouter un enseignant -->
    <Dialog v-model:visible="showAddTeacherDialog" header="Ajouter un enseignant" :style="{ width: '450px' }" modal>
      <div class="p-fluid">
        <div class="field">
          <label for="teacher-name">Nom</label>
          <InputText id="teacher-name" v-model="newTeacher.name" />
        </div>
        <div class="field">
          <label for="teacher-email">Email</label>
          <InputText id="teacher-email" v-model="newTeacher.email" type="email" />
        </div>
        <div class="field">
          <label for="teacher-hours">Heures</label>
          <InputNumber id="teacher-hours" v-model="newTeacher.hours" />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" text @click="showAddTeacherDialog = false" />
        <Button label="Ajouter" icon="pi pi-check" @click="addTeacher" />
      </template>
    </Dialog>

  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useModules } from '@/composables/useModules'
import { useModulePermissions } from '@/composables/useModulePermissions'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import ColorPicker from 'primevue/colorpicker'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { supabase } from '@/supabase'
import * as XLSX from 'xlsx'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { modules, loadModules, updateModule: updateModuleInStore } = useModules()
const { canEditModule, isAdmin, getPermissionErrorMessage } = useModulePermissions()

const moduleId = parseInt(route.params.id)
const loading = ref(true)
const saving = ref(false)
const module = ref(null)
const permissionError = ref('')
const canEdit = ref(false)

// Formulaire du module
const moduleForm = ref({
  number: '',
  year: null,
  title: '',
  description: '',
  responsable: '',
  responsable_email: '',
  credits: null,
  heures_contact: null,
  color: '#3B82F6',
  short_code: '',
  coordinateur: ''
})

// Enseignants du module
const moduleTeachers = ref([])
const showAddTeacherDialog = ref(false)
const newTeacher = ref({
  name: '',
  email: '',
  hours: 0
})

// Statistiques
const moduleStats = ref({
  totalStudents: 0,
  totalHours: 0
})

// Planning du module
const modulePlanning = ref([])
const loadingPlanning = ref(false)
const selectedYear = ref('2024-2025')
const selectedClass = ref(null)
const planningView = ref('list') // 'list' ou 'calendar'

const yearOptions = [
  { label: '2024-2025', value: '2024-2025' },
  { label: '2023-2024', value: '2023-2024' },
  { label: '2025-2026', value: '2025-2026' }
]

// Normaliser le code classe (B25-tp = B25-TP) - utilisé partout
const normalizeClass = (code) => {
  if (!code) return ''
  return code.toUpperCase().trim()
}

// Options de classes (calculées et normalisées)
const classOptions = computed(() => {
  const classes = new Set()
  modulePlanning.value.forEach(slot => {
    if (slot.class_code) classes.add(normalizeClass(slot.class_code))
  })
  return [
    { label: 'Toutes les classes', value: null },
    ...Array.from(classes).sort().map(c => ({ label: c, value: c }))
  ]
})

// Planning filtré par classe (comparaison normalisée)
const filteredPlanning = computed(() => {
  if (!selectedClass.value) return modulePlanning.value
  const normalizedFilter = normalizeClass(selectedClass.value)
  return modulePlanning.value.filter(slot => normalizeClass(slot.class_code) === normalizedFilter)
})

// Semaines pour la vue calendrier
const calendarWeeks = computed(() => {
  const weeks = new Map()
  filteredPlanning.value.forEach(slot => {
    if (!weeks.has(slot.week_number)) {
      weeks.set(slot.week_number, {
        number: slot.week_number,
        dateRange: getWeekDateRange(slot.week_number, slot.date)
      })
    }
  })
  return Array.from(weeks.values()).sort((a, b) => a.number - b.number)
})

// Obtenir la plage de dates d'une semaine
const getWeekDateRange = (weekNumber, sampleDate) => {
  if (!sampleDate) return ''
  try {
    const date = new Date(sampleDate)
    const day = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    return `${monday.toLocaleDateString('fr-CH')} - ${friday.toLocaleDateString('fr-CH')}`
  } catch {
    return ''
  }
}

// Obtenir les créneaux d'un jour spécifique
const getDaySlots = (weekNumber, day) => {
  return filteredPlanning.value
    .filter(slot => slot.week_number === weekNumber && slot.day?.toLowerCase() === day.toLowerCase())
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
}

// Couleur selon l'activité (pour bordure calendrier)
const getActivityColor = (activity) => {
  const colors = {
    'Cours': '#3B82F6',
    'TP': '#22C55E',
    'TD': '#F59E0B',
    'Examen': '#EF4444',
    'Atelier': '#6B7280'
  }
  return colors[activity] || '#3B82F6'
}

// Charger le module
onMounted(async () => {
  try {
    await loadModules()
    
    // Trouver le module
    module.value = modules.value.find(m => m.id === moduleId)
    
    if (!module.value) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Module non trouvé',
        life: 3000
      })
      router.push('/admin/dashboard-rm')
      return
    }
    
    // Vérifier les permissions
    canEdit.value = canEditModule(module.value)
    
    if (!canEdit.value) {
      permissionError.value = getPermissionErrorMessage('edit')
      loading.value = false
      return
    }
    
    // Remplir le formulaire
    moduleForm.value = {
      number: module.value.number || '',
      year: module.value.year || null,
      title: module.value.title || '',
      description: module.value.description || '',
      responsable: module.value.responsable || '',
      responsable_email: module.value.responsable_email || '',
      credits: module.value.credits || null,
      heures_contact: module.value.heures_contact || null,
      color: module.value.color || '#3B82F6',
      short_code: module.value.short_code || '',
      coordinateur: module.value.coordinateur || ''
    }
    
    // Charger le planning du module
    await loadModulePlanning()
    
    // Charger les enseignants du module
    await loadModuleTeachers()
    
  } catch (error) {
    console.error('Erreur chargement module:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le module',
      life: 3000
    })
  } finally {
    loading.value = false
  }
})

// Sauvegarder le module
const saveModule = async () => {
  saving.value = true
  
  try {
    await updateModuleInStore(moduleId, moduleForm.value)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Module mis à jour avec succès',
      life: 3000
    })
    
    // Recharger les modules
    await loadModules()
    
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le module',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// Ajouter un enseignant
const addTeacher = () => {
  if (!newTeacher.value.name || !newTeacher.value.email) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir tous les champs',
      life: 3000
    })
    return
  }
  
  moduleTeachers.value.push({ ...newTeacher.value, id: Date.now() })
  
  newTeacher.value = {
    name: '',
    email: '',
    hours: 0
  }
  
  showAddTeacherDialog.value = false
  
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Enseignant ajouté',
    life: 3000
  })
}

// Retirer un enseignant
const removeTeacher = (teacher) => {
  if (confirm(`Retirer ${teacher.name} de ce module ?`)) {
    moduleTeachers.value = moduleTeachers.value.filter(t => t.id !== teacher.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Enseignant retiré',
      life: 3000
    })
  }
}

// Charger le planning du module depuis planning_time_slots
const loadModulePlanning = async () => {
  if (!module.value?.code) return
  
  loadingPlanning.value = true
  try {
    const { data, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .eq('module_code', module.value.code)
      .order('week_number', { ascending: true })
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) {
      console.warn('Erreur chargement planning:', error)
      modulePlanning.value = []
      return
    }
    
    modulePlanning.value = data || []
    console.log('📅 Planning chargé:', modulePlanning.value.length, 'séances')
  } catch (error) {
    console.error('Erreur planning:', error)
    modulePlanning.value = []
  } finally {
    loadingPlanning.value = false
  }
}

// Charger les enseignants du module (course_teachers + planning)
const loadModuleTeachers = async () => {
  if (!module.value?.code) return
  
  try {
    const teachersMap = new Map()
    
    // 1. Récupérer les enseignants via course_teachers
    const { data, error } = await supabase
      .from('course_teachers')
      .select(`
        teacher_id,
        hours,
        user_profiles(
          user_id,
          email,
          forname,
          family_name,
          display_name,
          avatar_url
        )
      `)
    
    if (!error && data) {
      data.forEach(ct => {
        const id = ct.teacher_id
        if (!teachersMap.has(id)) {
          teachersMap.set(id, {
            id,
            name: ct.user_profiles?.display_name || 
                  `${ct.user_profiles?.forname || ''} ${ct.user_profiles?.family_name || ''}`.trim() || 'Inconnu',
            email: ct.user_profiles?.email || '',
            avatar: ct.user_profiles?.avatar_url,
            hours: 0,
            source: 'course_teachers'
          })
        }
        teachersMap.get(id).hours += ct.hours || 0
      })
    }
    
    // 2. Ajouter les enseignants du planning (teacher_name)
    if (modulePlanning.value.length > 0) {
      const planningTeachers = new Set()
      modulePlanning.value.forEach(slot => {
        if (slot.teacher_name && slot.teacher_name.trim()) {
          planningTeachers.add(slot.teacher_name.trim())
        }
      })
      
      planningTeachers.forEach(teacherName => {
        // Vérifier si pas déjà dans la liste (par nom)
        const exists = Array.from(teachersMap.values()).some(t => 
          t.name.toLowerCase() === teacherName.toLowerCase()
        )
        if (!exists) {
          const id = `planning_${teacherName.replace(/\s+/g, '_')}`
          teachersMap.set(id, {
            id,
            name: teacherName,
            email: '',
            avatar: null,
            hours: 0,
            source: 'planning'
          })
        }
      })
    }
    
    moduleTeachers.value = Array.from(teachersMap.values())
    console.log('👥 Enseignants chargés:', moduleTeachers.value.length, '(course_teachers + planning)')
  } catch (error) {
    console.error('Erreur enseignants:', error)
    moduleTeachers.value = []
  }
}

// Formater le jour
const formatDay = (day) => {
  const days = {
    lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
    jeudi: 'Jeudi', vendredi: 'Vendredi', distance: 'Distance'
  }
  return days[day?.toLowerCase()] || day || '—'
}

// Couleur selon l'activité
const getActivitySeverity = (activity) => {
  const map = {
    'Cours': 'info',
    'TP': 'success',
    'TD': 'warning',
    'Examen': 'danger',
    'Atelier': 'secondary'
  }
  return map[activity] || 'info'
}

// Couleurs vives par classe pour l'affichage (plus distinctes)
const classDisplayColors = {
  'BA25-TP1': 'E53935', // Rouge
  'BA25-TP2': '43A047', // Vert
  'BA25-TP3': '1E88E5', // Bleu
  'BA25-TP4': 'FB8C00', // Orange
  'BA25-TP5': '8E24AA', // Violet
  'BA25-TP6': '00ACC1', // Cyan
  'BA25-TP7': 'F4511E', // Orange foncé
  'BA25-TP8': '3949AB', // Indigo
  'BA24-TP1': '7CB342', // Vert lime
  'BA24-TP2': 'FFB300', // Ambre
  'BA24-TP3': '039BE5', // Bleu clair
  'BA24-TP4': 'D81B60', // Rose
  'BA24-TP5': '5E35B1', // Violet foncé
  'BA24-TP6': '00897B', // Teal
}

// Couleurs pour l'export Excel (plus claires)
const classColors = {
  'BA25-TP1': 'FFC7CE', // Rouge clair
  'BA25-TP2': 'C6EFCE', // Vert clair
  'BA25-TP3': 'BDD7EE', // Bleu clair
  'BA25-TP4': 'FFEB9C', // Jaune clair
  'BA25-TP5': 'E4DFEC', // Violet clair
  'BA25-TP6': 'FFD9B3', // Orange clair
  'BA24-TP1': 'D9EAD3', // Vert menthe
  'BA24-TP2': 'FCE5CD', // Pêche
  'BA24-TP3': 'D0E0E3', // Cyan clair
  'BA24-TP4': 'F4CCCC', // Rose clair
}

// Obtenir couleur pour l'export Excel
const getClassColor = (classCode) => {
  const normalized = normalizeClass(classCode)
  return classColors[normalized] || 'FFFFFF'
}

// Obtenir couleur vive pour l'affichage
const getClassDisplayColor = (classCode) => {
  const normalized = normalizeClass(classCode)
  // Si pas de couleur définie, générer une couleur basée sur le hash du nom
  if (!classDisplayColors[normalized]) {
    const hash = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colors = ['E53935', '43A047', '1E88E5', 'FB8C00', '8E24AA', '00ACC1', '7CB342', 'FFB300', 'D81B60', '5E35B1']
    return colors[hash % colors.length]
  }
  return classDisplayColors[normalized]
}

// Obtenir couleur du texte (blanc ou noir selon la luminosité)
const getClassTextColor = (classCode) => {
  const color = getClassDisplayColor(classCode)
  // Calculer la luminosité
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// Export du planning en Excel avec feuilles par classe
const exportPlanningToExcel = () => {
  if (filteredPlanning.value.length === 0) return
  
  const wb = XLSX.utils.book_new()
  
  // Colonnes définies
  const colWidths = [
    { wch: 10 }, // Semaine
    { wch: 12 }, // Jour
    { wch: 12 }, // Date
    { wch: 8 },  // Début
    { wch: 8 },  // Fin
    { wch: 25 }, // Cours
    { wch: 12 }, // Type
    { wch: 22 }, // Enseignant
    { wch: 12 }, // Classe
    { wch: 15 }, // Salle
    { wch: 30 }  // Commentaire
  ]
  
  // Grouper les données par classe (normalisée)
  const byClass = new Map()
  filteredPlanning.value.forEach(slot => {
    const normalizedClass = normalizeClass(slot.class_code) || 'Sans classe'
    if (!byClass.has(normalizedClass)) {
      byClass.set(normalizedClass, [])
    }
    byClass.get(normalizedClass).push(slot)
  })
  
  // Si une seule classe filtrée, créer une seule feuille
  if (selectedClass.value || byClass.size === 1) {
    const data = filteredPlanning.value.map(slot => ({
      'Semaine': slot.week_number || '',
      'Jour': formatDay(slot.day),
      'Date': slot.date || '',
      'Début': slot.start_time?.substring(0,5) || '',
      'Fin': slot.end_time?.substring(0,5) || '',
      'Cours': slot.course_title || module.value?.title || '',
      'Type': slot.activity || slot.activity_type || 'Cours',
      'Enseignant': slot.teacher_name || '',
      'Classe': normalizeClass(slot.class_code),
      'Salle': slot.room || '',
      'Commentaire': slot.comment || slot.notes || ''
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = colWidths
    
    const sheetName = normalizeClass(selectedClass.value) || 'Planning'
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))
  } else {
    // Créer une feuille par classe
    const sortedClasses = Array.from(byClass.keys()).sort()
    
    sortedClasses.forEach(classCode => {
      const slots = byClass.get(classCode)
      const data = slots.map(slot => ({
        'Semaine': slot.week_number || '',
        'Jour': formatDay(slot.day),
        'Date': slot.date || '',
        'Début': slot.start_time?.substring(0,5) || '',
        'Fin': slot.end_time?.substring(0,5) || '',
        'Cours': slot.course_title || module.value?.title || '',
        'Type': slot.activity || slot.activity_type || 'Cours',
        'Enseignant': slot.teacher_name || '',
        'Classe': classCode,
        'Salle': slot.room || '',
        'Commentaire': slot.comment || slot.notes || ''
      }))
      
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = colWidths
      
      // Ajouter couleur de fond pour le header (ligne 1)
      const color = getClassColor(classCode)
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C })
        if (!ws[addr]) continue
        ws[addr].s = {
          fill: { fgColor: { rgb: color } },
          font: { bold: true }
        }
      }
      
      XLSX.utils.book_append_sheet(wb, ws, classCode.substring(0, 31))
    })
    
    // Ajouter une feuille récapitulative
    const summaryData = sortedClasses.map(classCode => ({
      'Classe': classCode,
      'Nb Séances': byClass.get(classCode).length,
      'Couleur': getClassColor(classCode) === 'FFFFFF' ? 'Blanc' : 'Voir onglet'
    }))
    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    summaryWs['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Récapitulatif')
  }
  
  // Générer le nom du fichier
  const moduleCode = module.value?.code || 'module'
  const classLabel = normalizeClass(selectedClass.value) || 'all'
  const fileName = `Planning_${moduleCode}_${classLabel}_${selectedYear.value}.xlsx`
  
  // Télécharger le fichier
  XLSX.writeFile(wb, fileName)
  
  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: `${filteredPlanning.value.length} séances exportées (${byClass.size} classe${byClass.size > 1 ? 's' : ''})`,
    life: 3000
  })
}
</script>

<style scoped>
.module-manage-container {
  padding: 2rem;
}

.module-actions-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.loading-container,
.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

:deep(.p-tabview-nav) {
  background: var(--surface-card);
}

:deep(.p-tabview-panels) {
  padding: 1.5rem;
  background: transparent;
}

/* Vue Calendrier */
.planning-calendar {
  overflow-x: auto;
}

.calendar-week {
  background: var(--surface-ground);
  border-radius: 0.5rem;
  padding: 1rem;
}

.day-column {
  min-height: 120px;
  border: 1px solid var(--surface-border);
}

.calendar-slot {
  background: var(--surface-0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.calendar-slot:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* Toggle buttons */
.border-noround-right {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.border-noround-left {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}
</style>
