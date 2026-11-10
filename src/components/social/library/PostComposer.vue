<template>
  <form class="post-composer" :aria-busy="publishing ? 'true' : 'false'" novalidate @submit.prevent="submit">
    <TextAreaComponent
      v-model="content"
      :placeholder="placeholder"
      :disabled="publishing"
      :min-height="editorMinHeight"
      :max-length="MAX_POST_LENGTH"
    />

    <ul v-if="tags.length" class="composer-tags" aria-label="Hashtags et mentions détectés">
      <li v-for="tag in tags" :key="tag" class="composer-tag" :class="tag.startsWith('#') ? 'is-hashtag' : 'is-mention'">
        {{ tag }}
      </li>
    </ul>

    <ul v-if="media.length" class="composer-media" aria-label="Médias joints">
      <li v-for="(item, index) in media" :key="item.key" class="composer-media-item">
        <img v-if="item.kind === 'image'" :src="item.preview" :alt="`Aperçu de ${item.file.name}`" />
        <video v-else-if="item.kind === 'video'" :src="item.preview" muted playsinline preload="metadata" :aria-label="`Aperçu de ${item.file.name}`"></video>
        <span v-else class="composer-media-file">
          <i class="pi pi-file" aria-hidden="true"></i>
          <span>{{ item.file.name }}</span>
        </span>
        <button
          type="button"
          class="composer-media-remove"
          :aria-label="`Retirer ${item.file.name}`"
          :disabled="publishing"
          @click="removeMedia(index)"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </li>
    </ul>

    <div v-if="messages.length" class="composer-error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      <div>
        <p v-for="message in messages" :key="message">{{ message }}</p>
      </div>
    </div>

    <div class="composer-footer">
      <input
        :id="fileInputId"
        ref="fileInput"
        class="composer-file-input"
        type="file"
        multiple
        :accept="ACCEPT_ATTRIBUTE"
        :disabled="publishing || media.length >= MAX_POST_MEDIA"
        @change="onFilesChosen"
      />
      <label
        :for="fileInputId"
        class="composer-add-media"
        :class="{ 'is-disabled': publishing || media.length >= MAX_POST_MEDIA }"
      >
        <i class="pi pi-image" aria-hidden="true"></i>
        <span>{{ media.length ? 'Ajouter un média' : 'Ajouter une photo' }}</span>
      </label>
      <span class="composer-hint">{{ media.length }}/{{ MAX_POST_MEDIA }}</span>

      <Button
        v-if="!hideSubmit"
        type="submit"
        class="composer-submit"
        :label="publishing ? 'Publication…' : 'Publier'"
        icon="pi pi-send"
        :loading="publishing"
        :disabled="!canSubmit"
      />
    </div>
  </form>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'
import Button from 'primevue/button'
import TextAreaComponent from '@/components/social/library/TextAreaComponent.vue'
import {
  ACCEPT_ATTRIBUTE,
  MAX_POST_MEDIA,
  canPublishPost,
  describePublishError,
  extractPostTags,
  previewKind,
  validateComposerFiles
} from '@/service/postComposer'

const MAX_POST_LENGTH = 1000

const props = defineProps({
  /** Fonction async ({ content, files }) => void ; lève une erreur si la publication échoue. */
  publish: { type: Function, required: true },
  placeholder: { type: String, default: 'Quoi de neuf ? Partagez une expérience, une question…' },
  editorMinHeight: { type: String, default: '180px' },
  /** Le bouton Publier est ailleurs (en-tête mobile) : il appelle submit() exposé. */
  hideSubmit: { type: Boolean, default: false }
})
const emit = defineEmits(['published', 'state'])

const fileInputId = `post-composer-file-${Math.random().toString(36).slice(2, 10)}`

const content = ref('')
const media = ref([])
const fileErrors = ref([])
const publishError = ref('')
const publishing = ref(false)
const fileInput = ref(null)

const tags = computed(() => {
  const { hashtags, mentions } = extractPostTags(content.value)
  return [...Object.keys(hashtags).map((t) => `#${t}`), ...Object.keys(mentions).map((m) => `@${m}`)]
})
const canSubmit = computed(() => !publishing.value && canPublishPost(content.value, media.value.length))
const messages = computed(() => [...fileErrors.value, publishError.value].filter(Boolean))

// Pour un bouton Publier placé hors du composer (en-tête mobile).
watchEffect(() => emit('state', { canSubmit: canSubmit.value, publishing: publishing.value }))

let mediaKey = 0
function onFilesChosen(event) {
  const { accepted, errors } = validateComposerFiles(event.target.files, media.value.length)
  fileErrors.value = errors
  publishError.value = ''
  accepted.forEach((file) => {
    const kind = previewKind(file.type)
    media.value.push({
      key: (mediaKey += 1),
      file,
      kind,
      preview: kind === 'file' ? '' : URL.createObjectURL(file)
    })
  })
  event.target.value = ''
}

function revoke(item) {
  if (item.preview) URL.revokeObjectURL(item.preview)
}

function removeMedia(index) {
  const [item] = media.value.splice(index, 1)
  if (item) revoke(item)
  fileErrors.value = []
}

function reset() {
  media.value.forEach(revoke)
  media.value = []
  content.value = ''
  fileErrors.value = []
  publishError.value = ''
}

async function submit() {
  if (!canSubmit.value) {
    if (!publishing.value) publishError.value = 'Ajoutez un texte ou une photo avant de publier.'
    return false
  }
  publishing.value = true
  publishError.value = ''
  try {
    await props.publish({ content: content.value, files: media.value.map((item) => item.file) })
    reset()
    emit('published')
    return true
  } catch (error) {
    console.error('[Feed] Publication refusée:', error)
    publishError.value = describePublishError(error)
    return false
  } finally {
    publishing.value = false
  }
}

onBeforeUnmount(() => media.value.forEach(revoke))

defineExpose({ submit, reset, canSubmit, publishing })
</script>

<style scoped>
.post-composer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.composer-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.composer-tag {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--surface-ground);
  color: var(--text-color);
  border: 1px solid var(--surface-border);
}

.composer-tag.is-hashtag {
  border-color: var(--primary-color);
}

.composer-media {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  gap: 0.5rem;
}

.composer-media-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
}

.composer-media-item img,
.composer-media-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.composer-media-file {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  overflow-wrap: anywhere;
}

.composer-media-file .pi {
  font-size: 1.5rem;
}

.composer-media-remove {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  cursor: pointer;
}

.composer-media-remove:disabled {
  opacity: 0.5;
  cursor: default;
}

.composer-error {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--red-300, #f19ea6);
  background: color-mix(in srgb, var(--red-500, #e24c4c) 10%, transparent);
  color: var(--text-color);
  font-size: 0.9rem;
}

.composer-error .pi {
  color: var(--red-500, #e24c4c);
  margin-top: 0.15rem;
}

.composer-error p {
  margin: 0;
}

.composer-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.composer-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.composer-add-media {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 1rem;
  border-radius: 999px;
  border: 1px solid var(--surface-border);
  background: var(--surface-ground);
  color: var(--text-color);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.composer-add-media .pi {
  color: var(--primary-color);
}

.composer-add-media:hover {
  background: var(--surface-hover);
}

.composer-add-media.is-disabled {
  opacity: 0.5;
  cursor: default;
}

.composer-file-input:focus-visible + .composer-add-media {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

.composer-hint {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.composer-submit {
  margin-left: auto;
  min-height: 2.75rem;
  border-radius: 999px;
}

@media (max-width: 480px) {
  .composer-submit {
    flex: 1 1 100%;
  }
}
</style>
