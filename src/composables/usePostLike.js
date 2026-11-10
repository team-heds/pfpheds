import { computed, onMounted, reactive, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import { useSocialFeedStore } from '@/stores/socialFeedStore'
import { createLikeController, formatLikeCount } from '@/service/postLikes'
import { fetchLikeSummaries, likePost, unlikePost } from '@/service/postLikesService'

/** État « J'aime » d'une publication du fil, avec mise à jour optimiste. */
export function usePostLike(getPost) {
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

  const view = reactive({
    liked: Boolean(getPost().liked_by_me),
    count: Number(getPost().likes_count) || 0,
    pending: false
  })

  const controller = createLikeController({
    liked: view.liked,
    count: view.count,
    like: () => likePost(getPost().id, userId.value),
    unlike: () => unlikePost(getPost().id, userId.value),
    onChange: (state) => {
      Object.assign(view, state)
      if (!state.pending) feedStore.setPostLike(getPost().id, { liked: state.liked, count: state.count })
    },
    onError: (error) => {
      console.error('[Feed] J’aime refusé:', error)
      toast?.add({
        severity: 'error',
        summary: 'J’aime non enregistré',
        detail: 'Le serveur n’a pas accepté la modification. Réessayez dans un instant.',
        life: 4000
      })
    }
  })

  // Données serveur rechargées (actualisation du fil) : on les adopte hors envoi.
  watch(
    () => [getPost().liked_by_me, getPost().likes_count],
    ([liked, count]) => {
      if (liked == null || count == null) return
      if (liked === view.liked && Number(count) === view.count) return
      controller.sync({ liked, count })
    }
  )

  // Vues hors fil principal (communautés, mentions) : charger l'état si absent.
  onMounted(async () => {
    const post = getPost()
    if (post.liked_by_me != null && post.likes_count != null) return
    if (!post.id || !userId.value) return
    try {
      const summary = (await fetchLikeSummaries([post.id]))[post.id]
      if (summary) controller.sync(summary)
    } catch (error) {
      console.warn('[Feed] État des j’aime indisponible:', error)
    }
  })

  function requireUser() {
    if (userId.value) return true
    toast?.add({ severity: 'info', summary: 'Connexion requise', detail: 'Connectez-vous pour aimer une publication.', life: 3000 })
    return false
  }

  return {
    view,
    canLike: computed(() => Boolean(userId.value)),
    countLabel: computed(() => formatLikeCount(view.count)),
    toggle: () => (requireUser() ? controller.toggle() : Promise.resolve(false)),
    like: () => (requireUser() ? controller.like() : Promise.resolve(false))
  }
}
