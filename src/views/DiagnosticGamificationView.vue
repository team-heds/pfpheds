<template>
  <div class="diagnostic-container">
    <!-- Header -->
    <div class="diagnostic-header">
      <h1 class="diagnostic-title">
        <i class="pi pi-cog"></i>
        Diagnostic Gamification Supabase
      </h1>
      <p class="diagnostic-subtitle">
        Tests des permissions et fonctionnalités gamification
      </p>
    </div>

    <!-- Controls -->
    <div class="diagnostic-controls">
      <Button 
        @click="runDiagnostic" 
        :loading="isRunning"
        :disabled="isRunning"
        class="diagnostic-btn"
        icon="pi pi-play"
        label="🚀 Lancer le diagnostic"
        severity="success"
      />
      
      <Button 
        @click="clearResults" 
        :disabled="isRunning || results.length === 0"
        class="diagnostic-btn"
        icon="pi pi-trash"
        label="🗑️ Effacer"
        severity="secondary"
        outlined
      />
    </div>

    <!-- Progress -->
    <div v-if="isRunning" class="diagnostic-progress">
      <ProgressBar :value="progress" class="progress-bar" />
      <p class="progress-text">{{ currentTest }}</p>
    </div>

    <!-- Results -->
    <div v-if="results.length > 0" class="diagnostic-results">
      <h2 class="results-title">📊 Résultats du diagnostic</h2>
      
      <div class="test-results">
        <div 
          v-for="(result, index) in results" 
          :key="index"
          class="test-result"
          :class="{ 'test-success': result.success, 'test-error': !result.success }"
        >
          <div class="test-header">
            <div class="test-status">
              <i :class="result.success ? 'pi pi-check-circle success-icon' : 'pi pi-times-circle error-icon'"></i>
              <span class="test-name">{{ result.name }}</span>
            </div>
            <Badge 
              :value="result.success ? 'SUCCÈS' : 'ÉCHEC'" 
              :severity="result.success ? 'success' : 'danger'"
            />
          </div>
          
          <div class="test-details">
            <p class="test-description">{{ result.description }}</p>
            
            <!-- Success details -->
            <div v-if="result.success && result.data" class="test-data">
              <h4>✅ Données récupérées :</h4>
              <pre class="data-preview">{{ formatData(result.data) }}</pre>
            </div>
            
            <!-- Error details -->
            <div v-if="!result.success" class="test-error-details">
              <h4>❌ Erreur détectée :</h4>
              <div class="error-info">
                <p><strong>Message :</strong> {{ result.error }}</p>
                <p v-if="result.errorCode"><strong>Code :</strong> {{ result.errorCode }}</p>
                <p v-if="result.errorDetails"><strong>Détails :</strong> {{ result.errorDetails }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="diagnostic-summary">
        <div class="summary-stats">
          <div class="stat-item success">
            <i class="pi pi-check-circle"></i>
            <span>{{ successCount }} tests réussis</span>
          </div>
          <div class="stat-item error">
            <i class="pi pi-times-circle"></i>
            <span>{{ errorCount }} tests échoués</span>
          </div>
        </div>
        
        <div class="summary-message" :class="{ 'all-success': errorCount === 0, 'has-errors': errorCount > 0 }">
          <p v-if="errorCount === 0">
            🎉 <strong>Tous les tests sont passés !</strong> La gamification Supabase est opérationnelle.
          </p>
          <p v-else>
            ⚠️ <strong>{{ errorCount }} test(s) échoué(s).</strong> Vérifiez les erreurs ci-dessus.
          </p>
        </div>
      </div>
    </div>

    <!-- No results message -->
    <div v-if="!isRunning && results.length === 0" class="no-results">
      <i class="pi pi-info-circle"></i>
      <p>Aucun diagnostic lancé. Cliquez sur "Lancer le diagnostic" pour commencer.</p>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'DiagnosticGamificationView',
  setup() {
    const isRunning = ref(false)
    const results = ref([])
    const progress = ref(0)
    const currentTest = ref('')

    const successCount = computed(() => results.value.filter(r => r.success).length)
    const errorCount = computed(() => results.value.filter(r => !r.success).length)

    const formatData = (data) => {
      if (Array.isArray(data)) {
        return `Array(${data.length}) - ${data.length > 0 ? 'Premiers éléments:' : 'Vide'}\n${JSON.stringify(data.slice(0, 2), null, 2)}`
      }
      return JSON.stringify(data, null, 2)
    }

    const clearResults = () => {
      results.value = []
      progress.value = 0
      currentTest.value = ''
    }

    const updateProgress = (step, total, testName) => {
      progress.value = (step / total) * 100
      currentTest.value = testName
    }

    const runDiagnostic = async () => {
      isRunning.value = true
      results.value = []
      
      const tests = [
        {
          name: 'Test 1 - Authentification utilisateur',
          description: 'Vérification de la session utilisateur Supabase',
          test: testAuthentication
        },
        {
          name: 'Test 2 - Lecture table houses',
          description: 'Test de lecture des maisons disponibles',
          test: testHousesRead
        },
        {
          name: 'Test 3 - Lecture table gamification_data',
          description: 'Test de lecture des données gamification utilisateur',
          test: testGamificationRead
        },
        {
          name: 'Test 4 - Insertion gamification_data',
          description: 'Test d\'insertion de données gamification',
          test: testGamificationInsert
        }
      ]

      for (let i = 0; i < tests.length; i++) {
        const test = tests[i]
        updateProgress(i + 1, tests.length, test.name)
        
        try {
          const result = await test.test()
          results.value.push({
            name: test.name,
            description: test.description,
            success: true,
            data: result
          })
        } catch (error) {
          results.value.push({
            name: test.name,
            description: test.description,
            success: false,
            error: error.message || 'Erreur inconnue',
            errorCode: error.code,
            errorDetails: error.details || error.hint
          })
        }
        
        // Pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      isRunning.value = false
      currentTest.value = 'Diagnostic terminé'
    }

    // Tests individuels
    const testAuthentication = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      if (!user) throw new Error('Aucun utilisateur connecté')
      
      return {
        user_id: user.id,
        email: user.email,
        authenticated: true
      }
    }

    const testHousesRead = async () => {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
      
      if (error) throw error
      return data
    }

    const testGamificationRead = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase
        .from('gamification_data')
        .select('*')
        .eq('user_id', user.id)
      
      if (error) throw error
      return data
    }

    const testGamificationInsert = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      // Test d'insertion avec données temporaires
      const testData = {
        user_id: user.id,
        email: user.email,
        total_xp: 10,
        current_level: 1,
        house_id: '550e8400-e29b-41d4-a716-446655440004', // Solencia
        house_points: 10,
        gamification_metadata: { test: true, timestamp: new Date().toISOString() }
      }

      const { data, error } = await supabase
        .from('gamification_data')
        .upsert(testData, { onConflict: 'user_id' })
        .select()
        .single()
      
      if (error) throw error
      return data
    }

    return {
      isRunning,
      results,
      progress,
      currentTest,
      successCount,
      errorCount,
      formatData,
      runDiagnostic,
      clearResults
    }
  }
}
</script>

<style scoped>
.diagnostic-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.diagnostic-header {
  text-align: center;
  margin-bottom: 2rem;
}

.diagnostic-title {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.diagnostic-subtitle {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.diagnostic-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.diagnostic-btn {
  min-width: 200px;
}

.diagnostic-progress {
  margin-bottom: 2rem;
}

.progress-bar {
  margin-bottom: 1rem;
}

.progress-text {
  text-align: center;
  font-weight: 500;
  color: var(--primary-color);
}

.diagnostic-results {
  margin-top: 2rem;
}

.results-title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.test-result {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
  background: var(--surface-card);
}

.test-result.test-success {
  border-left: 4px solid var(--green-500);
}

.test-result.test-error {
  border-left: 4px solid var(--red-500);
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.test-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.success-icon {
  color: var(--green-500);
  font-size: 1.25rem;
}

.error-icon {
  color: var(--red-500);
  font-size: 1.25rem;
}

.test-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.test-description {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.test-data, .test-error-details {
  margin-top: 1rem;
}

.test-data h4, .test-error-details h4 {
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.data-preview {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.error-info {
  background: var(--red-50);
  border: 1px solid var(--red-200);
  padding: 1rem;
  border-radius: 4px;
}

.error-info p {
  margin: 0.5rem 0;
}

.diagnostic-summary {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.summary-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.stat-item.success {
  color: var(--green-600);
}

.stat-item.error {
  color: var(--red-600);
}

.summary-message {
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.summary-message.all-success {
  background: var(--green-50);
  border: 1px solid var(--green-200);
  color: var(--green-800);
}

.summary-message.has-errors {
  background: var(--red-50);
  border: 1px solid var(--red-200);
  color: var(--red-800);
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.no-results i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

@media (max-width: 768px) {
  .diagnostic-container {
    padding: 1rem;
  }
  
  .diagnostic-title {
    font-size: 2rem;
  }
  
  .diagnostic-controls {
    flex-direction: column;
    align-items: center;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
