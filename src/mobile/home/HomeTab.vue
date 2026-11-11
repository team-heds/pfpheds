<template>
  <section ref="scrollerRef" class="m-home" aria-label="Accueil">
    <div
      class="m-home__ptr"
      :class="{ 'is-refreshing': refreshing, 'is-visible': pull > 0 || refreshing }"
      :style="{ transform: `translateY(${Math.round(pull) - 48}px)` }"
      aria-hidden="true"
    >
      <MIcon name="refresh" :style="refreshing ? null : { transform: `rotate(${Math.round(pull * 4)}deg)` }" />
    </div>
    <p class="m-sr-only" role="status" aria-live="polite">{{ refreshing ? 'Actualisation du fil…' : '' }}</p>

    <MobileStories />

    <FeedFilterChips :filters="filters" :selected="selectedFilter.key" @select="selectFilter" @manage="router.push('/communities')" />

    <div v-if="entry.warning && posts.length" class="m-banner" role="status">
      <span>Actualisation impossible. Les publications déjà chargées restent affichées.</span>
      <button type="button" class="m-banner__action" @click="refresh">Réessayer</button>
    </div>

    <div v-if="showSkeleton" class="m-home__list" role="status" aria-label="Chargement des publications">
      <div v-for="n in 3" :key="n" class="m-post-skeleton" aria-hidden="true">
        <div class="m-post-skeleton__head">
          <span class="m-skeleton m-post-skeleton__avatar"></span>
          <span class="m-post-skeleton__lines">
            <span class="m-skeleton" style="width: 42%"></span>
            <span class="m-skeleton" style="width: 24%"></span>
          </span>
        </div>
        <span class="m-skeleton" style="width: 92%"></span>
        <span class="m-skeleton" style="width: 70%"></span>
        <span v-if="n === 1" class="m-skeleton m-post-skeleton__media"></span>
      </div>
    </div>

    <div v-else-if="loadFailed" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Le fil ne se charge pas</p>
      <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
      <button type="button" class="m-ghost-button" @click="refresh">Réessayer</button>
    </div>

    <div v-else-if="!posts.length" class="m-state">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="chat" /></span>
      <p class="m-state__title">{{ selectedFilter.type ? 'Aucune publication ici' : 'Le fil est vide' }}</p>
      <p class="m-state__text">
        {{ selectedFilter.type ? 'Ce filtre ne contient pas encore de publication.' : 'Sois la première personne à publier.' }}
      </p>
      <button v-if="selectedFilter.type" type="button" class="m-ghost-button" @click="selectFilter(filters[0])">Voir tout le fil</button>
      <button v-else type="button" class="m-ghost-button" @click="shell.open('publier')">Créer une publication</button>
    </div>

    <div v-else class="m-home__list">
      <MobilePostCard v-for="post in posts" :key="post.id" :post="post" :now="now" />
    </div>

    <div ref="sentinelRef" class="m-home__more">
      <template v-if="posts.length">
        <span v-if="entry.paginating" class="m-home__loading" role="status">
          <span class="m-spinner" aria-hidden="true"></span>
          Chargement de la suite…
        </span>
        <span v-else-if="!entry.hasMore" class="m-home__end">Tu as tout vu.</span>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { supabase } from '@/supabase.js'
import { useAuthStore } from '@/stores/authStore'
import { buildFeedScopeKey, useSocialFeedStore } from '@/stores/socialFeedStore'
import { createFeedRealtimeController } from '@/service/feedRealtimeController'
import { runtimeFeatures } from '@/config/runtimeFeatures'
import MIcon from '@/mobile/ui/MIcon.vue'
import MobileStories from '@/mobile/home/MobileStories.vue'
import FeedFilterChips from '@/mobile/home/FeedFilterChips.vue'
import MobilePostCard from '@/mobile/home/MobilePostCard.vue'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'
import { useKeptScroll } from '@/mobile/shell/useKeptScroll'
import { usePullToRefresh } from '@/mobile/home/usePullToRefresh'
import { useMobileStoriesStore } from '@/mobile/home/mobileStoriesStore'
import { useMobileNotificationsStore } from '@/mobile/home/mobileNotificationsStore'
import {
  FOR_YOU_FILTER,
  buildFeedFilters,
  collectHashtags,
  fetchMyCommunities,
  filterScope,
} from '@/mobile/home/feedFilters'

const PAGE_SIZE = 10
const STALE_AFTER_MS = 60 * 1000
const MAX_HASHTAGS = 8

const props = defineProps({
  /** L'accueil reste en mémoire quand on change d'onglet : vrai quand il est affiché. */
  active: { type: Boolean, default: true },
})

const router = useRouter()
const shell = useMobileShell()
const authStore = useAuthStore()
const feedStore = useSocialFeedStore()
const stories = useMobileStoriesStore()
const notifications = useMobileNotificationsStore()
const { scrollTopSignal } = storeToRefs(useMobileShellStore())

const scrollerRef = ref(null)
const sentinelRef = ref(null)
const kept = useKeptScroll(scrollerRef, () => props.active)

const userId = computed(() => {
  const id = authStore.user?.id
  return id && id !== 'guest-user' ? id : null
})

// --- Filtres et fil ---------------------------------------------------------
const communities = ref([])
const selectedFilter = ref(FOR_YOU_FILTER)
const rootScope = filterScope(FOR_YOU_FILTER)
const scope = computed(() => filterScope(selectedFilter.value))
const entry = computed(() => feedStore.entries[buildFeedScopeKey(scope.value)] || feedStore.ensureScope(scope.value))
const rootEntry = computed(() => feedStore.entries[buildFeedScopeKey(rootScope)] || feedStore.ensureScope(rootScope))
const posts = computed(() => entry.value.posts)
// Les hashtags gardent leur place une fois affichés : les pastilles ne
// changent pas d'ordre sous le doigt quand la suite du fil se charge.
const hashtags = ref([])
watch(
  () => rootEntry.value.posts,
  (list) => {
    const fresh = collectHashtags(list, MAX_HASHTAGS).filter((tag) => !hashtags.value.includes(tag))
    if (fresh.length) hashtags.value = [...hashtags.value, ...fresh].slice(0, MAX_HASHTAGS)
  },
  { immediate: true },
)
const filters = computed(() => {
  const list = buildFeedFilters({ communities: communities.value, hashtags: hashtags.value })
  // Le filtre choisi reste affiché même si son hashtag sort des plus utilisés.
  return list.some((filter) => filter.key === selectedFilter.value.key) ? list : [...list, selectedFilter.value]
})

const showSkeleton = computed(() => !posts.value.length && (entry.value.initialLoading || !entry.value.loaded) && !entry.value.warning)
const loadFailed = computed(() => !posts.value.length && Boolean(entry.value.warning))

let lastRefreshAt = 0
async function refresh() {
  lastRefreshAt = Date.now()
  const result = await feedStore.loadScope(scope.value, { mode: 'refresh', pageSize: PAGE_SIZE })
  void nextTick(checkSentinel)
  return result
}

async function loadMore() {
  const current = entry.value
  if (!current.loaded || !current.hasMore || current.paginating || current.initialLoading || current.refreshing) return
  await feedStore.loadScope(scope.value, { mode: 'paginate', pageSize: PAGE_SIZE })
  // La suite peut tenir dans l'écran : on revérifie tant que le bas reste visible.
  void nextTick(checkSentinel)
}

async function selectFilter(filter) {
  if (filter.key === selectedFilter.value.key) {
    kept.scrollToTop()
    return
  }
  selectedFilter.value = filter
  kept.scrollToTop(false)
  await refresh()
}

async function refreshEverything() {
  await Promise.all([
    refresh(),
    stories.load(userId.value),
    notifications.load(userId.value),
    loadCommunities(),
  ])
}

async function loadCommunities() {
  try {
    communities.value = await fetchMyCommunities(userId.value)
  } catch (error) {
    console.warn('[Accueil] Communautés indisponibles:', error)
  }
}

const { pull, refreshing } = usePullToRefresh(scrollerRef, refreshEverything)

// --- Chargement progressif ---------------------------------------------------
let observer = null
let sentinelVisible = false
function checkSentinel() {
  if (sentinelVisible && props.active) void loadMore()
}
function observeSentinel() {
  if (!window.IntersectionObserver || !sentinelRef.value || !scrollerRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      sentinelVisible = entries.some((item) => item.isIntersecting)
      checkSentinel()
    },
    { root: scrollerRef.value, rootMargin: '0px 0px 600px 0px' },
  )
  observer.observe(sentinelRef.value)
}

// --- Temps réel et retour au premier plan -----------------------------------
let postsChannel = null
const realtime = createFeedRealtimeController({ refresh: () => feedStore.loadScope(scope.value, { mode: 'refresh', pageSize: PAGE_SIZE }) })
function subscribeRealtime() {
  if (!runtimeFeatures.supabaseRealtime || postsChannel) return
  postsChannel = supabase
    .channel('realtime-posts-feed-mobile')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => feedStore.handleRealtimePostChange(payload))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_media' }, (payload) => feedStore.attachRealtimeMedia(payload.new))
    .subscribe((status) => realtime.handleStatus(status))
}

function refreshIfStale() {
  if (!props.active || document.visibilityState !== 'visible') return
  if (Date.now() - lastRefreshAt < STALE_AFTER_MS) return
  void refresh()
  void stories.load(userId.value)
  void notifications.load(userId.value)
}

// Les dates relatives (« il y a 5 min ») restent justes sans recharger.
const now = ref(Date.now())
let clock = null

watch(() => props.active, (active) => {
  if (active) refreshIfStale()
})
watch(scrollTopSignal, () => {
  if (props.active) kept.scrollToTop()
})

onMounted(async () => {
  observeSentinel()
  document.addEventListener('visibilitychange', refreshIfStale)
  clock = setInterval(() => {
    now.value = Date.now()
  }, 60 * 1000)
  if (!userId.value) return
  subscribeRealtime()
  void stories.loadOwnAvatar(userId.value)
  await refreshEverything()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', refreshIfStale)
  clearInterval(clock)
  if (postsChannel) supabase.removeChannel(postsChannel)
  postsChannel = null
  realtime.stop()
})
</script>

<style scoped>
.m-home {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 16px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: var(--m-bg);
}
.m-home::-webkit-scrollbar {
  display: none;
}
.m-home > * {
  flex-shrink: 0;
}
.m-home__ptr {
  position: sticky;
  top: 0;
  z-index: 5;
  align-self: center;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: 0 0 -52px;
  border-radius: 50%;
  background: var(--m-surface);
  color: var(--m-accent-text);
  box-shadow: 0 4px 14px rgba(2, 8, 18, 0.35);
  opacity: 0;
  pointer-events: none;
}
.m-home__ptr.is-visible {
  opacity: 1;
}
.m-home__ptr:not(.is-visible) {
  transition: transform 200ms ease, opacity 200ms ease;
}
.m-home__ptr.is-refreshing :deep(.m-icon) {
  animation: m-spin 0.8s linear infinite;
}
.m-home__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.m-home__more {
  display: grid;
  place-items: center;
  min-height: 48px;
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-home__loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.m-post-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: var(--m-radius);
  background: var(--m-surface);
}
.m-post-skeleton .m-skeleton {
  display: block;
  height: 12px;
  border-radius: 6px;
}
.m-post-skeleton__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.m-post-skeleton__avatar.m-skeleton {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}
.m-post-skeleton__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.m-post-skeleton__media.m-skeleton {
  height: 170px;
  border-radius: 12px;
}
@keyframes m-spin {
  to { transform: rotate(360deg); }
}
</style>
