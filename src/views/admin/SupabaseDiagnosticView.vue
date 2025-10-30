<template>
  <div class="diagnostic-page">
    <Navbar />
    
    <div class="diagnostic-container">
      <div class="diagnostic-header">
        <h1><i class="pi pi-shield-check"></i> Diagnostic Supabase</h1>
        <p>Vérification de la configuration et de la connexion Supabase</p>
      </div>

      <div class="diagnostic-actions">
        <Button 
          label="Lancer le diagnostic" 
          icon="pi pi-play" 
          @click="runDiagnostic"
          :loading="running"
          severity="primary"
        />
        <Button 
          label="Test inscription" 
          icon="pi pi-user-plus" 
          @click="testSignup"
          :loading="testingSignup"
          severity="info"
          :disabled="!canTest"
        />
        <Button 
          label="Voir logs" 
          icon="pi pi-book" 
          @click="showLogs = !showLogs"
          :severity="showLogs ? 'secondary' : 'help'"
        />
      </div>

      <!-- Résultats du diagnostic -->
      <div v-if="diagnosticResults" class="diagnostic-results">
        <Card>
          <template #title>
            <i :class="diagnosticResults.overall ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"></i>
            {{ diagnosticResults.overall ? 'Diagnostic Réussi' : 'Problèmes Détectés' }}
          </template>
          <template #content>
            <!-- Configuration -->
            <div class="diagnostic-section">
              <h3>
                <i :class="diagnosticResults.config.status ? 'pi pi-check' : 'pi pi-times'"></i>
                Configuration
              </h3>
              <div class="diagnostic-item">
                <span>URL Supabase:</span>
                <Tag :severity="diagnosticResults.config.url ? 'success' : 'danger'">
                  {{ diagnosticResults.config.urlValue || 'Non définie' }}
                </Tag>
              </div>
              <div class="diagnostic-item">
                <span>Clé Anon:</span>
                <Tag :severity="diagnosticResults.config.key ? 'success' : 'danger'">
                  {{ diagnosticResults.config.keyPreview || 'Non définie' }}
                </Tag>
              </div>
            </div>

            <!-- Connexion serveur -->
            <div class="diagnostic-section">
              <h3>
                <i :class="diagnosticResults.connection.status ? 'pi pi-check' : 'pi pi-times'"></i>
                Connexion Serveur
              </h3>
              <Message v-if="diagnosticResults.connection.status" severity="success">
                Serveur Supabase accessible
              </Message>
              <Message v-else severity="error">
                {{ diagnosticResults.connection.error }}
              </Message>
            </div>

            <!-- Service Auth -->
            <div class="diagnostic-section">
              <h3>
                <i :class="diagnosticResults.auth.status ? 'pi pi-check' : 'pi pi-times'"></i>
                Service Auth
              </h3>
              <Message v-if="diagnosticResults.auth.status" severity="success">
                Service d'authentification opérationnel
              </Message>
              <Message v-else severity="error">
                {{ diagnosticResults.auth.error }}
              </Message>
            </div>

            <!-- Recommandations -->
            <div v-if="diagnosticResults.recommendations.length > 0" class="diagnostic-section">
              <h3><i class="pi pi-lightbulb"></i> Recommandations</h3>
              <ul class="recommendations-list">
                <li v-for="(rec, idx) in diagnosticResults.recommendations" :key="idx">
                  {{ rec }}
                </li>
              </ul>
            </div>
          </template>
        </Card>
      </div>

      <!-- Test d'inscription -->
      <div v-if="signupTestResult" class="signup-test-results">
        <Card>
          <template #title>
            <i :class="signupTestResult.success ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"></i>
            {{ signupTestResult.success ? 'Test d\'inscription réussi' : 'Échec du test d\'inscription' }}
          </template>
          <template #content>
            <div v-if="signupTestResult.success">
              <p><strong>Email test:</strong> {{ signupTestResult.email }}</p>
              <p><strong>User ID:</strong> {{ signupTestResult.userId }}</p>
              <Message severity="success">
                L'inscription fonctionne correctement !
              </Message>
            </div>
            <div v-else>
              <Message severity="error">
                <strong>Erreur:</strong> {{ signupTestResult.error }}
              </Message>
              <div v-if="signupTestResult.solution" class="mt-3">
                <h4>💡 Solution:</h4>
                <p>{{ signupTestResult.solution }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Logs détaillés -->
      <div v-if="showLogs && logs.length > 0" class="diagnostic-logs">
        <Card>
          <template #title>
            <i class="pi pi-list"></i> Logs Détaillés
          </template>
          <template #content>
            <div v-for="(log, idx) in logs" :key="idx" class="log-entry" :class="log.type">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </template>
        </Card>
      </div>

      <!-- Documentation -->
      <Card class="mt-4">
        <template #title>
          <i class="pi pi-info-circle"></i> Documentation
        </template>
        <template #content>
          <p>Pour plus d'informations sur la résolution des problèmes Supabase, consultez :</p>
          <ul>
            <li><a href="file:///C:/Users/antoine.quarroz/Desktop/LabDev/pfpheds/SUPABASE_SIGNUP_FIX.md" target="_blank">Guide de résolution SUPABASE_SIGNUP_FIX.md</a></li>
            <li><a href="https://supabase.com/docs/guides/auth" target="_blank">Documentation officielle Supabase Auth</a></li>
          </ul>
          
          <Divider />
          
          <h4>Commandes utiles :</h4>
          <pre class="command-box">npm run test:supabase</pre>
          <pre class="command-box">npx supabase start</pre>
          <pre class="command-box">npx supabase logs auth</pre>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import Navbar from '@/components/common/utils/Navbar.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

const running = ref(false)
const testingSignup = ref(false)
const showLogs = ref(false)
const diagnosticResults = ref(null)
const signupTestResult = ref(null)
const logs = ref([])

const canTest = computed(() => {
  return diagnosticResults.value?.overall === true
})

const addLog = (message, type = 'info') => {
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
}

const runDiagnostic = async () => {
  running.value = true
  diagnosticResults.value = null
  logs.value = []
  
  addLog('Démarrage du diagnostic...', 'info')
  
  const results = {
    overall: true,
    config: { status: false },
    connection: { status: false },
    auth: { status: false },
    recommendations: []
  }
  
  // 1. Vérifier configuration
  addLog('Vérification de la configuration...', 'info')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
  
  results.config.url = !!supabaseUrl
  results.config.key = !!supabaseKey
  results.config.urlValue = supabaseUrl || 'Non définie'
  results.config.keyPreview = supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Non définie'
  results.config.status = results.config.url && results.config.key
  
  if (!results.config.status) {
    results.overall = false
    results.recommendations.push('Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_KEY sont définis dans .env')
    addLog('❌ Configuration incomplète', 'error')
  } else {
    addLog('✅ Configuration OK', 'success')
  }
  
  // 2. Test connexion serveur
  addLog('Test de connexion au serveur...', 'info')
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error && error.code !== 'PGRST116' && !error.message.includes('does not exist')) {
      results.connection.status = false
      results.connection.error = error.message
      results.overall = false
      results.recommendations.push('Vérifiez que Supabase est démarré (Docker ou Cloud)')
      addLog(`❌ Erreur de connexion: ${error.message}`, 'error')
    } else {
      results.connection.status = true
      addLog('✅ Serveur accessible', 'success')
      
      if (error?.message.includes('does not exist')) {
        results.recommendations.push('Exécutez la migration FIX_auth_signup.sql pour créer la table user_profiles')
        addLog('⚠️ Table user_profiles inexistante', 'warn')
      }
    }
  } catch (e) {
    results.connection.status = false
    results.connection.error = e.message
    results.overall = false
    results.recommendations.push('Impossible de se connecter à Supabase. Vérifiez que Docker est démarré.')
    addLog(`❌ Exception: ${e.message}`, 'error')
  }
  
  // 3. Test service Auth
  if (results.connection.status) {
    addLog('Test du service Auth...', 'info')
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        results.auth.status = false
        results.auth.error = error.message
        results.overall = false
        addLog(`❌ Erreur Auth: ${error.message}`, 'error')
      } else {
        results.auth.status = true
        addLog('✅ Service Auth opérationnel', 'success')
      }
    } catch (e) {
      results.auth.status = false
      results.auth.error = e.message
      results.overall = false
      addLog(`❌ Exception Auth: ${e.message}`, 'error')
    }
  }
  
  diagnosticResults.value = results
  running.value = false
  
  if (results.overall) {
    addLog('🎉 Diagnostic terminé avec succès', 'success')
  } else {
    addLog('⚠️ Diagnostic terminé avec des erreurs', 'warn')
  }
}

const testSignup = async () => {
  testingSignup.value = true
  signupTestResult.value = null
  logs.value = []
  
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'Test1234!'
  
  addLog(`Test d'inscription avec ${testEmail}...`, 'info')
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error')
      
      let solution = null
      
      if (error.message.includes('Email signups are disabled')) {
        solution = 'Activez les inscriptions dans Supabase Dashboard → Authentication → Settings → Enable email signups'
      } else if (error.message.includes('API error happened')) {
        solution = 'Vérifiez que Docker Supabase est démarré et que l\'URL dans .env est correcte'
      } else if (error.message.includes('rate limit')) {
        solution = 'Trop de tentatives. Attendez 1 heure ou utilisez un autre email.'
      }
      
      signupTestResult.value = {
        success: false,
        error: error.message,
        code: error.code,
        solution
      }
    } else if (data.user) {
      addLog(`✅ Inscription réussie! User ID: ${data.user.id}`, 'success')
      
      signupTestResult.value = {
        success: true,
        email: testEmail,
        userId: data.user.id,
        hasSession: !!data.session
      }
    }
  } catch (e) {
    addLog(`❌ Exception: ${e.message}`, 'error')
    
    signupTestResult.value = {
      success: false,
      error: e.message
    }
  }
  
  testingSignup.value = false
}
</script>

<style scoped>
.diagnostic-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.diagnostic-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.diagnostic-header {
  text-align: center;
  margin-bottom: 2rem;
}

.diagnostic-header h1 {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.diagnostic-header h1 i {
  margin-right: 1rem;
}

.diagnostic-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.diagnostic-results,
.signup-test-results,
.diagnostic-logs {
  margin-bottom: 2rem;
}

.diagnostic-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-left: 3px solid var(--primary-color);
  background: var(--surface-50);
  border-radius: 6px;
}

.diagnostic-section h3 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.diagnostic-section h3 i {
  margin-right: 0.5rem;
}

.diagnostic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.recommendations-list {
  list-style: none;
  padding: 0;
}

.recommendations-list li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.recommendations-list li::before {
  content: '💡';
  position: absolute;
  left: 0;
}

.log-entry {
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  border-left: 3px solid #ccc;
  font-family: monospace;
  font-size: 0.9rem;
}

.log-entry.success {
  border-left-color: var(--green-500);
  background: var(--green-50);
}

.log-entry.error {
  border-left-color: var(--red-500);
  background: var(--red-50);
}

.log-entry.warn {
  border-left-color: var(--orange-500);
  background: var(--orange-50);
}

.log-time {
  color: var(--text-color-secondary);
  margin-right: 1rem;
}

.command-box {
  background: var(--surface-900);
  color: var(--surface-0);
  padding: 1rem;
  border-radius: 6px;
  margin: 0.5rem 0;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .diagnostic-container {
    padding: 1rem;
  }
  
  .diagnostic-header h1 {
    font-size: 1.8rem;
  }
  
  .diagnostic-actions {
    flex-direction: column;
  }
}
</style>
