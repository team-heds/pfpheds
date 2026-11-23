import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import HouseQuizSidebarPrompt from '@/components/gamification/HouseQuizSidebarPrompt.vue'

const { getMyHouseQuizStatus } = vi.hoisted(() => ({ getMyHouseQuizStatus: vi.fn() }))

vi.mock('@/service/gamificationServiceSupabase', () => ({
  default: { getMyHouseQuizStatus }
}))

const mountPrompt = async () => {
  const wrapper = mount(HouseQuizSidebarPrompt, {
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }
      }
    }
  })
  await flushPromises()
  return wrapper
}

describe('HouseQuizSidebarPrompt', () => {
  beforeEach(() => {
    getMyHouseQuizStatus.mockReset()
  })

  it('invite au quiz un joueur sans maison', async () => {
    getMyHouseQuizStatus.mockResolvedValue({ quiz_open: true })
    const wrapper = await mountPrompt()

    expect(wrapper.text()).toContain('Découvrir ma maison HES')
    expect(wrapper.find('a').attributes('href')).toBe('/hes-house-quiz')
  })

  it('reste masqué quand le quiz est fermé pour ce compte', async () => {
    getMyHouseQuizStatus.mockResolvedValue({ quiz_open: false })
    const wrapper = await mountPrompt()

    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('reste masqué si le serveur ne répond pas', async () => {
    getMyHouseQuizStatus.mockRejectedValue(new Error('indisponible'))
    const wrapper = await mountPrompt()

    expect(wrapper.find('a').exists()).toBe(false)
  })
})
