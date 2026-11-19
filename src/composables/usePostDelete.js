import { computed, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import { useSocialFeedStore } from '@/stores/socialFeedStore'
import { canDeletePost } from '@/service/postPermissions'
import { deletePost } from '@/service/postDeleteService'

const CONFIRM_MESSAGE =
  'Elle disparaîtra du fil avec ses photos, ses commentaires et ses j’aime. Cette action est définitive.'

/**
 * Retrait d'une publication du fil par son auteur (carte bureau et carte mobile) :
 * confirmation, retrait côté serveur, puis retrait de toutes les vues du fil sans recharger.
 * Le bouton n'est montré qu'à l'auteur ; la base applique la même règle (RLS).
 */
export function usePostDelete(getPost, { onDeleted } = {}) {
  const authStore = useAuthStore()
  const feedStore = useSocialFeedStore()
  let confirm = null
  let toast = null
  try {
    confirm = useConfirm()
  } catch {
    confirm = null
  }
  try {
    toast = useToast()
  } catch {
    toast = null
  }

  const deleting = ref(false)
  const canDelete = computed(() => canDeletePost(getPost(), authStore.user?.id))

  async function remove() {
    const post = getPost()
    if (deleting.value || !canDeletePost(post, authStore.user?.id)) return false
    deleting.value = true
    try {
      await deletePost(post)
      feedStore.removePost(post.id)
      onDeleted?.(post.id)
      toast?.add({ severity: 'success', summary: 'Publication supprimée', life: 2500 })
      return true
    } catch (error) {
      console.error('[Feed] Suppression de la publication refusée:', error)
      toast?.add({
        severity: 'error',
        summary: 'Publication non supprimée',
        detail: 'Le serveur n’a pas accepté la suppression. Réessayez dans un instant.',
        life: 4500
      })
      return false
    } finally {
      deleting.value = false
    }
  }

  function askDelete() {
    if (!canDelete.value || deleting.value) return
    if (!confirm) {
      if (window.confirm(`Supprimer la publication ? ${CONFIRM_MESSAGE}`)) void remove()
      return
    }
    confirm.require({
      header: 'Supprimer la publication ?',
      message: CONFIRM_MESSAGE,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptClass: 'p-button-danger',
      defaultFocus: 'reject',
      accept: remove
    })
  }

  return { canDelete, deleting, askDelete, remove }
}
