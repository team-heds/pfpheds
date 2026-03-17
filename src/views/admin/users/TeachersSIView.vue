<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Enseignants Soins Infirmiers" 
        subtitle="Liste des enseignants SI" 
        icon="pi pi-users" 
      />
    </template>

    <div class="teachers-page">
      <!-- Mode liste -->
      <template v-if="!selectedTeacher">
        <!-- Toolbar -->
        <div class="toolbar-card">
          <div class="flex justify-content-between align-items-center">
            <div class="flex gap-2 align-items-center">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="search" placeholder="Rechercher un enseignant..." style="width: 320px" />
              </span>
              <Button icon="pi pi-times" severity="secondary" size="small" @click="search = ''" v-tooltip.top="'Effacer'" />
            </div>
            <div class="flex gap-2 align-items-center">
              <Tag :value="`${filteredTeachers.length} / ${teachers.length} enseignants`" severity="info" />
              <Button label="Exporter" icon="pi pi-download" severity="secondary" size="small" @click="exportTeachers" />
            </div>
          </div>
        </div>

        <!-- Tableau -->
        <div class="table-card">
          <DataTable 
            :value="filteredTeachers" 
            :loading="loading" 
            paginator 
            :rows="15" 
            dataKey="id"
            stripedRows
            responsiveLayout="scroll"
          >
            <template #empty>
              <div class="empty-state">
                <i class="pi pi-inbox"></i>
                <p>Aucun enseignant trouvé</p>
              </div>
            </template>

            <Column header="Enseignant" sortable sortField="name">
              <template #body="{ data }">
                <div class="flex align-items-center gap-3">
                  <div class="teacher-avatar">
                    <i class="pi pi-user"></i>
                  </div>
                  <div>
                    <div class="font-bold">{{ data.name }}</div>
                    <div class="text-sm text-500">{{ data.email || '—' }}</div>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="email" header="Email" sortable>
              <template #body="{ data }">
                <a v-if="data.email" :href="`mailto:${data.email}`" class="email-link">{{ data.email }}</a>
                <span v-else class="text-500">—</span>
              </template>
            </Column>

            <Column header="Actions" style="width: 100px">
              <template #body="{ data }">
                <Button 
                  icon="pi pi-eye" 
                  severity="info" 
                  size="small" 
                  @click="viewTeacher(data)" 
                  v-tooltip.top="'Voir le profil'"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </template>

      <!-- Mode profil individuel -->
      <template v-else>
        <div class="profile-back">
          <Button label="Retour à la liste" icon="pi pi-arrow-left" severity="secondary" size="small" @click="selectedTeacher = null" />
        </div>

        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar">
              <i class="pi pi-user"></i>
            </div>
            <div class="profile-identity">
              <h2>{{ selectedTeacher.name }}</h2>
              <a v-if="selectedTeacher.email" :href="`mailto:${selectedTeacher.email}`" class="email-link">{{ selectedTeacher.email }}</a>
              <span v-else class="text-500">Pas d'email</span>
            </div>
          </div>

          <div class="profile-details">
            <div class="detail-section">
              <h3><i class="pi pi-id-card"></i> Informations</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Identifiant</span>
                  <span class="detail-value">{{ selectedTeacher.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Nom complet</span>
                  <span class="detail-value">{{ selectedTeacher.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ selectedTeacher.email || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Rôle</span>
                  <Tag value="Enseignant SI" severity="success" />
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3><i class="pi pi-book"></i> Modules assignés</h3>
              <div v-if="teacherModules.length > 0" class="modules-list">
                <div v-for="mod in teacherModules" :key="mod.id" class="module-item">
                  <div class="module-color-bar" :style="{ background: mod.color || '#94a3b8' }"></div>
                  <div class="module-info">
                    <span class="font-bold">{{ mod.number || '—' }}</span>
                    <span class="text-500">{{ mod.title }}</span>
                  </div>
                  <Tag v-if="mod.credits" :value="`${mod.credits} ECTS`" severity="success" />
                </div>
              </div>
              <div v-else class="text-500" style="padding: 1rem 0;">Aucun module assigné comme responsable</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getSITeachers } from '@/service/academicKpiService'
import modulesService from '@/service/modulesService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'

const toast = useToast()
const loading = ref(false)
const search = ref('')
const teachers = ref([])
const allModules = ref([])
const selectedTeacher = ref(null)

const filteredTeachers = computed(() => {
  if (!search.value) return teachers.value
  const term = search.value.toLowerCase()
  return teachers.value.filter(t =>
    (t.name || '').toLowerCase().includes(term) ||
    (t.email || '').toLowerCase().includes(term)
  )
})

const teacherModules = computed(() => {
  if (!selectedTeacher.value) return []
  const name = selectedTeacher.value.name
  return allModules.value.filter(m => m.responsable === name)
})

function viewTeacher(teacher) {
  selectedTeacher.value = teacher
}

async function exportTeachers() {
  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const ws = workbook.addWorksheet('Enseignants SI')

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    const border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }

    ws.columns = [
      { header: 'Nom', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 35 }
    ]

    const headerRow = ws.getRow(1)
    headerRow.eachCell(cell => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.border = border
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    headerRow.height = 28

    teachers.value.forEach((t, i) => {
      const row = ws.addRow({ name: t.name || '', email: t.email || '' })
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
    link.download = `enseignants-si-${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    toast.add({ severity: 'success', summary: 'Export réussi', detail: `${teachers.value.length} enseignants exportés` })
  } catch (error) {
    console.error('Erreur export:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'exporter' })
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [loaded, mods] = await Promise.all([
      getSITeachers(),
      modulesService.getAllModules()
    ])
    teachers.value = (loaded || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    allModules.value = mods || []
  } catch (err) {
    console.error('Erreur chargement:', err)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les enseignants' })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.teachers-page {
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

.teacher-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.teacher-avatar i {
  color: white;
  font-size: 1rem;
}

.email-link {
  color: var(--primary-color);
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

/* ====== PROFIL ====== */
.profile-back {
  margin-bottom: 1.5rem;
}

.profile-card {
  background: var(--surface-card);
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, var(--primary-color), #1e3a5f);
  color: white;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-avatar i {
  font-size: 2rem;
  color: white;
}

.profile-identity h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
}

.profile-identity .email-link {
  color: rgba(255,255,255,0.85);
}

.profile-details {
  padding: 2rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--text-color);
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 0.95rem;
  color: var(--text-color);
  font-weight: 500;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.module-item:hover {
  background: var(--surface-hover);
}

.module-color-bar {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}

.module-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
</style>
