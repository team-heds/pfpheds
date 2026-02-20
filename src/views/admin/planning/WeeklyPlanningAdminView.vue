<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Planification Hebdomadaire" 
        subtitle="Gestion des horaires, enseignants et activités par semaine" 
        icon="pi pi-calendar" 
      />
    </template>

    <div class="weekly-planning-admin">
      <!-- Actions rapides -->
      <Card v-if="!isReadOnly">
        <template #content>
          <div class="flex gap-2 flex-wrap justify-content-end">
            <Button
              label="Retour Planning"
              icon="pi pi-arrow-left"
              @click="goToAnnualPlanning"
              outlined
            />
            <Button 
              label="Vue Public"
              icon="pi pi-eye"
              @click="goToPublicView"
              severity="secondary"
            />
          </div>
        </template>
      </Card>

      <!-- Sélection améliorée -->
      <div class="selection-panel">
        <Card class="selection-card">
          <template #content>
            <div class="selection-item">
              <div class="selection-icon">
                <i class="pi pi-calendar text-4xl text-primary"></i>
              </div>
              <div class="selection-content">
                <label class="selection-label">Année académique</label>
                <Dropdown 
                  v-model="selectedYear"
                  :options="yearOptions"
                  optionLabel="label"
                  optionValue="value"
                  @change="loadPlanningForCurrentView"
                  class="w-full selection-dropdown"
                />
              </div>
            </div>
          </template>
        </Card>

        <Card class="selection-card">
          <template #content>
            <div class="selection-item">
              <div class="selection-icon">
                <i class="pi pi-eye text-4xl text-cyan-500"></i>
              </div>
              <div class="selection-content">
                <label class="selection-label">Mode d'affichage</label>
                <Dropdown 
                  v-model="viewMode"
                  :options="viewModeOptions"
                  optionLabel="label"
                  optionValue="value"
                  @change="onViewModeChange"
                  class="w-full selection-dropdown"
                >
                  <template #value="{ value }">
                    <Tag 
                      :value="viewModeOptions.find(v => v.value === value)?.label" 
                      :severity="value === 'week' ? 'info' : 'warning'"
                      :icon="value === 'week' ? 'pi pi-calendar' : 'pi pi-calendar-times'"
                    />
                  </template>
                </Dropdown>
              </div>
            </div>
          </template>
        </Card>

        <Card v-if="viewMode === 'week'" class="selection-card week-selector">
          <template #content>
            <div class="selection-item">
              <div class="selection-icon">
                <i class="pi pi-clock text-4xl text-orange-500"></i>
              </div>
              <div class="selection-content">
                <label class="selection-label">Semaine</label>
                <div class="week-navigation">
                  <Button 
                    icon="pi pi-chevron-left" 
                    @click="previousWeek"
                    outlined
                    rounded
                    v-tooltip="'Semaine précédente'"
                  />
                  <Dropdown 
                    v-model="selectedWeek"
                    :options="weekOptions"
                    optionLabel="label"
                    optionValue="value"
                    @change="loadPlanningForCurrentView"
                    filter
                    class="flex-1 selection-dropdown"
                  />
                  <Button 
                    icon="pi pi-chevron-right" 
                    @click="nextWeek"
                    outlined
                    rounded
                    v-tooltip="'Semaine suivante'"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Actions -->
      <Card>
        <template #content>
          <div class="flex gap-2 flex-wrap justify-content-center">
            <!-- Fonctionnalité de génération depuis minibrick désactivée (migration Supabase) -->
            <!--
            <Button 
              v-if="viewMode === 'week'"
              label="Générer depuis Minibrick"
              icon="pi pi-sync"
              @click="generateFromMinibrick"
              severity="warning"
              v-tooltip="'Créer automatiquement les créneaux depuis le planning annuel'"
            />
            
            <Button 
              v-if="viewMode !== 'week'"
              label="Générer Semestre depuis Minibrick"
              icon="pi pi-sync"
              @click="generateSemesterFromMinibrick"
              severity="warning"
              v-tooltip="'Créer automatiquement tous les créneaux du semestre'"
            />
            -->
            
            <Button 
              v-if="viewMode === 'week' && !isReadOnly"
              label="Dupliquer Semaine"
              icon="pi pi-copy"
              @click="showDuplicateDialog = true"
              v-tooltip="'Dupliquer une semaine existante'"
            />
            
            <Button 
              label="Exporter Excel"
              icon="pi pi-file-excel"
              @click="exportToExcel"
              severity="success"
              v-tooltip="viewMode === 'week' ? 'Exporter le planning de la semaine en Excel' : 'Exporter le planning du semestre en Excel'"
            />
          </div>
        </template>
      </Card>

      <!-- Planning de la semaine -->
      <Card v-if="viewMode === 'week' && selectedWeek || viewMode !== 'week'">
        <template #header>
          <div class="flex justify-content-between align-items-center p-3">
            <div>
              <h2 class="text-2xl font-bold m-0">
                <span v-if="viewMode === 'week'">Semaine {{ selectedWeek }}</span>
                <span v-else-if="viewMode === 'semester1'">Semestre de Printemps (S8-S37)</span>
                <span v-else-if="viewMode === 'semester2'">Semestre d'Automne (S38-S7)</span>
              </h2>
              <p class="text-600 mt-1">
                <span v-if="viewMode === 'week'">{{ getSemesterLabel(selectedWeek) }}</span>
                <span v-else>{{ timeSlots.length }} créneaux au total</span>
              </p>
            </div>
            <Button 
              v-if="viewMode === 'week' && !isReadOnly"
              label="Ajouter un créneau"
              icon="pi pi-plus"
              @click="openSlotDialog()"
              severity="success"
            />
          </div>
        </template>
        
        <template #content>
          <DataTable
            :value="sortedTimeSlots"
            :rows="viewMode === 'week' ? 20 : 50"
            :paginator="viewMode !== 'week'"
            :paginatorTemplate="viewMode !== 'week' ? 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown' : ''"
            :rowsPerPageOptions="viewMode !== 'week' ? [20, 50, 100, 200] : []"
            currentPageReportTemplate="{first} à {last} sur {totalRecords} créneaux"
            :scrollable="viewMode !== 'week'"
            scrollHeight="70vh"
            :virtualScrollerOptions="viewMode !== 'week' ? { itemSize: 46, delay: 0 } : null"
            responsiveLayout="scroll"
            class="p-datatable-sm weekly-planning-table"
            :rowClass="getRowClass"
            rowGroupMode="subheader"
            :groupRowsBy="groupField"
            :expandableRowGroups="true"
            v-model:expandedRowGroups="expandedGroups"
          >
            <template #groupheader="slotProps">
              <div class="day-group-header">
                <div class="day-info">
                  <Tag 
                    v-if="viewMode !== 'week'"
                    :value="`S${slotProps.data.weekNumber}`" 
                    severity="info"
                    class="font-bold text-lg mr-2"
                  ></Tag>
                  <Tag 
                    :value="slotProps.data.day.toUpperCase()" 
                    :severity="getDaySeverity(slotProps.data.day)"
                    class="font-bold text-lg"
                  ></Tag>
                  <span v-if="slotProps.data.date" class="date-text">
                    {{ slotProps.data.date }}
                  </span>
                </div>
                <div class="module-info" v-if="getGroupMainModule(slotProps.data.dayGroup)">
                  <div 
                    class="module-badge-header"
                    :style="{ backgroundColor: getGroupMainModule(slotProps.data.dayGroup)?.color || '#CCCCCC' }"
                  >
                    <span class="module-number-header">{{ getGroupMainModule(slotProps.data.dayGroup)?.number }}</span>
                    <span class="module-name-header">{{ getGroupMainModule(slotProps.data.dayGroup)?.title }}</span>
                  </div>
                </div>
                <div class="slots-count">
                  <i class="pi pi-clock mr-2"></i>
                  <span>{{ getGroupSlotCount(slotProps.data.dayGroup) }} créneau(x)</span>
                </div>
              </div>
            </template>
            
            <Column :field="groupField" header="Jour" style="display: none;"></Column>
            
            <Column v-if="viewMode !== 'week'" field="weekNumber" header="Semaine" style="width: 8rem">
              <template #body="slotProps">
                <Tag :value="`S${slotProps.data.weekNumber}`" severity="info" class="font-bold" />
              </template>
            </Column>
            
            <Column field="startTime" header="Horaire" style="width: 10rem">
              <template #body="slotProps">
                <div class="horaire-cell">
                  <i class="pi pi-clock text-primary mr-2"></i>
                  <span class="font-bold">{{ slotProps.data.startTime }}</span>
                  <span class="mx-1">-</span>
                  <span class="font-bold">{{ slotProps.data.endTime }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="courseTitle" header="Nom du cours" style="min-width: 20rem">
              <template #body="slotProps">
                <div 
                  v-if="slotProps.data.moduleCode"
                  class="module-cell"
                >
                  <div class="course-title-text">{{ slotProps.data.courseTitle || slotProps.data.activity || slotProps.data.moduleTitle }}</div>
                </div>
                <span v-else class="text-500">-</span>
              </template>
            </Column>
            
            <Column field="activity" header="Détails / Activité" style="min-width: 15rem">
              <template #body="slotProps">
                <div class="activity-cell">
                  <i v-if="slotProps.data.activity" class="pi pi-book text-primary mr-2"></i>
                  <span class="text-sm">{{ slotProps.data.activity || '-' }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="teachers" header="Enseignants / Groupes (6 affichés)" style="min-width: 20rem">
              <template #body="slotProps">
                <div v-if="slotProps.data.teachers && slotProps.data.teachers.length > 0" class="teachers-cell">
                  <div v-for="(teacher, index) in slotProps.data.teachers.slice(0, 6)" :key="index" class="teacher-group">
                    <Chip 
                      :label="teacher" 
                      icon="pi pi-user"
                      class="teacher-chip"
                    />
                  </div>
                  <Badge v-if="slotProps.data.teachers.length > 6" :value="`+${slotProps.data.teachers.length - 6}`" severity="warning" />
                </div>
                <span v-else class="text-500">-</span>
              </template>
            </Column>
            
            <Column field="room" header="Salle" style="width: 8rem">
              <template #body="slotProps">
                <div v-if="slotProps.data.room" class="room-cell">
                  <i class="pi pi-home text-primary mr-1"></i>
                  <span class="font-semibold">{{ slotProps.data.room }}</span>
                </div>
                <span v-else class="text-500">-</span>
              </template>
            </Column>
            
            <Column field="moduleNumber" header="N° Module" :frozen="true" alignFrozen="right" style="width: 7rem">
              <template #body="slotProps">
                <div 
                  v-if="slotProps.data.moduleNumber"
                  class="module-number-badge"
                  :style="{ backgroundColor: getModuleColor(slotProps.data.moduleCode) }"
                >
                  {{ slotProps.data.moduleNumber }}
                </div>
                <span v-else class="text-500">-</span>
              </template>
            </Column>
            
            <Column v-if="viewMode === 'week' && !isReadOnly" header="Actions" :frozen="true" alignFrozen="right" style="width: 8rem">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button 
                    icon="pi pi-pencil"
                    @click="openSlotDialog(slotProps.data)"
                    size="small"
                    severity="info"
                    text
                    v-tooltip="'Modifier'"
                  />
                  <Button 
                    icon="pi pi-copy"
                    @click="duplicateSlot(slotProps.data)"
                    size="small"
                    severity="success"
                    text
                    v-tooltip="'Dupliquer'"
                  />
                  <Button 
                    icon="pi pi-trash"
                    @click="deleteSlot(slotProps.data.id)"
                    size="small"
                    severity="danger"
                    text
                    v-tooltip="'Supprimer'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Dialog pour éditer un créneau -->
      <Dialog 
        v-model:visible="showSlotDialog"
        :header="editingSlot ? 'Modifier le créneau' : 'Ajouter un créneau'"
        :style="{ width: '50rem' }"
        :modal="true"
      >
        <div class="grid gap-3">
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Jour :</label>
            <Dropdown 
              v-model="slotForm.day"
              :options="['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'distance']"
              placeholder="Sélectionner un jour"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Date :</label>
            <InputText 
              v-model="slotForm.date"
              placeholder="Ex: 16.02.2026"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Heure de début :</label>
            <InputText 
              v-model="slotForm.startTime"
              placeholder="Ex: 09h00"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Heure de fin :</label>
            <InputText 
              v-model="slotForm.endTime"
              placeholder="Ex: 11h00"
              class="w-full"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Module :</label>
            <Dropdown 
              v-model="slotForm.moduleCode"
              :options="moduleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner un module"
              filter
              class="w-full"
              @change="onModuleChange"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Titre du module :</label>
            <InputText 
              v-model="slotForm.moduleTitle"
              placeholder="Ex: M1012 - Raisonnement clinique 1b"
              class="w-full"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Nom du cours (affiché dans le planning) :</label>
            <Textarea 
              v-model="slotForm.courseTitle"
              placeholder="Ex: Introduction Module: questions-réponses en lien avec la vidéo et le guide du module"
              :rows="2"
              class="w-full"
            />
            <small class="text-500">Ce texte apparaîtra dans la colonne principale du planning</small>
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Détails / Activité complémentaire :</label>
            <Textarea 
              v-model="slotForm.activity"
              placeholder="Détails supplémentaires ou notes"
              :rows="2"
              class="w-full"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Enseignants :</label>
            <AutoComplete 
              v-model="slotForm.teachers"
              :suggestions="filteredTeachers"
              @complete="searchTeachers"
              optionLabel="name"
              placeholder="Saisissez un nom (Entrée pour valider) ou sélectionnez"
              multiple
              :forceSelection="false"
              class="w-full"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <i v-if="slotProps.option.isNew" class="pi pi-plus mr-2 text-green-500"></i>
                  <span :class="{ 'font-bold': slotProps.option.isNew }">
                    {{ slotProps.option.isNew ? 'Ajouter : ' : '' }}{{ slotProps.option.name }}
                  </span>
                  <span v-if="slotProps.option.email" class="text-xs text-500 ml-2">({{ slotProps.option.email }})</span>
                </div>
              </template>
            </AutoComplete>
            <small class="text-500">
              Vous pouvez ajouter plusieurs enseignants. Appuyez sur Entrée pour valider un nouveau nom.
              <span v-if="siTeachers.length > 0">({{ siTeachers.length }} disponibles)</span>
            </small>
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Salle :</label>
            <InputText 
              v-model="slotForm.room"
              placeholder="Numéro de salle"
              class="w-full"
            />
          </div>
          
          <div class="col-12 md:col-6">
            <label class="block mb-2 font-bold">Notes :</label>
            <InputText 
              v-model="slotForm.notes"
              placeholder="Notes additionnelles"
              class="w-full"
            />
          </div>
        </div>
        
        <template #footer>
          <Button label="Annuler" @click="showSlotDialog = false" text />
          <Button label="Enregistrer" @click="saveSlot" />
        </template>
      </Dialog>

      <!-- Dialog pour dupliquer une semaine -->
      <Dialog 
        v-model:visible="showDuplicateDialog"
        header="Dupliquer une semaine"
        :style="{ width: '30rem' }"
        :modal="true"
      >
        <div class="grid gap-3">
          <div class="col-12">
            <label class="block mb-2 font-bold">Semaine source :</label>
            <Dropdown 
              v-model="duplicateFrom"
              :options="weekOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner la semaine à dupliquer"
              filter
              class="w-full"
            />
          </div>
          
          <div class="col-12">
            <label class="block mb-2 font-bold">Semaine destination :</label>
            <Dropdown 
              v-model="duplicateTo"
              :options="weekOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner la semaine destination"
              filter
              class="w-full"
            />
          </div>
        </div>
        
        <template #footer>
          <Button label="Annuler" @click="showDuplicateDialog = false" text />
          <Button label="Dupliquer" @click="performDuplicate" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Chip from 'primevue/chip'
import AutoComplete from 'primevue/autocomplete'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import planningService from '@/service/planningService'
import academicYearService from '@/service/academicYearService'
import { getSITeachers } from '@/services/academicKpiService'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Liste des emails en lecture seule (sans accès aux modifications)
const readOnlyEmails = [
  'lucienne.darbellay-fumeaux@hevs.ch',
  'filipa.pereira@hevs.ch',
  'aline.chappuis@hevs.ch',
  'maude.epiney-perruchoud@hevs.ch',
  'isabelle.salamin-plaschy@hevs.ch',
  'rafael.weissbrodt@hevs.ch',
  'valerie.caloz-albrecht@hevs.ch',
  'tiffany.rapillard@hevs.ch',
  'omar.porteladossantos@hevs.ch',
  'jesse.curchod@hevs.ch',
  'line.martin@hevs.ch',
  'isabelle.rey@hevs.ch',
  'carla.gomesdarocha@hevs.ch',
  'elodie.perruchoud@hevs.ch'
]

// Vérifier si l'utilisateur est en mode lecture seule
const isReadOnly = computed(() => {
  const userEmail = authStore.user?.email?.toLowerCase()
  return userEmail && readOnlyEmails.includes(userEmail)
})

// État
const selectedYear = ref(null)
const selectedWeek = ref(null) // Pas de semaine par défaut, l'utilisateur doit choisir
const viewMode = ref('week') // 'week', 'semester1', 'semester2'
const timeSlots = ref([])
const courseModules = ref([])
const siTeachers = ref([])
const filteredTeachers = ref([])
const expandedGroups = ref(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'distance'])
const yearOptions = ref([])

const academicStartYear = ref(null) // Ex: 2025 pour l'année académique 2025-2026
const showSlotDialog = ref(false)
const editingSlot = ref(null)
const slotForm = ref({
  day: '',
  date: '',
  startTime: '',
  endTime: '',
  moduleCode: '',
  moduleNumber: '',
  moduleTitle: '',
  courseTitle: '',
  activity: '',
  teachers: [],
  room: '',
  notes: ''
})

const showDuplicateDialog = ref(false)
const duplicateFrom = ref(null)
const duplicateTo = ref(null)

// Options
const viewModeOptions = [
  { label: 'Semaine unique', value: 'week' },
  { label: 'Semestre d\'Automne (S38-S7)', value: 'semester2' },
  { label: 'Semestre de Printemps (S8-S37)', value: 'semester1' }
]

// Vérifie si une année ISO a 53 semaines
// Une année a 53 semaines si le 1er janvier est un jeudi,
// ou si le 31 décembre est un jeudi (années bissextiles commençant un mercredi)
const isoWeeksInYear = (year) => {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  return (jan1.getDay() === 4 || dec31.getDay() === 4) ? 53 : 52
}

const weekOptions = computed(() => {
  const weeks = []
  
  const aYear = academicStartYear.value || new Date().getFullYear()
  const maxAutumnWeek = isoWeeksInYear(aYear) // 52 ou 53
  
  // Semestre d'Automne : S38 → S52/S53, puis S1 → S7
  for (let w = 38; w <= maxAutumnWeek; w++) {
    weeks.push({ label: `Semaine ${w} (Automne)`, value: w })
  }
  for (let w = 1; w <= 7; w++) {
    weeks.push({ label: `Semaine ${w} (Automne)`, value: w })
  }
  
  // Semestre de Printemps : S8 → S37
  for (let w = 8; w <= 37; w++) {
    weeks.push({ label: `Semaine ${w} (Printemps)`, value: w })
  }
  
  return weeks
})

const moduleOptions = computed(() => {
  return courseModules.value.map(module => ({
    label: `[${module.module_number}] ${module.label}`,
    value: module.code
  }))
})

// Computed
const sortedTimeSlots = computed(() => {
  const dayOrder = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, distance: 6 }
  
  // Fonction pour obtenir l'ordre académique d'une semaine
  const getAcademicWeekOrder = (week) => {
    // Ordre académique : S38-S53 (0-15), S1-S7 (16-22), S8-S37 (23-52)
    if (week >= 38) {
      return week - 38 // 0 à 15 (inclut S53)
    } else if (week >= 1 && week <= 7) {
      return week + 15 // 16 à 22
    } else if (week >= 8 && week <= 37) {
      return week + 15 // 23 à 52
    }
    return 999 // Valeur par défaut pour semaines invalides
  }
  
  const sorted = [...timeSlots.value].sort((a, b) => {
    // Si mode semestre, trier d'abord par numéro de semaine (ordre académique)
    if (viewMode.value !== 'week') {
      const weekA = a.weekNumber || 0
      const weekB = b.weekNumber || 0
      
      const orderA = getAcademicWeekOrder(weekA)
      const orderB = getAcademicWeekOrder(weekB)
      
      if (orderA !== orderB) return orderA - orderB
    }
    
    // Puis par jour
    const dayDiff = dayOrder[a.day] - dayOrder[b.day]
    if (dayDiff !== 0) return dayDiff
    
    // Puis par heure
    return a.startTime.localeCompare(b.startTime)
  })
  
  // En mode semestre, ajouter un champ dayGroup pour grouper par semaine+jour
  if (viewMode.value !== 'week') {
    return sorted.map(slot => ({
      ...slot,
      dayGroup: `S${slot.weekNumber}_${slot.day}`
    }))
  }
  
  return sorted.map(slot => ({ ...slot, dayGroup: slot.day }))
})

// Clé de groupement dynamique
const groupField = computed(() => 'dayGroup')

// Fonctions
const onViewModeChange = async () => {
  await loadPlanningForCurrentView()
}

onMounted(async () => {
  // Charger les données nécessaires dans le bon ordre
  try {
    // 1. Charger les modules de cours en PREMIER
    courseModules.value = await planningService.getAllCourseModules()
    
    // 2. Charger les classes de l'année académique active
    await loadYearOptions()
    
    // 3. Sélectionner la semaine 39 par défaut
    if (!selectedWeek.value) {
      selectedWeek.value = 39
    }
    
    // 5. Charger les enseignants SI (avec fallback direct)
    const teachers = await getSITeachers()
    if (teachers && teachers.length > 0) {
      siTeachers.value = teachers
    } else {
      console.warn('⚠️ Aucun enseignant via service, tentative chargement direct...')
      // Fallback: requête directe
      const { data } = await supabase.from('user_profiles').select('*').eq('role', 'EnseignantSoins')
      if (data && data.length > 0) {
        siTeachers.value = data.map(t => ({
          id: t.user_id,
          name: t.display_name || `${t.forname} ${t.family_name}`,
          email: t.email
        }))
        console.log('✅ Enseignants chargés via fallback direct:', siTeachers.value.length)
      } else {
        console.error('❌ Aucun enseignant trouvé même en direct')
      }
    }
    
    // 6. Charger automatiquement le planning si l'année est définie
    if (selectedYear.value) {
      await loadPlanningForCurrentView()
    }
    
    console.log('✅ Initialisation terminée.')
    
  } catch (error) {
    console.error('Erreur initialisation:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données initiales',
      life: 3000
    })
  }
})

const loadWeekPlanning = async () => {
  if (!selectedWeek.value || !selectedYear.value) {
    console.warn('⚠️ Impossible de charger le planning:', { 
      selectedWeek: selectedWeek.value, 
      selectedYear: selectedYear.value 
    })
    return
  }
  
  try {
    console.log('🔄 Chargement planning pour:', { 
      year: selectedYear.value, 
      week: selectedWeek.value 
    })
    
    const slots = await planningService.getWeekTimeSlots(selectedYear.value, selectedWeek.value)
    
    console.log('✅ Créneaux reçus:', slots.length)
    
    // Convertir snake_case en camelCase pour compatibilité avec le template
    timeSlots.value = slots.map(slot => {
      const mod = courseModules.value.find(m => m.code === slot.module_code)
      // Recalculer la date dynamiquement depuis weekNumber + jour (au lieu de la date stockée en base qui peut être obsolète)
      const dayIndex = planningService.getDayIndex(slot.day)
      const computedDate = planningService.getDateForWeekAndDay(slot.week_number, dayIndex, academicStartYear.value)
      return {
        id: slot.id,
        day: slot.day,
        date: computedDate || slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        moduleCode: slot.module_code,
        moduleNumber: mod?.module_number || '',
        moduleTitle: mod?.label || '',
        courseTitle: slot.course_title,
        activity: slot.activity,
        teachers: slot.teachers || [],
        room: slot.room,
        notes: slot.notes,
        weekNumber: slot.week_number
      }
    })
    
    // Reset expanded groups pour le mode semaine
    expandedGroups.value = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'distance']
    
    console.log('✅ Planning chargé avec', timeSlots.value.length, 'créneaux')
    
    if (timeSlots.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'Information',
        detail: 'Aucun créneau trouvé pour cette semaine',
        life: 3000
      })
    }
  } catch (error) {
    console.error('❌ Erreur chargement planning:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le planning',
      life: 3000
    })
  }
}

const loadPlanningForCurrentView = async () => {
  if (viewMode.value === 'week') {
    if (selectedWeek.value) {
      await loadWeekPlanning()
    }
    return
  }

  if (viewMode.value === 'semester1') {
    await loadSemesterPlanning('spring')
    return
  }

  if (viewMode.value === 'semester2') {
    await loadSemesterPlanning('autumn')
  }
}

watch([selectedYear, viewMode, selectedWeek], async ([newYear, newMode, newWeek], [oldYear, oldMode, oldWeek]) => {
  if (!newYear) {
    return
  }

  if (newYear === oldYear && newMode === oldMode && newWeek === oldWeek) {
    return
  }

  await loadPlanningForCurrentView()
})

// Navigation entre semaines
const previousWeek = () => {
  const currentIndex = weekOptions.value.findIndex(w => w.value === selectedWeek.value)
  if (currentIndex > 0) {
    selectedWeek.value = weekOptions.value[currentIndex - 1].value
    loadWeekPlanning()
  }
}

const nextWeek = () => {
  const currentIndex = weekOptions.value.findIndex(w => w.value === selectedWeek.value)
  if (currentIndex < weekOptions.value.length - 1) {
    selectedWeek.value = weekOptions.value[currentIndex + 1].value
    loadWeekPlanning()
  }
}

const loadSemesterPlanning = async (semester) => {
  if (!selectedYear.value) return
  
  try {
    const slots = await planningService.getSemesterTimeSlots(selectedYear.value, semester)
    
    console.log('✅ Semestre chargé:', semester, '| slots:', slots.length)
    
    // Convertir snake_case en camelCase
    timeSlots.value = slots.map(slot => {
      const mod = courseModules.value.find(m => m.code === slot.module_code)
      const dayIndex = planningService.getDayIndex(slot.day)
      const computedDate = planningService.getDateForWeekAndDay(slot.week_number, dayIndex, academicStartYear.value)
      return {
        id: slot.id,
        day: slot.day,
        date: computedDate || slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        moduleCode: slot.module_code,
        moduleNumber: mod?.module_number || '',
        moduleTitle: mod?.label || '',
        courseTitle: slot.course_title,
        activity: slot.activity,
        teachers: slot.teachers || [],
        room: slot.room,
        notes: slot.notes,
        weekNumber: slot.week_number
      }
    })
    
    // Auto-expand tous les groupes en mode semestre
    const allGroups = [...new Set(timeSlots.value.map(s => `S${s.weekNumber}_${s.day}`))]
    expandedGroups.value = allGroups
    
    const semesterLabel = semester === 'spring' ? 'Printemps (S8-S37)' : 'Automne (S38-S7)'
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${timeSlots.value.length} créneaux chargés pour le semestre ${semesterLabel}`,
      life: 3000
    })
  } catch (error) {
    console.error('Erreur chargement semestre:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le semestre',
      life: 3000
    })
  }
}

const getRowClass = (data) => {
  const prevIndex = sortedTimeSlots.value.indexOf(data) - 1
  if (prevIndex >= 0) {
    const prevSlot = sortedTimeSlots.value[prevIndex]
    if (prevSlot.day !== data.day) {
      return 'day-separator'
    }
  }
  return ''
}

const getDaySeverity = (day) => {
  const severities = {
    lundi: 'info',
    mardi: 'success',
    mercredi: 'warning',
    jeudi: 'danger',
    vendredi: 'secondary',
    distance: 'contrast'
  }
  return severities[day] || 'info'
}

const duplicateSlot = async (slot) => {
  editingSlot.value = null
  slotForm.value = {
    ...slot,
    id: undefined // Nouveau ID sera généré
  }
  showSlotDialog.value = true
}

const getDaySlotCount = (day) => {
  return timeSlots.value.filter(slot => slot.day === day).length
}

const getDayDate = (day) => {
  const daySlots = timeSlots.value.filter(slot => slot.day === day)
  if (daySlots.length > 0 && daySlots[0].date) {
    return daySlots[0].date
  }
  return null
}

const getDayMainModule = (day) => {
  const daySlots = timeSlots.value.filter(slot => slot.day === day && slot.moduleCode)
  if (daySlots.length === 0) return null
  
  // Trouver le module le plus fréquent du jour
  const moduleCounts = {}
  daySlots.forEach(slot => {
    if (slot.moduleCode) {
      moduleCounts[slot.moduleCode] = (moduleCounts[slot.moduleCode] || 0) + 1
    }
  })
  
  const mainModuleCode = Object.keys(moduleCounts).reduce((a, b) => 
    moduleCounts[a] > moduleCounts[b] ? a : b
  )
  
  const firstSlot = daySlots.find(s => s.moduleCode === mainModuleCode)
  const moduleData = courseModules.value.find(m => m.code === mainModuleCode)
  
  return {
    code: mainModuleCode,
    number: moduleData?.module_number || mainModuleCode.toUpperCase(),
    title: moduleData?.label || 'Module',
    color: getModuleColor(mainModuleCode)
  }
}

// Versions par dayGroup (pour le mode semestre)
const getGroupSlotCount = (dayGroup) => {
  return sortedTimeSlots.value.filter(slot => slot.dayGroup === dayGroup).length
}

const getGroupMainModule = (dayGroup) => {
  const groupSlots = sortedTimeSlots.value.filter(slot => slot.dayGroup === dayGroup && slot.moduleCode)
  if (groupSlots.length === 0) return null
  
  const moduleCounts = {}
  groupSlots.forEach(slot => {
    if (slot.moduleCode) {
      moduleCounts[slot.moduleCode] = (moduleCounts[slot.moduleCode] || 0) + 1
    }
  })
  
  const mainModuleCode = Object.keys(moduleCounts).reduce((a, b) => 
    moduleCounts[a] > moduleCounts[b] ? a : b
  )
  
  const moduleData = courseModules.value.find(m => m.code === mainModuleCode)
  
  return {
    code: mainModuleCode,
    number: moduleData?.module_number || mainModuleCode.toUpperCase(),
    title: moduleData?.label || 'Module',
    color: getModuleColor(mainModuleCode)
  }
}

const openSlotDialog = async (slot = null) => {
  // Vérifier si les enseignants sont chargés
  if (siTeachers.value.length === 0) {
    console.log('Liste enseignants vide, tentative de rechargement...')
    try {
      const loaded = await getSITeachers()
      if (loaded && loaded.length > 0) {
        siTeachers.value = loaded
      } else {
        console.warn('Toujours aucun enseignant trouvé après rechargement')
      }
    } catch (e) {
      console.error('Erreur rechargement enseignants:', e)
    }
  }

  if (slot) {
    editingSlot.value = slot.id
    slotForm.value = { ...slot }
  } else {
    editingSlot.value = null
    slotForm.value = {
      day: '',
      date: '',
      startTime: '',
      endTime: '',
      moduleCode: '',
      moduleNumber: '',
      moduleTitle: '',
      courseTitle: '',
      activity: '',
      teachers: [],
      room: '',
      notes: ''
    }
  }
  showSlotDialog.value = true
}

const onModuleChange = () => {
  const module = courseModules.value.find(m => m.code === slotForm.value.moduleCode)
  if (module) {
    slotForm.value.moduleNumber = module.module_number
    slotForm.value.moduleTitle = `${module.module_number} - ${module.label}`
  }
}

const saveSlot = async () => {
  try {
    // Normaliser la liste des enseignants (garder uniquement les noms)
    const normalizedTeachers = (slotForm.value.teachers || []).map(t => {
      return typeof t === 'object' && t !== null ? t.name : t
    })

    const slotData = {
      id: editingSlot.value || null,
      classCode: selectedYear.value,
      weekNumber: selectedWeek.value,
      day: slotForm.value.day,
      date: slotForm.value.date,
      startTime: slotForm.value.startTime,
      endTime: slotForm.value.endTime,
      moduleCode: slotForm.value.moduleCode,
      courseTitle: slotForm.value.courseTitle,
      activity: slotForm.value.activity,
      teachers: normalizedTeachers,
      room: slotForm.value.room,
      notes: slotForm.value.notes
    }

    // Validation basique
    if (!slotData.startTime || !slotData.endTime) {
      if (slotData.day === 'distance') {
        // Valeurs par défaut pour distance si non spécifié
        slotData.startTime = slotData.startTime || '08:00'
        slotData.endTime = slotData.endTime || '17:00'
      } else {
        toast.add({
          severity: 'warn',
          summary: 'Attention',
          detail: 'Veuillez renseigner les horaires de début et de fin',
          life: 3000
        })
        return
      }
    }
    
    // Si date manquante pour distance, on essaie de la calculer (Samedi de la semaine)
    if (slotData.day === 'distance' && !slotData.date) {
      // Logique simplifiée : on laisse le backend ou planningService gérer la date si possible,
      // ou on force une date bidon valide si le backend l'exige impérativement.
      // Le service planningService.saveTimeSlot utilise this.getDateForWeekAndDay mais l'attend en paramètre si on passe un objet complet.
      // On va laisser le service gérer si c'est null, mais le service attend slotData.date.
      // On va essayer de récupérer la date du samedi via le service s'il est accessible, sinon on laisse null
      // et on espère que le service le gère.
      // UPDATE: le service planningService a une méthode getDateForWeekAndDay.
      try {
        slotData.date = planningService.getDateForWeekAndDay(slotData.weekNumber, 5, academicStartYear.value) // 5 = Samedi/Distance
      } catch (e) {
        console.warn('Impossible de calculer la date pour distance', e)
      }
    }
    
    await planningService.saveTimeSlot(slotData)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Créneau enregistré',
      life: 3000
    })
    
    showSlotDialog.value = false
    await loadWeekPlanning()
  } catch (error) {
    console.error('Erreur sauvegarde créneau:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le créneau',
      life: 3000
    })
  }
}

const deleteSlot = async (slotId) => {
  if (!confirm('Supprimer ce créneau ?')) return
  
  try {
    await planningService.deleteTimeSlot(slotId)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Créneau supprimé',
      life: 3000
    })
    await loadWeekPlanning()
  } catch (error) {
    console.error('Erreur suppression créneau:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le créneau',
      life: 3000
    })
  }
}

// Fonction generateFromMinibrick supprimée (nécessite migration complète du système minibrick)

const performDuplicate = async () => {
  if (!duplicateFrom.value || !duplicateTo.value) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner les semaines source et destination',
      life: 3000
    })
    return
  }
  
  try {
    await planningService.duplicateWeek(selectedYear.value, duplicateFrom.value, duplicateTo.value)
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Semaine dupliquée',
      life: 3000
    })
    showDuplicateDialog.value = false
    if (selectedWeek.value === duplicateTo.value) {
      await loadWeekPlanning()
    }
  } catch (error) {
    console.error('Erreur duplication:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de dupliquer la semaine',
      life: 3000
    })
  }
}

const searchTeachers = (event) => {
  const query = event.query.toLowerCase()
  
  // Filtrer les enseignants existants
  let filtered = []
  if (!query.trim()) {
    filtered = [...siTeachers.value]
  } else {
    filtered = siTeachers.value.filter(teacher => 
      teacher.name.toLowerCase().includes(query)
    )
  }
  
  // Ajouter l'option de création si le texte n'existe pas exactement
  if (query.trim() && !filtered.some(t => t.name.toLowerCase() === query)) {
    // On ajoute un objet temporaire qui sera normalisé à la sauvegarde
    filtered.unshift({ name: event.query, isNew: true })
  }
  
  filteredTeachers.value = filtered
}

const getModuleColor = (moduleCode) => {
  const module = courseModules.value.find(m => m.code === moduleCode)
  return module?.color || '#CCCCCC'
}

const getSemesterLabel = (week) => {
  return (week >= 38 || week <= 7) ? 'Semestre d\'Automne' : 'Semestre de Printemps'
}

const getSelectedYearLabel = () => {
  const selectedOption = yearOptions.value.find(option => option.value === selectedYear.value)
  if (!selectedOption?.label) {
    return selectedYear.value || ''
  }

  const parts = selectedOption.label.split('/')
  return (parts[1] || selectedOption.label).trim()
}

const getCourseRowHeight = (courseTitle) => {
  const text = (courseTitle || '').toString()
  const baseHeight = 20
  const lineHeight = 15
  const charsPerLine = 90
  const lines = text
    .split('\n')
    .map(line => Math.max(1, Math.ceil(line.length / charsPerLine)))
    .reduce((sum, count) => sum + count, 0)
  return Math.max(baseHeight, lines * lineHeight)
}

const splitTeachers = (teachers, chunkSize = 6) => {
  const list = Array.isArray(teachers) ? teachers : []
  if (list.length === 0) {
    return [[]]
  }

  const chunks = []
  for (let i = 0; i < list.length; i += chunkSize) {
    chunks.push(list.slice(i, i + chunkSize))
  }
  return chunks
}

const getTeachersRowHeight = (teacherChunk) => {
  const longestName = (teacherChunk || []).reduce((max, teacher) => {
    if (typeof teacher !== 'string') return max
    return teacher.length > max.length ? teacher : max
  }, '')
  return getCourseRowHeight(longestName)
}

const goToAnnualPlanning = () => {
  router.push('/admin/planning/manage')
}

const goToPublicView = () => {
  router.push('/admin/planning')
}

const exportToExcel = async () => {
  if (sortedTimeSlots.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Aucun créneau à exporter',
      life: 3000
    })
    return
  }

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    
    // Si mode semestre, exporter toutes les semaines séparément
    if (viewMode.value === 'semester1' || viewMode.value === 'semester2') {
      await exportSemesterToExcel(workbook, ExcelJS)
      return
    }
    
    // Sinon, export de la semaine unique
    const worksheet = workbook.addWorksheet(`Semaine ${selectedWeek.value}`)
    
    // Couleurs améliorées
    const dayColors = {
      lundi: 'FFDBEAFE',      // Bleu pastel
      mardi: 'FFE0E7FF',      // Indigo pastel
      mercredi: 'FFEDE9FE',   // Violet pastel
      jeudi: 'FFFCE7F3',      // Rose pastel
      vendredi: 'FFFEF3C7',   // Jaune pastel
      distance: 'FFF1F5F9'    // Gris pastel
    }
    const thinBorder = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    const mediumBorder = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }

    // === TITRE PRINCIPAL ===
    worksheet.mergeCells('A1:H1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `${getSelectedYearLabel()} / ${getSemesterLabel(selectedWeek.value).toUpperCase()}`
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    worksheet.getRow(1).height = 32

    // === SOUS-TITRE SEMAINE ===
    worksheet.mergeCells('A3:H3')
    const weekCell = worksheet.getCell('A3')
    weekCell.value = `SEMAINE ${selectedWeek.value}`
    weekCell.font = { size: 13, bold: true, color: { argb: 'FF1E293B' } }
    weekCell.alignment = { horizontal: 'center', vertical: 'middle' }
    weekCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } }
    worksheet.getRow(3).height = 26

    let currentRow = 5

    // Grouper par jour
    const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'distance']
    const groupedByDay = {}
    sortedTimeSlots.value.forEach(slot => {
      if (!groupedByDay[slot.day]) groupedByDay[slot.day] = []
      groupedByDay[slot.day].push(slot)
    })

    dayOrder.forEach(day => {
      const daySlots = groupedByDay[day]
      if (!daySlots || daySlots.length === 0) return

      const dayDate = getDayDate(day)
      const dayModule = getDayMainModule(day)
      const dayBgColor = dayColors[day] || 'FFDBEAFE'
      const dayLabel = day === 'distance' ? 'DISTANCE' : day.charAt(0).toUpperCase() + day.slice(1)
      const moduleStartRow = currentRow

      // Ligne du module principal
      if (dayModule) {
        const moduleBgHex = dayModule.color ? dayModule.color.replace('#', 'FF') : 'FF94A3B8'
        worksheet.mergeCells(currentRow, 2, currentRow, 8)
        const moduleHeaderCell = worksheet.getCell(currentRow, 2)
        moduleHeaderCell.value = `${dayModule.number} — ${dayModule.title}`
        moduleHeaderCell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        moduleHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' }
        moduleHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgHex } }
        moduleHeaderCell.border = thinBorder
        worksheet.getRow(currentRow).height = 20
        currentRow++
      }

      // Créneaux du jour
      daySlots.forEach(slot => {
        let moduleBgColor = 'FFFFFFFF'
        if (dayModule && dayModule.color) {
          // Version très claire de la couleur du module
          const hex = dayModule.color.replace('#', '')
          const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 80)
          const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 80)
          const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 80)
          moduleBgColor = `FF${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        }

        const teacherChunks = splitTeachers(slot.teachers)
        const teacherRowCount = teacherChunks.length
        const endRow = currentRow + teacherRowCount

        // LIGNE 1: Horaire + Nom du cours + N° module
        const row1 = worksheet.getRow(currentRow)

        // Horaire (Col B) - fusionné verticalement
        worksheet.mergeCells(currentRow, 2, endRow, 2)
        const timeCell = row1.getCell(2)
        timeCell.value = `${slot.startTime} - ${slot.endTime}`
        timeCell.font = { size: 9, bold: true }
        timeCell.alignment = { horizontal: 'center', vertical: 'middle' }
        timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        timeCell.border = thinBorder

        // Nom du cours (Col C-G fusionnées)
        worksheet.mergeCells(currentRow, 3, currentRow, 7)
        const courseTitleCell = row1.getCell(3)
        courseTitleCell.value = slot.courseTitle || slot.activity || ''
        courseTitleCell.font = { size: 9 }
        courseTitleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        courseTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        courseTitleCell.border = thinBorder

        // N° module (Col H) - fusionné verticalement
        worksheet.mergeCells(currentRow, 8, endRow, 8)
        const moduleNumCell = row1.getCell(8)
        moduleNumCell.value = slot.moduleNumber || ''
        const moduleColorHex = getModuleColor(slot.moduleCode)?.replace('#', 'FF') || 'FF94A3B8'
        moduleNumCell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        moduleNumCell.alignment = { horizontal: 'center', vertical: 'middle' }
        moduleNumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleColorHex } }
        moduleNumCell.border = mediumBorder

        row1.height = getCourseRowHeight(courseTitleCell.value)
        currentRow++

        // LIGNE 2+: Enseignants (5 colonnes C-G)
        teacherChunks.forEach(chunk => {
          const row2 = worksheet.getRow(currentRow)
          for (let i = 0; i < 5; i++) {
            const teacherCell = row2.getCell(3 + i)
            teacherCell.value = chunk[i] || ''
            teacherCell.font = { size: 8, italic: true }
            teacherCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
            teacherCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
            teacherCell.border = thinBorder
          }
          row2.height = getTeachersRowHeight(chunk)
          currentRow++
        })
      })

      // Fusionner colonne Jour/Date (Col A)
      if (daySlots.length > 0) {
        const endRow = currentRow - 1
        worksheet.mergeCells(moduleStartRow, 1, endRow, 1)
        const dayCell = worksheet.getCell(moduleStartRow, 1)
        dayCell.value = `${dayLabel}\n\n${dayDate || ''}`
        dayCell.font = { size: 10, bold: true }
        dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayBgColor } }
        dayCell.border = mediumBorder
      }
    })

    // Largeur des colonnes (A-H, pas de colonne I/J)
    worksheet.getColumn(1).width = 13  // Jour/Date
    worksheet.getColumn(2).width = 14  // Horaire
    worksheet.getColumn(3).width = 20  // Enseignant 1 / Cours
    worksheet.getColumn(4).width = 20  // Enseignant 2 / Cours
    worksheet.getColumn(5).width = 20  // Enseignant 3 / Cours
    worksheet.getColumn(6).width = 20  // Enseignant 4 / Cours
    worksheet.getColumn(7).width = 20  // Enseignant 5 / Cours
    worksheet.getColumn(8).width = 9   // N° Module

    // Générer le fichier
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `planning-semaine-${selectedWeek.value}-${selectedYear.value}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Planning exporté avec succès',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur export Excel:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exporter le planning',
      life: 3000
    })
  }
}

// Charger les classes depuis l'année académique active
const loadYearOptions = async () => {
  try {
    const activeYear = await academicYearService.getActiveAcademicYear()
    if (!activeYear) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucune année académique active',
        life: 3000
      })
      return
    }

    // Extraire l'année de début depuis le nom (ex: '2025-2026' -> 2025)
    if (activeYear.name) {
      const match = activeYear.name.match(/(\d{4})/)
      if (match) academicStartYear.value = parseInt(match[1])
    }
    if (!academicStartYear.value && activeYear.start_date) {
      academicStartYear.value = new Date(activeYear.start_date).getFullYear()
    }
    console.log('📅 Année académique:', activeYear.name, '→ autumnYear:', academicStartYear.value)

    const classes = await academicYearService.getClassesByAcademicYear(activeYear.id)
    
    // Convertir les classes en options pour le dropdown
    yearOptions.value = classes
      .sort((a, b) => a.year_level - b.year_level)
      .map(classItem => {
        const yearLabel = classItem.year_level === 1 ? '1ère' : 
                         classItem.year_level === 2 ? '2ème' : '3ème'
        const modalitySuffix = classItem.modality === 'temps_partiel' ? ' (PT)' :
                               classItem.modality === 'en_emploi' ? ' (EE)' : ''
        
        // Convertir B26 -> bac26, B26-PT -> bac26-PT, etc. (même format que PlanningAdminView)
        const codeValue = 'bac' + classItem.code.substring(1).toLowerCase()
        
        return {
          label: `${yearLabel} année ${activeYear.name} / ${classItem.code}${modalitySuffix}`,
          value: codeValue
        }
      })

    const availableYears = yearOptions.value.map(option => option.value)

    // Sélectionner la première option par défaut ou corriger une valeur invalide
    if (yearOptions.value.length > 0 && (!selectedYear.value || !availableYears.includes(selectedYear.value))) {
      selectedYear.value = yearOptions.value[0].value
    }
  } catch (error) {
    console.error('Erreur chargement classes:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les classes',
      life: 3000
    })
  }
}

const exportSemesterToExcel = async (workbook, ExcelJS) => {
  let weekNumbers = [...new Set(timeSlots.value.map(slot => slot.weekNumber))]
  
  const semesterNum = viewMode.value === 'semester1' ? 1 : 2
  const semesterLabel = semesterNum === 1 ? 'SEMESTRE DE PRINTEMPS' : 'SEMESTRE D\'AUTOMNE'
  
  if (semesterNum === 1) {
    weekNumbers.sort((a, b) => a - b)
  } else {
    weekNumbers.sort((a, b) => {
      if (a >= 38 && b >= 38) return a - b
      if (a >= 38 && b < 38) return -1
      if (a < 38 && b >= 38) return 1
      return a - b
    })
  }
  
  const dayColors = {
    lundi: 'FFDBEAFE',
    mardi: 'FFE0E7FF',
    mercredi: 'FFEDE9FE',
    jeudi: 'FFFCE7F3',
    vendredi: 'FFFEF3C7',
    distance: 'FFF1F5F9'
  }
  const thinBorder = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  const mediumBorder = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }
  
  const worksheet = workbook.addWorksheet(`Semestre ${semesterNum}`)
  
  // === TITRE ===
  worksheet.mergeCells('A1:H1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = `${getSelectedYearLabel()} / ${semesterLabel}`
  titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
  worksheet.getRow(1).height = 32

  let currentRow = 3
  const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'distance']
  
  for (const weekNum of weekNumbers) {
    const weekSlots = timeSlots.value.filter(slot => slot.weekNumber === weekNum)
    if (weekSlots.length === 0) continue
    
    // === BANDEAU SEMAINE ===
    worksheet.mergeCells(currentRow, 1, currentRow, 8)
    const weekHeaderCell = worksheet.getCell(currentRow, 1)
    weekHeaderCell.value = `SEMAINE ${weekNum}`
    weekHeaderCell.font = { size: 13, bold: true, color: { argb: 'FF1E293B' } }
    weekHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' }
    weekHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } }
    worksheet.getRow(currentRow).height = 26
    currentRow++
    
    // === DONNÉES PAR JOUR ===
    const groupedByDay = {}
    weekSlots.forEach(slot => {
      if (!groupedByDay[slot.day]) groupedByDay[slot.day] = []
      groupedByDay[slot.day].push(slot)
    })
    
    dayOrder.forEach(day => {
      const daySlots = groupedByDay[day]
      if (!daySlots || daySlots.length === 0) return
      
      const dayBgColor = dayColors[day] || 'FFDBEAFE'
      const dayLabel = day === 'distance' ? 'DISTANCE' : day.charAt(0).toUpperCase() + day.slice(1)
      const dayDate = daySlots[0]?.date || ''
      const moduleStartRow = currentRow
      
      // Module principal du jour
      const moduleCounts = {}
      daySlots.forEach(slot => {
        if (slot.moduleCode) moduleCounts[slot.moduleCode] = (moduleCounts[slot.moduleCode] || 0) + 1
      })
      let mainModule = null
      if (Object.keys(moduleCounts).length > 0) {
        const mainModuleCode = Object.keys(moduleCounts).reduce((a, b) => moduleCounts[a] > moduleCounts[b] ? a : b)
        const moduleData = courseModules.value.find(m => m.code === mainModuleCode)
        mainModule = {
          number: moduleData?.module_number || mainModuleCode.toUpperCase(),
          title: moduleData?.label || '',
          color: getModuleColor(mainModuleCode)
        }
      }
      
      // Ligne module
      if (mainModule) {
        const moduleBgHex = mainModule.color ? mainModule.color.replace('#', 'FF') : 'FF94A3B8'
        worksheet.mergeCells(currentRow, 2, currentRow, 8)
        const moduleCell = worksheet.getCell(currentRow, 2)
        moduleCell.value = `${mainModule.number} — ${mainModule.title}`
        moduleCell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        moduleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        moduleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgHex } }
        moduleCell.border = thinBorder
        worksheet.getRow(currentRow).height = 20
        currentRow++
      }
      
      // Créneaux
      daySlots.forEach(slot => {
        let moduleBgColor = 'FFFFFFFF'
        if (mainModule && mainModule.color) {
          const hex = mainModule.color.replace('#', '')
          const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 80)
          const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 80)
          const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 80)
          moduleBgColor = `FF${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        }
        
        // Horaire (Col B) fusionné sur 2 lignes
        worksheet.mergeCells(currentRow, 2, currentRow + 1, 2)
        const timeCell = worksheet.getRow(currentRow).getCell(2)
        timeCell.value = `${slot.startTime} - ${slot.endTime}`
        timeCell.font = { size: 9, bold: true }
        timeCell.alignment = { horizontal: 'center', vertical: 'middle' }
        timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        timeCell.border = thinBorder
        
        // Cours (Col C-G fusionnées)
        worksheet.mergeCells(currentRow, 3, currentRow, 7)
        const courseCell = worksheet.getRow(currentRow).getCell(3)
        courseCell.value = slot.courseTitle || slot.activity || ''
        courseCell.font = { size: 9 }
        courseCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        courseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        courseCell.border = thinBorder
        
        // N° module (Col H) fusionné sur 2 lignes
        worksheet.mergeCells(currentRow, 8, currentRow + 1, 8)
        const moduleNumCell = worksheet.getRow(currentRow).getCell(8)
        moduleNumCell.value = slot.moduleNumber || ''
        const moduleColorHex = getModuleColor(slot.moduleCode)?.replace('#', 'FF') || 'FF94A3B8'
        moduleNumCell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        moduleNumCell.alignment = { horizontal: 'center', vertical: 'middle' }
        moduleNumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleColorHex } }
        moduleNumCell.border = mediumBorder
        
        worksheet.getRow(currentRow).height = getCourseRowHeight(courseCell.value)
        currentRow++
        
        // Enseignants (Col C-G fusionnées)
        worksheet.mergeCells(currentRow, 3, currentRow, 7)
        const teachersCell = worksheet.getRow(currentRow).getCell(3)
        teachersCell.value = (slot.teachers || []).join(', ')
        teachersCell.font = { size: 8, italic: true }
        teachersCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        teachersCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        teachersCell.border = thinBorder
        worksheet.getRow(currentRow).height = getCourseRowHeight(teachersCell.value)
        currentRow++
      })
      
      // Fusionner colonne Jour (Col A)
      if (daySlots.length > 0) {
        const endRow = currentRow - 1
        if (moduleStartRow < endRow) {
          worksheet.mergeCells(moduleStartRow, 1, endRow, 1)
        }
        const dayCell = worksheet.getCell(moduleStartRow, 1)
        dayCell.value = dayDate ? `${dayLabel}\n\n${dayDate}` : dayLabel
        dayCell.font = { size: 10, bold: true }
        dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayBgColor } }
        dayCell.border = mediumBorder
      }
    })
    
    currentRow++
  }
  
  // Largeurs (A-H)
  worksheet.getColumn(1).width = 13
  worksheet.getColumn(2).width = 14
  worksheet.getColumn(3).width = 20
  worksheet.getColumn(4).width = 20
  worksheet.getColumn(5).width = 20
  worksheet.getColumn(6).width = 20
  worksheet.getColumn(7).width = 20
  worksheet.getColumn(8).width = 9
  
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `planning-semestre-${semesterNum}-${selectedYear.value}.xlsx`
  link.click()
  window.URL.revokeObjectURL(url)
  
  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: `${weekNumbers.length} semaines exportées dans un seul fichier`,
    life: 3000
  })
}

// Fonction generateSemesterFromMinibrick supprimée (nécessite migration complète du système minibrick)
</script>

<style scoped>
.weekly-planning-admin {
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

/* Panneau de sélection amélioré */
.selection-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.selection-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.selection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.selection-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem;
}

.selection-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color-light), var(--primary-color));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.selection-content {
  flex: 1;
  min-width: 0;
}

.selection-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selection-dropdown {
  font-size: 1.1rem;
  font-weight: 500;
}

/* Navigation de semaine */
.week-selector {
  grid-column: span 2;
}

.week-navigation {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.weekly-planning-table {
  font-size: 0.9rem;
}

/* Header de groupe par jour */
.day-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, var(--surface-100) 0%, var(--surface-50) 100%);
  border-radius: 8px;
  margin: 0.5rem 0;
  flex-wrap: wrap;
  gap: 1rem;
}

.day-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.module-info {
  flex: 1;
  display: flex;
  justify-content: center;
}

.module-badge-header {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.module-number-header {
  font-weight: bold;
  font-size: 1.2rem;
  padding-right: 1rem;
  border-right: 2px solid rgba(255, 255, 255, 0.5);
}

.module-name-header {
  font-size: 1rem;
  font-weight: 600;
}

.slots-count {
  display: flex;
  align-items: center;
  color: var(--text-color-secondary);
  font-weight: 500;
}

/* Séparation entre les jours */
.weekly-planning-table :deep(.day-separator) {
  border-top: 3px solid var(--primary-color) !important;
}

/* En-tête de jour */
.day-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Cellule d'horaire */
.horaire-cell {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

/* Cellule de module avec couleurs */
.module-cell {
  padding: 0.75rem;
  border-radius: 6px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}

.module-cell:hover {
  transform: scale(1.02);
}

.course-title-text {
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.4;
}

.module-number {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.module-title {
  font-size: 0.85rem;
  opacity: 0.95;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Badge numéro de module (colonne fixe) */
.module-number-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  min-width: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Cellule d'activité */
.activity-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

/* Cellule enseignants/groupes */
.teachers-cell {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  align-items: center;
  max-width: 100%;
}

.teacher-group {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.teacher-chip {
  font-size: 0.85rem;
  background-color: var(--primary-100);
  color: var(--primary-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.teacher-chip:hover {
  background-color: var(--primary-200);
}

/* Badge pour enseignants supplémentaires */
.teachers-cell :deep(.p-badge) {
  margin-left: 0.5rem;
}

/* Cellule salle */
.room-cell {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Responsive */
@media (max-width: 1200px) {
  .weekly-planning-table {
    font-size: 0.85rem;
  }
  
  .module-cell {
    padding: 0.5rem;
  }
}

@media (max-width: 768px) {
  .weekly-planning-admin {
    padding: 1rem;
  }
  
  .weekly-planning-table {
    font-size: 0.8rem;
  }
}
</style>
