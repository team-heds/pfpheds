<template>
  <Navbar />
  <main class="quiz-page" data-page-scroll>
    <div class="quiz-shell">
      <GamificationPageHeader
        title="Quiz"
        description="Révisez avec les quiz de vos enseignants. Seule votre première tentative compte pour le classement et les points."
        icon="pi pi-question-circle"
        @back="goBack"
      >
        <template #actions>
          <Button
            v-if="canAuthor"
            label="Gérer les quiz"
            icon="pi pi-pencil"
            class="quiz-touch"
            @click="router.push('/quiz/gestion')"
          />
        </template>
      </GamificationPageHeader>

      <section v-if="loading" class="quiz-panel quiz-state" aria-live="polite" aria-busy="true">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement des quiz</h2><p class="quiz-muted">Un instant…</p></div>
      </section>

      <section v-else-if="error" class="quiz-panel quiz-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>Les quiz n’ont pas pu être chargés</h2>
          <p class="quiz-muted">{{ error }}</p>
          <div class="quiz-actions quiz-state__actions">
            <Button label="Réessayer" icon="pi pi-refresh" @click="load" />
          </div>
        </div>
      </section>

      <template v-else>
        <section class="quiz-panel quiz-filters" aria-label="Filtres">
          <div class="quiz-field">
            <label for="quiz-theme-filter">Thème</label>
            <Dropdown
              v-model="themeFilter"
              input-id="quiz-theme-filter"
              :options="themeOptions"
              option-label="label"
              option-value="value"
            />
          </div>
          <div class="quiz-field">
            <span id="quiz-state-filter" class="quiz-label">État</span>
            <SelectButton
              v-model="stateFilter"
              :options="stateOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              aria-labelledby="quiz-state-filter"
            />
          </div>
        </section>

        <p class="quiz-sr-only" aria-live="polite">{{ filteredQuizzes.length }} quiz affichés</p>

        <section v-if="filteredQuizzes.length === 0" class="quiz-panel quiz-state">
          <i class="pi pi-inbox" aria-hidden="true"></i>
          <div>
            <h2>{{ quizzes.length === 0 ? 'Aucun quiz pour le moment' : 'Aucun quiz ne correspond à ces filtres' }}</h2>
            <p class="quiz-muted">
              {{ quizzes.length === 0
                ? 'Les quiz publiés pour votre classe apparaîtront ici.'
                : 'Modifiez le thème ou l’état pour voir d’autres quiz.' }}
            </p>
          </div>
        </section>

        <ul v-else class="quiz-list">
          <li v-for="quiz in filteredQuizzes" :key="quiz.id" class="quiz-panel quiz-card">
            <div class="quiz-card__head">
              <h2>{{ quiz.title }}</h2>
              <Tag :value="stateLabel(quiz)" :severity="stateSeverity(quiz)" />
            </div>
            <p v-if="quiz.description" class="quiz-muted">{{ quiz.description }}</p>
            <p class="quiz-meta">
              <span v-if="quiz.theme"><i class="pi pi-tag" aria-hidden="true"></i>{{ quiz.theme }}</span>
              <span><i class="pi pi-list" aria-hidden="true"></i>{{ quiz.question_count }} question{{ quiz.question_count > 1 ? 's' : '' }}</span>
              <span v-if="quiz.author_name"><i class="pi pi-user" aria-hidden="true"></i>{{ quiz.author_name }}</span>
              <span v-if="quiz.closes_at && quiz.is_open"><i class="pi pi-clock" aria-hidden="true"></i>Jusqu’au {{ formatDate(quiz.closes_at) }}</span>
            </p>
            <p v-if="quizState(quiz) === 'done'" class="quiz-card__score">
              Première tentative : <strong>{{ quiz.first_score }} / {{ quiz.first_total }}</strong>
              en {{ formatQuizDuration(quiz.first_duration_ms) }}
              <span v-if="quiz.first_xp_awarded > 0"> · +{{ quiz.first_xp_awarded }} XP</span>
            </p>
            <div class="quiz-actions">
              <Button
                v-if="quiz.is_open || quiz.in_progress"
                :label="actionLabel(quiz)"
                :icon="quizState(quiz) === 'done' ? 'pi pi-replay' : 'pi pi-play'"
                :outlined="quizState(quiz) === 'done'"
                :aria-label="`${actionLabel(quiz)} : ${quiz.title}`"
                @click="router.push(`/quiz/${quiz.id}`)"
              />
              <Button
                label="Classement"
                icon="pi pi-chart-bar"
                text
                :aria-label="`Classement : ${quiz.title}`"
                @click="router.push({ path: `/quiz/${quiz.id}`, query: { vue: 'classement' } })"
              />
            </div>
          </li>
        </ul>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import { quizService, quizState, quizErrorMessage, formatQuizDuration } from '@/service/quizService'
import './quiz-shared.css'

const router = useRouter()

const quizzes = ref([])
const loading = ref(true)
const error = ref('')
const canAuthor = ref(false)
const ALL_THEMES = 'all-themes'
const themeFilter = ref(ALL_THEMES)
const stateFilter = ref('all')

const stateOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'À faire', value: 'todo' },
  { label: 'Terminés', value: 'done' },
]

const themeOptions = computed(() => {
  const themes = [...new Set(quizzes.value.map(quiz => quiz.theme).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'))
  return [{ label: 'Tous les thèmes', value: ALL_THEMES }, ...themes.map(theme => ({ label: theme, value: theme }))]
})

const filteredQuizzes = computed(() => quizzes.value.filter((quiz) => {
  if (themeFilter.value !== ALL_THEMES && quiz.theme !== themeFilter.value) return false
  const state = quizState(quiz)
  if (stateFilter.value === 'done') return state === 'done'
  if (stateFilter.value === 'todo') return state === 'todo' || state === 'in_progress'
  return true
}))

const STATE_LABELS = { todo: 'À faire', in_progress: 'En cours', closed: 'Fermé' }
const STATE_SEVERITIES = { todo: 'info', in_progress: 'warning', done: 'success', closed: 'secondary' }

function stateLabel(quiz) {
  const state = quizState(quiz)
  return state === 'done' ? `Terminé · ${quiz.first_score}/${quiz.first_total}` : STATE_LABELS[state]
}

function stateSeverity(quiz) {
  return STATE_SEVERITIES[quizState(quiz)]
}

function actionLabel(quiz) {
  const state = quizState(quiz)
  if (quiz.in_progress) return 'Reprendre'
  return state === 'done' ? 'Refaire pour s’entraîner' : 'Commencer'
}

function formatDate(value) {
  return new Date(value).toLocaleString('fr-CH', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/outils')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [list, author] = await Promise.all([quizService.listMyQuizzes(), quizService.canAuthorQuizzes()])
    quizzes.value = list
    canAuthor.value = author
  } catch (loadError) {
    error.value = quizErrorMessage(loadError, 'Réessayez dans un instant.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.quiz-filters {
  display: grid;
  grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
}

.quiz-state__actions {
  margin-top: 1rem;
}

.quiz-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.quiz-list .quiz-panel + .quiz-panel {
  margin-top: 0;
}

.quiz-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}

.quiz-card__head h2 {
  font-size: 1.15rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.quiz-card__score {
  font-variant-numeric: tabular-nums;
}

.quiz-card .quiz-actions {
  margin-top: auto;
}

@media (max-width: 640px) {
  .quiz-filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .quiz-filters :deep(.p-selectbutton) {
    display: flex;
  }

  .quiz-filters :deep(.p-selectbutton .p-button) {
    flex: 1 1 0;
    min-height: 44px;
  }
}
</style>
