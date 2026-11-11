<template>
  <Navbar />
  <main class="gamification-profile-page" data-page-scroll :style="{ '--house-color': houseColor, '--house-foreground': houseTextColor }">
    <div class="profile-shell">
      <GamificationPageHeader
        :title="isViewingOtherUser ? 'Progression du profil' : 'Ma progression'"
        :description="isViewingOtherUser ? 'Consultation administrative en lecture seule de la progression de cet étudiant.' : 'Votre maison, vos réussites et la prochaine étape de votre parcours.'"
        icon="pi pi-compass"
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
              <h2 id="profile-name">{{ userStats.displayName }}</h2>
              <p class="level-name">{{ currentLevelInfo.name }} · niveau {{ currentLevel }}</p>
            </div>
            <div class="house-summary">
              <span class="house-icon" aria-hidden="true"><i :class="houseIdentity?.icon || 'pi pi-home'"></i></span>
              <div><span class="summary-label">Maison</span><strong>{{ normalizedHouse || 'Aucune maison attribuée' }}</strong></div>
            </div>
            <p v-if="houseIdentity" class="house-motto">{{ houseIdentity.motto }}</p>
            <button v-if="!normalizedHouse && !isViewingOtherUser && houseQuizEnabled && houseQuizOpen" class="secondary-button" type="button" @click="goTo('/hes-house-quiz')">
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

        <section v-if="!isViewingOtherUser && loginStreak" class="streak-panel" aria-labelledby="streak-title">
          <div class="streak-panel__current">
            <h2 id="streak-title"><span class="streak-flame" aria-hidden="true">🔥</span> {{ streakLabel(loginStreak.current) }}</h2>
            <p>Série de connexions · meilleure série : {{ formatStreakDays(loginStreak.best) }}</p>
            <p v-if="!loginStreak.loggedInToday && loginStreak.current > 0" class="streak-panel__hint">La connexion d’aujourd’hui n’est pas encore comptée : la série continue dès qu’elle l’est.</p>
            <p v-else-if="loginStreak.current === 0" class="streak-panel__hint">Connectez-vous chaque jour pour lancer une série.</p>
          </div>
          <div class="streak-panel__next">
            <p class="streak-panel__goal">{{ nextMilestoneLabel(loginStreak) }}</p>
            <div v-if="loginStreak.nextMilestone" class="level-progress streak-progress" role="progressbar" aria-label="Progression vers le prochain palier de série" aria-valuemin="0" :aria-valuemax="loginStreak.nextMilestone.days" :aria-valuenow="Math.min(loginStreak.current, loginStreak.nextMilestone.days)" :aria-valuetext="`${formatStreakDays(loginStreak.current)} sur ${loginStreak.nextMilestone.days}`">
              <span :style="{ transform: `scaleX(${nextMilestoneProgress(loginStreak) / 100})` }"></span>
            </div>
            <ul class="streak-milestones" aria-label="Paliers de l’année académique">
              <li v-for="milestone in loginStreak.milestones" :key="milestone.days" :class="{ 'is-reached': milestone.reached }">
                <i :class="milestone.reached ? 'pi pi-check-circle' : 'pi pi-circle'" aria-hidden="true"></i>
                <span><strong>{{ milestone.days }} jours</strong><small>+{{ milestone.xp }} XP{{ milestone.reached ? ' · obtenu' : '' }}</small></span>
              </li>
            </ul>
          </div>
        </section>

        <section class="quick-stats" aria-label="Résumé de l’activité">
          <div><span>{{ sectionLoading.quests || sectionErrors.quests ? '—' : activeQuests.length }}</span><p>Quêtes actives</p></div>
          <div><span>{{ sectionLoading.quests || sectionErrors.quests ? '—' : questStats.completedQuests || 0 }}</span><p>Quêtes terminées</p></div>
          <div v-if="collectionsEnabled"><span>{{ sectionLoading.challenges || sectionErrors.challenges ? '—' : challengeStats.totalCompleted || 0 }}</span><p>Défis réussis</p></div>
          <div v-if="collectionsEnabled"><span>{{ sectionLoading.badges || sectionErrors.badges ? '—' : userBadges.length }}</span><p>Badges obtenus</p></div>
        </section>

        <section v-if="!isViewingOtherUser" class="next-step" aria-labelledby="next-step-title">
          <div class="next-step__heading"><h2 id="next-step-title">Votre prochaine étape</h2><i class="pi pi-compass" aria-hidden="true"></i></div>
          <div v-if="sectionLoading.quests" class="next-step__loading" role="status">Recherche de vos objectifs en cours…</div>
          <template v-else-if="featuredQuest && !sectionErrors.quests">
            <div class="next-step__body">
              <div><h3>{{ featuredQuest.title }}</h3><p>{{ featuredQuest.description || 'Retrouvez les étapes de cet objectif et poursuivez votre progression.' }}</p></div>
              <RouterLink class="primary-button" to="/quests">{{ questProgress(featuredQuest) > 0 ? 'Poursuivre ma quête' : 'Voir ma quête' }} <i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
            </div>
            <div class="next-step__progress">
              <div role="progressbar" :aria-label="`Progression de la quête ${featuredQuest.title}`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="questProgress(featuredQuest)"><span :style="{ transform: `scaleX(${questProgress(featuredQuest) / 100})` }"></span></div>
              <span>{{ Math.round(questProgress(featuredQuest)) }} %</span>
              <strong v-if="Number(featuredQuest.xp_reward || featuredQuest.points) > 0">{{ formatNumber(featuredQuest.xp_reward || featuredQuest.points) }} XP à gagner</strong>
            </div>
          </template>
          <div v-else-if="!normalizedHouse && !isViewingOtherUser && houseQuizEnabled && houseQuizOpen" class="next-step__body">
            <div><h3>Découvrez votre maison</h3><p>Répondez au questionnaire pour découvrir Harmonis, Elaris, Doloris ou Solencia et rejoindre votre maison.</p></div>
            <RouterLink class="primary-button" to="/hes-house-quiz">Découvrir ma maison <i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
          </div>
          <div v-else class="next-step__body">
            <div><h3>Choisissez votre prochain objectif</h3><p>Retrouvez les quêtes qui vous sont attribuées et leurs conditions. Chaque réussite fait partie de votre parcours.</p></div>
            <RouterLink class="primary-button" to="/quests">Explorer mes quêtes <i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
          </div>
        </section>

        <section v-if="!isViewingOtherUser" class="explore-section" aria-labelledby="explore-title">
          <div class="section-heading explore-heading">
            <div><h2 id="explore-title">Explorer</h2><p>Accédez directement aux activités et au classement des maisons.</p></div>
          </div>
          <nav class="gamification-navigation" aria-label="Explorer la gamification">
            <RouterLink to="/quests"><i class="pi pi-compass" aria-hidden="true"></i><span><strong>Quêtes</strong><small>Vos objectifs et leurs étapes</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
            <RouterLink v-if="collectionsEnabled" to="/challenges"><i class="pi pi-flag" aria-hidden="true"></i><span><strong>Défis</strong><small>Les activités proposées</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
            <RouterLink v-if="collectionsEnabled" to="/achievements"><i class="pi pi-shield" aria-hidden="true"></i><span><strong>Badges</strong><small>Vos réussites à collectionner</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
            <RouterLink to="/houses/ranking"><i class="pi pi-chart-line" aria-hidden="true"></i><span><strong>Maisons</strong><small>Le classement collectif</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
            <RouterLink v-if="gamesEnabled" to="/game"><i class="pi pi-play" aria-hidden="true"></i><span><strong>Jeux</strong><small>Une pause à partager</small></span><i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink>
          </nav>
        </section>

        <details class="activity-section history-section">
          <summary class="history-summary">
            <div>
              <h2 id="history-title">Historique de vos points</h2>
              <p v-if="isViewingOtherUser">Historique consulté dans le cadre du support administratif.</p>
              <p v-else>Chaque gain indique son origine et le total atteint.</p>
            </div>
            <span v-if="historyTotal" class="history-total">{{ historyTotal }} mouvement{{ historyTotal > 1 ? 's' : '' }}</span>
            <i class="pi pi-chevron-down" aria-hidden="true"></i>
          </summary>

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
        </details>

        <section class="activity-section" aria-labelledby="quests-title">
          <div class="section-heading"><div><h2 id="quests-title">Quêtes en cours</h2><p>Les prochains objectifs de ce profil.</p></div><RouterLink v-if="!isViewingOtherUser" class="text-button" to="/quests">Toutes les quêtes <i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink></div>
          <p v-if="sectionLoading.quests" role="status">Chargement des quêtes…</p>
          <div v-else-if="sectionErrors.quests" class="section-error" role="alert"><p>{{ sectionErrors.quests }}</p><button class="text-button" type="button" @click="loadQuestsData()">Réessayer les quêtes</button></div>
          <ul v-else-if="activeQuests.length" class="quest-preview-list">
            <li v-for="quest in displayedQuests" :key="quest.id">
              <span class="preview-icon" aria-hidden="true"><i class="pi pi-compass"></i></span>
              <div><strong>{{ quest.title }}</strong><small>{{ quest.description || 'Objectif en cours' }}</small></div>
              <span class="quest-reward">{{ formatNumber(quest.xp_reward || quest.points || 0) }} XP</span>
            </li>
          </ul>
          <div v-else class="empty-state"><i class="pi pi-compass" aria-hidden="true"></i><div><h3>Aucune quête active</h3><p>Les quêtes disponibles restent accessibles depuis la page dédiée.</p></div></div>
        </section>

        <section v-if="collectionsEnabled" class="activity-section" aria-labelledby="challenges-title">
          <div class="section-heading"><div><h2 id="challenges-title">Défis actifs</h2><p>Un aperçu des défis actuellement proposés.</p></div><RouterLink v-if="!isViewingOtherUser" class="text-button" to="/challenges">Tous les défis <i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink></div>
          <p v-if="sectionLoading.challenges" role="status">Chargement des défis…</p>
          <div v-else-if="sectionErrors.challenges" class="section-error" role="alert"><p>{{ sectionErrors.challenges }}</p><button class="text-button" type="button" @click="loadChallengesData()">Réessayer les défis</button></div>
          <div v-else-if="activeChallenges.length" class="activity-grid"><ChallengeCard v-for="challenge in displayedChallenges" :key="challenge.id" :challenge="challenge" :house-color="houseColor" @click="showChallengeDetails" /></div>
          <div v-else class="empty-state"><i class="pi pi-flag" aria-hidden="true"></i><div><h3>Aucun défi actif</h3><p>Cette section affichera les prochains défis dès leur publication.</p></div></div>
        </section>

        <section v-if="collectionsEnabled" class="activity-section" aria-labelledby="badges-title">
          <div class="section-heading"><div><h2 id="badges-title">Derniers badges</h2><p v-if="!sectionErrors.badges && !sectionLoading.badges">{{ userBadges.length }} badge{{ userBadges.length > 1 ? 's' : '' }} obtenu{{ userBadges.length > 1 ? 's' : '' }} sur {{ allBadges.length }}.</p></div><RouterLink v-if="!isViewingOtherUser" class="text-button" to="/achievements">Tous les badges <i class="pi pi-arrow-right" aria-hidden="true"></i></RouterLink></div>
          <p v-if="sectionLoading.badges" role="status">Chargement des badges…</p>
          <div v-else-if="sectionErrors.badges" class="section-error" role="alert"><p>{{ sectionErrors.badges }}</p><button class="text-button" type="button" @click="loadBadgesData()">Réessayer les badges</button></div>
          <div v-else-if="userBadges.length" class="activity-grid badge-grid"><BadgeCard v-for="badge in displayedBadges" :key="badge.id" :badge="badge" :is-unlocked="true" @click="showBadgeDetails" /></div>
          <div v-else class="empty-state"><i class="pi pi-shield" aria-hidden="true"></i><div><h3>Aucun badge obtenu</h3><p>Les conditions de déblocage sont visibles sur la page des badges.</p></div></div>
        </section>
      </template>
    </div>
  </main>

  <DetailModal v-model="showDetailModal" :type="modalType" :item="modalItem" :read-only="isViewingOtherUser" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHouseQuizStatus } from '@/composables/useHouseQuizStatus'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase.js'
import gamificationServiceSupabase, { HES_HOUSES } from '@/service/gamificationServiceSupabase'
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
import { formatStreakDays, nextMilestoneLabel, nextMilestoneProgress, streakLabel } from '@/utils/loginStreak'
import FondHarmonis from '@/assets/maisons/FondHarmonis.png'
import FondElaris from '@/assets/maisons/FondElaris.png'
import FondDoloris from '@/assets/maisons/FondDoloris.png'
import FondSolencia from '@/assets/maisons/FondSolencia.png'
import MaitreDuJeuFond from '@/assets/maisons/MaitreDuJeuFond.png'

const props = defineProps({ id: { type: String, default: null } })
const router = useRouter()
const authStore = useAuthStore()
const collectionsEnabled = gamificationFeatures.userJourney && gamificationFeatures.badgesChallenges
const gamesEnabled = gamificationFeatures.gamesHub
const houseQuizEnabled = gamificationFeatures.userJourney && gamificationFeatures.houseQuiz
const { quizOpen: houseQuizOpen } = useHouseQuizStatus({ enabled: houseQuizEnabled })
const displayUserId = computed(() => props.id || authStore.user?.id)
const isViewingOtherUser = computed(() => Boolean(props.id && props.id !== authStore.user?.id))

const loading = ref(true)
const error = ref(null)
const userStats = ref(null)
const userBadges = ref([])
const allBadges = ref([])
const activeChallenges = ref([])
const challengeStats = ref({ totalCompleted: 0, totalXPFromChallenges: 0 })
const assignedQuests = ref([])
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
const loginStreak = ref(null)
const sectionErrors = ref({ quests: null, badges: null, challenges: null })
const sectionLoading = ref({ quests: false, badges: false, challenges: false })
const currentTime = ref(Date.now())
let profileGeneration = 0
let historyGeneration = 0
let clock = null
const isCurrent = (userId, generation) => userId === displayUserId.value && generation === profileGeneration

const houseConfig = {
  Harmonis: { color: HES_HOUSES.harmonis.color, image: FondHarmonis },
  Elaris: { color: HES_HOUSES.elaris.color, image: FondElaris },
  Doloris: { color: HES_HOUSES.doloris.color, image: FondDoloris },
  Solencia: { color: HES_HOUSES.solencia.color, image: FondSolencia },
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
const houseIdentity = computed(() => HES_HOUSES[normalizedHouse.value?.toLowerCase()] || null)
const houseColor = computed(() => houseConfig[normalizedHouse.value]?.color || '#70819b')
const houseTextColor = computed(() => getReadableTextColor(houseColor.value))
const currentLevel = computed(() => Math.min(20, Math.max(1, Number(userStats.value?.niveau) || 1)))
const totalXP = computed(() => Number(userStats.value?.xp || userStats.value?.totalXP || 0))
const currentLevelInfo = computed(() => levelsConfig.getLevelInfo(currentLevel.value))
const isMaximumLevel = computed(() => currentLevel.value >= 20)
const xpProgress = computed(() => isMaximumLevel.value ? 100 : levelsConfig.getLevelProgress(currentLevel.value, totalXP.value))
const xpToNextLevel = computed(() => isMaximumLevel.value ? 0 : levelsConfig.getXPToNextLevel(currentLevel.value, totalXP.value))
const activeQuests = computed(() => assignedQuests.value.filter(quest => {
  if (!['not_started', 'in_progress'].includes(quest.status || quest.userProgress?.status)) return false
  const deadline = quest.end_date || quest.endDate
  if (!deadline) return true
  const timestamp = new Date(deadline).getTime()
  return !Number.isFinite(timestamp) || timestamp > currentTime.value
}))
const questProgress = quest => Math.min(100, Math.max(0, Number(quest?.progress ?? quest?.userProgress?.progress) || 0))
const featuredQuest = computed(() => [...activeQuests.value].sort((a, b) => questProgress(b) - questProgress(a))[0] || null)
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

const loadHistory = async (reset = false, generation = profileGeneration) => {
  const userId = displayUserId.value
  if (!userId || (historyLoading.value && !reset)) return
  const request = ++historyGeneration
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
    if (!isCurrent(userId, generation) || request !== historyGeneration) return
    historyItems.value = reset ? result.items : [...historyItems.value, ...result.items]
    historyPage.value = result.page
    historyTotal.value = result.total
    historyHasMore.value = result.hasMore
  } catch (loadError) {
    if (!isCurrent(userId, generation) || request !== historyGeneration) return
    console.error('Erreur lors du chargement de l’historique gamification:', loadError)
    historyError.value = 'Vérifiez votre connexion puis réessayez.'
  } finally {
    if (isCurrent(userId, generation) && request === historyGeneration) historyLoading.value = false
  }
}

const profileDisplayName = (profile, gamificationData) => {
  if (profile?.display_name?.trim()) return profile.display_name.trim()
  const fullName = [profile?.family_name, profile?.forname].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  const email = profile?.email || gamificationData?.email || (!isViewingOtherUser.value ? authStore.user?.email : null)
  return email?.split('@')[0] || 'Profil étudiant'
}

const loadBadgesData = async (userId = displayUserId.value, generation = profileGeneration) => {
  if (!collectionsEnabled) return
  if (!userId || sectionLoading.value.badges) return
  sectionLoading.value.badges = true
  sectionErrors.value.badges = null
  try {
    const [available, earned] = await Promise.all([badgesService.getAllBadges(), badgesService.getUserBadges(userId)])
    if (!isCurrent(userId, generation)) return
    allBadges.value = available
    userBadges.value = earned
  } catch (loadError) {
    if (!isCurrent(userId, generation)) return
    console.error('Erreur lors du chargement des badges:', loadError)
    sectionErrors.value.badges = 'Les badges n’ont pas pu être chargés. Réessayez pour retrouver votre collection.'
  } finally {
    if (isCurrent(userId, generation)) sectionLoading.value.badges = false
  }
}

const loadChallengesData = async (userId = displayUserId.value, generation = profileGeneration) => {
  if (!collectionsEnabled) return
  if (!userId || sectionLoading.value.challenges) return
  sectionLoading.value.challenges = true
  sectionErrors.value.challenges = null
  try {
    const [challenges, stats] = await Promise.all([challengesService.getUserActiveChallenges(userId), challengesService.getUserChallengeStats(userId)])
    if (!isCurrent(userId, generation)) return
    activeChallenges.value = challenges
    challengeStats.value = stats
  } catch (loadError) {
    if (!isCurrent(userId, generation)) return
    console.error('Erreur lors du chargement des défis:', loadError)
    sectionErrors.value.challenges = 'Les défis n’ont pas pu être chargés. Votre progression sera visible après une nouvelle tentative.'
  } finally {
    if (isCurrent(userId, generation)) sectionLoading.value.challenges = false
  }
}

const loadQuestsData = async (userId = displayUserId.value, generation = profileGeneration) => {
  if (!userId || sectionLoading.value.quests) return
  sectionLoading.value.quests = true
  sectionErrors.value.quests = null
  try {
    const [quests, stats] = await Promise.all([userQuestsService.getUserQuests(userId), userQuestsService.getQuestStats(userId, { strict: true })])
    if (!isCurrent(userId, generation)) return
    assignedQuests.value = quests
    questStats.value = stats
  } catch (loadError) {
    if (!isCurrent(userId, generation)) return
    console.error('Erreur lors du chargement des quêtes:', loadError)
    sectionErrors.value.quests = 'Les objectifs n’ont pas pu être chargés. Réessayez pour retrouver vos quêtes.'
  } finally {
    if (isCurrent(userId, generation)) sectionLoading.value.quests = false
  }
}

// Série de connexions : uniquement pour son propre profil (la RPC ne lit que le compte connecté).
const loadLoginStreak = async (userId = displayUserId.value, generation = profileGeneration) => {
  if (!userId || isViewingOtherUser.value || typeof gamificationServiceSupabase.getMyLoginStreak !== 'function') return
  try {
    const streak = await gamificationServiceSupabase.getMyLoginStreak()
    if (isCurrent(userId, generation)) loginStreak.value = streak
  } catch {
    // Série indisponible : le reste de la page reste utilisable, la carte est simplement masquée.
    if (isCurrent(userId, generation)) loginStreak.value = null
  }
}
const onLoginStreakUpdated = (event) => {
  const detail = event?.detail
  if (!detail?.streak || isViewingOtherUser.value || detail.userId !== displayUserId.value) return
  loginStreak.value = detail.streak
}

const loadUserStats = async () => {
  const generation = ++profileGeneration
  historyGeneration++
  loading.value = true
  error.value = null
  userStats.value = null
  assignedQuests.value = []
  userBadges.value = []
  allBadges.value = []
  activeChallenges.value = []
  questStats.value = {}
  challengeStats.value = {}
  historyItems.value = []
  historyPage.value = 0
  historyTotal.value = 0
  historyHasMore.value = false
  historyLoading.value = false
  historyError.value = null
  loginStreak.value = null
  showDetailModal.value = false
  modalItem.value = null
  sectionErrors.value = { quests: null, badges: null, challenges: null }
  sectionLoading.value = { quests: false, badges: false, challenges: false }
  const userId = displayUserId.value
  if (!userId) {
    error.value = 'Aucun utilisateur n’est disponible pour cette consultation.'
    loading.value = false
    return
  }
  try {
    const [gamificationData, profileResult] = await Promise.all([
      gamificationServiceSupabase.getUserGamificationData(userId, { strict: true, refresh: true }),
      supabase.from('user_profiles').select('display_name, forname, family_name, email').eq('user_id', userId).maybeSingle()
    ])
    if (!isCurrent(userId, generation)) return
    if (profileResult.error && profileResult.error.code !== 'PGRST116') throw profileResult.error
    userStats.value = {
      uid: userId,
      displayName: profileDisplayName(profileResult.data, gamificationData),
      niveau: gamificationData?.current_level || gamificationData?.niveau || 1,
      xp: gamificationData?.total_xp ?? gamificationData?.xp ?? 0,
      maison: gamificationData?.house_name || gamificationData?.maison || null
    }
    loading.value = false
    await Promise.all([loadQuestsData(userId, generation), loadBadgesData(userId, generation), loadChallengesData(userId, generation), loadHistory(true, generation), loadLoginStreak(userId, generation)])
  } catch (loadError) {
    if (!isCurrent(userId, generation)) return
    console.error('Erreur lors du chargement du profil gamification:', loadError)
    error.value = 'Vérifiez votre connexion puis réessayez.'
  } finally {
    if (isCurrent(userId, generation)) loading.value = false
  }
}

const showBadgeDetails = (badge) => { modalType.value = 'badge'; modalItem.value = badge; showDetailModal.value = true }
const showChallengeDetails = (challenge) => { modalType.value = 'challenge'; modalItem.value = challenge; showDetailModal.value = true }
const goBack = () => router.back()
const goTo = (path) => router.push(path)

watch([displayUserId, () => authStore.user?.id], () => loadUserStats(), { flush: 'sync' })
onMounted(() => {
  window.addEventListener('gamification:login-streak', onLoginStreakUpdated)
  loadUserStats()
  clock = setInterval(() => { currentTime.value = Date.now() }, 60000)
})
onBeforeUnmount(() => {
  profileGeneration++
  historyGeneration++
  window.removeEventListener('gamification:login-streak', onLoginStreakUpdated)
  clearInterval(clock)
})
</script>

<style scoped>
.gamification-profile-page { box-sizing: border-box; width: 100%; min-height: 100%; padding: 1rem 1rem 6rem; color: var(--text-color, #f8fafc); background: transparent; }
.profile-shell { width: min(100%, 1240px); margin: 0 auto; }
.identity-copy h2, .identity-copy p, .section-heading h2, .section-heading p, .empty-state h3, .empty-state p, .quick-stats p, .state-panel h2, .state-panel p { margin: 0; }
.section-heading p, .progress-copy, .empty-state p, .state-panel p { color: var(--text-color-secondary, #b7c2d4); line-height: 1.55; }
.primary-button, .secondary-button, .text-button, .gamification-navigation a { min-height: 44px; font: inherit; cursor: pointer; text-decoration: none; }
button:focus-visible, a:focus-visible { outline: 3px solid var(--text-color); outline-offset: 3px; }
.state-panel { display: flex; align-items: flex-start; gap: 1rem; min-height: 180px; padding: 1.5rem; border-radius: 16px; background: var(--surface-card, #071426); box-shadow: 0 16px 40px rgba(0,0,0,.18); }
.state-panel > i { margin-top: .2rem; color: var(--house-color); font-size: 1.5rem; }
.state-panel h2 { margin-bottom: .45rem; font-size: 1.2rem; }
.error-state > i { color: #fca5a5; }
.primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: .6rem; margin-top: 1rem; padding: .65rem 1rem; border: 0; border-radius: 12px; font-weight: 700; }
.primary-button { color: #071426; background: #f3c300; }
.secondary-button { border: 1px solid var(--surface-border); color: var(--text-color); background: var(--surface-section); }
.profile-summary { display: grid; overflow: hidden; border-radius: 16px; background: var(--surface-card, #071426); box-shadow: 0 18px 48px rgba(0,0,0,.22); }
.identity-panel, .progress-panel { padding: 1.35rem; }
.identity-panel { position: relative; isolation: isolate; display: flex; flex-direction: column; justify-content: space-between; min-height: 220px; color: var(--text-color); background: var(--surface-card, #071426); }
.context-label, .summary-label { display: block; margin: 0 0 .35rem; color: var(--text-color-secondary); font-size: .78rem; font-weight: 700; letter-spacing: .055em; text-transform: uppercase; }
.identity-panel .summary-label { color: var(--text-color-secondary); }
.identity-copy h2 { max-width: 24ch; color: var(--text-color); overflow-wrap: anywhere; font-size: clamp(1.65rem, 4vw, 2.5rem); line-height: 1.12; letter-spacing: -.025em; }
.level-name { margin-top: .65rem !important; color: var(--text-color-secondary); }
.house-summary { display: flex; align-items: center; gap: .8rem; margin-top: 2rem; }
.house-summary strong { display: block; font-size: 1.1rem; }
.house-motto { margin: .8rem 0 0; color: var(--text-color-secondary); font-size: 1rem; line-height: 1.55; }
.house-icon { display: grid; flex: 0 0 44px; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: var(--house-foreground); background: var(--house-color); }
:deep(h1[tabindex="-1"]:focus-visible) { outline: 2px solid var(--primary-color); outline-offset: .3rem; }
.progress-panel { display: flex; flex-direction: column; justify-content: center; min-height: 180px; background: color-mix(in srgb, var(--surface-card, #071426) 88%, var(--house-color)); }
.progress-heading { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.progress-heading strong { display: block; font-size: clamp(1.8rem, 8vw, 3rem); line-height: 1; white-space: nowrap; }
.level-chip { flex: 0 0 auto; padding: .45rem .7rem; border-radius: 999px; color: var(--house-foreground); background: var(--house-color); font-size: .82rem; font-weight: 800; }
.level-progress { overflow: hidden; height: 12px; margin: 1.5rem 0 .75rem; border-radius: 999px; background: rgba(255,255,255,.14); }
.level-progress span { display: block; width: 100%; height: 100%; border-radius: inherit; background: var(--house-color); transform-origin: left center; transition: transform 500ms cubic-bezier(.16,1,.3,1); }
.quick-stats { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); margin: 1rem 0 1.5rem; border-radius: 14px; background: var(--surface-card, #071426); }
.quick-stats div { padding: 1rem; }
.quick-stats div:nth-child(odd) { border-right: 1px solid var(--surface-border, #26364d); }
.quick-stats div:nth-child(-n+2) { border-bottom: 1px solid var(--surface-border, #26364d); }
.quick-stats span { display: block; font-size: 1.65rem; font-weight: 800; }
.quick-stats p { margin-top: .2rem; color: var(--text-color-secondary); font-size: .86rem; }
.streak-panel { display: grid; gap: 1.25rem; margin-top: 1rem; padding: clamp(1.15rem, 3vw, 2rem); border: 1px solid var(--surface-border); border-radius: 16px; background: var(--surface-card); }
.streak-panel h2 { margin: 0 0 .35rem; font-size: clamp(1.5rem, 5vw, 2.1rem); line-height: 1.15; letter-spacing: -.02em; }
.streak-panel p { margin: 0; color: var(--text-color-secondary); line-height: 1.55; }
.streak-panel__hint { margin-top: .5rem !important; }
.streak-panel__goal { color: var(--text-color) !important; font-weight: 700; }
.streak-progress { margin: .75rem 0 1rem; }
.streak-milestones { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; margin: 0; padding: 0; list-style: none; }
.streak-milestones li { display: flex; align-items: center; gap: .55rem; color: var(--text-color-secondary); }
.streak-milestones li > i { font-size: 1.1rem; }
.streak-milestones li.is-reached { color: var(--text-color); }
.streak-milestones li.is-reached > i { color: var(--primary-color, #f3c300); }
.streak-milestones strong, .streak-milestones small { display: block; }
.streak-milestones small { font-size: .82rem; }
.next-step { margin: 1.5rem 0; padding: clamp(1.15rem, 3vw, 2rem); border: 1px solid var(--surface-border); border-radius: 16px; background: var(--surface-card); }
.next-step__heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.next-step__heading h2 { margin: 0; font-size: 1.1rem; }
.next-step__heading > i { color: var(--primary-color, #f3c300); font-size: 1.5rem; }
.next-step__body { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.25rem; }
.next-step__body > div { flex: 1 1 24rem; min-width: 0; }
.next-step__body h3 { margin: 0 0 .55rem; font-size: clamp(1.3rem, 2.4vw, 1.75rem); line-height: 1.2; letter-spacing: -.02em; overflow-wrap: anywhere; }
.next-step__body p { max-width: 65ch; margin: 0; color: var(--text-color-secondary); line-height: 1.6; overflow-wrap: anywhere; }
.next-step__body .primary-button { margin: 0; flex: 0 0 auto; }
.next-step__progress { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; margin-top: 1.4rem; font-size: .86rem; color: var(--text-color-secondary); }
.next-step__progress > div { height: 8px; flex: 1 1 140px; overflow: hidden; border-radius: 8px; background: var(--surface-border); }
.next-step__progress > div > span { display: block; width: 100%; height: 100%; transform-origin: left; background: var(--house-color); transition: transform 300ms ease-out; }
.next-step__progress strong { margin-inline-start: auto; color: var(--text-color); }
.next-step__loading { min-height: 44px; color: var(--text-color-secondary); }
.section-error { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .5rem 1.5rem; }
.section-error p { flex: 1 1 220px; margin: 0; line-height: 1.55; color: var(--text-color-secondary); }
.explore-section { margin: 0 0 1.5rem; padding: 1.15rem; border: 1px solid color-mix(in srgb, var(--surface-border, #26364d) 82%, transparent); border-radius: 16px; background: var(--surface-card, #071426); }
.explore-heading { margin-bottom: 1rem; }
.gamification-navigation { display: grid; gap: .65rem; }
.gamification-navigation a { display: grid; grid-template-columns: 30px minmax(0,1fr) 20px; align-items: center; gap: .75rem; width: 100%; padding: .9rem .5rem; border-bottom: 1px solid var(--surface-border); color: inherit; text-align: left; background: transparent; transition: background-color 160ms ease-out; }
.gamification-navigation a:hover { background: var(--surface-hover); }
.gamification-navigation a > i:first-child { color: var(--house-color); font-size: 1.2rem; }
.gamification-navigation span { min-width: 0; }
.gamification-navigation strong, .gamification-navigation small { display: block; }
.gamification-navigation small { margin-top: .2rem; color: var(--text-color-secondary); line-height: 1.35; }
.activity-section { margin-top: 1.25rem; padding: 1.15rem; border-radius: 16px; background: var(--surface-card, #071426); }
.section-heading { display: flex; flex-direction: column; align-items: flex-start; gap: .85rem; margin-bottom: 1.15rem; }
.section-heading h2 { font-size: 1.25rem; }
.section-heading p { margin-top: .3rem; }
.text-button { display: inline-flex; align-items: center; gap: .45rem; padding: .5rem 0; border: 0; color: var(--text-color); font-weight: 700; background: transparent; text-decoration: underline; text-underline-offset: .2em; }
.activity-grid { display: grid; gap: 1rem; }
.quest-preview-list { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
.quest-preview-list li { display: grid; grid-template-columns: 44px minmax(0,1fr) auto; align-items: center; gap: .8rem; min-height: 68px; padding: .7rem .8rem; border-radius: 12px; background: color-mix(in srgb, var(--surface-card, #071426) 88%, white); }
.quest-preview-list strong, .quest-preview-list small { display: block; }
.quest-preview-list strong { overflow-wrap: anywhere; }
.quest-preview-list small { display: -webkit-box; overflow: hidden; margin-top: .2rem; color: var(--text-color-secondary); line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.preview-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: var(--house-foreground); background: var(--house-color); }
.quest-reward { color: var(--text-color); font-size: .82rem; font-weight: 800; white-space: nowrap; }
.history-total { flex: 0 0 auto; padding: .4rem .65rem; border-radius: 999px; color: var(--house-foreground); background: var(--house-color); font-size: .78rem; font-weight: 800; }
.history-summary { display: flex; align-items: center; gap: 1rem; min-height: 44px; cursor: pointer; list-style: none; }
.history-summary::-webkit-details-marker { display: none; }
.history-summary > div { flex: 1; min-width: 0; }
.history-summary h2 { margin: 0; font-size: 1.25rem; }
.history-summary p { margin: .3rem 0 0; color: var(--text-color-secondary); line-height: 1.55; }
.history-summary:focus-visible { outline: 3px solid var(--text-color); outline-offset: 3px; }
.history-summary > i { flex: 0 0 auto; transition: transform 150ms ease-out; }
.history-section[open] .history-summary { margin-bottom: 1.15rem; }
.history-section[open] .history-summary > i { transform: rotate(180deg); }
.history-loading, .history-error { display: flex; align-items: center; gap: .75rem; min-height: 76px; padding: .85rem; border-radius: 12px; color: var(--text-color-secondary); background: color-mix(in srgb, var(--surface-card, #071426) 88%, white); }
.history-error { color: var(--text-color); }
.history-error p { margin: .2rem 0 0; }
.history-error .text-button { margin-left: auto; }
.history-list { display: grid; gap: .55rem; margin: 0; padding: 0; list-style: none; }
.history-list li { display: grid; grid-template-columns: 44px minmax(0,1fr) auto; align-items: center; gap: .8rem; min-height: 74px; padding: .75rem .8rem; border: 1px solid color-mix(in srgb, var(--surface-border, #26364d) 82%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--surface-card, #071426) 92%, white); }
.history-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; color: var(--house-foreground); background: var(--house-color); }
.history-copy { min-width: 0; }
.history-line { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
.history-line strong { overflow-wrap: anywhere; }
.history-line time { flex: 0 0 auto; color: var(--text-color-secondary); font-size: .76rem; }
.history-copy p { margin: .18rem 0 0; color: var(--text-color-secondary); font-size: .82rem; line-height: 1.4; }
.linked-object { display: inline-flex; margin-top: .4rem; padding: .22rem .45rem; border-radius: 7px; color: var(--text-color); background: var(--surface-hover); font-size: .72rem; font-weight: 700; }
.history-points { min-width: 96px; text-align: right; }
.history-points strong, .history-points small { display: block; }
.history-points strong { color: var(--text-color); }
.history-points small { margin-top: .2rem; color: var(--text-color-secondary); font-size: .72rem; }
.history-more { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: .5rem; width: 100%; margin-top: .8rem; padding: .65rem 1rem; border: 1px solid var(--surface-border, #26364d); border-radius: 12px; color: inherit; background: transparent; font: inherit; font-weight: 700; cursor: pointer; }
.history-more:disabled { cursor: wait; opacity: .65; }
.history-inline-error { margin: .7rem 0 0; color: var(--text-color); font-size: .82rem; }
.empty-state { display: flex; align-items: flex-start; gap: .9rem; padding: 1rem 0; }
.empty-state > i { margin-top: .2rem; color: var(--house-color); font-size: 1.35rem; }
.empty-state h3 { margin-bottom: .25rem; font-size: 1rem; }
@media (min-width: 700px) {
  .gamification-profile-page { padding: 1.5rem 1.5rem 7rem; }
  .profile-summary { grid-template-columns: minmax(0,1.35fr) minmax(280px,.75fr); }
  .identity-panel, .progress-panel { padding: 2rem; }
  .streak-panel { grid-template-columns: minmax(0,1fr) minmax(0,1.15fr); align-items: center; gap: 2rem; }
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
  .gamification-navigation { grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); }
  .gamification-navigation a { min-height: 82px; }
  .explore-section { padding: 1.5rem; }
  .activity-section { padding: 1.5rem; }
  .activity-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
  .quest-preview-list { grid-template-columns: repeat(3,minmax(0,1fr)); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
</style>
