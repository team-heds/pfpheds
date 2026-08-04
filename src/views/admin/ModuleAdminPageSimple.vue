<template>
  <Navbar />
  <div class="module-admin-page">
    <div class="page-header">
      <h1>Administration des Modules</h1>
      <p>Créer et gérer les modules de formation</p>
    </div>

    <TabView>
      <!-- Onglet Gestion des Modules -->
      <TabPanel header="Modules">
        <div class="flex justify-content-between align-items-center mb-4">
          <h2>Modules existants</h2>
          <div class="flex gap-2">
            <Button 
              label="Données de démo" 
              icon="pi pi-database" 
              severity="secondary"
              @click="initializeDemoData" 
              :loading="initializing"
              v-if="modules.length === 0"
            />
            <Button label="Nouveau Module" icon="pi pi-plus" @click="showCreateModuleDialog = true" />
          </div>
        </div>

        <DataTable :value="modules" :loading="modulesLoading" responsive-layout="scroll">
          <Column field="title" header="Titre" />
          <Column field="yearId" header="Année">
            <template #body="{ data }">
              <Tag :value="getYearLabel(data.yearId)" severity="secondary" />
            </template>
          </Column>
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
          <Column header="Actions" style="width: 150px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button icon="pi pi-pencil" size="small" @click="editModule(data)" />
                <Button icon="pi pi-video" size="small" severity="info" @click="manageVideos(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- Onglet Configuration Vimeo -->
      <TabPanel header="Configuration Vimeo">
        <div class="flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Configuration de l'intégration Vimeo</h2>
            <p class="text-600">Vérifiez la connexion Vimeo gérée par le serveur</p>
          </div>
        </div>

        <!-- Configuration Token -->
        <Card class="mb-4">
          <template #title>Configuration du Token Vimeo</template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-info-circle text-blue-500"></i>
                <span class="font-medium">Statut du token :</span>
                <Tag v-if="hasVimeoToken" value="Configuré" severity="success" />
                <Tag v-else value="Non configuré" severity="warning" />
              </div>
              
              <div v-if="!hasVimeoToken" class="bg-yellow-50 p-3 border-round">
                <h4 class="mt-0 mb-2">Pour configurer votre token Vimeo :</h4>
                <ol class="m-0 pl-4">
                  <li>Ajoutez <code>VIMEO_ACCESS_TOKEN</code> dans l'environnement du backend</li>
                  <li>Ne placez jamais ce secret dans une variable préfixée <code>VITE_</code></li>
                  <li>Redémarrez le backend puis vérifiez la connexion</li>
                </ol>
              </div>

              <div class="flex gap-2">
                <Button 
                  label="Obtenir un token Vimeo" 
                  icon="pi pi-external-link" 
                  @click="openVimeoDevSite" 
                />
                <Button 
                  label="Vérifier la connexion"
                  icon="pi pi-check" 
                  severity="info"
                  @click="testToken"
                  :loading="testing"
                />
              </div>

            </div>
          </template>
        </Card>

        <!-- Configuration Firebase -->
        <Card class="mb-4">
          <template #title>Configuration Firebase</template>
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-database text-orange-500"></i>
                <span class="font-medium">Firebase est requis pour le fonctionnement de l'application</span>
              </div>
              
              <div class="bg-orange-50 p-3 border-round">
                <h4 class="mt-0 mb-2">Si vous voyez des erreurs Firebase :</h4>
                <ol class="m-0 pl-4">
                  <li>Vérifiez que toutes les variables <code>VITE_FIREBASE_*</code> sont dans votre <code>.env</code></li>
                  <li>Utilisez le bouton "Diagnostic Firebase" pour identifier les problèmes</li>
                  <li>Consultez le fichier <code>.env.production.example</code> pour voir les variables requises</li>
                </ol>
              </div>

              <div class="flex gap-2">
                <Button 
                  label="Diagnostic Firebase" 
                  icon="pi pi-wrench" 
                  severity="warning"
                  @click="diagnoseFirebase"
                />
                <Button 
                  label="Console Firebase" 
                  icon="pi pi-external-link" 
                  severity="secondary"
                  @click="openFirebaseConsole"
                />
                <Button 
                  label="Test Variables ENV" 
                  icon="pi pi-search" 
                  severity="info"
                  @click="testEnvironmentVariables"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Bouton pour charger les vidéos Vimeo -->
        <div v-if="hasVimeoToken" class="text-center">
          <Button 
            label="Charger les vidéos Vimeo" 
            icon="pi pi-video" 
            size="large"
            @click="loadVimeoVideos"
            :loading="vimeoLoading"
          />
          <p class="text-500 mt-2">Cliquez pour charger vos vidéos Vimeo et les assigner aux modules</p>
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
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getModulesWithVideoCount, createModule as createModuleService } from '@/service/mediaService'

const toast = useToast()

// État des modules
const modules = ref([])
const modulesLoading = ref(false)
const showCreateModuleDialog = ref(false)
const creating = ref(false)
const initializing = ref(false)

// État Vimeo
const hasVimeoToken = ref(false)
const testing = ref(false)
const vimeoLoading = ref(false)

// Formulaire de module
const moduleForm = ref({
  title: '',
  yearId: '',
  description: '',
  order: 1,
  status: 'draft'
})

// Options pour les dropdowns
const yearOptions = ref([
  { label: '1ère année', value: '1ere' },
  { label: '2ème année', value: '2eme' },
  { label: '3ème année', value: '3eme' }
])
const statusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Actif', value: 'active' },
  { label: 'Archivé', value: 'archived' }
]

// Fonctions utilitaires
function getStatusSeverity(status) {
  switch (status) {
    case 'active': return 'success'
    case 'draft': return 'warning'
    case 'archived': return 'secondary'
    default: return 'info'
  }
}

function getYearLabel(yearId) {
  switch (yearId) {
    case '1ere': return '1ère année'
    case '2eme': return '2ème année'
    case '3eme': return '3ème année'
    default: return 'Année inconnue'
  }
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

function manageVideos(module) {
  toast.add({ severity: 'info', summary: 'Info', detail: `Gestion des vidéos pour ${module.title}` })
}

// Gestion du token Vimeo
function openVimeoDevSite() {
  window.open('https://developer.vimeo.com/apps', '_blank')
}

async function testToken() {
  testing.value = true
  try {
    const { testVimeoAuth } = await import('@/service/vimeoService')
    const response = await testVimeoAuth()
    
    if (response.ok) {
      hasVimeoToken.value = true
      const data = response.user || {}
      toast.add({ 
        severity: 'success', 
        summary: 'Token valide', 
        detail: `Connecté en tant que ${data.name}` 
      })
    } else {
      hasVimeoToken.value = false
      toast.add({ severity: 'error', summary: 'Token invalide', detail: 'Vérifiez votre token' })
    }
  } catch (error) {
    console.error('Erreur lors du test du token:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de tester le token' })
  } finally {
    testing.value = false
  }
}

async function loadVimeoVideos() {
  vimeoLoading.value = true
  try {
    // Import dynamique pour éviter les erreurs
    const { listAllVideos } = await import('@/service/vimeoService')
    const videos = await listAllVideos({ perPage: 50, maxPages: 2 })
    
    toast.add({ 
      severity: 'success', 
      summary: 'Vidéos chargées', 
      detail: `${videos.length} vidéos trouvées sur Vimeo` 
    })
    
    // TODO: Implémenter l'interface d'assignation des vidéos
    
  } catch (error) {
    console.error('Erreur lors du chargement des vidéos:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les vidéos Vimeo' })
  } finally {
    vimeoLoading.value = false
  }
}

// Données de démonstration
async function initializeDemoData() {
  initializing.value = true
  try {
    console.log('🚀 Initialisation des données de démonstration...')
    
    // Créer des modules pour chaque année
    const demoModules = [
      // Modules 1ère année
      {
        title: 'Introduction aux Soins Infirmiers',
        yearId: '1ere',
        description: 'Module d\'introduction aux concepts fondamentaux des soins infirmiers',
        order: 1,
        status: 'active'
      },
      {
        title: 'Anatomie et Physiologie de Base',
        yearId: '1ere',
        description: 'Étude des structures et fonctions de base du corps humain',
        order: 2,
        status: 'active'
      },
      {
        title: 'Communication et Relation d\'Aide',
        yearId: '1ere',
        description: 'Développement des compétences relationnelles en soins',
        order: 3,
        status: 'draft'
      },
      
      // Modules 2ème année
      {
        title: 'Soins Techniques Avancés',
        yearId: '2eme',
        description: 'Maîtrise des techniques de soins complexes',
        order: 1,
        status: 'active'
      },
      {
        title: 'Pharmacologie Clinique',
        yearId: '2eme',
        description: 'Administration et surveillance des médicaments',
        order: 2,
        status: 'active'
      },
      {
        title: 'Soins d\'Urgence',
        yearId: '2eme',
        description: 'Prise en charge des situations d\'urgence',
        order: 3,
        status: 'draft'
      },
      
      // Modules 3ème année
      {
        title: 'Gestion d\'Équipe et Leadership',
        yearId: '3eme',
        description: 'Développement des compétences managériales',
        order: 1,
        status: 'active'
      },
      {
        title: 'Éthique et Déontologie',
        yearId: '3eme',
        description: 'Réflexion sur les enjeux éthiques en soins',
        order: 2,
        status: 'active'
      },
      {
        title: 'Recherche en Soins Infirmiers',
        yearId: '3eme',
        description: 'Initiation à la recherche et à l\'evidence-based practice',
        order: 3,
        status: 'archived'
      }
    ]
    
    let createdCount = 0
    for (const moduleData of demoModules) {
      await createModuleService(moduleData)
      createdCount++
    }
    
    await loadModules()
    
    toast.add({ 
      severity: 'success', 
      summary: 'Données créées', 
      detail: `${createdCount} modules de démonstration créés avec succès` 
    })
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'initialiser les données' })
  } finally {
    initializing.value = false
  }
}

// Initialisation
onMounted(async () => {
  try {
    const { testVimeoAuth } = await import('@/service/vimeoService')
    hasVimeoToken.value = (await testVimeoAuth()).ok
    await loadModules()
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données' })
  }
})

async function diagnoseFirebase() {
  try {
    // Import dynamique des fonctions de diagnostic
    const { diagnoseFirebaseConfig, testFirebaseConnection, showEnvironmentInfo } = await import('@/utils/firebaseDiagnostic')
    const { testFirebaseConnection: testMediaService } = await import('@/service/mediaService')
    
    // Afficher les informations d'environnement
    showEnvironmentInfo()
    
    // Diagnostiquer la configuration
    const configResult = diagnoseFirebaseConfig()
    
    if (!configResult.isValid) {
      toast.add({ 
        severity: 'error', 
        summary: 'Configuration Firebase incomplète', 
        detail: `${configResult.missingVars.length} variable(s) manquante(s). Vérifiez la console.` 
      })
      return
    }
    
    // Tester la connexion avec l'utilitaire de diagnostic
    const connectionResult = await testFirebaseConnection()
    
    // Tester aussi avec le service media sécurisé
    const mediaServiceResult = await testMediaService()
    
    if (connectionResult.success && mediaServiceResult.success) {
      toast.add({ 
        severity: 'success', 
        summary: 'Firebase opérationnel', 
        detail: 'Tous les services Firebase sont correctement configurés' 
      })
    } else {
      const errorMsg = connectionResult.error || mediaServiceResult.error || 'Erreur inconnue'
      toast.add({ 
        severity: 'error', 
        summary: 'Erreur Firebase', 
        detail: `Problème de connexion: ${errorMsg}` 
      })
    }
    
  } catch (error) {
    console.error('Erreur lors du diagnostic Firebase:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur diagnostic', 
      detail: 'Impossible d\'exécuter le diagnostic Firebase' 
    })
  }
}

function openFirebaseConsole() {
  window.open('https://console.firebase.google.com/', '_blank')
}

async function testEnvironmentVariables() {
  try {
    // Import du test d'environnement
    const { testViteEnv } = await import('@/test-env')
    
    // Exécuter le test
    const result = testViteEnv()
    
    // Afficher le résultat dans l'interface
    if (result.isValid) {
      toast.add({ 
        severity: 'success', 
        summary: 'Variables ENV OK', 
        detail: 'Toutes les variables Firebase sont présentes' 
      })
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Variables ENV manquantes', 
        detail: `${result.missingCount} variable(s) Firebase manquante(s). Vérifiez la console.` 
      })
    }
    
    // Affichage détaillé dans la console
    console.log('\n🔧 DIAGNOSTIC DÉTAILLÉ:')
    console.log('Fichier .env à vérifier:')
    console.log('- .env (développement)')
    console.log('- .env.local (override local)')
    console.log('- .env.production (production)')
    console.log('\nFormat attendu dans le fichier .env:')
    console.log('VITE_FIREBASE_API_KEY=votre_clé_ici')
    console.log('VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com')
    console.log('...')
    
  } catch (error) {
    console.error('Erreur lors du test des variables:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur test ENV', 
      detail: 'Impossible de tester les variables d\'environnement' 
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
