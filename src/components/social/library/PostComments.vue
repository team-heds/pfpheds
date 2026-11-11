<template>
  <section class="post-comments" :aria-labelledby="headingId">
    <h3 :id="headingId" class="sr-only">Commentaires</h3>

    <button
      v-if="state.count > 0 && !state.expanded"
      type="button"
      class="comments-toggle"
      :aria-controls="listId"
      aria-expanded="false"
      @click="expand"
    >
      {{ viewLabel }}
    </button>

    <div v-if="state.expanded" :id="listId" class="comments-panel">
      <p v-if="state.loading && !state.comments.length" class="comments-state" role="status">
        Chargement des commentaires…
      </p>
      <p v-else-if="state.loadError" class="comments-state" role="alert">
        Commentaires indisponibles pour le moment.
        <button type="button" class="comment-link" @click="load">Réessayer</button>
      </p>

      <ul v-if="threads.length" class="comment-list">
        <li v-for="thread in threads" :key="thread.id" class="comment-thread">
          <CommentRow
            :comment="thread"
            :now="now"
            :own="thread.user_id === userId"
            :confirming="confirmingId === thread.id"
            @reply="startReply(thread)"
            @ask-delete="confirmingId = thread.id"
            @cancel-delete="confirmingId = null"
            @delete="onDelete(thread)"
          />
          <ul v-if="thread.replies.length" class="comment-list comment-list--replies">
            <li v-for="reply in thread.replies" :key="reply.id">
              <CommentRow
                :comment="reply"
                :now="now"
                small
                :own="reply.user_id === userId"
                :confirming="confirmingId === reply.id"
                @reply="startReply(reply)"
                @ask-delete="confirmingId = reply.id"
                @cancel-delete="confirmingId = null"
                @delete="onDelete(reply)"
              />
            </li>
          </ul>
        </li>
      </ul>

      <button
        v-if="state.count > 0"
        type="button"
        class="comments-toggle"
        :aria-controls="listId"
        aria-expanded="true"
        @click="collapse"
      >
        Masquer les commentaires
      </button>
    </div>

    <form class="comment-composer" :class="{ 'is-focused': focused }" @submit.prevent="submit">
      <div v-if="replyTo" class="replying-to">
        <span>Réponse à <strong>{{ replyTo.mention || 'ce commentaire' }}</strong></span>
        <button type="button" class="comment-link" aria-label="Annuler la réponse" @click="cancelReply">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <div class="composer-row">
        <label :for="inputId" class="sr-only">{{ replyTo ? 'Écrire une réponse' : 'Ajouter un commentaire' }}</label>
        <textarea
          :id="inputId"
          ref="inputRef"
          v-model="draft"
          class="composer-input"
          rows="1"
          :maxlength="MAX_COMMENT_LENGTH"
          :placeholder="canComment ? (replyTo ? 'Écrire une réponse…' : 'Ajouter un commentaire…') : 'Connectez-vous pour commenter'"
          :disabled="!canComment"
          enterkeyhint="send"
          autocomplete="off"
          @input="autoGrow"
          @focus="focused = true"
          @blur="focused = false"
          @keydown.enter="onEnter"
          @keydown.esc="cancelReply"
        ></textarea>
        <button type="submit" class="composer-send" :disabled="!canSend">Publier</button>
      </div>
      <p v-if="nearLimit" class="composer-limit" aria-live="polite">
        {{ draft.length }} / {{ MAX_COMMENT_LENGTH }}
      </p>
    </form>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { usePostComments } from '@/composables/usePostComments'
import {
  MAX_COMMENT_LENGTH,
  formatViewCommentsLabel,
  normalizeCommentText,
  resolveReplyTarget
} from '@/service/postComments'
import CommentRow from '@/components/social/library/PostCommentRow.vue'

const props = defineProps({ post: { type: Object, required: true } })

const { state, threads, userId, canComment, expand, collapse, load, add, remove } = usePostComments(() => props.post)

const uid = `post-${String(props.post.id)}`
const headingId = `${uid}-comments-title`
const listId = `${uid}-comments-list`
const inputId = `${uid}-comment-input`

const draft = ref('')
const sending = ref(false)
const focused = ref(false)
const replyTo = ref(null)
const confirmingId = ref(null)
const inputRef = ref(null)

const viewLabel = computed(() => formatViewCommentsLabel(state.count))
const canSend = computed(() => canComment.value && !sending.value && normalizeCommentText(draft.value).length > 0)
const nearLimit = computed(() => draft.value.length > MAX_COMMENT_LENGTH - 100)

// Les dates relatives restent justes sans recharger.
const now = ref(Date.now())
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 60 * 1000)
})
onBeforeUnmount(() => clearInterval(timer))

function autoGrow() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

function focus() {
  inputRef.value?.focus()
}

// Le bandeau « Réponse à … » suffit : pas de pseudo à insérer dans le texte.
function startReply(comment) {
  replyTo.value = resolveReplyTarget(comment)
  nextTick(focus)
}

function cancelReply() {
  replyTo.value = null
}

// Entrée envoie, Maj+Entrée va à la ligne ; on ne coupe pas une saisie en cours (accents, IME).
function onEnter(event) {
  if (event.shiftKey || event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  submit()
}

async function submit() {
  if (!canSend.value) return
  const text = draft.value
  const parentId = replyTo.value?.parentId || null
  sending.value = true
  draft.value = ''
  replyTo.value = null
  nextTick(autoGrow)
  const ok = await add(text, parentId)
  sending.value = false
  if (!ok && !draft.value) {
    // Refus : on rend le texte à l'utilisateur.
    draft.value = text
    nextTick(autoGrow)
  }
}

async function onDelete(comment) {
  confirmingId.value = null
  await remove(comment)
}

defineExpose({ focus, expand })
</script>

<style scoped>
.post-comments {
  /* Ancre les libellés .sr-only : sans cela ils se placent par rapport à la page
     entière et l'allongent d'une zone vide sous le fil. */
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
  /* La carte mobile centre son texte : les commentaires se lisent alignés à gauche. */
  text-align: left;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.comments-toggle {
  align-self: flex-start;
  border: 0;
  background: transparent;
  padding: 0.25rem 0;
  min-height: 1.75rem;
  font: inherit;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  cursor: pointer;
}

.comments-toggle:hover {
  color: var(--text-color);
}

.comments-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comments-state {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.comment-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comment-list--replies {
  margin-top: 0.6rem;
  padding-left: 2.75rem;
  gap: 0.6rem;
}

.comment-link {
  border: 0;
  background: transparent;
  padding: 0.25rem;
  font: inherit;
  font-weight: 600;
  color: var(--text-color-secondary);
  cursor: pointer;
}

.comment-composer {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-top: 1px solid var(--surface-border);
  padding-top: 0.5rem;
}

.replying-to {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.composer-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.composer-input {
  flex: 1;
  min-width: 0;
  min-height: 2.5rem;
  max-height: 10rem;
  resize: none;
  border: 0;
  background: transparent;
  padding: 0.6rem 0;
  /* 16 px : pas de zoom automatique sur iOS. */
  font: inherit;
  font-size: 1rem;
  line-height: 1.35;
  color: var(--text-color);
}

.composer-input::placeholder {
  color: var(--text-color-secondary);
}

.composer-input:focus {
  outline: none;
}

.comment-composer.is-focused {
  border-top-color: var(--primary-color);
}

.composer-send {
  border: 0;
  background: transparent;
  min-height: 2.5rem;
  padding: 0 0.25rem;
  font: inherit;
  font-weight: 700;
  /* Couleur du texte : le jaune primaire manque de contraste sur fond clair. */
  color: var(--text-color);
  cursor: pointer;
}

.composer-send:disabled {
  opacity: 0.4;
  cursor: default;
}

.composer-limit {
  margin: 0;
  align-self: flex-end;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.comments-toggle:focus-visible,
.comment-link:focus-visible,
.composer-send:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
  border-radius: 0.25rem;
}
</style>
