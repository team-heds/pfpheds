<template>
  <Navbar />
  <main class="quiz-page" data-page-scroll>
    <div class="quiz-shell">
      <GamificationPageHeader
        title="Gérer les quiz"
        description="Créez, modifiez, publiez et suivez vos quiz. Un quiz publié est visible par les classes visées."
        icon="pi pi-pencil"
        @back="router.push('/quiz')"
      >
        <template #actions>
          <Button v-if="allowed" label="Nouveau quiz" icon="pi pi-plus" class="quiz-touch" @click="openCreate" />
        </template>
      </GamificationPageHeader>

      <section v-if="loading" class="quiz-panel quiz-state" aria-live="polite" aria-busy="true">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <div><h2>Chargement de vos quiz</h2><p class="quiz-muted">Un instant…</p></div>
      </section>

      <section v-else-if="!allowed" class="quiz-panel quiz-state" role="alert">
        <i class="pi pi-lock" aria-hidden="true"></i>
        <div>
          <h2>Accès réservé</h2>
          <p class="quiz-muted">La création de quiz est réservée aux enseignants et aux administrateurs.</p>
        </div>
      </section>

      <section v-else-if="error" class="quiz-panel quiz-state" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <h2>Vos quiz n’ont pas pu être chargés</h2>
          <p class="quiz-muted">{{ error }}</p>
          <div class="quiz-actions quiz-gap"><Button label="Réessayer" icon="pi pi-refresh" @click="load" /></div>
        </div>
      </section>

      <section v-else-if="quizzes.length === 0" class="quiz-panel quiz-state">
        <i class="pi pi-inbox" aria-hidden="true"></i>
        <div>
          <h2>Aucun quiz pour le moment</h2>
          <p class="quiz-muted">Créez votre premier quiz : il reste en brouillon tant que vous ne le publiez pas.</p>
          <div class="quiz-actions quiz-gap"><Button label="Nouveau quiz" icon="pi pi-plus" @click="openCreate" /></div>
        </div>
      </section>

      <ul v-else class="manage-list">
        <li v-for="quiz in quizzes" :key="quiz.id" class="quiz-panel manage-card">
          <div class="manage-card__main">
            <div class="manage-card__head">
              <h2>{{ quiz.title }}</h2>
              <Tag
                :value="quiz.status === 'published' ? 'Publié' : 'Brouillon'"
                :severity="quiz.status === 'published' ? 'success' : 'warning'"
              />
            </div>
            <p class="quiz-meta">
              <span v-if="quiz.theme"><i class="pi pi-tag" aria-hidden="true"></i>{{ quiz.theme }}</span>
              <span><i class="pi pi-users" aria-hidden="true"></i>{{ classesLabel(quiz) }}</span>
              <span><i class="pi pi-list" aria-hidden="true"></i>{{ quiz.question_count }} question{{ quiz.question_count > 1 ? 's' : '' }}</span>
              <span v-if="quiz.author_id !== userId"><i class="pi pi-user" aria-hidden="true"></i>Quiz d’un autre auteur</span>
            </p>
          </div>
          <div class="quiz-actions">
            <Button
              label="Modifier"
              icon="pi pi-pencil"
              :aria-label="`Modifier : ${quiz.title}`"
              @click="router.push(`/quiz/gestion/${quiz.id}`)"
            />
            <Button
              :label="quiz.status === 'published' ? 'Dépublier' : 'Publier'"
              :icon="quiz.status === 'published' ? 'pi pi-eye-slash' : 'pi pi-send'"
              outlined
              :loading="busyId === quiz.id"
              :aria-label="`${quiz.status === 'published' ? 'Dépublier' : 'Publier'} : ${quiz.title}`"
              @click="toggleStatus(quiz)"
            />
            <Button
              label="Dupliquer"
              icon="pi pi-copy"
              text
              :disabled="busyId === quiz.id"
              :aria-label="`Dupliquer : ${quiz.title}`"
              @click="duplicate(quiz)"
            />
            <Button
              label="Supprimer"
              icon="pi pi-trash"
              text
              severity="danger"
              :disabled="busyId === quiz.id"
              :aria-label="`Supprimer : ${quiz.title}`"
              @click="confirmDelete(quiz)"
            />
          </div>
        </li>
      </ul>
    </div>

    <Dialog
      v-model:visible="createVisible"
      modal
      header="Nouveau quiz"
      :style="{ width: 'min(92vw, 520px)' }"
      :draggable="false"
    >
      <form class="quiz-page quiz-create" @submit.prevent="create">
        <div class="quiz-field">
          <label for="new-quiz-title">Titre</label>
          <InputText id="new-quiz-title" v-model="draft.title" maxlength="120" autofocus aria-describedby="new-quiz-title-help" />
          <small id="new-quiz-title-help">Entre 3 et 120 caractères.</small>
        </div>
        <div class="quiz-field">
          <label for="new-quiz-theme">Thème</label>
          <Dropdown
            v-model="draft.theme"
            input-id="new-quiz-theme"
            :options="themeSuggestions"
            editable
            placeholder="Ex. Épaule, Genou, Neuro…"
            :pt="{ input: { maxlength: 40 } }"
          />
        </div>
        <p v-if="createError" class="quiz-error" role="alert">{{ createError }}</p>
        <div class="quiz-actions">
          <Button type="submit" label="Créer et ajouter des questions" icon="pi pi-check" :loading="creating" />
          <Button type="button" label="Annuler" text @click="createVisible = false" />
        </div>
      </form>
    </Dialog>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import { useAuthStore } from '@/stores/authStore'
import { quizService, quizErrorMessage, QUIZ_THEME_SUGGESTIONS } from '@/service/quizService'
import './quiz-shared.css'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const userId = authStore.user?.id || authStore.user?.uid || null
const themeSuggestions = [...QUIZ_THEME_SUGGESTIONS]

const loading = ref(true)
const allowed = ref(false)
const error = ref('')
const quizzes = ref([])
const busyId = ref(null)

const createVisible = ref(false)
const creating = ref(false)
const createError = ref('')
const draft = reactive({ title: '', theme: '' })

function classesLabel(quiz) {
  return quiz.target_classes?.length ? quiz.target_classes.join(', ') : 'Toutes les classes'
}

function notify(severity, detail) {
  toast.add({ severity, summary: 'Quiz', detail, life: severity === 'error' ? 6000 : 3500 })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    allowed.value = await quizService.canAuthorQuizzes()
    if (allowed.value) quizzes.value = await quizService.listManagedQuizzes()
  } catch (loadError) {
    error.value = quizErrorMessage(loadError, 'Réessayez dans un instant.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  draft.title = ''
  draft.theme = ''
  createError.value = ''
  createVisible.value = true
}

async function create() {
  if (draft.title.trim().length < 3) {
    createError.value = 'Le titre doit contenir au moins 3 caractères.'
    return
  }
  creating.value = true
  createError.value = ''
  try {
    const created = await quizService.createQuiz({ title: draft.title, theme: draft.theme || '' })
    createVisible.value = false
    router.push(`/quiz/gestion/${created.id}`)
  } catch (createFailure) {
    createError.value = quizErrorMessage(createFailure, 'Le quiz n’a pas pu être créé.')
  } finally {
    creating.value = false
  }
}

async function toggleStatus(quiz) {
  const publishing = quiz.status !== 'published'
  busyId.value = quiz.id
  try {
    const updated = await quizService.setQuizStatus(quiz.id, publishing ? 'published' : 'draft')
    quiz.status = updated.status
    notify('success', publishing ? 'Quiz publié.' : 'Quiz repassé en brouillon.')
  } catch (statusError) {
    notify('error', quizErrorMessage(statusError, 'Le changement d’état a échoué.'))
  } finally {
    busyId.value = null
  }
}

async function duplicate(quiz) {
  busyId.value = quiz.id
  try {
    await quizService.duplicateQuiz(quiz.id)
    quizzes.value = await quizService.listManagedQuizzes()
    notify('success', 'Copie créée en brouillon.')
  } catch (duplicateError) {
    notify('error', quizErrorMessage(duplicateError, 'La duplication a échoué.'))
  } finally {
    busyId.value = null
  }
}

function confirmDelete(quiz) {
  confirm.require({
    header: 'Supprimer ce quiz ?',
    message: `« ${quiz.title} » sera supprimé avec ses questions, ses résultats et son classement. Les points déjà gagnés restent acquis. Cette action est définitive.`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      busyId.value = quiz.id
      try {
        await quizService.deleteQuiz(quiz.id)
        quizzes.value = quizzes.value.filter(entry => entry.id !== quiz.id)
        notify('success', 'Quiz supprimé.')
      } catch (deleteError) {
        notify('error', quizErrorMessage(deleteError, 'La suppression a échoué.'))
      } finally {
        busyId.value = null
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

.manage-list {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.manage-list .quiz-panel + .quiz-panel {
  margin-top: 0;
}

.manage-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.manage-card__main {
  flex: 1 1 320px;
  min-width: 0;
}

.manage-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
}

.manage-card__head h2 {
  font-size: 1.1rem;
  overflow-wrap: anywhere;
}

.quiz-create {
  display: grid;
  gap: 1rem;
  min-height: 0;
  padding: 0;
}

.quiz-error {
  color: var(--red-300, #fca5a5);
}
</style>
