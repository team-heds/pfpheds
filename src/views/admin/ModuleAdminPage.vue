<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Gestion des Modules" 
        subtitle="Modules de formation — Soins Infirmiers" 
        icon="pi pi-book" 
      />
    </template>

    <div class="module-admin-page">
      <!-- Toolbar -->
      <div class="toolbar-card">
        <div class="flex justify-content-between align-items-center">
          <div class="flex gap-2 align-items-center">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="moduleSearchQuery" placeholder="Rechercher un module..." style="width: 300px" />
            </span>
            <Button icon="pi pi-times" severity="secondary" size="small" @click="moduleSearchQuery = ''" v-tooltip.top="'Effacer'" />
          </div>
          <div class="flex gap-2 align-items-center">
            <Tag :value="`${filteredModules.length} / ${modules.length} modules`" severity="info" />
            <Button label="Exporter" icon="pi pi-download" severity="secondary" size="small" @click="exportModules" />
            <Button label="Nouveau Module" icon="pi pi-plus" @click="showCreateModuleDialog = true" />
          </div>
        </div>
      </div>

      <!-- Tableau des modules -->
      <div class="table-card">
        <DataTable 
          :value="filteredModules" 
          paginator 
          :rows="15" 
          dataKey="id"
          :loading="modulesLoading"
          stripedRows
          responsiveLayout="scroll"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun module trouvé</p>
            </div>
          </template>

          <Column field="code" header="Code" sortable style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data.code" severity="secondary" />
            </template>
          </Column>

          <Column field="number" header="N° Module" sortable style="width: 120px">
            <template #body="{ data }">
              <span class="font-bold" style="color: var(--primary-color)">{{ data.number || '—' }}</span>
            </template>
          </Column>

          <Column field="title" header="Titre" sortable />

          <Column field="color" header="Couleur" sortable style="width: 100px">
            <template #body="{ data }">
              <div v-if="data.color" class="flex align-items-center gap-2">
                <span :style="{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '4px', backgroundColor: data.color }" />
                <span class="text-xs text-500">{{ data.color }}</span>
              </div>
              <span v-else class="text-500">—</span>
            </template>
          </Column>

          <Column field="credits" header="Crédits ECTS" sortable style="width: 130px">
            <template #body="{ data }">
              <Tag v-if="data.credits" :value="`${data.credits} ECTS`" severity="success" />
              <span v-else class="text-500">—</span>
            </template>
          </Column>

          <Column field="responsable" header="Chef de module" sortable>
            <template #body="{ data }">
              <div v-if="data.responsable" class="flex align-items-center gap-2">
                <i class="pi pi-user" style="color: var(--primary-color)"></i>
                <span>{{ data.responsable }}</span>
              </div>
              <span v-else class="text-500">—</span>
            </template>
          </Column>

          <Column header="Actions" :exportable="false" style="width: 120px">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button 
                  icon="pi pi-pencil" 
                  severity="info" 
                  size="small" 
                  @click="editModule(slotProps.data)" 
                  v-tooltip.top="'Éditer'"
                />
                <Button 
                  icon="pi pi-copy" 
                  severity="secondary" 
                  size="small" 
                  @click="duplicateModule(slotProps.data)" 
                  v-tooltip.top="'Dupliquer'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog Création/Édition Module -->
      <Dialog v-model:visible="showCreateModuleDialog" modal :header="moduleForm.id ? 'Éditer le Module' : 'Nouveau Module'" :style="{ width: '40rem' }">
        <div class="p-fluid">
          <div class="field">
            <label for="moduleCode">Code * <small class="text-500">(identifiant unique, ex: phy_m12)</small></label>
            <InputText id="moduleCode" v-model="moduleForm.code" placeholder="ex: phy_m12" />
          </div>
          <div class="field">
            <label for="moduleNumber">Numéro du module</label>
            <InputText id="moduleNumber" v-model="moduleForm.number" placeholder="ex: M1234" />
          </div>
          <div class="field">
            <label for="moduleTitle">Titre *</label>
            <InputText id="moduleTitle" v-model="moduleForm.title" />
          </div>
          <div class="grid">
            <div class="col-6">
              <div class="field">
                <label for="moduleCredits">Crédits ECTS</label>
                <InputNumber id="moduleCredits" v-model="moduleForm.credits" :min="0" :max="30" />
              </div>
            </div>
            <div class="col-6">
              <div class="field">
                <label for="moduleColor">Couleur</label>
                <div class="flex align-items-center gap-2">
                  <input type="color" id="moduleColor" v-model="moduleForm.color" style="width: 40px; height: 36px; border: none; cursor: pointer; border-radius: 6px;" />
                  <InputText v-model="moduleForm.color" placeholder="#3B82F6" style="flex: 1" />
                </div>
              </div>
            </div>
          </div>
          <div class="field">
            <label for="moduleResponsable">Chef de module</label>
            <Dropdown 
              id="moduleResponsable" 
              v-model="moduleForm.responsable" 
              :options="teachers" 
              optionLabel="name" 
              optionValue="name" 
              placeholder="Sélectionner un enseignant" 
              filter 
              showClear 
              class="w-full"
            />
          </div>
        </div>
        
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" @click="showCreateModuleDialog = false" class="p-button-text" />
          <Button :label="moduleForm.id ? 'Enregistrer' : 'Créer'" icon="pi pi-check" @click="saveModule" :loading="creating" />
        </template>
      </Dialog>

      <Toast />
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import modulesService from '@/service/modulesService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import { getSITeachers } from '@/service/academicKpiService'

const toast = useToast()

const modules = ref([])
const modulesLoading = ref(false)
const showCreateModuleDialog = ref(false)
const creating = ref(false)
const moduleSearchQuery = ref('')
const teachers = ref([])

const moduleForm = ref({
  id: null,
  code: '',
  number: '',
  title: '',
  credits: null,
  color: '#3B82F6',
  responsable: ''
})

const filteredModules = computed(() => {
  if (!moduleSearchQuery.value) return modules.value
  const query = moduleSearchQuery.value.toLowerCase()
  return modules.value.filter(m =>
    (m.title || '').toLowerCase().includes(query) ||
    (m.number || '').toLowerCase().includes(query) ||
    (m.responsable || '').toLowerCase().includes(query)
  )
})

async function loadModules() {
  modulesLoading.value = true
  try {
    const allModules = await modulesService.getAllModules()
    modules.value = (allModules || []).sort((a, b) => {
      const numA = a.number || ''
      const numB = b.number || ''
      return numA.localeCompare(numB, undefined, { numeric: true })
    })
  } catch (error) {
    console.error('Erreur lors du chargement des modules:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les modules' })
  } finally {
    modulesLoading.value = false
  }
}

async function saveModule() {
  if (!moduleForm.value.title) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Le titre est obligatoire' })
    return
  }

  // Auto-générer le code si vide (à partir du numéro ou du titre + suffixe unique)
  if (!moduleForm.value.code && !moduleForm.value.id) {
    const base = moduleForm.value.number || moduleForm.value.title
    const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    const suffix = Date.now().toString(36).slice(-4)
    moduleForm.value.code = `${slug}_${suffix}`
  }

  if (!moduleForm.value.code) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Le code est obligatoire' })
    return
  }

  creating.value = true
  try {
    const payload = {
      code: moduleForm.value.code,
      number: moduleForm.value.number || null,
      title: moduleForm.value.title,
      color: moduleForm.value.color || null,
      credits: moduleForm.value.credits || null,
      responsable: moduleForm.value.responsable || null
    }

    console.log('[ModuleAdmin] Payload:', JSON.stringify(payload))
    console.log('[ModuleAdmin] moduleForm.id:', moduleForm.value.id)

    if (moduleForm.value.id) {
      await modulesService.updateModule(moduleForm.value.id, payload)
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Module mis à jour' })
    } else {
      await modulesService.createModule(payload)
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Module créé avec succès' })
    }
    showCreateModuleDialog.value = false
    resetForm()
    await loadModules()
  } catch (error) {
    console.error('Erreur sauvegarde module:', error)
    const detail = error?.code === '23505'
      ? `Le code "${moduleForm.value.code}" existe déjà. Veuillez en choisir un autre.`
      : (error?.message || 'Impossible de sauvegarder le module')
    toast.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 })
  } finally {
    creating.value = false
  }
}

function resetForm() {
  moduleForm.value = { id: null, code: '', number: '', title: '', credits: null, color: '#3B82F6', responsable: '' }
}

function editModule(module) {
  moduleForm.value = {
    id: module.id,
    code: module.code || '',
    number: module.number || '',
    title: module.title || '',
    credits: module.credits || null,
    color: module.color || '#3B82F6',
    responsable: module.responsable || ''
  }
  showCreateModuleDialog.value = true
}

function duplicateModule(module) {
  moduleForm.value = {
    id: null,
    code: '',
    number: '',
    title: (module.title || '') + ' (Copie)',
    credits: module.credits || null,
    color: module.color || '#3B82F6',
    responsable: module.responsable || ''
  }
  showCreateModuleDialog.value = true
}

async function exportModules() {
  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Modules')

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    const border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }

    ws.columns = [
      { header: 'N° Module', key: 'number', width: 15 },
      { header: 'Titre', key: 'title', width: 45 },
      { header: 'Crédits ECTS', key: 'credits', width: 14 },
      { header: 'Chef de module', key: 'responsable', width: 30 }
    ]

    const headerRow = ws.getRow(1)
    headerRow.eachCell(cell => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = border
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    headerRow.height = 28

    modules.value.forEach((m, i) => {
      const row = ws.addRow({
        number: m.number || '',
        title: m.title || '',
        credits: m.credits || '',
        responsable: m.responsable || ''
      })
      const stripeFill = i % 2 === 0
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      row.eachCell(cell => {
        cell.border = border
        cell.fill = stripeFill
        cell.alignment = { vertical: 'middle' }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `modules-export-${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    toast.add({ severity: 'success', summary: 'Export réussi', detail: `${modules.value.length} modules exportés` })
  } catch (error) {
    console.error('Erreur export:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'exporter les modules' })
  }
}

async function loadTeachers() {
  try {
    const loaded = await getSITeachers()
    teachers.value = (loaded || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } catch (err) {
    console.error('Erreur chargement enseignants:', err)
  }
}

onMounted(async () => {
  await Promise.all([loadModules(), loadTeachers()])
})
</script>

<style scoped>
.module-admin-page {
  padding: 2rem;
}

.toolbar-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.table-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.4;
}
</style>
