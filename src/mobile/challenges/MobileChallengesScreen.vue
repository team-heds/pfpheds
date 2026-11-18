<template>
  <div class="m-defis" :aria-busy="loading ? 'true' : 'false'">
    <h1 class="m-sr-only">Défis du moment</h1>

    <div v-if="status === 'offline'" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Pas de connexion</p>
      <p class="m-state__text">Tes défis s’afficheront dès que le téléphone sera de nouveau en ligne.</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>

    <div v-else-if="status === 'error'" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Les défis ne se chargent pas</p>
      <p class="m-state__text">{{ errorText }}</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>

    <template v-else>
      <section class="m-defis__summary" aria-label="Résumé de la période">
        <template v-if="loading">
          <span class="m-skeleton m-defis__sk-line m-defis__sk-line--short" aria-hidden="true"></span>
          <span class="m-skeleton m-defis__sk-line" aria-hidden="true"></span>
          <span class="m-skeleton m-defis__sk-bar" aria-hidden="true"></span>
        </template>
        <template v-else>
          <p class="m-defis__period">{{ periodLabel }}</p>
          <p class="m-defis__count">
            <strong>{{ summary.done }}</strong> sur {{ summary.total }} {{ summary.total > 1 ? 'défis réussis' : 'défi réussi' }}
          </p>
          <div
            class="m-defis__bar"
            role="progressbar"
            :aria-valuenow="summary.percent"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${summary.percent} % des défis réussis`"
          >
            <span :style="{ width: `${summary.percent}%` }"></span>
          </div>
          <dl class="m-defis__facts">
            <div>
              <dt>Temps restant</dt>
              <dd>{{ timeLeft }}</dd>
            </div>
            <div>
              <dt>XP des défis</dt>
              <dd>{{ formatXp(stats.totalXPFromChallenges) }}</dd>
            </div>
            <div>
              <dt>Au total</dt>
              <dd>{{ stats.totalCompleted }}</dd>
            </div>
          </dl>
        </template>
      </section>

      <section aria-labelledby="m-defis-en-cours">
        <h2 id="m-defis-en-cours" class="m-defis__section">Défis de la période</h2>

        <ul v-if="loading" class="m-defis__list" aria-hidden="true">
          <li v-for="n in 3" :key="n" class="m-defis__row m-defis__row--skeleton">
            <span class="m-skeleton m-defis__icon"></span>
            <span class="m-defis__sk-text">
              <span class="m-skeleton m-defis__sk-line"></span>
              <span class="m-skeleton m-defis__sk-line m-defis__sk-line--short"></span>
            </span>
          </li>
        </ul>

        <div v-else-if="!challenges.length" class="m-state">
          <span class="m-state__icon" aria-hidden="true"><MIcon name="target" /></span>
          <p class="m-state__title">Aucun défi en cours</p>
          <p class="m-state__text">Les prochains défis apparaîtront ici.</p>
          <button type="button" class="m-ghost-button" @click="load">Actualiser</button>
        </div>

        <ul v-else class="m-defis__list">
          <li v-for="challenge in challenges" :key="challenge.id">
            <button
              type="button"
              class="m-defis__row"
              :class="{ 'is-done': challenge.completed }"
              @click="openChallenge(challenge)"
            >
              <span class="m-defis__icon" aria-hidden="true">{{ challenge.icon }}</span>
              <span class="m-defis__main">
                <span class="m-defis__name">{{ challenge.name }}</span>
                <span v-if="challenge.description" class="m-defis__desc">{{ challenge.description }}</span>
                <span class="m-defis__progress">
                  <span class="m-defis__mini-bar" aria-hidden="true">
                    <span :style="{ width: `${progressPercent(challenge)}%` }"></span>
                  </span>
                  <span v-if="challenge.completed" class="m-defis__done"><MIcon name="check" /> Réussi</span>
                  <span v-else class="m-defis__value">{{ progressLabel(challenge) }}</span>
                </span>
              </span>
              <span v-if="challenge.reward?.xp > 0" class="m-defis__xp">+{{ challenge.reward.xp }} XP</span>
              <MIcon class="m-defis__chevron" name="next" />
            </button>
          </li>
        </ul>
      </section>

      <section v-if="!loading && history.length" aria-labelledby="m-defis-reussis">
        <h2 id="m-defis-reussis" class="m-defis__section">Réussis récemment</h2>
        <ul class="m-defis__history">
          <li v-for="item in shownHistory" :key="`${item.challengeId}-${item.completedAt}`">
            <span class="m-defis__history-icon" aria-hidden="true"><MIcon name="check" /></span>
            <span class="m-defis__history-text">
              <span>{{ item.challengeName }}</span>
              <small>{{ shortDate(item.completedAt) }}</small>
            </span>
            <span v-if="item.reward?.xp > 0" class="m-defis__history-xp">+{{ item.reward.xp }} XP</span>
          </li>
        </ul>
        <button
          v-if="history.length > HISTORY_PREVIEW"
          type="button"
          class="m-ghost-button m-defis__more"
          :aria-expanded="showAllHistory ? 'true' : 'false'"
          @click="showAllHistory = !showAllHistory"
        >
          {{ showAllHistory ? 'Afficher moins' : `Tout afficher (${history.length})` }}
        </button>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onActivated, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import challengesService from '@/service/challengesService'
import { challengePeriod, formatChallengePeriod, formatTimeLeft } from '@/utils/challengePeriod'
import MIcon from '@/mobile/ui/MIcon.vue'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import {
  challengeSummary,
  challengeTarget,
  formatXp,
  progressLabel,
  progressPercent,
  shortDate,
  sortChallenges,
} from '@/mobile/challenges/challengeHelpers'

const HISTORY_PREVIEW = 5
const STALE_AFTER = 60_000

const router = useRouter()
const authStore = useAuthStore()
const shell = useMobileShell()

const status = ref('loading')
const errorText = ref('')
const challenges = ref([])
const history = ref([])
const stats = ref({ totalCompleted: 0, totalXPFromChallenges: 0 })
const showAllHistory = ref(false)
let generation = 0
let loadedAt = 0
let disposed = false

const loading = computed(() => status.value === 'loading')
const summary = computed(() => challengeSummary(challenges.value))
const period = computed(() => challengePeriod(challenges.value))
const periodLabel = computed(() => formatChallengePeriod(period.value))
const timeLeft = computed(() => formatTimeLeft(period.value))
const shownHistory = computed(() => (showAllHistory.value ? history.value : history.value.slice(0, HISTORY_PREVIEW)))

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

async function load() {
  if (disposed) return
  const userId = authStore.user?.id && authStore.user.id !== 'guest-user' ? authStore.user.id : null
  const current = ++generation
  if (!userId) {
    status.value = 'error'
    errorText.value = 'Connecte-toi pour retrouver tes défis.'
    return
  }
  if (isOffline()) {
    status.value = 'offline'
    return
  }
  // Un rechargement garde la liste affichée ; seul le premier montre les squelettes.
  if (!loadedAt) status.value = 'loading'
  try {
    const [active, done, totals] = await Promise.all([
      challengesService.getUserActiveChallenges(userId),
      challengesService.getUserChallengeHistory(userId, 20),
      challengesService.getUserChallengeStats(userId),
    ])
    if (disposed || current !== generation) return
    challenges.value = sortChallenges(active)
    history.value = done
    stats.value = totals
    loadedAt = Date.now()
    status.value = 'ready'
  } catch (error) {
    if (disposed || current !== generation) return
    console.error('Défis : chargement impossible', error)
    if (isOffline()) {
      status.value = 'offline'
    } else if (!loadedAt) {
      status.value = 'error'
      errorText.value = 'Vérifie ta connexion, puis réessaie.'
    }
  }
}

function openChallenge(challenge) {
  const target = challengeTarget(challenge)
  if (target) router.push(target)
  else shell.open('defi', { challenge })
}

const onOnline = () => {
  if (status.value === 'offline') load()
}

watch(() => authStore.user?.id, (id, previous) => {
  if (id !== previous) {
    loadedAt = 0
    load()
  }
})

onMounted(() => {
  load()
  window.addEventListener('online', onOnline)
})
// Retour sur l'écran (gardé en mémoire) : les défis avancent pendant qu'on joue ailleurs.
onActivated(() => {
  if (loadedAt && Date.now() - loadedAt > STALE_AFTER) load()
})
onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('online', onOnline)
})

defineExpose({ load })
</script>

<style scoped>
.m-defis {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 16px calc(24px + var(--m-tabbar-space, 0px));
}

.m-defis__summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: var(--m-radius);
  background: var(--m-surface);
}
.m-defis__period {
  margin: 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-defis__count {
  margin: 0;
  font-size: 1rem;
}
.m-defis__count strong {
  font-size: 1.5rem;
  font-weight: 700;
}
.m-defis__bar,
.m-defis__mini-bar {
  overflow: hidden;
  border-radius: 999px;
  background: var(--m-raised);
}
.m-defis__bar {
  height: 8px;
}
.m-defis__bar span,
.m-defis__mini-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--m-accent);
  transition: width 300ms cubic-bezier(0, 0, 0.2, 1);
}
.m-defis__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 0 0;
}
.m-defis__facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
/* Le chiffre au-dessus de son libellé, tous alignés en haut. */
.m-defis__facts dd {
  order: -1;
}
.m-defis__facts dt {
  color: var(--m-muted);
  font-size: 0.8125rem;
  line-height: 1.3;
}
.m-defis__facts dd {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
}

.m-defis__section {
  margin: 0 0 8px;
  font-size: 1.0625rem;
  font-weight: 600;
}

.m-defis__list,
.m-defis__history {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-defis__row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 72px;
  padding: 12px;
  border: 0;
  border-radius: var(--m-radius);
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 120ms ease, background-color 120ms ease;
}
.m-defis__row:active {
  transform: scale(0.98);
  background: var(--m-raised);
}
@media (hover: hover) {
  .m-defis__row:hover {
    background: var(--m-raised);
  }
}
.m-defis__row:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-defis__row--skeleton {
  cursor: default;
}
.m-defis__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--m-raised);
  font-size: 1.375rem;
  line-height: 1;
}
.m-defis__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.m-defis__name {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.m-defis__desc {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: var(--m-muted);
  font-size: 0.8125rem;
  line-height: 1.35;
}
.m-defis__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.m-defis__mini-bar {
  flex: 1;
  height: 6px;
}
.m-defis__value,
.m-defis__done {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: var(--m-muted);
}
.m-defis__done {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--m-ok);
  font-weight: 600;
}
.m-defis__done :deep(.m-icon) {
  width: 14px;
  height: 14px;
}
.m-defis__row.is-done .m-defis__mini-bar span {
  background: var(--m-ok);
}
.m-defis__xp {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(243, 195, 0, 0.14);
  color: var(--m-accent-text);
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}
.m-defis__chevron {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--m-muted);
}

.m-defis__history li {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 12px;
  border-radius: var(--m-radius);
  background: var(--m-surface);
}
.m-defis__history-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--m-ok) 18%, transparent);
  color: var(--m-ok);
}
.m-defis__history-icon :deep(.m-icon) {
  width: 16px;
  height: 16px;
}
.m-defis__history-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 0.9375rem;
  line-height: 1.3;
}
.m-defis__history-text small {
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-defis__history-xp {
  flex-shrink: 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-defis__more {
  width: 100%;
  margin-top: 8px;
}

.m-defis__sk-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.m-defis__sk-line {
  display: block;
  height: 14px;
  border-radius: 7px;
}
.m-defis__sk-line--short {
  width: 45%;
}
.m-defis__sk-bar {
  display: block;
  height: 8px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .m-defis__row,
  .m-defis__bar span,
  .m-defis__mini-bar span {
    transition: none;
  }
}
</style>
