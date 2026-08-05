import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import FormField from '@/components/common/forms/FormField.vue'
import FormStatus from '@/components/common/forms/FormStatus.vue'

describe('shared form system', () => {
  it('relie automatiquement le champ à son aide et à son erreur', () => {
    const wrapper = mount(FormField, {
      props: {
        forId: 'email',
        label: 'Email',
        required: true,
        hint: 'Adresse institutionnelle',
        error: 'Adresse invalide'
      },
      slots: {
        default: ({ controlAttrs }) => h('input', controlAttrs)
      }
    })

    const input = wrapper.get('input')
    const describedBy = input.attributes('aria-describedby').split(' ')
    expect(input.attributes('id')).toBe('email')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-required')).toBe('true')
    expect(describedBy).toHaveLength(2)
    expect(wrapper.get(`#${describedBy[0]}`).text()).toBe('Adresse institutionnelle')
    expect(wrapper.get(`#${describedBy[1]}`).attributes('role')).toBe('alert')
  })

  it('annonce les échecs de soumission de manière assertive', () => {
    const wrapper = mount(FormStatus, {
      props: { status: 'error', title: 'Échec', message: 'Réessayez.' }
    })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.attributes('aria-live')).toBe('assertive')
    expect(wrapper.text()).toContain('Réessayez.')
  })
})
