<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendrier Formation Temps Plein — Édition</h1>
    <p class="text-700 mb-3">Réservé aux administrateurs. Chaque case peut être: Module / Vacances / Interruption / Examens / Formation Pratique.</p>

    <div class="grid" style="row-gap:1rem">
      <div class="col-12 md:col-3">
        <Panel header="Outils">
          <div class="flex flex-column gap-2">
            <Dropdown :options="semesterOptions" optionLabel="name" optionValue="id" v-model="semesterId" placeholder="Semestre" class="w-full" />
            <div class="flex gap-2 align-items-center">
              <Button icon="pi pi-chevron-left" outlined @click="prevWeek" :disabled="!weekNumber" />
              <InputText class="w-full" v-model.number="weekNumber" placeholder="Semaine (ex. 37)" />
              <Button icon="pi pi-chevron-right" outlined @click="nextWeek" :disabled="!weekNumber" />
            </div>
            <Dropdown :options="dayOptions" v-model="dayOfWeek" optionLabel="label" optionValue="value" placeholder="Jour (1-7)" class="w-full" />
            <Dropdown :options="tools" v-model="tool" placeholder="Type de case" class="w-full" />
            <Dropdown :options="moduleOptions" optionLabel="name" optionValue="id" v-model="selectedModule" placeholder="Module (si type=module)" class="w-full" />
            <InputText class="w-full" v-model="notes" placeholder="Notes (facultatif)" />
            <div class="flex gap-2">
              <Button label="Appliquer" icon="pi pi-check" :disabled="!semesterId || !weekNumber || !dayOfWeek || !tool" @click="applyCell" />
              <Button label="Effacer la case" icon="pi pi-eraser" severity="secondary" :disabled="!semesterId || !weekNumber || !dayOfWeek" @click="clearCell" />
            </div>
            <div class="mt-3 text-800">Dupliquer une semaine</div>
            <div class="flex gap-2">
              <InputText class="w-full" v-model.number="dupSrcWeek" placeholder="Semaine source (ex. 37)" />
              <InputText class="w-full" v-model.number="dupDstWeek" placeholder="Semaine cible (ex. 38)" />
            </div>
            <Button label="Dupliquer" icon="pi pi-copy" :disabled="!semesterId || !dupSrcWeek || !dupDstWeek || dupSrcWeek===dupDstWeek" @click="duplicateWeek" />
          </div>
        </Panel>
      </div>
      <div class="col-12 md:col-9">
        <Panel :header="`Semaine ${weekNumber || '—'} (édition)`">
          <div class="grid text-600">
            <div class="col-2">Lundi</div>
            <div class="col-2">Mardi</div>
            <div class="col-2">Mercredi</div>
            <div class="col-2">Jeudi</div>
            <div class="col-2">Vendredi</div>
          </div>
          <div class="grid">
            <div class="col-2" v-for="day in 5" :key="day">
              <div class="border-2 border-dashed border-round p-3 cursor-pointer hover:surface-hover"
                   :class="dayPicked===day ? 'border-primary' : 'surface-border'"
                   @click="pickDay(day)">
                <i class="pi pi-pencil mr-2" /> {{ dayPicked === day ? 'Sélectionné' : 'Éditer' }}
                <div class="mt-2 text-700" style="white-space:pre-line" v-if="currentWeekCells[day] && currentWeekCells[day].length">
                  <div v-for="(c, idx) in currentWeekCells[day]" :key="idx">• {{ c }}</div>
                </div>
                <div class="mt-2 text-600" v-else>—</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <div class="col-12">
        <Message severity="info">
          Connecté à Supabase — semaine {{ weekNumber || '—' }}: {{ currentCount }} case(s) chargée(s). Les modifications sont sauvegardées automatiquement.
        </Message>
      </div>
    </div>
  </div>
</template>

<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import Panel from 'primevue/panel'
import Message from 'primevue/message'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import { ref, onMounted, watch, computed } from 'vue'
import { useSemestersStore } from '@/views/planning/stores/semestersStore.js'
import { useModulesStore } from '@/views/planning/stores/modulesStore.js'
import { useCalendarCellsStore } from '@/views/planning/stores/calendarCellsStore.js'

const toast = useToast()
const tools = ref(['module','vacances','interruption','examens','formation_pratique'])
const tool = ref()
const notes = ref('')
const dayOptions = ref([
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
])
const selectedModule = ref()
const semesterId = ref()
const weekNumber = ref()
const dayOfWeek = ref()
const dayPicked = ref(null)
const currentWeekCells = ref({})
const currentCount = computed(() => {
  return Object.values(currentWeekCells.value || {}).reduce((acc, arr) => acc + ((arr && arr.length) || 0), 0)
})
const dupSrcWeek = ref()
const dupDstWeek = ref()

const semestersStore = useSemestersStore()
const modulesStore = useModulesStore()
const cellsStore = useCalendarCellsStore()

const semesterOptions = computed(() => semestersStore.items)
const moduleOptions = computed(() => modulesStore.items)

const pickDay = (day) => {
  dayPicked.value = day
  dayOfWeek.value = day
}

const applyCell = async () => {
  if (!semesterId.value || !weekNumber.value || !dayOfWeek.value || !tool.value) return
  const payload = {
    semester_id: semesterId.value,
    week_number: Number(weekNumber.value),
    day_of_week: Number(dayOfWeek.value),
    type: tool.value,
    module_id: tool.value === 'module' ? selectedModule.value || null : null,
    notes: notes.value || null,
  }
  await cellsStore.upsertByKeys(payload)
  await loadWeekCells()
  persistSelection()
  toast.add({ severity: 'success', summary: 'Enregistré', detail: 'Case mise à jour', life: 1800 })
}

const loadWeekCells = async () => {
  currentWeekCells.value = {}
  if (!semesterId.value || !weekNumber.value) return
  const data = await cellsStore.fetchBySemesterWeek(semesterId.value, Number(weekNumber.value))
  const map = {}
  for (const r of data || []) {
    const d = r.day_of_week
    if (!map[d]) map[d] = []
    map[d].push(r.type + (r.notes ? ` (${r.notes})` : ''))
  }
  currentWeekCells.value = map
}

const clearCell = async () => {
  if (!semesterId.value || !weekNumber.value || !dayOfWeek.value) return
  const payload = {
    semester_id: semesterId.value,
    week_number: Number(weekNumber.value),
    day_of_week: Number(dayOfWeek.value),
    type: 'libre',
    module_id: null,
    course_id: null,
    notes: null,
  }
  await cellsStore.upsertByKeys(payload)
  await loadWeekCells()
  persistSelection()
  toast.add({ severity: 'success', summary: 'Effacé', detail: 'Case réinitialisée', life: 1800 })
}

const duplicateWeek = async () => {
  if (!semesterId.value || !dupSrcWeek.value || !dupDstWeek.value || dupSrcWeek.value === dupDstWeek.value) return
  // Lire toutes les cellules de la semaine source
  const src = await cellsStore.fetchBySemesterWeek(semesterId.value, Number(dupSrcWeek.value))
  // Pour chaque cellule source, appliquer dans la semaine cible
  for (const c of src || []) {
    const payload = {
      semester_id: semesterId.value,
      week_number: Number(dupDstWeek.value),
      day_of_week: Number(c.day_of_week),
      type: c.type,
      module_id: c.module_id || null,
      course_id: c.course_id || null,
      notes: c.notes || null,
    }
    await cellsStore.upsertByKeys(payload)
  }
  // Si la semaine affichée est la cible, recharger
  if (weekNumber.value === dupDstWeek.value) {
    await loadWeekCells()
  }
  persistSelection()
  toast.add({ severity: 'success', summary: 'Dupliqué', detail: `Semaine ${dupSrcWeek.value} → ${dupDstWeek.value}`, life: 2000 })
}

const prevWeek = () => {
  if (!weekNumber.value) return
  weekNumber.value = Number(weekNumber.value) - 1
}

const nextWeek = () => {
  if (!weekNumber.value) return
  weekNumber.value = Number(weekNumber.value) + 1
}

onMounted(async () => {
  await semestersStore.fetchAll()
  await modulesStore.fetchAll()
  restoreSelection()
  await loadWeekCells()
})

watch([semesterId, weekNumber], async () => {
  await loadWeekCells()
  persistSelection()
})

// Persistance locale de la sélection admin pour retrouver l’état au retour
const persistSelection = () => {
  const data = {
    semesterId: semesterId.value || null,
    weekNumber: weekNumber.value || null,
    dayOfWeek: dayOfWeek.value || null,
    tool: tool.value || null,
    selectedModule: selectedModule.value || null,
    notes: notes.value || null,
  }
  try { localStorage.setItem('calendar_admin_selection', JSON.stringify(data)) } catch (e) { console.warn('Persist selection failed', e) }
}

const restoreSelection = () => {
  try {
    const raw = localStorage.getItem('calendar_admin_selection')
    if (!raw) return
    const s = JSON.parse(raw)
    semesterId.value = s.semesterId ?? semesterId.value
    weekNumber.value = s.weekNumber ?? weekNumber.value
    dayOfWeek.value = s.dayOfWeek ?? dayOfWeek.value
    tool.value = s.tool ?? tool.value
    selectedModule.value = s.selectedModule ?? selectedModule.value
    notes.value = s.notes ?? notes.value
  } catch (e) { console.warn('Restore selection failed', e) }
}
</script>
