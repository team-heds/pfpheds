<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Vue Journalière — Gestion des Salles" 
        subtitle="Tous les cours par jour avec enseignants, classes et salles" 
        icon="pi pi-building" 
      />
    </template>

    <div class="daily-planning-page">
      <!-- Toolbar -->
      <div class="toolbar-card">
        <div class="toolbar-row">
          <div class="flex gap-3 align-items-center flex-wrap">
            <div class="field-inline">
              <label>Semaine</label>
              <Dropdown 
                v-model="selectedWeek" 
                :options="weekOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Semaine" 
                @change="loadSlots"
                style="width: 220px"
              />
            </div>
            <div class="field-inline">
              <label>Jour</label>
              <Dropdown 
                v-model="selectedDay" 
                :options="dayOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Tous les jours"
                showClear
                style="width: 180px"
              />
            </div>
            <div class="field-inline">
              <label>Classe</label>
              <Dropdown 
                v-model="selectedClass" 
                :options="classOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Toutes les classes"
                showClear
                style="width: 180px"
              />
            </div>
          </div>
          <div class="flex gap-2 align-items-center">
            <Tag :value="dateRangeLabel" severity="info" />
            <Button label="Exporter" icon="pi pi-download" severity="secondary" size="small" @click="exportDay" />
          </div>
        </div>
      </div>

      <!-- Stats rapides -->
      <div class="stats-row" v-if="!loading && filteredSlots.length > 0">
        <div class="stat-card">
          <i class="pi pi-calendar"></i>
          <div>
            <span class="stat-value">{{ filteredSlots.length }}</span>
            <span class="stat-label">Créneaux</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="pi pi-users"></i>
          <div>
            <span class="stat-value">{{ uniqueTeachersCount }}</span>
            <span class="stat-label">Enseignants</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="pi pi-book"></i>
          <div>
            <span class="stat-value">{{ uniqueModulesCount }}</span>
            <span class="stat-label">Modules</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="pi pi-th-large"></i>
          <div>
            <span class="stat-value">{{ uniqueClassesCount }}</span>
            <span class="stat-label">Classes</span>
          </div>
        </div>
        <div class="stat-card" :class="{ 'stat-warning': slotsWithoutRoom > 0 }">
          <i class="pi pi-building"></i>
          <div>
            <span class="stat-value">{{ slotsWithoutRoom }}</span>
            <span class="stat-label">Sans salle</span>
          </div>
        </div>
      </div>

      <!-- Tableau par jour -->
      <div v-if="loading" class="loading-state">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <p>Chargement du planning...</p>
      </div>

      <div v-else-if="filteredSlots.length === 0" class="empty-state">
        <i class="pi pi-calendar-times"></i>
        <p>Aucun créneau pour cette sélection</p>
        <small>Sélectionnez une semaine et vérifiez que des créneaux existent dans le planning.</small>
      </div>

      <template v-else>
        <div v-for="dayGroup in groupedByDay" :key="dayGroup.day" class="day-section">
          <div class="day-header">
            <h3>
              <i class="pi pi-calendar"></i>
              {{ dayGroup.dayLabel }}
              <span v-if="dayGroup.date" class="day-date">{{ dayGroup.date }}</span>
            </h3>
            <Tag :value="`${dayGroup.slots.length} créneaux`" severity="secondary" />
          </div>

          <DataTable 
            :value="dayGroup.slots" 
            stripedRows 
            responsiveLayout="scroll"
            class="day-table"
          >
            <Column field="start_time" header="Horaire" style="width: 120px" sortable>
              <template #body="{ data }">
                <div class="time-cell">
                  <strong>{{ data.start_time }}</strong>
                  <span class="text-500">{{ data.end_time }}</span>
                </div>
              </template>
            </Column>

            <Column field="class_code" header="Classe" style="width: 120px" sortable>
              <template #body="{ data }">
                <Tag :value="data.class_code" :style="getClassTagStyle(data.class_code)" />
              </template>
            </Column>

            <Column field="module_code" header="Module" sortable>
              <template #body="{ data }">
                <div class="module-cell">
                  <div 
                    class="module-dot" 
                    :style="{ background: getModuleColor(data.module_code) }"
                  ></div>
                  <div>
                    <div class="font-bold">{{ getModuleLabel(data.module_code) }}</div>
                    <div v-if="data.course_title" class="text-sm text-500">{{ data.course_title }}</div>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="activity" header="Activité" style="width: 120px">
              <template #body="{ data }">
                <span>{{ data.activity || '—' }}</span>
              </template>
            </Column>

            <Column field="teachers" header="Enseignants">
              <template #body="{ data }">
                <div v-if="data.teachers && data.teachers.length > 0" class="teachers-cell">
                  <Chip 
                    v-for="(teacher, idx) in data.teachers" 
                    :key="idx" 
                    :label="teacher" 
                    icon="pi pi-user" 
                    class="teacher-chip"
                  />
                </div>
                <span v-else class="text-500">—</span>
              </template>
            </Column>

            <Column field="room" header="Salle" style="width: 140px" sortable>
              <template #body="{ data }">
                <Tag v-if="data.room" :value="data.room" severity="success" />
                <Tag v-else value="Non attribuée" severity="warning" />
              </template>
            </Column>

            <Column field="notes" header="Notes" style="width: 160px">
              <template #body="{ data }">
                <span v-if="data.notes" class="text-sm">{{ data.notes }}</span>
                <span v-else class="text-500">—</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </div>

    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/supabase'
import planningService from '@/service/planningService'
import academicYearService from '@/service/academicYearService'
import { useAcademicYear } from '@/composables/useAcademicYear'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'

const toast = useToast()
const loading = ref(false)
const selectedWeek = ref(null)
const selectedDay = ref(null)
const selectedClass = ref(null)
const allSlots = ref([])
const courseModules = ref([])
const activeYearClassCodes = ref(null)
const { activeAcademicYear, loadActiveAcademicYear } = useAcademicYear()

function normalizeClassCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function getClassCodeAliases(value) {
  const raw = normalizeClassCode(value)
  if (!raw) return []

  const aliases = new Set([raw])
  const normalized = raw.replace(/_/g, '-')
  aliases.add(normalized)

  const bacMatch = normalized.match(/^BAC(\d{2})(-.+)?$/)
  if (bacMatch) aliases.add(`B${bacMatch[1]}${bacMatch[2] || ''}`)

  const bMatch = normalized.match(/^B(\d{2})(-.+)?$/)
  if (bMatch) aliases.add(`BAC${bMatch[1]}${bMatch[2] || ''}`)

  return Array.from(aliases)
}

async function loadActiveYearClassCodes() {
  try {
    const yearId = activeAcademicYear.value?.id
    if (!yearId) {
      activeYearClassCodes.value = null
      return
    }

    const classes = await academicYearService.getClassesByAcademicYear(yearId)
    const classCodes = new Set(
      (classes || [])
        .flatMap(c => getClassCodeAliases(c?.code))
        .filter(Boolean)
    )

    activeYearClassCodes.value = classCodes.size > 0 ? classCodes : null
  } catch (err) {
    console.warn('[DailyPlanning] Impossible de charger les classes de l\'année active:', err)
    activeYearClassCodes.value = null
  }
}

const dayOptions = [
  { label: 'Lundi', value: 'lundi' },
  { label: 'Mardi', value: 'mardi' },
  { label: 'Mercredi', value: 'mercredi' },
  { label: 'Jeudi', value: 'jeudi' },
  { label: 'Vendredi', value: 'vendredi' },
  { label: 'Distance', value: 'distance' }
]

const dayOrder = { lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, distance: 5 }

const isoWeeksInYear = (year) => {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  return (jan1.getDay() === 4 || dec31.getDay() === 4) ? 53 : 52
}

const weekOptions = computed(() => {
  const weeks = []
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const aYear = currentMonth >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const maxAutumnWeek = isoWeeksInYear(aYear)

  for (let w = 38; w <= maxAutumnWeek; w++) {
    weeks.push({ label: `Semaine ${w} (Automne)`, value: w })
  }
  for (let w = 1; w <= 7; w++) {
    weeks.push({ label: `Semaine ${w} (Automne)`, value: w })
  }
  for (let w = 8; w <= 37; w++) {
    weeks.push({ label: `Semaine ${w} (Printemps)`, value: w })
  }
  return weeks
})

const classOptions = computed(() => {
  const codes = [...new Set(allSlots.value.map(s => s.class_code))].sort()
  return codes.map(c => ({ label: c, value: c }))
})

const filteredSlots = computed(() => {
  let slots = [...allSlots.value]
  if (selectedDay.value) {
    slots = slots.filter(s => s.day === selectedDay.value)
  }
  if (selectedClass.value) {
    slots = slots.filter(s => s.class_code === selectedClass.value)
  }
  return slots
})

const groupedByDay = computed(() => {
  const groups = {}
  filteredSlots.value.forEach(slot => {
    const day = slot.day || 'inconnu'
    if (!groups[day]) {
      groups[day] = {
        day,
        dayLabel: dayOptions.find(d => d.value === day)?.label || day,
        date: slot.date || null,
        slots: []
      }
    }
    groups[day].slots.push(slot)
  })

  return Object.values(groups)
    .sort((a, b) => (dayOrder[a.day] ?? 99) - (dayOrder[b.day] ?? 99))
    .map(g => {
      g.slots.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '') || (a.class_code || '').localeCompare(b.class_code || ''))
      return g
    })
})

const uniqueTeachersCount = computed(() => {
  const set = new Set()
  filteredSlots.value.forEach(s => {
    (s.teachers || []).forEach(t => set.add(t))
  })
  return set.size
})

const uniqueModulesCount = computed(() => {
  return new Set(filteredSlots.value.map(s => s.module_code).filter(Boolean)).size
})

const uniqueClassesCount = computed(() => {
  return new Set(filteredSlots.value.map(s => s.class_code).filter(Boolean)).size
})

const slotsWithoutRoom = computed(() => {
  return filteredSlots.value.filter(s => !s.room).length
})

const dateRangeLabel = computed(() => {
  if (!selectedWeek.value) return 'Sélectionnez une semaine'
  const monday = planningService.getDateForWeekAndDay(selectedWeek.value, 0)
  const friday = planningService.getDateForWeekAndDay(selectedWeek.value, 4)
  return `${monday} — ${friday}`
})

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
  if (preset) {
    return { background: preset.bg, color: preset.text, border: 'none' }
  }
  // Couleur déterministe basée sur le hash du code
  let hash = 0
  for (let i = 0; i < (code || '').length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
  const color = defaultClassColors[Math.abs(hash) % defaultClassColors.length]
  return { background: color, color: '#fff', border: 'none' }
}

function getModuleColor(code) {
  const mod = courseModules.value.find(m => m.code === code)
  return mod?.color || '#94a3b8'
}

function getModuleLabel(code) {
  const mod = courseModules.value.find(m => m.code === code)
  return mod?.label || code || '—'
}

async function loadSlots() {
  if (!selectedWeek.value) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .eq('week_number', selectedWeek.value)
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    // Normaliser class_code en majuscules (les données peuvent avoir bac24 ou BAC24)
    const normalizedSlots = (data || []).map(s => ({ ...s, class_code: s.class_code?.toUpperCase() || s.class_code }))

    if (activeYearClassCodes.value instanceof Set && activeYearClassCodes.value.size > 0) {
      allSlots.value = normalizedSlots.filter(slot => {
        const slotCodes = []
        if (Array.isArray(slot.class_codes)) slotCodes.push(...slot.class_codes)
        if (slot.class_code) slotCodes.push(slot.class_code)
        if (slotCodes.length === 0) return false

        return slotCodes.some(code => {
          const aliases = getClassCodeAliases(code)
          return aliases.some(alias => activeYearClassCodes.value.has(alias))
        })
      })
    } else {
      allSlots.value = normalizedSlots
    }
  } catch (err) {
    console.error('Erreur chargement créneaux:', err)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les créneaux' })
  } finally {
    loading.value = false
  }
}

async function exportDay() {
  if (filteredSlots.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Rien à exporter', detail: 'Aucun créneau affiché' })
    return
  }

  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    const border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }

    groupedByDay.value.forEach(dayGroup => {
      const ws = workbook.addWorksheet(dayGroup.dayLabel)

      ws.columns = [
        { header: 'Horaire début', key: 'start', width: 14 },
        { header: 'Horaire fin', key: 'end', width: 14 },
        { header: 'Classe', key: 'classCode', width: 14 },
        { header: 'Module', key: 'module', width: 30 },
        { header: 'Cours', key: 'course', width: 25 },
        { header: 'Activité', key: 'activity', width: 15 },
        { header: 'Enseignants', key: 'teachers', width: 35 },
        { header: 'Salle', key: 'room', width: 15 },
        { header: 'Notes', key: 'notes', width: 20 }
      ]

      const headerRow = ws.getRow(1)
      headerRow.eachCell(cell => {
        cell.fill = headerFill
        cell.font = headerFont
        cell.border = border
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      })
      headerRow.height = 28

      dayGroup.slots.forEach((slot, i) => {
        const row = ws.addRow({
          start: slot.start_time || '',
          end: slot.end_time || '',
          classCode: slot.class_code || '',
          module: getModuleLabel(slot.module_code),
          course: slot.course_title || '',
          activity: slot.activity || '',
          teachers: (slot.teachers || []).join(', '),
          room: slot.room || '',
          notes: slot.notes || ''
        })
        const stripeFill = i % 2 === 0
          ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
          : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
        row.eachCell(cell => {
          cell.border = border
          cell.fill = stripeFill
          cell.alignment = { vertical: 'middle' }
        })

        if (!slot.room) {
          const roomCell = row.getCell(8)
          roomCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }
          roomCell.font = { italic: true, color: { argb: 'FF856404' } }
          roomCell.value = '⚠ Non attribuée'
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const suffix = selectedDay.value ? `-${selectedDay.value}` : ''
    link.download = `planning-salles-S${selectedWeek.value}${suffix}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    toast.add({ severity: 'success', summary: 'Export réussi', detail: `${filteredSlots.value.length} créneaux exportés` })
  } catch (error) {
    console.error('Erreur export:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'exporter" })
  }
}

onMounted(async () => {
  try {
    await loadActiveAcademicYear()
    await loadActiveYearClassCodes()
    courseModules.value = await planningService.getAllCourseModules()
  } catch (err) {
    console.error('Erreur chargement modules:', err)
  }

  // Sélectionner la semaine courante par défaut
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const jan4Day = jan4.getDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - jan4Day + 1)
  const diff = Math.floor((now - week1Monday) / (7 * 24 * 60 * 60 * 1000))
  const currentWeek = diff + 1
  if (currentWeek >= 1 && currentWeek <= 53) {
    selectedWeek.value = currentWeek
    await loadSlots()
  }
})

watch(
  () => activeAcademicYear.value?.id,
  async (newYear, oldYear) => {
    if (newYear === oldYear) return
    await loadActiveYearClassCodes()
    await loadSlots()
  }
)
</script>

<style scoped>
.daily-planning-page {
  padding: 2rem;
}

.toolbar-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.field-inline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-inline label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.stat-card {
  background: var(--surface-card);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  flex: 1;
  min-width: 140px;
}

.stat-card i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.stat-card.stat-warning i {
  color: #e67e22;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

/* Day sections */
.day-section {
  margin-bottom: 2rem;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.day-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
  color: var(--text-color);
}

.day-date {
  font-weight: 400;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.day-table {
  background: var(--surface-card);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* Cells */
.time-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.module-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.module-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.teachers-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.teacher-chip {
  font-size: 0.8rem;
}

/* States */
.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-color-secondary);
}

.loading-state p, .empty-state p {
  margin: 1rem 0 0.25rem;
  font-size: 1.1rem;
}

.empty-state i {
  font-size: 3rem;
  opacity: 0.4;
}

.empty-state small {
  color: var(--text-color-secondary);
  opacity: 0.7;
}
</style>
