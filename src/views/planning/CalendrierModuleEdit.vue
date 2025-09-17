<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendrier Module — Édition</h1>
    <p class="text-700 mb-3">Réservé aux administrateurs et responsables de module (rmodule).</p>

    <div class="grid" style="row-gap:1rem">
      <div class="col-12 md:col-4">
        <Panel header="Module">
          <div class="flex flex-column gap-2">
            <Dropdown class="w-full" :options="modules" v-model="moduleId" optionLabel="name" optionValue="id" placeholder="Choisir un module" />
            <InputText class="w-full" v-model="moduleMeta.color" placeholder="# Couleur" />
            <Textarea class="w-full" v-model="moduleMeta.description" placeholder="Description" rows="3" />
            <InputText class="w-full" v-model="moduleMeta.syllabus_url" placeholder="URL Syllabus" />
            <Button label="Enregistrer meta" icon="pi pi-save" @click="saveModuleMeta" />
          </div>
        </Panel>
      </div>
      <div class="col-12 md:col-8">
        <Panel header="Semaine par semaine (édition)">
          <div class="flex gap-2 mb-2">
            <Button size="small" icon="pi pi-plus" label="Ajouter une ligne" @click="addRow" />
            <Button size="small" icon="pi pi-refresh" label="Recharger" @click="loadCoursesForModule" />
          </div>
          <DataTable :value="rows" size="small">
            <Column field="week" header="Semaine">
              <template #body="{ data }">
                <InputText class="w-full" v-model.number="data.week" placeholder="37" />
              </template>
            </Column>
            <Column header="Cours">
              <template #body="{ data }">
                <InputText class="w-full" v-model="data.name" placeholder="Titre du cours" />
              </template>
            </Column>
            <Column header="Actions" :style="{ width: '120px' }">
              <template #body="{ data, index }">
                <div class="flex gap-2">
                  <Button size="small" icon="pi pi-trash" severity="danger" outlined @click="removeRow(index, data)" />
                </div>
              </template>
            </Column>
          </DataTable>
          <div class="mt-3 flex gap-2">
            <Button label="Enregistrer calendrier module" icon="pi pi-check" @click="saveModuleCourses" />
          </div>
        </Panel>
      </div>
    </div>
  </div>
</template>

<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import Panel from 'primevue/panel'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useModulesStore } from '@/views/planning/stores/modulesStore.js'
import { useCoursesStore } from '@/views/planning/stores/coursesStore.js'

const modules = ref([
  { id: 'mod-a', name: 'Module A' },
  { id: 'mod-b', name: 'Module B' },
])
const moduleId = ref()
const moduleMeta = ref({ color: '', description: '', syllabus_url: '' })
const rows = ref([]) // { id?, week?, name }

const route = useRoute()
const modulesStore = useModulesStore()
const coursesStore = useCoursesStore()

const loadModules = async () => {
  const list = await modulesStore.fetchAll()
  modules.value = list
}

const loadIfParam = async () => {
  const pid = route.params.moduleId
  if (pid) {
    moduleId.value = pid
    try {
      const mod = await modulesStore.getById(pid)
      moduleMeta.value = {
        color: mod?.color || '',
        description: mod?.description || '',
        syllabus_url: mod?.syllabus_url || ''
      }
    } catch (e) {
      console.warn('Impossible de charger le module', e)
    }
  }
}

const saveModuleMeta = async () => {
  if (!moduleId.value) return
  await modulesStore.updateOne(moduleId.value, moduleMeta.value)
}

const saveModuleCourses = async () => {
  if (!moduleId.value) return
  for (const r of rows.value) {
    if (!r.name || !r.name.trim()) continue
    const payload = {
      module_id: moduleId.value,
      name: r.name.trim(),
      description: r.description ?? null,
      syllabus_url: r.syllabus_url ?? null,
      semester_id: r.semester_id ?? null,
      duration_hours: r.duration_hours ?? null,
      schedule: r.week ? { week: r.week } : null,
    }
    if (r.id) await coursesStore.updateOne(r.id, payload)
    else {
      const created = await coursesStore.createOne(payload)
      r.id = created?.id
    }
  }
}

onMounted(async () => {
  await loadModules()
  await loadIfParam()
  await loadCoursesForModule()
})

const loadCoursesForModule = async () => {
  if (!moduleId.value) return
  const list = await coursesStore.fetchByModule(moduleId.value)
  rows.value = (list || []).map(c => ({ id: c.id, week: c.schedule?.week, name: c.name }))
}

const addRow = () => {
  rows.value.push({ week: 37, name: '' })
}

const removeRow = async (index) => {
  const c = rows.value[index]
  rows.value.splice(index, 1)
  if (c?.id) {
    try { await coursesStore.removeOne(c.id) } catch (e) { console.warn('Suppression du cours échouée', e) }
  }
}
</script>
