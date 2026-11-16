<template>
  <section class="quiz-panel duel-play" aria-labelledby="duel-question-title">
    <div v-if="loading && !question" class="quiz-state" aria-live="polite" aria-busy="true">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <p>Préparation de la question…</p>
    </div>

    <div v-else-if="fatalError" class="quiz-state" role="alert">
      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <div>
        <h2>Impossible de continuer</h2>
        <p class="quiz-muted">{{ fatalError }}</p>
        <div class="quiz-actions quiz-gap">
          <Button label="Réessayer" icon="pi pi-refresh" @click="loadNext" />
          <Button label="Retour au duel" icon="pi pi-arrow-left" outlined @click="emit('close')" />
        </div>
      </div>
    </div>

    <template v-else-if="question">
      <div class="duel-play__top">
        <p class="duel-play__count">Question {{ question.position }} sur {{ question.total }}</p>
        <p
          class="duel-play__timer"
          :class="{ 'is-urgent': secondsLeft <= 5 }"
          role="timer"
          :aria-label="`${secondsLeft} secondes restantes`"
        >
          <i class="pi pi-clock" aria-hidden="true"></i>{{ secondsLeft }} s
        </p>
      </div>
      <div class="duel-play__bar" aria-hidden="true">
        <span :style="{ transform: `scaleX(${timeRatio})` }"></span>
      </div>
      <p class="quiz-sr-only" aria-live="assertive">{{ timerAnnouncement }}</p>

      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt="Illustration de la question"
        class="duel-play__image"
      />

      <fieldset class="duel-options" :disabled="locked">
        <legend id="duel-question-title" ref="questionTitle" tabindex="-1">
          {{ question.question.prompt }}
          <span class="duel-kind">
            {{ question.question.kind === 'multiple' ? 'Plusieurs réponses possibles' : 'Une seule réponse' }}
          </span>
        </legend>
        <label
          v-for="option in question.question.options"
          :key="option.id"
          class="duel-option"
          :class="{ 'is-selected': selectedIds.includes(option.id) }"
        >
          <input
            v-if="question.question.kind === 'multiple'"
            v-model="selection"
            type="checkbox"
            :value="option.id"
          />
          <input
            v-else
            v-model="singleSelection"
            type="radio"
            name="duel-option"
            :value="option.id"
          />
          <span>{{ option.label }}</span>
        </label>
      </fieldset>

      <p v-if="timedOut" class="duel-play__timeout" role="status">
        <i class="pi pi-hourglass" aria-hidden="true"></i>
        Temps écoulé : cette question compte comme fausse. Question suivante…
      </p>
      <p v-if="actionError" class="duel-error" role="alert">{{ actionError }}</p>

      <div class="quiz-actions quiz-gap">
        <Button
          :label="question.position < question.total ? 'Valider et continuer' : 'Valider et terminer'"
          icon="pi pi-check"
          :disabled="selectedIds.length === 0 || locked"
          :loading="submitting"
          @click="submit"
        />
      </div>
      <p class="quiz-muted duel-play__hint">
        La correction s’affichera quand les deux joueurs auront terminé. Le chronomètre continue
        même si vous quittez la page.
      </p>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import { quizDuelService, duelErrorMessage, duelErrorCode, DUEL_TIME_LIMIT_MS } from '@/service/quizDuelService'

const props = defineProps({ duelId: { type: String, required: true } })
const emit = defineEmits(['finished', 'close'])

// Marge laissée au serveur avant de compter une question sans réponse (3 s côté serveur).
const SERVER_GRACE_MS = 3500

const loading = ref(false)
const submitting = ref(false)
const fatalError = ref('')
const actionError = ref('')
const question = ref(null)
const selection = ref([])
const singleSelection = ref(null)
const imageUrl = ref(null)
const timedOut = ref(false)
const msLeft = ref(DUEL_TIME_LIMIT_MS)
const questionTitle = ref(null)

let deadline = 0
let ticker = null
let timeoutRetry = null
let unmounted = false

const timeLimit = computed(() => Number(question.value?.time_limit_ms) || DUEL_TIME_LIMIT_MS)
const secondsLeft = computed(() => Math.max(0, Math.ceil(msLeft.value / 1000)))
const timeRatio = computed(() => Math.max(0, Math.min(1, msLeft.value / timeLimit.value)))
const locked = computed(() => submitting.value || timedOut.value || msLeft.value <= 0)
const selectedIds = computed(() => (
  question.value?.question?.kind === 'multiple'
    ? selection.value
    : (singleSelection.value ? [singleSelection.value] : [])
))
const timerAnnouncement = computed(() => {
  if (timedOut.value) return 'Temps écoulé.'
  if (secondsLeft.value === 5) return 'Plus que 5 secondes.'
  return ''
})

function stopTimers() {
  if (ticker) clearInterval(ticker)
  if (timeoutRetry) clearTimeout(timeoutRetry)
  ticker = null
  timeoutRetry = null
}

function tick() {
  msLeft.value = Math.max(0, deadline - Date.now())
  if (msLeft.value > 0) return
  if (ticker) clearInterval(ticker)
  ticker = null
  // Une réponse cochée part encore (le serveur accepte une petite marge réseau).
  if (selectedIds.value.length > 0 && !submitting.value) {
    submit()
    return
  }
  if (!submitting.value) {
    timedOut.value = true
    timeoutRetry = setTimeout(loadNext, SERVER_GRACE_MS)
  }
}

function startTimer(remainingMs) {
  stopTimers()
  deadline = Date.now() + Math.max(0, Number(remainingMs) || 0)
  msLeft.value = Math.max(0, Number(remainingMs) || 0)
  ticker = setInterval(tick, 200)
  tick()
}

async function loadImage(path) {
  imageUrl.value = null
  if (!path) return
  const url = await quizDuelService.getQuestionImageUrl(path)
  if (!unmounted && question.value?.question?.image_path === path) imageUrl.value = url
}

async function loadNext() {
  if (unmounted) return
  stopTimers()
  loading.value = true
  fatalError.value = ''
  actionError.value = ''
  try {
    const next = await quizDuelService.nextQuestion(props.duelId)
    if (unmounted) return
    if (next?.done) {
      question.value = null
      emit('finished', next.duel)
      return
    }
    const samePosition = question.value?.position === next.position
    // Le serveur n'a pas encore compté la question hors délai : on repose la question dans 1 s.
    if (samePosition && timedOut.value && Number(next.remaining_ms) <= 0) {
      timeoutRetry = setTimeout(loadNext, 1000)
      return
    }
    question.value = next
    timedOut.value = false
    if (!samePosition) {
      selection.value = []
      singleSelection.value = null
    }
    startTimer(next.remaining_ms)
    loadImage(next.question?.image_path)
    await nextTick()
    questionTitle.value?.focus?.()
  } catch (error) {
    fatalError.value = duelErrorMessage(error, 'La question n’a pas pu être chargée.')
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!question.value || selectedIds.value.length === 0 || submitting.value) return
  submitting.value = true
  actionError.value = ''
  stopTimers()
  try {
    await quizDuelService.answer(props.duelId, question.value.position, [...selectedIds.value])
    submitting.value = false
    await loadNext()
  } catch (error) {
    submitting.value = false
    if (['duel_closed', 'duel_expired', 'duel_not_found'].includes(duelErrorCode(error))) {
      fatalError.value = duelErrorMessage(error)
      return
    }
    actionError.value = duelErrorMessage(error, 'Votre réponse n’a pas pu être envoyée. Réessayez.')
    // Le chronomètre du serveur continue : on reprend l'affichage du temps restant.
    if (msLeft.value > 0) startTimer(deadline - Date.now())
  }
}

watch(() => props.duelId, () => {
  question.value = null
  loadNext()
})

onMounted(loadNext)
onBeforeUnmount(() => {
  unmounted = true
  stopTimers()
})
</script>

<style scoped>
.quiz-gap {
  margin-top: 1rem;
}

.duel-play__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.duel-play__count {
  color: var(--text-color-secondary);
  font-weight: 600;
}

.duel-play__timer {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 4.5rem;
  justify-content: flex-end;
  font-size: 1.35rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.duel-play__timer.is-urgent {
  color: var(--red-300, #fca5a5);
}

.duel-play__bar {
  height: 8px;
  margin: 0.75rem 0 1.25rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-section);
}

.duel-play__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary-color);
  transform-origin: left center;
  transition: transform 0.2s linear;
}

.duel-play__image {
  display: block;
  max-width: 100%;
  max-height: 280px;
  margin: 0 auto 1.25rem;
  border-radius: 12px;
  object-fit: contain;
}

.duel-options {
  display: grid;
  gap: 0.6rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.duel-options legend {
  margin-bottom: 0.9rem;
  padding: 0;
  font-size: clamp(1.1rem, 2.6vw, 1.35rem);
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.duel-options legend:focus {
  outline: none;
}

.duel-kind {
  display: block;
  margin-top: 0.35rem;
  color: var(--text-color-secondary);
  font-size: 0.88rem;
  font-weight: 500;
}

.duel-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  min-height: 52px;
  padding: 0.75rem 0.9rem;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  background: var(--surface-section);
  cursor: pointer;
  overflow-wrap: anywhere;
  line-height: 1.4;
  transition: border-color 0.15s ease-out;
}

.duel-option input {
  width: 1.2rem;
  height: 1.2rem;
  margin: 0;
  accent-color: var(--primary-color);
}

.duel-option.is-selected {
  border-color: var(--primary-color);
}

.duel-options:disabled .duel-option {
  cursor: default;
  opacity: 0.75;
}

@media (hover: hover) {
  .duel-options:not(:disabled) .duel-option:hover {
    border-color: var(--primary-color);
  }
}

.duel-play__timeout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-weight: 600;
}

.duel-error {
  margin-top: 1rem;
  color: var(--red-300, #fca5a5);
}

.duel-play__hint {
  margin-top: 0.9rem;
  font-size: 0.88rem;
}

@media (prefers-reduced-motion: reduce) {
  .duel-play__bar span,
  .duel-option {
    transition: none;
  }
}
</style>
