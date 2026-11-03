<template>
  <AdminLayout>
    <div class="gamification-dashboard p-3 md:p-4 max-w-7xl mx-auto">
      <header class="dashboard-hero mb-4">
        <div class="hero-copy">
          <h1>Gamification</h1>
          <p>Suivez les règles, le contenu et la qualité des données depuis une vue administrative unique.</p>
          <div class="freshness" aria-live="polite">
            <i class="pi pi-clock" aria-hidden="true"></i>
            <span>{{ consoleData ? `Actualisé le ${formatDateTime(consoleData.asOf)}` : 'Actualisation en cours' }}</span>
            <span class="source-chip">Source : base {{ environmentLabel }}</span>
          </div>
        </div>
        <div class="hero-actions">
          <ButtonGroup class="period-selector" aria-label="Période des indicateurs généraux">
            <Button v-for="item in periods" :key="item.value" :label="item.label"
              :outlined="period !== item.value" :severity="period === item.value ? 'primary' : 'secondary'"
              size="small" @click="changePeriod(item.value)" />
          </ButtonGroup>
          <Button label="Actualiser" icon="pi pi-refresh" :loading="refreshing || consoleLoading"
            outlined @click="refresh" />
        </div>
      </header>

      <div v-if="loading && consoleLoading" class="loading-state" aria-live="polite">
        <ProgressSpinner />
        <p>Chargement des indicateurs…</p>
      </div>

      <template v-else>
        <section v-if="consoleError" class="error-banner mb-4" role="alert">
          <div>
            <strong>La console détaillée est momentanément indisponible.</strong>
            <p>Les indicateurs généraux restent visibles ci-dessous.</p>
          </div>
          <Button label="Réessayer" icon="pi pi-refresh" severity="danger" outlined @click="loadConsole" />
        </section>

        <section v-if="rollout" class="rollout-panel mb-4" :class="rolloutTone" aria-labelledby="rollout-title">
          <span class="rollout-icon" aria-hidden="true"><i :class="rolloutIcon"></i></span>
          <div class="rollout-copy">
            <h2 id="rollout-title">{{ rolloutTitle }}</h2>
            <p>{{ rolloutDescription }}</p>
          </div>
          <div class="rollout-metrics">
            <span><strong>{{ rollout.eligibleUsers }}</strong> {{ countLabel(rollout.eligibleUsers, 'compte éligible', 'comptes éligibles') }}</span>
            <small>Mis à jour {{ formatDateTime(rollout.updatedAt) }}</small>
          </div>
        </section>
        <section v-else-if="rolloutError" class="rollout-panel is-warning mb-4" role="alert">
          <span class="rollout-icon" aria-hidden="true"><i class="pi pi-exclamation-triangle"></i></span>
          <div class="rollout-copy"><h2>État du déploiement indisponible</h2><p>Les autres indicateurs restent consultables.</p></div>
          <Button label="Réessayer" icon="pi pi-refresh" outlined @click="loadRollout" />
        </section>

        <section v-if="consoleData" aria-labelledby="system-title" class="mb-4">
          <div class="section-heading">
            <div><h2 id="system-title">État du système</h2><p class="section-context">Vue opérationnelle des 30 derniers jours</p></div>
            <span class="health-badge" :class="consoleData.quality.blockingIssueCount ? 'is-alert' : 'is-healthy'">
              <i :class="consoleData.quality.blockingIssueCount ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'" aria-hidden="true"></i>
              {{ consoleData.quality.blockingIssueCount ? 'Attention requise' : 'Système cohérent' }}
            </span>
          </div>
          <div class="operations-grid">
            <article class="operation-card accent-green"><span class="card-icon"><i class="pi pi-shield" aria-hidden="true"></i></span><div><strong>{{ consoleData.quality.blockingIssueCount }}</strong><span>{{ countLabel(consoleData.quality.blockingIssueCount, 'Anomalie bloquante', 'Anomalies bloquantes') }}</span></div><small>Contrôle d’intégrité Supabase</small></article>
            <article class="operation-card accent-yellow"><span class="card-icon"><i class="pi pi-bolt" aria-hidden="true"></i></span><div><strong>{{ activeRules.length }}</strong><span>Règles actives</span></div><small>Barème actuellement appliqué</small></article>
            <article class="operation-card accent-blue"><span class="card-icon"><i class="pi pi-users" aria-hidden="true"></i></span><div><strong>{{ consoleData.activity.activeUsers30d }}</strong><span>Participants actifs</span></div><small>Au moins un gain XP sur 30 jours</small></article>
            <article class="operation-card accent-purple"><span class="card-icon"><i class="pi pi-sparkles" aria-hidden="true"></i></span><div><strong>{{ formatNumber(consoleData.activity.xpAwarded30d) }}</strong><span>XP attribués</span></div><small>{{ consoleData.activity.awards30d }} {{ countLabel(consoleData.activity.awards30d, 'attribution', 'attributions') }} sur 30 jours</small></article>
            <article class="operation-card accent-orange"><span class="card-icon"><i class="pi pi-ban" aria-hidden="true"></i></span><div><strong :class="{ 'not-measured': consoleData.activity.rejectedEventsStatus !== 'ok' }">{{ consoleData.activity.rejectedEventsStatus === 'ok' ? consoleData.activity.rejectedEvents : 'Non mesurés' }}</strong><span>Événements refusés</span></div><small>{{ rejectionSummary }}</small></article>
          </div>
        </section>

        <section class="management-panel mb-4" aria-labelledby="manage-title">
          <div class="section-heading compact"><div><h2 id="manage-title">Administrer le contenu</h2><p class="section-context">Accès direct aux outils de gestion</p></div><span class="read-only-note"><i class="pi pi-lock" aria-hidden="true"></i> Aucun ajout manuel d’XP ici</span></div>
          <div class="management-links">
            <button v-for="link in managementLinks" :key="link.route" type="button" class="management-link" @click="router.push(link.route)">
              <span class="management-icon"><i :class="link.icon" aria-hidden="true"></i></span><span><strong>{{ link.label }}</strong><small>{{ link.description }}</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </section>

        <div v-if="consoleData" class="detail-grid mb-4">
          <section class="detail-panel" aria-labelledby="rules-title">
            <div class="panel-title"><div><h2 id="rules-title">Règles XP</h2><p class="section-context">Configuration actuellement appliquée</p></div><span>{{ activeRules.length }} {{ countLabel(activeRules.length, 'active', 'actives') }}</span></div>
            <div class="rules-list">
              <article v-for="rule in consoleData.rules" :key="rule.actionCode" class="rule-row">
                <span class="rule-state" :class="{ inactive: !rule.active }" aria-hidden="true"></span><div class="rule-copy"><strong>{{ rule.label }}</strong><small>Version {{ rule.version }}</small></div><strong class="xp-value">+{{ rule.xpAmount }} XP</strong><span class="rule-cap">{{ capLabel(rule) }}</span>
              </article>
            </div>
          </section>
          <section class="detail-panel" aria-labelledby="content-title">
            <div class="panel-title"><div><h2 id="content-title">Contenus publiés</h2><p class="section-context">État du cycle de vie</p></div></div>
            <div class="content-summary">
              <article v-for="item in contentSummary" :key="item.singular"><span class="content-icon"><i :class="item.icon" aria-hidden="true"></i></span><div><strong>{{ item.active }}</strong><span>{{ countLabel(item.active, `${item.singular} ${item.activeSingular}`, `${item.plural} ${item.activePlural}`) }}</span><small>{{ item.total }} au total</small></div></article>
            </div>
            <div class="transition-note"><i class="pi pi-history" aria-hidden="true"></i><span><strong>{{ consoleData.activity.lifecycleTransitions30d }}</strong> {{ countLabel(consoleData.activity.lifecycleTransitions30d, 'changement de statut audité', 'changements de statut audités') }} sur 30 jours</span></div>
          </section>
        </div>

        <section v-if="consoleData" class="quality-panel mb-4" aria-labelledby="quality-title">
          <div class="panel-title"><div><h2 id="quality-title">Qualité des données</h2><p class="section-context">Contrôles d’intégrité Supabase</p></div><span>Lecture seule</span></div>
          <div class="quality-columns">
            <div><h3>Contrôles bloquants</h3><p v-if="!nonZeroIssues.length" class="empty-check"><i class="pi pi-check-circle" aria-hidden="true"></i> Aucun écart détecté.</p><ul v-else><li v-for="item in nonZeroIssues" :key="item.key"><strong>{{ item.value }}</strong> {{ item.label }}</li></ul></div>
            <div><h3>Points à surveiller</h3><ul class="warning-list"><li v-for="item in warningItems" :key="item.key"><strong>{{ item.value }}</strong> {{ item.label }}</li><li v-for="item in consoleData.activity.rejectionBreakdown" :key="item.reason"><strong>{{ item.count }}</strong> {{ item.label.toLowerCase() }}</li><li v-if="!consoleData.activity.rejectionBreakdown.length"><strong>0</strong> refus journalisé sur 30 jours</li></ul></div>
          </div>
        </section>

        <section aria-labelledby="indicators-title" class="mb-4">
          <div class="section-heading compact"><div><h2 id="indicators-title">Indicateurs généraux</h2><p class="section-context">Résultats pour la période sélectionnée</p></div></div>
          <div v-if="statsError" class="inline-error stats-error" role="alert">
            <span>Les indicateurs de période sont momentanément indisponibles.</span>
            <Button label="Réessayer" icon="pi pi-refresh" text @click="loadKpis(true)" />
          </div>
          <div class="kpi-grid"><KpiCard v-for="kpi in kpisWithData" :key="kpi.id" v-bind="kpi" @action="openKpi(kpi)" /></div>
        </section>

        <section aria-labelledby="activity-title" class="activity-panel">
          <div class="panel-title"><div><h2 id="activity-title">Activités récentes</h2><p class="section-context">Dernières écritures du registre XP</p></div></div>
          <div v-if="activitiesError" class="inline-error"><span>Les activités sont momentanément indisponibles.</span><Button label="Réessayer" text @click="loadActivities" /></div>
          <p v-else-if="!activities.length" class="empty-activity">Aucune activité récente.</p>
          <div v-else class="activity-list"><article v-for="(activity, index) in activities" :key="`${activity.occurredAt}-${index}`"><span class="activity-icon"><i :class="activityIcon(activity.type)" aria-hidden="true"></i></span><div><strong>{{ activity.title || activity.description || 'Activité' }}</strong><small>{{ formatDateTime(activity.occurredAt) }}</small></div><span v-if="activity.xp" class="activity-xp">{{ activity.xp > 0 ? '+' : '' }}{{ activity.xp }} XP</span></article></div>
        </section>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import ProgressSpinner from 'primevue/progressspinner'
import AdminLayout from './layouts/AdminLayout.vue'
import KpiCard from './widgets/KpiCard.vue'
import { useAdminDashboardStats } from '@/composables/useAdminDashboardStats'
import { fetchGamificationActivity } from '@/service/adminDashboardStatsService'
import { fetchGamificationAdminConsole, fetchGamificationRollout } from '@/service/adminGamificationConsoleService'
import { getKpisForRole } from '@/config/kpiConfigs'
import { useRoleStore } from '@/stores/role'

const router = useRouter()
const roleStore = useRoleStore()
const period = ref('month')
const periods = [{ value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }, { value: 'quarter', label: 'Trimestre' }]
const stats = useAdminDashboardStats({ domains: ['gamification'], period })
const configurations = computed(() => getKpisForRole('gamification', roleStore.perms || [], roleStore.isSuper))
const kpisWithData = stats.mapKpis('gamification', configurations)
const { loading, refreshing, error: statsError } = stats
const consoleData = ref(null)
const consoleLoading = ref(true)
const consoleError = ref(false)
const rollout = ref(null)
const rolloutError = ref(false)
const activities = ref([])
const activitiesError = ref(false)

const environmentLabel = computed(() => import.meta.env.VITE_APP_ENV === 'production' ? 'production' : 'de test')
const activeRules = computed(() => consoleData.value?.rules.filter((rule) => rule.active) || [])
const rolloutTitle = computed(() => {
  if (!rollout.value?.rewardsEnabled) return 'Récompenses désactivées'
  return rollout.value.audienceMode === 'allowlist' ? 'Pilote fermé actif' : 'Gamification ouverte à tous'
})
const rolloutDescription = computed(() => {
  if (!rollout.value?.rewardsEnabled) return 'Le coupe-circuit bloque toute nouvelle attribution sans effacer l’historique.'
  if (rollout.value.audienceMode === 'allowlist') return `${rollout.value.allowlistedUsers} ${countLabel(rollout.value.allowlistedUsers, 'compte explicitement autorisé', 'comptes explicitement autorisés')}. Les autres actions sont refusées sans XP.`
  return 'Tous les profils actifs peuvent recevoir les récompenses prévues par les règles.'
})
const rolloutTone = computed(() => !rollout.value?.rewardsEnabled ? 'is-stopped' : rollout.value.audienceMode === 'allowlist' ? 'is-pilot' : 'is-open')
const rolloutIcon = computed(() => !rollout.value?.rewardsEnabled ? 'pi pi-pause' : rollout.value.audienceMode === 'allowlist' ? 'pi pi-shield' : 'pi pi-globe')
const rejectionSummary = computed(() => {
  const activity = consoleData.value?.activity
  if (!activity || activity.rejectedEventsStatus !== 'ok') return 'Mesure actuellement indisponible'
  if (!activity.rejectedEvents) return 'Aucun refus sur les 30 derniers jours'
  const first = activity.rejectionBreakdown[0]
  return first ? `Motif principal : ${first.label}` : 'Journalisés sur les 30 derniers jours'
})
const managementLinks = [
  { label: 'Quêtes', description: 'Créer, planifier et publier', icon: 'pi pi-flag', route: '/admin/gamification/quests' },
  { label: 'Défis', description: 'Configurer les objectifs', icon: 'pi pi-trophy', route: '/admin/gamification/challenges' },
  { label: 'Badges', description: 'Gérer les récompenses', icon: 'pi pi-star', route: '/admin/gamification/badges' },
  { label: 'Participants', description: 'Consulter les profils', icon: 'pi pi-users', route: '/admin/gamification/users' },
]
const kpiRoutes = Object.freeze({
  challenges_active: '/admin/gamification/challenges',
  quests_completed: '/admin/gamification/quests',
  badges_total: '/admin/gamification/badges',
  users_active: '/admin/gamification/users',
})
const qualityLabels = {
  unquarantined_gamification_orphans: 'profil(s) gamification orphelin(s)', unquarantined_quest_progress_orphans: 'progression(s) de quête orpheline(s)',
  profile_house_mismatches: 'incohérence(s) de maison', invalid_houses: 'maison(s) invalide(s)', duplicate_badge_awards: 'badge(s) attribué(s) en double',
  unknown_quest_steps: 'étape(s) de quête inconnue(s)', linked_ledger_mismatches: 'écart(s) dans le registre XP', level_mismatches: 'niveau(x) incohérent(s)',
  house_point_mismatches: 'écart(s) de points de maison', house_rollup_mismatches: 'total(aux) de maison incohérent(s)', unsupported_active_badges: 'badge(s) actif(s) non pris en charge',
  unsupported_active_challenges: 'défi(s) actif(s) non pris en charge', active_quests_without_steps: 'quête(s) active(s) sans étape',
}
const warningLabels = { profiles_without_house: 'profil(s) sans maison', historical_completed_quests_without_steps: 'ancienne(s) quête(s) terminée(s) sans étape', quarantined_records: 'ancien(s) enregistrement(s) isolé(s) et conservé(s)' }
const nonZeroIssues = computed(() => Object.entries(consoleData.value?.quality.issues || {}).filter(([, value]) => Number(value) > 0).map(([key, value]) => ({ key, value, label: qualityLabels[key] || key })))
const warningItems = computed(() => Object.entries(consoleData.value?.quality.warnings || {}).map(([key, value]) => ({ key, value, label: warningLabels[key] || key })))
const contentSummary = computed(() => consoleData.value ? [
  { singular: 'Quête', plural: 'Quêtes', activeSingular: 'active', activePlural: 'actives', icon: 'pi pi-flag', ...consoleData.value.content.quests },
  { singular: 'Défi', plural: 'Défis', activeSingular: 'actif', activePlural: 'actifs', icon: 'pi pi-trophy', ...consoleData.value.content.challenges },
  { singular: 'Badge', plural: 'Badges', activeSingular: 'actif', activePlural: 'actifs', icon: 'pi pi-star', ...consoleData.value.content.badges },
] : [])

const loadKpis = (force = false) => stats.load({ force }).catch(() => undefined)
async function loadConsole() { consoleLoading.value = true; consoleError.value = false; try { consoleData.value = await fetchGamificationAdminConsole() } catch (_) { consoleError.value = true } finally { consoleLoading.value = false } }
async function loadRollout() { rolloutError.value = false; try { rollout.value = await fetchGamificationRollout() } catch (_) { rollout.value = null; rolloutError.value = true } }
async function loadActivities() { activitiesError.value = false; try { activities.value = await fetchGamificationActivity({ limit: 12 }) } catch (_) { activities.value = []; activitiesError.value = true } }
async function refresh() { await Promise.all([stats.refresh().catch(() => undefined), loadActivities(), loadConsole(), loadRollout()]) }
async function changePeriod(nextPeriod) { if (nextPeriod === period.value) return; period.value = nextPeriod; await loadKpis(true) }
function openKpi(kpi) { const route = kpiRoutes[kpi?.id]; if (route) router.push(route) }
function countLabel(count, singular, plural) { return Number(count) === 1 ? singular : plural }
function capLabel(rule) { return rule.maxAwards ? `${rule.maxAwards} fois ${rule.windowLabel}` : rule.windowLabel }
function formatNumber(value) { return new Intl.NumberFormat('fr-CH').format(value || 0) }
function formatDateTime(value) { if (!value) return 'Aucune attribution récente'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date indisponible' : new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(date) }
function activityIcon(type) { return ({ challenge: 'pi pi-trophy', quest: 'pi pi-flag', badge: 'pi pi-star', house: 'pi pi-home' })[type] || 'pi pi-bolt' }
onMounted(() => Promise.all([loadKpis(), loadActivities(), loadConsole(), loadRollout()]))
</script>

<style scoped>
.gamification-dashboard{color:var(--text-color,#e8eef7)}.dashboard-hero{display:flex;justify-content:space-between;gap:2rem;padding:2rem;border:1px solid rgba(250,204,21,.22);border-radius:22px;background:radial-gradient(circle at 85% 15%,rgba(250,204,21,.14),transparent 35%),linear-gradient(135deg,#0b1f38,#102b4c);box-shadow:0 18px 45px rgba(3,12,28,.18)}.hero-copy{max-width:720px}.dashboard-hero h1{margin:0;font-size:clamp(2rem,4vw,3rem);line-height:1.05;color:#fff}.dashboard-hero p{margin:.65rem 0 1rem;color:#bfccdb;line-height:1.55}.freshness{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;color:#aebed0;font-size:.82rem}.source-chip{padding:.3rem .6rem;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06)}.hero-actions{display:flex;align-items:flex-start;gap:.75rem;flex-wrap:wrap}.period-selector :deep(.p-button),.hero-actions :deep(.p-button){min-height:44px}.loading-state{min-height:320px;display:grid;place-items:center;align-content:center;gap:1rem}.error-banner{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 1.25rem;border:1px solid #ef4444;border-radius:14px;background:rgba(239,68,68,.09)}.error-banner p{margin:.25rem 0 0}.section-heading,.panel-title{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin-bottom:1rem}.section-heading h2,.panel-title h2{margin:0;color:inherit;font-size:1.35rem}.section-context{max-width:65ch;margin:.3rem 0 0;color:#91a5bd;font-size:.86rem;line-height:1.4}.section-heading.compact{margin-bottom:1.25rem}.health-badge,.read-only-note,.panel-title>span{display:inline-flex;align-items:center;gap:.45rem;padding:.45rem .7rem;border-radius:999px;font-size:.78rem;font-weight:700}.health-badge.is-healthy{color:#46dc9c;background:rgba(34,197,94,.12)}.health-badge.is-alert{color:#ff9a8b;background:rgba(239,68,68,.12)}.read-only-note,.panel-title>span{color:#9fb2c9;background:rgba(125,150,180,.12)}
.operations-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));overflow:hidden;border:1px solid rgba(145,167,195,.18);border-radius:16px;background:rgba(7,25,47,.72);box-shadow:0 12px 30px rgba(3,12,28,.14)}.operation-card{--metric-accent:#f5bf22;min-height:165px;display:flex;min-width:0;flex-direction:column;gap:.75rem;padding:1.15rem;border-inline-end:1px solid rgba(145,167,195,.18)}.operation-card:last-child{border-inline-end:0}.card-icon,.management-icon,.content-icon,.activity-icon{width:2.5rem;height:2.5rem;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--metric-accent) 12%,transparent);color:var(--metric-accent)}.operation-card div{display:flex;min-width:0;flex-direction:column}.operation-card strong{font-size:1.8rem;color:#fff}.operation-card span,.operation-card small{color:#aebed0;overflow-wrap:anywhere}.operation-card small{margin-top:auto;line-height:1.35}.operation-card .not-measured{font-size:1.15rem;color:#ffb257}.accent-green{--metric-accent:#36d399}.accent-yellow{--metric-accent:#f5bf22}.accent-blue{--metric-accent:#4da3ff}.accent-purple{--metric-accent:#9b87f5}.accent-orange{--metric-accent:#fb923c}
.rollout-panel{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1.15rem 1.3rem;border:1px solid rgba(145,167,195,.2);border-radius:18px;background:rgba(9,28,51,.78)}.rollout-panel.is-pilot{border-color:rgba(245,191,34,.38);background:linear-gradient(100deg,rgba(245,191,34,.09),rgba(9,28,51,.8) 45%)}.rollout-panel.is-open{border-color:rgba(54,211,153,.38)}.rollout-panel.is-stopped,.rollout-panel.is-warning{border-color:rgba(251,146,60,.4)}.rollout-icon{width:3rem;height:3rem;display:grid;place-items:center;border-radius:14px;color:#f5bf22;background:rgba(245,191,34,.12);font-size:1.15rem}.rollout-copy h2{margin:0;color:#fff;font-size:1.2rem}.rollout-copy p{margin:.35rem 0 0;color:#aebed0}.rollout-metrics{display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;color:#b8c7d8}.rollout-metrics strong{color:#fff;font-size:1.2rem}.rollout-metrics small{color:#8499b2}
.management-panel,.detail-panel,.quality-panel,.activity-panel{padding:1.3rem;border:1px solid rgba(145,167,195,.18);border-radius:18px;background:rgba(9,28,51,.68)}.management-links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem}.management-link{min-height:76px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.75rem;padding:.85rem;color:inherit;text-align:left;border:1px solid rgba(145,167,195,.18);border-radius:13px;background:rgba(255,255,255,.025);cursor:pointer;transition:.18s ease}.management-link:hover,.management-link:focus-visible{transform:translateY(-2px);border-color:#f5bf22;background:rgba(245,191,34,.06);outline:none}.management-link span:nth-child(2){display:flex;flex-direction:column;gap:.2rem}.management-link small{color:#91a5bd}.detail-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:1rem}.rules-list{display:flex;flex-direction:column}.rule-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:.8rem;min-height:66px;border-top:1px solid rgba(145,167,195,.14)}.rule-row:first-child{border-top:0}.rule-state{width:.65rem;height:.65rem;border-radius:50%;background:#36d399;box-shadow:0 0 0 5px rgba(54,211,153,.1)}.rule-state.inactive{background:#8999ab;box-shadow:none}.rule-copy{display:flex;flex-direction:column;gap:.18rem}.rule-copy small,.content-summary small{color:#8499b2}.xp-value{color:#f5bf22}.rule-cap{padding:.35rem .55rem;border-radius:8px;color:#aac0d6;background:rgba(255,255,255,.05);font-size:.78rem}.content-summary{display:grid;gap:.7rem}.content-summary article{display:flex;align-items:center;gap:.8rem;padding:.75rem;border-radius:12px;background:rgba(255,255,255,.03)}.content-summary article>div{display:grid;grid-template-columns:auto 1fr;column-gap:.35rem;align-items:baseline}.content-summary strong{font-size:1.35rem;color:#fff}.content-summary small{grid-column:1/-1}.transition-note{display:flex;gap:.65rem;margin-top:1rem;padding:.8rem;color:#adc0d4;border-radius:12px;background:rgba(77,163,255,.08)}
.quality-columns{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.quality-columns>div{padding:1rem;border-radius:13px;background:rgba(255,255,255,.025)}.quality-columns h3{margin:0 0 .8rem;font-size:1rem}.quality-columns ul{display:grid;gap:.55rem;margin:0;padding-left:1.15rem;color:#b7c6d7}.empty-check{display:flex;gap:.55rem;align-items:center;margin:0;color:#46dc9c}.warning-list strong{color:#ffb257}.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem}.stats-error{margin-bottom:1rem;padding:.8rem 1rem;border-radius:12px;background:rgba(239,68,68,.09)}.activity-list{display:flex;flex-direction:column}.activity-list article{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.8rem;min-height:66px;padding:.65rem 0;border-top:1px solid rgba(145,167,195,.14)}.activity-list article:first-child{border-top:0}.activity-list article>div{display:flex;flex-direction:column;gap:.18rem}.activity-list small,.empty-activity{color:#8499b2}.activity-xp{color:#46dc9c;font-weight:800}.inline-error{display:flex;justify-content:space-between;align-items:center;gap:1rem;color:#ff9387}
@media(max-width:1150px){.operations-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.operation-card{border-block-end:1px solid rgba(145,167,195,.18)}.management-links{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:800px){.dashboard-hero{flex-direction:column;padding:1.35rem}.rollout-panel{grid-template-columns:auto 1fr}.rollout-metrics{grid-column:2;align-items:flex-start}.detail-grid,.quality-columns{grid-template-columns:1fr}.operations-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero-actions{width:100%}.section-heading{align-items:flex-start;flex-direction:column}}@media(max-width:520px){.operations-grid,.management-links{grid-template-columns:1fr}.operation-card{min-height:0;border-inline-end:0;border-block-end:1px solid rgba(145,167,195,.18)}.operation-card:last-child{border-block-end:0}.rollout-panel{grid-template-columns:1fr}.rollout-icon{width:2.6rem;height:2.6rem}.rollout-metrics{grid-column:1}.period-selector{width:100%}.period-selector :deep(.p-button){flex:1;padding-inline:.5rem}.rule-row{grid-template-columns:auto minmax(0,1fr) auto}.rule-cap{grid-column:2/-1;justify-self:start}.activity-list article{grid-template-columns:auto 1fr}.activity-xp{grid-column:2}.inline-error{align-items:flex-start;flex-direction:column}}
</style>
