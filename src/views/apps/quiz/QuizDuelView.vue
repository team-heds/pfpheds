<template>
  <Navbar />
  <main class="quiz-page duel-page" data-page-scroll>
    <div class="quiz-shell quiz-shell--narrow">
      <GamificationPageHeader
        title="Duels de quiz"
        description="Affrontez un autre joueur sur 5 questions. Le gagnant rapporte des points à sa maison."
        icon="pi pi-bolt"
        @back="goBack"
      />

      <section v-if="loading" class="quiz-panel quiz-state" aria-live="polite" aria-busy="true">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement des duels</h2><p class="quiz-muted">Un instant…</p></div>
      </section>

      <section v-else-if="error" class="quiz-panel quiz-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>Les duels ne sont pas disponibles</h2>
          <p class="quiz-muted">{{ error }}</p>
          <div class="quiz-actions quiz-gap">
            <Button label="Réessayer" icon="pi pi-refresh" @click="loadOverview" />
          </div>
        </div>
      </section>

      <!-- ============ Un duel ============ -->
      <template v-else-if="selectedId">
        <QuizDuelPlay
          v-if="playing"
          :duel-id="selectedId"
          @finished="onPlayFinished"
          @close="closePlay"
        />

        <section v-else-if="detailLoading && !detail" class="quiz-panel quiz-state" aria-busy="true">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <p>Chargement du duel…</p>
        </section>

        <section v-else-if="detailError" class="quiz-panel quiz-state" role="alert">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <div>
            <h2>Duel indisponible</h2>
            <p class="quiz-muted">{{ detailError }}</p>
            <div class="quiz-actions quiz-gap">
              <Button label="Mes duels" icon="pi pi-arrow-left" @click="openList" />
            </div>
          </div>
        </section>

        <template v-else-if="detail">
          <section class="quiz-panel" aria-labelledby="duel-detail-title">
            <p class="duel-eyebrow">{{ detail.theme || 'Tous thèmes' }} · {{ detail.matchmaking === 'random' ? 'adversaire au hasard' : 'défi direct' }}</p>
            <h2 id="duel-detail-title" ref="detailTitle" tabindex="-1" class="duel-title">
              <template v-if="detail.state === 'done'">{{ resultHeadline(detail) }}</template>
              <template v-else>Duel contre {{ detail.opponent?.name }}</template>
            </h2>
            <p class="duel-player">
              <span class="quiz-house" :style="{ '--house-dot': detail.opponent?.house_color }">
                <span class="quiz-house__dot" aria-hidden="true"></span>
                {{ detail.opponent?.name }}
              </span>
              <span v-if="detail.opponent?.house_name" class="quiz-muted">{{ detail.opponent.house_name }}</span>
              <span v-if="detail.opponent?.classe" class="quiz-muted">{{ detail.opponent.classe }}</span>
            </p>

            <!-- À jouer -->
            <template v-if="detail.state === 'to_play'">
              <ul class="duel-rules quiz-muted">
                <li>5 questions, 20 secondes chacune, sans pause : le chronomètre est tenu par le serveur.</li>
                <li>Score : bonnes réponses, puis temps total le plus court en cas d’égalité.</li>
                <li>La correction s’affiche quand vous aurez joué tous les deux.</li>
                <li>Délai : {{ formatTimeLeft(detail.expires_at, now) }} pour jouer. Sans réponse, l’autre gagne par forfait (sans points).</li>
              </ul>
              <p v-if="detail.opponent_finished" class="duel-note" role="status">
                <i class="pi pi-flag" aria-hidden="true"></i>{{ detail.opponent?.name }} a déjà joué : à vous !
              </p>
              <div class="quiz-actions quiz-gap">
                <Button
                  :label="detail.my_started ? 'Reprendre le duel' : (detail.needs_response ? 'Accepter et jouer' : 'Jouer maintenant')"
                  icon="pi pi-play"
                  :loading="acting"
                  @click="startPlay"
                />
                <Button
                  v-if="detail.needs_response"
                  label="Refuser"
                  icon="pi pi-times"
                  severity="secondary"
                  outlined
                  :loading="declining"
                  @click="decline"
                />
                <Button label="Mes duels" icon="pi pi-arrow-left" text @click="openList" />
              </div>
            </template>

            <!-- En attente -->
            <template v-else-if="detail.state !== 'done'">
              <p class="duel-note quiz-gap" role="status">
                <i class="pi pi-hourglass" aria-hidden="true"></i>
                <span v-if="detail.state === 'closing'">Délai écoulé : le résultat est en cours de calcul.</span>
                <span v-else>
                  Vos réponses sont enregistrées. {{ detail.opponent?.name }} a encore
                  {{ formatTimeLeft(detail.expires_at, now) }} pour jouer ; vous serez prévenu·e du résultat.
                </span>
              </p>
              <div class="quiz-actions quiz-gap">
                <Button label="Mes duels" icon="pi pi-arrow-left" @click="openList" />
                <Button label="Actualiser" icon="pi pi-refresh" outlined :loading="detailLoading" @click="loadDetail" />
              </div>
            </template>

            <!-- Terminé -->
            <template v-else>
              <dl v-if="detail.outcome?.my_correct !== null && detail.outcome?.my_correct !== undefined" class="duel-score">
                <div :class="{ 'is-winner': detail.outcome.result === 'win' }">
                  <dt>Vous</dt>
                  <dd>{{ detail.outcome.my_correct }} / 5</dd>
                  <dd class="duel-score__time">{{ formatDuelTime(detail.outcome.my_ms) }}</dd>
                </div>
                <div :class="{ 'is-winner': detail.outcome.result === 'loss' }">
                  <dt>{{ detail.opponent?.name }}</dt>
                  <dd>{{ detail.outcome.opponent_correct ?? '—' }}<template v-if="detail.outcome.opponent_correct !== null"> / 5</template></dd>
                  <dd class="duel-score__time">{{ detail.outcome.opponent_ms !== null ? formatDuelTime(detail.outcome.opponent_ms) : 'n’a pas joué' }}</dd>
                </div>
              </dl>
              <p class="quiz-muted quiz-gap">{{ outcomeMessage(detail) }}</p>
              <div class="quiz-actions quiz-gap">
                <Button label="Nouveau duel" icon="pi pi-bolt" @click="openList({ focusLauncher: true })" />
                <Button label="Mes duels" icon="pi pi-arrow-left" outlined @click="openList" />
              </div>
            </template>
          </section>

          <!-- Correction -->
          <section v-if="detail.correction?.length" class="quiz-panel" aria-labelledby="duel-correction-title">
            <h2 id="duel-correction-title" class="quiz-subtitle">Correction</h2>
            <ol class="duel-correction">
              <li v-for="item in detail.correction" :key="item.position" class="duel-correction__item">
                <h3>
                  <span class="duel-correction__num">{{ item.position }}</span>
                  {{ item.prompt }}
                </h3>
                <ul class="duel-correction__options">
                  <li
                    v-for="option in item.options"
                    :key="option.id"
                    :class="{ 'is-correct': option.correct }"
                  >
                    <i :class="option.correct ? 'pi pi-check' : 'pi pi-minus'" aria-hidden="true"></i>
                    <span class="duel-correction__label">
                      {{ option.label }}
                      <span v-if="option.correct" class="quiz-sr-only">(bonne réponse)</span>
                    </span>
                    <span class="duel-correction__who">
                      <span v-if="item.mine?.selected?.includes(option.id)" class="duel-chip">Vous</span>
                      <span v-if="item.opponent?.selected?.includes(option.id)" class="duel-chip duel-chip--other">Adversaire</span>
                    </span>
                  </li>
                </ul>
                <p class="duel-correction__verdicts">
                  <span :class="item.mine?.is_correct ? 'is-ok' : 'is-ko'">
                    Vous : {{ answerVerdict(item.mine) }}
                  </span>
                  <span v-if="item.opponent" :class="item.opponent.is_correct ? 'is-ok' : 'is-ko'">
                    Adversaire : {{ answerVerdict(item.opponent) }}
                  </span>
                </p>
                <p v-if="item.explanation" class="duel-correction__explanation">{{ item.explanation }}</p>
              </li>
            </ol>
          </section>
          <section
            v-else-if="detail.state === 'done' && (detail.my_answered || 0) < 5"
            class="quiz-panel"
          >
            <p class="quiz-muted">La correction est réservée aux joueurs qui ont répondu aux 5 questions.</p>
          </section>
        </template>
      </template>

      <!-- ============ Mes duels ============ -->
      <template v-else-if="overview">
        <section class="quiz-panel" aria-labelledby="duel-stats-title">
          <h2 id="duel-stats-title" class="quiz-subtitle">Mon bilan</h2>
          <dl class="duel-stats">
            <div><dt>Victoires</dt><dd>{{ stats.wins }}</dd></div>
            <div><dt>Défaites</dt><dd>{{ stats.losses }}</dd></div>
            <div><dt>Égalités</dt><dd>{{ stats.draws }}</dd></div>
            <div>
              <dt>Série en cours</dt>
              <dd>{{ stats.streak }}<span class="duel-stats__sub"> record {{ stats.best_streak }}</span></dd>
            </div>
          </dl>
          <p class="quiz-muted duel-stats__note">
            {{ stats.xp_total }} XP gagnés en duel ·
            {{ Math.min(stats.rewarded_today, DUEL_DAILY_REWARD_CAP) }} / {{ DUEL_DAILY_REWARD_CAP }} duels récompensés aujourd’hui
          </p>
        </section>

        <!-- Lancer un duel -->
        <section ref="launcherSection" class="quiz-panel" aria-labelledby="duel-launch-title">
          <h2 id="duel-launch-title" tabindex="-1" class="quiz-subtitle">Lancer un duel</h2>

          <p v-if="overview.question_count < 5" class="duel-note quiz-gap" role="status">
            <i class="pi pi-info-circle" aria-hidden="true"></i>
            <span>
              Pas encore assez de questions publiées
              ({{ overview.question_count }} sur 5 nécessaires). Les duels s’ouvriront dès que vos
              enseignants auront publié des quiz.
            </span>
          </p>

          <template v-else>
            <div class="duel-mode quiz-gap" role="group" aria-label="Choix de l’adversaire">
              <button
                type="button"
                class="duel-mode__btn"
                :aria-pressed="mode === 'random'"
                @click="mode = 'random'"
              >
                <i class="pi pi-sync" aria-hidden="true"></i>
                <span><strong>Au hasard</strong><small>un joueur d’une autre maison</small></span>
              </button>
              <button
                type="button"
                class="duel-mode__btn"
                :aria-pressed="mode === 'direct'"
                @click="mode = 'direct'"
              >
                <i class="pi pi-user" aria-hidden="true"></i>
                <span><strong>Défier quelqu’un</strong><small>recherche par nom</small></span>
              </button>
            </div>

            <div v-if="mode === 'direct'" class="quiz-field quiz-gap">
              <label for="duel-search">Adversaire</label>
              <div v-if="opponent" class="duel-picked">
                <span class="quiz-house" :style="{ '--house-dot': opponent.house_color }">
                  <span class="quiz-house__dot" aria-hidden="true"></span>
                  <strong>{{ opponent.display_name }}</strong>
                </span>
                <span class="quiz-muted">{{ [opponent.house_name, opponent.classe].filter(Boolean).join(' · ') }}</span>
                <Button label="Changer" icon="pi pi-pencil" text size="small" @click="clearOpponent" />
              </div>
              <template v-else>
                <InputText
                  id="duel-search"
                  v-model="searchTerm"
                  type="search"
                  autocomplete="off"
                  placeholder="Nom ou prénom (2 lettres minimum)"
                  aria-describedby="duel-search-status"
                />
                <p id="duel-search-status" class="quiz-muted duel-search-status" aria-live="polite">{{ searchStatus }}</p>
                <ul v-if="searchResults.length" class="duel-results">
                  <li v-for="player in searchResults" :key="player.user_id">
                    <button
                      type="button"
                      class="duel-results__btn"
                      :disabled="player.has_open_duel"
                      @click="pickOpponent(player)"
                    >
                      <span class="quiz-house" :style="{ '--house-dot': player.house_color }">
                        <span class="quiz-house__dot" aria-hidden="true"></span>
                        {{ player.display_name }}
                      </span>
                      <small>
                        {{ [player.house_name, player.classe].filter(Boolean).join(' · ') }}
                        <template v-if="player.has_open_duel"> · duel déjà en cours</template>
                      </small>
                    </button>
                  </li>
                </ul>
              </template>
            </div>

            <div class="quiz-field quiz-gap">
              <label for="duel-theme">Thème</label>
              <select id="duel-theme" v-model="theme" class="duel-select">
                <option value="">Tous thèmes ({{ overview.question_count }} questions)</option>
                <option v-for="item in overview.themes" :key="item.theme" :value="item.theme">
                  {{ item.theme }} ({{ item.question_count }} question{{ item.question_count > 1 ? 's' : '' }})
                </option>
              </select>
            </div>

            <div v-if="themeTooSmall || launchError" class="duel-warning quiz-gap" role="alert">
              <p>
                <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                {{ themeTooSmall ? `Le thème « ${theme} » n’a que ${selectedTheme.question_count} question${selectedTheme.question_count > 1 ? 's' : ''} : il en faut 5 pour un duel.` : launchError }}
              </p>
              <Button
                v-if="theme && (themeTooSmall || launchErrorCode === 'duel_not_enough_questions')"
                label="Choisir « Tous thèmes »"
                icon="pi pi-th-large"
                size="small"
                outlined
                @click="useAllThemes"
              />
            </div>

            <div class="quiz-actions quiz-gap">
              <Button
                :label="mode === 'random' ? 'Trouver un adversaire' : 'Lancer le défi'"
                icon="pi pi-bolt"
                :disabled="themeTooSmall || (mode === 'direct' && !opponent)"
                :loading="creating"
                @click="createDuel"
              />
            </div>
          </template>
        </section>

        <!-- Listes -->
        <section v-for="list in lists" :key="list.key" class="quiz-panel" :aria-labelledby="`duel-list-${list.key}`">
          <h2 :id="`duel-list-${list.key}`" class="quiz-subtitle">
            {{ list.title }} <span class="duel-count">{{ list.items.length }}</span>
          </h2>
          <p v-if="list.items.length === 0" class="quiz-muted quiz-gap">{{ list.empty }}</p>
          <ul v-else class="duel-list">
            <li v-for="duel in list.items" :key="duel.id">
              <button type="button" class="duel-row" @click="openDuel(duel.id)">
                <span class="duel-row__main">
                  <span class="quiz-house" :style="{ '--house-dot': duel.opponent?.house_color }">
                    <span class="quiz-house__dot" aria-hidden="true"></span>
                    <strong>{{ duel.opponent?.name }}</strong>
                  </span>
                  <small class="quiz-muted">
                    {{ duel.theme || 'Tous thèmes' }} · {{ duelStatusText(duel, now) }}
                  </small>
                </span>
                <span class="duel-row__side">
                  <span v-if="duel.state === 'done'" class="duel-badge" :class="`is-${duel.outcome?.result}`">
                    {{ duelResultLabel(duel) }}
                  </span>
                  <span v-if="duel.state === 'done' && duel.outcome?.my_xp > 0" class="duel-xp">+{{ duel.outcome.my_xp }} XP</span>
                  <span v-if="duel.state === 'to_play'" class="duel-badge is-todo">{{ duel.needs_response ? 'Répondre' : 'Jouer' }}</span>
                  <i class="pi pi-angle-right" aria-hidden="true"></i>
                </span>
              </button>
            </li>
          </ul>
        </section>

        <details class="quiz-panel duel-help">
          <summary>Règles et points</summary>
          <ul class="quiz-muted">
            <li>Les 5 questions sont tirées parmi les quiz publiés par vos enseignants ; les deux joueurs ont les mêmes.</li>
            <li>20 secondes par question. Une question sans réponse à temps compte comme fausse.</li>
            <li>Vous avez 48 heures pour jouer, chacun quand il veut. L’adversaire peut refuser.</li>
            <li>Victoire : 15 XP · défaite : 5 XP · égalité : 8 XP chacun, comptés aussi pour votre maison.</li>
            <li>Au plus 3 duels récompensés par jour. Si un seul joueur a joué à temps, il gagne par forfait, sans points.</li>
          </ul>
        </details>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMobileImmersive } from '@/mobile/shell/useMobileImmersive'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import QuizDuelPlay from './QuizDuelPlay.vue'
import {
  quizDuelService,
  duelErrorMessage,
  duelErrorCode,
  duelResultLabel,
  duelStatusText,
  formatDuelTime,
  formatTimeLeft,
  groupDuels,
  DUEL_DAILY_REWARD_CAP,
} from '@/service/quizDuelService'
import { gamificationFeatures } from '@/config/gamificationFeatures'
import './quiz-shared.css'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const overview = ref(null)
const now = ref(Date.now())

const mode = ref('random')
const theme = ref('')
const searchTerm = ref('')
const searchResults = ref([])
const searching = ref(false)
const searchError = ref('')
const opponent = ref(null)
const creating = ref(false)
const launchError = ref('')
const launchErrorCode = ref(null)
const launcherSection = ref(null)

const detail = ref(null)
const detailLoading = ref(false)
const detailError = ref('')
const playing = ref(false)
// Sur téléphone, la barre d'onglets se cache pendant la partie.
useMobileImmersive(() => playing.value)
const acting = ref(false)
const declining = ref(false)
const detailTitle = ref(null)

let searchTimer = null
let searchSeq = 0
let clock = null

const selectedId = computed(() => (typeof route.query.duel === 'string' ? route.query.duel : null))
const stats = computed(() => ({
  wins: 0, losses: 0, draws: 0, streak: 0, best_streak: 0, xp_total: 0, rewarded_today: 0,
  ...(overview.value?.stats || {}),
}))
const groups = computed(() => groupDuels(overview.value?.duels || []))
const lists = computed(() => [
  { key: 'to-play', title: 'À jouer', items: groups.value.toPlay, empty: 'Aucun duel à jouer pour le moment.' },
  { key: 'waiting', title: 'En attente de l’adversaire', items: groups.value.waiting, empty: 'Aucun duel en attente.' },
  { key: 'done', title: 'Terminés', items: groups.value.done, empty: 'Vos duels terminés apparaîtront ici.' },
])
const selectedTheme = computed(() => (overview.value?.themes || []).find(item => item.theme === theme.value) || null)
const themeTooSmall = computed(() => Boolean(selectedTheme.value && selectedTheme.value.question_count < 5))
const searchStatus = computed(() => {
  const term = searchTerm.value.trim()
  if (searchError.value) return searchError.value
  if (term.length < 2) return ''
  if (searching.value) return 'Recherche…'
  if (searchResults.value.length === 0) return 'Aucun joueur trouvé.'
  return `${searchResults.value.length} joueur${searchResults.value.length > 1 ? 's' : ''} trouvé${searchResults.value.length > 1 ? 's' : ''}.`
})

function answerVerdict(answer) {
  if (!answer) return 'pas de réponse'
  if (answer.timed_out) return 'temps écoulé'
  return `${answer.is_correct ? 'juste' : 'faux'} en ${formatDuelTime(answer.elapsed_ms)}`
}

function resultHeadline(duel) {
  const name = duel.opponent?.name || 'votre adversaire'
  switch (duel.outcome?.result) {
    case 'win': return duel.outcome.forfeit ? `Victoire par forfait contre ${name}` : `Victoire contre ${name} !`
    case 'loss': return duel.outcome.forfeit ? `Défaite par forfait contre ${name}` : `Défaite contre ${name}`
    case 'draw': return `Égalité parfaite avec ${name}`
    case 'declined': return `Duel refusé (${name})`
    case 'expired': return `Duel expiré (${name})`
    default: return `Duel contre ${name}`
  }
}

function outcomeMessage(duel) {
  const outcome = duel.outcome || {}
  const xp = Number(outcome.my_xp) || 0
  if (outcome.reason === 'declined') {
    return duel.role === 'challenger' ? 'Votre adversaire a refusé le duel. Lancez-en un autre !' : 'Vous avez refusé ce duel.'
  }
  if (outcome.reason === 'expired') return 'Personne n’a terminé le duel dans les 48 heures.'
  if (outcome.reason === 'forfeit') {
    return outcome.result === 'win'
      ? 'Votre adversaire n’a pas joué à temps : victoire par forfait, sans points.'
      : 'Vous n’avez pas joué dans les 48 heures : défaite par forfait.'
  }
  if (xp > 0) return `+${xp} XP pour vous et votre maison.`
  return 'Pas de points pour ce duel (limite de 3 duels récompensés par jour atteinte, ou récompenses en pause).'
}

async function loadOverview() {
  error.value = ''
  try {
    overview.value = await quizDuelService.getOverview()
  } catch (loadError) {
    error.value = duelErrorMessage(loadError, 'Réessayez dans un instant.')
  } finally {
    loading.value = false
  }
}

async function loadDetail() {
  if (!selectedId.value) return
  detailLoading.value = true
  detailError.value = ''
  try {
    detail.value = await quizDuelService.getDuel(selectedId.value)
  } catch (loadError) {
    detail.value = null
    detailError.value = duelErrorMessage(loadError, 'Ce duel n’a pas pu être chargé.')
  } finally {
    detailLoading.value = false
  }
}

async function focusTitle() {
  await nextTick()
  detailTitle.value?.focus?.()
}

function openDuel(id) {
  router.push({ query: { ...route.query, duel: id } })
}

async function openList(options = {}) {
  playing.value = false
  const query = { ...route.query }
  delete query.duel
  await router.push({ query })
  if (options?.focusLauncher) {
    await nextTick()
    launcherSection.value?.scrollIntoView?.({ block: 'start' })
    launcherSection.value?.querySelector('h2')?.focus?.()
  }
}

async function startPlay() {
  if (!detail.value) return
  playing.value = true
}

function closePlay() {
  playing.value = false
  loadDetail()
}

async function onPlayFinished(summary) {
  playing.value = false
  await loadDetail()
  if (detail.value?.state === 'done' && detail.value.outcome?.my_xp > 0) {
    toast.add({ severity: 'success', summary: 'Duel terminé', detail: `+${detail.value.outcome.my_xp} XP pour vous et votre maison`, life: 5000 })
  } else if (summary?.state === 'waiting') {
    toast.add({ severity: 'info', summary: 'Réponses enregistrées', detail: 'Vous serez prévenu·e quand votre adversaire aura joué.', life: 5000 })
  }
  loadOverview()
  focusTitle()
}

async function decline() {
  if (!detail.value) return
  declining.value = true
  try {
    await quizDuelService.respond(detail.value.id, false)
    toast.add({ severity: 'info', summary: 'Duel refusé', detail: 'Votre adversaire en sera informé.', life: 4000 })
    await Promise.all([loadDetail(), loadOverview()])
  } catch (respondError) {
    toast.add({ severity: 'error', summary: 'Duel', detail: duelErrorMessage(respondError), life: 6000 })
  } finally {
    declining.value = false
  }
}

function pickOpponent(player) {
  opponent.value = player
  launchError.value = ''
  launchErrorCode.value = null
}

function clearOpponent() {
  opponent.value = null
  searchTerm.value = ''
  searchResults.value = []
}

function useAllThemes() {
  theme.value = ''
  launchError.value = ''
  launchErrorCode.value = null
}

async function createDuel() {
  if (creating.value) return
  creating.value = true
  launchError.value = ''
  launchErrorCode.value = null
  try {
    const created = await quizDuelService.createDuel({
      opponentId: mode.value === 'direct' ? opponent.value?.user_id : null,
      theme: theme.value || null,
    })
    toast.add({
      severity: 'success',
      summary: 'Duel lancé',
      detail: `Contre ${created?.opponent?.name || 'votre adversaire'} : à vous de jouer en premier si vous voulez !`,
      life: 5000,
    })
    clearOpponent()
    await loadOverview()
    if (created?.id) openDuel(created.id)
  } catch (createError) {
    launchErrorCode.value = duelErrorCode(createError)
    launchError.value = duelErrorMessage(createError, 'Le duel n’a pas pu être lancé.')
  } finally {
    creating.value = false
  }
}

function goBack() {
  if (selectedId.value) {
    openList()
    return
  }
  router.push(gamificationFeatures.gamesHub ? '/game' : '/quiz')
}

watch(searchTerm, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchError.value = ''
  const term = String(value || '').trim()
  if (term.length < 2) {
    searchResults.value = []
    searching.value = false
    return
  }
  searching.value = true
  searchTimer = setTimeout(async () => {
    const seq = ++searchSeq
    try {
      const results = await quizDuelService.searchOpponents(term)
      if (seq === searchSeq) searchResults.value = results
    } catch (searchFailure) {
      if (seq === searchSeq) {
        searchResults.value = []
        searchError.value = duelErrorMessage(searchFailure, 'La recherche n’a pas abouti.')
      }
    } finally {
      if (seq === searchSeq) searching.value = false
    }
  }, 300)
})

watch(theme, () => {
  launchError.value = ''
  launchErrorCode.value = null
})

watch(selectedId, (id, previous) => {
  playing.value = false
  if (id) {
    detail.value = null
    loadDetail().then(focusTitle)
  } else if (previous) {
    detail.value = null
    loadOverview()
  }
})

onMounted(async () => {
  clock = setInterval(() => { now.value = Date.now() }, 30000)
  await loadOverview()
  if (selectedId.value && !error.value) {
    await loadDetail()
  }
})

onBeforeUnmount(() => {
  if (clock) clearInterval(clock)
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<style scoped>
.duel-page .quiz-subtitle {
  font-size: 1.1rem;
  font-weight: 700;
}

.duel-page .quiz-gap {
  margin-top: 1rem;
}

.duel-eyebrow {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.duel-title {
  margin-top: 0.35rem !important;
  font-size: clamp(1.25rem, 3vw, 1.6rem);
  line-height: 1.3;
}

.duel-title:focus {
  outline: none;
}

.duel-player {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.9rem;
  margin-top: 0.6rem !important;
}

.duel-rules {
  margin: 1rem 0 0;
  padding-left: 1.2rem;
  line-height: 1.6;
}

.duel-note {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-top: 1rem !important;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  background: var(--surface-section);
  line-height: 1.5;
}

.duel-note i {
  margin-top: 0.2rem;
  color: var(--primary-text-color, var(--primary-color));
}

.duel-score {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin: 1.25rem 0 0;
}

.duel-score div {
  min-width: 0;
  padding: 0.9rem 1rem;
  border: 2px solid transparent;
  border-radius: 12px;
  background: var(--surface-section);
}

.duel-score div.is-winner {
  border-color: var(--primary-color);
}

.duel-score dt {
  overflow: hidden;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.duel-score dd {
  margin: 0.2rem 0 0;
  font-size: 1.6rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.duel-score .duel-score__time {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.duel-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
  margin: 1rem 0 0;
}

.duel-stats div {
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  background: var(--surface-section);
}

.duel-stats dt {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  font-weight: 600;
}

.duel-stats dd {
  margin: 0.15rem 0 0;
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.duel-stats__sub {
  margin-left: 0.35rem;
  color: var(--text-color-secondary);
  font-size: 0.78rem;
  font-weight: 500;
}

.duel-stats__note {
  margin-top: 0.75rem !important;
  font-size: 0.9rem;
}

.duel-mode {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.duel-mode__btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 56px;
  padding: 0.7rem 0.9rem;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  background: var(--surface-section);
  color: var(--text-color);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.duel-mode__btn[aria-pressed='true'] {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, var(--surface-section));
}

.duel-mode__btn i {
  color: var(--primary-text-color, var(--primary-color));
  font-size: 1.15rem;
}

.duel-mode__btn span {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.duel-mode__btn small {
  color: var(--text-color-secondary);
}

.duel-select {
  width: 100%;
  min-height: 44px;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background: var(--surface-section);
  color: var(--text-color);
  font: inherit;
}

.duel-search-status {
  min-height: 1.2em;
  font-size: 0.85rem;
}

.duel-results,
.duel-list,
.duel-correction,
.duel-correction__options {
  margin: 0;
  padding: 0;
  list-style: none;
}

.duel-results {
  display: grid;
  gap: 0.4rem;
}

.duel-results__btn,
.duel-row {
  display: flex;
  width: 100%;
  min-height: 52px;
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  background: var(--surface-section);
  color: var(--text-color);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.duel-results__btn {
  flex-direction: column;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.55rem 0.85rem;
}

.duel-results__btn small {
  color: var(--text-color-secondary);
}

.duel-results__btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.duel-picked {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.8rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--primary-color);
  border-radius: 12px;
}

.duel-warning {
  display: grid;
  gap: 0.6rem;
  justify-items: start;
  padding: 0.8rem 1rem;
  border-left: 4px solid var(--yellow-400, #facc15);
  border-radius: 12px;
  background: var(--surface-section);
}

.duel-warning i {
  margin-right: 0.35rem;
  color: var(--yellow-400, #facc15);
}

.duel-count {
  display: inline-grid;
  min-width: 1.6rem;
  height: 1.6rem;
  margin-left: 0.35rem;
  padding: 0 0.45rem;
  place-items: center;
  border-radius: 999px;
  background: var(--surface-section);
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.duel-list {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.9rem;
}

.duel-row {
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
}

.duel-row__main {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.duel-row__main small {
  overflow-wrap: anywhere;
}

.duel-row__side {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.5rem;
}

.duel-badge {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--surface-ground);
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.duel-badge.is-win,
.duel-badge.is-todo {
  background: var(--primary-color);
  color: var(--primary-color-text, #071426);
}

.duel-badge.is-loss {
  background: color-mix(in srgb, var(--red-400, #f87171) 25%, var(--surface-ground));
}

.duel-xp {
  color: var(--primary-text-color, var(--primary-color));
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

@media (hover: hover) {
  .duel-row:hover,
  .duel-results__btn:not(:disabled):hover,
  .duel-mode__btn:hover {
    border-color: var(--primary-color);
  }
}

.duel-correction {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.duel-correction__item {
  padding: 1rem;
  border-radius: 12px;
  background: var(--surface-section);
}

.duel-correction__item h3 {
  display: flex;
  gap: 0.6rem;
  margin: 0 0 0.75rem;
  font-size: 1rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.duel-correction__num {
  display: inline-grid;
  flex: 0 0 auto;
  width: 1.6rem;
  height: 1.6rem;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-ground);
  font-size: 0.85rem;
}

.duel-correction__options {
  display: grid;
  gap: 0.4rem;
}

.duel-correction__options li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--surface-border);
  border-radius: 10px;
}

.duel-correction__options li.is-correct {
  border-color: var(--green-400, #4ade80);
  background: color-mix(in srgb, var(--green-400, #4ade80) 12%, transparent);
}

.duel-correction__options li.is-correct > i {
  color: var(--green-400, #4ade80);
}

.duel-correction__label {
  overflow-wrap: anywhere;
}

.duel-correction__who {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.3rem;
}

.duel-chip {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--primary-color);
  color: var(--primary-color-text, #071426);
  font-size: 0.75rem;
  font-weight: 700;
}

.duel-chip--other {
  background: var(--surface-ground);
  color: var(--text-color);
}

.duel-correction__verdicts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1rem;
  margin-top: 0.7rem !important;
  font-size: 0.88rem;
  font-weight: 600;
}

.duel-correction__verdicts .is-ok::before {
  content: '✓ ';
  color: var(--green-500, #22c55e);
}

.duel-correction__verdicts .is-ko::before {
  content: '✗ ';
  color: var(--red-500, #ef4444);
}

.duel-correction__explanation {
  margin-top: 0.7rem !important;
  color: var(--text-color-secondary);
  line-height: 1.55;
}

.duel-help summary {
  min-height: 44px;
  display: flex;
  align-items: center;
  font-weight: 700;
  cursor: pointer;
}

.duel-help ul {
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .duel-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .duel-mode {
    grid-template-columns: 1fr;
  }
}
</style>
