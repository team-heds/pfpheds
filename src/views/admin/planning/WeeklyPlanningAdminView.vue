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

      <PlanningLegend class="mb-3" />

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

            :rows="sortedTimeSlots.length || 500"
            :paginator="false"
            :scrollable="true"
            :scrollHeight="viewMode !== 'week' ? '75vh' : undefined"
            responsiveLayout="scroll"
            class="p-datatable-sm weekly-planning-table"
            :rowClass="getRowClass"
            rowGroupMode="subheader"
            :groupRowsBy="groupField"
            :expandableRowGroups="true"
            v-model:expandedRowGroups="expandedGroups"
          >
            <template #groupheader="slotProps">
              <!-- Bandeau spécial vacances/examens/férié -->
              <div v-if="isGroupAllSpecial(slotProps.data.dayGroup)" class="day-group-header special-group-header" :style="{ background: getGroupSpecialColor(slotProps.data.dayGroup) }">
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
                <div class="special-banner">
                  <i :class="'pi ' + getGroupSpecialType(slotProps.data.dayGroup)?.icon" class="text-xl mr-2"></i>
                  <span class="text-xl font-bold">{{ getGroupSpecialType(slotProps.data.dayGroup)?.label }}</span>
                </div>
                <div></div>
              </div>
              <!-- Header normal -->
              <div v-else class="day-group-header">
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
                  <span v-if="getGroupSlotCount(slotProps.data.dayGroup) > 0">{{ getGroupSlotCount(slotProps.data.dayGroup) }} créneau(x)</span>
                  <Tag v-else value="À compléter" severity="warning" icon="pi pi-exclamation-triangle" />
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
                <div v-if="slotProps.data.isPlaceholder" class="placeholder-cell">
                  <i class="pi pi-info-circle text-warning mr-2"></i>
                  <span class="text-500 font-italic">À compléter</span>
                </div>
                <div v-else class="horaire-cell">
                  <i class="pi pi-clock text-primary mr-2"></i>
                  <template v-if="slotProps.data.startTime && slotProps.data.startTime !== 'null'">
                    <span class="font-bold">{{ slotProps.data.startTime }}</span>
                    <span class="mx-1">-</span>
                    <span class="font-bold">{{ slotProps.data.endTime }}</span>
                  </template>
                  <Tag v-else value="Asynchrone" severity="contrast" class="font-bold" />
                </div>
              </template>
            </Column>
            
            <Column field="courseTitle" header="Nom du cours" style="min-width: 20rem">
              <template #body="slotProps">
                <div 
                  v-if="slotProps.data.moduleCode"
                  class="module-cell"
                  v-tooltip.top="slotProps.data.courseTitle || slotProps.data.activity || slotProps.data.moduleTitle"
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
                      :label="formatTeacherDisplayName(teacher)" 
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
                <div v-if="slotProps.data.isPlaceholder" class="flex gap-2">
                  <Button 
                    icon="pi pi-plus"
                    label="Ajouter"
                    @click="openSlotDialog(null, slotProps.data)"
                    size="small"
                    severity="success"
                    v-tooltip="'Ajouter un cr\u00e9neau pour ce jour'"
                  />
                </div>
                <div v-else class="flex gap-2">
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
          
          <div class="col-6">
            <label class="block mb-2 font-bold">Type d'activité :</label>
            <Dropdown 
              v-model="slotForm.activityType"
              :options="activityTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner le type"
              class="w-full"
            />
            <small class="text-500">Utilisé pour le calcul de la feuille de charges (coefficient)</small>
          </div>
          <div class="col-6">
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
import PlanningLegend from '@/components/common/planning/PlanningLegend.vue'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Chip from 'primevue/chip'
import AutoComplete from 'primevue/autocomplete'
import Dropdown from 'primevue/dropdown'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import planningService from '@/service/planningService'
import academicYearService from '@/service/academicYearService'
import { getSITeachers } from '@/service/academicKpiService'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
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
const activityTypeOptions = [
  { label: 'Cours', value: 'Cours' },
  { label: 'Atelier / Pratique', value: 'Atelier' },
  { label: 'Examen', value: 'Examen' },
  { label: 'Cours Asynchrone', value: 'Cours Asynchrone' },
  { label: 'Autre', value: 'Autre' }
]

const deepLinkClassCode = ref(null)
const deepLinkWeek = ref(null)
const deepLinkTarget = ref({
  slotId: null,
  day: null,
  start: null,
  moduleCode: null,
  courseCode: null
})
const deepLinkApplied = ref(false)
const highlightedSlotId = ref(null)

syncDeepLinkFromRoute(route.query)

const slotForm = ref({
  day: '',
  date: '',
  startTime: '',
  endTime: '',
  moduleCode: '',
  moduleNumber: '',
  moduleTitle: '',
  courseTitle: '',
  activityType: 'Cours',
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
    return (a.startTime || '').localeCompare(b.startTime || '')
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

function normalizeClassCodeForSelection(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (raw.toLowerCase().startsWith('bac')) return raw.toLowerCase()
  if (/^[a-zA-Z]\d{1,2}/.test(raw)) {
    return `bac${raw.substring(1).toLowerCase()}`
  }
  return raw.toLowerCase()
}

function normalizeTimeForComparison(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return null
  let digits = raw.replace(/[^0-9]/g, '')
  if (digits.length === 3) {
    digits = `0${digits}`
  }
  if (digits.length >= 4) {
    return digits.slice(0, 4)
  }
  return digits || null
}

function findSlotMatchingDeepLink() {
  const target = deepLinkTarget.value
  if (!target) return null
  const slots = sortedTimeSlots.value.filter(slot => !slot.isPlaceholder)
  if (slots.length === 0) {
    return null
  }

  if (target.slotId) {
    const slotById = slots.find(slot => String(slot.id) === String(target.slotId))
    if (slotById) {
      return slotById
    }
  }

  const normalizedDay = target.day
  const normalizedStart = normalizeTimeForComparison(target.start)
  if (normalizedDay && normalizedStart) {
    const slotByTiming = slots.find(slot => {
      return slot.day === normalizedDay && normalizeTimeForComparison(slot.startTime) === normalizedStart
    })
    if (slotByTiming) {
      return slotByTiming
    }
  }

  if (normalizedDay && target.moduleCode) {
    const slotByModule = slots.find(slot => slot.day === normalizedDay && String(slot.moduleCode || '').toUpperCase() === target.moduleCode)
    if (slotByModule) {
      return slotByModule
    }
  }

  if (target.moduleCode) {
    const slotByModuleOnly = slots.find(slot => String(slot.moduleCode || '').toUpperCase() === target.moduleCode)
    if (slotByModuleOnly) {
      return slotByModuleOnly
    }
  }

  return null
}

async function scrollHighlightedIntoView() {
  if (typeof window === 'undefined') {
    return
  }

  await nextTick()

  window.requestAnimationFrame(() => {
    const table = document.querySelector('.weekly-planning-table')
    if (!table) return
    const row = table.querySelector('.p-datatable-tbody tr.highlighted-row')
    if (row && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

async function applyDeepLinkFocus() {
  if (deepLinkApplied.value) {
    return
  }

  if (viewMode.value !== 'week') {
    return
  }

  const target = deepLinkTarget.value
  const hasIntent = Boolean(target.slotId || target.day || target.start || target.moduleCode || target.courseCode)
  if (!hasIntent) {
    return
  }

  await nextTick()

  const slot = findSlotMatchingDeepLink()
  if (!slot) {
    console.warn('⚠️ Aucun créneau correspondant au deep-link trouvé.', target)
    return
  }

  const groupKey = slot.dayGroup || slot.day
  if (groupKey && !expandedGroups.value.includes(groupKey)) {
    expandedGroups.value = [...expandedGroups.value, groupKey]
  }

  highlightedSlotId.value = slot.id
  deepLinkApplied.value = true

  await scrollHighlightedIntoView()
}

function syncDeepLinkFromRoute(query = {}) {
  const normalizedClass = query.classCode ? normalizeClassCodeForSelection(query.classCode) : null
  deepLinkClassCode.value = normalizedClass

  if (normalizedClass) {
    const availableYears = yearOptions.value.map(option => option.value)
    if (availableYears.includes(normalizedClass) && selectedYear.value !== normalizedClass) {
      selectedYear.value = normalizedClass
    }
  }

  if (query.week) {
    const parsedWeek = Number(query.week)
    if (!Number.isNaN(parsedWeek)) {
      deepLinkWeek.value = parsedWeek
      if (selectedWeek.value !== parsedWeek) {
        selectedWeek.value = parsedWeek
      }
    }
  } else {
    deepLinkWeek.value = null
  }

  const normalizedTarget = {
    slotId: query.slotId ? String(query.slotId) : null,
    day: query.day ? String(query.day).toLowerCase() : null,
    start: query.start ? String(query.start) : null,
    moduleCode: query.moduleCode ? String(query.moduleCode).toUpperCase() : null,
    courseCode: query.courseCode ? String(query.courseCode).toUpperCase() : null
  }

  deepLinkTarget.value = normalizedTarget

  const hasIntent = Boolean(normalizedClass || query.week || normalizedTarget.slotId || normalizedTarget.day || normalizedTarget.start || normalizedTarget.moduleCode || normalizedTarget.courseCode)
  if (!hasIntent) {
    return
  }

  if (viewMode.value !== 'week') {
    viewMode.value = 'week'
  }

  deepLinkApplied.value = false
  highlightedSlotId.value = null

  if (timeSlots.value.length > 0) {
    nextTick(() => applyDeepLinkFocus())
  }
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
    
    // Charger en parallèle les créneaux ET les cellules du planning annuel
    const [slots, planningCells] = await Promise.all([
      planningService.getWeekTimeSlots(selectedYear.value, selectedWeek.value),
      planningService.getWeekPlanningCells(selectedYear.value, selectedWeek.value)
    ])
    
    console.log('✅ Créneaux reçus:', slots.length, '| Cellules planning:', planningCells.length)
    
    // Convertir snake_case en camelCase pour compatibilité avec le template
    const mappedSlots = slots.map(slot => {
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
        activityType: slot.activity_type || 'Cours',
        activity: slot.activity,
        teachers: normalizeTeachersForDisplay(slot.teachers),
        room: slot.room,
        notes: slot.notes,
        weekNumber: slot.week_number
      }
    })
    
    // Déterminer les jours qui ont des créneaux (time_slots)
    const daysWithSlots = new Set(mappedSlots.map(s => s.day))
    
    // Pour chaque cellule du planning annuel qui n'a PAS encore de time_slots,
    // ajouter un placeholder vide pour que le jour apparaisse dans la vue
    const placeholders = []
    for (const cell of planningCells) {
      const fullDay = cell.day // planning_cells stocke déjà en format long (lundi, mardi...)
      if (!daysWithSlots.has(fullDay) && cell.module_code) {
        const mod = courseModules.value.find(m => m.code === cell.module_code)
        const dayIndex = planningService.getDayIndex(fullDay)
        const computedDate = planningService.getDateForWeekAndDay(selectedWeek.value, dayIndex, academicStartYear.value)
        placeholders.push({
          id: `placeholder_${fullDay}`,
          day: fullDay,
          date: computedDate,
          startTime: '',
          endTime: '',
          moduleCode: cell.module_code,
          moduleNumber: mod?.module_number || '',
          moduleTitle: mod?.label || '',
          courseTitle: '',
          activity: '',
          teachers: [],
          room: null,
          notes: null,
          weekNumber: selectedWeek.value,
          isPlaceholder: true
        })
      }
    }
    
    if (placeholders.length > 0) {
      console.log('📋 Jours vides ajoutés depuis planning annuel:', placeholders.map(p => p.day).join(', '))
    }
    
    timeSlots.value = [...mappedSlots, ...placeholders]
    
    // Reset expanded groups pour le mode semaine
    expandedGroups.value = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'distance']
    
    console.log('✅ Planning chargé avec', timeSlots.value.length, 'éléments (dont', placeholders.length, 'jours vides)')
    
    if (timeSlots.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'Information',
        detail: 'Aucun créneau trouvé pour cette semaine',
        life: 3000
      })
    }

    await applyDeepLinkFocus()
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

watch(() => route.fullPath, () => {
  syncDeepLinkFromRoute(route.query)
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
    // Charger en parallèle les créneaux ET les cellules du planning annuel
    const [slots, planningCells] = await Promise.all([
      planningService.getSemesterTimeSlots(selectedYear.value, semester),
      planningService.getSemesterPlanningCells(selectedYear.value, semester)
    ])
    
    console.log('✅ Semestre chargé:', semester, '| slots:', slots.length, '| cellules planning:', planningCells.length)
    
    // Convertir snake_case en camelCase
    const mappedSlots = slots.map(slot => {
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
        activityType: slot.activity_type || 'Cours',
        activity: slot.activity,
        teachers: normalizeTeachersForDisplay(slot.teachers),
        room: slot.room,
        notes: slot.notes,
        weekNumber: slot.week_number
      }
    })
    
    // Déterminer les combinaisons semaine+jour qui ont des créneaux
    const slotsKeys = new Set(mappedSlots.map(s => `${s.weekNumber}_${s.day}`))
    
    // Pour chaque cellule du planning annuel sans time_slots, ajouter un placeholder
    const placeholders = []
    for (const cell of planningCells) {
      const key = `${cell.week_number}_${cell.day}`
      if (!slotsKeys.has(key) && cell.module_code) {
        const mod = courseModules.value.find(m => m.code === cell.module_code)
        const dayIndex = planningService.getDayIndex(cell.day)
        const computedDate = planningService.getDateForWeekAndDay(cell.week_number, dayIndex, academicStartYear.value)
        placeholders.push({
          id: `placeholder_${key}`,
          day: cell.day,
          date: computedDate,
          startTime: '',
          endTime: '',
          moduleCode: cell.module_code,
          moduleNumber: mod?.module_number || '',
          moduleTitle: mod?.label || '',
          courseTitle: '',
          activity: '',
          teachers: [],
          room: null,
          notes: null,
          weekNumber: cell.week_number,
          isPlaceholder: true
        })
      }
    }
    
    if (placeholders.length > 0) {
      console.log('📋 Jours vides ajoutés (semestre):', placeholders.length)
    }
    
    timeSlots.value = [...mappedSlots, ...placeholders]
    
    // Auto-expand tous les groupes en mode semestre
    const allGroups = [...new Set(timeSlots.value.map(s => `S${s.weekNumber}_${s.day}`))]
    expandedGroups.value = allGroups
    
    const semesterLabel = semester === 'spring' ? 'Printemps (S8-S37)' : 'Automne (S38-S7)'
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${mappedSlots.length} créneaux + ${placeholders.length} jours vides chargés pour le semestre ${semesterLabel}`,
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
  const classes = []
  if (data.isPlaceholder) {
    classes.push('placeholder-row')
  }
  if (highlightedSlotId.value && String(data.id) === String(highlightedSlotId.value)) {
    classes.push('highlighted-row')
  }
  if (isSpecialSlot(data.moduleCode)) {
    classes.push('special-row')
    classes.push(data.moduleCode?.toLowerCase() === 'examen' ? 'examen-row' : 'vacances-row')
  }
  const prevIndex = sortedTimeSlots.value.indexOf(data) - 1
  if (prevIndex >= 0) {
    const prevSlot = sortedTimeSlots.value[prevIndex]
    if (prevSlot.day !== data.day) {
      classes.push('day-separator')
    }
  }
  return classes.join(' ')
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
  const slots = sortedTimeSlots.value.filter(slot => slot.dayGroup === dayGroup && !slot.isPlaceholder)
  return slots.length
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

const openSlotDialog = async (slot = null, placeholderData = null) => {
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

  if (slot && !slot.isPlaceholder) {
    editingSlot.value = slot.id
    slotForm.value = { ...slot }
  } else {
    editingSlot.value = null
    // Pré-remplir depuis un placeholder (jour vide du planning annuel)
    const prefill = placeholderData || {}
    slotForm.value = {
      day: prefill.day || '',
      date: prefill.date || '',
      startTime: '',
      endTime: '',
      moduleCode: prefill.moduleCode || '',
      moduleNumber: prefill.moduleNumber || '',
      moduleTitle: prefill.moduleTitle || '',
      courseTitle: '',
      activityType: 'Cours',
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
      return formatTeacherDisplayName(t)
    }).filter(Boolean)

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
      activity: slotForm.value.activityType + (slotForm.value.activity ? ' — ' + slotForm.value.activity : ''),
      activityType: slotForm.value.activityType,
      teachers: normalizedTeachers,
      room: slotForm.value.room,
      notes: slotForm.value.notes
    }

    // Validation basique
    if (!slotData.startTime || !slotData.endTime) {
      if (slotData.day === 'distance') {
        // Pour distance : horaires optionnels (cours asynchrones)
        slotData.startTime = slotData.startTime || null
        slotData.endTime = slotData.endTime || null
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

const formatTeacherDisplayName = (entry) => {
  if (!entry) return ''

  if (typeof entry === 'string') {
    const trimmed = entry.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === 'object') {
          const parsedName = parsed.display_name || parsed.name || `${parsed.forname || ''} ${parsed.family_name || ''}`.trim() || parsed.email
          if (parsedName) return String(parsedName).trim()
        }
      } catch {
        // keep raw string fallback below
      }
    }
    return trimmed
  }

  if (typeof entry === 'object') {
    const profileId = String(entry.id || entry.user_id || entry.profile_id || '').trim()
    if (profileId) {
      const matched = siTeachers.value.find(t => String(t.id || '').trim() === profileId)
      if (matched?.name) return matched.name
    }

    const objectName = entry.display_name || entry.name || `${entry.forname || ''} ${entry.family_name || ''}`.trim()
    if (objectName) return objectName

    if (entry.email) return String(entry.email).trim()
  }

  return String(entry).trim()
}

const normalizeTeachersForDisplay = (teachers) => {
  if (!Array.isArray(teachers)) return []
  return teachers
    .map(formatTeacherDisplayName)
    .map(name => String(name || '').trim())
    .filter(Boolean)
}

const SPECIAL_MODULES = {
  vacances: { label: 'Vacances', icon: 'pi-sun', severity: 'secondary' },
  examen: { label: 'Examens', icon: 'pi-file-edit', severity: 'danger' },
  ferie: { label: 'Jour férié', icon: 'pi-calendar-times', severity: 'secondary' }
}

const isSpecialSlot = (moduleCode) => {
  return !!SPECIAL_MODULES[moduleCode?.toLowerCase?.()]
}

const getSpecialType = (moduleCode) => {
  return SPECIAL_MODULES[moduleCode?.toLowerCase?.()]
}

const isGroupAllSpecial = (dayGroup) => {
  const groupSlots = sortedTimeSlots.value.filter(slot => slot.dayGroup === dayGroup)
  if (groupSlots.length === 0) return false
  return groupSlots.every(slot => isSpecialSlot(slot.moduleCode))
}

const getGroupSpecialType = (dayGroup) => {
  const groupSlots = sortedTimeSlots.value.filter(slot => slot.dayGroup === dayGroup)
  if (groupSlots.length === 0) return null
  const firstSpecial = groupSlots.find(slot => isSpecialSlot(slot.moduleCode))
  return firstSpecial ? getSpecialType(firstSpecial.moduleCode) : null
}

const getGroupSpecialColor = (dayGroup) => {
  const groupSlots = sortedTimeSlots.value.filter(slot => slot.dayGroup === dayGroup)
  const firstSpecial = groupSlots.find(slot => isSpecialSlot(slot.moduleCode))
  return firstSpecial ? getModuleColor(firstSpecial.moduleCode) : '#CCCCCC'
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
  const baseHeight = 22
  const lineHeight = 18
  const charsPerLine = 60
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
    
    const thinBorder = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    const mediumBorder = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }

    // === TITRE PRINCIPAL ===
    worksheet.mergeCells('A1:G1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = `${getSelectedYearLabel()} / ${getSemesterLabel(selectedWeek.value).toUpperCase()}`
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    worksheet.getRow(1).height = 32

    // === SOUS-TITRE SEMAINE ===
    worksheet.mergeCells('A3:G3')
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

    // Helper: couleur du module en ARGB clair (version pastel lisible)
    const getModuleLightArgb = (moduleColor) => {
      if (!moduleColor) return 'FFE2E8F0'
      const hex = moduleColor.replace('#', '')
      const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 40)
      const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 40)
      const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 40)
      return `FF${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }

    dayOrder.forEach(day => {
      const daySlots = groupedByDay[day]
      if (!daySlots || daySlots.length === 0) return

      const dayDate = getDayDate(day)
      const dayModule = getDayMainModule(day)
      const dayLabel = day === 'distance' ? 'DISTANCE' : day.charAt(0).toUpperCase() + day.slice(1)
      const moduleStartRow = currentRow
      // Couleur du jour = couleur du module principal (ou gris par défaut)
      const moduleBgHex = dayModule?.color ? dayModule.color.replace('#', 'FF') : 'FF94A3B8'
      const moduleBgLight = getModuleLightArgb(dayModule?.color)

      // Ligne du module principal
      if (dayModule) {
        worksheet.mergeCells(currentRow, 2, currentRow, 7)
        const moduleHeaderCell = worksheet.getCell(currentRow, 2)
        const moduleHeaderText = `${dayModule.number} — ${dayModule.title}`
        moduleHeaderCell.value = moduleHeaderText
        moduleHeaderCell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        moduleHeaderCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: moduleHeaderText.length > 40 }
        moduleHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgHex } }
        moduleHeaderCell.border = thinBorder
        worksheet.getRow(currentRow).height = moduleHeaderText.length > 40 ? 30 : 22
        currentRow++
      }

      // Filtrer les vrais créneaux (exclure placeholders pour le contenu)
      const realSlots = daySlots.filter(s => !s.isPlaceholder)
      const hasOnlyPlaceholders = realSlots.length === 0
      const allSpecial = realSlots.length > 0 && realSlots.every(s => isSpecialSlot(s.moduleCode))

      if (hasOnlyPlaceholders) {
        // Jour vide : une seule ligne "À compléter"
        worksheet.mergeCells(currentRow, 2, currentRow, 7)
        const emptyCell = worksheet.getCell(currentRow, 2)
        emptyCell.value = 'À compléter'
        emptyCell.font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } }
        emptyCell.alignment = { horizontal: 'center', vertical: 'middle' }
        emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        emptyCell.border = thinBorder
        worksheet.getRow(currentRow).height = 24
        currentRow++
      } else if (allSpecial) {
        // Jour entièrement vacances/examen : une seule ligne bandeau
        const specialType = getSpecialType(realSlots[0].moduleCode)
        const bannerColor = getModuleColor(realSlots[0].moduleCode)
        const bannerBg = bannerColor.replace('#', 'FF')
        worksheet.mergeCells(currentRow, 2, currentRow, 7)
        const specialCell = worksheet.getCell(currentRow, 2)
        specialCell.value = specialType?.label || 'Vacances'
        specialCell.font = { size: 12, bold: true, color: { argb: 'FF000000' } }
        specialCell.alignment = { horizontal: 'center', vertical: 'middle' }
        specialCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bannerBg } }
        specialCell.border = thinBorder
        worksheet.getRow(currentRow).height = 28
        currentRow++
      } else {
        // Créneaux du jour
        realSlots.forEach(slot => {
          // Couleur propre à CE créneau (basée sur son module)
          const slotColor = getModuleColor(slot.moduleCode)
          const slotBgLight = getModuleLightArgb(slotColor)
          const slotFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: slotBgLight } }

          const teacherChunks = splitTeachers(slot.teachers)
          const teacherRowCount = teacherChunks.length
          const endRow = currentRow + teacherRowCount

          // LIGNE 1 : Horaire + Cours — colorier toutes les cellules B-G
          const row1 = worksheet.getRow(currentRow)
          for (let col = 2; col <= 7; col++) {
            row1.getCell(col).fill = slotFill
            row1.getCell(col).border = thinBorder
          }

          // Horaire (Col B) - fusionné verticalement
          worksheet.mergeCells(currentRow, 2, endRow, 2)
          row1.getCell(2).value = (slot.startTime && slot.startTime !== 'null') ? `${slot.startTime} - ${slot.endTime}` : 'Asynchrone'
          row1.getCell(2).font = { size: 9, bold: true }
          row1.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }

          // Nom du cours (Col C-G fusionnées)
          worksheet.mergeCells(currentRow, 3, currentRow, 7)
          const courseText = slot.courseTitle || slot.activity || ''
          row1.getCell(3).value = courseText
          row1.getCell(3).font = { size: 9 }
          row1.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

          row1.height = Math.max(22, getCourseRowHeight(courseText))
          currentRow++

          // LIGNES 2+ : Enseignants (5 colonnes C-G) — colorier toutes les cellules B-G
          teacherChunks.forEach(chunk => {
            const row2 = worksheet.getRow(currentRow)
            // Col B (fait partie du merge vertical mais colorer quand même)
            row2.getCell(2).fill = slotFill
            row2.getCell(2).border = thinBorder
            for (let i = 0; i < 5; i++) {
              const teacherCell = row2.getCell(3 + i)
              teacherCell.value = chunk[i] || ''
              teacherCell.font = { size: 8, italic: true, bold: true }
              teacherCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
              teacherCell.fill = slotFill
              teacherCell.border = thinBorder
            }
            row2.height = Math.max(18, getTeachersRowHeight(chunk))
            currentRow++
          })
        })
      }

      // Fusionner colonne Jour/Date (Col A) avec couleur du module
      if (daySlots.length > 0) {
        const endRow = currentRow - 1
        if (moduleStartRow < endRow) {
          worksheet.mergeCells(moduleStartRow, 1, endRow, 1)
        }
        const dayCell = worksheet.getCell(moduleStartRow, 1)
        dayCell.value = `${dayLabel}\n\n${dayDate || ''}`
        dayCell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgHex } }
        dayCell.border = mediumBorder
      }
    })

    // Largeur des colonnes (A-G, sans colonne H)
    worksheet.getColumn(1).width = 15  // Jour/Date
    worksheet.getColumn(2).width = 14  // Horaire
    worksheet.getColumn(3).width = 22  // Cours / Enseignant 1
    worksheet.getColumn(4).width = 22  // Cours / Enseignant 2
    worksheet.getColumn(5).width = 22  // Cours / Enseignant 3
    worksheet.getColumn(6).width = 22  // Cours / Enseignant 4
    worksheet.getColumn(7).width = 22  // Cours / Enseignant 5

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
        const modalitySuffix = classItem.code.endsWith('-PA') ? ' (PA)' :
                               classItem.modality === 'temps_partiel' ? ' (PT)' :
                               classItem.modality === 'en_emploi' ? ' (EE)' : ''
        
        // Convertir B26 -> bac26, B26-PT -> bac26-PT, etc. (même format que PlanningAdminView)
        const codeValue = 'bac' + classItem.code.substring(1).toLowerCase()
        
        return {
          label: `${yearLabel} année ${activeYear.name} / ${classItem.code}${modalitySuffix}`,
          value: codeValue
        }
      })

    const availableYears = yearOptions.value.map(option => option.value)

    const preferredYear = deepLinkClassCode.value && availableYears.includes(deepLinkClassCode.value)
      ? deepLinkClassCode.value
      : null

    if (preferredYear) {
      selectedYear.value = preferredYear
    } else if (yearOptions.value.length > 0 && (!selectedYear.value || !availableYears.includes(selectedYear.value))) {
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
  const semesterNum = viewMode.value === 'semester1' ? 1 : 2
  const semesterLabel = semesterNum === 1 ? 'SEMESTRE DE PRINTEMPS' : 'SEMESTRE D\'AUTOMNE'
  
  // Construire la liste COMPLÈTE des semaines du semestre (pas juste celles avec des données)
  const aYear = academicStartYear.value || new Date().getFullYear()
  const maxAutumnWeek = isoWeeksInYear(aYear) // 52 ou 53
  let weekNumbers = []
  if (semesterNum === 1) {
    // Printemps : S8 → S37
    for (let w = 8; w <= 37; w++) weekNumbers.push(w)
  } else {
    // Automne : S38 → S52/S53, puis S1 → S7
    for (let w = 38; w <= maxAutumnWeek; w++) weekNumbers.push(w)
    for (let w = 1; w <= 7; w++) weekNumbers.push(w)
  }
  
  const thinBorder = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  const mediumBorder = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }
  
  const worksheet = workbook.addWorksheet(`Semestre ${semesterNum}`)
  
  // Helper: couleur du module en ARGB clair (version pastel lisible)
  const getModuleLightArgb = (moduleColor) => {
    if (!moduleColor) return 'FFE2E8F0'
    const hex = moduleColor.replace('#', '')
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + 40)
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + 40)
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + 40)
    return `FF${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  
  // === TITRE ===
  worksheet.mergeCells('A1:G1')
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
    
    // === BANDEAU SEMAINE (toujours affiché, même sans données) ===
    worksheet.mergeCells(currentRow, 1, currentRow, 7)
    const weekHeaderCell = worksheet.getCell(currentRow, 1)
    weekHeaderCell.value = `SEMAINE ${weekNum}`
    weekHeaderCell.font = { size: 13, bold: true, color: { argb: 'FF1E293B' } }
    weekHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' }
    weekHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } }
    worksheet.getRow(currentRow).height = 26
    currentRow++
    
    // Si aucune donnée pour cette semaine, afficher "Aucun cours"
    if (weekSlots.length === 0) {
      worksheet.mergeCells(currentRow, 1, currentRow, 7)
      const emptyWeekCell = worksheet.getCell(currentRow, 1)
      emptyWeekCell.value = 'Aucun cours planifié'
      emptyWeekCell.font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } }
      emptyWeekCell.alignment = { horizontal: 'center', vertical: 'middle' }
      emptyWeekCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      emptyWeekCell.border = thinBorder
      worksheet.getRow(currentRow).height = 22
      currentRow += 2
      continue
    }

    // === DONNÉES PAR JOUR ===
    const groupedByDay = {}
    weekSlots.forEach(slot => {
      if (!groupedByDay[slot.day]) groupedByDay[slot.day] = []
      groupedByDay[slot.day].push(slot)
    })
    
    dayOrder.forEach(day => {
      const daySlots = groupedByDay[day]
      if (!daySlots || daySlots.length === 0) return
      
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
      
      // Couleur du jour = couleur du module principal
      const moduleBgHex = mainModule?.color ? mainModule.color.replace('#', 'FF') : 'FF94A3B8'
      const moduleBgLight = getModuleLightArgb(mainModule?.color)
      
      // Ligne module
      if (mainModule) {
        worksheet.mergeCells(currentRow, 2, currentRow, 7)
        const moduleCell = worksheet.getCell(currentRow, 2)
        const semModuleText = `${mainModule.number} — ${mainModule.title}`
        moduleCell.value = semModuleText
        moduleCell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        moduleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: semModuleText.length > 40 }
        moduleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgHex } }
        moduleCell.border = thinBorder
        worksheet.getRow(currentRow).height = semModuleText.length > 40 ? 30 : 22
        currentRow++
      }
      
      // Filtrer les vrais créneaux (exclure placeholders)
      const realSlots = daySlots.filter(s => !s.isPlaceholder)
      const hasOnlyPlaceholders = realSlots.length === 0
      const allSpecial = realSlots.length > 0 && realSlots.every(s => isSpecialSlot(s.moduleCode))

      if (hasOnlyPlaceholders) {
        // Jour vide : une seule ligne "À compléter"
        worksheet.mergeCells(currentRow, 2, currentRow, 7)
        const emptyCell = worksheet.getCell(currentRow, 2)
        emptyCell.value = 'À compléter'
        emptyCell.font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } }
        emptyCell.alignment = { horizontal: 'center', vertical: 'middle' }
        emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        emptyCell.border = thinBorder
        worksheet.getRow(currentRow).height = 24
        currentRow++
      } else if (allSpecial) {
        // Jour entièrement vacances/examen : une seule ligne bandeau
        const specialType = getSpecialType(realSlots[0].moduleCode)
        const bannerColor = getModuleColor(realSlots[0].moduleCode)
        const bannerBg = bannerColor.replace('#', 'FF')
        worksheet.mergeCells(currentRow, 2, currentRow, 7)
        const specialCell = worksheet.getCell(currentRow, 2)
        specialCell.value = specialType?.label || 'Vacances'
        specialCell.font = { size: 12, bold: true, color: { argb: 'FF000000' } }
        specialCell.alignment = { horizontal: 'center', vertical: 'middle' }
        specialCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bannerBg } }
        specialCell.border = thinBorder
        worksheet.getRow(currentRow).height = 28
        currentRow++
      } else {
        // Créneaux
        realSlots.forEach(slot => {
          // Couleur propre à CE créneau (basée sur son module)
          const slotColor = getModuleColor(slot.moduleCode)
          const slotBgLight = getModuleLightArgb(slotColor)
          const slotFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: slotBgLight } }

          // LIGNE 1 : Cours + LIGNE 2 : Enseignants
          const slotStartRow = currentRow
          const row1 = worksheet.getRow(currentRow)
          // Colorier toutes les cellules B-G de la ligne
          for (let col = 2; col <= 7; col++) {
            row1.getCell(col).fill = slotFill
            row1.getCell(col).border = thinBorder
          }
          // Cours (Col C-G fusionnées)
          worksheet.mergeCells(currentRow, 3, currentRow, 7)
          const semCourseText = slot.courseTitle || slot.activity || ''
          row1.getCell(3).value = semCourseText
          row1.getCell(3).font = { size: 9 }
          row1.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          row1.height = Math.max(22, getCourseRowHeight(semCourseText))
          currentRow++
          
          // LIGNE 2 : Enseignants
          const row2 = worksheet.getRow(currentRow)
          // Colorier toutes les cellules B-G de la ligne
          for (let col = 2; col <= 7; col++) {
            row2.getCell(col).fill = slotFill
            row2.getCell(col).border = thinBorder
          }
          // Enseignants (Col C-G fusionnées)
          worksheet.mergeCells(currentRow, 3, currentRow, 7)
          const teachersText = (slot.teachers || []).join(', ')
          row2.getCell(3).value = teachersText
          row2.getCell(3).font = { size: 8, italic: true, bold: true }
          row2.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          row2.height = Math.max(20, getCourseRowHeight(teachersText))
          currentRow++

          // Fusionner Horaire (Col B) verticalement sur les 2 lignes (cours + enseignant)
          worksheet.mergeCells(slotStartRow, 2, currentRow - 1, 2)
          const timeCell = worksheet.getCell(slotStartRow, 2)
          timeCell.value = (slot.startTime && slot.startTime !== 'null') ? `${slot.startTime} - ${slot.endTime}` : 'Asynchrone'
          timeCell.font = { size: 9, bold: true }
          timeCell.alignment = { horizontal: 'center', vertical: 'middle' }
        })
      }
      
      // Fusionner colonne Jour (Col A) avec couleur du module
      if (daySlots.length > 0) {
        const endRow = currentRow - 1
        if (moduleStartRow < endRow) {
          worksheet.mergeCells(moduleStartRow, 1, endRow, 1)
        }
        const dayCell = worksheet.getCell(moduleStartRow, 1)
        dayCell.value = dayDate ? `${dayLabel}\n\n${dayDate}` : dayLabel
        dayCell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgHex } }
        dayCell.border = mediumBorder
      }
    })
    
    currentRow++
  }
  
  // Largeurs (A-G, sans colonne H)
  worksheet.getColumn(1).width = 15
  worksheet.getColumn(2).width = 14
  worksheet.getColumn(3).width = 22
  worksheet.getColumn(4).width = 22
  worksheet.getColumn(5).width = 22
  worksheet.getColumn(6).width = 22
  worksheet.getColumn(7).width = 22
  
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
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
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

/* Lignes spéciales : vacances / examens / férié */
:deep(.special-row) {
  opacity: 0.6;
}

.special-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 2rem;
  border-radius: 8px;
  color: var(--surface-900);
  font-weight: bold;
}

/* Lignes placeholder (jours vides du planning annuel) */
:deep(.placeholder-row) {
  background-color: var(--surface-ground) !important;
  opacity: 0.75;
  border-left: 3px solid var(--orange-400);
}

:deep(.highlighted-row) {
  position: relative;
  box-shadow: inset 0 0 0 3px var(--primary-color); 
  background-color: var(--primary-100, rgba(59, 130, 246, 0.15)) !important;
  transition: background-color 0.4s ease, box-shadow 0.4s ease;
}

:deep(.highlighted-row::after) {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px dashed var(--primary-500);
  border-radius: 6px;
  pointer-events: none;
  animation: highlightPulse 1.2s ease-in-out 2;
}

@keyframes highlightPulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.8; }
  100% { opacity: 0.3; }
}

:deep(.placeholder-row:hover) {
  opacity: 1;
}

.placeholder-cell {
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
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
    padding: .75rem;
  }
  
  .weekly-planning-table {
    font-size: 0.8rem;
  }

  :deep(.p-card .p-card-body) { padding:1rem; }
  :deep(.p-toolbar) { align-items:stretch; gap:.75rem; }
  :deep(.p-toolbar-group-start),
  :deep(.p-toolbar-group-end) { width:100%; flex-wrap:wrap; }
  :deep(.p-toolbar .p-button) { flex:1 1 auto; }
  :deep(.p-datatable-wrapper) { max-width:calc(100vw - 2.5rem); }
}
</style>
