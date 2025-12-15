<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        :title="module ? module.title : 'Gestion du module'" 
        :subtitle="`Module ${module?.number || ''} - Année ${module?.year || ''}`"
        icon="pi pi-cog"
      >
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin/dashboard-rm" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300"></i>
            <span class="text-900">Gestion du module</span>
          </div>
        </template>
      </PageHeader>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Chargement du module...</p>
    </div>

    <!-- Permission refusée -->
    <div v-else-if="!canEdit" class="permission-denied">
      <Card>
        <template #content>
          <div class="text-center p-5">
            <i class="pi pi-lock text-6xl text-red-500 mb-3"></i>
            <h2>Accès refusé</h2>
            <p class="text-600">{{ permissionError }}</p>
            <Button label="Retour au dashboard" icon="pi pi-arrow-left" @click="$router.push('/admin/dashboard-rm')" class="mt-3" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Contenu principal -->
    <div v-else class="module-manage-container">
      
      <!-- Onglets de gestion -->
      <TabView>
        
        <!-- Onglet: Informations générales -->
        <TabPanel header="Informations générales">
          <Card>
            <template #content>
              <form @submit.prevent="saveModule" class="p-fluid">
                <div class="grid">
                  <!-- Numéro du module -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="number">Numéro du module *</label>
                      <InputText 
                        id="number" 
                        v-model="moduleForm.number" 
                        placeholder="Ex: M1.1"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Année -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="year">Année *</label>
                      <Dropdown 
                        id="year" 
                        v-model="moduleForm.year" 
                        :options="[1, 2, 3]" 
                        placeholder="Sélectionner l'année"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Titre -->
                  <div class="col-12">
                    <div class="field">
                      <label for="title">Titre du module *</label>
                      <InputText 
                        id="title" 
                        v-model="moduleForm.title" 
                        placeholder="Ex: Anatomie et physiologie humaine"
                      />
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="col-12">
                    <div class="field">
                      <label for="description">Description</label>
                      <Textarea 
                        id="description" 
                        v-model="moduleForm.description" 
                        rows="5"
                        placeholder="Description détaillée du module..."
                      />
                    </div>
                  </div>

                  <!-- Responsable -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="responsable">Responsable</label>
                      <InputText 
                        id="responsable" 
                        v-model="moduleForm.responsable" 
                        placeholder="Nom du responsable"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Email du responsable -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="responsable_email">Email du responsable</label>
                      <InputText 
                        id="responsable_email" 
                        v-model="moduleForm.responsable_email" 
                        type="email"
                        placeholder="email@hevs.ch"
                        :disabled="!isAdmin"
                      />
                      <small class="text-500">L'email détermine qui peut gérer ce module</small>
                    </div>
                  </div>

                  <!-- Crédits ECTS -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="credits">Crédits ECTS</label>
                      <InputNumber 
                        id="credits" 
                        v-model="moduleForm.credits" 
                        :min="0"
                        :max="30"
                      />
                    </div>
                  </div>

                  <!-- Heures de contact -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="heures_contact">Heures de contact</label>
                      <InputNumber 
                        id="heures_contact" 
                        v-model="moduleForm.heures_contact" 
                        :min="0"
                      />
                    </div>
                  </div>

                  <!-- Couleur -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="color">Couleur (planning)</label>
                      <ColorPicker v-model="moduleForm.color" format="hex" />
                    </div>
                  </div>

                  <!-- Code court -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="short_code">Code court</label>
                      <InputText 
                        id="short_code" 
                        v-model="moduleForm.short_code" 
                        placeholder="Ex: ANAT"
                      />
                    </div>
                  </div>

                  <!-- Coordinateur -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="coordinateur">Coordinateur</label>
                      <InputText 
                        id="coordinateur" 
                        v-model="moduleForm.coordinateur" 
                        placeholder="Nom du coordinateur"
                      />
                    </div>
                  </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex justify-content-end gap-2 mt-4">
                  <Button 
                    label="Annuler" 
                    icon="pi pi-times" 
                    severity="secondary" 
                    outlined
                    @click="$router.push('/admin/dashboard-rm')" 
                  />
                  <Button 
                    label="Enregistrer" 
                    icon="pi pi-check" 
                    type="submit"
                    :loading="saving"
                  />
                </div>
              </form>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Enseignants -->
        <TabPanel header="Enseignants">
          <Card>
            <template #content>
              <div class="mb-3">
                <Button 
                  label="Ajouter un enseignant" 
                  icon="pi pi-plus" 
                  @click="showAddTeacherDialog = true"
                />
              </div>

              <DataTable :value="moduleTeachers" responsiveLayout="scroll">
                <Column field="name" header="Nom"></Column>
                <Column field="email" header="Email"></Column>
                <Column field="hours" header="Heures">
                  <template #body="slotProps">
                    {{ slotProps.data.hours }}h
                  </template>
                </Column>
                <Column header="Actions">
                  <template #body="slotProps">
                    <Button 
                      icon="pi pi-trash" 
                      severity="danger" 
                      text 
                      @click="removeTeacher(slotProps.data)"
                    />
                  </template>
                </Column>
                <template #empty>
                  <div class="text-center p-4">
                    <i class="pi pi-users text-4xl text-400 mb-2"></i>
                    <p class="text-600">Aucun enseignant assigné</p>
                  </div>
                </template>
              </DataTable>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Planning -->
        <TabPanel header="Planning">
          <Card>
            <template #content>
              <div class="text-center p-5">
                <i class="pi pi-calendar text-6xl text-primary mb-3"></i>
                <h3>Planning du module</h3>
                <p class="text-600 mb-4">Visualisez et modifiez le planning de votre module</p>
                <Button 
                  label="Voir le planning complet" 
                  icon="pi pi-external-link" 
                  @click="$router.push(`/admin/planning?module=${moduleId}`)"
                />
              </div>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Statistiques -->
        <TabPanel header="Statistiques">
          <div class="grid">
            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-users text-4xl text-primary mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleStats.totalStudents }}</div>
                    <div class="text-600">Étudiants</div>
                  </div>
                </template>
              </Card>
            </div>
            
            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-clock text-4xl text-green-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleForm.heures_contact || 0 }}h</div>
                    <div class="text-600">Heures de contact</div>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-star-fill text-4xl text-orange-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleForm.credits || 0 }}</div>
                    <div class="text-600">Crédits ECTS</div>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-book text-4xl text-purple-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleTeachers.length }}</div>
                    <div class="text-600">Enseignants</div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </TabPanel>

      </TabView>
    </div>

    <!-- Dialog: Ajouter un enseignant -->
    <Dialog v-model:visible="showAddTeacherDialog" header="Ajouter un enseignant" :style="{ width: '450px' }" modal>
      <div class="p-fluid">
        <div class="field">
          <label for="teacher-name">Nom</label>
          <InputText id="teacher-name" v-model="newTeacher.name" />
        </div>
        <div class="field">
          <label for="teacher-email">Email</label>
          <InputText id="teacher-email" v-model="newTeacher.email" type="email" />
        </div>
        <div class="field">
          <label for="teacher-hours">Heures</label>
          <InputNumber id="teacher-hours" v-model="newTeacher.hours" />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" text @click="showAddTeacherDialog = false" />
        <Button label="Ajouter" icon="pi pi-check" @click="addTeacher" />
      </template>
    </Dialog>

  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useModules } from '@/composables/useModules'
import { useModulePermissions } from '@/composables/useModulePermissions'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import ColorPicker from 'primevue/colorpicker'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { modules, loadModules, updateModule: updateModuleInStore } = useModules()
const { canEditModule, isAdmin, getPermissionErrorMessage } = useModulePermissions()

const moduleId = route.params.id
const loading = ref(true)
const saving = ref(false)
const module = ref(null)
const permissionError = ref('')
const canEdit = ref(false)

// Formulaire du module
const moduleForm = ref({
  number: '',
  year: null,
  title: '',
  description: '',
  responsable: '',
  responsable_email: '',
  credits: null,
  heures_contact: null,
  color: '#3B82F6',
  short_code: '',
  coordinateur: ''
})

// Enseignants du module
const moduleTeachers = ref([])
const showAddTeacherDialog = ref(false)
const newTeacher = ref({
  name: '',
  email: '',
  hours: 0
})

// Statistiques
const moduleStats = ref({
  totalStudents: 0,
  totalHours: 0
})

// Charger le module
onMounted(async () => {
  try {
    await loadModules()
    
    // Trouver le module
    module.value = modules.value.find(m => m.id === moduleId)
    
    if (!module.value) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Module non trouvé',
        life: 3000
      })
      router.push('/admin/dashboard-rm')
      return
    }
    
    // Vérifier les permissions
    canEdit.value = canEditModule(module.value)
    
    if (!canEdit.value) {
      permissionError.value = getPermissionErrorMessage('edit')
      loading.value = false
      return
    }
    
    // Remplir le formulaire
    moduleForm.value = {
      number: module.value.number || '',
      year: module.value.year || null,
      title: module.value.title || '',
      description: module.value.description || '',
      responsable: module.value.responsable || '',
      responsable_email: module.value.responsable_email || '',
      credits: module.value.credits || null,
      heures_contact: module.value.heures_contact || null,
      color: module.value.color || '#3B82F6',
      short_code: module.value.short_code || '',
      coordinateur: module.value.coordinateur || ''
    }
    
    // TODO: Charger les enseignants depuis Supabase
    // Pour l'instant, données de démo
    moduleTeachers.value = []
    
  } catch (error) {
    console.error('Erreur chargement module:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le module',
      life: 3000
    })
  } finally {
    loading.value = false
  }
})

// Sauvegarder le module
const saveModule = async () => {
  saving.value = true
  
  try {
    await updateModuleInStore(moduleId, moduleForm.value)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Module mis à jour avec succès',
      life: 3000
    })
    
    // Recharger les modules
    await loadModules()
    
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le module',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// Ajouter un enseignant
const addTeacher = () => {
  if (!newTeacher.value.name || !newTeacher.value.email) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir tous les champs',
      life: 3000
    })
    return
  }
  
  moduleTeachers.value.push({ ...newTeacher.value, id: Date.now() })
  
  newTeacher.value = {
    name: '',
    email: '',
    hours: 0
  }
  
  showAddTeacherDialog.value = false
  
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Enseignant ajouté',
    life: 3000
  })
}

// Retirer un enseignant
const removeTeacher = (teacher) => {
  if (confirm(`Retirer ${teacher.name} de ce module ?`)) {
    moduleTeachers.value = moduleTeachers.value.filter(t => t.id !== teacher.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Enseignant retiré',
      life: 3000
    })
  }
}
</script>

<style scoped>
.module-manage-container {
  padding: 2rem;
}

.loading-container,
.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

:deep(.p-tabview-nav) {
  background: var(--surface-card);
}

:deep(.p-tabview-panels) {
  padding: 1.5rem;
  background: transparent;
}
</style>
