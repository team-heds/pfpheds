<template>
  <AdminLayout>
    <div class="validate-pfp-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-check-circle text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Validation PFP1A</h1>
              <p class="text-600 m-0 mt-1">Validation des pratiques de formation professionnelle 1A</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Rapport" outlined />
            <Button icon="pi pi-envelope" label="Notifier" severity="warning" outlined />
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Total PFP1A</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-clock text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.pending }}</h3>
                <p class="text-600 m-0">En attente</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.validated }}</h3>
                <p class="text-600 m-0">Validés</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-times text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.rejected }}</h3>
                <p class="text-600 m-0">Refusés</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Tous les statuts" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterClasse" :options="classes" placeholder="Toutes les classes" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterInstitution" :options="institutions" optionLabel="nom" placeholder="Institution" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <InputText v-model="searchQuery" placeholder="Rechercher étudiant..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table PFP -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="pfpList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste PFP1A à valider</span>
              <div class="flex gap-2">
                <Button label="Tout valider" icon="pi pi-check" severity="success" outlined @click="validateAll" />
                <Button label="Tout refuser" icon="pi pi-times" severity="danger" outlined @click="rejectAll" />
              </div>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun PFP1A à valider</p>
            </div>
          </template>
          <Column field="etudiant" header="Étudiant" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center gap-2">
                <Avatar :label="slotProps.data.etudiant.charAt(0)" shape="circle" />
                <span class="font-semibold">{{ slotProps.data.etudiant }}</span>
              </div>
            </template>
          </Column>
          <Column field="classe" header="Classe" sortable></Column>
          <Column field="institution" header="Institution" sortable></Column>
          <Column field="dateDebut" header="Date Début" sortable></Column>
          <Column field="dateFin" header="Date Fin" sortable></Column>
          <Column field="duree" header="Durée" sortable>
            <template #body="slotProps">
              <Tag :value="`${slotProps.data.duree} semaines`" />
            </template>
          </Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column field="documents" header="Documents">
            <template #body="slotProps">
              <div class="flex gap-1">
                <i v-if="slotProps.data.hasConvention" class="pi pi-file-check text-green-500"></i>
                <i v-if="slotProps.data.hasRapport" class="pi pi-file-pdf text-red-500"></i>
                <i v-if="slotProps.data.hasEvaluation" class="pi pi-star text-yellow-500"></i>
              </div>
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <div class="flex gap-1">
                <Button 
                  icon="pi pi-eye" 
                  class="p-button-text p-button-sm" 
                  v-tooltip.top="'Voir détails'"
                  @click="viewDetails(slotProps.data)" 
                />
                <Button 
                  icon="pi pi-check" 
                  class="p-button-text p-button-sm" 
                  severity="success"
                  v-tooltip.top="'Valider'"
                  @click="validate(slotProps.data)" 
                />
                <Button 
                  icon="pi pi-times" 
                  class="p-button-text p-button-sm" 
                  severity="danger"
                  v-tooltip.top="'Refuser'"
                  @click="reject(slotProps.data)" 
                />
                <Button 
                  icon="pi pi-comment" 
                  class="p-button-text p-button-sm"
                  v-tooltip.top="'Commentaire'"
                  @click="addComment(slotProps.data)" 
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog Détails -->
      <Dialog v-model:visible="showDetailsDialog" :header="`Détails PFP - ${selectedPFP?.etudiant}`" :style="{ width: '800px' }" modal>
        <div v-if="selectedPFP" class="p-4">
          <div class="grid">
            <div class="col-6">
              <p><strong>Étudiant:</strong> {{ selectedPFP.etudiant }}</p>
              <p><strong>Classe:</strong> {{ selectedPFP.classe }}</p>
              <p><strong>Institution:</strong> {{ selectedPFP.institution }}</p>
            </div>
            <div class="col-6">
              <p><strong>Période:</strong> {{ selectedPFP.dateDebut }} - {{ selectedPFP.dateFin }}</p>
              <p><strong>Durée:</strong> {{ selectedPFP.duree }} semaines</p>
              <p><strong>Statut:</strong> <Tag :value="selectedPFP.status" :severity="getStatusSeverity(selectedPFP.status)" /></p>
            </div>
          </div>
          <Divider />
          <h4>Documents</h4>
          <div class="flex flex-column gap-2">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-file-check"></i>
              <span>Convention de stage</span>
              <Button icon="pi pi-download" text size="small" />
            </div>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-file-pdf"></i>
              <span>Rapport de stage</span>
              <Button icon="pi pi-download" text size="small" />
            </div>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-star"></i>
              <span>Évaluation praticien</span>
              <Button icon="pi pi-download" text size="small" />
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Fermer" @click="showDetailsDialog = false" text />
          <Button label="Valider" @click="validateFromDialog" severity="success" />
        </template>
      </Dialog>

      <!-- Dialog Commentaire -->
      <Dialog v-model:visible="showCommentDialog" header="Ajouter un commentaire" :style="{ width: '500px' }" modal>
        <Textarea v-model="comment" rows="5" class="w-full" placeholder="Votre commentaire..." />
        <template #footer>
          <Button label="Annuler" @click="showCommentDialog = false" text />
          <Button label="Enregistrer" @click="saveComment" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Avatar from 'primevue/avatar'
import Divider from 'primevue/divider'
import Textarea from 'primevue/textarea'

const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref(null)
const filterClasse = ref(null)
const filterInstitution = ref(null)
const showDetailsDialog = ref(false)
const showCommentDialog = ref(false)
const selectedPFP = ref(null)
const comment = ref('')
const pfpList = ref([])

const statusOptions = ref(['En attente', 'Validé', 'Refusé', 'En révision'])
const classes = ref(['BA22', 'BA23', 'BA24'])
const institutions = ref([])

const stats = ref({
  total: 0,
  pending: 0,
  validated: 0,
  rejected: 0
})

const getStatusSeverity = (status) => {
  const severities = {
    'En attente': 'warning',
    'Validé': 'success',
    'Refusé': 'danger',
    'En révision': 'info'
  }
  return severities[status] || 'secondary'
}

const viewDetails = (pfp) => {
  selectedPFP.value = pfp
  showDetailsDialog.value = true
}

const validate = (pfp) => {
  console.log('Validate PFP:', pfp)
}

const reject = (pfp) => {
  console.log('Reject PFP:', pfp)
}

const validateAll = () => {
  console.log('Validate all')
}

const rejectAll = () => {
  console.log('Reject all')
}

const addComment = (pfp) => {
  selectedPFP.value = pfp
  showCommentDialog.value = true
}

const saveComment = () => {
  console.log('Save comment:', comment.value)
  showCommentDialog.value = false
  comment.value = ''
}

const validateFromDialog = () => {
  validate(selectedPFP.value)
  showDetailsDialog.value = false
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.validate-pfp-page {
  min-height: calc(100vh - 100px);
}
</style>
