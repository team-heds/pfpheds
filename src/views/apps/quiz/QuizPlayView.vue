<template>
  <Navbar />
  <main class="quiz-page" data-page-scroll>
    <div class="quiz-shell quiz-shell--narrow">
      <GamificationPageHeader
        :title="quizTitle"
        :description="headerDescription"
        icon="pi pi-question-circle"
        @back="router.push('/quiz')"
      />

      <section v-if="loading" class="quiz-panel quiz-state" aria-live="polite" aria-busy="true">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement du quiz</h2><p class="quiz-muted">Un instant…</p></div>
      </section>

      <section v-else-if="error" class="quiz-panel quiz-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>Ce quiz n’est pas disponible</h2>
          <p class="quiz-muted">{{ error }}</p>
          <div class="quiz-actions quiz-gap">
            <Button label="Réessayer" icon="pi pi-refresh" @click="load" />
            <Button label="Retour aux quiz" icon="pi pi-arrow-left" outlined @click="router.push('/quiz')" />
          </div>
        </div>
      </section>

      <template v-else>
        <!-- Avant de commencer -->
        <section v-if="stage === 'intro'" class="quiz-panel" aria-labelledby="quiz-intro-title">
          <h2 id="quiz-intro-title" class="quiz-title">{{ introTitle }}</h2>
          <p v-if="quiz.description" class="quiz-muted quiz-gap">{{ quiz.description }}</p>
          <p class="quiz-meta quiz-gap">
            <span v-if="quiz.theme"><i class="pi pi-tag" aria-hidden="true"></i>{{ quiz.theme }}</span>
            <span><i class="pi pi-list" aria-hidden="true"></i>{{ quiz.question_count }} question{{ quiz.question_count > 1 ? 's' : '' }}</span>
          </p>
          <ul class="quiz-rules quiz-muted">
            <li v-if="state === 'done'">
              Votre première tentative est enregistrée : <strong>{{ quiz.first_score }} / {{ quiz.first_total }}</strong>
              en {{ formatQuizDuration(quiz.first_duration_ms) }}. Les tentatives suivantes servent à s’entraîner
              et ne changent ni le classement ni les points.
            </li>
            <li v-else>Seule cette première tentative compte pour le classement et les points.</li>
            <li>Chaque réponse validée est définitive ; la correction s’affiche tout de suite.</li>
            <li v-if="state !== 'done'">Le temps est mesuré du début à la fin et départage les égalités.</li>
          </ul>
          <p v-if="!quiz.is_open && !quiz.in_progress" class="quiz-gap" role="status">
            Ce quiz est fermé : il n’est plus possible de le passer.
          </p>
          <div class="quiz-actions quiz-gap">
            <Button
              v-if="quiz.is_open || quiz.in_progress"
              :label="startLabel"
              icon="pi pi-play"
              :loading="starting"
              @click="start"
            />
            <Button label="Retour aux quiz" icon="pi pi-arrow-left" outlined @click="router.push('/quiz')" />
          </div>
        </section>

        <!-- Une question à la fois -->
        <section v-else-if="stage === 'playing' && currentQuestion" class="quiz-panel" aria-labelledby="quiz-question-title">
          <p class="quiz-progress-label">
            <span>Question {{ currentIndex + 1 }} sur {{ questions.length }}</span>
            <Tag v-if="!attempt.is_first" value="Entraînement" severity="info" />
          </p>
          <ProgressBar
            :value="Math.round((answeredCount / questions.length) * 100)"
            :show-value="false"
            class="quiz-progress"
            :aria-label="`${answeredCount} questions répondues sur ${questions.length}`"
          />

          <img
            v-if="currentImageUrl"
            :src="currentImageUrl"
            alt="Illustration de la question"
            class="quiz-image"
          />

          <fieldset class="quiz-options" :disabled="Boolean(currentFeedback) || answering">
            <legend id="quiz-question-title" ref="questionTitle" tabindex="-1">
              {{ currentQuestion.prompt }}
              <span class="quiz-kind">
                {{ currentQuestion.kind === 'multiple' ? 'Plusieurs réponses possibles' : 'Une seule réponse' }}
              </span>
            </legend>
            <label
              v-for="option in currentQuestion.options"
              :key="option.id"
              class="quiz-option"
              :class="optionClass(option)"
            >
              <input
                v-if="currentQuestion.kind === 'multiple'"
                v-model="selection"
                type="checkbox"
                :value="option.id"
              />
              <input
                v-else
                v-model="singleSelection"
                type="radio"
                name="quiz-option"
                :value="option.id"
              />
              <span class="quiz-option__label">{{ option.label }}</span>
              <span v-if="currentFeedback && optionStatus(option)" class="quiz-option__status">
                <i :class="optionStatus(option).icon" aria-hidden="true"></i>
                {{ optionStatus(option).text }}
              </span>
            </label>
          </fieldset>

          <div ref="feedbackPanel" tabindex="-1" class="quiz-feedback-anchor" aria-live="polite">
            <div
              v-if="currentFeedback"
              class="quiz-feedback"
              :class="currentFeedback.is_correct ? 'is-correct' : 'is-wrong'"
            >
              <h3>
                <i :class="currentFeedback.is_correct ? 'pi pi-check-circle' : 'pi pi-times-circle'" aria-hidden="true"></i>
                {{ currentFeedback.is_correct ? 'Bonne réponse' : 'Mauvaise réponse' }}
              </h3>
              <p v-if="currentFeedback.explanation">{{ currentFeedback.explanation }}</p>
            </div>
          </div>

          <p v-if="actionError" class="quiz-error" role="alert">{{ actionError }}</p>

          <div class="quiz-actions quiz-gap">
            <Button
              v-if="!currentFeedback"
              label="Valider ma réponse"
              icon="pi pi-check"
              :disabled="selectedIds.length === 0"
              :loading="answering"
              @click="submitAnswer"
            />
            <Button
              v-else-if="hasNextQuestion"
              label="Question suivante"
              icon="pi pi-arrow-right"
              icon-pos="right"
              @click="goToNextQuestion"
            />
            <Button
              v-else
              label="Voir mon résultat"
              icon="pi pi-flag"
              :loading="finishing"
              @click="finish"
            />
          </div>
        </section>

        <!-- Résultat -->
        <section v-else-if="stage === 'result' && result" class="quiz-panel" aria-labelledby="quiz-result-title">
          <h2 id="quiz-result-title" ref="resultTitle" tabindex="-1" class="quiz-title">
            {{ result.perfect ? 'Sans faute !' : 'Quiz terminé' }}
          </h2>
          <dl class="quiz-result">
            <div>
              <dt>Score</dt>
              <dd>{{ result.score }} / {{ result.total }}</dd>
            </div>
            <div>
              <dt>Temps</dt>
              <dd>{{ formatQuizDuration(result.duration_ms) }}</dd>
            </div>
            <div v-if="result.rank">
              <dt>Rang</dt>
              <dd>{{ result.rank }}<span class="quiz-result__sub"> sur {{ result.participants }}</span></dd>
            </div>
            <div v-if="result.xp_awarded > 0">
              <dt>Points gagnés</dt>
              <dd>+{{ result.xp_awarded }} XP</dd>
            </div>
          </dl>
          <p class="quiz-muted quiz-gap">{{ resultMessage }}</p>
          <div class="quiz-actions quiz-gap">
            <Button
              v-if="quiz.is_open"
              label="Refaire pour s’entraîner"
              icon="pi pi-replay"
              outlined
              :loading="starting"
              @click="start"
            />
            <Button label="Retour aux quiz" icon="pi pi-arrow-left" @click="router.push('/quiz')" />
          </div>
        </section>

        <!-- Classement -->
        <section
          v-if="stage !== 'playing'"
          ref="leaderboardSection"
          class="quiz-panel"
          aria-labelledby="quiz-leaderboard-title"
        >
          <h2 id="quiz-leaderboard-title" tabindex="-1" class="quiz-subtitle">Classement</h2>
          <p class="quiz-muted">Meilleur score à la première tentative ; à égalité, le temps le plus court l’emporte.</p>
          <p v-if="leaderboardError" class="quiz-error" role="alert">{{ leaderboardError }}</p>
          <p v-else-if="leaderboard.length === 0" class="quiz-gap">Personne n’a encore terminé ce quiz.</p>
          <div v-else class="quiz-table-wrap quiz-gap">
            <table class="quiz-table">
              <thead>
                <tr>
                  <th scope="col">Rang</th>
                  <th scope="col">Nom</th>
                  <th scope="col">Maison</th>
                  <th scope="col">Score</th>
                  <th scope="col">Temps</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in leaderboard" :key="row.user_id" :class="{ 'is-me': row.is_me }">
                  <td>{{ row.rank }}</td>
                  <td>{{ row.display_name }}<span v-if="row.is_me"> (vous)</span></td>
                  <td>
                    <span v-if="row.house_name" class="quiz-house" :style="{ '--house-dot': row.house_color }">
                      <span class="quiz-house__dot" aria-hidden="true"></span>{{ row.house_name }}
                    </span>
                    <span v-else class="quiz-muted">—</span>
                  </td>
                  <td>{{ row.score }} / {{ row.total }}</td>
                  <td>{{ formatQuizDuration(row.duration_ms) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import { quizService, quizState, quizErrorMessage, formatQuizDuration } from '@/service/quizService'
import './quiz-shared.css'

const props = defineProps({ id: { type: String, required: true } })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const quiz = ref(null)
const stage = ref('intro')
const starting = ref(false)
const answering = ref(false)
const finishing = ref(false)
const actionError = ref('')

const attempt = ref(null)
const questions = ref([])
const feedbackByQuestion = ref({})
const currentIndex = ref(0)
const selection = ref([])
const singleSelection = ref(null)
const currentImageUrl = ref(null)
const result = ref(null)

const leaderboard = ref([])
const leaderboardError = ref('')

const questionTitle = ref(null)
const feedbackPanel = ref(null)
const resultTitle = ref(null)
const leaderboardSection = ref(null)

const state = computed(() => quizState(quiz.value))
const quizTitle = computed(() => quiz.value?.title || 'Quiz')
const headerDescription = computed(() => (
  stage.value === 'playing'
    ? 'Répondez à chaque question : la correction s’affiche après validation.'
    : 'Passez le quiz, puis comparez votre résultat au classement.'
))
const introTitle = computed(() => {
  if (quiz.value?.in_progress) return 'Reprendre votre tentative'
  return state.value === 'done' ? 'S’entraîner à nouveau' : 'Prêt à commencer ?'
})
const startLabel = computed(() => {
  if (quiz.value?.in_progress) return 'Reprendre'
  return state.value === 'done' ? 'Refaire pour s’entraîner' : 'Commencer le quiz'
})

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const currentFeedback = computed(() => feedbackByQuestion.value[currentQuestion.value?.id] || null)
const answeredCount = computed(() => Object.keys(feedbackByQuestion.value).length)
const hasNextQuestion = computed(() => questions.value.some(question => !feedbackByQuestion.value[question.id]))
const selectedIds = computed(() => (
  currentQuestion.value?.kind === 'multiple'
    ? selection.value
    : (singleSelection.value ? [singleSelection.value] : [])
))

const resultMessage = computed(() => {
  if (!result.value) return ''
  if (!result.value.is_first) return 'Tentative d’entraînement : elle ne modifie ni le classement ni vos points.'
  if (!result.value.counts_for_ranking) return 'Vous gérez ce quiz : votre essai n’entre pas dans le classement.'
  if (result.value.xp_awarded > 0) {
    return result.value.perfect
      ? 'Toutes les réponses sont justes à la première tentative : points doublés, pour vous et votre maison.'
      : 'Première tentative enregistrée : les points comptent pour vous et votre maison.'
  }
  return 'Première tentative enregistrée dans le classement.'
})

function optionStatus(option) {
  const feedback = currentFeedback.value
  if (!feedback) return null
  const isCorrect = feedback.correct_option_ids.includes(option.id)
  const isSelected = feedback.selected.includes(option.id)
  if (isCorrect && isSelected) return { icon: 'pi pi-check', text: 'Votre réponse, juste' }
  if (isCorrect) return { icon: 'pi pi-check', text: 'Bonne réponse' }
  if (isSelected) return { icon: 'pi pi-times', text: 'Votre réponse, fausse' }
  return null
}

function optionClass(option) {
  const feedback = currentFeedback.value
  if (!feedback) return { 'is-selected': selectedIds.value.includes(option.id) }
  return {
    'is-correct': feedback.correct_option_ids.includes(option.id),
    'is-wrong': feedback.selected.includes(option.id) && !feedback.correct_option_ids.includes(option.id),
  }
}

async function focusElement(target) {
  await nextTick()
  target.value?.focus?.()
}

async function loadLeaderboard() {
  leaderboardError.value = ''
  try {
    leaderboard.value = await quizService.getLeaderboard(props.id)
  } catch (loadError) {
    leaderboardError.value = quizErrorMessage(loadError, 'Le classement n’a pas pu être chargé.')
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const list = await quizService.listMyQuizzes()
    quiz.value = list.find(entry => entry.id === props.id) || null
    if (!quiz.value) {
      error.value = 'Ce quiz n’existe pas, n’est plus publié ou n’est pas destiné à votre classe.'
      return
    }
    await loadLeaderboard()
  } catch (loadError) {
    error.value = quizErrorMessage(loadError, 'Réessayez dans un instant.')
  } finally {
    loading.value = false
  }
  if (!error.value && route.query.vue === 'classement') {
    await nextTick()
    leaderboardSection.value?.scrollIntoView?.({ block: 'start' })
  }
}

function showQuestion(index) {
  currentIndex.value = index
  selection.value = []
  singleSelection.value = null
  actionError.value = ''
}

async function start() {
  starting.value = true
  actionError.value = ''
  try {
    const started = await quizService.startAttempt(props.id)
    attempt.value = started
    questions.value = started.questions || []
    feedbackByQuestion.value = Object.fromEntries((started.answers || []).map(answer => [answer.question_id, answer]))
    result.value = null
    const firstUnanswered = questions.value.findIndex(question => !feedbackByQuestion.value[question.id])
    // Tout est déjà répondu (reprise) : il ne reste qu'à terminer.
    showQuestion(firstUnanswered === -1 ? questions.value.length - 1 : firstUnanswered)
    stage.value = 'playing'
    await focusElement(questionTitle)
  } catch (startError) {
    toast.add({ severity: 'error', summary: 'Quiz', detail: quizErrorMessage(startError), life: 6000 })
  } finally {
    starting.value = false
  }
}

async function submitAnswer() {
  if (!currentQuestion.value || selectedIds.value.length === 0 || answering.value) return
  answering.value = true
  actionError.value = ''
  try {
    const feedback = await quizService.answerQuestion(attempt.value.attempt_id, currentQuestion.value.id, [...selectedIds.value])
    feedbackByQuestion.value = { ...feedbackByQuestion.value, [currentQuestion.value.id]: feedback }
    await focusElement(feedbackPanel)
  } catch (answerError) {
    actionError.value = quizErrorMessage(answerError, 'Votre réponse n’a pas pu être enregistrée. Réessayez.')
  } finally {
    answering.value = false
  }
}

async function goToNextQuestion() {
  const next = questions.value.findIndex(question => !feedbackByQuestion.value[question.id])
  if (next === -1) return
  showQuestion(next)
  await focusElement(questionTitle)
}

async function finish() {
  if (finishing.value) return
  finishing.value = true
  actionError.value = ''
  try {
    result.value = await quizService.finishAttempt(attempt.value.attempt_id)
    stage.value = 'result'
    if (result.value.xp_awarded > 0) {
      toast.add({
        severity: 'success',
        summary: `+${result.value.xp_awarded} XP`,
        detail: result.value.perfect ? 'Quiz réussi sans faute !' : 'Quiz terminé.',
        life: 5000,
      })
    }
    const [list] = await Promise.all([quizService.listMyQuizzes().catch(() => null), loadLeaderboard()])
    const refreshed = list?.find(entry => entry.id === props.id)
    if (refreshed) quiz.value = refreshed
    await focusElement(resultTitle)
  } catch (finishError) {
    actionError.value = quizErrorMessage(finishError, 'Le résultat n’a pas pu être enregistré. Réessayez.')
  } finally {
    finishing.value = false
  }
}

watch(currentQuestion, async (question) => {
  currentImageUrl.value = null
  if (!question?.image_path) return
  const url = await quizService.getQuestionImageUrl(question.image_path)
  if (currentQuestion.value?.id === question.id) currentImageUrl.value = url
})

onMounted(load)
</script>

<style scoped>
.quiz-gap {
  margin-top: 1rem;
}

.quiz-title {
  font-size: clamp(1.3rem, 3vw, 1.7rem);
  line-height: 1.2;
}

.quiz-subtitle {
  margin-bottom: 0.35rem;
  font-size: 1.15rem;
}

.quiz-rules {
  display: grid;
  gap: 0.4rem;
  margin: 1rem 0 0;
  padding-left: 1.2rem;
}

.quiz-progress-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
  color: var(--text-color-secondary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.quiz-progress {
  height: 8px;
  margin-bottom: 1.25rem;
}

.quiz-image {
  display: block;
  max-width: 100%;
  max-height: 320px;
  margin: 0 auto 1.25rem;
  border-radius: 12px;
  object-fit: contain;
}

.quiz-options {
  display: grid;
  gap: 0.6rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.quiz-options legend {
  margin-bottom: 0.9rem;
  padding: 0;
  font-size: clamp(1.1rem, 2.6vw, 1.35rem);
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.quiz-kind {
  display: block;
  margin-top: 0.35rem;
  color: var(--text-color-secondary);
  font-size: 0.88rem;
  font-weight: 500;
}

.quiz-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.35rem 0.75rem;
  min-height: 52px;
  padding: 0.75rem 0.9rem;
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  background: var(--surface-section);
  cursor: pointer;
  transition: border-color 0.15s ease-out, background-color 0.15s ease-out;
}

.quiz-option input {
  width: 1.2rem;
  height: 1.2rem;
  margin: 0;
  accent-color: var(--primary-color);
}

.quiz-option__label {
  overflow-wrap: anywhere;
  line-height: 1.4;
}

.quiz-option__status {
  grid-column: 2;
  font-size: 0.86rem;
  font-weight: 700;
}

.quiz-option.is-selected {
  border-color: var(--primary-color);
}

.quiz-options:disabled .quiz-option {
  cursor: default;
}

.quiz-option.is-correct {
  border-color: var(--green-400, #4ade80);
  background: color-mix(in srgb, var(--green-400, #4ade80) 12%, var(--surface-section));
}

.quiz-option.is-wrong {
  border-color: var(--red-400, #f87171);
  background: color-mix(in srgb, var(--red-400, #f87171) 12%, var(--surface-section));
}

@media (hover: hover) {
  .quiz-options:not(:disabled) .quiz-option:hover {
    border-color: var(--primary-color);
  }
}

.quiz-feedback-anchor:focus {
  outline: none;
}

.quiz-feedback {
  margin-top: 1rem;
  padding: 1rem;
  border-left: 4px solid var(--surface-border);
  border-radius: 12px;
  background: var(--surface-section);
}

.quiz-feedback h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.05rem;
}

.quiz-feedback p {
  margin-top: 0.5rem;
  line-height: 1.6;
}

.quiz-feedback.is-correct {
  border-left-color: var(--green-400, #4ade80);
}

.quiz-feedback.is-wrong {
  border-left-color: var(--red-400, #f87171);
}

.quiz-error {
  margin-top: 1rem;
  color: var(--red-300, #fca5a5);
}

.quiz-result {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
  margin: 1.25rem 0 0;
}

.quiz-result div {
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: var(--surface-section);
}

.quiz-result dt {
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  font-weight: 600;
}

.quiz-result dd {
  margin: 0.2rem 0 0;
  font-size: 1.6rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.quiz-result__sub {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

@media (prefers-reduced-motion: reduce) {
  .quiz-option {
    transition: none;
  }
}
</style>
