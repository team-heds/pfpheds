<template>
  <AdminLayout>
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-8">
        <ProgressSpinner />
        <p class="mt-3 text-600">Chargement du tableau de bord...</p>
      </div>

      <div v-else class="p-4 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="surface-card p-4 border-round shadow-2 mb-4 border-left-3 border-primary">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-briefcase text-primary text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold text-900 m-0">Dashboard PFP</h1>
                <p class="text-600 m-0 mt-1">Tableau de bord Pratique de Formation Professionnelle</p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <ButtonGroup>
                <Button
                  label="Jour"
                  :outlined="periodMode !== 'day'"
                  :severity="periodMode === 'day' ? 'primary' : 'secondary'"
                  @click="setPeriodMode('day')"
                  size="small"
                />
                <Button
                  label="Mois"
                  :outlined="periodMode !== 'month'"
                  :severity="periodMode === 'month' ? 'primary' : 'secondary'"
                  @click="setPeriodMode('month')"
                  size="small"
                />
                <Button
                  label="Année"
                  :outlined="periodMode !== 'year'"
                  :severity="periodMode === 'year' ? 'primary' : 'secondary'"
                  @click="setPeriodMode('year')"
                  size="small"
                />
              </ButtonGroup>
              <Button
                icon="pi pi-download"
                label="Exporter"
                outlined
                severity="secondary"
                @click="exportStatsCsv"
              />
              <Button 
                icon="pi pi-refresh" 
                @click="refresh"
                :loading="refreshing"
                outlined
              />
            </div>
          </div>
        </div>

        <!-- KPI Cards modulables -->
        <div class="kpi-grid mb-4">
          <KpiCard
            v-for="kpi in kpisWithData"
            :key="kpi.id"
            v-bind="kpi"
            @action="handleKpiAction(kpi)"
          />
        </div>

        <div class="surface-card p-4 border-round shadow-2 mb-4">
          <div class="flex align-items-center justify-content-between mb-3">
            <h2 class="text-xl font-semibold text-900 m-0">Statistiques détaillées ({{ periodLabel }})</h2>
            <small class="text-600">Fenêtre: {{ periodRangeLabel }}</small>
          </div>
          <div class="grid">
            <div class="col-12 sm:col-6 lg:col-3" v-for="s in extraStats" :key="s.key">
              <div class="surface-ground border-round p-3 h-full">
                <div class="text-sm text-600">{{ s.label }}</div>
                <div class="text-2xl font-bold mt-2" :style="{ color: s.color }">{{ s.value }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Actions Rapides</h2>
          <div class="grid">
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/etudiant_list')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-blue-100 border-circle mb-3">
                  <i class="pi pi-users text-blue-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Étudiants</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer les étudiants</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/management_votation_prioritaire')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-green-100 border-circle mb-3">
                  <i class="pi pi-check-square text-green-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Votations</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer les votations</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/management_pfpencours')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-orange-100 border-circle mb-3">
                  <i class="pi pi-clock text-orange-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">PFP en Cours</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Suivre les PFP actifs</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/pfp/cohort-stats')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-purple-100 border-circle mb-3">
                  <i class="pi pi-chart-pie text-purple-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Stats par Cohorte</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">PFP1A & PFP1B par canton</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Activités récentes -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Activités récentes</h2>
          <div class="surface-card p-4 border-round shadow-2">
            <div v-if="!activities.length" class="text-600">Aucune activité récente</div>
            <div v-else class="flex flex-column gap-2">
              <div
                v-for="(a, i) in activities"
                :key="i"
                class="flex align-items-center justify-content-between border-1 surface-border border-round p-3"
              >
                <div class="flex align-items-center gap-3">
                  <div class="flex align-items-center justify-content-center w-2rem h-2rem bg-blue-50 border-circle">
                    <i :class="activityIcon(a.type)" class="text-blue-500 text-sm"></i>
                  </div>
                  <div>
                    <div class="text-900 font-medium">{{ a.title }}</div>
                    <small class="text-500">{{ a.time }}</small>
                  </div>
                </div>
                <Button v-if="a.to" label="Voir" class="p-button-text p-button-sm" @click="navigateTo(a.to)" />
              </div>
            </div>
          </div>
        </div>
      </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'
import KpiCard from './widgets/KpiCard.vue'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import ProgressSpinner from 'primevue/progressspinner'
import { useKpiManager } from '@/composables/useKpiManager'
import { supabase } from '@/supabase'

const router = useRouter()

// Utiliser le système KPI modulable
const {
  kpisWithData,
  loading,
  refreshing,
  period,
  loadKpis,
  refresh
} = useKpiManager('pfp')

const activities = ref([])
const periodMode = ref('month')
const extraStats = ref([
  { key: 'active_students', label: 'Étudiants actifs', value: 0, color: '#22c55e' },
  { key: 'open_places', label: 'Places ouvertes', value: 0, color: '#3b82f6' },
  { key: 'published_assignments', label: 'Attributions publiées', value: 0, color: '#eab308' },
  { key: 'incomplete_profiles', label: 'Dossiers incomplets', value: 0, color: '#ef4444' },
  { key: 'validated', label: 'PFP validées', value: 0, color: '#16a34a' },
  { key: 'failed', label: 'PFP en échec', value: 0, color: '#dc2626' },
  { key: 'stopped', label: 'PFP arrêtées', value: 0, color: '#f97316' },
  { key: 'with_pdf', label: 'Places avec PDF', value: 0, color: '#8b5cf6' },
])

const periodLabel = computed(() => {
  if (periodMode.value === 'day') return 'Jour'
  if (periodMode.value === 'year') return 'Année'
  return 'Mois'
})

const periodRangeLabel = computed(() => {
  const now = new Date()
  if (periodMode.value === 'day') {
    return now.toLocaleDateString('fr-CH')
  }
  if (periodMode.value === 'year') {
    return String(now.getFullYear())
  }
  return now.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' })
})

const navigateTo = (path) => {
  router.push(path)
}

const setPeriodMode = async (mode) => {
  periodMode.value = mode
  if (mode === 'day') period.value = '7d'
  else if (mode === 'year') period.value = '90d'
  else period.value = '30d'
  await loadExtraStats()
}

const isInSelectedPeriod = (isoDate) => {
  if (!isoDate) return true
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return true

  const now = new Date()
  if (periodMode.value === 'day') {
    return d.toDateString() === now.toDateString()
  }
  if (periodMode.value === 'year') {
    return d.getFullYear() === now.getFullYear()
  }
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

const loadExtraStats = async () => {
  try {
    const [profilesRes, placesRes, votesRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('user_id,is_active,permissions,family_name,forname,email,classe,updated_at,created_at')
        .filter('permissions', 'cs', '["EtudiantPhysio"]'),
      supabase
        .from('places')
        .select('PlaceId,InstitutionId,NomPlace,fileURL,fileurl,pdfUrl,created_at,updated_at'),
      supabase
        .from('student_result_vote')
        .select('id,status,pfp_validee,pfp_echec,pfp_arret,created_at,updated_at')
    ])

    const profiles = (profilesRes.data || []).filter((p) => isInSelectedPeriod(p.updated_at || p.created_at))
    const places = (placesRes.data || []).filter((p) => isInSelectedPeriod(p.updated_at || p.created_at))
    const votes = (votesRes.data || []).filter((v) => isInSelectedPeriod(v.updated_at || v.created_at))

    const activeStudents = profiles.filter((p) => p.is_active !== false).length
    const incompleteProfiles = profiles.filter((p) => !p.family_name || !p.forname || !p.email || !p.classe).length
    const openPlaces = places.filter((p) => p.InstitutionId && p.NomPlace).length
    const withPdf = places.filter((p) => p.fileURL || p.fileurl || p.pdfUrl).length
    const publishedAssignments = votes.filter((v) => v.status === 'published').length
    const validated = votes.filter((v) => v.pfp_validee === true).length
    const failed = votes.filter((v) => v.pfp_echec === true).length
    const stopped = votes.filter((v) => v.pfp_arret === true).length

    extraStats.value = [
      { key: 'active_students', label: 'Étudiants actifs', value: activeStudents, color: '#22c55e' },
      { key: 'open_places', label: 'Places ouvertes', value: openPlaces, color: '#3b82f6' },
      { key: 'published_assignments', label: 'Attributions publiées', value: publishedAssignments, color: '#eab308' },
      { key: 'incomplete_profiles', label: 'Dossiers incomplets', value: incompleteProfiles, color: '#ef4444' },
      { key: 'validated', label: 'PFP validées', value: validated, color: '#16a34a' },
      { key: 'failed', label: 'PFP en échec', value: failed, color: '#dc2626' },
      { key: 'stopped', label: 'PFP arrêtées', value: stopped, color: '#f97316' },
      { key: 'with_pdf', label: 'Places avec PDF', value: withPdf, color: '#8b5cf6' },
    ]
  } catch (error) {
    console.warn('Erreur chargement stats détaillées PFP:', error)
  }
}

const exportStatsCsv = () => {
  const header = ['Periode', periodLabel.value]
  const rows = extraStats.value.map((s) => [s.label, String(s.value)])
  const lines = [header, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(';'))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard_pfp_${periodMode.value}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const handleKpiAction = (kpi) => {
  const routes = {
    students_count: '/etudiant_list',
    institutions_count: '/institution_list',
    places_count: '/management_place',
    pfp_ongoing: '/management_pfpencours'
  }
  if (routes[kpi.id]) {
    router.push(routes[kpi.id])
  }
}

const activityIcon = (type) => {
  switch (type) {
    case 'etudiant': return 'pi pi-user';
    case 'votation': return 'pi pi-check-square';
    case 'place': return 'pi pi-map-marker';
    case 'pfp': return 'pi pi-calendar';
    default: return 'pi pi-info-circle';
  }
}

onMounted(async () => {
  await loadKpis()
  await loadExtraStats()
  activities.value = [
    { type: 'votation', title: 'Votation prioritaire lancée', time: 'il y a 20 min', to: '/management_votation_prioritaire' },
    { type: 'place', title: 'Nouvelle place ajoutée', time: 'il y a 1 h', to: '/management_place' },
    { type: 'pfp', title: 'PFP en cours mis à jour', time: 'hier', to: '/management_pfpencours' },
  ]
})
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>