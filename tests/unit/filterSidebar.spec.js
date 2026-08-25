import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FilterSidebar from '@/components/common/filters/FilterSidebar.vue'

function mountSidebar(props = {}) {
  return shallowMount(FilterSidebar, {
    props: {
      cantons: ['FR', 'VS'],
      filters: { cantons: ['VS'], criter: ['MSQ'], languages: [], pfp: [] },
      searchTerm: 'Sion',
      resultCount: 12,
      idPrefix: 'test-institutions',
      ...props,
    },
  })
}

describe('FilterSidebar', () => {
  it('announces the result count and renders the shared filter families', () => {
    const wrapper = mountSidebar()

    expect(wrapper.get('[role="status"]').text()).toBe('12 institutions')
    expect(wrapper.findAll('fieldset')).toHaveLength(4)
    expect(wrapper.text()).toContain('Canton')
    expect(wrapper.text()).toContain('Critères')
    expect(wrapper.text()).toContain('PFP')
    expect(wrapper.text()).toContain('Langue')
  })

  it('emits a complete filter state when an active chip is removed', async () => {
    const wrapper = mountSidebar()
    const cantonChip = wrapper.findAll('.filter-chip').find((chip) => chip.text().includes('VS'))

    await cantonChip.trigger('click')

    expect(wrapper.emitted('update:filters')).toEqual([[
      { cantons: [], criter: ['MSQ'], languages: [], pfp: [] },
    ]])
  })

  it('exposes one reset action for search and filters', async () => {
    const wrapper = mountSidebar()

    await wrapper.get('.clear-button').trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('disables reset when neither search nor filters are active', () => {
    const wrapper = mountSidebar({
      filters: { cantons: [], criter: [], languages: [], pfp: [] },
      searchTerm: '',
    })

    expect(wrapper.get('.clear-button').attributes('disabled')).toBeDefined()
  })
})
