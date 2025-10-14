<template>
  <div class="academic-year-management">
    <h1>Gestion des Années Académiques</h1>
    
    <!-- Année active -->
    <Panel header="Année Académique Active" class="mb-4">
      <div v-if="activeAcademicYear" class="active-year-card">
        <div class="year-info">
          <h2>{{ activeAcademicYear.name }}</h2>
          <p>Du {{ formatDate(activeAcademicYear.start_date) }} au {{ formatDate(activeAcademicYear.end_date) }}</p>
        </div>
        <Tag severity="success" value="ACTIVE" />
      </div>
      <Message v-else severity="warn">Aucune année académique active</Message>
    </Panel>

    <!-- Liste des années académiques -->
    <Panel header="Toutes les Années Académiques" class="mb-4">
      <div class="mb-3">
        <Button 
          label="Nouvelle Année Académique" 
          icon="pi pi-plus" 
          @click="showCreateDialog = true"
          severity="success"
        />
      </div>

      <DataTable 
        :value="academicYears" 
        :loading="loading"
        stripedRows
      >
        <Column field="name" header="Année" sortable>
          <template #body="{ data }">
            <strong>{{ data.name }}</strong>
          </template>
        </Column>
        
        <Column field="start_date" header="Début" sortable>
          <template #body="{ data }">
            {{ formatDate(data.start_date) }}
          </template>
        </Column>
        
        <Column field="end_date" header="Fin" sortable>
          <template #body="{ data }">
            {{ formatDate(data.end_date) }}
          </template>
        </Column>
        
        <Column field="is_active" header="Statut" sortable>
          <template #body="{ data }">
            <Tag v-if="data.is_active" severity="success" value="Active" />
            <Tag v-else severity="secondary" value="Inactive" />
          </template>
        </Column>
        
        <Column header="Actions">
          <template #body="{ data }">
            <Button 
              v-if="!data.is_active"
              label="Activer" 
              icon="pi pi-check" 
              size="small"
              @click="activateYear(data.id)"
              class="mr-2"
            />
            <Button 
              label="Classes" 
              icon="pi pi-users" 
              size="small"
              severity="info"
              @click="manageCohorts(data)"
            />
          </template>
        </Column>
      </DataTable>
    </Panel>

    <!-- Gestion des classes -->
    <Panel v-if="selectedYear" :header="`Classes pour ${selectedYear.name}`" class="mb-4">
      <div class="mb-3">
        <Button 
          label="Générer Classes Automatiquement" 
          icon="pi pi-bolt" 
          @click="showGenerateDialog = true"
          severity="warning"
          class="mr-2"
        />
      </div>

      <DataTable :value="sortedClasses" :loading="loading">
        <Column field="code" header="Code" sortable>
          <template #body="{ data }">
            <strong>{{ data.code }}</strong>
          </template>
        </Column>
        
        <Column field="name" header="Nom" sortable />
        
        <Column field="year_level" header="Année d'étude" sortable>
          <template #body="{ data }">
            <Tag 
              :value="`${data.year_level}${data.year_level === 1 ? 'ère' : 'ème'} année`"
              :severity="data.year_level === 1 ? 'info' : data.year_level === 2 ? 'warning' : 'success'"
            />
          </template>
        </Column>
      </DataTable>
    </Panel>

    <!-- Dialog: Créer année académique -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      header="Nouvelle Année Académique" 
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="p-fluid">
        <div class="field mb-3">
          <label>Année de départ</label>
          <InputNumber 
            v-model="newYear.startYear" 
            :min="2020" 
            :max="2050"
            placeholder="Ex: 2026"
          />
          <small>L'année académique sera générée automatiquement (ex: 2026-2027)</small>
        </div>
      </div>

      <template #footer>
        <Button label="Annuler" icon="pi pi-times" @click="showCreateDialog = false" text />
        <Button 
          label="Créer" 
          icon="pi pi-check" 
          @click="createYear"
          :loading="loading"
        />
      </template>
    </Dialog>

    <!-- Dialog: Générer classes -->
    <Dialog 
      v-model:visible="showGenerateDialog" 
      header="Générer les Classes" 
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="p-fluid">
        <Message severity="info" :closable="false" class="mb-3">
          Les classes seront générées automatiquement pour {{ selectedYear?.name }}
        </Message>
        
        <div class="field">
          <label>Année de la 1ère année</label>
          <InputNumber 
            v-model="generateYear" 
            :min="2020" 
            :max="2050"
            placeholder="Ex: 2026"
          />
          <small>Génère B26 (1ère), B25 (2ème), B24 (3ème)</small>
        </div>
      </div>

      <template #footer>
        <Button label="Annuler" icon="pi pi-times" @click="showGenerateDialog = false" text />
        <Button 
          label="Générer" 
          icon="pi pi-bolt" 
          @click="generateClassesForYear"
          :loading="loading"
          severity="warning"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAcademicYear } from '@/composables/useAcademicYear'
import { useToast } from 'primevue/usetoast'
import Panel from 'primevue/panel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'

const toast = useToast()

const {
  academicYears,
  activeAcademicYear,
  classes: sortedClasses,
  loading,
  loadAcademicYears,
  loadActiveAcademicYear,
  loadClassesByYear,
  setActiveYear,
  createAcademicYear,
  generateClasses
} = useAcademicYear()

const selectedYear = ref(null)
const showCreateDialog = ref(false)
const showGenerateDialog = ref(false)
const newYear = ref({ startYear: new Date().getFullYear() + 1 })
const generateYear = ref(new Date().getFullYear() + 1)

onMounted(async () => {
  await loadAcademicYears()
  await loadActiveAcademicYear()
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

const activateYear = async (id) => {
  try {
    await setActiveYear(id)
    await loadAcademicYears()
    await loadActiveAcademicYear()
    toast.add({
      severity: 'success',
      summary: 'Année activée',
      detail: 'L\'année académique a été activée avec succès',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'activer l\'année académique',
      life: 3000
    })
  }
}

const manageCohorts = async (year) => {
  selectedYear.value = year
  await loadClassesByYear(year.id)
}

const createYear = async () => {
  try {
    const startYear = newYear.value.startYear
    const endYear = startYear + 1
    
    const yearData = {
      name: `${startYear}-${endYear}`,
      start_date: `${startYear}-09-01`,
      end_date: `${endYear}-08-31`,
      is_active: false
    }

    await createAcademicYear(yearData)
    
    toast.add({
      severity: 'success',
      summary: 'Année créée',
      detail: `L'année ${yearData.name} a été créée avec succès`,
      life: 3000
    })
    
    showCreateDialog.value = false
    newYear.value = { startYear: new Date().getFullYear() + 1 }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de créer l\'année académique',
      life: 3000
    })
  }
}

const generateClassesForYear = async () => {
  try {
    await generateClasses(selectedYear.value.id, generateYear.value)
    await loadClassesByYear(selectedYear.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Classes générées',
      detail: 'Les classes ont été générées avec succès',
      life: 3000
    })
    
    showGenerateDialog.value = false
    generateYear.value = new Date().getFullYear() + 1
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de générer les classes',
      life: 3000
    })
  }
}
</script>

<style scoped>
.academic-year-management {
  padding: 2rem;
}

.active-year-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.year-info h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.year-info p {
  margin: 0;
  color: #6c757d;
}
</style>
