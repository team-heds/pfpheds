import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminDashboardFilters from '@/components/admin/widgets/AdminDashboardFilters.vue'

const catalog = {
  options: {
    classes: [{ value: 'BA25', label: 'BA25' }],
    pfpTypes: [{ value: 'PFP2', label: 'PFP2' }],
  },
}
const global = {
  stubs: {
    Button: {
      props: ['label', 'ariaExpanded'],
      emits: ['click'],
      template: '<button :data-label="label" :aria-expanded="ariaExpanded" @click="$emit(\'click\')">{{ label }}</button>',
    },
    Dialog: {
      props: ['visible'],
      template: '<div v-if="visible" data-dialog><slot/><slot name="footer"/></div>',
    },
    Message: { template: '<div><slot/></div>' },
    MultiSelect: true,
  },
}

describe('AdminDashboardFilters', () => {
  it('expose un déclencheur nommé, son état et les filtres actifs supprimables', async () => {
    const wrapper = shallowMount(AdminDashboardFilters, {
      props: {
        catalog,
        modelValue: { class: ['BA25'] },
        activeFilters: [{ key: 'class', value: 'BA25', id: 'class:BA25', label: 'BA25' }],
      },
      global,
    })
    const trigger = wrapper.find('button[data-label="Filtres (1)"]')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')
    expect(wrapper.find('[data-dialog]').exists()).toBe(true)
    expect(trigger.attributes('aria-expanded')).toBe('true')

    const remove = wrapper.find('button[aria-label="Supprimer le filtre BA25"]')
    await remove.trigger('click')
    expect(wrapper.emitted('remove')).toEqual([['class', 'BA25']])
  })

  it('applique une copie du modèle et propose une réinitialisation native', async () => {
    const wrapper = shallowMount(AdminDashboardFilters, {
      props: {
        catalog,
        modelValue: { pfp: ['PFP2'] },
        activeFilters: [{ key: 'pfp', value: 'PFP2', id: 'pfp:PFP2', label: 'PFP2' }],
      },
      global,
    })
    await wrapper.find('button[data-label="Filtres (1)"]').trigger('click')
    await wrapper.find('button[data-label="Appliquer les filtres"]').trigger('click')
    expect(wrapper.emitted('apply')).toEqual([[{ pfp: ['PFP2'] }]])

    await wrapper.find('button[data-label="Réinitialiser"]').trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
