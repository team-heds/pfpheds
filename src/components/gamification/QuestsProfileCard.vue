<template>
  <section class="quests-profile-card" :style="{ '--house-color': houseColor, '--house-foreground': houseForeground }" :aria-label="isViewingOtherUser ? 'Quêtes de ce profil' : 'Mes quêtes actives'">
    <header class="card-header">
      <div>
        <h3><i class="pi pi-compass" aria-hidden="true"></i> {{ isViewingOtherUser ? 'Quêtes de ce profil' : 'Mes quêtes actives' }}</h3>
        <p>{{ isViewingOtherUser ? 'Consultation de ses objectifs en lecture seule.' : 'Poursuivez vos objectifs depuis le journal de quêtes.' }}</p>
      </div>
      <span v-if="!loading && !error && activeQuests.length" class="count-badge">{{ activeQuests.length }}</span>
    </header>

    <div v-if="loading" class="widget-state" role="status" aria-busy="true">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <p>Chargement des quêtes…</p>
    </div>

    <div v-else-if="error" class="widget-state error-state" role="alert">
      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <div><strong>Quêtes indisponibles</strong><p>{{ error }}</p></div>
      <button class="retry-button" type="button" @click="loadUserQuests">Réessayer</button>
    </div>

    <template v-else-if="activeQuests.length">
      <ul class="quests-list">
        <li v-for="quest in displayedQuests" :key="quest.id">
          <component :is="isViewingOtherUser ? 'div' : 'button'" class="quest-item" :type="isViewingOtherUser ? null : 'button'" :aria-label="isViewingOtherUser ? null : `Retrouver la quête ${quest.title || 'sans titre'} dans le journal`" @click="!isViewingOtherUser && navigateToAllQuests()">
            <span class="quest-icon" aria-hidden="true"><i class="pi pi-flag"></i></span>
            <span class="quest-content">
              <span class="quest-header"><strong class="quest-title">{{ quest.title || 'Quête sans titre' }}</strong><span class="difficulty-badge">{{ getDifficultyLabel(quest.difficulty) }}</span></span>
              <span v-if="quest.description" class="quest-description">{{ quest.description }}</span>
              <span class="quest-progress">
                <span class="progress-bar" role="progressbar" :aria-label="`Progression de ${quest.title || 'la quête'}`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="progressOf(quest)"><span class="progress-fill" :style="{ transform: `scaleX(${progressOf(quest) / 100})` }"></span></span>
                <span class="progress-text">{{ progressOf(quest) }} %</span>
              </span>
              <span class="quest-status">{{ questStatus(quest) === 'in_progress' ? 'En cours' : 'À commencer' }}</span>
            </span>
            <span class="quest-reward"><span>{{ rewardOf(quest) }} XP</span><i v-if="!isViewingOtherUser" class="pi pi-arrow-right" aria-hidden="true"></i></span>
          </component>
        </li>
      </ul>
      <button v-if="!isViewingOtherUser" class="journal-link" type="button" @click="navigateToAllQuests">Ouvrir mon journal de quêtes <i class="pi pi-arrow-right" aria-hidden="true"></i></button>
    </template>

    <div v-else-if="!viewerUserId && !isPreview" class="widget-state">
      <i class="pi pi-user" aria-hidden="true"></i>
      <div><strong>Connectez-vous pour retrouver vos quêtes</strong><button class="journal-link" type="button" @click="router.push('/home')">Se connecter</button></div>
    </div>

    <div v-else class="widget-state empty-state">
      <i class="pi pi-compass" aria-hidden="true"></i>
      <div><strong>{{ isViewingOtherUser ? 'Aucune quête active pour ce profil' : 'Aucune quête active pour le moment' }}</strong><p>{{ isViewingOtherUser ? 'Les prochains objectifs apparaîtront ici.' : 'Consultez le journal pour retrouver vos quêtes et leur historique.' }}</p><button v-if="!isViewingOtherUser" class="journal-link" type="button" @click="navigateToAllQuests">Voir toutes les quêtes <i class="pi pi-arrow-right" aria-hidden="true"></i></button></div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import userQuestsService from '@/service/userQuestsService'
import { getReadableTextColor } from '@/utils/colorContrast'

const props = defineProps({
  userId: { type: String, default: null },
  houseColor: { type: String, default: '#2E8B57' },
  previewQuests: { type: Array, default: null },
  previewLoading: { type: Boolean, default: false },
})

const router = useRouter()
const authStore = useAuthStore()
const viewerUserId = computed(() => authStore.user?.id || null)
const displayUserId = computed(() => props.userId || viewerUserId.value)
const isViewingOtherUser = computed(() => Boolean(viewerUserId.value && props.userId && props.userId !== viewerUserId.value))
const isPreview = computed(() => Array.isArray(props.previewQuests))
const houseForeground = computed(() => getReadableTextColor(props.houseColor))
const quests = ref([])
const loading = ref(false)
const error = ref('')
const currentTime = ref(Date.now())
let requestGeneration = 0
let disposed = false
let realtimeChannel = null
let clock = null

const progressOf = quest => {
  const value = Number(quest.progress ?? quest.userProgress?.progress ?? 0)
  return Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value))) : 0
}
const rewardOf = quest => {
  const value = Number(quest.xp_reward ?? quest.points ?? 0)
  return Number.isFinite(value) ? Math.max(0, value) : 0
}
const questStatus = quest => quest.status ?? quest.userProgress?.status
const activeQuests = computed(() => quests.value.filter(quest => {
  if (!quest || !['not_started', 'in_progress'].includes(questStatus(quest))) return false
  const value = quest.end_date || quest.endDate
  const endTime = value ? new Date(value).getTime() : NaN
  return !Number.isFinite(endTime) || endTime > currentTime.value
}).slice().sort((first, second) => progressOf(second) - progressOf(first)))
const displayedQuests = computed(() => activeQuests.value.slice(0, 3))
const getDifficultyLabel = value => ({
  easy: 'Facile', medium: 'Moyen', hard: 'Difficile', expert: 'Expert', epic: 'Épique', legendary: 'Légendaire',
})[String(value || '').toLowerCase()] || 'Difficulté non précisée'

const detachRealtime = () => {
  if (realtimeChannel) {
    try { userQuestsService.unsubscribeFromQuestUpdates(realtimeChannel) } catch { /* A stale channel must not retain the previous profile. */ }
  }
  realtimeChannel = null
}

const loadUserQuests = async () => {
  const generation = ++requestGeneration
  currentTime.value = Date.now()
  quests.value = []
  error.value = ''
  if (isPreview.value) {
    // Stories may omit progress statuses; this fallback is presentation-only.
    quests.value = props.previewQuests.filter(quest => quest && typeof quest === 'object').map(quest => ({ ...quest, status: questStatus(quest) || (progressOf(quest) ? 'in_progress' : 'not_started') }))
    loading.value = props.previewLoading
    return
  }
  const userId = displayUserId.value
  if (!viewerUserId.value || !userId) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const result = await userQuestsService.getUserQuests(userId)
    if (!Array.isArray(result)) throw new Error('Invalid quest list')
    if (!disposed && generation === requestGeneration) quests.value = result
  } catch {
    if (!disposed && generation === requestGeneration) error.value = 'Vérifiez votre connexion puis réessayez.'
  } finally {
    if (!disposed && generation === requestGeneration) loading.value = false
  }
}

const subscribeToUpdates = () => {
  const userId = displayUserId.value
  if (!viewerUserId.value || !userId || isPreview.value) return
  realtimeChannel = userQuestsService.subscribeToQuestUpdates(userId, () => {
    if (!disposed && userId === displayUserId.value && !isPreview.value) void loadUserQuests()
  })
}

const navigateToAllQuests = () => router.push('/quests')

watch([displayUserId, viewerUserId, () => props.previewQuests, () => props.previewLoading], () => {
  detachRealtime()
  void loadUserQuests()
  subscribeToUpdates()
}, { immediate: true, flush: 'sync' })

onMounted(() => { clock = setInterval(() => { currentTime.value = Date.now() }, 60000) })
onBeforeUnmount(() => {
  disposed = true
  ++requestGeneration
  detachRealtime()
  if (clock !== null) clearInterval(clock)
})
</script>

<style scoped>
.quests-profile-card { margin-top: 1.5rem; padding: 1.25rem; border-radius: 16px; color: var(--text-color); background: var(--surface-card); }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: .75rem; }
.card-header h3 { display: flex; align-items: center; gap: .55rem; margin: 0; font-size: 1.1rem; line-height: 1.35; }
.card-header h3 i { color: var(--primary-color); }
.card-header p, .widget-state p { margin: .4rem 0 0; color: var(--text-color-secondary); line-height: 1.5; }
.count-badge { display: grid; min-width: 28px; min-height: 28px; padding: .2rem .4rem; place-items: center; border-radius: 8px; color: var(--house-foreground); background: var(--house-color); font-size: .875rem; font-weight: 700; }
.quests-list { margin: 0; padding: 0; list-style: none; }
.quests-list li + li { border-top: 1px solid var(--surface-border); }
.quest-item { display: flex; align-items: flex-start; gap: .85rem; width: 100%; min-height: 44px; padding: 1rem 0; border: 0; border-radius: 8px; color: inherit; background: transparent; font: inherit; text-align: left; transition: background-color 160ms ease-out; }
button.quest-item { cursor: pointer; }
button.quest-item:hover { background: var(--surface-hover); }
.quest-icon { display: grid; flex: 0 0 40px; width: 40px; height: 40px; place-items: center; border-radius: 10px; color: var(--house-foreground); background: var(--house-color); }
.quest-content { flex: 1; min-width: 0; }
.quest-header { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem; }
.quest-title { overflow-wrap: anywhere; line-height: 1.35; }
.difficulty-badge, .quest-status { color: var(--text-color-secondary); font-size: .875rem; }
.quest-description { display: -webkit-box; overflow: hidden; margin-top: .25rem; color: var(--text-color-secondary); line-height: 1.5; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
.quest-progress { display: flex; align-items: center; gap: .65rem; margin-top: .65rem; }
.progress-bar { flex: 1; overflow: hidden; height: 6px; border-radius: 3px; background: var(--surface-border); }
.progress-fill { display: block; width: 100%; height: 100%; border-radius: inherit; background: var(--house-color); transform-origin: left; transition: transform 300ms ease-out; }
.progress-text { flex: 0 0 auto; min-width: 3rem; color: var(--text-color-secondary); font-size: .875rem; text-align: right; }
.quest-status { display: block; margin-top: .25rem; }
.quest-reward { box-sizing: border-box; display: flex; flex: 0 0 auto; align-items: center; gap: .6rem; color: var(--primary-color); font-size: .875rem; font-weight: 700; white-space: nowrap; }
.quest-reward i { color: var(--text-color-secondary); }
.journal-link, .retry-button { display: inline-flex; align-items: center; justify-content: center; gap: .55rem; min-height: 44px; padding: .65rem 0; border: 0; border-radius: 8px; color: var(--primary-color); background: transparent; font: inherit; font-weight: 700; text-align: left; cursor: pointer; }
.journal-link { margin-top: .5rem; }
.retry-button { padding-inline: .75rem; }
button:focus-visible { outline: 3px solid var(--primary-color); outline-offset: 3px; }
.widget-state { display: flex; align-items: flex-start; gap: .75rem; padding: 1rem 0; }
.widget-state > i { margin-top: .15rem; color: var(--house-color); font-size: 1.25rem; }
.widget-state p { margin-top: 0; }
.widget-state strong + p { margin-top: .4rem; }
.error-state { flex-wrap: wrap; }
.error-state > i { color: var(--red-400); }
@media (max-width: 600px) { .quests-profile-card { padding: 1rem; } .quest-item { flex-wrap: wrap; } .quest-reward { width: 100%; justify-content: flex-end; padding-left: calc(40px + .85rem); } }
@media (prefers-reduced-motion: reduce) { .quest-item, .progress-fill { transition: none; } }
</style>
