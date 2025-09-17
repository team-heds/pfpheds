<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendar - Modules</h1>
    <p class="text-700 mb-3">Liste des modules (vue calendrier).</p>
    <Panel header="Créer un module">
      <div class="grid" style="row-gap:.5rem">
        <div class="col-12 md:col-3"><InputText class="w-full" v-model="draft.code" placeholder="Code (ex: MOD-A)" /></div>
        <div class="col-12 md:col-3"><InputText class="w-full" v-model="draft.name" placeholder="Nom" /></div>
        <div class="col-12 md:col-3"><InputText class="w-full" v-model="draft.color" placeholder="# Couleur" /></div>
        <div class="col-12 md:col-3"><InputText class="w-full" v-model="draft.syllabus_url" placeholder="URL Syllabus" /></div>
        <div class="col-12"><Button size="small" label="Créer" icon="pi pi-plus" @click="createModule" /></div>
      </div>
    </Panel>

    <Panel header="Modules">
      <DataTable :value="rows" size="small">
        <Column field="code" header="Code" />
        <Column field="name" header="Nom" />
        <Column field="color" header="Couleur" />
        <Column header="Actions">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button size="small" label="Voir" icon="pi pi-eye" @click="go(`/calendar/module/${data.id}`)" />
              <Button size="small" label="Éditer" icon="pi pi-pencil" @click="go(`/calendar/module/${data.id}/edit`)" />
              <Button size="small" icon="pi pi-trash" severity="danger" outlined @click="remove(data.id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </Panel>
  </div>
</template>

<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useModulesStore } from '@/views/planning/stores/modulesStore.js'

const router = useRouter()
const go = (p) => router.push(p)

const rows = ref([])
const draft = ref({ code: '', name: '', color: '', syllabus_url: '' })
const store = useModulesStore()

const load = async () => {
  rows.value = await store.fetchAll()
}

const createModule = async () => {
  if (!draft.value.name) return
  const created = await store.createOne({ ...draft.value })
  if (created) {
    draft.value = { code: '', name: '', color: '', syllabus_url: '' }
    await load()
  }
}

const remove = async (id) => {
  await store.removeOne(id)
  await load()
}

onMounted(load)
</script>
