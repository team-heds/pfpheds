<template>
  <Navbar />
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
            <Message severity="info" :closable="false">
              La configuration Vimeo est gérée dans la section Admin → Modules
            </Message>
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
                      <Button 
                        label="Supprimer les tokens" 
                        icon="pi pi-key"
                        @click="clearTokens"
                        outlined
                        severity="danger"
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import GitHubSettings from '@/components/admin/GitHubSettings.vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import InputSwitch from 'primevue/inputswitch'
import Toast from 'primevue/toast'
import { supabase } from '@/supabase'

const router = useRouter()
const toast = useToast()

const activeTab = ref('github')
const currentUser = ref(null)

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
})

// Charger les paramètres
function loadSettings() {
  const savedNotif = localStorage.getItem('notification_settings')
  if (savedNotif) {
    notifSettings.value = JSON.parse(savedNotif)
  }

  const savedAdvanced = localStorage.getItem('advanced_settings')
  if (savedAdvanced) {
    advancedSettings.value = JSON.parse(savedAdvanced)
  }
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
  // Vider certaines clés du localStorage (pas le token GitHub)
  const keysToKeep = ['github_token', 'notification_settings', 'advanced_settings']
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

// Supprimer tous les tokens
function clearTokens() {
  localStorage.removeItem('github_token')
  
  toast.add({
    severity: 'warn',
    summary: 'Tokens supprimés',
    detail: 'Tous les tokens d\'intégration ont été supprimés',
    life: 3000
  })
  
  // Recharger la page
  setTimeout(() => {
    window.location.reload()
  }, 1000)
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

/* Responsive */
@media (max-width: 992px) {
  .settings-content {
    grid-template-columns: 1fr;
  }

  .settings-menu {
    position: static;
  }
}
</style>
