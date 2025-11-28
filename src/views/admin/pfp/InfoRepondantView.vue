<template>
  <AdminLayout>
    <div class="info-repondant-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-info-circle text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Informations Répondants</h1>
              <p class="text-600 m-0 mt-1">Vue détaillée des praticiens formateurs HES</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-print" label="Imprimer" outlined />
            <Button icon="pi pi-download" label="Exporter" outlined />
          </div>
        </div>
      </div>

      <!-- Recherche -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex gap-3 align-items-end">
          <div class="flex-1">
            <label class="block mb-2 font-semibold">Rechercher un répondant</label>
            <InputText v-model="searchQuery" placeholder="Nom, prénom, institution..." class="w-full" />
          </div>
          <Button icon="pi pi-search" label="Rechercher" @click="searchRepondant" />
        </div>
      </div>

      <!-- Résultats de recherche -->
      <div v-if="searchResults.length > 0" class="surface-card p-4 border-round shadow-2 mb-4">
        <h3 class="text-lg font-bold mb-3">Résultats</h3>
        <div class="grid">
          <div v-for="repondant in searchResults" :key="repondant.id" class="col-12 md:col-6">
            <div class="surface-border border-1 p-3 border-round cursor-pointer hover:surface-hover" @click="selectRepondant(repondant)">
              <div class="flex align-items-center gap-2">
                <Avatar :label="repondant.nom.charAt(0)" size="large" shape="circle" />
                <div class="flex-1">
                  <div class="font-semibold">{{ repondant.nom }} {{ repondant.prenom }}</div>
                  <div class="text-sm text-600">{{ repondant.institution }}</div>
                </div>
                <i class="pi pi-chevron-right text-600"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Détails Répondant -->
      <div v-if="selectedRepondant" class="surface-card p-4 border-round shadow-2">
        <div class="flex align-items-start justify-content-between mb-4">
          <div class="flex align-items-center gap-3">
            <Avatar :label="selectedRepondant.nom.charAt(0)" size="xlarge" shape="circle" class="bg-primary" />
            <div>
              <h2 class="text-2xl font-bold text-900 m-0">{{ selectedRepondant.nom }} {{ selectedRepondant.prenom }}</h2>
              <Tag :value="selectedRepondant.filiere" class="mt-2" />
            </div>
          </div>
          <Button icon="pi pi-pencil" label="Modifier" severity="success" />
        </div>

        <Divider />

        <div class="grid">
          <!-- Informations générales -->
          <div class="col-12 md:col-6">
            <h3 class="text-lg font-bold mb-3">Informations Générales</h3>
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-envelope text-600"></i>
                <span>{{ selectedRepondant.email }}</span>
              </div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-phone text-600"></i>
                <span>{{ selectedRepondant.telephone }}</span>
              </div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-building text-600"></i>
                <span>{{ selectedRepondant.institution }}</span>
              </div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-graduation-cap text-600"></i>
                <span>{{ selectedRepondant.specialite }}</span>
              </div>
            </div>
          </div>

          <!-- Statistiques -->
          <div class="col-12 md:col-6">
            <h3 class="text-lg font-bold mb-3">Statistiques</h3>
            <div class="grid">
              <div class="col-6">
                <div class="surface-100 p-3 border-round">
                  <div class="text-600 text-sm">Étudiants encadrés</div>
                  <div class="text-2xl font-bold text-primary">{{ selectedRepondant.nbEtudiants }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="surface-100 p-3 border-round">
                  <div class="text-600 text-sm">Années d'expérience</div>
                  <div class="text-2xl font-bold text-primary">{{ selectedRepondant.experience }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="surface-100 p-3 border-round">
                  <div class="text-600 text-sm">PFP actifs</div>
                  <div class="text-2xl font-bold text-green-500">{{ selectedRepondant.pfpActifs }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="surface-100 p-3 border-round">
                  <div class="text-600 text-sm">Note moyenne</div>
                  <div class="text-2xl font-bold text-orange-500">{{ selectedRepondant.note }}/5</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <!-- Étudiants encadrés -->
        <div class="col-12">
          <h3 class="text-lg font-bold mb-3">Étudiants Encadrés</h3>
          <DataTable :value="selectedRepondant.etudiants" responsiveLayout="scroll">
            <template #empty>
              <div class="text-center p-3 text-600">Aucun étudiant encadré actuellement</div>
            </template>
            <Column field="nom" header="Nom"></Column>
            <Column field="prenom" header="Prénom"></Column>
            <Column field="typePFP" header="Type PFP">
              <template #body="slotProps">
                <Tag :value="slotProps.data.typePFP" />
              </template>
            </Column>
            <Column field="periode" header="Période"></Column>
            <Column field="status" header="Statut">
              <template #body="slotProps">
                <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
              </template>
            </Column>
          </DataTable>
        </div>

        <Divider />

        <!-- Commentaires & Notes -->
        <div class="col-12">
          <h3 class="text-lg font-bold mb-3">Commentaires</h3>
          <Textarea v-model="comments" rows="4" class="w-full" placeholder="Ajouter un commentaire..." />
          <Button label="Enregistrer" icon="pi pi-save" class="mt-2" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="surface-card p-6 border-round shadow-2 text-center">
        <i class="pi pi-search text-6xl text-400 mb-4"></i>
        <h3 class="text-xl text-600 m-0">Recherchez un répondant pour afficher ses informations</h3>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Textarea from 'primevue/textarea'

const searchQuery = ref('')
const searchResults = ref([])
const selectedRepondant = ref(null)
const comments = ref('')

const searchRepondant = () => {
  console.log('Search:', searchQuery.value)
  // Mock search results
  searchResults.value = []
}

const selectRepondant = (repondant) => {
  selectedRepondant.value = {
    ...repondant,
    experience: 8,
    pfpActifs: 3,
    note: 4.5,
    etudiants: []
  }
}

const getStatusSeverity = (status) => {
  const severities = {
    'En cours': 'info',
    'Terminé': 'success',
    'Planifié': 'warning'
  }
  return severities[status] || 'secondary'
}

onMounted(() => {
  // Load data
})
</script>

<style scoped>
.info-repondant-page {
  min-height: calc(100vh - 100px);
}
</style>
