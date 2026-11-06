<template>
  <main class="integrity-page">
    <header>
      <h1>Intégrité des données gamification</h1>
      <p>Diagnostic nominatif réservé aux administrateurs. Aucune donnée n’est modifiée.</p>
    </header>

    <div class="actions">
      <button type="button" :disabled="loading" @click="loadReport">
        {{ loading ? 'Diagnostic en cours…' : 'Lancer le diagnostic' }}
      </button>
      <button type="button" :disabled="loading || selectedIssues.length === 0" @click="simulate">
        Simuler les corrections sélectionnées
      </button>
    </div>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>

    <section v-if="report" aria-labelledby="summary-title">
      <h2 id="summary-title">{{ report.blockingCount }} incohérence(s) bloquante(s)</h2>
      <p>{{ report.expiryRule }}</p>
      <ul class="counts">
        <li v-for="(count, code) in report.counts" :key="code">{{ labels[code] || code }} : {{ count }}</li>
        <li v-if="Object.keys(report.counts).length === 0">Aucune incohérence détectée.</li>
      </ul>

      <h2>Éléments détectés</h2>
      <p class="privacy-note">Les identifiants personnels ne sont affichés qu’aux administrateurs.</p>
      <div class="issue-list">
        <label v-for="issue in report.issues" :key="issueKey(issue)" class="issue">
          <input v-model="selectedIssues" type="checkbox" :value="issueKey(issue)" />
          <span><strong>{{ labels[issue.code] || issue.code }}</strong><br />Utilisateur : {{ issue.userId || 'indisponible' }}<br />Enregistrement : {{ issue.recordId || 'indisponible' }}</span>
        </label>
      </div>
    </section>

    <section v-if="simulation" aria-labelledby="simulation-title" class="simulation">
      <h2 id="simulation-title">Simulation uniquement</h2>
      <p>{{ simulation.issueCount }} élément(s) sélectionné(s). Aucune correction exécutée.</p>
      <p>Une sauvegarde et une validation humaine sont requises avant toute correction. Les historiques expirés sont conservés.</p>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { getGamificationIntegrityReport, simulateGamificationIntegrityPlan } from '@/service/gamificationIntegrityService'

const loading = ref(false)
const error = ref('')
const notice = ref('')
const report = ref(null)
const simulation = ref(null)
const selectedIssues = ref([])
const labels = {
  orphan_profile: 'Profil sans données gamification',
  orphan_gamification: 'Données gamification sans profil',
  missing_house: 'Maison absente',
  duplicate_badge: 'Badge en double',
  unknown_badge: 'Badge inconnu',
  unknown_quest: 'Quête inconnue',
  unknown_step: 'Étape inconnue',
  xp_mismatch: 'Écart entre XP et historique',
  xp_without_gamification: 'Historique XP sans profil gamification',
}

function issueKey(issue) {
  return `${issue.code}:${issue.userId || ''}:${issue.recordId || ''}`
}

async function loadReport() {
  loading.value = true
  error.value = ''
  notice.value = ''
  simulation.value = null
  try {
    report.value = await getGamificationIntegrityReport()
    selectedIssues.value = report.value.issues.map(issueKey)
    notice.value = `${report.value.issues.length} anomalie(s) détectée(s).`
  } catch (cause) {
    error.value = cause?.status === 403
      ? 'Accès réservé aux administrateurs. Vérifiez votre rôle puis reconnectez-vous.'
      : cause?.status === 413
        ? 'Le volume dépasse la limite du diagnostic. Contactez l’équipe technique pour un traitement paginé.'
        : cause?.status === 503
          ? 'Le serveur n’a pas pu lire une ou plusieurs tables nécessaires. Vérifiez le déploiement backend et les journaux serveur.'
          : cause?.message || 'Le diagnostic est indisponible.'
  } finally {
    loading.value = false
  }
}

async function simulate() {
  loading.value = true
  error.value = ''
  try {
    simulation.value = await simulateGamificationIntegrityPlan(selectedIssues.value)
    notice.value = 'Simulation terminée : aucune modification apportée.'
  } catch (cause) {
    error.value = cause?.message || 'La simulation est indisponible.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.integrity-page { max-width: 900px; margin: 0 auto; padding: 2rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.5rem 0; }
button { min-height: 44px; padding: 0.65rem 1rem; cursor: pointer; }
button:focus-visible, input:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
button:disabled { cursor: not-allowed; opacity: 0.6; }
.counts { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; padding-left: 1.25rem; }
.issue-list { display: grid; gap: 0.5rem; }
.issue { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; overflow-wrap: anywhere; }
.issue input { margin-top: 0.25rem; min-width: 1rem; min-height: 1rem; }
.error { color: #991b1b; }
.privacy-note { color: #4b5563; }
.simulation { margin-top: 1.5rem; padding: 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }
@media (max-width: 600px) { .integrity-page { padding: 1rem; } }
</style>
