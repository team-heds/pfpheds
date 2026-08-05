import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SocialThreeColumnLayout from '@/components/common/layouts/SocialThreeColumnLayout.vue'

describe('SocialThreeColumnLayout', () => {
  it('keeps the two sidebars around the main content by default', () => {
    const wrapper = mount(SocialThreeColumnLayout, {
      slots: {
        left: '<p>Profil</p>',
        default: '<main>Contenu</main>',
        right: '<p>Communautés</p>',
      },
    })

    expect(wrapper.findAll('aside')).toHaveLength(2)
    expect(wrapper.get('.social-layout__main').text()).toBe('Contenu')
  })

  it('removes both sidebars in embedded single-column mode', () => {
    const wrapper = mount(SocialThreeColumnLayout, {
      props: { singleColumn: true },
      slots: { default: '<main>Profil intégré</main>' },
    })

    expect(wrapper.get('.social-layout').classes()).toContain('social-layout--single')
    expect(wrapper.find('aside').exists()).toBe(false)
  })
})
