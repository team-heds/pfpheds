<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Gestion des Places</h1>
    </div>
    
    <!-- Barre de recherche -->
    <div class="text-center mb-3">
      <InputText
        v-model="search"
        placeholder="Recherche par nom de place ou remarques"
        class="w-50"
      />
    </div>
    
    <!-- Sélecteur d'année -->
    <div class="text-center mb-3">
      <label for="annee-select" class="mr-2">Année :</label>
      <select id="annee-select" v-model="selectedYear" class="p-inputtext-sm">
        <option value="2025">2025</option>
        <option value="2026">2026</option>
      </select>
    </div>
    
    <div class="container scroll-table-container compact-table">
      <!-- Bouton Créer une nouvelle place -->
      <div class="text-center mb-3">
        <Button label="Créer une nouvelle place" class="p-button-primary" @click="openCreatePlaceModal" />
      </div>
      
      <!-- Table des places -->
      <div v-if="filteredPlaces.length > 0" class="p-datatable-responsive">
        <DataTable
          :value="filteredPlaces"
          class="p-datatable-sm custom-datatable"
          paginator
          :rows="10"
          responsiveLayout="scroll"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          :loading="loading"
        >
          <!-- Colonne Institution -->
          <Column header="Institution" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
            </template>
          </Column>

          <!-- Colonne Nom de la Place -->
          <Column header="Nom de la Place" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.NomPlace"
                @change="updatePlace(slotProps.data, 'NomPlace', slotProps.data.NomPlace)"
                class="p-inputtext-sm"
              />
            </template>
          </Column>

          <!-- Spécialités -->
          <Column header="MSQ" :style="{ textAlign: 'center' }">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.MSQ"
                @change="updatePlace(slotProps.data, 'MSQ', slotProps.data.MSQ)"
                :binary="true"
              />
            </template>
          </Column>
          
          <Column header="SYSINT" :style="{ textAlign: 'center' }">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.SYSINT"
                @change="updatePlace(slotProps.data, 'SYSINT', slotProps.data.SYSINT)"
                :binary="true"
              />
            </template>
          </Column>
          
          <Column header="NEUROGER" :style="{ textAlign: 'center' }">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.NEUROGER"
                @change="updatePlace(slotProps.data, 'NEUROGER', slotProps.data.NEUROGER)"
                :binary="true"
              />
            </template>
          </Column>
          
          <Column header="AIGU" :style="{ textAlign: 'center' }">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.AIGU"
                @change="updatePlace(slotProps.data, 'AIGU', slotProps.data.AIGU)"
                :binary="true"
              />
            </template>
          </Column>
          
          <Column header="REHAB" :style="{ textAlign: 'center' }">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.REHAB"
                @change="updatePlace(slotProps.data, 'REHAB', slotProps.data.REHAB)"
                :binary="true"
              />
            </template>
          </Column>
          
          <Column header="AMBU" :style="{ textAlign: 'center' }">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.AMBU"
                @change="updatePlace(slotProps.data, 'AMBU', slotProps.data.AMBU)"
                :binary="true"
              />
            </template>
          </Column>

          <!-- Langues -->
          <Column header="FR" :style="{ textAlign: 'center' }">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.FR"
                @change="updatePlace(slotProps.data, 'FR', slotProps.data.FR)"
                :binary="true"
              />
            </template>
          </Column>
          
          <Column header="DE" :style="{ textAlign: 'center' }">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.DE"
                @change="updatePlace(slotProps.data, 'DE', slotProps.data.DE)"
                :binary="true"
              />
            </template>
          </Column>

          <!-- Colonnes PFP -->
          <Column header="PFP2" :style="{ minWidth: '80px' }">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP2')"
                @input="setYearField(slotProps.data, 'PFP2', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          
          <Column header="PFP1A" :style="{ minWidth: '80px' }">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP1A')"
                @input="setYearField(slotProps.data, 'PFP1A', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          
          <Column header="PFP1B" :style="{ minWidth: '80px' }">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP1B')"
                @input="setYearField(slotProps.data, 'PFP1B', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          
          <Column header="PFP3" :style="{ minWidth: '80px' }">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP3')"
                @input="setYearField(slotProps.data, 'PFP3', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          
          <Column header="PFP4" :style="{ minWidth: '80px' }">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP4')"
                @input="setYearField(slotProps.data, 'PFP4', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>

          <!-- Remarques -->
          <Column header="Remarques" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'Remarques')"
                @input="setYearField(slotProps.data, 'Remarques', $event.target.value)"
                class="p-inputtext-sm"
              />
            </template>
          </Column>

          <!-- Actions -->
          <Column header="Actions" :style="{ minWidth: '150px' }">
            <template #body="slotProps">
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-danger p-button-sm" 
                @click="deletePlace(slotProps.data)" 
                v-tooltip.top="'Supprimer'"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else class="text-center mt-3">
        <p v-if="!loading">Aucune place trouvée.</p>
        <ProgressSpinner v-else />
      </div>

      <!-- Récapitulatif des places par PFP -->
      <div class="recap mt-4 surface-card p-3 border-round">
        <h3>Récapitulatif des places par PFP ({{ selectedYear }}) :</h3>
        <ul>
          <li><strong>PFP2</strong> : {{ countPlacesByPFP().PFP2 }} places</li>
          <li><strong>PFP1A</strong> : {{ countPlacesByPFP().PFP1A }} places</li>
          <li><strong>PFP1B</strong> : {{ countPlacesByPFP().PFP1B }} places</li>
          <li><strong>PFP3</strong> : {{ countPlacesByPFP().PFP3 }} places</li>
          <li><strong>PFP4</strong> : {{ countPlacesByPFP().PFP4 }} places</li>
        </ul>
      </div>
    </div>

    <!-- Modal création (à implémenter) -->
    <Dialog v-model:visible="isCreateModalVisible" header="Créer une nouvelle place" :modal="true" :style="{ width: '50vw' }">
      <p>Modal de création à implémenter</p>
      <template #footer>
        <Button label="Annuler" @click="isCreateModalVisible = false" class="p-button-text" />
        <Button label="Créer" @click="createNewPlace" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { useToast } from 'primevue/usetoast'

import Navbar from '@/components/common/utils/Navbar.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()
const toast = useToast()

const search = ref('')
const selectedYear = ref('2025')
const isCreateModalVisible = ref(false)
const loading = ref(false)

const filteredPlaces = computed(() => {
  if (!placesStore.places || placesStore.places.length === 0) {
    return []
  }
  
  const searchLower = search.value.toLowerCase()
  
  return placesStore.places.filter(place => {
    const nameMatch = place.NomPlace?.toLowerCase().includes(searchLower)
    const institutionMatch = place.InstitutionName?.toLowerCase().includes(searchLower)
    const lieuMatch = place.Lieu?.toLowerCase().includes(searchLower)
    
    // Recherche dans les remarques de l'année sélectionnée
    const remarques = place.Remarques?.[selectedYear.value] || ''
    const remarquesMatch = remarques.toLowerCase().includes(searchLower)
    
    return nameMatch || institutionMatch || lieuMatch || remarquesMatch
  })
})

onMounted(async () => {
  await loadPlaces()
  await loadInstitutions()
})

async function loadPlaces() {
  loading.value = true
  try {
    await placesStore.fetchPlaces()
    console.log('✅ Places chargées:', placesStore.places.length)
  } catch (error) {
    console.error('❌ Erreur chargement places:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les places.', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function loadInstitutions() {
  try {
    await institutionsStore.fetchInstitutions()
    console.log('✅ Institutions chargées:', institutionsStore.institutions.length)
  } catch (error) {
    console.error('❌ Erreur chargement institutions:', error)
  }
}

/**
 * Récupérer la valeur d'un champ PFP/Remarques pour l'année sélectionnée
 */
function getYearField(place, field) {
  if (!place[field]) return ''
  if (typeof place[field] === 'object') {
    return place[field][selectedYear.value] || ''
  }
  return place[field]
}

/**
 * Mettre à jour un champ PFP/Remarques pour l'année sélectionnée
 */
async function setYearField(place, field, value) {
  const updatedField = { ...place[field] }
  updatedField[selectedYear.value] = value
  
  try {
    await placesStore.updatePlace(place.PlaceId, { [field]: updatedField })
    place[field] = updatedField
    toast.add({ severity: 'success', summary: 'Succès', detail: `${field} mis à jour.`, life: 2000 })
  } catch (error) {
    console.error('❌ Erreur mise à jour:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de mise à jour.', life: 3000 })
  }
}

/**
 * Mettre à jour un champ simple (booléen, texte)
 */
async function updatePlace(place, field, value) {
  try {
    await placesStore.updatePlace(place.PlaceId, { [field]: value })
    toast.add({ severity: 'success', summary: 'Succès', detail: `${field} mis à jour.`, life: 2000 })
  } catch (error) {
    console.error('❌ Erreur mise à jour:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de mise à jour.', life: 3000 })
  }
}

/**
 * Supprimer une place
 */
async function deletePlace(place) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la place "${place.NomPlace}" ?`)) {
    return
  }
  
  try {
    await placesStore.deletePlace(place.PlaceId)
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Place supprimée.', life: 3000 })
  } catch (error) {
    console.error('❌ Erreur suppression:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de suppression.', life: 3000 })
  }
}

/**
 * Compter les places par type de PFP
 */
function countPlacesByPFP() {
  const counts = { PFP2: 0, PFP1A: 0, PFP1B: 0, PFP3: 0, PFP4: 0 }
  
  placesStore.places.forEach(place => {
    counts.PFP2 += getPFPIncrement(place.PFP2)
    counts.PFP1A += getPFPIncrement(place.PFP1A)
    counts.PFP1B += getPFPIncrement(place.PFP1B)
    counts.PFP3 += getPFPIncrement(place.PFP3)
    counts.PFP4 += getPFPIncrement(place.PFP4)
  })
  
  return counts
}

function getPFPIncrement(pfpField) {
  if (!pfpField) return 0
  const value = typeof pfpField === 'object' ? pfpField[selectedYear.value] : pfpField
  const num = parseInt(value)
  return isNaN(num) ? 0 : num
}

function openCreatePlaceModal() {
  isCreateModalVisible.value = true
}

async function createNewPlace() {
  // TODO: Implémenter la création
  toast.add({ severity: 'info', summary: 'Info', detail: 'Création à implémenter.', life: 3000 })
  isCreateModalVisible.value = false
}
</script>

<style scoped>
.page-title {
  text-align: center;
  margin: 2rem 0 1rem 0;
}

.scroll-table-container {
  max-height: 80vh;
  overflow-y: auto;
  padding: 0 2rem;
}

.compact-table :deep(.p-datatable) {
  font-size: 0.9rem;
}

.small-input {
  width: 60px;
}

.recap {
  background: var(--surface-card);
  padding: 1rem;
  border-radius: 0.5rem;
}

.recap h3 {
  margin-bottom: 0.5rem;
}

.recap ul {
  list-style: none;
  padding: 0;
}

.recap li {
  padding: 0.25rem 0;
}
</style>
