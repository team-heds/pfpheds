<template>
  <div class="github-settings">
    <div class="settings-header">
      <div class="header-icon">
        <i class="pi pi-github"></i>
      </div>
      <div>
        <h3>Configuration GitHub</h3>
        <p class="text-secondary">Connectez votre compte GitHub pour créer des branches automatiquement</p>
      </div>
    </div>

    <Divider />

    <!-- État de la connexion -->
    <div v-if="userInfo" class="connection-status connected">
      <div class="status-icon">
        <i class="pi pi-check-circle"></i>
      </div>
      <div class="status-content">
        <div class="user-info">
          <img :src="userInfo.avatar" :alt="userInfo.username" class="user-avatar" />
          <div>
            <strong>{{ userInfo.name || userInfo.username }}</strong>
            <span class="username">@{{ userInfo.username }}</span>
          </div>
        </div>
        <Button 
          label="Déconnecter" 
          icon="pi pi-sign-out"
          @click="disconnect"
          outlined
          severity="secondary"
          size="small"
        />
      </div>
    </div>

    <div v-else class="connection-status disconnected">
      <div class="status-icon">
        <i class="pi pi-times-circle"></i>
      </div>
      <div class="status-content">
        <span>Non connecté à GitHub</span>
      </div>
    </div>

    <Divider />

    <!-- Formulaire de configuration -->
    <div class="config-form">
      <h4>Personal Access Token (PAT)</h4>
      <p class="help-text">
        <i class="pi pi-info-circle"></i>
        Créez un token sur 
        <a href="https://github.com/settings/tokens/new" target="_blank" class="link">
          GitHub Settings → Tokens (classic)
        </a>
      </p>

      <Message severity="info" :closable="false" class="mb-3">
        <strong>Permissions requises :</strong>
        <ul class="permissions-list">
          <li><code>repo</code> - Accès complet aux repositories</li>
          <li><code>workflow</code> - Mettre à jour les workflows GitHub Actions (optionnel)</li>
        </ul>
      </Message>

      <div class="field">
        <label for="github-token">GitHub Token</label>
        <div class="token-input-group">
          <Password 
            id="github-token"
            v-model="token" 
            placeholder="ghp_xxxxxxxxxxxxxxxxxx"
            toggleMask
            :feedback="false"
            class="w-full"
          />
        </div>
      </div>

      <div class="actions">
        <Button 
          label="Tester la connexion" 
          icon="pi pi-bolt"
          @click="testConnection"
          :loading="testing"
          outlined
        />
        <Button 
          label="Sauvegarder" 
          icon="pi pi-save"
          @click="saveToken"
          :disabled="!token || !token.trim()"
        />
      </div>
    </div>

    <!-- Guide rapide -->
    <Divider />
    
    <div class="quick-guide">
      <h4>Guide rapide</h4>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <strong>Créer un token</strong>
            <p>Allez sur GitHub → Settings → Developer settings → Personal access tokens</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <strong>Sélectionner les permissions</strong>
            <p>Cochez au minimum : <code>repo</code></p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <strong>Copier le token</strong>
            <p>Copiez le token et collez-le dans le champ ci-dessus</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Password from 'primevue/password'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'
import { getGitHubToken, setGitHubToken, verifyToken } from '@/service/githubService'

const toast = useToast()

const token = ref('')
const userInfo = ref(null)
const testing = ref(false)

// Charger le token au montage
onMounted(async () => {
  const savedToken = getGitHubToken()
  if (savedToken) {
    token.value = savedToken
    await loadUserInfo(savedToken)
  }
})

// Charger les infos utilisateur
async function loadUserInfo(tokenToVerify) {
  try {
    const result = await verifyToken(tokenToVerify)
    if (result.valid) {
      userInfo.value = result
    } else {
      userInfo.value = null
    }
  } catch (error) {
    userInfo.value = null
  }
}

// Tester la connexion
async function testConnection() {
  if (!token.value || !token.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Token manquant',
      detail: 'Veuillez entrer un token GitHub',
      life: 3000
    })
    return
  }

  testing.value = true
  
  try {
    const result = await verifyToken(token.value)
    
    if (result.valid) {
      userInfo.value = result
      toast.add({
        severity: 'success',
        summary: 'Connexion réussie !',
        detail: `Connecté en tant que @${result.username}`,
        life: 4000
      })
    } else {
      userInfo.value = null
      toast.add({
        severity: 'error',
        summary: 'Token invalide',
        detail: result.error || 'Le token GitHub n\'est pas valide',
        life: 4000
      })
    }
  } catch (error) {
    console.error('[GitHubSettings] Erreur test connexion:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Impossible de se connecter à GitHub',
      life: 4000
    })
  } finally {
    testing.value = false
  }
}

// Sauvegarder le token
async function saveToken() {
  if (!token.value || !token.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Token manquant',
      detail: 'Veuillez entrer un token GitHub',
      life: 3000
    })
    return
  }

  // Tester d'abord
  testing.value = true
  
  try {
    const result = await verifyToken(token.value)
    
    if (result.valid) {
      setGitHubToken(token.value)
      userInfo.value = result
      
      toast.add({
        severity: 'success',
        summary: 'Token sauvegardé',
        detail: 'Votre token GitHub a été enregistré avec succès',
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Token invalide',
        detail: 'Impossible de sauvegarder un token invalide',
        life: 4000
      })
    }
  } catch (error) {
    console.error('[GitHubSettings] Erreur sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Impossible de sauvegarder le token',
      life: 4000
    })
  } finally {
    testing.value = false
  }
}

// Déconnecter
function disconnect() {
  setGitHubToken(null)
  token.value = ''
  userInfo.value = null
  
  toast.add({
    severity: 'info',
    summary: 'Déconnecté',
    detail: 'Votre token GitHub a été supprimé',
    life: 3000
  })
}
</script>

<style scoped>
.github-settings {
  padding: 2rem;
  color: var(--text-color);
}

.settings-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #24292e 0%, #1a1e22 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.settings-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
}

.text-secondary {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.connection-status {
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 2px solid transparent;
}

.connection-status.connected {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.connection-status.disconnected {
  background: rgba(107, 114, 128, 0.1);
  border-color: rgba(107, 114, 128, 0.3);
}

.status-icon {
  font-size: 1.5rem;
}

.connected .status-icon {
  color: var(--green-600);
}

.disconnected .status-icon {
  color: var(--text-color-secondary);
}

.status-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--green-500);
}

.user-info strong {
  display: block;
  font-size: 0.938rem;
  color: var(--text-color);
}

.username {
  font-size: 0.813rem;
  color: var(--text-color-secondary);
}

.config-form h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.help-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.25rem 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.help-text .pi {
  color: var(--primary-color);
}

.link {
  color: var(--primary-color);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.permissions-list {
  margin: 0.75rem 0 0 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
  line-height: 1.8;
}

.permissions-list li {
  margin-bottom: 0.5rem;
}

.permissions-list code {
  background: rgba(0,0,0,0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: var(--primary-color);
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.938rem;
}

.token-input-group {
  display: flex;
  gap: 0.5rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.quick-guide h4 {
  margin: 0 0 1.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 10px;
  border: 1px solid var(--surface-border);
}

.step-number {
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

.step-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.step-content code {
  background: rgba(0,0,0,0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.813rem;
  font-weight: 600;
  color: var(--primary-color);
}
</style>
