<template>
  <AdminLayout>
    <div class="result-preview-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-eye text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Aperçu Résultats Votation</h1>
              <p class="text-600 m-0 mt-1">Prévisualisation des résultats avant publication</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter" outlined />
            <Button icon="pi pi-check" label="Publier" severity="success" @click="publishResults" />
          </div>
        </div>
      </div>

      <!-- Progression globale -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <h3 class="text-lg font-bold mb-3">Progression de la Votation</h3>
        <div class="flex align-items-center justify-content-between mb-2">
          <span class="font-semibold">Taux de participation</span>
          <span class="font-bold text-primary">{{ progressPercent }}%</span>
        </div>
        <ProgressBar :value="progressPercent" />
        <div class="flex justify-content-between mt-2 text-sm text-600">
          <span>{{ stats.voted }} ont voté</span>
          <span>{{ stats.pending }} en attente</span>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Total Étudiants</div>
            <div class="text-2xl font-bold text-900">{{ stats.total }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Ont Voté</div>
            <div class="text-2xl font-bold text-green-500">{{ stats.voted }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Choix 1 Obtenu</div>
            <div class="text-2xl font-bold text-blue-500">{{ stats.choix1 }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Sans Attribution</div>
            <div class="text-2xl font-bold text-red-500">{{ stats.noMatch }}</div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterClasse" :options="classes" placeholder="Toutes les classes" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterResult" :options="resultOptions" placeholder="Tous les résultats" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <SelectButton v-model="viewMode" :options="viewModes" optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div class="col-12 md:col-3">
            <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Résultats par Étudiant -->
      <div v-if="viewMode === 'student'" class="surface-card p-4 border-round shadow-2">
        <h3 class="text-xl font-bold mb-3">Résultats par Étudiant</h3>
        <DataTable :value="studentResults" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="20">
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun résultat</p>
            </div>
          </template>
          <Column field="nom" header="Nom" sortable></Column>
          <Column field="prenom" header="Prénom" sortable></Column>
          <Column field="classe" header="Classe" sortable></Column>
          <Column field="choix1" header="Choix 1"></Column>
          <Column field="choix2" header="Choix 2"></Column>
          <Column field="choix3" header="Choix 3"></Column>
          <Column field="attribution" header="Attribution">
            <template #body="slotProps">
              <div class="font-semibold">{{ slotProps.data.attribution }}</div>
            </template>
          </Column>
          <Column field="priorite" header="Priorité">
            <template #body="slotProps">
              <Tag :value="`Choix ${slotProps.data.priorite}`" :severity="getPrioritySeverity(slotProps.data.priorite)" />
            </template>
          </Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Résultats par Institution -->
      <div v-else class="surface-card p-4 border-round shadow-2">
        <h3 class="text-xl font-bold mb-3">Résultats par Institution</h3>
        <DataTable :value="institutionResults" :loading="loading" responsiveLayout="scroll">
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun résultat</p>
            </div>
          </template>
          <Column field="institution" header="Institution" sortable></Column>
          <Column field="places" header="Places Dispo" sortable></Column>
          <Column field="demandes" header="Demandes" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.demandes" severity="info" />
            </template>
          </Column>
          <Column field="attribues" header="Attribués" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.attribues" severity="success" />
            </template>
          </Column>
          <Column field="taux" header="Taux Remplissage" sortable>
            <template #body="slotProps">
              <ProgressBar :value="slotProps.data.taux" :showValue="true" />
            </template>
          </Column>
          <Column field="restantes" header="Places Restantes" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.restantes" :severity="slotProps.data.restantes > 0 ? 'warning' : 'success'" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Alertes -->
      <div v-if="alerts.length > 0" class="surface-card p-4 border-round shadow-2 mt-4">
        <h3 class="text-lg font-bold mb-3 flex align-items-center gap-2">
          <i class="pi pi-exclamation-triangle text-orange-500"></i>
          Alertes et Conflits
        </h3>
        <div class="flex flex-column gap-2">
          <Message v-for="(alert, idx) in alerts" :key="idx" :severity="alert.severity">
            {{ alert.message }}
          </Message>
        </div>
      </div>

      <!-- Actions finales -->
      <div class="surface-card p-4 border-round shadow-2 mt-4">
        <div class="flex justify-content-between align-items-center">
          <div>
            <h3 class="text-lg font-bold m-0">Publication des Résultats</h3>
            <p class="text-600 m-0 mt-1">Les résultats seront visibles par tous les étudiants</p>
          </div>
          <div class="flex gap-2">
            <Button label="Annuler" severity="secondary" outlined />
            <Button label="Publier" icon="pi pi-send" severity="success" @click="publishResults" />
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'

const loading = ref(false)
const searchQuery = ref('')
const filterClasse = ref(null)
const filterResult = ref(null)
const viewMode = ref('student')
const studentResults = ref([])
const institutionResults = ref([])

const classes = ref(['BA22', 'BA23', 'BA24'])
const resultOptions = ref(['Choix 1', 'Choix 2', 'Choix 3', 'Non attribué'])
const viewModes = ref([
  { label: 'Par Étudiant', value: 'student' },
  { label: 'Par Institution', value: 'institution' }
])

const stats = ref({
  total: 120,
  voted: 115,
  pending: 5,
  choix1: 85,
  noMatch: 3
})

const alerts = ref([
  { severity: 'warn', message: '3 étudiants sans attribution - Vérification requise' },
  { severity: 'info', message: '5 étudiants n\'ont pas encore voté' }
])

const progressPercent = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.voted / stats.value.total) * 100)
})

const getPrioritySeverity = (priorite) => {
  return priorite === 1 ? 'success' : priorite === 2 ? 'info' : 'warning'
}

const getStatusSeverity = (status) => {
  const severities = {
    'Attribué': 'success',
    'En attente': 'warning',
    'Non attribué': 'danger'
  }
  return severities[status] || 'secondary'
}

const publishResults = () => {
  console.log('Publish results')
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.result-preview-page {
  min-height: calc(100vh - 100px);
}
</style>
