import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const colorScheme = ref('dim')

vi.mock('@/layout/composables/layout', () => ({
  useLayout: () => ({
    layoutConfig: { colorScheme }
  })
}))

import SwitchColor from '@/components/ui/buttons/SwitchColor.vue'

describe('SwitchColor production bundle fallback', () => {
  beforeEach(() => {
    colorScheme.value = 'dim'
    document.head.insertAdjacentHTML(
      'beforeend',
      '<link data-theme-link="heds" data-theme-scheme="light" rel="stylesheet" media="not all">'
    )
  })

  afterEach(() => {
    document.querySelectorAll('link[data-theme-link="heds"]').forEach((link) => link.remove())
  })

  it('switches to light and back to the bundled dim theme', async () => {
    const wrapper = mount(SwitchColor)
    const lightLink = document.querySelector('link[data-theme-scheme="light"]')

    expect(colorScheme.value).toBe('dim')

    await wrapper.get('button').trigger('click')
    expect(colorScheme.value).toBe('light')
    expect(lightLink.media).toBe('all')
    expect(lightLink.disabled).toBe(false)

    await wrapper.get('button').trigger('click')
    expect(colorScheme.value).toBe('dim')
    expect(lightLink.media).toBe('not all')
    expect(lightLink.disabled).toBe(true)

    wrapper.unmount()
  })
})
