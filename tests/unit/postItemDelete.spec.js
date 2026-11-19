import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const { auth, feedStore, toast, confirm, deleteService } = vi.hoisted(() => ({
  auth: { user: { id: 'author' } },
  feedStore: { removePost: vi.fn() },
  toast: { add: vi.fn() },
  confirm: { require: vi.fn() },
  deleteService: { deletePost: vi.fn() }
}))

vi.mock('@/stores/authStore', () => ({ useAuthStore: () => auth }))
vi.mock('@/stores/socialFeedStore', () => ({ useSocialFeedStore: () => feedStore }))
vi.mock('primevue/usetoast', () => ({ useToast: () => toast }))
vi.mock('primevue/useconfirm', () => ({ useConfirm: () => confirm }))
vi.mock('@/service/postDeleteService', () => deleteService)
vi.mock('@/composables/usePostLike', async () => {
  const { computed, reactive } = await import('vue')
  return {
    usePostLike: () => ({
      view: reactive({ liked: false, count: 0 }),
      canLike: computed(() => true),
      countLabel: computed(() => ''),
      toggle: vi.fn(),
      like: vi.fn()
    })
  }
})

import PostItem from '@/components/social/library/PostItem.vue'

// Menu PrimeVue simplifié : chaque entrée devient un bouton.
const MenuStub = defineComponent({
  props: { model: { type: Array, default: () => [] } },
  setup(props, { expose }) {
    expose({ toggle: () => {} })
    return () =>
      h(
        'div',
        { class: 'menu-stub' },
        props.model.map((item) => h('button', { class: 'menu-item', onClick: () => item.command?.() }, item.label))
      )
  }
})

const post = reactive({ id: 'post-1', IdUser: 'author', Author: 'Anthony', Content: '<p>Bonjour</p>', Timestamp: Date.now() })

function mountItem(props = { post }) {
  return mount(PostItem, {
    props,
    global: {
      stubs: {
        Menu: MenuStub,
        PostComments: true,
        PostLikersDialog: true,
        'router-link': { template: '<a><slot /></a>' }
      }
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.user = { id: 'author' }
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('PostItem : suppression', () => {
  it('montre le menu « ⋯ » à l’auteur seulement', () => {
    expect(mountItem().find('.post-menu-button').exists()).toBe(true)
    auth.user = { id: 'someone-else' }
    expect(mountItem().find('.post-menu-button').exists()).toBe(false)
    auth.user = null
    expect(mountItem().find('.post-menu-button').exists()).toBe(false)
  })

  it('demande confirmation avant de supprimer', async () => {
    const wrapper = mountItem()
    await wrapper.find('.menu-item').trigger('click')
    expect(confirm.require).toHaveBeenCalledTimes(1)
    expect(confirm.require.mock.calls[0][0]).toMatchObject({ acceptLabel: 'Supprimer', defaultFocus: 'reject' })
    expect(deleteService.deletePost).not.toHaveBeenCalled()
  })

  it('retire la publication du fil après confirmation', async () => {
    deleteService.deletePost.mockResolvedValueOnce({ id: 'post-1', files: 0, filesRemoved: true })
    const wrapper = mountItem()
    await wrapper.find('.menu-item').trigger('click')
    await confirm.require.mock.calls[0][0].accept()
    await flushPromises()
    expect(deleteService.deletePost).toHaveBeenCalledWith(post)
    expect(feedStore.removePost).toHaveBeenCalledWith('post-1')
    expect(wrapper.emitted('deleted')).toEqual([['post-1']])
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
  })

  it('garde la publication et prévient si la suppression échoue', async () => {
    deleteService.deletePost.mockRejectedValueOnce(new Error('refusé'))
    const wrapper = mountItem()
    await wrapper.find('.menu-item').trigger('click')
    await confirm.require.mock.calls[0][0].accept()
    await flushPromises()
    expect(feedStore.removePost).not.toHaveBeenCalled()
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Publication non supprimée' })
    )
    expect(wrapper.find('.post-item').classes()).not.toContain('is-deleting')
  })
})
