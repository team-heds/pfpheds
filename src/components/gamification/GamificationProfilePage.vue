<template>
  <Navbar />
  <main class="gamification-profile-page" :style="{ '--house-color': houseColor, '--house-foreground': houseTextColor, '--house-image': `url(${houseBackgroundImage})` }">
    <div class="profile-shell">
      <GamificationPageHeader
        :title="isViewingOtherUser ? 'Profil gamification' : 'Mon profil gamification'"
        :description="isViewingOtherUser ? 'Consultation administrative en lecture seule de la progression de cet étudiant.' : 'Suivez votre niveau, vos points et vos prochains objectifs.'"
        :eyebrow="isViewingOtherUser ? 'Vue administrative' : 'Votre espace'"
        icon="pi pi-user"
        @back="goBack"
      />

      <section v-if="loading" class="state-panel loading-state" aria-live="polite" aria-busy="true">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement du profil</h2><p>Les informations de progression sont en cours de récupération.</p></div>
      </section>

      <section v-else-if="error" class="state-panel error-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>Le profil n’a pas pu être chargé</h2><p>{{ error }}</p>
          <button class="primary-button" type="button" @click="loadUserStats"><i class="pi pi-refresh" aria-hidden="true"></i> Réessayer</button>
        </div>
      </section>

      <template v-else-if="userStats">
        <section class="profile-summary" aria-labelledby="profile-name">
          <div class="identity-panel">
            <div class="identity-copy">
              <p class="context-label">{{ isViewingOtherUser ? 'Étudiant·e consulté·e' : 'Votre progression' }}</p>
              <h2 id="profile-name">{{ userStats.displayName }}</h2>
              <p class="level-name">{{ currentLevelInfo.name }} · niveau {{ currentLevel }}</p>
            </div>
            <div class="house-summary">
              <span class="house-icon" aria-hidden="true"><i class="pi pi-home"></i></span>
              <div><span class="summary-label">Maison</span><strong>{{ normalizedHouse || 'Aucune maison attribuée' }}</strong></div>
            </div>
            <button v-if="!normalizedHouse && !isViewingOtherUser" class="secondary-button" type="button" @click="goTo('/hes-house-quiz')">
              Découvrir ma maison <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </button>
          </div>

          <div class="progress-panel">
            <div class="progress-heading">
              <div><span class="summary-label">Expérience</span><strong>{{ formatNumber(totalXP) }} XP</strong></div>
              <span class="level-chip">Niveau {{ currentLevel }}</span>
            </div>
            <div class="level-progress" role="progressbar" aria-label="Progression vers le prochain niveau" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(xpProgress)">
              <span :style="{ transform: `scaleX(${xpProgress / 100})` }"></span>
            </div>
            <p v-if="isMaximumLevel" class="progress-copy">Niveau maximal atteint.</p>
            <p v-else class="progress-copy">{{ formatNumber(xpToNextLevel) }} XP avant le niveau {{ currentLevel + 1 }}</p>
          </div>
        </section>

        <section class="quick-stats" aria-label="Résumé de l’activité">
          <div><span>{{ activeQuests.length }}</span><p>Quêtes actives</p></div>
          <div><span>{{ questStats.completedQuests || 0 }}</span><p>Quêtes terminées</p></div>
          <div v-if="collectionsEnabled"><span>{{ challengeStats.totalCompleted || 0 }}</span><p>Défis réussis</p></div>
          <div v-if="collectionsEnabled"><span>{{ userBadges.length }}</span><p>Badges obtenus</p></div>
        </section>

        <section class="explore-section" aria-labelledby="explore-title">
          <div class="section-heading explore-heading">
            <div><h2 id="explore-title">Explorer</h2><p>Accédez directement aux activités et au classement des maisons.</p></div>
          </div>
          <nav class="gamification-navigation" aria-label="Explorer la gamification">
            <button type="button" @click="goTo('/quests')"><i class="pi pi-compass" aria-hidden="true"></i><span><strong>Quêtes</strong><small>Voir les objectifs et la progression</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></button>
            <button v-if="collectionsEnabled" type="button" @click="goTo('/challenges')"><i class="pi pi-flag" aria-hidden="true"></i><span><strong>Défis</strong><small>Consulter les défis disponibles</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></button>
            <button v-if="collectionsEnabled" type="button" @click="goTo('/achievements')"><i class="pi pi-shield" aria-hidden="true"></i><span><strong>Badges</strong><small>Retrouver les badges et objectifs</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></button>
            <button type="button" @click="goTo('/houses/ranking')"><i class="pi pi-chart-line" aria-hidden="true"></i><span><strong>Classement</strong><small>Comparer les maisons HES</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></button>
          </nav>
        </section>

        <section class="activity-section history-section" aria-labelledby="history-title">
          <div class="section-heading">
            <div>
              <h2 id="history-title">Historique de vos points</h2>
              <p v-if="isViewingOtherUser">Historique consulté dans le cadre du support administratif.</p>
              <p v-else>Chaque gain indique son origine et le total atteint.</p>
            </div>
            <span v-if="historyTotal" class="history-total">{{ historyTotal }} mouvement{{ historyTotal > 1 ? 's' : '' }}</span>
          </div>

          <div v-if="historyLoading && !historyItems.length" class="history-loading" aria-live="polite" aria-busy="true">
            <i class="pi pi-spin pi-spinner" aria-hidden="true"></i><span>Chargement de l’historique…</span>
          </div>
          <div v-else-if="historyError && !historyItems.length" class="history-error" role="alert">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            <div><strong>Historique indisponible</strong><p>{{ historyError }}</p></div>
            <button class="text-button" type="button" @click="loadHistory(true)">Réessayer</button>
          </div>
          <ol v-else-if="historyItems.length" class="history-list">
            <li v-for="item in historyItems" :key="item.id">
              <span class="history-icon" aria-hidden="true"><i :class="item.icon"></i></span>
              <div class="history-copy">
                <div class="history-line"><strong>{{ item.label }}</strong><time :datetime="item.occurredAt">{{ formatHistoryDate(item.occurredAt) }}</time></div>
                <p>{{ item.detail }}</p>
                <span v-if="item.linkedObject" class="linked-object">{{ item.linkedObject.type }} · {{ item.linkedObject.name }}</span>
              </div>
              <div class="history-points"><strong>+{{ formatNumber(item.points) }} XP</strong><small v-if="item.totalAfter !== null">Total {{ formatNumber(item.totalAfter) }}</small></div>
            </li>
          </ol>
          <div v-else class="empty-state">
            <i class="pi pi-star" aria-hidden="true"></i>
            <div><h3>Aucun gain pour le moment</h3><p>Une connexion quotidienne, une mise à jour du profil ou une activité récompensée apparaîtra ici.</p></div>
          </div>

          <button v-if="historyHasMore" class="history-more" type="button" :disabled="historyLoading" @click="loadHistory(false)">
            <i :class="historyLoading ? 'pi pi-spin pi-spinner' : 'pi pi-plus'" aria-hidden="true"></i>
            {{ historyLoading ? 'Chargement…' : 'Afficher 10 mouvements supplémentaires' }}
          </button>
          <p v-if="historyError && historyItems.length" class="history-inline-error" role="alert">{{ historyError }}</p>
        </section>

        <section class="activity-section" aria-labelledby="quests-title">
          <div class="section-heading"><div><h2 id="quests-title">Quêtes en cours</h2><p>Les prochains objectifs de ce profil.</p></div><button class="text-button" type="button" @click="goTo('/quests')">Toutes les quêtes <i class="pi pi-arrow-right" aria-hidden="true"></i></button></div>
          <ul v-if="activeQuests.length" class="quest-preview-list">
            <li v-for="quest in displayedQuests" :key="quest.id">
              <span class="preview-icon" aria-hidden="true"><i class="pi pi-compass"></i></span>
              <div><strong>{{ quest.title }}</strong><small>{{ quest.description || 'Objectif en cours' }}</small></div>
              <span class="quest-reward">{{ formatNumber(quest.xp_reward || quest.points || 0) }} XP</span>
            </li>
          </ul>
          <div v-else class="empty-state"><i class="pi pi-compass" aria-hidden="true"></i><div><h3>Aucune quête active</h3><p>Les quêtes disponibles restent accessibles depuis la page dédiée.</p></div></div>
        </section>

        <section v-if="collectionsEnabled" class="activity-section" aria-labelledby="challenges-title">
          <div class="section-heading"><div><h2 id="challenges-title">Défis actifs</h2><p>Un aperçu des défis actuellement proposés.</p></div><button class="text-button" type="button" @click="goTo('/challenges')">Tous les défis <i class="pi pi-arrow-right" aria-hidden="true"></i></button></div>
          <div v-if="activeChallenges.length" class="activity-grid"><ChallengeCard v-for="challenge in displayedChallenges" :key="challenge.id" :challenge="challenge" :house-color="houseColor" @click="showChallengeDetails" /></div>
          <div v-else class="empty-state"><i class="pi pi-flag" aria-hidden="true"></i><div><h3>Aucun défi actif</h3><p>Cette section affichera les prochains défis dès leur publication.</p></div></div>
        </section>

        <section v-if="collectionsEnabled" class="activity-section" aria-labelledby="badges-title">
          <div class="section-heading"><div><h2 id="badges-title">Derniers badges</h2><p>{{ userBadges.length }} badge{{ userBadges.length > 1 ? 's' : '' }} obtenu{{ userBadges.length > 1 ? 's' : '' }} sur {{ allBadges.length }}.</p></div><button class="text-button" type="button" @click="goTo('/achievements')">Tous les badges <i class="pi pi-arrow-right" aria-hidden="true"></i></button></div>
          <div v-if="userBadges.length" class="activity-grid badge-grid"><BadgeCard v-for="badge in displayedBadges" :key="badge.id" :badge="badge" :is-unlocked="true" @click="showBadgeDetails" /></div>
          <div v-else class="empty-state"><i class="pi pi-shield" aria-hidden="true"></i><div><h3>Aucun badge obtenu</h3><p>Les conditions de déblocage sont visibles sur la page des badges.</p></div></div>
        </section>
      </template>
    </div>
  </main>

  <DetailModal v-model="showDetailModal" :type="modalType" :item="modalItem" />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase.js'
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'
import { getGamificationHistory } from '@/service/gamificationHistoryService'
import badgesService from '@/service/badgesService'
import challengesService from '@/service/challengesService'
import userQuestsService from '@/service/userQuestsService'
import { gamificationFeatures } from '@/config/gamificationFeatures'
import levelsConfig from '@/config/levelsConfig'
import Navbar from '@/components/common/utils/Navbar.vue'
import BadgeCard from '@/components/gamification/BadgeCard.vue'
import ChallengeCard from '@/components/gamification/ChallengeCard.vue'
import DetailModal from '@/components/gamification/DetailModal.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import { getReadableTextColor } from '@/utils/colorContrast'
import FondHarmonis from '@/assets/maisons/FondHarmonis.png'
import FondElaris from '@/assets/maisons/FondElaris.png'
import FondDoloris from '@/assets/maisons/FondDoloris.png'
import FondSolencia from '@/assets/maisons/FondSolencia.png'
import MaitreDuJeuFond from '@/assets/maisons/MaitreDuJeuFond.png'

const props = defineProps({ id: { type: String, default: null } })
const router = useRouter()
const authStore = useAuthStore()
const collectionsEnabled = gamificationFeatures.userJourney && gamificationFeatures.badgesChallenges
const displayUserId = computed(() => props.id || authStore.user?.id)
const isViewingOtherUser = computed(() => Boolean(props.id && props.id !== authStore.user?.id))

const loading = ref(true)
const error = ref(null)
const userStats = ref(null)
const userBadges = ref([])
const allBadges = ref([])
const activeChallenges = ref([])
const challengeStats = ref({ totalCompleted: 0, totalXPFromChallenges: 0 })
const activeQuests = ref([])
const questStats = ref({ totalQuests: 0, completedQuests: 0, totalXPFromQuests: 0, averageProgress: 0 })
const showDetailModal = ref(false)
const modalType = ref('badge')
const modalItem = ref(null)
const historyItems = ref([])
const historyPage = ref(0)
const historyTotal = ref(0)
const historyHasMore = ref(false)
const historyLoading = ref(false)
const historyError = ref(null)

const houseConfig = {
  Harmonis: { color: '#2e8b57', image: FondHarmonis },
  Elaris: { color: '#dc143c', image: FondElaris },
  Doloris: { color: '#f2c400', image: FondDoloris },
  Solencia: { color: '#4169e1', image: FondSolencia },
  Gamemaster: { color: '#9333ea', image: MaitreDuJeuFond }
}

const normalizeHouse = (value) => {
  if (!value) return null
  const house = String(value).trim().toLowerCase()
  if (house.startsWith('harm')) return 'Harmonis'
  if (house.startsWith('ela')) return 'Elaris'
  if (house.startsWith('dol')) return 'Doloris'
  if (house.startsWith('sol')) return 'Solencia'
  if (house.startsWith('game') || house.startsWith('maitre')) return 'Gamemaster'
  return null
}

const normalizedHouse = computed(() => normalizeHouse(userStats.value?.maison))
const houseColor = computed(() => houseConfig[normalizedHouse.value]?.color || '#70819b')
const houseTextColor = computed(() => getReadableTextColor(houseColor.value))
const houseBackgroundImage = computed(() => houseConfig[normalizedHouse.value]?.image || FondHarmonis)
const currentLevel = computed(() => Math.min(20, Math.max(1, Number(userStats.value?.niveau) || 1)))
const totalXP = computed(() => Number(userStats.value?.xp || userStats.value?.totalXP || 0))
const currentLevelInfo = computed(() => levelsConfig.getLevelInfo(currentLevel.value))
const isMaximumLevel = computed(() => currentLevel.value >= 20)
const xpProgress = computed(() => isMaximumLevel.value ? 100 : levelsConfig.getLevelProgress(currentLevel.value, totalXP.value))
const xpToNextLevel = computed(() => isMaximumLevel.value ? 0 : levelsConfig.getXPToNextLevel(currentLevel.value, totalXP.value))
const displayedQuests = computed(() => activeQuests.value.slice(0, 3))
const displayedChallenges = computed(() => activeChallenges.value.slice(0, 3))
const displayedBadges = computed(() => userBadges.value.slice(0, 6))
const formatNumber = (number) => new Intl.NumberFormat('fr-CH').format(Number(number) || 0)
const historyDateFormatter = new Intl.DateTimeFormat('fr-CH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Zurich',
})
const formatHistoryDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date inconnue' : historyDateFormatter.format(date)
}

const loadHistory = async (reset = false) => {
  const userId = displayUserId.value
  if (!userId || historyLoading.value) return
  if (reset) {
    historyItems.value = []
    historyPage.value = 0
    historyTotal.value = 0
    historyHasMore.value = false
  }

  historyLoading.value = true
  historyError.value = null
  try {
    const nextPage = historyPage.value + 1
    const result = await getGamificationHistory(userId, { page: nextPage, pageSize: 10 })
    historyItems.value = reset ? result.items : [...historyItems.value, ...result.items]
    historyPage.value = result.page
    historyTotal.value = result.total
    historyHasMore.value = result.hasMore
  } catch (loadError) {
    console.error('Erreur lors du chargement de l’historique gamification:', loadError)
    historyError.value = 'Vérifiez votre connexion puis réessayez.'
  } finally {
    historyLoading.value = false
  }
}

const profileDisplayName = (profile, gamificationData) => {
  if (profile?.display_name?.trim()) return profile.display_name.trim()
  const fullName = [profile?.family_name, profile?.forname].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  const email = profile?.email || gamificationData?.email || (!isViewingOtherUser.value ? authStore.user?.email : null)
  return email?.split('@')[0] || 'Profil étudiant'
}

const loadBadgesData = async (userId) => {
  if (!collectionsEnabled) return
  try {
    const [available, earned] = await Promise.all([badgesService.getAllBadges(), badgesService.getUserBadges(userId)])
    allBadges.value = available
    userBadges.value = earned
  } catch (loadError) {
    console.error('Erreur lors du chargement des badges:', loadError)
    allBadges.value = []
    userBadges.value = []
  }
}

const loadChallengesData = async (userId) => {
  if (!collectionsEnabled) return
  try {
    const [challenges, stats] = await Promise.all([challengesService.getUserActiveChallenges(userId), challengesService.getUserChallengeStats(userId)])
    activeChallenges.value = challenges
    challengeStats.value = stats
  } catch (loadError) {
    console.error('Erreur lors du chargement des défis:', loadError)
    activeChallenges.value = []
    challengeStats.value = { totalCompleted: 0, totalXPFromChallenges: 0 }
  }
}

const loadQuestsData = async (userId) => {
  try {
    const [quests, stats] = await Promise.all([userQuestsService.getUserQuests(userId), userQuestsService.getQuestStats(userId)])
    activeQuests.value = quests.filter((quest) => ['not_started', 'in_progress'].includes(quest.userProgress?.status))
    questStats.value = stats
  } catch (loadError) {
    console.error('Erreur lors du chargement des quêtes:', loadError)
    activeQuests.value = []
    questStats.value = { totalQuests: 0, completedQuests: 0, totalXPFromQuests: 0, averageProgress: 0 }
  }
}

const loadUserStats = async () => {
  loading.value = true
  error.value = null
  const userId = displayUserId.value
  if (!userId) {
    error.value = 'Aucun utilisateur n’est disponible pour cette consultation.'
    loading.value = false
    return
  }
  try {
    const [gamificationData, profileResult] = await Promise.all([
      gamificationServiceSupabase.getUserGamificationData(userId),
      supabase.from('user_profiles').select('display_name, forname, family_name, email').eq('user_id', userId).maybeSingle()
    ])
    if (profileResult.error && profileResult.error.code !== 'PGRST116') console.warn('Erreur lors du chargement du profil:', profileResult.error)
    userStats.value = {
      uid: userId,
      displayName: profileDisplayName(profileResult.data, gamificationData),
      niveau: gamificationData?.current_level || gamificationData?.niveau || 1,
      xp: gamificationData?.total_xp ?? gamificationData?.xp ?? 0,
      maison: gamificationData?.house_name || gamificationData?.maison || null
    }
    await Promise.all([loadQuestsData(userId), loadBadgesData(userId), loadChallengesData(userId), loadHistory(true)])
  } catch (loadError) {
    console.error('Erreur lors du chargement du profil gamification:', loadError)
    error.value = 'Vérifiez votre connexion puis réessayez.'
  } finally {
    loading.value = false
  }
}

const showBadgeDetails = (badge) => { modalType.value = 'badge'; modalItem.value = badge; showDetailModal.value = true }
const showChallengeDetails = (challenge) => { modalType.value = 'challenge'; modalItem.value = challenge; showDetailModal.value = true }
const goBack = () => router.back()
const goTo = (path) => router.push(path)

watch(displayUserId, (nextId, previousId) => { if (nextId && nextId !== previousId) loadUserStats() })
onMounted(loadUserStats)
</script>

<style scoped>
.gamification-profile-page { box-sizing: border-box; width: 100%; height: 100vh; min-height: 100vh; overflow-x: hidden; overflow-y: auto; padding: 1rem 1rem 6rem; color: var(--text-color, #f8fafc); background: radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--house-color) 18%, transparent), transparent 34rem), var(--surface-ground, #040d1a); -webkit-overflow-scrolling: touch; }
.profile-shell { width: min(100%, 1240px); margin: 0 auto; }
.identity-copy h2, .identity-copy p, .section-heading h2, .section-heading p, .empty-state h3, .empty-state p, .quick-stats p, .state-panel h2, .state-panel p { margin: 0; }
.section-heading p, .progress-copy, .empty-state p, .state-panel p { color: var(--text-color-secondary, #b7c2d4); line-height: 1.55; }
.primary-button, .secondary-button, .text-button, .gamification-navigation button { min-height: 44px; font: inherit; cursor: pointer; }
button:focus-visible { outline: 3px solid color-mix(in srgb, var(--house-color) 65%, white); outline-offset: 3px; }
.state-panel { display: flex; align-items: flex-start; gap: 1rem; min-height: 180px; padding: 1.5rem; border-radius: 16px; background: var(--surface-card, #071426); box-shadow: 0 16px 40px rgba(0,0,0,.18); }
.state-panel > i { margin-top: .2rem; color: var(--house-color); font-size: 1.5rem; }
.state-panel h2 { margin-bottom: .45rem; font-size: 1.2rem; }
.error-state > i { color: #fca5a5; }
.primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: .6rem; margin-top: 1rem; padding: .65rem 1rem; border: 0; border-radius: 12px; font-weight: 700; }
.primary-button { color: #071426; background: #f3c300; }
.secondary-button { border: 1px solid #465c78; color: #f8fafc; background: rgba(7,20,38,.72); }
.profile-summary { display: grid; overflow: hidden; border-radius: 16px; background: var(--surface-card, #071426); box-shadow: 0 18px 48px rgba(0,0,0,.22); }
.identity-panel, .progress-panel { padding: 1.35rem; }
.identity-panel { position: relative; isolation: isolate; display: flex; flex-direction: column; justify-content: space-between; min-height: 250px; background: linear-gradient(110deg, rgba(7,20,38,.96), rgba(7,20,38,.68)), var(--house-image) center / cover; }
.context-label, .summary-label { display: block; margin: 0 0 .35rem; color: #c7d2e3; font-size: .78rem; font-weight: 700; letter-spacing: .055em; text-transform: uppercase; }
.identity-copy h2 { max-width: 18ch; overflow-wrap: anywhere; font-size: clamp(1.8rem, 8vw, 3.4rem); line-height: 1.05; letter-spacing: -.035em; }
.level-name { margin-top: .65rem !important; color: #e2e8f0; }
.house-summary { display: flex; align-items: center; gap: .8rem; margin-top: 2rem; }
.house-summary strong { display: block; font-size: 1.1rem; }
.house-icon { display: grid; flex: 0 0 44px; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: var(--house-foreground); background: var(--house-color); }
.progress-panel { display: flex; flex-direction: column; justify-content: center; min-height: 180px; background: color-mix(in srgb, var(--surface-card, #071426) 88%, var(--house-color)); }
.progress-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.progress-heading strong { display: block; font-size: clamp(1.8rem, 8vw, 3rem); line-height: 1; }
.level-chip { flex: 0 0 auto; padding: .45rem .7rem; border-radius: 999px; color: var(--house-foreground); background: var(--house-color); font-size: .82rem; font-weight: 800; }
.level-progress { overflow: hidden; height: 12px; margin: 1.5rem 0 .75rem; border-radius: 999px; background: rgba(255,255,255,.14); }
.level-progress span { display: block; width: 100%; height: 100%; border-radius: inherit; background: var(--house-color); transform-origin: left center; transition: transform 500ms cubic-bezier(.16,1,.3,1); }
.quick-stats { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); margin: 1rem 0 1.5rem; border-radius: 14px; background: var(--surface-card, #071426); }
.quick-stats div { padding: 1rem; }
.quick-stats div:nth-child(odd) { border-right: 1px solid var(--surface-border, #26364d); }
.quick-stats div:nth-child(-n+2) { border-bottom: 1px solid var(--surface-border, #26364d); }
.quick-stats span { display: block; font-size: 1.65rem; font-weight: 800; }
.quick-stats p { margin-top: .2rem; color: #b8c4d7; font-size: .86rem; }
.explore-section { margin: 0 0 1.5rem; padding: 1.15rem; border: 1px solid color-mix(in srgb, var(--surface-border, #26364d) 82%, transparent); border-radius: 16px; background: var(--surface-card, #071426); }
.explore-heading { margin-bottom: 1rem; }
.gamification-navigation { display: grid; gap: .65rem; }
.gamification-navigation button { display: grid; grid-template-columns: 30px minmax(0,1fr) 20px; align-items: center; gap: .75rem; width: 100%; padding: .9rem 1rem; border: 1px solid color-mix(in srgb, var(--surface-border, #26364d) 82%, transparent); border-radius: 14px; color: inherit; text-align: left; background: #0b1d35; transition: border-color 160ms ease-out, background-color 160ms ease-out, transform 160ms ease-out; }
.gamification-navigation button:hover { border-color: color-mix(in srgb, var(--house-color) 60%, #465c78); background: color-mix(in srgb, #0b1d35 90%, var(--house-color)); transform: translateY(-2px); }
.gamification-navigation button > i:first-child { color: var(--house-color); font-size: 1.2rem; }
.gamification-navigation span { min-width: 0; }
.gamification-navigation strong, .gamification-navigation small { display: block; }
.gamification-navigation small { margin-top: .2rem; color: #b8c4d7; line-height: 1.35; }
.activity-section { margin-top: 1.25rem; padding: 1.15rem; border-radius: 16px; background: var(--surface-card, #071426); }
.section-heading { display: flex; flex-direction: column; align-items: flex-start; gap: .85rem; margin-bottom: 1.15rem; }
.section-heading h2 { font-size: 1.25rem; }
.section-heading p { margin-top: .3rem; }
.text-button { display: inline-flex; align-items: center; gap: .45rem; padding: .5rem 0; border: 0; color: #f3c300; font-weight: 700; background: transparent; }
.activity-grid { display: grid; gap: 1rem; }
.quest-preview-list { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
.quest-preview-list li { display: grid; grid-template-columns: 44px minmax(0,1fr) auto; align-items: center; gap: .8rem; min-height: 68px; padding: .7rem .8rem; border-radius: 12px; background: color-mix(in srgb, var(--surface-card, #071426) 88%, white); }
.quest-preview-list strong, .quest-preview-list small { display: block; }
.quest-preview-list strong { overflow-wrap: anywhere; }
.quest-preview-list small { display: -webkit-box; overflow: hidden; margin-top: .2rem; color: #b8c4d7; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.preview-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: var(--house-foreground); background: var(--house-color); }
.quest-reward { color: #f3c300; font-size: .82rem; font-weight: 800; white-space: nowrap; }
.history-total { flex: 0 0 auto; padding: .4rem .65rem; border-radius: 999px; color: var(--house-foreground); background: var(--house-color); font-size: .78rem; font-weight: 800; }
.history-loading, .history-error { display: flex; align-items: center; gap: .75rem; min-height: 76px; padding: .85rem; border-radius: 12px; color: #b8c4d7; background: color-mix(in srgb, var(--surface-card, #071426) 88%, white); }
.history-error { color: #fecaca; }
.history-error p { margin: .2rem 0 0; }
.history-error .text-button { margin-left: auto; }
.history-list { display: grid; gap: .55rem; margin: 0; padding: 0; list-style: none; }
.history-list li { display: grid; grid-template-columns: 44px minmax(0,1fr) auto; align-items: center; gap: .8rem; min-height: 74px; padding: .75rem .8rem; border: 1px solid color-mix(in srgb, var(--surface-border, #26364d) 82%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--surface-card, #071426) 92%, white); }
.history-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: var(--house-foreground); background: var(--house-color); }
.history-copy { min-width: 0; }
.history-line { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
.history-line strong { overflow-wrap: anywhere; }
.history-line time { flex: 0 0 auto; color: #b8c4d7; font-size: .76rem; }
.history-copy p { margin: .18rem 0 0; color: #b8c4d7; font-size: .82rem; line-height: 1.4; }
.linked-object { display: inline-flex; margin-top: .4rem; padding: .22rem .45rem; border-radius: 7px; color: #dbeafe; background: rgba(59,130,246,.15); font-size: .72rem; font-weight: 700; }
.history-points { min-width: 96px; text-align: right; }
.history-points strong, .history-points small { display: block; }
.history-points strong { color: #f3c300; }
.history-points small { margin-top: .2rem; color: #b8c4d7; font-size: .72rem; }
.history-more { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: .5rem; width: 100%; margin-top: .8rem; padding: .65rem 1rem; border: 1px solid var(--surface-border, #26364d); border-radius: 12px; color: inherit; background: transparent; font: inherit; font-weight: 700; cursor: pointer; }
.history-more:disabled { cursor: wait; opacity: .65; }
.history-inline-error { margin: .7rem 0 0; color: #fecaca; font-size: .82rem; }
.empty-state { display: flex; align-items: flex-start; gap: .9rem; padding: 1rem 0; }
.empty-state > i { margin-top: .2rem; color: var(--house-color); font-size: 1.35rem; }
.empty-state h3 { margin-bottom: .25rem; font-size: 1rem; }
@media (min-width: 700px) {
  .gamification-profile-page { padding: 1.5rem 1.5rem 7rem; }
  .profile-summary { grid-template-columns: minmax(0,1.35fr) minmax(280px,.75fr); }
  .identity-panel, .progress-panel { padding: 2rem; }
  .quick-stats { grid-template-columns: repeat(4,minmax(0,1fr)); }
  .quick-stats div { border-right: 1px solid var(--surface-border, #26364d) !important; border-bottom: 0 !important; }
  .quick-stats div:last-child { border-right: 0 !important; }
  .gamification-navigation { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .section-heading { flex-direction: row; align-items: center; justify-content: space-between; }
  .activity-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .quest-preview-list { grid-template-columns: repeat(2,minmax(0,1fr)); }
}

@media (max-width: 699px) {
  .history-list li { grid-template-columns: 44px minmax(0,1fr); align-items: start; }
  .history-line { align-items: flex-start; flex-direction: column; gap: .2rem; }
  .history-points { grid-column: 2; min-width: 0; text-align: left; }
  .history-points strong, .history-points small { display: inline; }
  .history-points small { margin-left: .5rem; }
}
@media (min-width: 1100px) {
  .gamification-profile-page { padding: 2rem 2rem 4rem; }
  .gamification-navigation { grid-template-columns: repeat(4,minmax(0,1fr)); }
  .gamification-navigation button { min-height: 82px; }
  .explore-section { padding: 1.5rem; }
  .activity-section { padding: 1.5rem; }
  .activity-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
  .quest-preview-list { grid-template-columns: repeat(3,minmax(0,1fr)); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
</style>
