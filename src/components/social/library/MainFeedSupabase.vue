<template>
  <div class="main-feed" :class="{ 'community-mode': !!communityId }" ref="mainFeedRef">
    <Toast />
    <div v-if="isMobile" class="mainfeed-mobile">
      <transition name="fade">
        <div v-show="showHeaderIcons">
          <HeaderIcons />
        </div>
      </transition>
      <StoriesBar />
      <div v-if="refreshWarning" class="feed-warning" role="status">{{ refreshWarning }}</div>
      <LoadingState
        v-if="initialLoading && filteredPosts.length === 0"
        label="Chargement des publications…"
      />
      <InfinityScroll
        v-else
        :loading="paginationLoading"
        scroll-target="window"
        @load-more="loadMorePosts"
      >
        <PostItem
          v-for="post in filteredPosts"
          :key="post.id"
          :post="post"
          :currentUser="localCurrentUser"
        />
      </InfinityScroll>
    </div>
    <template v-else>
      <FilterComponent
        :filterTypes="filterTypes"
        :selectedFilterType="selectedFilterType"
        :filterOptions="filterOptions"
        :selectedFilterValue="selectedFilterValue"
        @update:selectedFilterType="updateSelectedFilterType"
        @update:selectedFilterValue="updateSelectedFilterValue"
        @filter-type-change="onFilterTypeChange"
        @apply-filter="applyFilter"
        @reset-filter="resetFilter"
      />
      <div class="posts-container" ref="postsContainerRef">
        <div class="quick-post-bar" @click="handleCreateClick">
          <span class="quick-post-icon-circle">
            <i class="pi pi-file-edit quick-post-icon"></i>
          </span>
          <div class="quick-post-placeholder">Exprime-toi...</div>
        </div>
        <CreatePostDialog
          v-model="showCreatePost"
          :loading="loading"
          :value="newPost"
          :selectedMedia="selectedMedia"
          @update:value="(val) => (newPost = val)"
          @publish="postMessage"
          @media-selected="handleFileSelection"
          @remove-media="removeMedia"
        />
        <StoriesBar />
        <div v-if="refreshWarning" class="feed-warning" role="status">{{ refreshWarning }}</div>
        <LoadingState
          v-if="initialLoading && filteredPosts.length === 0"
          label="Chargement des publications…"
        />
        <InfinityScroll v-else :loading="paginationLoading" @load-more="loadMorePosts">
          <PostItem
            v-for="post in filteredPosts"
            :key="post.id"
            :post="post"
            :currentUser="localCurrentUser"
          />
        </InfinityScroll>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase.js'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from 'primevue/usetoast'
import InfinityScroll from '@/components/social/library/InfinityScroll.vue'
import PostItem from '@/components/social/library/PostItem.vue'
import Toast from 'primevue/toast'
import FilterComponent from '@/components/social/library/FilterComponent.vue'
import CreatePostDialog from '@/components/social/library/CreatePostDialog.vue'
import HeaderIcons from '@/components/common/utils/HeaderIcons.vue'
import gamificationIntegration from '@/service/gamificationIntegration'
import StoriesBar from './StoriesBar.vue'
import LoadingState from '@/components/common/states/LoadingState.vue'
import {
  buildFeedScopeKey,
  postMatchesFeedScope,
  useSocialFeedStore
} from '@/stores/socialFeedStore'
import { createFeedRealtimeController } from '@/service/feedRealtimeController'
import { readFeedScroll, restoreFeedScroll } from '@/service/feedScrollService'

export default {
  name: 'MainFeedSupabase',
  props: {
    communityId: {
      type: String,
      default: null
    }
  },
  components: {
    HeaderIcons,
    StoriesBar,
    InfinityScroll,
    PostItem,
    Toast,
    FilterComponent,
    CreatePostDialog,
    LoadingState
  },
  setup(props) {
    const router = useRouter()
    const authStore = useAuthStore()
    const feedStore = useSocialFeedStore()
    const toast = useToast()

    const newPost = ref('')
    const detectedTags = ref([])
    const postsPerPage = ref(10)
    const localCurrentUser = ref(null)
    const lastScrollTop = ref(0)
    const selectedMedia = ref([])
    const showCreatePost = ref(false)
    const showHeaderStories = ref(true)
    const showHeaderIcons = ref(true)
    const showEditAndStories = ref(true)
    const mainFeedRef = ref(null)
    const postsContainerRef = ref(null)
    const viewportWidth = ref(window.innerWidth)
    let postsChannel = null
    let removeRouterAfterEach = null
    const realtimeController = createFeedRealtimeController({
      refresh: () => reloadPosts()
    })

    const filterTypes = ref(
      props.communityId
        ? [
            { label: 'Tous', value: null },
            { label: 'Hashtag', value: 'hashtag' }
          ]
        : [
            { label: 'Tous', value: null },
            { label: 'Hashtag', value: 'hashtag' },
            { label: 'Communauté', value: 'community' }
          ]
    )
    const selectedFilterType = ref(null)
    const filterOptions = ref([])
    const selectedFilterValue = ref(null)
    const availableHashtags = ref([])
    const availableCommunities = ref([])
    const appliedFilter = ref({ type: null, value: null })
    const createScope = () => ({
      communityId: props.communityId || null,
      filter: { ...appliedFilter.value }
    })
    const activeScope = ref(createScope())
    feedStore.ensureScope(activeScope.value)
    const activeEntry = computed(
      () =>
        feedStore.entries[buildFeedScopeKey(activeScope.value)] ||
        feedStore.ensureScope(activeScope.value)
    )
    const posts = computed(() => activeEntry.value.posts)
    const filteredPosts = posts
    const initialLoading = computed(() => activeEntry.value.initialLoading)
    const paginationLoading = computed(
      () => activeEntry.value.initialLoading || activeEntry.value.paginating
    )
    const loading = computed(
      () => initialLoading.value || activeEntry.value.paginating || activeEntry.value.publishing
    )
    const refreshWarning = computed(() => activeEntry.value.warning)

    const isMobile = computed(() => viewportWidth.value <= 600)

    const handleResize = () => {
      viewportWidth.value = window.innerWidth
    }

    const cleanupMediaPreviews = (items) => {
      ;(items || []).forEach((m) => {
        if (m?.preview && String(m.preview).startsWith('blob:')) {
          URL.revokeObjectURL(m.preview)
        }
      })
    }

    watch(newPost, (value) => {
      const textWithoutHtml = value.replace(/<[^>]+>/g, '')
      detectedTags.value = extractTags(textWithoutHtml)
    })

    watch(
      () => props.communityId,
      async () => {
        saveCurrentScroll()
        selectedFilterType.value = null
        selectedFilterValue.value = null
        filterOptions.value = []
        appliedFilter.value = { type: null, value: null }
        activeScope.value = createScope()
        feedStore.ensureScope(activeScope.value)
        await fetchAvailableFilters()
        await reloadPosts()
        await restoreCurrentScroll()
      }
    )

    const extractTags = (text) => {
      const regex = /[#@][\w-]+/g
      return text.match(regex) || []
    }

    const fetchAvatars = async (userIds) => {
      try {
        await feedStore.fetchAvatars(userIds)
      } catch (error) {
        console.warn('[SocialFeed] Avatars indisponibles:', error)
      }
    }

    const postMessage = async () => {
      const textWithoutHtml = newPost.value.replace(/<[^>]+>/g, '').trim()
      if (textWithoutHtml === '' && selectedMedia.value.length === 0) {
        toast.add({
          severity: 'warn',
          summary: 'Contenu vide',
          detail: 'Ajoutez un texte ou un média avant de publier.',
          life: 2500
        })
        return
      }

      if (!localCurrentUser.value?.id) {
        toast.add({
          severity: 'error',
          summary: 'Utilisateur non connecté',
          detail: 'Reconnectez-vous pour publier un post.',
          life: 3000
        })
        return
      }

      feedStore.setPublishing(activeScope.value, true)
      try {
        const authorName =
          localCurrentUser.value.user_metadata?.full_name ||
          localCurrentUser.value.email?.split('@')[0] ||
          localCurrentUser.value.id

        const hashtagsObject = detectedTags.value
          .filter((tag) => tag.startsWith('#'))
          .reduce((acc, tag) => {
            const cleanTag = tag.substring(1)
            acc[cleanTag] = true
            return acc
          }, {})

        const mentionsObject = detectedTags.value
          .filter((tag) => tag.startsWith('@'))
          .reduce((acc, tag) => {
            const cleanMention = tag.substring(1)
            acc[cleanMention] = true
            return acc
          }, {})

        const { data: ins, error: insErr } = await supabase
          .from('posts')
          .insert([
            {
              user_id: localCurrentUser.value.id,
              author_name: authorName,
              content: newPost.value,
              hashtags: hashtagsObject,
              mentions: mentionsObject,
              community_id: props.communityId || null
            }
          ])
          .select('id, created_at')
          .single()
        if (insErr) throw insErr

        const media = await uploadMedia()
        if (media.length > 0) {
          const rows = media.map((m) => ({ post_id: ins.id, url: m.url, type: m.type }))
          const { error: mediaErr } = await supabase.from('post_media').insert(rows)
          if (mediaErr) throw mediaErr
        }

        // Optimistic update: afficher immédiatement le post
        const mapped = {
          id: ins.id,
          Author: authorName,
          IdUser: localCurrentUser.value.id,
          avatar_url: feedStore.avatarCache[localCurrentUser.value.id] || null,
          Content: newPost.value,
          Timestamp: Date.now(),
          Hashtags: hashtagsObject,
          MentionGroups: mentionsObject,
          community_id: props.communityId || null,
          media: media.map((m) => m.url)
        }
        const insertedRow = {
          id: ins.id,
          user_id: localCurrentUser.value.id,
          author_name: authorName,
          content: newPost.value,
          created_at: ins.created_at,
          hashtags: hashtagsObject,
          mentions: mentionsObject,
          community_id: props.communityId || null
        }
        if (postMatchesFeedScope(insertedRow, activeScope.value)) {
          feedStore.upsertPost(activeScope.value, mapped)
        }

        await gamificationIntegration.onSocialInteraction(localCurrentUser.value.id, {
          action: 'post',
          targetType: 'post',
          targetId: ins.id,
          postLength: textWithoutHtml.length,
          hasMedia: selectedMedia.value.length > 0,
          hashtagsCount: Object.keys(hashtagsObject).length,
          mentionsCount: Object.keys(mentionsObject).length,
          timestamp: Date.now()
        })

        newPost.value = ''
        cleanupMediaPreviews(selectedMedia.value)
        selectedMedia.value = []
        detectedTags.value = []
        showCreatePost.value = false
      } catch (e) {
        console.error('Erreur publication Supabase:', e)
        toast.add({
          severity: 'error',
          summary: 'Publication échouée',
          detail: e?.message || 'Une erreur est survenue lors de la publication.',
          life: 4000
        })
      } finally {
        feedStore.setPublishing(activeScope.value, false)
      }
    }

    const uploadMedia = async () => {
      const uploaded = []
      for (const media of selectedMedia.value) {
        try {
          const file = media.file
          const path = `posts/${localCurrentUser.value.id}/${Date.now()}_${file.name}`
          const { error: upErr } = await supabase.storage
            .from('post-media')
            .upload(path, file, { upsert: true })
          if (upErr) throw upErr
          const { data: pub } = supabase.storage.from('post-media').getPublicUrl(path)
          uploaded.push({ url: pub.publicUrl, type: file.type })
        } catch (e) {
          console.error('Erreur upload média Supabase:', e)
        }
      }
      return uploaded
    }

    const handleFileSelection = (event) => {
      const files = event.files
      for (const file of files) {
        const fileType = file.type
        const previewUrl = URL.createObjectURL(file)
        selectedMedia.value.push({ file, type: fileType, preview: previewUrl })
      }
    }

    const removeMedia = (index) => {
      const media = selectedMedia.value[index]
      if (media?.preview && String(media.preview).startsWith('blob:')) {
        URL.revokeObjectURL(media.preview)
      }
      selectedMedia.value.splice(index, 1)
    }

    const setAvailableHashtagsFromPosts = () => {
      const set = new Set()
      posts.value.forEach((p) => {
        if (p.Hashtags) Object.keys(p.Hashtags).forEach((k) => set.add(k))
      })
      availableHashtags.value = Array.from(set).map((t) => ({ label: t, value: t }))
    }

    const reloadPosts = async () => {
      const result = await feedStore.loadScope(activeScope.value, {
        mode: 'refresh',
        pageSize: postsPerPage.value
      })
      setAvailableHashtagsFromPosts()
      return result
    }

    const fetchAvailableFilters = async () => {
      try {
        if (localCurrentUser.value && !props.communityId) {
          const { data: ucRows, error: ucErr } = await supabase
            .from('user_communities')
            .select('community_id')
            .eq('user_id', localCurrentUser.value.id)
          if (ucErr) throw ucErr
          const ids = (ucRows || []).map((r) => r.community_id).filter(Boolean)
          if (!ids.length) {
            availableCommunities.value = []
            return
          }
          const { data: comms, error: cErr } = await supabase
            .from('communities')
            .select('id, name')
            .in('id', ids)
          if (cErr) throw cErr
          availableCommunities.value = (comms || []).map((c) => ({ label: c.name, value: c.id }))
        }
      } catch (e) {
        console.error('Erreur filtres Supabase:', e)
        if (selectedFilterType.value || selectedFilterValue.value) {
          toast.add({
            severity: 'warn',
            summary: 'Filtres indisponibles',
            detail: 'Impossible de charger les filtres pour le moment.',
            life: 3000
          })
        }
      }
    }

    const onFilterTypeChange = (value) => {
      if (value === 'hashtag') {
        filterOptions.value = availableHashtags.value
      } else if (value === 'community') {
        filterOptions.value = availableCommunities.value
      } else {
        filterOptions.value = []
        selectedFilterValue.value = null
      }
    }

    const updateSelectedFilterType = (value) => {
      selectedFilterType.value = value
    }
    const updateSelectedFilterValue = (value) => {
      selectedFilterValue.value = value
    }

    const fetchPosts = async () => {
      return reloadPosts()
    }

    const applyFilters = () => {
      setAvailableHashtagsFromPosts()
    }

    const loadMorePosts = async () => {
      const result = await feedStore.loadScope(activeScope.value, {
        mode: 'paginate',
        pageSize: postsPerPage.value
      })
      setAvailableHashtagsFromPosts()
      return result
    }

    const saveCurrentScroll = () => {
      const scrollTop = readFeedScroll({
        isMobile: isMobile.value,
        container: postsContainerRef.value
      })
      feedStore.saveScroll(activeScope.value, scrollTop)
    }

    const restoreCurrentScroll = async () => {
      await nextTick()
      const scrollTop = activeEntry.value.scrollTop || 0
      restoreFeedScroll({
        isMobile: isMobile.value,
        container: postsContainerRef.value,
        scrollTop
      })
      lastScrollTop.value = scrollTop
    }

    const switchScope = async (scope) => {
      saveCurrentScroll()
      const nextEntry = feedStore.ensureScope(scope)
      if (!nextEntry.loaded) {
        const result = await feedStore.loadScope(scope, {
          mode: 'refresh',
          pageSize: postsPerPage.value
        })
        if (!result.ok && !nextEntry.loaded) {
          appliedFilter.value = { ...activeScope.value.filter }
          selectedFilterType.value = activeScope.value.filter.type
          selectedFilterValue.value = activeScope.value.filter.value
          onFilterTypeChange(selectedFilterType.value)
          toast.add({
            severity: 'warn',
            summary: 'Filtre indisponible',
            detail: 'Le fil déjà affiché a été conservé.',
            life: 3500
          })
          return result
        }
      } else {
        void feedStore.loadScope(scope, { mode: 'refresh', pageSize: postsPerPage.value })
      }
      activeScope.value = scope
      setAvailableHashtagsFromPosts()
      await restoreCurrentScroll()
      return { ok: true }
    }

    const handleCreateClick = () => {
      if (isMobile.value) {
        router.push('/create')
      } else {
        showCreatePost.value = true
      }
    }

    const handleScroll = (event) => {
      const scrollTop = event.target.scrollTop
      lastScrollTop.value = scrollTop
      feedStore.saveScroll(activeScope.value, scrollTop)
      showEditAndStories.value = scrollTop === 0
    }

    const handleWindowScroll = () => {
      const currentScroll = window.scrollY
      if (currentScroll > lastScrollTop.value + 10) {
        showHeaderIcons.value = false
      } else if (currentScroll < lastScrollTop.value - 10) {
        showHeaderIcons.value = true
      }
      lastScrollTop.value = currentScroll
      feedStore.saveScroll(activeScope.value, currentScroll)
    }

    watch(isMobile, async (nextMobile, previousMobile) => {
      const scrollTop = readFeedScroll({
        isMobile: previousMobile,
        container: postsContainerRef.value
      })
      feedStore.saveScroll(activeScope.value, scrollTop)
      window.removeEventListener('scroll', handleWindowScroll)
      postsContainerRef.value?.removeEventListener('scroll', handleScroll)

      await nextTick()
      if (nextMobile) {
        window.addEventListener('scroll', handleWindowScroll)
      } else {
        postsContainerRef.value?.addEventListener('scroll', handleScroll)
      }
      restoreFeedScroll({
        isMobile: nextMobile,
        container: postsContainerRef.value,
        scrollTop
      })
      lastScrollTop.value = scrollTop
    })

    onMounted(async () => {
      if (!authStore.user) {
        await authStore.checkAuthState()
      }
      const currentUser = authStore.user
      if (currentUser) {
        localCurrentUser.value = currentUser
        await fetchAvatars([currentUser.id])
        await fetchAvailableFilters()
        await reloadPosts()
        await restoreCurrentScroll()
      }
      if (isMobile.value) window.addEventListener('scroll', handleWindowScroll)
      window.addEventListener('resize', handleResize)
      if (!isMobile.value) postsContainerRef.value?.addEventListener('scroll', handleScroll)

      // Supabase Realtime: nouveaux posts
      if (!postsChannel) {
        postsChannel = supabase
          .channel('realtime-posts-feed')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'posts' },
            async (payload) => {
              await feedStore.handleRealtimePostChange(payload)
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'post_media' },
            (payload) => {
              feedStore.attachRealtimeMedia(payload.new)
            }
          )
          .subscribe((status) => {
            realtimeController.handleStatus(status)
          })
      }

      if (!removeRouterAfterEach) {
        removeRouterAfterEach = router.afterEach((to, from) => {
          if (from?.name === 'CreateContentMobile') {
            void reloadPosts()
          }
        })
      }
    })

    onUnmounted(() => {
      saveCurrentScroll()
      window.removeEventListener('scroll', handleWindowScroll)
      window.removeEventListener('resize', handleResize)
      postsContainerRef.value?.removeEventListener('scroll', handleScroll)
      cleanupMediaPreviews(selectedMedia.value)
      if (postsChannel) {
        supabase.removeChannel(postsChannel)
        postsChannel = null
      }
      realtimeController.stop()
      if (removeRouterAfterEach) {
        removeRouterAfterEach()
        removeRouterAfterEach = null
      }
    })

    return {
      posts,
      filteredPosts,
      newPost,
      detectedTags,
      loading,
      postsPerPage,
      localCurrentUser,
      lastScrollTop,
      selectedMedia,
      filterTypes,
      selectedFilterType,
      filterOptions,
      selectedFilterValue,
      availableHashtags,
      availableCommunities,
      appliedFilter,
      showCreatePost,
      isMobile,
      handleCreateClick,
      showHeaderStories,
      showHeaderIcons,
      showEditAndStories,
      initialLoading,
      paginationLoading,
      refreshWarning,
      mainFeedRef,
      postsContainerRef,
      extractTags,
      postMessage,
      uploadMedia,
      handleFileSelection,
      removeMedia,
      reloadPosts,
      fetchAvailableFilters,
      onFilterTypeChange,
      applyFilter: async () => {
        appliedFilter.value = { type: selectedFilterType.value, value: selectedFilterValue.value }
        await switchScope(createScope())
      },
      resetFilter: async () => {
        selectedFilterType.value = null
        selectedFilterValue.value = null
        appliedFilter.value = { type: null, value: null }
        filterOptions.value = []
        await switchScope(createScope())
      },
      fetchPosts,
      applyFilters,
      loadMorePosts,
      handleScroll,
      updateSelectedFilterType,
      updateSelectedFilterValue
    }
  }
}
</script>

<style scoped>
.feed-warning {
  width: 100%;
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 35%, transparent);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  color: var(--text-color);
  font-size: 0.875rem;
}

.quick-post-bar {
  display: flex;
  align-items: center;
  background: var(--surface-card, #f8f8fa);
  border-radius: 1.2rem;
  padding: 0.5rem 1rem;
  margin-bottom: 1.1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background 0.18s;
  max-width: 880px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 900px) {
  .quick-post-bar {
    max-width: 98vw;
  }
}
.quick-post-icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--surface-hover);
  border-radius: 50%;
  margin-right: 0.7rem;
  flex-shrink: 0;
}
.quick-post-icon {
  font-size: 1rem;
  color: var(--primary-color);
}
.quick-post-placeholder {
  color: #888;
  font-size: 1.01rem;
  flex: 1;
  text-align: left;
}
@media (max-width: 768px) {
  .quick-post-bar {
    padding: 0.35rem 0.5rem;
    border-radius: 0.8rem;
    margin-bottom: 0.6rem;
  }
  .quick-post-icon-circle {
    width: 26px;
    height: 26px;
    margin-right: 0.5rem;
  }
  .quick-post-icon {
    font-size: 0.85rem;
  }
  .quick-post-placeholder {
    font-size: 0.96rem;
  }
}
.main-feed {
  height: 85vh;
  max-height: 90vh;
  overflow-y: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 880px;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 900px) {
  .main-feed {
    max-width: 98vw;
  }
}
.main-feed.community-mode {
  max-width: 880px;
  width: 100%;
  align-items: stretch;
  height: 85vh;
  max-height: 90vh;
}
.main-feed.community-mode .quick-post-bar {
  max-width: 100%;
}
.main-feed.community-mode .posts-container {
  width: 100%;
}
.main-feed.community-mode .posts-container > * {
  width: 100%;
}
.main-feed.community-mode :deep(.post-item) {
  width: 100%;
  max-width: 100%;
}
@media (max-width: 600px) {
  .main-feed,
  .main-feed.community-mode {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .mainfeed-mobile {
    width: 100%;
  }
}
.posts-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.posts-container::-webkit-scrollbar {
  display: none;
}
.mainfeed-mobile {
  display: flex;
  flex-direction: column;
}
.header-stories-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #0d1a2f;
  transition: transform 0.25s;
}
.header-stories-sticky.hidden {
  transform: translateY(-100%);
}
.post-feed-scrollable {
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
