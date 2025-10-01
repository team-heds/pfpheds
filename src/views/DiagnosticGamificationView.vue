<template>
  <div class="diagnostic-page">
    <div class="diagnostic-header">
      <h1>🔧 Diagnostic Gamification Supabase</h1>
      <p>Tests des permissions et fonctionnalités</p>
    </div>

    <div class="diagnostic-controls">
      <button 
        @click="runDiagnostic" 
        :disabled="isRunning"
        class="btn-primary"
      >
        {{ isRunning ? '⏳ Test en cours...' : '🚀 Lancer le diagnostic' }}
      </button>
      
      <button 
        @click="clearResults" 
        :disabled="isRunning || results.length === 0"
        class="btn-secondary"
      >
        🗑️ Effacer
      </button>
    </div>

    <div v-if="isRunning" class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="progress-text">{{ currentTest }}</p>
    </div>

    <div v-if="results.length > 0" class="results-section">
      <h2>📊 Résultats du diagnostic</h2>
      
      <div class="test-results">
        <div 
          v-for="(result, index) in results" 
          :key="index"
          class="test-result"
          :class="{ 'success': result.success, 'error': !result.success }"
        >
          <div class="test-header">
            <span class="test-icon">{{ result.success ? '✅' : '❌' }}</span>
            <span class="test-name">{{ result.name }}</span>
            <span class="test-badge" :class="result.success ? 'success' : 'error'">
              {{ result.success ? 'SUCCÈS' : 'ÉCHEC' }}
            </span>
          </div>
          
          <p class="test-description">{{ result.description }}</p>
          
          <div v-if="result.success && result.data" class="test-data">
            <h4>✅ Données récupérées :</h4>
            <pre class="data-preview">{{ formatData(result.data) }}</pre>
          </div>
          
          <div v-if="!result.success" class="test-error">
            <h4>❌ Erreur détectée :</h4>
            <div class="error-details">
              <p><strong>Message :</strong> {{ result.error }}</p>
              <p v-if="result.errorCode"><strong>Code :</strong> {{ result.errorCode }}</p>
              <p v-if="result.errorDetails"><strong>Détails :</strong> {{ result.errorDetails }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-stats">
          <div class="stat success">
            <span>✅ {{ successCount }} tests réussis</span>
          </div>
          <div class="stat error">
            <span>❌ {{ errorCount }} tests échoués</span>
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

    <div v-if="!isRunning && results.length === 0" class="no-results">
      <p>🔍 Aucun diagnostic lancé. Cliquez sur "Lancer le diagnostic" pour commencer.</p>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'DiagnosticGamificationView',
  setup() {
    const router = useRouter()
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
.diagnostic-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.diagnostic-header {
  text-align: center;
  margin-bottom: 2rem;
}

.diagnostic-header h1 {
  font-size: 2rem;
  color: #2563eb;
  margin-bottom: 0.5rem;
}

.diagnostic-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.diagnostic-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.progress-section {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #2563eb;
  font-weight: 500;
}

.results-section h2 {
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.test-result {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
}

.test-result.success {
  border-left: 4px solid #10b981;
}

.test-result.error {
  border-left: 4px solid #ef4444;
}

.test-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.test-icon {
  font-size: 1.25rem;
}

.test-name {
  font-weight: 600;
  flex: 1;
}

.test-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.test-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.test-badge.error {
  background: #fee2e2;
  color: #991b1b;
}

.test-description {
  color: #6b7280;
  margin-bottom: 1rem;
}

.test-data h4, .test-error h4 {
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.data-preview {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
}

.error-details {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1rem;
  border-radius: 4px;
}

.error-details p {
  margin: 0.5rem 0;
  color: #991b1b;
}

.summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat {
  font-weight: 500;
}

.stat.success {
  color: #059669;
}

.stat.error {
  color: #dc2626;
}

.summary-message {
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.summary-message.all-success {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.summary-message.has-errors {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .diagnostic-page {
    padding: 1rem;
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
