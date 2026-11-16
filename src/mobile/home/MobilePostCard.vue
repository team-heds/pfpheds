<template>
  <article class="m-post" :aria-label="`Publication de ${authorName}`">
    <header class="m-post__head">
      <component
        :is="post.IdUser ? 'button' : 'div'"
        :type="post.IdUser ? 'button' : undefined"
        class="m-post__author"
        @click="openAuthor"
      >
        <img v-if="avatarUrl && !avatarFailed" :src="avatarUrl" alt="" class="m-avatar" loading="lazy" @error="avatarFailed = true" />
        <span v-else class="m-avatar m-avatar--initials" aria-hidden="true">{{ initials }}</span>
        <span class="m-post__identity">
          <span class="m-post__name">{{ authorName }}</span>
          <time
            v-if="post.Timestamp"
            class="m-post__time"
            :datetime="new Date(post.Timestamp).toISOString()"
            :title="formatFullDate(post.Timestamp)"
          >{{ formatRelativeTime(post.Timestamp, now) }}</time>
        </span>
      </component>
    </header>

    <div class="m-post__content" @pointerup="onContentPointerUp" @dblclick="onContentDoubleClick">
      <span v-if="burstKey" :key="burstKey" class="m-post__burst" :style="burstStyle" aria-hidden="true">
        <MIcon name="heart" />
      </span>

      <div v-if="post.Content" class="m-post__text-wrap">
        <!-- eslint-disable-next-line vue/no-v-html -- contenu nettoyé par sanitizeHtml -->
        <div ref="textRef" class="m-post__text" :class="{ 'is-clamped': !expanded }" v-html="safeContent"></div>
        <button v-if="clamped" type="button" class="m-post__more" :aria-expanded="expanded ? 'true' : 'false'" @click="expanded = !expanded">
          {{ expanded ? 'Voir moins' : 'Voir plus' }}
        </button>
      </div>

      <div v-for="embed in embeds" :key="embed.src" class="m-post__embed" :class="`m-post__embed--${embed.kind}`">
        <iframe
          :src="embed.src"
          :title="embedTitle(embed.kind)"
          loading="lazy"
          allow="encrypted-media; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>

      <div v-if="visuals.length" class="m-post__media" :class="{ 'm-post__media--many': visuals.length > 1 }">
        <div ref="trackRef" class="m-post__track" @scroll.passive="onTrackScroll">
          <div v-for="(item, index) in visuals" :key="item.url" class="m-post__slide">
            <img
              v-if="item.kind === 'image'"
              :src="item.url"
              :alt="visuals.length > 1 ? `Photo ${index + 1} sur ${visuals.length}` : 'Photo de la publication'"
              loading="lazy"
              decoding="async"
            />
            <video v-else :src="item.url" controls muted playsinline preload="metadata"></video>
          </div>
        </div>
        <span v-if="visuals.length > 1" class="m-post__counter" aria-hidden="true">{{ slideIndex + 1 }}/{{ visuals.length }}</span>
      </div>

      <ul v-if="files.length" class="m-post__files">
        <li v-for="file in files" :key="file.url">
          <a :href="file.url" target="_blank" rel="noopener noreferrer" class="m-post__file">
            <span class="m-post__file-icon" aria-hidden="true"><MIcon name="file" /></span>
            <span class="m-post__file-name">{{ file.name }}</span>
            <MIcon name="next" />
          </a>
        </li>
      </ul>
    </div>

    <footer class="m-post__bar">
      <button
        type="button"
        class="m-post__action"
        :class="{ 'is-liked': likeState.liked }"
        :aria-pressed="likeState.liked ? 'true' : 'false'"
        aria-label="J’aime"
        @click="onLikeClick"
      >
        <MIcon :key="likeIconKey" name="heart" :class="{ 'm-like-pop': likeIconKey > 0 && likeState.liked }" />
      </button>
      <button
        v-if="likeState.count > 0"
        type="button"
        class="m-post__count"
        :aria-label="`${likeCountLabel} : voir la liste`"
        @click="shell.open('aime', { postId: String(post.id) })"
      >
        {{ likeState.count }}
      </button>
      <button type="button" class="m-post__action" :aria-label="commentsLabel" @click="openComments">
        <MIcon name="chat" />
        <span v-if="commentCount > 0" aria-hidden="true">{{ commentCount }}</span>
      </button>
      <button type="button" class="m-post__action m-post__action--end" aria-label="Partager cette publication" @click="share">
        <MIcon name="share" />
      </button>
    </footer>
  </article>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import MIcon from '@/mobile/ui/MIcon.vue'
import { sanitizeHtml } from '@/composables/useSanitize'
import { usePostLike } from '@/composables/usePostLike'
import { createDoubleTapDetector, isInteractiveTarget } from '@/service/postLikes'
import { formatFullDate, formatRelativeTime } from '@/service/postComments'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import { extractEmbeds, initialsOf, plainTextExcerpt, splitPostMedia } from '@/mobile/home/postMedia'

const props = defineProps({
  post: { type: Object, required: true },
  /** Horloge partagée du fil : les dates relatives restent justes sans recharger. */
  now: { type: Number, default: () => Date.now() },
})

const router = useRouter()
const shell = useMobileShell()
let toast = null
try {
  toast = useToast()
} catch {
  toast = null
}

const authorName = computed(() => props.post.Author || props.post.author_name || 'Utilisateur inconnu')
const avatarUrl = computed(() => props.post.avatar_url || props.post.PhotoURL || null)
const avatarFailed = ref(false)
const initials = computed(() => initialsOf(authorName.value))
const safeContent = computed(() => sanitizeHtml(props.post.Content || ''))
const embeds = computed(() => extractEmbeds(props.post.Content))
const media = computed(() => splitPostMedia(props.post.media))
const visuals = computed(() => media.value.visuals)
const files = computed(() => media.value.files)
const commentCount = computed(() => Number(props.post.comments_count) || 0)
const commentsLabel = computed(() => {
  if (!commentCount.value) return 'Commenter'
  return `${commentCount.value} commentaire${commentCount.value > 1 ? 's' : ''} : ouvrir`
})

const embedTitle = (kind) => ({ youtube: 'Vidéo YouTube', spotify: 'Lecteur Spotify', instagram: 'Publication Instagram' }[kind] || 'Contenu intégré')

function openAuthor() {
  if (props.post.IdUser) router.push({ name: 'Profile', params: { id: props.post.IdUser } })
}

// Texte long : replié, avec « Voir plus ».
const textRef = ref(null)
const clamped = ref(false)
const expanded = ref(false)
const measureText = async () => {
  await nextTick()
  const el = textRef.value
  if (!el || expanded.value) return
  clamped.value = el.scrollHeight > el.clientHeight + 2
}
onMounted(measureText)
watch(() => props.post.Content, () => {
  expanded.value = false
  void measureText()
})

// Carrousel de médias.
const trackRef = ref(null)
const slideIndex = ref(0)
function onTrackScroll() {
  const el = trackRef.value
  if (el?.clientWidth) slideIndex.value = Math.round(el.scrollLeft / el.clientWidth)
}

// J'aime : mise à jour optimiste, double appui sur le contenu pour aimer.
const {
  view: likeState,
  canLike,
  countLabel: likeCountLabel,
  toggle: toggleLike,
  like: likeOnly,
} = usePostLike(() => props.post)
const likeIconKey = ref(0)
const burstKey = ref(0)
const burstStyle = ref({})
const detectDoubleTap = createDoubleTapDetector()

function onLikeClick() {
  likeIconKey.value += 1
  toggleLike()
}

function likeFromDoubleTap(event) {
  const box = event.currentTarget?.getBoundingClientRect?.()
  burstStyle.value = box && box.height > 0 ? { top: `${Math.round(event.clientY - box.top)}px` } : {}
  if (canLike.value) burstKey.value += 1
  if (!likeState.liked) likeIconKey.value += 1
  likeOnly()
}

function onContentPointerUp(event) {
  if (event.pointerType === 'mouse' || isInteractiveTarget(event.target)) return
  if (detectDoubleTap(event.timeStamp, event.clientX, event.clientY)) {
    event.preventDefault()
    likeFromDoubleTap(event)
  }
}

function onContentDoubleClick(event) {
  if (isInteractiveTarget(event.target)) return
  window.getSelection?.()?.removeAllRanges()
  likeFromDoubleTap(event)
}

function openComments() {
  shell.open('commentaires', { post: props.post })
}

async function share() {
  const url = `${window.location.origin}/feed`
  const text = plainTextExcerpt(props.post.Content) || `Publication de ${authorName.value}`
  if (navigator.share) {
    try {
      await navigator.share({ title: `Publication de ${authorName.value}`, text, url })
    } catch (error) {
      // L'utilisateur a refermé la feuille de partage : rien à signaler.
      if (error?.name !== 'AbortError') console.warn('[Feed] Partage impossible:', error)
    }
    return
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    toast?.add({ severity: 'success', summary: 'Copié', detail: 'Le texte et le lien sont dans le presse-papiers.', life: 2500 })
  } catch {
    toast?.add({ severity: 'warn', summary: 'Partage indisponible', detail: 'Ce navigateur ne permet pas de partager ici.', life: 3000 })
  }
}
</script>

<style scoped>
.m-post {
  overflow: hidden;
  border-radius: var(--m-radius);
  background: var(--m-surface);
}
.m-post__head {
  padding: 10px 14px 6px;
}
.m-post__author {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
}
button.m-post__author {
  cursor: pointer;
  touch-action: manipulation;
}
button.m-post__author:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
  border-radius: 10px;
}
.m-avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--m-raised);
}
.m-avatar--initials {
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 600;
}
.m-post__identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.m-post__name {
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--m-accent-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-post__time {
  font-size: 0.75rem;
  color: var(--m-muted);
}
.m-post__content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  touch-action: manipulation;
}
.m-post__text-wrap {
  padding: 0 14px;
}
.m-post__text {
  font-size: 0.9375rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.m-post__text.is-clamped {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 8;
  line-clamp: 8;
}
.m-post__text :deep(p) {
  margin: 0 0 0.5em;
}
.m-post__text :deep(p:last-child) {
  margin-bottom: 0;
}
.m-post__text :deep(a) {
  color: var(--m-accent-text);
  text-decoration: underline;
}
.m-post__text :deep(img),
.m-post__text :deep(video),
.m-post__text :deep(iframe),
.m-post__text :deep(table) {
  max-width: 100%;
  height: auto;
}
.m-post__text :deep(pre) {
  overflow-x: auto;
  white-space: pre-wrap;
}
.m-post__more {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--m-muted);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
}
.m-post__embed iframe {
  display: block;
  width: 100%;
  border: 0;
  background: var(--m-raised);
}
.m-post__embed--youtube iframe {
  aspect-ratio: 16 / 9;
}
.m-post__embed--spotify iframe {
  height: 152px;
}
.m-post__embed--instagram iframe {
  height: 520px;
}
.m-post__media {
  position: relative;
}
.m-post__track {
  display: flex;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.m-post__track::-webkit-scrollbar {
  display: none;
}
.m-post__slide {
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  place-items: center;
  scroll-snap-align: center;
  background: var(--m-raised);
}
.m-post__slide img,
.m-post__slide video {
  display: block;
  width: 100%;
  max-height: min(70vh, 34rem);
  object-fit: contain;
}
.m-post__media--many .m-post__slide img,
.m-post__media--many .m-post__slide video {
  height: min(70vh, 22rem);
  object-fit: cover;
}
.m-post__counter {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 99px;
  background: rgba(2, 8, 18, 0.65);
  color: #fff;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.m-post__files {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0 14px;
  list-style: none;
}
.m-post__file {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 6px 10px;
  border-radius: 12px;
  background: var(--m-raised);
  color: inherit;
  text-decoration: none;
}
.m-post__file-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--m-accent-text);
}
.m-post__file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-post__bar {
  display: flex;
  align-items: center;
  padding: 2px 4px;
}
.m-post__action,
.m-post__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--m-muted);
  font: inherit;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  touch-action: manipulation;
}
.m-post__count {
  min-width: 32px;
  margin-left: -10px;
  padding: 0 8px 0 2px;
  justify-content: flex-start;
}
.m-post__action--end {
  margin-left: auto;
}
.m-post__action:active,
.m-post__count:active {
  background: var(--m-raised);
}
.m-post__action:focus-visible,
.m-post__count:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: -2px;
}
.m-post__action.is-liked {
  color: var(--m-like);
}
.m-post__action.is-liked :deep(.m-icon) {
  fill: var(--m-like);
}
.m-like-pop {
  animation: m-like-pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.4);
}
@keyframes m-like-pop {
  0% { transform: scale(0.7); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
.m-post__burst {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  color: #fff;
  pointer-events: none;
  animation: m-like-burst 0.75s ease-out forwards;
}
.m-post__burst :deep(.m-icon) {
  width: 84px;
  height: 84px;
  fill: var(--m-like);
  stroke: var(--m-like);
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.35));
}
@keyframes m-like-burst {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  25% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.15); }
}
@media (prefers-reduced-motion: reduce) {
  .m-like-pop,
  .m-post__burst {
    animation-duration: 0.01s;
  }
}
</style>
