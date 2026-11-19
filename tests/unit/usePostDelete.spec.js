import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const { auth, feedStore, toast, confirm, deleteService } = vi.hoisted(() => ({
  auth: { user: { id: 'author' } },
  feedStore: { removePost: vi.fn() },
  toast: { add: vi.fn() },
  confirm: { require: vi.fn() },
  deleteService: { deletePost: vi.fn(async () => ({ id: 'post-1', files: 0, filesRemoved: true })) }
}))

vi.mock('@/stores/authStore', () => ({ useAuthStore: () => auth }))
vi.mock('@/stores/socialFeedStore', () => ({ useSocialFeedStore: () => feedStore }))
vi.mock('primevue/usetoast', () => ({ useToast: () => toast }))
vi.mock('primevue/useconfirm', () => ({ useConfirm: () => confirm }))
vi.mock('@/service/postDeleteService', () => deleteService)

import { usePostDelete } from '@/composables/usePostDelete'

function setup(post) {
  let api
  mount(defineComponent({ setup: () => ((api = usePostDelete(() => post)), () => h('div')) }))
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.user = { id: 'author' }
})

describe('usePostDelete', () => {
  it('ne demande rien et n’appelle pas le serveur pour une autre personne', async () => {
    auth.user = { id: 'someone-else' }
    const api = setup({ id: 'post-1', IdUser: 'author' })
    expect(api.canDelete.value).toBe(false)
    api.askDelete()
    await expect(api.remove()).resolves.toBe(false)
    expect(confirm.require).not.toHaveBeenCalled()
    expect(deleteService.deletePost).not.toHaveBeenCalled()
  })

  it('retire la publication de toutes les vues du fil après confirmation', async () => {
    const api = setup({ id: 'post-1', IdUser: 'author' })
    api.askDelete()
    await confirm.require.mock.calls[0][0].accept()
    expect(feedStore.removePost).toHaveBeenCalledWith('post-1')
    expect(api.deleting.value).toBe(false)
  })
})
