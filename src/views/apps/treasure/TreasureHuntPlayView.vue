<template>
  <Navbar />
  <main class="th-page" data-page-scroll>
    <div class="th-shell">
      <GamificationPageHeader
        :title="hunt?.title || 'Chasse au trésor'"
        :description="hunt?.description || 'Suivez les indices et scannez les QR codes cachés sur le campus.'"
        eyebrow="Chasse au trésor"
        icon="pi pi-map"
        @back="router.push(TREASURE_HUNT_PATH)"
      />

      <section v-if="loading" class="th-panel th-state" aria-busy="true" role="status">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement de la chasse</h2><p class="th-muted">Un instant…</p></div>
      </section>

      <section v-else-if="error" class="th-panel th-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>La chasse n’a pas pu être chargée</h2>
          <p class="th-muted">Vérifiez votre connexion puis réessayez.</p>
          <div class="th-actions th-gap"><Button label="Réessayer" icon="pi pi-refresh" @click="load" /></div>
        </div>
      </section>

      <section v-else-if="!hunt" class="th-panel th-state" role="alert">
        <i class="pi pi-eye-slash" aria-hidden="true"></i>
        <div>
          <h2>Chasse introuvable</h2>
          <p class="th-muted">Elle n’existe plus ou ne concerne pas votre classe.</p>
          <div class="th-actions th-gap"><Button label="Toutes les chasses" icon="pi pi-arrow-left" @click="router.push(TREASURE_HUNT_PATH)" /></div>
        </div>
      </section>

      <div v-else class="play-layout">
        <div class="th-stack">
          <!-- Progression -->
          <section class="th-panel" aria-labelledby="hunt-progress-title">
            <div class="play-status">
              <h2 id="hunt-progress-title" class="th-panel__title">Ma progression</h2>
              <Tag :value="huntStateLabel(hunt.state)" :severity="huntStateSeverity(hunt.state)" />
            </div>
            <div class="th-progress">
              <span class="th-progress__label">
                <span>{{ progressLabel(foundCount, steps.length) }}</span>
                <span>{{ earnedXp }} XP</span>
              </span>
              <span
                class="th-progress__track"
                role="progressbar"
                :aria-valuenow="foundCount"
                aria-valuemin="0"
                :aria-valuemax="steps.length"
                :aria-label="progressLabel(foundCount, steps.length)"
              >
                <span class="th-progress__fill" :style="{ width: `${progressPercent(foundCount, steps.length)}%` }"></span>
              </span>
            </div>
            <p v-if="completedAt" class="play-complete">
              <i class="pi pi-trophy" aria-hidden="true"></i>
              Chasse terminée le {{ formatHuntDate(completedAt) }}. Bravo !
            </p>
            <p v-else class="th-muted play-note">
              {{ statusNote }}
            </p>
            <p class="th-meta play-meta">
              <span><i class="pi pi-calendar" aria-hidden="true"></i>{{ formatHuntPeriod(hunt.starts_at, hunt.ends_at) }}</span>
              <span v-if="hunt.ordered"><i class="pi pi-sort-numeric-up" aria-hidden="true"></i>Ordre imposé</span>
            </p>
          </section>

          <!-- Scanner -->
          <section v-if="hunt.state === 'open' || (hunt.state === 'draft' && canManage)" class="th-panel" aria-labelledby="hunt-scan-title">
            <h2 id="hunt-scan-title" class="th-panel__title">Scanner une étape</h2>

            <div v-if="checking" class="scan-result" role="status" aria-busy="true">
              <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
              <div><h3>Validation en cours…</h3></div>
            </div>

            <div
              v-else-if="outcome"
              ref="resultElement"
              class="scan-result"
              :class="`scan-result--${outcome.severity}`"
              :role="outcome.success ? 'status' : 'alert'"
              tabindex="-1"
            >
              <i :class="outcome.icon" aria-hidden="true"></i>
              <div>
                <h3>{{ outcome.title }}</h3>
                <p>{{ outcome.detail }}</p>
                <div class="th-actions th-gap-sm">
                  <Button label="Scanner un autre code" icon="pi pi-qrcode" outlined @click="restart" />
                </div>
              </div>
            </div>

            <template v-else>
              <QrCodeScanner v-if="cameraOpen" @decoded="onDecoded" />
              <div v-else class="scan-start">
                <Button label="Scanner un QR code" icon="pi pi-camera" class="th-primary th-touch" @click="cameraOpen = true" />
              </div>
              <p v-if="scanHint" class="scan-hint" role="alert">{{ scanHint }}</p>

              <form class="code-form" novalidate @submit.prevent="submitManualCode">
                <label for="hunt-short-code">Pas d’appareil photo ? Saisissez le code de 6 caractères imprimé sous le QR code.</label>
                <div class="code-form__row">
                  <InputText
                    id="hunt-short-code"
                    v-model="manualCode"
                    class="code-form__input"
                    maxlength="8"
                    autocomplete="off"
                    autocapitalize="characters"
                    autocorrect="off"
                    spellcheck="false"
                    placeholder="Ex. ABC234"
                    :invalid="Boolean(manualError)"
                    aria-describedby="hunt-short-code-error"
                  />
                  <Button type="submit" label="Valider" icon="pi pi-check" outlined />
                </div>
                <small id="hunt-short-code-error" class="th-error" role="alert">{{ manualError }}</small>
              </form>
            </template>
          </section>

          <!-- Étapes et indices -->
          <section class="th-panel" aria-labelledby="hunt-steps-title">
            <h2 id="hunt-steps-title" class="th-panel__title">Étapes et indices</h2>
            <p v-if="!steps.length" class="th-muted">Aucune étape pour l’instant.</p>
            <ol v-else class="step-list">
              <li
                v-for="step in steps"
                :key="step.position"
                class="step"
                :class="{ 'step--found': step.found, 'step--locked': step.locked }"
              >
                <span class="step__badge" aria-hidden="true">
                  <i v-if="step.found" class="pi pi-check"></i>
                  <i v-else-if="step.locked" class="pi pi-lock"></i>
                  <template v-else>{{ step.position }}</template>
                </span>
                <span class="step__copy">
                  <strong>
                    Étape {{ step.position }}<template v-if="step.found && step.name"> · {{ step.name }}</template>
                    <span class="m-sr-only">{{ step.found ? ' (trouvée)' : step.locked ? ' (verrouillée)' : ' (à trouver)' }}</span>
                  </strong>
                  <span v-if="step.hint" class="step__hint"><i class="pi pi-lightbulb" aria-hidden="true"></i>{{ step.hint }}</span>
                  <span v-else class="step__hint th-muted">Indice révélé après l’étape précédente.</span>
                </span>
                <span class="step__xp">{{ step.found ? `+${step.xp_awarded || 0}` : step.xp_reward }} XP</span>
              </li>
            </ol>
            <p class="th-muted step-bonus">
              <i class="pi pi-gift" aria-hidden="true"></i>
              Bonus de {{ hunt.completion_bonus }} XP quand toutes les étapes sont trouvées.
            </p>
          </section>
        </div>

        <!-- Classement -->
        <section class="th-panel ranking" aria-labelledby="hunt-ranking-title">
          <h2 id="hunt-ranking-title" class="th-panel__title">Classement de la chasse</h2>
          <div class="ranking-tabs" role="tablist" aria-label="Type de classement">
            <button
              v-for="tab in rankingTabs"
              :id="`ranking-tab-${tab.key}`"
              :key="tab.key"
              type="button"
              role="tab"
              class="ranking-tab"
              :aria-selected="rankingView === tab.key"
              :aria-controls="`ranking-panel-${tab.key}`"
              @click="rankingView = tab.key"
            >{{ tab.label }}</button>
          </div>

          <div v-show="rankingView === 'houses'" id="ranking-panel-houses" role="tabpanel" aria-labelledby="ranking-tab-houses">
            <ol class="house-list">
              <li v-for="(house, index) in houses" :key="house.name">
                <span class="house-list__line">
                  <span>{{ index + 1 }}. {{ house.name }}</span>
                  <span>{{ house.points }} XP · {{ house.players }} joueur{{ house.players > 1 ? 's' : '' }}</span>
                </span>
                <span class="house-list__track" aria-hidden="true">
                  <span :style="{ width: `${housePercent(house.points)}%`, background: house.color || 'var(--th-accent)' }"></span>
                </span>
              </li>
            </ol>
          </div>

          <div v-show="rankingView === 'players'" id="ranking-panel-players" role="tabpanel" aria-labelledby="ranking-tab-players">
            <p v-if="!players.length" class="th-muted">Personne n’a encore trouvé d’étape. À vous de jouer !</p>
            <ol v-else class="player-list">
              <li v-for="player in players" :key="`${player.rank}-${player.name}`" :class="{ 'is-me': player.is_me }">
                <span class="player-list__rank">{{ player.rank }}</span>
                <span class="player-list__name">
                  <span class="player-list__dot" :style="{ background: player.house_color || 'var(--surface-border)' }" aria-hidden="true"></span>
                  {{ player.name }}<template v-if="player.is_me"> (vous)</template>
                  <i v-if="player.completed" class="pi pi-trophy" aria-label="Chasse terminée"></i>
                </span>
                <span class="player-list__score">{{ player.found }}/{{ steps.length }} · {{ player.points }} XP</span>
              </li>
            </ol>
            <p v-if="ranking.me && !players.some((p) => p.is_me)" class="th-muted ranking-me">
              Votre place : {{ ranking.me.rank }}<sup>e</sup> sur {{ ranking.player_count }} ({{ ranking.me.points }} XP).
            </p>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import QrCodeScanner from '@/components/scan/QrCodeScanner.vue'
import {
  describeScanResult,
  extractScanCode,
  isValidShortCode,
  redeemScanCode,
} from '@/service/eventCheckinService'
import {
  TREASURE_HUNT_PATH,
  formatHuntDate,
  formatHuntPeriod,
  getTreasureHunt,
  huntStateLabel,
  huntStateSeverity,
  progressLabel,
  progressPercent,
} from '@/service/treasureHuntService'
import './treasure-shared.css'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()

const loading = ref(true)
const error = ref(false)
const data = ref(null)

const cameraOpen = ref(false)
const checking = ref(false)
const outcome = ref(null)
const scanHint = ref('')
const manualCode = ref('')
const manualError = ref('')
const resultElement = ref(null)
const rankingView = ref('houses')
const rankingTabs = [
  { key: 'houses', label: 'Maisons' },
  { key: 'players', label: 'Joueurs' },
]

const hunt = computed(() => data.value?.hunt || null)
const steps = computed(() => data.value?.steps || [])
const canManage = computed(() => Boolean(data.value?.can_manage))
const completedAt = computed(() => data.value?.completed_at || null)
const ranking = computed(() => data.value?.ranking || { players: [], houses: [] })
const players = computed(() => ranking.value.players || [])
const houses = computed(() => ranking.value.houses || [])
const foundCount = computed(() => steps.value.filter((step) => step.found).length)
const earnedXp = computed(() => ranking.value.me?.points ?? steps.value.reduce((sum, step) => sum + (Number(step.xp_awarded) || 0), 0))
const statusNote = computed(() => {
  switch (hunt.value?.state) {
    case 'upcoming': return `La chasse commence le ${formatHuntDate(hunt.value.starts_at)}.`
    case 'ended': return 'Cette chasse est terminée : les QR codes ne rapportent plus de points.'
    case 'draft': return 'Brouillon : visible seulement par les organisateurs. Vos scans de test ne rapportent pas de points.'
    default: return 'Lisez les indices, trouvez les QR codes sur le campus et scannez-les.'
  }
})
const housePercent = (points) => {
  const top = Math.max(...houses.value.map((house) => Number(house.points) || 0), 0)
  return top > 0 ? Math.max(3, Math.round(((Number(points) || 0) / top) * 100)) : 0
}

async function load({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  error.value = false
  try {
    const result = await getTreasureHunt(props.id)
    data.value = result?.found ? result : null
  } catch (cause) {
    console.error('Chargement de la chasse impossible:', cause)
    if (!quiet) error.value = true
  } finally {
    loading.value = false
  }
}

async function validate(rawCode) {
  if (checking.value) return
  checking.value = true
  scanHint.value = ''
  cameraOpen.value = false
  const result = await redeemScanCode(rawCode)
  outcome.value = describeScanResult(result)
  checking.value = false
  if (result.status === 'ok') load({ quiet: true })
  await nextTick()
  resultElement.value?.focus()
}

function onDecoded(text) {
  if (!extractScanCode(text)) {
    scanHint.value = 'Ce QR code n’est pas un code de la plateforme.'
    return
  }
  validate(text)
}

function submitManualCode() {
  if (!isValidShortCode(manualCode.value)) {
    manualError.value = 'Le code comporte 6 lettres ou chiffres, par exemple ABC234.'
    return
  }
  manualError.value = ''
  const code = manualCode.value
  manualCode.value = ''
  validate(code)
}

function restart() {
  outcome.value = null
  scanHint.value = ''
  cameraOpen.value = true
}

watch(() => props.id, () => {
  outcome.value = null
  load()
})
onMounted(load)
</script>

<style scoped>
.th-gap { margin-top: 1rem; }
.th-gap-sm { margin-top: .8rem; }
.play-layout { display: grid; gap: 1rem; align-items: start; }
.play-status { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.play-status .th-panel__title { margin-bottom: .9rem; }
.play-note, .play-complete { margin-top: .85rem !important; }
.play-complete { display: flex; align-items: center; gap: .5rem; font-weight: 600; }
.play-complete i { color: var(--th-accent); font-size: 1.2rem; }
.play-meta { margin-top: .75rem; }

.scan-start { display: grid; justify-items: center; padding: .25rem 0; }
.scan-hint { margin-top: .75rem !important; text-align: center; }
.scan-result { display: flex; align-items: flex-start; gap: .9rem; padding: 1rem; border: 1px solid var(--surface-border); border-left-width: 4px; border-radius: 12px; background: var(--surface-section); }
.scan-result h3 { margin: 0 0 .3rem; font-size: 1.1rem; }
.scan-result p { line-height: 1.5; }
.scan-result > i { margin-top: .15rem; font-size: 1.6rem; }
.scan-result--success { border-left-color: var(--green-400, #4ade80); }
.scan-result--success > i { color: var(--green-400, #4ade80); }
.scan-result--info { border-left-color: var(--blue-300, #93c5fd); }
.scan-result--info > i { color: var(--blue-300, #93c5fd); }
.scan-result--warn { border-left-color: var(--yellow-400, #facc15); }
.scan-result--warn > i { color: var(--yellow-400, #facc15); }
.scan-result--error { border-left-color: var(--red-300, #fca5a5); }
.scan-result--error > i { color: var(--red-300, #fca5a5); }

.code-form { display: grid; gap: .5rem; margin-top: 1.1rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
.code-form label { color: var(--text-color-secondary); line-height: 1.45; }
.code-form__row { display: flex; flex-wrap: wrap; gap: .5rem; }
.code-form__row .p-button { min-height: 44px; }
.code-form__input { flex: 1 1 10rem; min-height: 44px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.15rem; letter-spacing: .18em; text-transform: uppercase; }
.code-form .th-error { min-height: 1.3em; }

.step-list { display: grid; gap: .6rem; margin: 0; padding: 0; list-style: none; }
.step { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr) auto; align-items: center; gap: .8rem; padding: .75rem .85rem; border: 1px solid var(--surface-border); border-radius: 12px; background: var(--surface-section); }
.step__badge { display: grid; width: 2.6rem; height: 2.6rem; place-items: center; border: 2px solid var(--th-accent); border-radius: 50%; font-weight: 700; }
.step--found .step__badge { border-color: var(--green-400, #4ade80); background: var(--green-400, #4ade80); color: #052e16; }
.step--locked { opacity: .7; }
.step--locked .step__badge { border-color: var(--surface-border); }
.step__copy { display: grid; gap: .25rem; min-width: 0; }
.step__copy strong { overflow-wrap: anywhere; }
.step__hint { display: flex; gap: .45rem; line-height: 1.45; overflow-wrap: anywhere; }
.step__hint i { margin-top: .2rem; color: var(--th-accent); }
.step__xp { font-weight: 700; white-space: nowrap; }
.step-bonus { display: flex; align-items: center; gap: .45rem; margin-top: .9rem !important; }
.step-bonus i { color: var(--th-accent); }

.ranking-tabs { display: inline-flex; gap: .25rem; margin-bottom: 1rem; padding: .25rem; border-radius: 999px; background: var(--surface-ground, #132b47); }
.ranking-tab { min-height: 40px; padding: .4rem 1rem; border: 0; border-radius: 999px; color: var(--text-color); background: transparent; font: inherit; font-weight: 600; cursor: pointer; }
.ranking-tab[aria-selected='true'] { color: #071426; background: var(--th-accent); }
.house-list, .player-list { display: grid; gap: .7rem; margin: 0; padding: 0; list-style: none; }
.house-list li { display: grid; gap: .35rem; }
.house-list__line { display: flex; justify-content: space-between; gap: 1rem; font-weight: 600; }
.house-list__line span:last-child { color: var(--text-color-secondary); font-weight: 500; text-align: right; }
.house-list__track { height: .55rem; overflow: hidden; border-radius: 999px; background: var(--surface-ground, #132b47); }
.house-list__track span { display: block; height: 100%; border-radius: inherit; }
.player-list li { display: grid; grid-template-columns: 2rem minmax(0, 1fr) auto; align-items: center; gap: .6rem; padding: .5rem .6rem; border-radius: 10px; }
.player-list li.is-me { background: color-mix(in srgb, var(--th-accent) 18%, transparent); }
.player-list__rank { font-weight: 700; text-align: center; }
.player-list__name { display: flex; align-items: center; gap: .45rem; min-width: 0; overflow-wrap: anywhere; }
.player-list__name .pi-trophy { color: var(--th-accent); }
.player-list__dot { flex: none; width: .7rem; height: .7rem; border-radius: 50%; }
.player-list__score { color: var(--text-color-secondary); font-size: .92rem; white-space: nowrap; }
.ranking-me { margin-top: .8rem !important; }
.m-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (min-width: 960px) {
  .play-layout { grid-template-columns: minmax(0, 1fr) 340px; }
  .ranking { position: sticky; top: 1rem; }
}
</style>
