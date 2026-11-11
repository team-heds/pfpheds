<template>
  <MobileStackScreen title="Créer" modal :locked="publishing" class="m-create" @back="emit('close')">
    <template #actions>
      <button
        v-if="tab === 'post'"
        type="button"
        class="m-create__publish"
        :disabled="!canSubmit"
        :aria-busy="publishing ? 'true' : 'false'"
        @click="submit"
      >
        <span v-if="publishing" class="m-spinner" aria-hidden="true"></span>
        <template v-else>Publier</template>
      </button>
    </template>

    <template #subheader>
      <div class="m-create__switch" role="tablist" aria-label="Type de contenu">
        <button
          v-for="option in TABS"
          :id="`m-create-tab-${option.key}`"
          :key="option.key"
          type="button"
          role="tab"
          :aria-selected="tab === option.key ? 'true' : 'false'"
          :aria-controls="`m-create-panel-${option.key}`"
          :disabled="publishing"
          @click="tab = option.key"
        >{{ option.label }}</button>
      </div>
    </template>

    <!-- Publication : un grand champ de texte, comme dans une messagerie. -->
    <div v-show="tab === 'post'" id="m-create-panel-post" class="m-create__post" role="tabpanel" aria-labelledby="m-create-tab-post">
      <div class="m-create__author">
        <img v-if="stories.ownAvatarUrl" :src="stories.ownAvatarUrl" alt="" class="m-create__avatar" />
        <span v-else class="m-create__avatar m-create__avatar--initials" aria-hidden="true">{{ initialsOf(authorName) }}</span>
        <span class="m-create__name">{{ authorName }}</span>
      </div>

      <label for="m-create-text" class="m-sr-only">Texte de la publication</label>
      <textarea
        id="m-create-text"
        ref="textRef"
        v-model="text"
        class="m-create__text"
        :maxlength="MAX_POST_LENGTH"
        placeholder="Quoi de neuf ? Partage une expérience, une question…"
        :disabled="publishing"
        autocapitalize="sentences"
        @input="autoGrow"
      ></textarea>

      <ul v-if="tags.length" class="m-create__tags" aria-label="Hashtags et mentions détectés">
        <li v-for="tag in tags" :key="tag">{{ tag }}</li>
      </ul>

      <ul v-if="media.length" class="m-create__media" aria-label="Médias joints">
        <li v-for="(item, index) in media" :key="item.key" class="m-create__tile">
          <img v-if="item.kind === 'image'" :src="item.preview" :alt="`Aperçu de ${item.file.name}`" />
          <video v-else-if="item.kind === 'video'" :src="item.preview" muted playsinline preload="metadata" :aria-label="`Aperçu de ${item.file.name}`"></video>
          <span v-else class="m-create__file">
            <MIcon name="file" />
            <span>{{ item.file.name }}</span>
          </span>
          <button type="button" class="m-create__remove" :aria-label="`Retirer ${item.file.name}`" :disabled="publishing" @click="removeMedia(index)">
            <MIcon name="x" />
          </button>
        </li>
      </ul>

      <div v-if="messages.length" class="m-create__error" role="alert">
        <MIcon name="alert" />
        <div><p v-for="message in messages" :key="message">{{ message }}</p></div>
      </div>
    </div>

    <!-- Story : parcours existant (choix du média, recadrage, texte, publication). -->
    <div v-if="tab === 'story'" id="m-create-panel-story" class="m-create__story" role="tabpanel" aria-labelledby="m-create-tab-story">
      <AddStoryCore @uploaded="onStoryUploaded" />
    </div>

    <template #footer>
      <div v-if="tab === 'post'" class="m-create__toolbar">
        <input
          id="m-create-photo"
          class="m-sr-only"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
          :disabled="mediaFull || publishing"
          @change="onFilesChosen"
        />
        <label for="m-create-photo" class="m-create__tool" :class="{ 'is-disabled': mediaFull || publishing }">
          <MIcon name="image" />
          <span>Photo ou vidéo</span>
        </label>
        <input
          id="m-create-file"
          class="m-sr-only"
          type="file"
          multiple
          :accept="ACCEPT_ATTRIBUTE"
          :disabled="mediaFull || publishing"
          @change="onFilesChosen"
        />
        <label for="m-create-file" class="m-create__tool" :class="{ 'is-disabled': mediaFull || publishing }">
          <MIcon name="file" />
          <span>Fichier</span>
        </label>
        <span class="m-create__count" :class="{ 'is-near': text.length > MAX_POST_LENGTH - 100 }" aria-live="polite">
          {{ text.length }}/{{ MAX_POST_LENGTH }}
        </span>
      </div>
    </template>
  </MobileStackScreen>
</template>

<script>
import { ref } from 'vue'

// Le texte en cours survit à une fermeture accidentelle de l'écran.
const draft = ref('')
</script>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import MobileStackScreen from '@/mobile/ui/MobileStackScreen.vue'
import MIcon from '@/mobile/ui/MIcon.vue'
import AddStoryCore from '@/components/social/library/AddStoryCore.vue'
import { useAuthStore } from '@/stores/authStore'
import { useSocialFeedStore } from '@/stores/socialFeedStore'
import { publishPost, resolveAuthorName } from '@/service/postPublishService'
import {
  ACCEPT_ATTRIBUTE,
  MAX_POST_MEDIA,
  canPublishPost,
  describePublishError,
  extractPostTags,
  previewKind,
  validateComposerFiles,
} from '@/service/postComposer'
import { useMobileStoriesStore } from '@/mobile/home/mobileStoriesStore'
import { filterScope, FOR_YOU_FILTER } from '@/mobile/home/feedFilters'
import { initialsOf, plainTextToPostHtml } from '@/mobile/home/postMedia'

const MAX_POST_LENGTH = 1000
const TABS = [
  { key: 'post', label: 'Publication' },
  { key: 'story', label: 'Story' },
]

const props = defineProps({
  /** Onglet ouvert à l'arrivée : 'post' ou 'story'. */
  mode: { type: String, default: 'post' },
})
const emit = defineEmits(['close'])

const authStore = useAuthStore()
const feedStore = useSocialFeedStore()
const stories = useMobileStoriesStore()
const toast = useToast()
const rootScope = filterScope(FOR_YOU_FILTER)

const tab = ref(props.mode === 'story' ? 'story' : 'post')
const text = draft
const media = ref([])
const fileErrors = ref([])
const publishError = ref('')
const publishing = ref(false)
const textRef = ref(null)

const authorName = computed(() => resolveAuthorName(authStore.user) || 'Moi')
const tags = computed(() => {
  const { hashtags, mentions } = extractPostTags(text.value)
  return [...Object.keys(hashtags).map((tag) => `#${tag}`), ...Object.keys(mentions).map((mention) => `@${mention}`)]
})
const mediaFull = computed(() => media.value.length >= MAX_POST_MEDIA)
const canSubmit = computed(() => !publishing.value && canPublishPost(text.value, media.value.length))
const messages = computed(() => [...fileErrors.value, publishError.value].filter(Boolean))

function autoGrow() {
  const el = textRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

let mediaKey = 0
function onFilesChosen(event) {
  const { accepted, errors } = validateComposerFiles(event.target.files, media.value.length)
  fileErrors.value = errors
  publishError.value = ''
  accepted.forEach((file) => {
    const kind = previewKind(file.type)
    media.value.push({ key: (mediaKey += 1), file, kind, preview: kind === 'file' ? '' : URL.createObjectURL(file) })
  })
  event.target.value = ''
}

const revoke = (item) => {
  if (item.preview) URL.revokeObjectURL(item.preview)
}

function removeMedia(index) {
  const [item] = media.value.splice(index, 1)
  if (item) revoke(item)
  fileErrors.value = []
}

// La gamification (action POST) est appelée par publishPost, comme sur ordinateur.
async function submit() {
  if (!canSubmit.value) return
  const user = authStore.user
  if (!user?.id || user.id === 'guest-user') {
    publishError.value = 'Ta session a expiré. Reconnecte-toi puis réessaie.'
    return
  }
  const content = plainTextToPostHtml(text.value)
  publishing.value = true
  publishError.value = ''
  feedStore.setPublishing(rootScope, true)
  try {
    const published = await publishPost({ user, content, files: media.value.map((item) => item.file) })
    // La publication apparaît tout de suite en tête du fil, sans attendre le serveur.
    feedStore.upsertPost(rootScope, {
      id: published.id,
      Author: published.authorName,
      IdUser: user.id,
      avatar_url: feedStore.avatarCache[user.id] || stories.ownAvatarUrl || null,
      Content: content,
      Timestamp: Date.parse(published.createdAt) || Date.now(),
      Hashtags: published.hashtags,
      MentionGroups: published.mentions,
      community_id: published.communityId,
      media: published.media.map((item) => item.url),
      likes_count: 0,
      liked_by_me: false,
      comments_count: 0,
    })
    media.value.forEach(revoke)
    media.value = []
    text.value = ''
    toast.add({ severity: 'success', summary: 'Publication partagée', life: 2500 })
    emit('close')
  } catch (error) {
    console.error('[Feed] Publication refusée:', error)
    publishError.value = describePublishError(error)
  } finally {
    publishing.value = false
    feedStore.setPublishing(rootScope, false)
  }
}

function onStoryUploaded() {
  void stories.load(authStore.user?.id)
  toast.add({ severity: 'success', summary: 'Story publiée', life: 2500 })
  emit('close')
}

const focusText = () => nextTick(() => {
  autoGrow()
  if (tab.value === 'post') textRef.value?.focus({ preventScroll: true })
})
watch(tab, focusText)
onMounted(() => {
  // Après le glissement d'ouverture : le clavier ne bouscule pas l'animation.
  setTimeout(focusText, 320)
})
onBeforeUnmount(() => media.value.forEach(revoke))
</script>

<style scoped>
.m-create {
  /* Le clavier du téléphone recouvre le bas de l'écran : la barre d'outils reste au-dessus. */
  padding-bottom: var(--m-keyboard, 0px);
}
.m-create :deep(.m-screen__body) {
  display: flex;
  flex-direction: column;
  padding-top: 8px;
}
.m-create__publish {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 84px;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 99px;
  background: var(--m-accent);
  color: var(--m-on-accent);
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
}
.m-create__publish:disabled {
  opacity: 0.45;
}
.m-create__publish:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-create__switch {
  display: flex;
  flex-shrink: 0;
  margin: 2px 16px 6px;
  padding: 4px;
  border-radius: 14px;
  background: var(--m-surface);
}
.m-create__switch button {
  flex: 1;
  min-height: 40px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--m-muted);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  touch-action: manipulation;
}
.m-create__switch button[aria-selected='true'] {
  background: var(--m-raised);
  color: var(--m-fg);
  font-weight: 600;
}
.m-create__switch button:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: -2px;
}
.m-create__post {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}
.m-create__author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.m-create__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--m-raised);
}
.m-create__avatar--initials {
  display: grid;
  place-items: center;
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-create__name {
  font-size: 0.9375rem;
  font-weight: 600;
}
.m-create__text {
  flex: 1 0 auto;
  width: 100%;
  min-height: 9rem;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: none;
  color: var(--m-fg);
  font: inherit;
  font-size: 1.125rem;
  line-height: 1.5;
  resize: none;
}
.m-create__text::placeholder {
  color: var(--m-muted);
}
.m-create__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-create__tags li {
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--m-surface);
  color: var(--m-accent-text);
  font-size: 0.8125rem;
}
.m-create__media {
  display: flex;
  gap: 8px;
  margin: 0 -16px;
  padding: 0 16px 4px;
  overflow-x: auto;
  list-style: none;
  scrollbar-width: none;
}
.m-create__media::-webkit-scrollbar {
  display: none;
}
.m-create__tile {
  position: relative;
  flex: 0 0 auto;
  width: 112px;
  height: 140px;
  overflow: hidden;
  border-radius: 14px;
  background: var(--m-surface);
}
.m-create__tile img,
.m-create__tile video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.m-create__file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  padding: 8px;
  color: var(--m-accent-text);
  font-size: 0.75rem;
  text-align: center;
  overflow-wrap: anywhere;
}
.m-create__file span {
  color: var(--m-fg);
}
.m-create__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(2, 8, 18, 0.7);
  color: #fff;
  cursor: pointer;
}
.m-create__remove :deep(.m-icon) {
  width: 16px;
  height: 16px;
}
/* Cible tactile de 44 px autour de la croix. */
.m-create__remove::after {
  content: '';
  position: absolute;
  inset: -6px;
}
.m-create__error {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--m-danger);
  border-radius: 12px;
  color: var(--m-fg);
  font-size: 0.875rem;
}
.m-create__error :deep(.m-icon) {
  color: var(--m-danger);
}
.m-create__error p {
  margin: 0;
}
.m-create__story {
  padding-bottom: 8px;
}
.m-create__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--m-line);
  background: var(--m-bg);
}
.m-create__tool {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 99px;
  background: var(--m-surface);
  color: var(--m-fg);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  touch-action: manipulation;
}
.m-create__tool :deep(.m-icon) {
  color: var(--m-accent-text);
}
.m-create__tool.is-disabled {
  opacity: 0.45;
  pointer-events: none;
}
input:focus-visible + .m-create__tool {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-create__count {
  margin-left: auto;
  color: var(--m-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.m-create__count.is-near {
  color: var(--m-danger);
}
</style>
