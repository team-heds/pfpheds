import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  replaceUserAvatar: vi.fn(),
  fetchProfile: vi.fn(),
  checkAuthState: vi.fn(),
  listenEvents: vi.fn()
}))

vi.mock('@/service/supabaseStorageService', () => ({
  default: { replaceUserAvatar: (...args) => mocks.replaceUserAvatar(...args) }
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', email: 'student@hevs.ch' },
    isFirebaseUser: false,
    isSupabaseUser: true,
    checkAuthState: mocks.checkAuthState
  })
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => ({
    user: { id: 'user-1' },
    fetchProfile: mocks.fetchProfile
  })
}))

vi.mock('@/stores/eventStore', () => ({
  useEventStore: () => ({ events: [], listenEvents: mocks.listenEvents })
}))

vi.mock('@/supabase.js', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { forname: 'Test', family_name: 'Student', avatar_url: null, email: 'student@hevs.ch' },
            error: null
          })
        })
      })
    })
  }
}))

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(),
  ref: vi.fn(),
  get: vi.fn(),
  onValue: vi.fn()
}))

import LeftSidebar from '@/components/social/library/LeftSidebar.vue'

describe('LeftSidebar avatar Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.checkAuthState.mockResolvedValue()
    mocks.fetchProfile.mockResolvedValue()
    mocks.replaceUserAvatar.mockResolvedValue({ url: 'https://cdn.test/avatar.png' })
  })

  it('utilise le service partagé et actualise le profil global', async () => {
    const wrapper = shallowMount(LeftSidebar, {
      global: {
        stubs: {
          Toast: { template: '<div />', methods: { add: vi.fn() } },
          QuestsSidebarCard: true,
          EventDetail: true,
          UserCard: true
        }
      }
    })
    await vi.dynamicImportSettled()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const event = { target: { files: [file], value: 'avatar.png' } }

    await wrapper.vm.onAvatarSelected(event)

    expect(mocks.replaceUserAvatar).toHaveBeenCalledWith('user-1', file)
    expect(mocks.fetchProfile).toHaveBeenCalledOnce()
    expect(wrapper.vm.user.PhotoURL).toBe('https://cdn.test/avatar.png')
    expect(event.target.value).toBe('')
    expect(wrapper.vm.avatarUploading).toBe(false)
  })

  it("restaure l'interface si l'upload échoue", async () => {
    mocks.replaceUserAvatar.mockRejectedValue(new Error('RLS denied'))
    const wrapper = shallowMount(LeftSidebar, {
      global: {
        stubs: {
          Toast: { template: '<div />', methods: { add: vi.fn() } },
          QuestsSidebarCard: true,
          EventDetail: true,
          UserCard: true
        }
      }
    })
    await vi.dynamicImportSettled()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const event = { target: { files: [file], value: 'avatar.png' } }

    await wrapper.vm.onAvatarSelected(event)

    expect(mocks.fetchProfile).not.toHaveBeenCalled()
    expect(event.target.value).toBe('')
    expect(wrapper.vm.avatarUploading).toBe(false)
  })
})
