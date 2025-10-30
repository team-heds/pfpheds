<template>
  <AdminLayout>
    <div class="assignment-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-share-alt text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Attribution des Places</h1>
              <p class="text-600 m-0 mt-1">Système d'attribution automatique et manuelle des stages</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-undo" label="Annuler tout" severity="danger" outlined @click="cancelAll" />
            <Button icon="pi pi-bolt" label="Attribution Auto" severity="warning" @click="autoAssign" />
            <Button icon="pi pi-save" label="Valider" severity="success" @click="validateAssignments" />
          </div>
        </div>
      </div>

      <!-- Progression -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between mb-3">
          <span class="text-lg font-semibold">Progression de l'attribution</span>
          <span class="text-lg font-bold text-primary">{{ progressPercent }}%</span>
        </div>
        <ProgressBar :value="progressPercent" :showValue="false" />
        <div class="flex justify-content-between mt-2 text-sm text-600">
          <span>{{ stats.assigned }} étudiants assignés</span>
          <span>{{ stats.pending }} en attente</span>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Étudiants Total</div>
            <div class="text-2xl font-bold text-900">{{ stats.total }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Assignés</div>
            <div class="text-2xl font-bold text-green-500">{{ stats.assigned }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">En attente</div>
            <div class="text-2xl font-bold text-orange-500">{{ stats.pending }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Places disponibles</div>
            <div class="text-2xl font-bold text-blue-500">{{ stats.availablePlaces }}</div>
          </div>
        </div>
      </div>

      <!-- Split Panel -->
      <div class="grid">
        <!-- Étudiants non assignés -->
        <div class="col-12 lg:col-6">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center justify-content-between mb-3">
              <h3 class="text-xl font-bold text-900 m-0">Étudiants non assignés</h3>
              <Tag :value="unassignedStudents.length" severity="warning" />
            </div>
            <InputText v-model="searchUnassigned" placeholder="Rechercher..." class="w-full mb-3" />
            <div class="assignment-list">
              <div 
                v-for="student in filteredUnassigned" 
                :key="student.id"
                class="student-card p-3 mb-2 border-round cursor-pointer hover:surface-hover"
                @click="selectStudent(student)"
              >
                <div class="flex align-items-center justify-content-between">
                  <div class="flex align-items-center gap-2">
                    <Avatar :label="student.nom.charAt(0)" shape="circle" />
                    <div>
                      <div class="font-semibold">{{ student.nom }} {{ student.prenom }}</div>
                      <div class="text-sm text-600">{{ student.classe }}</div>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <Tag v-if="student.choix1" :value="`1: ${student.choix1}`" severity="success" class="text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Places disponibles -->
        <div class="col-12 lg:col-6">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center justify-content-between mb-3">
              <h3 class="text-xl font-bold text-900 m-0">Places disponibles</h3>
              <Tag :value="availablePlaces.length" severity="info" />
            </div>
            <InputText v-model="searchPlaces" placeholder="Rechercher institution..." class="w-full mb-3" />
            <div class="assignment-list">
              <div 
                v-for="place in filteredPlaces" 
                :key="place.id"
                class="place-card p-3 mb-2 border-round cursor-pointer hover:surface-hover"
                @click="assignToPlace(place)"
              >
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <div class="font-semibold">{{ place.institution }}</div>
                    <div class="text-sm text-600">{{ place.service }}</div>
                  </div>
                  <div class="flex flex-column align-items-end gap-1">
                    <Tag :value="`${place.disponibles} places`" severity="success" />
                    <Tag :value="place.typePFP" severity="info" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignations récentes -->
      <div class="surface-card p-4 border-round shadow-2 mt-4">
        <h3 class="text-xl font-bold text-900 mb-3">Assignations en cours</h3>
        <DataTable :value="recentAssignments" responsiveLayout="scroll">
          <template #empty>
            <div class="text-center p-3 text-600">Aucune assignation récente</div>
          </template>
          <Column field="etudiant" header="Étudiant"></Column>
          <Column field="institution" header="Institution"></Column>
          <Column field="priorite" header="Priorité">
            <template #body="slotProps">
              <Tag :value="`Choix ${slotProps.data.priorite}`" :severity="getPrioritySeverity(slotProps.data.priorite)" />
            </template>
          </Column>
          <Column field="timestamp" header="Date/Heure"></Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-times" class="p-button-text p-button-sm" severity="danger" @click="removeAssignment(slotProps.data)" />
            </template>
          </Column>
        </DataTable>
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
import Avatar from 'primevue/avatar'
import ProgressBar from 'primevue/progressbar'

const searchUnassigned = ref('')
const searchPlaces = ref('')
const selectedStudent = ref(null)
const unassignedStudents = ref([])
const availablePlaces = ref([])
const recentAssignments = ref([])

const stats = ref({
  total: 0,
  assigned: 0,
  pending: 0,
  availablePlaces: 0
})

const progressPercent = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.assigned / stats.value.total) * 100)
})

const filteredUnassigned = computed(() => {
  if (!searchUnassigned.value) return unassignedStudents.value
  return unassignedStudents.value.filter(s => 
    `${s.nom} ${s.prenom}`.toLowerCase().includes(searchUnassigned.value.toLowerCase())
  )
})

const filteredPlaces = computed(() => {
  if (!searchPlaces.value) return availablePlaces.value
  return availablePlaces.value.filter(p => 
    p.institution.toLowerCase().includes(searchPlaces.value.toLowerCase())
  )
})

const getPrioritySeverity = (priorite) => {
  return priorite === 1 ? 'success' : priorite === 2 ? 'info' : 'warning'
}

const selectStudent = (student) => {
  selectedStudent.value = student
}

const assignToPlace = (place) => {
  if (!selectedStudent.value) {
    alert('Sélectionnez d\'abord un étudiant')
    return
  }
  // Logic to assign
  console.log('Assign', selectedStudent.value, 'to', place)
}

const autoAssign = () => {
  console.log('Auto assign')
}

const validateAssignments = () => {
  console.log('Validate all assignments')
}

const cancelAll = () => {
  console.log('Cancel all')
}

const removeAssignment = (assignment) => {
  console.log('Remove assignment', assignment)
}

onMounted(() => {
  // Load data
})
</script>

<style scoped>
.assignment-page {
  min-height: calc(100vh - 100px);
}

.assignment-list {
  max-height: 500px;
  overflow-y: auto;
}

.student-card, .place-card {
  border: 1px solid var(--surface-border);
  transition: all 0.2s;
}

.student-card:hover, .place-card:hover {
  border-color: var(--primary-color);
}
</style>
