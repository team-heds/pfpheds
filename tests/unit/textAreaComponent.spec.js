import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import TextAreaComponent from '@/components/social/library/TextAreaComponent.vue'

const wrappers = []

function mountEditor(props = {}) {
  const wrapper = mount(TextAreaComponent, {
    props: {
      modelValue: '',
      ...props
    },
    attachTo: document.body
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
})

describe('TextAreaComponent', () => {
  it('affiche le contenu initial et son compteur', () => {
    const wrapper = mountEditor({ modelValue: '<p>Bonjour</p>' })

    expect(wrapper.vm.editor.getText()).toBe('Bonjour')
    expect(wrapper.get('.custom-editor').attributes('aria-label')).toBe('Commencer un post...')
    expect(wrapper.get('.char-counter').text()).toBe('7/1000')
  })

  it('émet le HTML avec le contrat historique lors de la saisie', async () => {
    const wrapper = mountEditor({ modelValue: '<p>Bonjour</p>' })

    wrapper.vm.editor.chain().focus('end').insertContent(' !').run()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toContain('Bonjour !')
    expect(wrapper.emitted('input')?.at(-1)?.[0]).toContain('Bonjour !')
    expect(wrapper.get('.char-counter').text()).toBe('9/1000')
  })

  it('refuse une transaction qui dépasse la limite de caractères', async () => {
    const wrapper = mountEditor({ modelValue: '<p>1234</p>', maxLength: 5 })

    wrapper.vm.editor.chain().focus('end').insertContent('56').run()
    await nextTick()

    expect(wrapper.vm.editor.getText()).toBe('1234')
    expect(wrapper.get('.char-counter').text()).toBe('4/5')
  })

  it('expose une barre d’outils accessible et respecte l’état désactivé', () => {
    const wrapper = mountEditor({ disabled: true })
    const toolbar = wrapper.get('[role="toolbar"]')
    const buttons = toolbar.findAll('button')

    expect(toolbar.attributes('aria-label')).toBe('Mise en forme du texte')
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons.every(button => button.attributes('type') === 'button')).toBe(true)
    expect(buttons.every(button => button.attributes('aria-label'))).toBe(true)
    expect(buttons.every(button => button.attributes('disabled') !== undefined)).toBe(true)
    expect(wrapper.vm.editor.isEditable).toBe(false)
  })

  it('synchronise une nouvelle valeur reçue du parent sans réémettre', async () => {
    const wrapper = mountEditor({ modelValue: '<p>Avant</p>' })

    await wrapper.setProps({ modelValue: '<p>Après</p>' })
    await nextTick()

    expect(wrapper.vm.editor.getText()).toBe('Après')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
