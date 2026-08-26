<template>
  <section class="needs-panel surface-card fp-dark border-round shadow-2" aria-labelledby="placement-needs-title">
    <div class="needs-header">
      <div>
        <div class="needs-eyebrow">Planification {{ academicYearLabel }}</div>
        <h2 id="placement-needs-title">Besoins estimés de places</h2>
        <p>Compare les étudiants restant à placer avec les capacités proposées pour l’année sélectionnée.</p>
      </div>
      <Dropdown v-model="selectedPfp" :options="pfpOptions" optionLabel="label" optionValue="value" class="needs-pfp-select" aria-label="PFP analysé" />
    </div>

    <ProgressBar v-if="loading" mode="indeterminate" class="needs-progress" />
    <div v-else-if="error" class="needs-state needs-state--error" role="alert">
      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <span>{{ error }}</span>
      <Button label="Réessayer" icon="pi pi-refresh" size="small" outlined @click="loadData" />
    </div>

    <template v-else>
      <div class="needs-summary" aria-live="polite">
        <article class="needs-kpi">
          <span>Étudiants à placer</span><strong>{{ analysis.studentsToPlace }}</strong><small>{{ analysis.targetClass || 'Classe inconnue' }}</small>
        </article>
        <article class="needs-kpi">
          <span>Places proposées</span><strong>{{ analysis.offered }}</strong><small>{{ selectedPfp }}</small>
        </article>
        <article class="needs-kpi" :class="analysis.missing > 0 ? 'needs-kpi--warning' : 'needs-kpi--success'">
          <span>{{ analysis.missing > 0 ? 'Places encore nécessaires' : 'Marge disponible' }}</span>
          <strong>{{ analysis.missing || analysis.surplus }}</strong><small>{{ analysis.coverage }} % de couverture</small>
        </article>
      </div>

      <div class="needs-table-wrap">
        <table class="needs-table">
          <caption>Couverture estimée par critère pour {{ selectedPfp }}</caption>
          <thead><tr><th>Critère</th><th>Étudiants concernés</th><th>Capacité proposée</th><th>Écart</th><th>Couverture</th></tr></thead>
          <tbody>
            <tr v-for="row in analysis.criteria" :key="row.criterion">
              <th scope="row"><span class="criterion-badge">{{ row.criterion }}</span></th>
              <td>{{ row.need }}</td><td>{{ row.capacity }}</td>
              <td><span :class="row.missing > 0 ? 'text-orange-400' : 'text-green-400'" class="font-semibold">{{ row.missing > 0 ? `-${row.missing}` : `+${row.surplus}` }}</span></td>
              <td><div class="coverage-cell"><ProgressBar :value="Math.min(row.coverage, 100)" :showValue="false" /><span>{{ row.coverage }} %</span></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="needs-note"><i class="pi pi-info-circle" aria-hidden="true"></i> Estimation de planification : une place peut couvrir plusieurs critères. Les lignes de critères ne doivent pas être additionnées entre elles.</p>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import ProgressBar from 'primevue/progressbar'
import { buildPlacementNeeds, loadPlacementNeedsSourceData, PLACEMENT_NEEDS_PFPS } from '@/service/placementNeedsService'

const props = defineProps({ places: { type: Array, default: () => [] }, year: { type: String, required: true } })
const selectedPfp = ref('PFP1A')
const sourceData = ref({ students: [], physioRows: [], resultRows: [] })
const loading = ref(true)
const error = ref('')
const pfpOptions = PLACEMENT_NEEDS_PFPS.map(value => ({ label: value, value }))
const academicYearLabel = computed(() => `${Number(props.year) - 1}–${props.year}`)
const analysis = computed(() => buildPlacementNeeds({ places: props.places, ...sourceData.value, year: props.year, pfp: selectedPfp.value }))

async function loadData() {
  loading.value = true
  error.value = ''
  try { sourceData.value = await loadPlacementNeedsSourceData() }
  catch (cause) { error.value = cause?.message || 'Les statistiques ne peuvent pas être chargées.' }
  finally { loading.value = false }
}

onMounted(loadData)
watch(() => props.year, () => { /* le calcul se met à jour sans nouvel appel */ })
</script>

<style scoped>
.needs-panel{margin-top:1rem;padding:1.5rem}.needs-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.needs-header h2{margin:.25rem 0;font-size:1.5rem}.needs-header p{margin:0;color:var(--text-color-secondary)}.needs-eyebrow{color:var(--primary-color);font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.needs-pfp-select{width:10rem}.needs-progress{height:4px;margin-top:1rem}.needs-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem;margin-top:1.25rem}.needs-kpi{display:grid;gap:.35rem;padding:1rem;border:1px solid var(--surface-border);border-radius:12px;background:var(--surface-ground)}.needs-kpi span,.needs-kpi small{color:var(--text-color-secondary)}.needs-kpi strong{font-size:1.8rem}.needs-kpi--warning{border-color:color-mix(in srgb,#f59e0b 45%,transparent)}.needs-kpi--success{border-color:color-mix(in srgb,#22c55e 40%,transparent)}.needs-table-wrap{margin-top:1rem;overflow-x:auto;border:1px solid var(--surface-border);border-radius:12px}.needs-table{width:100%;border-collapse:collapse;min-width:680px}.needs-table caption{text-align:left;padding:1rem;font-weight:700}.needs-table th,.needs-table td{padding:.8rem 1rem;text-align:left;border-top:1px solid var(--surface-border)}.needs-table thead th{color:var(--text-color-secondary);font-size:.78rem;text-transform:uppercase}.criterion-badge{display:inline-flex;padding:.3rem .55rem;border-radius:7px;background:color-mix(in srgb,var(--primary-color) 16%,transparent);color:var(--primary-color);font-weight:700}.coverage-cell{display:grid;grid-template-columns:minmax(90px,1fr) 3.5rem;align-items:center;gap:.6rem}.coverage-cell :deep(.p-progressbar){height:7px}.needs-note{display:flex;gap:.5rem;margin:1rem 0 0;color:var(--text-color-secondary);font-size:.85rem}.needs-state{display:flex;align-items:center;gap:.75rem;margin-top:1rem;padding:1rem;border-radius:10px}.needs-state--error{background:color-mix(in srgb,#ef4444 12%,transparent);color:#fca5a5}.needs-state .p-button{margin-left:auto}@media(max-width:900px){.needs-summary{grid-template-columns:1fr}.needs-header{align-items:stretch;flex-direction:column}.needs-pfp-select{width:100%}}@media(max-width:600px){.needs-panel{padding:1rem}.needs-header h2{font-size:1.25rem}}
</style>
