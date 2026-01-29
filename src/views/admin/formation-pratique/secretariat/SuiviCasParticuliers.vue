<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-exclamation-triangle text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Suivi Cas Particuliers</h1>
              <p class="text-600 m-0 mt-2">Cliquez sur chaque cellule PFP pour ajouter commentaire et couleur</p>
            </div>
          </div>
          
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <InputText 
                v-model="searchTerm" 
                placeholder="Nom ou prénom..." 
                class="w-full md:w-12rem"
              />
            </div>
            
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe :</label>
              <Dropdown 
                v-model="filterClasse" 
                :options="classesList" 
                placeholder="Toutes les classes" 
                class="w-full md:w-10rem"
                showClear
              />
            </div>
            
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Tri :</label>
              <SelectButton 
                v-model="sortOrder" 
                :options="sortOptions" 
                optionLabel="label" 
                optionValue="value" 
              />
            </div>
            
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Affichage :</label>
              <SelectButton 
                v-model="filterDisplay" 
                :options="displayOptions" 
                optionLabel="label" 
                optionValue="value" 
              />
            </div>
          </div>
        </div>
      </div>

      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="filteredCases" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="50">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Cas Particuliers ({{ filteredCases.length }} étudiants)</span>
              <div class="flex gap-2">
                <span class="text-sm">Légende:</span>
                <Tag value="Vert" severity="success" />
                <Tag value="Orange" severity="warning" />
                <Tag value="Rouge" severity="danger" />
                <Tag value="Noir" severity="secondary" />
                <Tag value="Blanc" />
              </div>
            </div>
          </template>
          
          <Column field="etudiant" header="Étudiant" :frozen="true" sortable style="min-width: 200px"></Column>
          <Column field="classe" header="Classe" sortable style="min-width: 100px"></Column>
                 <Column header="Commentaire" style="min-width: 150px">
            <template #body="slotProps">
              <div 
                @click="openInfoDialog(slotProps.data)"
                :style="getInfoStyle(slotProps.data.info_etudiant)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.info_etudiant?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.info_etudiant?.commentaire" class="text-xs">
                  {{ slotProps.data.info_etudiant.commentaire.length > 12 ? slotProps.data.info_etudiant.commentaire.substring(0, 12) + '...' : slotProps.data.info_etudiant.commentaire }}
                </div>
                <span v-else class="text-400">Cliquez pour ajouter...</span>
              </div>
            </template>
          </Column>
          <Column header="PFP1" style="min-width: 100px">
            <template #body="slotProps">
              <div 
                @click="openCellDialog(slotProps.data, 'pfp1')"
                :style="getCellStyle(slotProps.data.pfp1)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.pfp1?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.pfp1?.commentaire" class="text-xs">
                  {{ slotProps.data.pfp1.commentaire.length > 10 ? slotProps.data.pfp1.commentaire.substring(0, 10) + '...' : slotProps.data.pfp1.commentaire }}
                </div>
                <span v-else class="text-400">-</span>
              </div>
            </template>
          </Column>
          
          <Column header="PFP1'" style="min-width: 100px">
            <template #body="slotProps">
              <div 
                @click="openCellDialog(slotProps.data, 'pfp1_prime')"
                :style="getCellStyle(slotProps.data.pfp1_prime)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.pfp1_prime?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.pfp1_prime?.commentaire" class="text-xs">
                  {{ slotProps.data.pfp1_prime.commentaire.length > 10 ? slotProps.data.pfp1_prime.commentaire.substring(0, 10) + '...' : slotProps.data.pfp1_prime.commentaire }}
                </div>
                <span v-else class="text-400">-</span>
              </div>
            </template>
          </Column>
          
          <Column header="PFP2" style="min-width: 100px">
            <template #body="slotProps">
              <div 
                @click="openCellDialog(slotProps.data, 'pfp2')"
                :style="getCellStyle(slotProps.data.pfp2)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.pfp2?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.pfp2?.commentaire" class="text-xs">
                  {{ slotProps.data.pfp2.commentaire.length > 10 ? slotProps.data.pfp2.commentaire.substring(0, 10) + '...' : slotProps.data.pfp2.commentaire }}
                </div>
                <span v-else class="text-400">-</span>
              </div>
            </template>
          </Column>
          
          <Column header="PFP2'" style="min-width: 100px">
            <template #body="slotProps">
              <div 
                @click="openCellDialog(slotProps.data, 'pfp2_prime')"
                :style="getCellStyle(slotProps.data.pfp2_prime)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.pfp2_prime?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.pfp2_prime?.commentaire" class="text-xs">
                  {{ slotProps.data.pfp2_prime.commentaire.length > 10 ? slotProps.data.pfp2_prime.commentaire.substring(0, 10) + '...' : slotProps.data.pfp2_prime.commentaire }}
                </div>
                <span v-else class="text-400">-</span>
              </div>
            </template>
          </Column>
          
          <Column header="PFP3" style="min-width: 100px">
            <template #body="slotProps">
              <div 
                @click="openCellDialog(slotProps.data, 'pfp3')"
                :style="getCellStyle(slotProps.data.pfp3)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.pfp3?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.pfp3?.commentaire" class="text-xs">
                  {{ slotProps.data.pfp3.commentaire.length > 10 ? slotProps.data.pfp3.commentaire.substring(0, 10) + '...' : slotProps.data.pfp3.commentaire }}
                </div>
                <span v-else class="text-400">-</span>
              </div>
            </template>
          </Column>
          
          <Column header="PFP3'" style="min-width: 100px">
            <template #body="slotProps">
              <div 
                @click="openCellDialog(slotProps.data, 'pfp3_prime')"
                :style="getCellStyle(slotProps.data.pfp3_prime)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.pfp3_prime?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.pfp3_prime?.commentaire" class="text-xs">
                  {{ slotProps.data.pfp3_prime.commentaire.length > 10 ? slotProps.data.pfp3_prime.commentaire.substring(0, 10) + '...' : slotProps.data.pfp3_prime.commentaire }}
                </div>
                <span v-else class="text-400">-</span>
              </div>
            </template>
          </Column>
          
          <Column header="PFP4" style="min-width: 100px">
            <template #body="slotProps">
              <div 
                @click="openCellDialog(slotProps.data, 'pfp4')"
                :style="getCellStyle(slotProps.data.pfp4)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.pfp4?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.pfp4?.commentaire" class="text-xs">
                  {{ slotProps.data.pfp4.commentaire.length > 10 ? slotProps.data.pfp4.commentaire.substring(0, 10) + '...' : slotProps.data.pfp4.commentaire }}
                </div>
                <span v-else class="text-400">-</span>
              </div>
            </template>
          </Column>
          
          <Column header="PFP4'" style="min-width: 100px">
            <template #body="slotProps">
              <div 
                @click="openCellDialog(slotProps.data, 'pfp4_prime')"
                :style="getCellStyle(slotProps.data.pfp4_prime)"
                class="cursor-pointer p-2 border-round text-center"
                :title="slotProps.data.pfp4_prime?.commentaire || 'Cliquez pour éditer'"
              >
                <div v-if="slotProps.data.pfp4_prime?.commentaire" class="text-xs">
                  {{ slotProps.data.pfp4_prime.commentaire.length > 10 ? slotProps.data.pfp4_prime.commentaire.substring(0, 10) + '...' : slotProps.data.pfp4_prime.commentaire }}
                </div>
                <span v-else class="text-400">-</span>
              </div>
            </template>
          </Column>
          
   
        </DataTable>
      </div>
    </div>

    <!-- Dialog pour éditer une cellule PFP -->
    <Dialog v-model:visible="showCellDialog" :header="dialogTitle" :modal="true" :style="{ width: '500px' }">
      <div class="flex flex-column gap-3 p-3">
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Couleur :</label>
          <div class="flex gap-2 flex-wrap">
            <Button 
              v-for="color in colorOptions" 
              :key="color.value"
              :label="color.label"
              :class="{ 'p-button-outlined': editingCell?.couleur !== color.value }"
              :severity="color.severity"
              @click="editingCell.couleur = color.value"
              size="small"
            />
          </div>
        </div>
        
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Commentaire :</label>
          <Textarea 
            v-model="editingCell.commentaire" 
            rows="5" 
            class="w-full"
            placeholder="Ajoutez un commentaire..."
          />
        </div>
        
        <div class="flex justify-content-end gap-2 mt-3">
          <Button label="Annuler" severity="secondary" @click="closeCellDialog" />
          <Button label="Enregistrer" @click="saveCellData" />
        </div>
      </div>
    </Dialog>

    <!-- Dialog pour éditer les infos étudiant -->
    <Dialog v-model:visible="showInfoDialog" :header="infoDialogTitle" :modal="true" :style="{ width: '500px' }">
      <div class="flex flex-column gap-3 p-3">
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Commentaire sur l'étudiant :</label>
          <Textarea 
            v-model="editingInfo.commentaire" 
            rows="6" 
            class="w-full"
            placeholder="Ajoutez des informations sur cet étudiant..."
          />
        </div>
        
        <div class="flex justify-content-end gap-2 mt-3">
          <Button label="Annuler" severity="secondary" @click="closeInfoDialog" />
          <Button label="Enregistrer" @click="saveInfoData" />
        </div>
      </div>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import SelectButton from 'primevue/selectbutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'

const loading = ref(false)
const cases = ref([])
const filterDisplay = ref('with_comments')
const filterClasse = ref(null)
const sortOrder = ref('alpha')
const searchTerm = ref('')
const classesList = ref(['BA24', 'BA25', 'BA26', 'MA27'])

const showCellDialog = ref(false)
const showInfoDialog = ref(false)
const editingCell = ref(null)
const editingInfo = ref(null)
const editingStudent = ref(null)
const editingField = ref(null)
const dialogTitle = ref('')
const infoDialogTitle = ref('')

const displayOptions = ref([
  { label: 'Tous', value: 'all' },
  { label: 'Avec suivi particulier', value: 'with_comments' },
  { label: 'Sans', value: 'no_comments' }
])

const sortOptions = ref([
  { label: 'Alphabétique', value: 'alpha' },
  { label: 'Classe', value: 'classe' }
])

const colorOptions = ref([
  { label: 'Blanc', value: 'blanc', severity: 'info' },
  { label: 'Vert', value: 'vert', severity: 'success' },
  { label: 'Orange', value: 'orange', severity: 'warning' },
  { label: 'Rouge', value: 'rouge', severity: 'danger' },
  { label: 'Noir', value: 'noir', severity: 'secondary' }
])

const filteredCases = computed(() => {
  let list = [...cases.value]
  
  // Filtre par recherche (nom ou prénom)
  if (searchTerm.value && searchTerm.value.trim()) {
    const searchLower = searchTerm.value.toLowerCase().trim()
    list = list.filter(c => 
      c.etudiant.toLowerCase().includes(searchLower)
    )
  }
  
  // Filtre par classe
  if (filterClasse.value) {
    list = list.filter(c => c.classe === filterClasse.value)
  }
  
  // Filtre par affichage (avec/sans commentaires)
  if (filterDisplay.value === 'with_comments') {
    list = list.filter(c => hasComments(c))
  } else if (filterDisplay.value === 'no_comments') {
    list = list.filter(c => !hasComments(c))
  }
  
  // Tri
  if (sortOrder.value === 'alpha') {
    list.sort((a, b) => a.etudiant.localeCompare(b.etudiant))
  } else if (sortOrder.value === 'classe') {
    list.sort((a, b) => {
      if (a.classe === b.classe) {
        return a.etudiant.localeCompare(b.etudiant)
      }
      return a.classe.localeCompare(b.classe)
    })
  }
  
  return list
})

const hasComments = (student) => {
  const fields = ['pfp1', 'pfp1_prime', 'pfp2', 'pfp2_prime', 'pfp3', 'pfp3_prime', 'pfp4', 'pfp4_prime']
  return fields.some(field => student[field]?.commentaire)
}

const getCellStyle = (cellData) => {
  if (!cellData) return { backgroundColor: '#ffffff', border: '1px solid #dee2e6' }
  
  const colors = {
    'vert': '#28a745',
    'orange': '#fd7e14', 
    'rouge': '#dc3545',
    'noir': '#343a40',
    'blanc': '#ffffff'
  }
  
  const textColors = {
    'vert': '#ffffff',
    'orange': '#ffffff',
    'rouge': '#ffffff', 
    'noir': '#ffffff',
    'blanc': '#000000'
  }
  
  return {
    backgroundColor: colors[cellData.couleur] || '#ffffff',
    color: textColors[cellData.couleur] || '#000000',
    border: '1px solid #dee2e6',
    transition: 'all 0.3s',
    fontWeight: '600'
  }
}


const openCellDialog = (student, field) => {
  editingStudent.value = student
  editingField.value = field
  
  // Initialiser ou récupérer les données de la cellule
  if (!student[field]) {
    student[field] = { couleur: 'blanc', commentaire: '' }
  }
  
  editingCell.value = { ...student[field] }
  
  const fieldLabels = {
    'pfp1': 'PFP1',
    'pfp1_prime': "PFP1'",
    'pfp2': 'PFP2',
    'pfp2_prime': "PFP2'",
    'pfp3': 'PFP3',
    'pfp3_prime': "PFP3'",
    'pfp4': 'PFP4',
    'pfp4_prime': "PFP4'"
  }
  
  dialogTitle.value = `${student.etudiant} - ${fieldLabels[field]}`
  showCellDialog.value = true
}

const closeCellDialog = () => {
  showCellDialog.value = false
  editingCell.value = null
  editingStudent.value = null
  editingField.value = null
}

const openInfoDialog = (student) => {
  editingStudent.value = student
  
  // Initialiser ou récupérer les données d'info étudiant
  if (!student.info_etudiant) {
    student.info_etudiant = { commentaire: '' }
  }
  
  editingInfo.value = { ...student.info_etudiant }
  infoDialogTitle.value = `Informations - ${student.etudiant}`
  showInfoDialog.value = true
}

const closeInfoDialog = () => {
  showInfoDialog.value = false
  editingInfo.value = null
  editingStudent.value = null
}

const saveInfoData = async () => {
  if (!editingStudent.value || !editingInfo.value) {
    closeInfoDialog()
    return
  }

  try {
    const result = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: editingStudent.value.user_id,
        pfp_field: 'info_etudiant',
        couleur: 'blanc',
        commentaire: editingInfo.value.commentaire || null,
        visible: true
      }, {
        onConflict: 'user_id,pfp_field'
      })
      .select()

    if (result.error) {
      throw result.error
    }

    // Mettre à jour localement
    editingStudent.value.info_etudiant = { ...editingInfo.value }
    
  } catch (e) {
    console.error('Erreur saveInfoData:', e)
    alert('Erreur lors de la sauvegarde: ' + e.message)
  }
  
  closeInfoDialog()
}

const getInfoStyle = (infoData) => {
  if (!infoData || !infoData.commentaire) return { backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }
  
  return {
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196f3',
    color: '#1565c0',
    transition: 'all 0.3s'
  }
}

const saveCellData = async () => {
  if (!editingStudent.value || !editingField.value || !editingCell.value) {
    closeCellDialog()
    return
  }

  const cellData = {
    couleur: editingCell.value.couleur || 'blanc',
    commentaire: editingCell.value.commentaire || ''
  }

  try {
    const result = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: editingStudent.value.user_id,
        pfp_field: editingField.value,
        couleur: cellData.couleur,
        commentaire: cellData.commentaire || null,
        visible: editingStudent.value.visible
      }, {
        onConflict: 'user_id,pfp_field'
      })
      .select()

    if (result.error) {
      throw result.error
    }

    // Mettre à jour localement
    editingStudent.value[editingField.value] = { ...cellData }
    

  } catch (e) {
    console.error('Erreur saveCellData:', e)
    alert('Erreur lors de la sauvegarde: ' + e.message)
  }
  
  closeCellDialog()
}


const fetchCases = async () => {
  loading.value = true
  try {
    // 1. Récupérer tous les étudiants
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, family_name, forname, classe')
      .order('family_name')

    if (profilesError) throw profilesError

    // 2. Récupérer tous les suivis de cas particuliers
    const { data: suivis, error: suivisError } = await supabase
      .from('suivi_cas_particuliers')
      .select('*')

    if (suivisError) throw suivisError

    // 3. Créer une map des suivis par user_id et pfp_field
    const suivisMap = new Map()
    ;(suivis || []).forEach(s => {
      const key = `${s.user_id}_${s.pfp_field}`
      suivisMap.set(key, {
        couleur: s.couleur || 'blanc',
        commentaire: s.commentaire || ''
      })
    })

    // 4. Créer une map de visibilité par user_id
    const visibilityMap = new Map()
    ;(suivis || []).forEach(s => {
      if (!visibilityMap.has(s.user_id)) {
        visibilityMap.set(s.user_id, s.visible)
      }
    })

    // 5. Merger les données
    cases.value = (profiles || []).map(p => {
      const pfpFields = ['pfp1', 'pfp1_prime', 'pfp2', 'pfp2_prime', 'pfp3', 'pfp3_prime', 'pfp4', 'pfp4_prime']
      const studentData = {
        user_id: p.user_id,
        etudiant: `${(p.family_name || '').toUpperCase()} ${p.forname || ''}`.trim(),
        classe: p.classe || '-',
        visible: visibilityMap.get(p.user_id) !== false
      }

      pfpFields.forEach(field => {
        const key = `${p.user_id}_${field}`
        studentData[field] = suivisMap.get(key) || { couleur: 'blanc', commentaire: '' }
      })

      // Ajouter les infos étudiant
      const infoKey = `${p.user_id}_info_etudiant`
      studentData.info_etudiant = suivisMap.get(infoKey) || { commentaire: '' }

      return studentData
    })
  } catch (e) {
    console.error('Erreur fetchCases:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCases()
})
</script>

<style scoped>
.cursor-pointer:hover {
  opacity: 0.8;
  transform: scale(1.02);
}
</style>
