<template>
  <article class="comment" :class="{ 'comment--small': small, 'is-pending': comment.pending }">
    <router-link
      v-if="comment.user_id"
      :to="{ name: 'Profile', params: { id: comment.user_id } }"
      class="comment-avatar-link"
      tabindex="-1"
      aria-hidden="true"
    >
      <img v-if="comment.avatar_url" :src="comment.avatar_url" alt="" class="comment-avatar" />
      <span v-else class="comment-avatar comment-avatar--initial">{{ initial }}</span>
    </router-link>

    <div class="comment-body">
      <p class="comment-text">
        <router-link :to="{ name: 'Profile', params: { id: comment.user_id } }" class="comment-author">
          {{ comment.display_name || 'Utilisateur' }}
        </router-link>
        {{ ' ' }}<span class="comment-content">{{ comment.content }}</span>
      </p>

      <div class="comment-meta">
        <span v-if="comment.pending" class="comment-time" role="status">Envoi…</span>
        <time v-else class="comment-time" :datetime="comment.created_at" :title="fullDate">{{ relative }}</time>

        <template v-if="!comment.pending">
          <button type="button" class="comment-action" @click="emit('reply')">
            Répondre<span class="sr-only"> à {{ comment.display_name || 'ce commentaire' }}</span>
          </button>
          <template v-if="own">
            <button v-if="!confirming" type="button" class="comment-action" @click="emit('ask-delete')">
              Supprimer<span class="sr-only"> mon commentaire</span>
            </button>
            <span v-else class="comment-confirm" role="group" aria-label="Confirmer la suppression">
              <span>Supprimer ?</span>
              <button type="button" class="comment-action comment-action--danger" @click="emit('delete')">Oui</button>
              <button type="button" class="comment-action" @click="emit('cancel-delete')">Annuler</button>
            </span>
          </template>
        </template>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { formatFullDate, formatRelativeTime } from '@/service/postComments'

const props = defineProps({
  comment: { type: Object, required: true },
  now: { type: Number, required: true },
  own: { type: Boolean, default: false },
  small: { type: Boolean, default: false },
  confirming: { type: Boolean, default: false }
})
const emit = defineEmits(['reply', 'ask-delete', 'cancel-delete', 'delete'])

const initial = computed(() => (props.comment.display_name || '?').charAt(0).toUpperCase())
const relative = computed(() => formatRelativeTime(props.comment.created_at, props.now))
const fullDate = computed(() => formatFullDate(props.comment.created_at))
</script>

<style scoped>
.comment {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.comment.is-pending {
  opacity: 0.6;
}

.comment-avatar-link {
  flex-shrink: 0;
  line-height: 0;
}

.comment-avatar {
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 50%;
  object-fit: cover;
}

.comment--small .comment-avatar {
  width: 1.6rem;
  height: 1.6rem;
}

.comment-avatar--initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  color: var(--text-color);
  font-weight: 600;
  font-size: 0.85rem;
  line-height: 1;
}

.comment-body {
  min-width: 0;
  flex: 1;
}

.comment-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--text-color);
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.comment-author {
  font-weight: 700;
  color: var(--text-color);
  text-decoration: none;
}

.comment-author:hover,
.comment-author:focus-visible {
  text-decoration: underline;
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.15rem 0.75rem;
  margin-top: 0.15rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.comment-action {
  border: 0;
  background: transparent;
  min-height: 1.75rem;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: var(--text-color-secondary);
  cursor: pointer;
}

.comment-action:hover {
  color: var(--text-color);
}

.comment-action--danger,
.comment-action--danger:hover {
  color: var(--red-500, #e24c4c);
}

.comment-confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.comment-action:focus-visible,
.comment-author:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
  border-radius: 0.25rem;
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
</style>
