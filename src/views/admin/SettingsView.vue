<template>
  <AdminLayout>
  <div class="page-wrapper">
    <div class="settings-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-cog text-primary"></i>
              Paramètres
            </h1>
            <p class="text-600">Configuration de l'application</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="settings-content">
        <!-- Menu latéral -->
        <div class="settings-menu">
          <div class="menu-section">
            <span class="menu-section-title">Intégrations</span>
            <div
              class="menu-item"
              :class="{ active: activeTab === 'github' }"
              @click="activeTab = 'github'"
            >
              <i class="pi pi-github"></i>
              <span>GitHub</span>
            </div>
            <div
              class="menu-item"
              :class="{ active: activeTab === 'vimeo' }"
              @click="activeTab = 'vimeo'"
            >
              <i class="pi pi-video"></i>
              <span>Vimeo</span>
            </div>
            <div
              class="menu-item"
              :class="{ active: activeTab === 'videolibrary' }"
              @click="activeTab = 'videolibrary'"
            >
              <i class="pi pi-play-circle"></i>
              <span>Bibliothèque Vidéo</span>
            </div>
          </div>

          <div class="menu-section">
            <span class="menu-section-title">Général</span>
            <div
              class="menu-item"
              :class="{ active: activeTab === 'profile' }"
              @click="activeTab = 'profile'"
            >
              <i class="pi pi-user"></i>
              <span>Profil</span>
            </div>
            <div
              class="menu-item"
              :class="{ active: activeTab === 'appearance' }"
              @click="activeTab = 'appearance'"
            >
              <i class="pi pi-palette"></i>
              <span>Apparence</span>
            </div>
            <div
              class="menu-item"
              :class="{ active: activeTab === 'notifications' }"
              @click="activeTab = 'notifications'"
            >
              <i class="pi pi-bell"></i>
              <span>Notifications</span>
            </div>
          </div>

          <div class="menu-section">
            <span class="menu-section-title">Système</span>
            <div
              class="menu-item"
              :class="{ active: activeTab === 'data' }"
              @click="activeTab = 'data'"
            >
              <i class="pi pi-database"></i>
              <span>Données</span>
            </div>
            <div
              class="menu-item"
              :class="{ active: activeTab === 'advanced' }"
              @click="activeTab = 'advanced'"
            >
              <i class="pi pi-sliders-h"></i>
              <span>Avancé</span>
            </div>
          </div>
        </div>

        <!-- Panneau de contenu -->
        <div class="settings-panel">
          <!-- GitHub Settings -->
          <div v-if="activeTab === 'github'">
            <GitHubSettings />
          </div>

          <!-- Vimeo Settings -->
          <div v-else-if="activeTab === 'vimeo'" class="settings-section">
            <div class="section-header">
              <div class="header-icon vimeo">
                <i class="pi pi-video"></i>
              </div>
              <div>
                <h3>Configuration Vimeo</h3>
                <p class="text-secondary">Gérez vos vidéos et votre compte Vimeo</p>
              </div>
            </div>
            <Divider />
            
            <div class="vimeo-config">
              <div class="config-item">
                <label>Identifiants Vimeo</label>
                <div class="input-group">
                  <InputText 
                    v-model="vimeoToken" 
                    type="password"
                    placeholder="Configuré sur le serveur"
                    disabled
                    class="flex-1"
                  />
                  <Button 
                    :icon="showToken ? 'pi pi-eye-slash' : 'pi pi-eye'"
                    @click="showToken = !showToken"
                    text
                    disabled
                  />
                </div>
                <small class="text-secondary">Le token est protégé dans l'environnement du backend.</small>
              </div>

              <div class="mt-4">
                <Button 
                  label="Géré côté serveur"
                  icon="pi pi-save"
                  @click="saveVimeoToken"
                  disabled
                />
                <Button 
                  label="Tester la connexion" 
                  icon="pi pi-check"
                  @click="testVimeoConnection"
                  outlined
                  class="ml-2"
                />
              </div>

              <Message severity="info" :closable="false" class="mt-3">
                Pour obtenir un token Vimeo, visitez : 
                <a href="https://developer.vimeo.com/apps" target="_blank" class="link">developer.vimeo.com</a>
              </Message>
            </div>
          </div>

          <!-- Video Library Settings -->
          <div v-else-if="activeTab === 'videolibrary'" class="settings-section">
            <div class="section-header">
              <div class="header-icon library">
                <i class="pi pi-play-circle"></i>
              </div>
              <div>
                <h3>Bibliothèque Vidéo</h3>
                <p class="text-secondary">Configuration de l'affichage et du comportement</p>
              </div>
            </div>
            <Divider />

            <div class="library-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <strong>Vue par défaut</strong>
                  <p>Choisir entre vue grille ou vue par modules</p>
                </div>
                <Dropdown 
                  v-model="librarySettings.defaultView" 
                  :options="viewOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-12rem"
                />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Vidéos par page</strong>
                  <p>Nombre de vidéos affichées par page</p>
                </div>
                <Dropdown 
                  v-model="librarySettings.itemsPerPage" 
                  :options="[12, 24, 48, 96]"
                  class="w-8rem"
                />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Auto-archivage depuis tickets</strong>
                  <p>Archiver automatiquement les vidéos des tickets terminés</p>
                </div>
                <InputSwitch v-model="librarySettings.autoArchive" />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Afficher les tags Vimeo</strong>
                  <p>Afficher les tags sur les cards vidéo</p>
                </div>
                <InputSwitch v-model="librarySettings.showTags" />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Lecture automatique</strong>
                  <p>Lire automatiquement la vidéo au clic</p>
                </div>
                <InputSwitch v-model="librarySettings.autoPlay" />
              </div>
            </div>

            <div class="mt-4">
              <Button 
                label="Sauvegarder les préférences" 
                icon="pi pi-save"
                @click="saveLibrarySettings"
              />
            </div>
          </div>

          <!-- Appearance Settings -->
          <div v-else-if="activeTab === 'appearance'" class="settings-section">
            <div class="section-header">
              <div class="header-icon appearance">
                <i class="pi pi-palette"></i>
              </div>
              <div>
                <h3>Apparence</h3>
                <p class="text-secondary">Personnalisez l'interface de l'application</p>
              </div>
            </div>
            <Divider />

            <div class="appearance-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <strong>Thème</strong>
                  <p>Mode clair ou mode sombre</p>
                </div>
                <Dropdown 
                  v-model="appearanceSettings.theme" 
                  :options="themeOptions"
                  optionLabel="label"
                  optionValue="value"
                  @change="applyTheme"
                  class="w-12rem"
                />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Densité d'affichage</strong>
                  <p>Espacement entre les éléments</p>
                </div>
                <Dropdown 
                  v-model="appearanceSettings.density" 
                  :options="densityOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-12rem"
                />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Taille de police</strong>
                  <p>Ajuster la taille du texte</p>
                </div>
                <Dropdown 
                  v-model="appearanceSettings.fontSize" 
                  :options="fontSizeOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-12rem"
                />
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <strong>Animations</strong>
                  <p>Activer les animations de l'interface</p>
                </div>
                <InputSwitch v-model="appearanceSettings.animations" />
              </div>
            </div>

            <div class="mt-4">
              <Button 
                label="Appliquer les changements" 
                icon="pi pi-check"
                @click="saveAppearanceSettings"
              />
            </div>
          </div>

          <!-- Profile Settings -->
          <div v-else-if="activeTab === 'profile'" class="settings-section">
                <div class="section-header">
                  <div class="header-icon profile">
                    <i class="pi pi-user"></i>
                  </div>
                  <div>
                    <h3>Profil utilisateur</h3>
                    <p class="text-secondary">Gérez vos informations personnelles</p>
                  </div>
                </div>
                <Divider />
                
                <div class="profile-info">
                  <div v-if="currentUser" class="user-card">
                    <div class="user-avatar-large">
                      {{ getInitials(currentUser.email) }}
                    </div>
                    <div class="user-details">
                      <h4>{{ currentUser.email }}</h4>
                      <span class="user-role">{{ currentUser.role || 'Utilisateur' }}</span>
                    </div>
                  </div>
                  
                  <Message severity="info" :closable="false" class="mt-3">
                    Les paramètres de profil sont gérés via Supabase Auth.
                  </Message>
                </div>
          </div>

          <!-- Notifications Settings -->
          <div v-else-if="activeTab === 'notifications'" class="settings-section">
                <div class="section-header">
                  <div class="header-icon notifications">
                    <i class="pi pi-bell"></i>
                  </div>
                  <div>
                    <h3>Notifications</h3>
                    <p class="text-secondary">Gérez vos préférences de notification</p>
                  </div>
                </div>
                <Divider />

                <div class="notification-settings">
                  <div class="setting-item">
                    <div class="setting-info">
                      <strong>Notifications de tickets</strong>
                      <p>Recevoir des notifications quand un ticket est assigné</p>
                    </div>
                    <InputSwitch v-model="notifSettings.tickets" />
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <strong>Notifications de modules</strong>
                      <p>Recevoir des notifications pour les nouveaux modules</p>
                    </div>
                    <InputSwitch v-model="notifSettings.modules" />
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <strong>Notifications email</strong>
                      <p>Recevoir des notifications par email</p>
                    </div>
                    <InputSwitch v-model="notifSettings.email" />
                  </div>
                </div>

                <div class="mt-4">
                  <Button 
                    label="Sauvegarder les préférences" 
                    icon="pi pi-save"
                    @click="saveNotificationSettings"
                  />
                </div>
          </div>

          <!-- Data Settings -->
          <div v-else-if="activeTab === 'data'" class="settings-section">
            <div class="section-header">
              <div class="header-icon data">
                <i class="pi pi-database"></i>
              </div>
              <div>
                <h3>Gestion des données</h3>
                <p class="text-secondary">Export, import et sauvegarde de vos données</p>
              </div>
            </div>
            <Divider />

            <div class="data-settings">
              <h4>Export de données</h4>
              <p class="text-secondary mb-3">Téléchargez vos données aux formats CSV ou JSON</p>
              
              <div class="export-actions">
                <Button 
                  label="Exporter la bibliothèque vidéo" 
                  icon="pi pi-download"
                  @click="exportVideoLibrary"
                  outlined
                />
                <Button 
                  label="Exporter les modules" 
                  icon="pi pi-download"
                  @click="exportModules"
                  outlined
                />
                <Button 
                  label="Exporter les préférences" 
                  icon="pi pi-download"
                  @click="exportPreferences"
                  outlined
                />
              </div>

              <Divider />

              <h4>Statistiques</h4>
              <div class="stats-grid">
                <div class="stat-box">
                  <i class="pi pi-video"></i>
                  <div>
                    <span class="stat-value">{{ dataStats.videos }}</span>
                    <span class="stat-label">Vidéos</span>
                  </div>
                </div>
                <div class="stat-box">
                  <i class="pi pi-book"></i>
                  <div>
                    <span class="stat-value">{{ dataStats.modules }}</span>
                    <span class="stat-label">Modules</span>
                  </div>
                </div>
                <div class="stat-box">
                  <i class="pi pi-tag"></i>
                  <div>
                    <span class="stat-value">{{ dataStats.tags }}</span>
                    <span class="stat-label">Tags</span>
                  </div>
                </div>
                <div class="stat-box">
                  <i class="pi pi-ticket"></i>
                  <div>
                    <span class="stat-value">{{ dataStats.tickets }}</span>
                    <span class="stat-label">Tickets</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Advanced Settings -->
          <div v-else-if="activeTab === 'advanced'" class="settings-section">
                <div class="section-header">
                  <div class="header-icon advanced">
                    <i class="pi pi-sliders-h"></i>
                  </div>
                  <div>
                    <h3>Paramètres avancés</h3>
                    <p class="text-secondary">Options de développement et debugging</p>
                  </div>
                </div>
                <Divider />

                <div class="advanced-settings">
                  <div class="setting-item">
                    <div class="setting-info">
                      <strong>Mode développement</strong>
                      <p>Afficher les logs détaillés dans la console</p>
                    </div>
                    <InputSwitch v-model="advancedSettings.devMode" />
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <strong>Cache local</strong>
                      <p>Utiliser le cache pour améliorer les performances</p>
                    </div>
                    <InputSwitch v-model="advancedSettings.cache" />
                  </div>

                  <Divider />

                  <div class="danger-zone">
                    <h4>Zone de danger</h4>
                    <p class="text-secondary mb-3">Actions irréversibles</p>
                    
                    <div class="danger-actions">
                      <Button 
                        label="Vider le cache" 
                        icon="pi pi-trash"
                        @click="clearCache"
                        outlined
                        severity="warning"
                      />
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Toast />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import GitHubSettings from '@/components/admin/GitHubSettings.vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'
import { supabase } from '@/supabase'
import { testVimeoAuth } from '@/service/vimeoService'

const router = useRouter()
const toast = useToast()

const activeTab = ref('github')
const currentUser = ref(null)

// Vimeo
const vimeoToken = ref('')
const showToken = ref(false)

// Bibliothèque vidéo
const librarySettings = ref({
  defaultView: 'grid',
  itemsPerPage: 24,
  autoArchive: true,
  showTags: true,
  autoPlay: false
})

const viewOptions = [
  { label: 'Vue grille', value: 'grid' },
  { label: 'Vue par modules', value: 'modules' }
]

// Apparence
const appearanceSettings = ref({
  theme: 'light',
  density: 'normal',
  fontSize: 'medium',
  animations: true
})

const themeOptions = [
  { label: 'Clair', value: 'light' },
  { label: 'Sombre', value: 'dark' },
  { label: 'Auto (système)', value: 'auto' }
]

const densityOptions = [
  { label: 'Compact', value: 'compact' },
  { label: 'Normal', value: 'normal' },
  { label: 'Confortable', value: 'comfortable' }
]

const fontSizeOptions = [
  { label: 'Petit', value: 'small' },
  { label: 'Moyen', value: 'medium' },
  { label: 'Grand', value: 'large' }
]

// Statistiques
const dataStats = ref({
  videos: 0,
  modules: 0,
  tags: 0,
  tickets: 0
})

// Paramètres de notifications
const notifSettings = ref({
  tickets: true,
  modules: true,
  email: false
})

// Paramètres avancés
const advancedSettings = ref({
  devMode: false,
  cache: true
})

// Charger l'utilisateur actuel
onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  currentUser.value = user

  // Charger les préférences depuis localStorage
  loadSettings()
  
  // Charger les statistiques
  await loadDataStats()
})

// Charger les paramètres
function loadSettings() {
  // Vimeo
  const savedToken = null
  if (savedToken) {
    vimeoToken.value = savedToken
  }

  // Bibliothèque
  const savedLibrary = localStorage.getItem('library_settings')
  if (savedLibrary) {
    librarySettings.value = JSON.parse(savedLibrary)
  }

  // Apparence
  const savedAppearance = localStorage.getItem('appearance_settings')
  if (savedAppearance) {
    appearanceSettings.value = JSON.parse(savedAppearance)
  }

  // Notifications
  const savedNotif = localStorage.getItem('notification_settings')
  if (savedNotif) {
    notifSettings.value = JSON.parse(savedNotif)
  }

  // Avancé
  const savedAdvanced = localStorage.getItem('advanced_settings')
  if (savedAdvanced) {
    advancedSettings.value = JSON.parse(savedAdvanced)
  }
}

// Charger les statistiques
async function loadDataStats() {
  try {
    // Compter les vidéos
    const { count: videoCount } = await supabase
      .from('video_library')
      .select('*', { count: 'exact', head: true })
    
    // Compter les modules
    const { count: moduleCount } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
    
    dataStats.value.videos = videoCount || 0
    dataStats.value.modules = moduleCount || 0
    dataStats.value.tags = 0 // À calculer si nécessaire
    dataStats.value.tickets = 0 // À calculer si nécessaire
  } catch (error) {
    console.error('Erreur chargement stats:', error)
  }
}

// === VIMEO ===
function saveVimeoToken() {
  // Vimeo credentials are configured server-side only.
  
  toast.add({
    severity: 'success',
    summary: 'Token sauvegardé',
    detail: 'Le token Vimeo a été enregistré',
    life: 3000
  })
}

async function testVimeoConnection() {
  try {
    const result = await testVimeoAuth()

    if (result.ok) {
      const data = { name: result.user?.name || 'Vimeo' }
      toast.add({
        severity: 'success',
        summary: 'Connexion réussie',
        detail: `Connecté en tant que ${data.name}`,
        life: 3000
      })
    } else {
      throw new Error('Token invalide')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Échec de la connexion',
      detail: 'Vérifiez votre token Vimeo',
      life: 4000
    })
  }
}

// === BIBLIOTHÈQUE VIDÉO ===
function saveLibrarySettings() {
  localStorage.setItem('library_settings', JSON.stringify(librarySettings.value))
  
  toast.add({
    severity: 'success',
    summary: 'Paramètres sauvegardés',
    detail: 'Vos préférences de bibliothèque ont été enregistrées',
    life: 3000
  })
}

// === APPARENCE ===
function saveAppearanceSettings() {
  localStorage.setItem('appearance_settings', JSON.stringify(appearanceSettings.value))
  applyTheme()
  
  toast.add({
    severity: 'success',
    summary: 'Apparence mise à jour',
    detail: 'Vos préférences d\'apparence ont été appliquées',
    life: 3000
  })
}

function applyTheme() {
  const theme = appearanceSettings.value.theme
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-mode')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark-mode')
  } else if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }
}

// === EXPORT DE DONNÉES ===
async function exportVideoLibrary() {
  try {
    const { data, error } = await supabase
      .from('video_library')
      .select('*')
    
    if (error) throw error
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `video_library_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: 'Bibliothèque vidéo exportée',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur export:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exporter les données',
      life: 4000
    })
  }
}

async function exportModules() {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
    
    if (error) throw error
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `modules_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: 'Modules exportés',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur export:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exporter les modules',
      life: 4000
    })
  }
}

function exportPreferences() {
  const prefs = {
    library: librarySettings.value,
    appearance: appearanceSettings.value,
    notifications: notifSettings.value,
    advanced: advancedSettings.value
  }
  
  const json = JSON.stringify(prefs, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `preferences_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  
  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: 'Préférences exportées',
    life: 3000
  })
}

// Sauvegarder les paramètres de notifications
function saveNotificationSettings() {
  localStorage.setItem('notification_settings', JSON.stringify(notifSettings.value))
  
  toast.add({
    severity: 'success',
    summary: 'Paramètres sauvegardés',
    detail: 'Vos préférences de notification ont été enregistrées',
    life: 3000
  })
}

// Vider le cache
function clearCache() {
  const keysToKeep = ['notification_settings', 'advanced_settings']
  const allKeys = Object.keys(localStorage)
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key)
    }
  })
  
  toast.add({
    severity: 'success',
    summary: 'Cache vidé',
    detail: 'Le cache local a été supprimé',
    life: 3000
  })
}

// Obtenir les initiales
function getInitials(email) {
  if (!email) return 'U'
  return email.substring(0, 2).toUpperCase()
}
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  min-height: 100vh;
}

.settings-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-header {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  border: 1px solid var(--surface-border);
}

.title-section h1 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  color: var(--text-color);
}

.title-section p {
  margin: 0.5rem 0 0 0;
}

.settings-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
}

/* Menu latéral */
.settings-menu {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.menu-section {
  margin-bottom: 1.5rem;
}

.menu-section:last-child {
  margin-bottom: 0;
}

.menu-section-title {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color-secondary);
  padding: 0.5rem 1rem;
  margin-bottom: 0.25rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-color);
  font-size: 0.938rem;
}

.menu-item:hover {
  background: var(--surface-hover);
}

.menu-item.active {
  background: var(--primary-color);
  color: white;
  font-weight: 500;
}

.menu-item i {
  font-size: 1.125rem;
}

/* Panneau de contenu */
.settings-panel {
  background: var(--surface-card);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  min-height: 600px;
}

.settings-section {
  padding: 1.5rem;
}

.section-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.header-icon.vimeo {
  background: linear-gradient(135deg, #1ab7ea 0%, #0088cc 100%);
}

.header-icon.profile {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.header-icon.notifications {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.header-icon.advanced {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.header-icon.library {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.header-icon.appearance {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
}

.header-icon.data {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.text-secondary {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

/* Profile */
.user-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: var(--surface-50);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.user-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
}

.user-details h4 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.user-role {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: 12px;
  font-size: 0.813rem;
  font-weight: 500;
}

/* Settings items */
.notification-settings,
.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: var(--surface-50);
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

.setting-item:hover {
  background: var(--surface-100);
  border-color: var(--primary-color);
}

.setting-info strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-color);
  font-size: 0.938rem;
}

.setting-info p {
  margin: 0;
  font-size: 0.813rem;
  color: var(--text-color-secondary);
}

/* Danger zone */
.danger-zone {
  margin-top: 2rem;
  padding: 1.75rem;
  border: 2px solid rgba(239, 68, 68, 0.4);
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.danger-zone h4 {
  margin: 0 0 0.25rem 0;
  color: var(--red-600);
  font-size: 1rem;
}

.danger-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Vimeo config */
.vimeo-config {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-item label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

/* Library & Appearance settings */
.library-settings,
.appearance-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Data settings */
.data-settings h4 {
  margin: 1.5rem 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-color);
}

.export-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--surface-50);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.stat-box i {
  font-size: 2rem;
  color: var(--primary-color);
}

.stat-box > div {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

/* Utility classes */
.flex-1 {
  flex: 1;
}

.w-8rem {
  width: 8rem;
}

.w-12rem {
  width: 12rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 992px) {
  .settings-content {
    grid-template-columns: 1fr;
  }

  .settings-menu {
    position: static;
  }

  .export-actions {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
