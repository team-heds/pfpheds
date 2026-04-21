<template>
  <AdminLayout>
    <template #header>
      <PageHeader
        :title="teacher ? teacher.name : 'Profil enseignant SI'"
        subtitle="Détail enseignant et cours assignés"
        icon="pi pi-user"
      />
    </template>

    <div class="teacher-profile-page">
      <div class="top-actions">
        <Button label="Retour à la liste" icon="pi pi-arrow-left" severity="secondary" text @click="goBack" />
      </div>

      <div v-if="loading" class="loading-state">
        <ProgressSpinner />
        <p>Chargement du profil...</p>
      </div>

      <div v-else-if="!teacher" class="empty-state">
        <i class="pi pi-user-minus"></i>
        <p>Enseignant introuvable</p>
      </div>

      <template v-else>
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar"><i class="pi pi-user" /></div>
            <div>
              <h2 class="m-0">{{ teacher.name }}</h2>
              <a v-if="teacher.email" :href="`mailto:${teacher.email}`" class="email-link">{{ teacher.email }}</a>
              <p v-else class="text-500 m-0">Pas d'email</p>
            </div>
          </div>

          <div class="profile-stats">
            <Tag :value="`${responsibleModules.length} modules responsables`" severity="info" />
            <Tag :value="`${teacherCourses.length} cours assignés`" severity="success" />
            <Tag :value="`${teacherHours}h totales`" severity="warning" />
          </div>
        </div>

        <div class="content-grid">
          <div class="content-card">
            <h3><i class="pi pi-book"></i> Modules responsables</h3>
            <div v-if="responsibleModules.length" class="modules-list">
              <div v-for="mod in responsibleModules" :key="mod.id" class="module-item">
                <div>
                  <div class="font-bold">{{ mod.number || '—' }} - {{ mod.title || 'Sans titre' }}</div>
                  <small class="text-500">Code: {{ mod.code || '—' }}</small>
                </div>
                <Tag v-if="mod.credits" :value="`${mod.credits} ECTS`" />
              </div>
            </div>
            <p v-else class="text-500">Aucun module responsable.</p>
          </div>

          <div class="content-card">
            <h3><i class="pi pi-calendar"></i> Cours assignés</h3>
            <DataTable :value="teacherCourses" stripedRows responsiveLayout="scroll" size="small">
              <template #empty>
                <div class="text-500 p-3">Aucun cours assigné</div>
              </template>

              <Column field="moduleNumber" header="Module" />
              <Column field="moduleTitle" header="Titre" />
              <Column field="courseName" header="Cours" />
              <Column field="role" header="Rôle">
                <template #body="{ data }">
                  <Tag
                    :value="data.role"
                    :severity="data.isPostulation ? 'warning' : 'secondary'"
                  />
                </template>
              </Column>
              <Column field="hours" header="Heures">
                <template #body="{ data }">
                  {{ data.hours }}h
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </template>
    </div>

    <Toast />
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/supabase'
import { getSITeachers } from '@/service/academicKpiService'
import modulesService from '@/service/modulesService'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const teachers = ref([])
const allModules = ref([])
const teacherAssignments = ref([])

const teacherId = computed(() => String(route.params.teacherId || ''))

const teacher = computed(() => teachers.value.find(t => String(t.id) === teacherId.value) || null)

const responsibleModules = computed(() => {
  if (!teacher.value) return []
  return allModules.value.filter(m => String(m.responsable || '').trim() === String(teacher.value.name || '').trim())
})

const teacherCourses = computed(() => {
  return teacherAssignments.value
    .map(item => {
      const mod = allModules.value.find(m => String(m.id) === String(item.module_id))
      const role = item.role || 'enseignant'
      const normalizedRole = String(role).toLowerCase()
      const isPostulation = normalizedRole.includes('postulation') || normalizedRole.includes('repourvoir') || normalizedRole.includes('réattribuer')

      return {
        id: item.id,
        moduleNumber: mod?.number || '—',
        moduleTitle: mod?.title || 'Module inconnu',
        courseName: item.course_name || item.course_code || 'Cours principal',
        role,
        isPostulation,
        hours: item.hours || 0
      }
    })
    .sort((a, b) => String(a.moduleNumber).localeCompare(String(b.moduleNumber)))
})

const teacherHours = computed(() => {
  return Math.round(teacherCourses.value.reduce((sum, c) => sum + (Number(c.hours) || 0), 0) * 10) / 10
})

function goBack() {
  router.push({ name: 'TeachersSIView' })
}

async function loadTeacherAssignments() {
  if (!teacherId.value) return

  const { data, error } = await supabase
    .from('course_teachers')
    .select(`
      id,
      teacher_id,
      role,
      hours,
      courses(id, module_id, name, code)
    `)
    .eq('teacher_id', teacherId.value)

  if (error) throw error

  teacherAssignments.value = (data || []).map(row => ({
    id: row.id,
    role: row.role,
    hours: row.hours,
    module_id: row.courses?.module_id,
    course_name: row.courses?.name,
    course_code: row.courses?.code
  }))
}

onMounted(async () => {
  loading.value = true
  try {
    const [siTeachers, modules] = await Promise.all([
      getSITeachers(),
      modulesService.getAllModules()
    ])

    teachers.value = siTeachers || []
    allModules.value = modules || []

    await loadTeacherAssignments()
  } catch (error) {
    console.error('Erreur chargement profil enseignant SI:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le profil enseignant', life: 3500 })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.teacher-profile-page {
  padding: 1.5rem;
}

.top-actions {
  margin-bottom: 1rem;
}

.loading-state,
.empty-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-color-secondary);
}

.profile-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #2563eb, #1e3a8a);
}

.email-link {
  color: var(--primary-color);
  text-decoration: none;
}

.profile-stats {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.content-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.content-card h3 {
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.module-item {
  padding: 0.75rem;
  border-radius: 0.6rem;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

@media (max-width: 960px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
