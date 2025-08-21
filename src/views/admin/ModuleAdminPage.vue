<template>
  <Navbar />
  <div class="module-admin-page">
    <div class="page-header">
      <h1>Administration des Modules</h1>
      <p>Créer et gérer les modules de formation</p>
      
      <!-- Indicateurs de statut -->
      <div class="flex gap-3 mt-3">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-database text-green-500"></i>
          <span class="text-sm">Firebase connecté</span>
        </div>
        <div class="flex align-items-center gap-2">
          <i :class="hasVimeoToken ? 'pi pi-video text-green-500' : 'pi pi-video text-orange-500'"></i>
          <span class="text-sm">{{ hasVimeoToken ? 'Token Vimeo configuré' : 'Token Vimeo manquant' }}</span>
        </div>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-users text-blue-500"></i>
          <span class="text-sm">{{ modules.length }} module(s)</span>
        </div>
      </div>
    </div>

    <TabView>
      <!-- Onglet Gestion des Modules -->
      <TabPanel header="Modules">
        <div class="flex justify-content-between align-items-center mb-4">
          <h2>Modules existants</h2>
          <div class="flex gap-2">
            <Button 
              label="Exporter" 
              icon="pi pi-download" 
              severity="secondary" 
              size="small"
              @click="exportModules"
            />
            <Button 
              label="Données de démo" 
              icon="pi pi-database" 
              severity="help" 
              size="small"
              @click="initializeDemoData" 
              :loading="initializing"
            />
            <Button label="Nouveau Module" icon="pi pi-plus" @click="showCreateModuleDialog = true" />
          </div>
        </div>

        <!-- Barre de recherche et filtres -->
        <div class="flex justify-content-between align-items-center mb-4">
          <div class="flex gap-2">
            <InputText 
              v-model="moduleSearchQuery" 
              placeholder="Rechercher un module..."
              class="w-20rem"
            />
            <Dropdown 
              v-model="moduleStatusFilter" 
              :options="statusFilterOptions" 
              optionLabel="label" 
              optionValue="value" 
              placeholder="Filtrer par statut"
              class="w-12rem"
            />
            <Button 
              icon="pi pi-times" 
              severity="secondary" 
              @click="clearModuleFilters"
              v-tooltip.top="'Effacer les filtres'"
            />
          </div>
          <div class="flex align-items-center gap-2">
            <Tag :value="`${filteredModules.length} / ${modules.length} modules`" severity="info" />
          </div>
        </div>

        <DataTable 
          :value="filteredModules" 
          paginator 
          :rows="10" 
          dataKey="id"
          :loading="modulesLoading"
          showGridlines
          stripedRows
        >
          <Column field="title" header="Titre" />
          <Column field="yearId" header="Année" />
          <Column field="description" header="Description">
            <template #body="{ data }">
              <div class="max-w-20rem">
                {{ data.description?.substring(0, 100) }}{{ data.description?.length > 100 ? '...' : '' }}
              </div>
            </template>
          </Column>
          <Column field="videoCount" header="Vidéos" style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data.videoCount || 0" severity="info" />
            </template>
          </Column>
          <Column field="status" header="Statut" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
          <Column header="Actions" :exportable="false" style="min-width:12rem">
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
                <Button 
                  icon="pi pi-video" 
                  severity="success" 
                  size="small" 
                  @click="manageVideos(slotProps.data)" 
                  v-tooltip.top="'Gérer les vidéos'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- Onglet Gestion des Vidéos -->
      <TabPanel header="Vidéos Vimeo">
        <div class="flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Ajouter des vidéos Vimeo aux modules</h2>
            <p class="text-600">Sélectionnez des vidéos depuis votre compte Vimeo et assignez-les à un module</p>
          </div>
          <div class="flex gap-2">
            <Button 
              label="Diagnostic Token" 
              icon="pi pi-info-circle" 
              severity="info"
              size="small"
              @click="diagnoseToken" 
            />
            <Button label="Actualiser Vimeo" icon="pi pi-refresh" @click="loadVimeoVideos" :loading="vimeoLoading" />
          </div>
        </div>

        <!-- Sélecteur de module -->
        <div class="mb-4">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label class="block text-900 font-medium mb-2">Module de destination :</label>
              <Dropdown 
                v-model="selectedModuleId" 
                :options="moduleOptions" 
                option-label="label" 
                option-value="value"
                placeholder="Choisir un module"
                class="w-full"
              />
            </div>
            <div class="col-12 md:col-6">
              <label class="block text-900 font-medium mb-2">Filtrer par statut :</label>
              <Dropdown 
                v-model="videoFilter" 
                :options="videoFilterOptions" 
                option-label="label" 
                option-value="value"
                placeholder="Tous les statuts"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Filtres et statistiques -->
        <div class="grid mb-4">
          <div class="col-12 md:col-6">
            <div class="flex gap-2">
              <Dropdown 
                v-model="videoFilter" 
                :options="videoFilterOptions" 
                optionLabel="label" 
                optionValue="value" 
                placeholder="Filtrer par statut"
                class="flex-1"
              />
              <InputText 
                v-model="videoSearchQuery" 
                placeholder="Rechercher par titre..."
                class="flex-1"
              />
              <Button 
                icon="pi pi-times" 
                severity="secondary" 
                @click="clearFilters"
                v-tooltip.top="'Effacer les filtres'"
              />
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="flex justify-content-end align-items-center gap-3">
              <Tag :value="`${filteredVimeoVideos.length} / ${vimeoVideos.length} vidéos`" severity="info" />
              <Tag :value="`${availableVideosCount} disponibles`" severity="success" />
              <Tag :value="`${assignedVideosCount} assignées`" severity="warning" />
            </div>
          </div>
        </div>

        <!-- Message d'aide si pas de token -->
        <Message v-if="!hasVimeoToken" severity="warn" :closable="false" class="mb-4">
          <div class="flex flex-column gap-3">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-exclamation-triangle text-orange-500"></i>
              <strong>Configuration Vimeo requise</strong>
            </div>
            <p class="m-0">Pour utiliser l'intégration Vimeo, vous devez configurer un token d'accès :</p>
            <div class="bg-gray-50 p-3 border-round">
              <h4 class="mt-0 mb-2">Option 1 : Fichier .env.production (Recommandé)</h4>
              <ol class="m-0 pl-4">
                <li>Copiez le fichier <code>.env.production.example</code> vers <code>.env.production</code></li>
                <li>Remplacez <code>votre_token_vimeo_ici</code> par votre vrai token</li>
                <li>Redémarrez l'application</li>
              </ol>
            </div>
            <div class="bg-blue-50 p-3 border-round">
              <h4 class="mt-0 mb-2">Option 2 : Test rapide (Temporaire)</h4>
              <p class="m-0 mb-2">Utilisez la console du navigateur :</p>
              <code class="bg-white p-2 border-round block">localStorage.setItem('VIMEO_TOKEN_OVERRIDE', 'votre_token')</code>
            </div>
            <div class="flex gap-2">
              <Button 
                label="Obtenir un token Vimeo" 
                icon="pi pi-external-link" 
                size="small"
                @click="openVimeoDevSite" 
              />
              <Button 
                label="Tester avec localStorage" 
                icon="pi pi-cog" 
                size="small"
                severity="secondary"
                @click="showTokenInput = true" 
              />
            </div>
          </div>
        </Message>

        <!-- Input pour token de test -->
        <div v-if="showTokenInput" class="mb-4">
          <div class="flex gap-2">
            <InputText 
              v-model="testToken" 
              placeholder="Collez votre token Vimeo ici"
              class="flex-1"
            />
            <Button 
              label="Tester" 
              icon="pi pi-check" 
              @click="setTestToken"
              :disabled="!testToken"
            />
            <Button 
              icon="pi pi-times" 
              @click="showTokenInput = false"
              class="p-button-text"
            />
          </div>
        </div>

        <!-- Statistiques des vidéos -->
        <div v-if="vimeoVideos.length > 0" class="mb-4">
          <div class="flex gap-4 align-items-center">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-video text-blue-500"></i>
              <span class="font-medium">{{ filteredVimeoVideos.length }} / {{ vimeoVideos.length }} vidéos affichées</span>
            </div>
            <div class="flex align-items-center gap-2">
              <Tag :value="`${vimeoVideos.filter(v => !v.isInModule).length} disponibles`" severity="info" />
              <Tag :value="`${vimeoVideos.filter(v => v.isInModule).length} déjà ajoutées`" severity="success" />
            </div>
          </div>
        </div>

        <!-- Liste des vidéos Vimeo -->
        <DataTable 
          :value="filteredVimeoVideos" 
          :loading="vimeoLoading" 
          selection-mode="multiple" 
          v-model:selection="selectedVideos"
          responsive-layout="scroll"
          :paginator="true"
          :rows="10"
        >
          <Column selection-mode="multiple" header-style="width: 3rem" />
          <Column header="Aperçu" style="width: 120px">
            <template #body="{ data }">
              <img v-if="data.thumbnail" :src="data.thumbnail" alt="thumb" 
                   style="width:80px;height:45px;object-fit:cover;border-radius:4px;" />
              <div v-else class="w-5rem h-3rem bg-gray-200 border-round flex align-items-center justify-content-center">
                <i class="pi pi-video text-gray-500"></i>
              </div>
            </template>
          </Column>
          <Column field="title" header="Titre">
            <template #body="{ data }">
              <div class="font-medium">{{ data.title }}</div>
              <div class="text-sm text-500" v-if="data.description">
                {{ data.description.substring(0, 80) }}{{ data.description.length > 80 ? '...' : '' }}
              </div>
            </template>
          </Column>
          <Column field="duration" header="Durée" style="width: 100px" />
          <Column field="privacy" header="Confidentialité" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.privacy" :severity="data.privacy === 'anybody' ? 'success' : 'warning'" />
            </template>
          </Column>
          <Column header="Statut" style="width: 150px">
            <template #body="{ data }">
              <div v-if="data.isInModule" class="flex flex-column gap-1">
                <Tag value="Déjà ajoutée" severity="success" />
                <small class="text-500" v-if="data.moduleInfo">
                  Module: {{ getModuleName(data.moduleInfo.moduleId) }}
                </small>
              </div>
              <Tag v-else value="Disponible" severity="info" />
            </template>
          </Column>
        </DataTable>

        <div class="flex justify-content-end mt-4" v-if="selectedVideos.length > 0">
          <Button 
            :label="`Ajouter ${selectedVideos.length} vidéo(s) au module`" 
            icon="pi pi-plus" 
            @click="addVideosToModule"
            :disabled="!selectedModuleId"
          />
        </div>
      </TabPanel>
    </TabView>

    <!-- Dialog Création/Édition Module -->
    <Dialog v-model:visible="showCreateModuleDialog" modal header="Nouveau Module" :style="{ width: '50rem' }">
      <div class="p-fluid">
        <div class="field">
          <label for="moduleTitle">Titre du module *</label>
          <InputText id="moduleTitle" v-model="moduleForm.title" />
        </div>
        
        <div class="field">
          <label for="moduleYear">Année *</label>
          <Dropdown 
            id="moduleYear" 
            v-model="moduleForm.yearId" 
            :options="yearOptions" 
            option-label="label" 
            option-value="value"
            placeholder="Sélectionner une année"
          />
        </div>
        
        <div class="field">
          <label for="moduleDescription">Description</label>
          <Textarea id="moduleDescription" v-model="moduleForm.description" rows="4" />
        </div>
        
        <div class="field">
          <label for="moduleOrder">Ordre d'affichage</label>
          <InputNumber id="moduleOrder" v-model="moduleForm.order" :min="1" />
        </div>
        
        <div class="field">
          <label for="moduleStatus">Statut</label>
          <Dropdown 
            id="moduleStatus" 
            v-model="moduleForm.status" 
            :options="statusOptions" 
            option-label="label" 
            option-value="value"
          />
        </div>
      </div>
      
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" @click="showCreateModuleDialog = false" class="p-button-text" />
        <Button label="Créer" icon="pi pi-check" @click="createModule" :loading="creating" />
      </template>
    </Dialog>

    <!-- Messages de feedback -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { listYears, getAllModules, getModulesWithVideoCount, getVideosByVimeoIds, createModule as createModuleService, createOrSyncVideo, createYear } from '@/service/mediaService'
import Navbar from '@/components/common/utils/Navbar.vue'

const toast = useToast()

// État des modules
const modules = ref([])
const modulesLoading = ref(false)
const showCreateModuleDialog = ref(false)
const creating = ref(false)
const initializing = ref(false)

// État des vidéos Vimeo
const vimeoVideos = ref([])
const vimeoLoading = ref(false)
const selectedVideos = ref([])
const selectedModuleId = ref(null)
const hasVimeoToken = ref(false)
const showTokenInput = ref(false)
const testToken = ref('')
const videoFilter = ref(null)
const videoSearchQuery = ref('')
const moduleSearchQuery = ref('')
const moduleStatusFilter = ref(null)

// Formulaire de module
const moduleForm = ref({
  title: '',
  yearId: '',
  description: '',
  order: 1,
  status: 'draft'
})

// Options pour les dropdowns
const yearOptions = ref([])
const statusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Actif', value: 'active' },
  { label: 'Archivé', value: 'archived' }
]
const videoFilterOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'Déjà ajoutée', value: 'added' },
  { label: 'Disponible', value: 'available' }
]
const statusFilterOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'Brouillon', value: 'draft' },
  { label: 'Actif', value: 'active' },
  { label: 'Archivé', value: 'archived' }
]

// Options calculées
const moduleOptions = computed(() => 
  modules.value.map(m => ({
    label: `${m.title} (${m.yearId})`,
    value: m.id
  }))
)

const filteredModules = computed(() => {
  let filtered = modules.value
  
  // Filtrer par statut
  if (moduleStatusFilter.value) {
    filtered = filtered.filter(module => module.status === moduleStatusFilter.value)
  }
  
  // Filtrer par recherche textuelle
  if (moduleSearchQuery.value) {
    const query = moduleSearchQuery.value.toLowerCase()
    filtered = filtered.filter(module => 
      module.title.toLowerCase().includes(query) ||
      module.description?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const filteredVimeoVideos = computed(() => {
  let filtered = vimeoVideos.value
  
  // Filtrer par statut
  if (videoFilter.value) {
    if (videoFilter.value === 'added') {
      filtered = filtered.filter(video => video.isInModule)
    } else if (videoFilter.value === 'available') {
      filtered = filtered.filter(video => !video.isInModule)
    }
  }
  
  // Filtrer par recherche textuelle
  if (videoSearchQuery.value) {
    const query = videoSearchQuery.value.toLowerCase()
    filtered = filtered.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const availableVideosCount = computed(() => vimeoVideos.value.filter(v => !v.isInModule).length)
const assignedVideosCount = computed(() => vimeoVideos.value.filter(v => v.isInModule).length)

// Fonctions utilitaires
function getStatusSeverity(status) {
  switch (status) {
    case 'active': return 'success'
    case 'draft': return 'warning'
    case 'archived': return 'secondary'
    default: return 'info'
  }
}

function getModuleName(moduleId) {
  const module = modules.value.find(m => m.id === moduleId)
  return module ? module.title : 'Module inconnu'
}

// Chargement des données
async function loadModules() {
  modulesLoading.value = true
  try {
    const allModules = await getModulesWithVideoCount()
    modules.value = allModules
  } catch (error) {
    console.error('Erreur lors du chargement des modules:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les modules' })
  } finally {
    modulesLoading.value = false
  }
}

async function loadVimeoVideos() {
  vimeoLoading.value = true
  try {
    // Récupérer le token Vimeo depuis l'environnement ou localStorage
    const envToken = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('VIMEO_TOKEN_OVERRIDE') : null
    const token = localToken || envToken
    
    if (!token) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Token Vimeo manquant', 
        detail: 'Configurez VITE_VIMEO_ACCESS_TOKEN dans votre .env ou utilisez le test rapide avec localStorage' 
      })
      return
    }
    
    console.log('[ModuleAdmin] Token Vimeo trouvé:', token.substring(0, 8) + '...')
    
    // Import dynamique pour éviter les erreurs au chargement de la page
    const { listAllVideos } = await import('@/service/vimeoService')
    const videos = await listAllVideos({ perPage: 100, maxPages: 5, token })
    
    // Vérifier quelles vidéos sont déjà dans des modules
    const vimeoIds = videos.map(v => v.id)
    const existingVideos = await getVideosByVimeoIds(vimeoIds)
    
    vimeoVideos.value = videos.map(v => ({
      ...v,
      isInModule: !!existingVideos[v.id],
      moduleInfo: existingVideos[v.id] || null
    }))
    toast.add({ severity: 'success', summary: 'Succès', detail: `${videos.length} vidéos Vimeo chargées` })
  } catch (error) {
    console.error('Erreur lors du chargement des vidéos Vimeo:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les vidéos Vimeo. Vérifiez votre token.' })
  } finally {
    vimeoLoading.value = false
  }
}

// Actions sur les modules
async function createModule() {
  if (!moduleForm.value.title || !moduleForm.value.yearId) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Titre et année sont obligatoires' })
    return
  }

  creating.value = true
  try {
    await createModuleService(moduleForm.value)
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Module créé avec succès' })
    showCreateModuleDialog.value = false
    moduleForm.value = { title: '', yearId: '', description: '', order: 1, status: 'draft' }
    await loadModules()
  } catch (error) {
    console.error('Erreur lors de la création du module:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de créer le module' })
  } finally {
    creating.value = false
  }
}

function editModule(module) {
  moduleForm.value = { ...module }
  showCreateModuleDialog.value = true
}

function duplicateModule(module) {
  moduleForm.value = { ...module }
  moduleForm.value.title += ' (Copie)'
  showCreateModuleDialog.value = true
}

function manageVideos(module) {
  selectedModuleId.value = module.id
  // Basculer vers l'onglet vidéos
}

// Actions sur les vidéos
async function addVideosToModule() {
  if (!selectedModuleId.value || selectedVideos.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Sélectionnez un module et des vidéos' })
    return
  }

  try {
    for (const video of selectedVideos.value) {
      await createOrSyncVideo({
        moduleId: selectedModuleId.value,
        vimeoId: video.id,
        title: video.title,
        description: video.description,
        durationSec: video.duration || 0,
        tags: []
      })
    }
    
    toast.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail: `${selectedVideos.value.length} vidéo(s) ajoutée(s) au module` 
    })
    
    selectedVideos.value = []
    await loadModules()
    await loadVimeoVideos()
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout des vidéos:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'ajouter les vidéos' })
  }
}

async function diagnoseToken() {
  const token = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN || localStorage.getItem('VIMEO_TOKEN_OVERRIDE')
  if (!token) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Token Vimeo manquant', 
      detail: 'Configurez VITE_VIMEO_ACCESS_TOKEN dans votre .env ou utilisez le test rapide avec localStorage' 
    })
    return
  }
  
  try {
    const response = await fetch('https://api.vimeo.com/', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      toast.add({ 
        severity: 'success', 
        summary: 'Succès', 
        detail: 'Token Vimeo valide' 
      })
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Erreur', 
        detail: 'Token Vimeo invalide' 
      })
    }
  } catch (error) {
    console.error('Erreur lors du diagnostic du token:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de diagnostiquer le token' })
  }
}

function openVimeoDevSite() {
  window.open('https://developer.vimeo.com/apps', '_blank')
}

function setTestToken() {
  if (testToken.value.trim()) {
    localStorage.setItem('VIMEO_TOKEN_OVERRIDE', testToken.value.trim())
    hasVimeoToken.value = true
    showTokenInput.value = false
    testToken.value = ''
    toast.add({ 
      severity: 'success', 
      summary: 'Token configuré', 
      detail: 'Token de test sauvegardé. Vous pouvez maintenant charger les vidéos Vimeo.' 
    })
  }
}

function clearFilters() {
  videoFilter.value = null
  videoSearchQuery.value = ''
}

function clearModuleFilters() {
  moduleStatusFilter.value = null
  moduleSearchQuery.value = ''
}

async function initializeDemoData() {
  initializing.value = true
  try {
    console.log('🚀 Initialisation des données de démonstration...')
    
    // Créer des années
    const year2024 = await createYear({
      name: '2024-2025',
      description: 'Année académique 2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-08-31'
    })
    
    const year2023 = await createYear({
      name: '2023-2024', 
      description: 'Année académique 2023-2024',
      startDate: '2023-09-01',
      endDate: '2024-08-31'
    })
    
    // Créer des modules pour 2024-2025
    const modules2024 = [
      {
        title: 'Introduction aux Soins Infirmiers',
        yearId: year2024.id,
        description: 'Module d\'introduction aux concepts fondamentaux des soins infirmiers',
        order: 1,
        status: 'active'
      },
      {
        title: 'Anatomie et Physiologie',
        yearId: year2024.id,
        description: 'Étude du corps humain et de ses fonctions',
        order: 2,
        status: 'active'
      },
      {
        title: 'Pharmacologie Clinique',
        yearId: year2024.id,
        description: 'Médicaments et leurs effets thérapeutiques',
        order: 3,
        status: 'draft'
      },
      {
        title: 'Soins Critiques',
        yearId: year2024.id,
        description: 'Prise en charge des patients en état critique',
        order: 4,
        status: 'active'
      }
    ]
    
    // Créer des modules pour 2023-2024
    const modules2023 = [
      {
        title: 'Éthique et Déontologie',
        yearId: year2023.id,
        description: 'Principes éthiques dans la pratique infirmière',
        order: 1,
        status: 'archived'
      },
      {
        title: 'Communication Thérapeutique',
        yearId: year2023.id,
        description: 'Techniques de communication avec les patients',
        order: 2,
        status: 'archived'
      }
    ]
    
    // Créer tous les modules
    let createdCount = 0
    for (const moduleData of [...modules2024, ...modules2023]) {
      await createModuleService(moduleData)
      createdCount++
    }
    
    toast.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail: `${createdCount} modules créés dans 2 années académiques` 
    })
    
    await loadModules()
    
    // Recharger les options d'années
    const years = await listYears()
    yearOptions.value = years.map(y => ({ label: y.name || y.id, value: y.id }))
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des données de démo:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'initialiser les données de démo' })
  } finally {
    initializing.value = false
  }
}

// Initialisation
onMounted(async () => {
  try {
    // Vérifier le token Vimeo (sans charger automatiquement les vidéos)
    const token = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN || localStorage.getItem('VIMEO_TOKEN_OVERRIDE')
    hasVimeoToken.value = !!token
    
    const years = await listYears()
    yearOptions.value = years.map(y => ({ label: y.name || y.id, value: y.id }))
    await loadModules()
    
    // Ne plus charger automatiquement les vidéos Vimeo pour éviter l'erreur de token
    // Les vidéos seront chargées manuellement via le bouton "Charger vidéos Vimeo"
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données' })
  }
})

function exportModules() {
  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalModules: modules.value.length,
      modules: modules.value.map(module => ({
        id: module.id,
        title: module.title,
        yearId: module.yearId,
        description: module.description,
        order: module.order,
        status: module.status,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
        videoCount: module.videoCount || 0
      }))
    }
    
    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `modules-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.add({ 
      severity: 'success', 
      summary: 'Export réussi', 
      detail: `${modules.value.length} modules exportés` 
    })
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur d\'export', 
      detail: 'Impossible d\'exporter les modules' 
    })
  }
}
</script>

<style scoped>
.module-admin-page {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
}

.page-header p {
  margin: 0;
  color: var(--text-color-secondary);
}
</style>
