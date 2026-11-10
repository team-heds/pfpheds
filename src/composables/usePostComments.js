import { computed, onMounted, reactive, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import { useSocialFeedStore } from '@/stores/socialFeedStore'
import {
  buildCommentThreads,
  normalizeCommentText,
  removeCommentTree,
  upsertComments,
  validateCommentText
} from '@/service/postComments'
import {
  createPostComment,
  deletePostComment,
  fetchCommentCounts,
  fetchOwnCommentAuthor,
  fetchPostComments
} from '@/service/postCommentsService'

// Nom et photo de l'utilisateur connecté, chargés une fois pour toutes les publications.
const ownAuthorCache = new Map()

function newCommentId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/** Commentaires d'une publication du fil : chargement à la demande, envoi et suppression optimistes. */
export function usePostComments(getPost) {
  const authStore = useAuthStore()
  const feedStore = useSocialFeedStore()
  let toast = null
  try {
    toast = useToast()
  } catch {
    toast = null
  }

  const userId = computed(() => {
    const id = authStore.user?.id
    return id && id !== 'guest-user' ? id : null
  })

  const state = reactive({
    comments: [],
    count: Number(getPost().comments_count) || 0,
    expanded: false,
    loaded: false,
    loading: false,
    loadError: false
  })

  const threads = computed(() => buildCommentThreads(state.comments))

  function setCount(count) {
    state.count = Math.max(0, count)
    feedStore.setPostCommentCount?.(getPost().id, state.count)
  }

  // Compteur rechargé avec le fil : on l'adopte tant que la liste n'est pas ouverte.
  watch(
    () => getPost().comments_count,
    (count) => {
      if (count == null || state.loaded) return
      state.count = Number(count) || 0
    }
  )

  // Vues hors fil principal : charger le compteur s'il manque.
  onMounted(async () => {
    const post = getPost()
    if (post.comments_count != null || !post.id || !userId.value) return
    try {
      const counts = await fetchCommentCounts([post.id])
      state.count = counts[post.id] || 0
    } catch (error) {
      console.warn('[Feed] Nombre de commentaires indisponible:', error)
    }
  })

  async function load() {
    if (state.loading) return
    state.loading = true
    state.loadError = false
    try {
      const rows = await fetchPostComments(getPost().id)
      // Les commentaires encore en cours d'envoi restent affichés.
      const pending = state.comments.filter((c) => c.pending)
      state.comments = upsertComments(rows, pending)
      state.loaded = true
      setCount(state.comments.length)
    } catch (error) {
      console.error('[Feed] Commentaires indisponibles:', error)
      state.loadError = true
    } finally {
      state.loading = false
    }
  }

  async function expand() {
    state.expanded = true
    if (!state.loaded) await load()
  }

  function collapse() {
    state.expanded = false
  }

  async function ownAuthor() {
    const id = userId.value
    if (!ownAuthorCache.has(id)) {
      const fallbackName =
        authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || 'Vous'
      ownAuthorCache.set(
        id,
        fetchOwnCommentAuthor(id)
          .then((author) => ({
            display_name: author?.display_name || fallbackName,
            avatar_url: author?.avatar_url || feedStore.avatarCache[id] || null
          }))
          .catch(() => ({ display_name: fallbackName, avatar_url: feedStore.avatarCache[id] || null }))
      )
    }
    return ownAuthorCache.get(id)
  }

  function requireUser() {
    if (userId.value) return true
    toast?.add({ severity: 'info', summary: 'Connexion requise', detail: 'Connectez-vous pour commenter.', life: 3000 })
    return false
  }

  /** Envoie un commentaire ; retourne false (et garde le texte) si rien n'est parti ou si le serveur refuse. */
  async function add(text, parentId = null) {
    if (!requireUser()) return false
    const invalid = validateCommentText(text)
    if (invalid) {
      toast?.add({ severity: 'warn', summary: 'Commentaire non envoyé', detail: invalid, life: 3000 })
      return false
    }
    const content = normalizeCommentText(text)
    const author = await ownAuthor()
    const optimistic = {
      id: newCommentId(),
      post_id: getPost().id,
      parent_id: parentId,
      user_id: userId.value,
      content,
      created_at: new Date().toISOString(),
      display_name: author.display_name,
      avatar_url: author.avatar_url,
      pending: true
    }
    state.expanded = true
    state.comments = upsertComments(state.comments, [optimistic])
    setCount(state.count + 1)

    try {
      const saved = await createPostComment({ id: optimistic.id, postId: optimistic.post_id, parentId, content })
      state.comments = upsertComments(state.comments, [{ ...saved, pending: false }])
      return true
    } catch (error) {
      console.error('[Feed] Commentaire refusé:', error)
      state.comments = removeCommentTree(state.comments, optimistic.id).list
      setCount(state.count - 1)
      toast?.add({
        severity: 'error',
        summary: 'Commentaire non publié',
        detail: 'Le serveur n’a pas accepté le commentaire. Votre texte est conservé, réessayez.',
        life: 4500
      })
      return false
    }
  }

  async function remove(comment) {
    if (!requireUser() || comment.user_id !== userId.value || comment.pending) return false
    const { list, removed } = removeCommentTree(state.comments, comment.id)
    state.comments = list
    setCount(state.count - removed.length)
    try {
      await deletePostComment(comment.id)
      return true
    } catch (error) {
      console.error('[Feed] Suppression refusée:', error)
      state.comments = upsertComments(state.comments, removed)
      setCount(state.count + removed.length)
      toast?.add({
        severity: 'error',
        summary: 'Commentaire non supprimé',
        detail: 'Le serveur n’a pas accepté la suppression. Réessayez dans un instant.',
        life: 4000
      })
      return false
    }
  }

  return {
    state,
    threads,
    userId,
    canComment: computed(() => Boolean(userId.value)),
    expand,
    collapse,
    load,
    add,
    remove
  }
}
