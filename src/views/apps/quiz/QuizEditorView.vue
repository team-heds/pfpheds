<template>
  <Navbar />
  <main class="quiz-page" data-page-scroll>
    <div class="quiz-shell quiz-shell--narrow">
      <GamificationPageHeader
        :title="quiz?.title || 'Quiz'"
        description="Informations, questions et résultats du quiz."
        icon="pi pi-pencil"
        @back="router.push('/quiz/gestion')"
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
            <Button label="Retour à mes quiz" icon="pi pi-arrow-left" @click="router.push('/quiz/gestion')" />
          </div>
        </div>
      </section>

      <template v-else>
        <!-- État de publication -->
        <section class="quiz-panel editor-status" aria-label="Publication">
          <div>
            <Tag :value="isPublished ? 'Publié' : 'Brouillon'" :severity="isPublished ? 'success' : 'warning'" />
            <p class="quiz-muted quiz-gap-sm">
              {{ isPublished
                ? 'Visible par les classes visées. Repassez-le en brouillon pour modifier les questions.'
                : 'Invisible pour les étudiants tant qu’il n’est pas publié.' }}
            </p>
          </div>
          <Button
            :label="isPublished ? 'Repasser en brouillon' : 'Publier'"
            :icon="isPublished ? 'pi pi-eye-slash' : 'pi pi-send'"
            :outlined="isPublished"
            :loading="statusBusy"
            :disabled="!isPublished && questions.length === 0"
            class="quiz-touch"
            @click="toggleStatus"
          />
        </section>

        <!-- Informations -->
        <section class="quiz-panel" aria-labelledby="editor-info-title">
          <h2 id="editor-info-title" class="editor-title">Informations</h2>
          <form class="editor-form" @submit.prevent="saveInfo">
            <div class="quiz-field editor-form__wide">
              <label for="quiz-title">Titre</label>
              <InputText id="quiz-title" v-model="form.title" maxlength="120" />
            </div>
            <div class="quiz-field editor-form__wide">
              <label for="quiz-description">Description</label>
              <Textarea id="quiz-description" v-model="form.description" rows="3" maxlength="1000" auto-resize />
            </div>
            <div class="quiz-field">
              <label for="quiz-theme">Thème</label>
              <Dropdown
                v-model="form.theme"
                input-id="quiz-theme"
                :options="themeSuggestions"
                editable
                placeholder="Ex. Épaule, Genou, Neuro…"
                :pt="{ input: { maxlength: 40 } }"
              />
            </div>
            <div class="quiz-field">
              <label for="quiz-classes">Classes visées</label>
              <MultiSelect
                v-model="form.target_classes"
                input-id="quiz-classes"
                :options="classOptions"
                placeholder="Toutes les classes"
                display="chip"
                :show-toggle-all="false"
                aria-describedby="quiz-classes-help"
              />
              <small id="quiz-classes-help">Sans sélection, le quiz est ouvert à toutes les classes.</small>
            </div>
            <div class="quiz-field">
              <label for="quiz-opens">Ouverture (facultatif)</label>
              <Calendar
                v-model="form.opens_at"
                input-id="quiz-opens"
                show-time
                hour-format="24"
                date-format="dd.mm.yy"
                show-button-bar
                show-icon
              />
            </div>
            <div class="quiz-field">
              <label for="quiz-closes">Fermeture (facultatif)</label>
              <Calendar
                v-model="form.closes_at"
                input-id="quiz-closes"
                show-time
                hour-format="24"
                date-format="dd.mm.yy"
                show-button-bar
                show-icon
              />
            </div>
            <p v-if="infoError" class="quiz-error editor-form__wide" role="alert">{{ infoError }}</p>
            <div class="quiz-actions editor-form__wide">
              <Button type="submit" label="Enregistrer les informations" icon="pi pi-save" :loading="savingInfo" />
            </div>
          </form>
        </section>

        <!-- Questions -->
        <section class="quiz-panel" aria-labelledby="editor-questions-title">
          <div class="editor-section-head">
            <h2 id="editor-questions-title" class="editor-title">Questions ({{ questions.length }})</h2>
            <Button
              label="Ajouter une question"
              icon="pi pi-plus"
              :disabled="isPublished"
              class="quiz-touch"
              @click="openQuestion(null)"
            />
          </div>
          <p v-if="isPublished" class="quiz-muted quiz-gap-sm">
            Le quiz est publié : ses questions sont figées. Repassez-le en brouillon pour les modifier.
          </p>
          <p v-if="questions.length === 0" class="quiz-muted quiz-gap">
            Aucune question pour le moment. Ajoutez-en au moins une pour pouvoir publier.
          </p>
          <ol v-else class="editor-questions">
            <li v-for="(question, index) in questions" :key="question.id" class="editor-question">
              <div class="editor-question__body">
                <p class="editor-question__prompt">{{ index + 1 }}. {{ question.prompt }}</p>
                <p class="quiz-meta">
                  <span>{{ question.kind === 'multiple' ? 'Choix multiple' : 'Choix unique' }}</span>
                  <span>{{ question.options.length }} réponses</span>
                  <span v-if="question.image_path"><i class="pi pi-image" aria-hidden="true"></i>Image</span>
                  <span v-if="!question.explanation"><i class="pi pi-info-circle" aria-hidden="true"></i>Sans explication</span>
                </p>
              </div>
              <div class="editor-question__actions">
                <Button
                  icon="pi pi-arrow-up"
                  text
                  rounded
                  :disabled="isPublished || index === 0 || reordering"
                  :aria-label="`Monter la question ${index + 1}`"
                  @click="move(index, -1)"
                />
                <Button
                  icon="pi pi-arrow-down"
                  text
                  rounded
                  :disabled="isPublished || index === questions.length - 1 || reordering"
                  :aria-label="`Descendre la question ${index + 1}`"
                  @click="move(index, 1)"
                />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  :disabled="isPublished"
                  :aria-label="`Modifier la question ${index + 1}`"
                  @click="openQuestion(question)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  :disabled="isPublished"
                  :aria-label="`Supprimer la question ${index + 1}`"
                  @click="confirmDeleteQuestion(question, index)"
                />
              </div>
            </li>
          </ol>
          <p class="quiz-sr-only" aria-live="polite">{{ reorderMessage }}</p>
        </section>

        <!-- Résultats -->
        <section class="quiz-panel" aria-labelledby="editor-results-title">
          <div class="editor-section-head">
            <h2 id="editor-results-title" class="editor-title">Résultats</h2>
            <Button label="Actualiser" icon="pi pi-refresh" text :loading="resultsLoading" @click="loadResults" />
          </div>
          <p v-if="resultsError" class="quiz-error" role="alert">{{ resultsError }}</p>
          <template v-else-if="summary">
            <p class="quiz-muted quiz-gap-sm">Premières tentatives des étudiants uniquement.</p>
            <dl class="editor-stats">
              <div><dt>Participants</dt><dd>{{ summary.stats.participants }}</dd></div>
              <div>
                <dt>Score moyen</dt>
                <dd v-if="summary.stats.participants > 0">
                  {{ formatNumber(summary.stats.average_score) }} / {{ questions.length }}
                  <span class="editor-stats__sub">({{ formatNumber(summary.stats.average_percent) }} %)</span>
                </dd>
                <dd v-else>—</dd>
              </div>
              <div><dt>Sans faute</dt><dd>{{ summary.stats.perfect_count }}</dd></div>
              <div><dt>En cours</dt><dd>{{ summary.stats.in_progress }}</dd></div>
            </dl>
            <template v-if="summary.stats.participants > 0">
              <h3 class="editor-subtitle">Questions les plus ratées</h3>
              <div class="quiz-table-wrap">
                <table class="quiz-table">
                  <thead>
                    <tr>
                      <th scope="col">Question</th>
                      <th scope="col">Réponses</th>
                      <th scope="col">Erreurs</th>
                      <th scope="col">Taux d’erreur</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in summary.questions" :key="row.question_id">
                      <td class="editor-results__prompt">{{ row.prompt }}</td>
                      <td>{{ row.answers }}</td>
                      <td>{{ row.wrong }}</td>
                      <td>{{ row.wrong_percent === null ? '—' : `${formatNumber(row.wrong_percent)} %` }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <p v-else class="quiz-gap">Aucun étudiant n’a encore terminé ce quiz.</p>
          </template>
        </section>
      </template>
    </div>

    <!-- Édition d'une question -->
    <Dialog
      v-model:visible="questionVisible"
      modal
      :header="editing?.id ? 'Modifier la question' : 'Nouvelle question'"
      :style="{ width: 'min(96vw, 680px)' }"
      :draggable="false"
    >
      <form v-if="editing" class="quiz-page question-form" @submit.prevent="saveQuestion">
        <div class="quiz-field">
          <label for="question-prompt">Énoncé</label>
          <Textarea id="question-prompt" v-model="editing.prompt" rows="3" maxlength="1000" auto-resize autofocus />
        </div>

        <div class="quiz-field">
          <span id="question-kind-label" class="quiz-label">Type de question</span>
          <SelectButton
            :model-value="editing.kind"
            :options="kindOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            aria-labelledby="question-kind-label"
            @update:model-value="setKind"
          />
        </div>

        <fieldset class="question-options">
          <legend class="quiz-label">
            Réponses
            <span class="quiz-muted question-options__hint">
              — cochez {{ editing.kind === 'multiple' ? 'les réponses justes' : 'la réponse juste' }}
            </span>
          </legend>
          <div v-for="(option, index) in editing.options" :key="option.id" class="question-option">
            <input
              v-if="editing.kind === 'multiple'"
              v-model="option.correct"
              type="checkbox"
              :aria-label="`Réponse ${index + 1} juste`"
            />
            <input
              v-else
              type="radio"
              name="question-correct"
              :checked="option.correct"
              :aria-label="`Réponse ${index + 1} juste`"
              @change="setSingleCorrect(option.id)"
            />
            <InputText
              v-model="option.label"
              maxlength="300"
              :placeholder="`Réponse ${index + 1}`"
              :aria-label="`Texte de la réponse ${index + 1}`"
            />
            <Button
              type="button"
              icon="pi pi-times"
              text
              rounded
              severity="secondary"
              :disabled="editing.options.length <= minOptions"
              :aria-label="`Retirer la réponse ${index + 1}`"
              @click="removeOption(index)"
            />
          </div>
          <Button
            type="button"
            label="Ajouter une réponse"
            icon="pi pi-plus"
            text
            :disabled="editing.options.length >= maxOptions"
            @click="addOption"
          />
        </fieldset>

        <div class="quiz-field">
          <label for="question-explanation">Explication affichée après la réponse</label>
          <Textarea id="question-explanation" v-model="editing.explanation" rows="3" maxlength="2000" auto-resize />
        </div>

        <div class="quiz-field">
          <label for="question-image">Image (facultatif)</label>
          <img v-if="imagePreview" :src="imagePreview" alt="Aperçu de l’image de la question" class="question-image" />
          <div class="quiz-actions">
            <input
              id="question-image"
              ref="imageInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="question-image__input"
              @change="onImageSelected"
            />
            <Button
              v-if="editing.image_path"
              type="button"
              label="Retirer l’image"
              icon="pi pi-trash"
              text
              severity="danger"
              @click="removeImage"
            />
          </div>
          <small>JPEG, PNG ou WebP, 5 Mo au maximum.<span v-if="uploading"> Envoi en cours…</span></small>
        </div>

        <p v-if="questionError" class="quiz-error" role="alert">{{ questionError }}</p>

        <div class="quiz-actions">
          <Button type="submit" label="Enregistrer la question" icon="pi pi-check" :loading="savingQuestion" :disabled="uploading" />
          <Button type="button" label="Annuler" text @click="questionVisible = false" />
        </div>
      </form>
    </Dialog>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import {
  quizService,
  quizErrorMessage,
  emptyQuestion,
  nextOptionId,
  validateQuestion,
  QUIZ_CLASSES,
  QUIZ_THEME_SUGGESTIONS,
  QUIZ_MIN_OPTIONS,
  QUIZ_MAX_OPTIONS,
} from '@/service/quizService'
import './quiz-shared.css'

const props = defineProps({ id: { type: String, required: true } })

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const themeSuggestions = [...QUIZ_THEME_SUGGESTIONS]
const classOptions = [...QUIZ_CLASSES]
const minOptions = QUIZ_MIN_OPTIONS
const maxOptions = QUIZ_MAX_OPTIONS
const kindOptions = [
  { label: 'Choix unique', value: 'single' },
  { label: 'Choix multiple', value: 'multiple' },
]

const loading = ref(true)
const error = ref('')
const quiz = ref(null)
const questions = ref([])
const form = reactive({ title: '', description: '', theme: '', target_classes: [], opens_at: null, closes_at: null })
const savingInfo = ref(false)
const infoError = ref('')
const statusBusy = ref(false)
const reordering = ref(false)
const reorderMessage = ref('')

const questionVisible = ref(false)
const editing = ref(null)
const savingQuestion = ref(false)
const questionError = ref('')
const uploading = ref(false)
const imagePreview = ref(null)
const imageInput = ref(null)

const summary = ref(null)
const resultsLoading = ref(false)
const resultsError = ref('')

const isPublished = computed(() => quiz.value?.status === 'published')

function notify(severity, detail) {
  toast.add({ severity, summary: 'Quiz', detail, life: severity === 'error' ? 6000 : 3500 })
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('fr-CH', { maximumFractionDigits: 1 })
}

function fillForm(source) {
  form.title = source.title
  form.description = source.description || ''
  form.theme = source.theme || ''
  form.target_classes = [...(source.target_classes || [])]
  form.opens_at = source.opens_at ? new Date(source.opens_at) : null
  form.closes_at = source.closes_at ? new Date(source.closes_at) : null
}

async function loadResults() {
  resultsLoading.value = true
  resultsError.value = ''
  try {
    summary.value = await quizService.getResultsSummary(props.id)
  } catch (loadError) {
    resultsError.value = quizErrorMessage(loadError, 'Les résultats n’ont pas pu être chargés.')
  } finally {
    resultsLoading.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const loaded = await quizService.getManagedQuiz(props.id)
    if (!loaded) {
      error.value = 'Ce quiz n’existe pas ou vous n’avez pas le droit de le modifier.'
      return
    }
    const { questions: loadedQuestions, ...meta } = loaded
    quiz.value = meta
    questions.value = loadedQuestions
    fillForm(meta)
    await loadResults()
  } catch (loadError) {
    error.value = quizErrorMessage(loadError, 'Réessayez dans un instant.')
  } finally {
    loading.value = false
  }
}

async function saveInfo() {
  infoError.value = ''
  if (form.title.trim().length < 3) {
    infoError.value = 'Le titre doit contenir au moins 3 caractères.'
    return
  }
  if (form.opens_at && form.closes_at && form.closes_at <= form.opens_at) {
    infoError.value = 'La date de fermeture doit être après la date d’ouverture.'
    return
  }
  savingInfo.value = true
  try {
    quiz.value = await quizService.updateQuiz(props.id, form)
    fillForm(quiz.value)
    notify('success', 'Informations enregistrées.')
  } catch (saveError) {
    infoError.value = quizErrorMessage(saveError, 'L’enregistrement a échoué.')
  } finally {
    savingInfo.value = false
  }
}

async function toggleStatus() {
  const publishing = !isPublished.value
  statusBusy.value = true
  try {
    quiz.value = await quizService.setQuizStatus(props.id, publishing ? 'published' : 'draft')
    notify('success', publishing ? 'Quiz publié.' : 'Quiz repassé en brouillon.')
  } catch (statusError) {
    notify('error', quizErrorMessage(statusError, 'Le changement d’état a échoué.'))
  } finally {
    statusBusy.value = false
  }
}

async function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= questions.value.length || reordering.value) return
  const previous = [...questions.value]
  const reordered = [...questions.value]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(target, 0, moved)
  questions.value = reordered
  reordering.value = true
  try {
    await quizService.reorderQuestions(reordered.map(question => question.id))
    reorderMessage.value = `Question déplacée en position ${target + 1} sur ${reordered.length}.`
  } catch (moveError) {
    questions.value = previous
    notify('error', quizErrorMessage(moveError, 'Le nouvel ordre n’a pas pu être enregistré.'))
  } finally {
    reordering.value = false
  }
}

async function showImagePreview(path) {
  imagePreview.value = path ? await quizService.getQuestionImageUrl(path) : null
}

function openQuestion(question) {
  editing.value = question
    ? { ...question, options: question.options.map(option => ({ ...option })) }
    : emptyQuestion(questions.value.length)
  questionError.value = ''
  imagePreview.value = null
  showImagePreview(editing.value.image_path)
  questionVisible.value = true
}

function setKind(kind) {
  if (!kind || !editing.value) return
  editing.value.kind = kind
  if (kind === 'single') {
    const firstCorrect = editing.value.options.find(option => option.correct) || editing.value.options[0]
    setSingleCorrect(firstCorrect.id)
  }
}

function setSingleCorrect(optionId) {
  editing.value.options.forEach((option) => { option.correct = option.id === optionId })
}

function addOption() {
  if (editing.value.options.length >= maxOptions) return
  editing.value.options.push({ id: nextOptionId(editing.value.options), label: '', correct: false })
}

function removeOption(index) {
  if (editing.value.options.length <= minOptions) return
  const [removed] = editing.value.options.splice(index, 1)
  if (removed.correct && editing.value.kind === 'single') setSingleCorrect(editing.value.options[0].id)
}

async function onImageSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  questionError.value = ''
  try {
    editing.value.image_path = await quizService.uploadQuestionImage(file)
    await showImagePreview(editing.value.image_path)
  } catch (uploadError) {
    questionError.value = uploadError?.message?.startsWith('Image') || uploadError?.message?.startsWith('L’image')
      ? uploadError.message
      : quizErrorMessage(uploadError, 'L’image n’a pas pu être envoyée.')
  } finally {
    uploading.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

function removeImage() {
  editing.value.image_path = null
  imagePreview.value = null
}

async function saveQuestion() {
  const problem = validateQuestion(editing.value)
  if (problem) {
    questionError.value = problem
    return
  }
  savingQuestion.value = true
  questionError.value = ''
  try {
    const saved = await quizService.saveQuestion(props.id, editing.value)
    const index = questions.value.findIndex(question => question.id === saved.id)
    if (index === -1) questions.value = [...questions.value, saved]
    else questions.value.splice(index, 1, saved)
    questionVisible.value = false
    notify('success', 'Question enregistrée.')
  } catch (saveError) {
    questionError.value = quizErrorMessage(saveError, 'La question n’a pas pu être enregistrée.')
  } finally {
    savingQuestion.value = false
  }
}

function confirmDeleteQuestion(question, index) {
  confirm.require({
    header: 'Supprimer cette question ?',
    message: `La question ${index + 1} sera supprimée définitivement, avec les réponses déjà données.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await quizService.deleteQuestion(question.id)
        questions.value = questions.value.filter(entry => entry.id !== question.id)
        notify('success', 'Question supprimée.')
      } catch (deleteError) {
        notify('error', quizErrorMessage(deleteError, 'La suppression a échoué.'))
      }
    },
  })
}

onMounted(load)
</script>

<style scoped>
.quiz-gap {
  margin-top: 1rem;
}

.quiz-gap-sm {
  margin-top: 0.5rem;
}

.quiz-error {
  color: var(--red-300, #fca5a5);
}

.editor-title {
  font-size: 1.2rem;
}

.editor-subtitle {
  margin: 1.25rem 0 0.5rem;
  font-size: 1rem;
}

.editor-status,
.editor-section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
}

.editor-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.editor-form__wide {
  grid-column: 1 / -1;
}

.editor-questions {
  display: grid;
  gap: 0.6rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.editor-question {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  background: var(--surface-section);
}

.editor-question__body {
  flex: 1 1 280px;
  min-width: 0;
}

.editor-question__prompt {
  margin-bottom: 0.3rem;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.editor-question__actions {
  display: flex;
  gap: 0.15rem;
}

.editor-question__actions :deep(.p-button) {
  width: 44px;
  height: 44px;
}

.editor-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0 0;
}

.editor-stats div {
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: var(--surface-section);
}

.editor-stats dt {
  color: var(--text-color-secondary);
  font-size: 0.82rem;
  font-weight: 600;
}

.editor-stats dd {
  margin: 0.2rem 0 0;
  font-size: 1.4rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.editor-stats__sub {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  font-weight: 500;
}

.editor-results__prompt {
  min-width: 220px;
  overflow-wrap: anywhere;
}

.question-form {
  display: grid;
  gap: 1.1rem;
  min-height: 0;
  padding: 0;
}

.question-options {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.question-options legend {
  margin-bottom: 0.4rem;
  padding: 0;
}

.question-options__hint {
  font-weight: 400;
}

.question-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
}

.question-option input[type='checkbox'],
.question-option input[type='radio'] {
  width: 1.3rem;
  height: 1.3rem;
  margin: 0;
  accent-color: var(--primary-color);
}

.question-option :deep(.p-inputtext) {
  width: 100%;
}

.question-options > :deep(.p-button) {
  justify-self: start;
}

.question-image {
  display: block;
  max-width: 100%;
  max-height: 220px;
  border-radius: 12px;
  object-fit: contain;
}

.question-image__input {
  max-width: 100%;
  color: var(--text-color-secondary);
}

@media (max-width: 640px) {
  .editor-form {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
