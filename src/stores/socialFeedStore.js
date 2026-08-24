import { defineStore } from 'pinia'
import { supabase } from '@/supabase.js'

const DEFAULT_PAGE_SIZE = 10
const MAX_PENDING_MEDIA_POSTS = 100

function normalizeScope(scope = {}) {
  return {
    communityId: scope.communityId || null,
    filter: {
      type: scope.filter?.type || null,
      value: scope.filter?.value || null
    }
  }
}

export function buildFeedScopeKey(scope = {}) {
  const normalized = normalizeScope(scope)
  return [
    normalized.communityId ? `community:${normalized.communityId}` : 'feed:root',
    normalized.filter.type || 'all',
    normalized.filter.value || ''
  ].join('|')
}

export function postMatchesFeedScope(row, scope = {}) {
  const normalized = normalizeScope(scope)
  const { type, value } = normalized.filter

  const communityMatches = normalized.communityId
    ? row.community_id === normalized.communityId
    : type === 'community' && value
      ? row.community_id === value
      : row.community_id == null

  if (!communityMatches) return false
  if (type === 'hashtag' && value) return Boolean(row.hashtags?.[value])
  return true
}

function createEntry(scope) {
  return {
    scope: normalizeScope(scope),
    posts: [],
    firstPageIds: [],
    oldestCreatedAt: null,
    hasMore: true,
    hasPaginated: false,
    pageSize: DEFAULT_PAGE_SIZE,
    loaded: false,
    initialLoading: false,
    refreshing: false,
    paginating: false,
    publishing: false,
    warning: null,
    scrollTop: 0
  }
}

function mergePosts(current, incoming, prepend = false) {
  const byId = new Map(current.map((post) => [post.id, post]))
  incoming.forEach((post) => {
    byId.set(post.id, { ...byId.get(post.id), ...post })
  })
  const merged = Array.from(byId.values())
  if (prepend) return merged.sort((a, b) => (b.Timestamp || 0) - (a.Timestamp || 0))
  return merged
}

export const useSocialFeedStore = defineStore('socialFeed', {
  state: () => ({
    entries: {},
    avatarCache: {},
    pendingMedia: {}
  }),

  actions: {
    ensureScope(scope) {
      const key = buildFeedScopeKey(scope)
      if (!this.entries[key]) this.entries[key] = createEntry(scope)
      return this.entries[key]
    },

    getEntry(scope) {
      return this.ensureScope(scope)
    },

    async fetchAvatars(userIds) {
      const missing = [...new Set(userIds)].filter(
        (id) => id && !Object.prototype.hasOwnProperty.call(this.avatarCache, id)
      )
      if (!missing.length) return

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, avatar_url')
        .in('user_id', missing)
      if (error) throw error

      missing.forEach((id) => {
        this.avatarCache[id] = null
      })
      ;(data || []).forEach((profile) => {
        this.avatarCache[profile.user_id] = profile.avatar_url || null
      })
    },

    async hydrateRows(rows) {
      if (!rows?.length) return []

      const postIds = rows.map((row) => row.id)
      const userIds = rows.map((row) => row.user_id).filter(Boolean)
      let mediaRows = []
      try {
        const { data, error } = await supabase
          .from('post_media')
          .select('post_id, url, type')
          .in('post_id', postIds)
        if (error) throw error
        mediaRows = data || []
      } catch (error) {
        console.warn('[SocialFeed] Médias indisponibles, affichage du texte seul:', error)
      }

      try {
        await this.fetchAvatars(userIds)
      } catch (error) {
        console.warn('[SocialFeed] Avatars indisponibles, affichage sans avatar:', error)
      }

      const mediaByPost = {}
      ;(mediaRows || []).forEach((media) => {
        if (!mediaByPost[media.post_id]) mediaByPost[media.post_id] = []
        mediaByPost[media.post_id].push(media)
      })
      postIds.forEach((postId) => {
        ;(this.pendingMedia[postId] || []).forEach((media) => {
          if (!mediaByPost[postId]) mediaByPost[postId] = []
          mediaByPost[postId].push(media)
        })
        delete this.pendingMedia[postId]
      })

      return rows.map((row) => ({
        id: row.id,
        Author: row.author_name,
        IdUser: row.user_id,
        avatar_url: this.avatarCache[row.user_id] || null,
        Content: row.content,
        Timestamp: Date.parse(row.created_at),
        Hashtags: row.hashtags || {},
        MentionGroups: row.mentions || {},
        community_id: row.community_id || null,
        media: [...new Set((mediaByPost[row.id] || []).map((media) => media.url))]
      }))
    },

    async loadScope(scope, { mode = 'refresh', pageSize = DEFAULT_PAGE_SIZE } = {}) {
      const entry = this.ensureScope(scope)
      const isPagination = mode === 'paginate'
      const requestLimit =
        !isPagination && entry.hasPaginated
          ? Math.max(pageSize, entry.posts.length + pageSize)
          : pageSize
      const loadingField = isPagination
        ? 'paginating'
        : entry.loaded
          ? 'refreshing'
          : 'initialLoading'

      const feedRequestInFlight = entry.initialLoading || entry.refreshing || entry.paginating
      if (feedRequestInFlight || (isPagination && !entry.hasMore)) {
        return { ok: true, skipped: true, posts: entry.posts }
      }

      entry[loadingField] = true
      entry.warning = null
      entry.pageSize = pageSize

      try {
        const normalized = normalizeScope(scope)
        let query = supabase
          .from('posts')
          .select('id, user_id, author_name, content, created_at, hashtags, mentions, community_id')
          .order('created_at', { ascending: false })
          .limit(requestLimit)

        if (normalized.communityId) {
          query = query.eq('community_id', normalized.communityId)
        } else if (normalized.filter.type === 'community' && normalized.filter.value) {
          query = query.eq('community_id', normalized.filter.value)
        } else {
          query = query.is('community_id', null)
        }

        if (normalized.filter.type === 'hashtag' && normalized.filter.value) {
          query = query.contains('hashtags', { [normalized.filter.value]: true })
        }
        if (isPagination && entry.oldestCreatedAt) {
          query = query.lt('created_at', entry.oldestCreatedAt)
        }

        const { data: rows, error } = await query
        if (error) throw error

        const hydrated = await this.hydrateRows(rows || [])
        if (isPagination) {
          entry.posts = mergePosts(entry.posts, hydrated)
          if (rows?.length) {
            entry.oldestCreatedAt = rows[rows.length - 1].created_at
            entry.hasPaginated = true
          }
          entry.hasMore = (rows?.length || 0) === pageSize
        } else {
          entry.posts = hydrated
          entry.firstPageIds = hydrated.slice(0, pageSize).map((post) => post.id)
          entry.oldestCreatedAt = rows?.length ? rows[rows.length - 1].created_at : null
          entry.hasMore = (rows?.length || 0) === requestLimit
        }
        entry.loaded = true
        return { ok: true, posts: entry.posts }
      } catch (error) {
        console.error('[SocialFeed] Chargement impossible:', error)
        entry.warning =
          'Actualisation impossible. Les publications déjà chargées restent disponibles.'
        return { ok: false, error, posts: entry.posts }
      } finally {
        entry[loadingField] = false
      }
    },

    upsertPost(scope, post) {
      const entry = this.ensureScope(scope)
      entry.posts = mergePosts(entry.posts, [post], true)
      entry.firstPageIds = [post.id, ...entry.firstPageIds.filter((id) => id !== post.id)].slice(
        0,
        entry.pageSize
      )
      entry.loaded = true
      entry.warning = null
    },

    async addRealtimePost(row) {
      const matchingEntries = Object.values(this.entries).filter((entry) =>
        postMatchesFeedScope(row, entry.scope)
      )
      if (!matchingEntries.length) return

      try {
        const [post] = await this.hydrateRows([row])
        matchingEntries.forEach((entry) => {
          entry.posts = mergePosts(entry.posts, [post], true)
          entry.firstPageIds = [
            post.id,
            ...entry.firstPageIds.filter((id) => id !== post.id)
          ].slice(0, entry.pageSize)
          entry.loaded = true
        })
      } catch (error) {
        console.error('[SocialFeed] Événement Realtime incomplet:', error)
      }
    },

    removePost(postId) {
      if (!postId) return
      Object.values(this.entries).forEach((entry) => {
        entry.posts = entry.posts.filter((post) => post.id !== postId)
        entry.firstPageIds = entry.firstPageIds.filter((id) => id !== postId)
      })
      delete this.pendingMedia[postId]
    },

    async handleRealtimePostChange(payload) {
      if (payload.eventType === 'DELETE') {
        this.removePost(payload.old?.id)
        return
      }
      if (payload.eventType === 'UPDATE') this.removePost(payload.old?.id || payload.new?.id)
      await this.addRealtimePost(payload.new)
    },

    attachRealtimeMedia(media) {
      if (!media?.post_id || !media?.url) return
      let attached = false
      Object.values(this.entries).forEach((entry) => {
        const post = entry.posts.find((item) => item.id === media.post_id)
        if (!post) return
        post.media = [...new Set([...(post.media || []), media.url])]
        attached = true
      })

      if (attached) {
        delete this.pendingMedia[media.post_id]
        return
      }

      const pending = this.pendingMedia[media.post_id] || []
      if (!pending.some((item) => item.url === media.url)) {
        this.pendingMedia[media.post_id] = [...pending, media]
      }
      const pendingPostIds = Object.keys(this.pendingMedia)
      if (pendingPostIds.length > MAX_PENDING_MEDIA_POSTS) {
        delete this.pendingMedia[pendingPostIds[0]]
      }
    },

    setPublishing(scope, publishing) {
      this.ensureScope(scope).publishing = publishing
    },

    saveScroll(scope, scrollTop) {
      this.ensureScope(scope).scrollTop = Math.max(0, Number(scrollTop) || 0)
    }
  }
})
