import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const state = vi.hoisted(() => ({ rows: [], user: { id: 'student-1' } }))

vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ user: state.user }) }))
vi.mock('@/supabase', () => {
  const query = {
    select: () => query,
    eq: () => query,
    then: (resolve) => resolve({ data: state.rows, error: null }),
  }
  return { supabase: { from: vi.fn(() => query) } }
})

import ContactInstitutionNotice from '@/components/user/details/ContactInstitutionNotice.vue'
import { supabase } from '@/supabase'

const DialogStub = {
  props: ['visible'],
  template: '<div v-if="visible" data-test="notice"><slot /><slot name="footer" /></div>',
}
const ButtonStub = {
  props: ['label'],
  emits: ['click'],
  template: '<button @click="$emit(\'click\')">{{ label }}</button>',
}
const render = async (userId = 'student-1') => {
  const wrapper = mount(ContactInstitutionNotice, {
    props: { userId },
    global: { stubs: { Dialog: DialogStub, Button: ButtonStub } },
  })
  await flushPromises()
  return wrapper
}

describe('ContactInstitutionNotice', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers({ now: new Date(2026, 10, 23), toFake: ['Date'] })
    state.rows = [{ id: 'a1', status: 'published', year: '2027', is_validated: false }]
  })

  it('affiche le rappel puis le retient après « J\'ai compris »', async () => {
    const wrapper = await render()
    expect(wrapper.find('[data-test="notice"]').text()).toContain('ne pas contacter')

    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[data-test="notice"]').exists()).toBe(false)

    const next = await render()
    expect(next.find('[data-test="notice"]').exists()).toBe(false)
  })

  it('réapparaît pour une nouvelle affectation', async () => {
    const wrapper = await render()
    await wrapper.find('button').trigger('click')
    state.rows = [...state.rows, { id: 'a2', status: 'published', year: '2027', is_validated: false }]

    const next = await render()
    expect(next.find('[data-test="notice"]').exists()).toBe(true)
  })

  it('reste masqué une fois le go du répondant donné', async () => {
    state.rows = [{ id: 'a1', status: 'published', year: '2027', is_validated: true }]
    const wrapper = await render()
    expect(wrapper.find('[data-test="notice"]').exists()).toBe(false)
  })

  it('ne s\'affiche pas sur le profil d\'une autre personne', async () => {
    const wrapper = await render('student-2')
    expect(wrapper.find('[data-test="notice"]').exists()).toBe(false)
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
