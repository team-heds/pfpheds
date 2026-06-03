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
      <InfinityScroll :loading="loading" @load-more="loadMorePosts">
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
      <div class="posts-container">
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
          @update:value="val => newPost = val"
          @publish="postMessage"
          @media-selected="handleFileSelection"
          @remove-media="removeMedia"
        />
        <StoriesBar />
        <InfinityScroll :loading="loading" @load-more="loadMorePosts">
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase.js'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from 'primevue/usetoast'
import InfinityScroll from '@/components/social/library/InfinityScroll.vue'
import PostItem from '@/components/social/library/PostItem.vue'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import FilterComponent from '@/components/social/library/FilterComponent.vue'
import TextAreaComponent from './TextAreaComponent.vue'
import CreatePostDialog from '@/components/social/library/CreatePostDialog.vue'
import HeaderIcons from '@/components/common/utils/HeaderIcons.vue'
import gamificationIntegration from '@/service/gamificationIntegration'
import StoriesBar from './StoriesBar.vue'

export default {
  name: 'MainFeedSupabase',
  props: {
    communityId: {
      type: String,
      default: null,
    },
  },
  components: {
    HeaderIcons,
    StoriesBar,
    InfinityScroll,
    PostItem,
    Tag,
    Toast,
    Button,
    FileUpload,
    FilterComponent,
    TextAreaComponent,
    CreatePostDialog,
  },
  setup(props) {
    const router = useRouter()
    const authStore = useAuthStore()
    const toast = useToast()

    const posts = ref([])
    const filteredPosts = ref([])
    const newPost = ref('')
    const detectedTags = ref([])
    const loading = ref(false)
    const postsPerPage = ref(10)
    const localCurrentUser = ref(null)
    const avatarCache = ref({})
    const lastScrollTop = ref(0)
    const selectedMedia = ref([])
    const oldestCreatedAt = ref(null)
    const showCreatePost = ref(false)
    const showHeaderStories = ref(true)
    const showHeaderIcons = ref(true)
    const showEditAndStories = ref(true)
    const mainFeedRef = ref(null)
    const viewportWidth = ref(window.innerWidth)
    let postsChannel = null
    let pollInterval = null
    let removeRouterAfterEach = null

    const filterTypes = ref(
      props.communityId
        ? [
            { label: 'Tous', value: null },
            { label: 'Hashtag', value: 'hashtag' },
          ]
        : [
            { label: 'Tous', value: null },
            { label: 'Hashtag', value: 'hashtag' },
            { label: 'Communauté', value: 'community' },
          ]
    )
    const selectedFilterType = ref(null)
    const filterOptions = ref([])
    const selectedFilterValue = ref(null)
    const availableHashtags = ref([])
    const availableCommunities = ref([])
    const appliedFilter = ref({ type: null, value: null })

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
        selectedFilterType.value = null
        selectedFilterValue.value = null
        filterOptions.value = []
        appliedFilter.value = { type: null, value: null }
        posts.value = []
        filteredPosts.value = []
        oldestCreatedAt.value = null
        await fetchAvailableFilters()
        await fetchPosts()
      }
    )

    const extractTags = (text) => {
      const regex = /[#@][\w-]+/g
      return text.match(regex) || []
    }

    const fetchAvatars = async (userIds) => {
      const missing = userIds.filter((id) => id && !avatarCache.value[id])
      if (!missing.length) return
      try {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, avatar_url')
          .in('user_id', missing)
        ;(profiles || []).forEach((p) => {
          avatarCache.value[p.user_id] = p.avatar_url || null
        })
      } catch {}
    }

    const postMessage = async () => {
      const textWithoutHtml = newPost.value.replace(/<[^>]+>/g, '').trim()
      if (textWithoutHtml === '' && selectedMedia.value.length === 0) {
        toast.add({
          severity: 'warn',
          summary: 'Contenu vide',
          detail: 'Ajoutez un texte ou un média avant de publier.',
          life: 2500,
        })
        return
      }

      if (!localCurrentUser.value?.id) {
        toast.add({
          severity: 'error',
          summary: 'Utilisateur non connecté',
          detail: 'Reconnectez-vous pour publier un post.',
          life: 3000,
        })
        return
      }

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
              community_id: props.communityId || null,
            },
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
          avatar_url: avatarCache.value[localCurrentUser.value.id] || null,
          Content: newPost.value,
          Timestamp: Date.now(),
          Hashtags: hashtagsObject,
          MentionGroups: mentionsObject,
          media: media.map((m) => m.url),
        }
        posts.value = [mapped, ...posts.value]
        applyFilters()

        await gamificationIntegration.onSocialInteraction(localCurrentUser.value.id, {
          action: 'post',
          targetType: 'post',
          targetId: ins.id,
          postLength: textWithoutHtml.length,
          hasMedia: selectedMedia.value.length > 0,
          hashtagsCount: Object.keys(hashtagsObject).length,
          mentionsCount: Object.keys(mentionsObject).length,
          timestamp: Date.now(),
        })

        newPost.value = ''
        cleanupMediaPreviews(selectedMedia.value)
        selectedMedia.value = []
        detectedTags.value = []
        showCreatePost.value = false

        reloadPosts()
      } catch (e) {
        console.error('Erreur publication Supabase:', e)
        toast.add({
          severity: 'error',
          summary: 'Publication échouée',
          detail: e?.message || 'Une erreur est survenue lors de la publication.',
          life: 4000,
        })
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
      posts.value = []
      filteredPosts.value = []
      oldestCreatedAt.value = null
      await fetchPosts()
    }

    const fetchAvailableFilters = async () => {
      try {
        if (localCurrentUser.value && !props.communityId) {
          const { data: ucRows, error: ucErr } = await supabase
            .from('user_communities')
            .select('community_id')
            .eq('user_id', localCurrentUser.value.id)
          if (ucErr) throw ucErr
          const ids = (ucRows || []).map(r => r.community_id).filter(Boolean)
          if (!ids.length) {
            availableCommunities.value = []
            return
          }
          const { data: comms, error: cErr } = await supabase
            .from('communities')
            .select('id, name')
            .in('id', ids)
          if (cErr) throw cErr
          availableCommunities.value = (comms || []).map(c => ({ label: c.name, value: c.id }))
        }
      } catch (e) {
        console.error('Erreur filtres Supabase:', e)
        if (selectedFilterType.value || selectedFilterValue.value) {
          toast.add({
            severity: 'warn',
            summary: 'Filtres indisponibles',
            detail: 'Impossible de charger les filtres pour le moment.',
            life: 3000,
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
      if (loading.value) return
      loading.value = true
      try {
        let q = supabase
          .from('posts')
          .select('id, user_id, author_name, content, created_at, hashtags, mentions')
          .order('created_at', { ascending: false })
          .limit(postsPerPage.value)

        if (props.communityId) {
          q = q.eq('community_id', props.communityId)
        } else {
          q = q.is('community_id', null)
        }

        if (appliedFilter.value.type === 'hashtag' && appliedFilter.value.value) {
          q = q.contains('hashtags', { [appliedFilter.value.value]: true })
        } else if (!props.communityId && appliedFilter.value.type === 'community' && appliedFilter.value.value) {
          q = q.eq('community_id', appliedFilter.value.value)
        }
        if (oldestCreatedAt.value) {
          q = q.lt('created_at', oldestCreatedAt.value)
        }

        const { data: rows, error } = await q
        if (error) throw error

        if (rows && rows.length > 0) {
          const ids = rows.map((r) => r.id)
          const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))]
          let mediaMap = {}
          if (ids.length > 0) {
            const { data: mediaRows, error: mErr } = await supabase
              .from('post_media')
              .select('post_id, url, type')
              .in('post_id', ids)
            if (!mErr && mediaRows) {
              mediaRows.forEach((m) => {
                if (!mediaMap[m.post_id]) mediaMap[m.post_id] = []
                mediaMap[m.post_id].push({ url: m.url, type: m.type })
              })
            }
          }

          await fetchAvatars(userIds)

          const mapped = rows.map((r) => ({
            id: r.id,
            Author: r.author_name,
            IdUser: r.user_id,
            avatar_url: avatarCache.value[r.user_id] || null,
            Content: r.content,
            Timestamp: Date.parse(r.created_at),
            Hashtags: r.hashtags || {},
            MentionGroups: r.mentions || {},
            media: (mediaMap[r.id] || []).map((m) => m.url),
          }))

          posts.value = [...posts.value, ...mapped]
          const last = rows[rows.length - 1]
          oldestCreatedAt.value = last.created_at
          applyFilters()
          setAvailableHashtagsFromPosts()
        }
      } catch (e) {
        console.error('Erreur récupération posts Supabase:', e)
        toast.add({
          severity: 'error',
          summary: 'Chargement impossible',
          detail: 'Impossible de charger les posts.',
          life: 4000,
        })
      }
      loading.value = false
    }

    const applyFilters = () => {
      if (appliedFilter.value.type === 'hashtag' && appliedFilter.value.value) {
        filteredPosts.value = posts.value.filter(
          (post) => post.Hashtags && post.Hashtags[appliedFilter.value.value]
        )
      } else if (appliedFilter.value.type === 'community' && appliedFilter.value.value) {
        filteredPosts.value = posts.value
      } else {
        filteredPosts.value = posts.value
      }
    }

    const loadMorePosts = async () => {
      if (!loading.value) await fetchPosts()
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
    }

    onMounted(async () => {
      if (!authStore.user) {
        await authStore.checkAuthState()
      }
      const currentUser = authStore.user
      if (currentUser) {
        localCurrentUser.value = currentUser
        await fetchAvatars([currentUser.id])
        await fetchAvailableFilters()
        await fetchPosts()
      }
      if (isMobile.value) {
        window.addEventListener('scroll', handleWindowScroll)
      }
      window.addEventListener('resize', handleResize)
      if (mainFeedRef.value) {
        mainFeedRef.value.addEventListener('scroll', handleScroll)
      }

      // Supabase Realtime: nouveaux posts
      if (!postsChannel) {
        postsChannel = supabase
          .channel('realtime-posts-feed')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
          const row = payload.new
          // Appliquer le même scope que le feed courant
          const matchCommunity = props.communityId
            ? row.community_id === props.communityId
            : (
                (appliedFilter.value.type === 'community' && row.community_id === appliedFilter.value.value) ||
                (appliedFilter.value.type !== 'community' && row.community_id === null)
              )
          const matchHashtag = (
            appliedFilter.value.type !== 'hashtag' || (row.hashtags && row.hashtags[appliedFilter.value.value])
          )
          if (!matchCommunity || !matchHashtag) return

          // Récupérer ses médias
          let mediaUrls = []
          try {
            const { data: mediaRows } = await supabase
              .from('post_media')
              .select('url, type')
              .eq('post_id', row.id)
            mediaUrls = (mediaRows || []).map((m) => m.url)
          } catch {}

          await fetchAvatars([row.user_id])
          const mapped = {
            id: row.id,
            Author: row.author_name,
            IdUser: row.user_id,
            avatar_url: avatarCache.value[row.user_id] || null,
            Content: row.content,
            Timestamp: Date.parse(row.created_at),
            Hashtags: row.hashtags || {},
            MentionGroups: row.mentions || {},
            media: mediaUrls,
          }
          // Éviter doublons
          if (!posts.value.find((p) => p.id === mapped.id)) {
            posts.value = [mapped, ...posts.value]
            applyFilters()
          }
          })
          .subscribe()
      }

      // Fallback polling: recharger le feed périodiquement si le realtime est indisponible
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          reloadPosts()
        }, 30000)
      }

      if (!removeRouterAfterEach) {
        removeRouterAfterEach = router.afterEach((to, from) => {
          if (from?.name === 'CreateContentMobile') {
            reloadPosts()
          }
        })
      }
    })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleWindowScroll)
      window.removeEventListener('resize', handleResize)
      if (mainFeedRef.value) {
        mainFeedRef.value.removeEventListener('scroll', handleScroll)
      }
      cleanupMediaPreviews(selectedMedia.value)
      if (postsChannel) {
        supabase.removeChannel(postsChannel)
        postsChannel = null
      }
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
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
      oldestCreatedAt,
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
      mainFeedRef,
      extractTags,
      postMessage,
      uploadMedia,
      handleFileSelection,
      removeMedia,
      reloadPosts,
      fetchAvailableFilters,
      onFilterTypeChange,
      applyFilter: () => { appliedFilter.value = { type: selectedFilterType.value, value: selectedFilterValue.value }; reloadPosts() },
      resetFilter: () => { selectedFilterType.value = null; selectedFilterValue.value = null; appliedFilter.value = { type: null, value: null }; filterOptions.value = []; reloadPosts() },
      fetchPosts,
      applyFilters,
      loadMorePosts,
      handleScroll,
      updateSelectedFilterType,
      updateSelectedFilterValue,
    }
  },
}
</script>

<style scoped>
.quick-post-bar {
  display: flex;
  align-items: center;
  background: var(--surface-card, #f8f8fa);
  border-radius: 1.2rem;
  padding: 0.5rem 1rem;
  margin-bottom: 1.1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: background 0.18s;
  max-width: 880px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 900px) {
  .quick-post-bar { max-width: 98vw; }
}
.quick-post-icon-circle {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; background: var(--surface-hover);
  border-radius: 50%; margin-right: 0.7rem; flex-shrink: 0;
}
.quick-post-icon { font-size: 1rem; color: var(--primary-color); }
.quick-post-placeholder { color: #888; font-size: 1.01rem; flex: 1; text-align: left; }
@media (max-width: 768px) {
  .quick-post-bar { padding: 0.35rem 0.5rem; border-radius: 0.8rem; margin-bottom: 0.6rem; }
  .quick-post-icon-circle { width: 26px; height: 26px; margin-right: 0.5rem; }
  .quick-post-icon { font-size: 0.85rem; }
  .quick-post-placeholder { font-size: 0.96rem; }
}
.main-feed { height: 85vh; max-height: 90vh; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 880px; margin-left: auto; margin-right: auto; }
@media (max-width: 900px) {
  .main-feed { max-width: 98vw; }
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
.posts-container { height: 100vh; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; -ms-overflow-style: none; }
.posts-container::-webkit-scrollbar { display: none; }
.mainfeed-mobile { display: flex; flex-direction: column; }
.header-stories-sticky { position: sticky; top: 0; z-index: 10; background: #0d1a2f; transition: transform 0.25s; }
.header-stories-sticky.hidden { transform: translateY(-100%); }
.post-feed-scrollable { flex: 1 1 auto; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
