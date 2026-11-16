<template>
  <BottomSheet :title="title" tall @close="emit('close')">
    <p v-if="state.loading && !state.comments.length" class="m-comments__state" role="status">
      <span class="m-spinner" aria-hidden="true"></span>
      Chargement des commentaires…
    </p>
    <div v-else-if="state.loadError" class="m-comments__state" role="alert">
      <p>Commentaires indisponibles pour le moment.</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>
    <p v-else-if="!threads.length" class="m-comments__state">
      Aucun commentaire pour l’instant. Lance la discussion.
    </p>

    <ul v-if="threads.length" class="m-comments__list">
      <li v-for="thread in threads" :key="thread.id" class="m-comments__thread">
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
        <ul v-if="thread.replies.length" class="m-comments__list m-comments__list--replies">
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

    <template #footer>
      <form class="m-comments__composer" @submit.prevent="submit">
        <div v-if="replyTo" class="m-comments__replying">
          <span>Réponse à <strong>{{ replyTo.mention || 'ce commentaire' }}</strong></span>
          <button type="button" class="m-icon-button m-icon-button--small" aria-label="Annuler la réponse" @click="replyTo = null">
            <MIcon name="x" />
          </button>
        </div>
        <div class="m-field">
          <label :for="inputId" class="m-sr-only">{{ replyTo ? 'Écrire une réponse' : 'Ajouter un commentaire' }}</label>
          <textarea
            :id="inputId"
            ref="inputRef"
            v-model="draft"
            rows="1"
            :maxlength="MAX_COMMENT_LENGTH"
            :placeholder="canComment ? (replyTo ? 'Écrire une réponse' : 'Ajouter un commentaire') : 'Connecte-toi pour commenter'"
            :disabled="!canComment"
            enterkeyhint="send"
            autocomplete="off"
            @input="autoGrow"
            @keydown.enter="onEnter"
          ></textarea>
          <button type="submit" class="m-icon-button m-comments__send" aria-label="Publier le commentaire" :disabled="!canSend">
            <MIcon name="send" />
          </button>
        </div>
        <p v-if="nearLimit" class="m-comments__limit" aria-live="polite">{{ draft.length }} / {{ MAX_COMMENT_LENGTH }}</p>
      </form>
    </template>
  </BottomSheet>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import BottomSheet from '@/mobile/ui/BottomSheet.vue'
import MIcon from '@/mobile/ui/MIcon.vue'
import CommentRow from '@/components/social/library/PostCommentRow.vue'
import { usePostComments } from '@/composables/usePostComments'
import { MAX_COMMENT_LENGTH, normalizeCommentText, resolveReplyTarget } from '@/service/postComments'

const props = defineProps({ post: { type: Object, required: true } })
const emit = defineEmits(['close'])

const { state, threads, userId, canComment, expand, load, add, remove } = usePostComments(() => props.post)

const inputId = `m-comment-input-${String(props.post.id)}`
const draft = ref('')
const sending = ref(false)
const replyTo = ref(null)
const confirmingId = ref(null)
const inputRef = ref(null)

const title = computed(() => {
  const count = state.count
  if (!count) return 'Commentaires'
  return `${count} commentaire${count > 1 ? 's' : ''}`
})
const canSend = computed(() => canComment.value && !sending.value && normalizeCommentText(draft.value).length > 0)
const nearLimit = computed(() => draft.value.length > MAX_COMMENT_LENGTH - 100)

const now = ref(Date.now())
let timer = null
onMounted(() => {
  void expand()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 60 * 1000)
})
onBeforeUnmount(() => clearInterval(timer))

function autoGrow() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

function startReply(comment) {
  replyTo.value = resolveReplyTarget(comment)
  nextTick(() => inputRef.value?.focus())
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
</script>

<style scoped>
.m-comments__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 28px 12px;
  color: var(--m-muted);
  font-size: 0.875rem;
  text-align: center;
}
.m-comments__state p {
  margin: 0;
}
.m-comments__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 4px 0 0;
  list-style: none;
}
.m-comments__list--replies {
  gap: 12px;
  margin-top: 12px;
  padding-left: 2.6rem;
}
/* Actions des commentaires (Répondre, Supprimer) : cible tactile agrandie. */
.m-comments__list :deep(.comment-action) {
  min-height: 32px;
  padding-block: 6px;
}
.m-comments__composer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.m-comments__replying {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--m-muted);
}
.m-icon-button--small {
  width: 36px;
  height: 36px;
}
.m-field {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  min-height: 48px;
  padding: 2px 2px 2px 14px;
  border-radius: 14px;
  background: var(--m-raised);
}
.m-field textarea {
  flex: 1;
  min-width: 0;
  max-height: 120px;
  margin: 0;
  padding: 11px 0;
  border: 0;
  outline: none;
  background: none;
  color: var(--m-fg);
  font: inherit;
  font-size: 16px;
  line-height: 1.4;
  resize: none;
}
.m-field textarea::placeholder {
  color: var(--m-muted);
}
.m-field:focus-within {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 1px;
}
.m-comments__send {
  color: var(--m-accent-text);
}
.m-comments__limit {
  margin: 0;
  font-size: 0.75rem;
  color: var(--m-muted);
  text-align: right;
}
</style>
