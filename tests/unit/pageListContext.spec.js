import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, reactive, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createPageListContextCache, disposePageListContexts, usePageListContext } from '@/composables/usePageListContext'

vi.mock('@/stores/authStore', () => ({ useAuthStore: () => { throw new Error('Explicit test auth required') } }))

describe('contexte mémoire des listes', () => {
  const wrappers = []
  afterEach(() => { wrappers.forEach(wrapper => wrapper.unmount()); wrappers.length = 0; disposePageListContexts() })

  it('sépare les comptes et supprime les données au changement de compte ou à la déconnexion', () => {
    const cache = createPageListContextCache()
    cache.activateAccount('first')
    cache.write('first', 'institutions', { search: 'Bulle' })
    expect(cache.read('other', 'institutions')).toBeUndefined()
    cache.activateAccount('other')
    expect(cache.read('other', 'institutions')).toBeUndefined()
    cache.activateAccount('first')
    expect(cache.read('first', 'institutions')).toBeUndefined()
    cache.write('first', 'institutions', { search: 'Sion' })
    cache.activateAccount(null)
    cache.activateAccount('first')
    expect(cache.read('first', 'institutions')).toBeUndefined()
  })

  it('borne le cache et rend des copies indépendantes, y compris pour les dossiers ouverts', () => {
    const cache = createPageListContextCache({ maxEntries: 2 })
    cache.activateAccount('student')
    cache.write('student', 'one', { folders: new Set(['pfp1']) })
    cache.write('student', 'two', { search: 'test' })
    const restored = cache.read('student', 'one')
    restored.folders.add('private-change')
    cache.write('student', 'three', { search: 'last' })
    expect(cache.read('student', 'two')).toBeUndefined()
    expect(cache.read('student', 'one').folders).toEqual(new Set(['pfp1']))
  })

  it('refuse un contexte trop volumineux', () => {
    const cache = createPageListContextCache({ maxCharacters: 30 })
    cache.activateAccount('student')
    cache.write('student', 'oversized', { search: 'x'.repeat(100) })
    expect(cache.read('student', 'oversized')).toBeUndefined()
  })

  function mountList(auth, key = 'institutions') {
    let state
    const wrapper = mount(defineComponent({
      setup() {
        const searchTerm = ref('')
        const filters = ref({ cantons: [] })
        const folders = ref(new Set())
        const { restored } = usePageListContext(key, { searchTerm, filters, folders }, { authStore: auth })
        state = { searchTerm, filters, folders, restored }
        return () => null
      },
    }))
    wrappers.push(wrapper)
    return { wrapper, state }
  }

  it('retrouve les filtres et dossiers après démontage puis retour dans la liste', () => {
    const auth = reactive({ user: { id: 'student' } })
    const first = mountList(auth)
    first.state.searchTerm.value = 'Meyriez'
    first.state.filters.value.cantons.push('FR')
    first.state.folders.value.add('CPT')
    first.wrapper.unmount()
    const second = mountList(auth)
    expect(second.state.restored.value).toBe(true)
    expect(second.state.searchTerm.value).toBe('Meyriez')
    expect(second.state.filters.value.cantons).toEqual(['FR'])
    expect(second.state.folders.value).toEqual(new Set(['CPT']))
  })

  it('efface le cache à la déconnexion même lorsque les listes ne sont plus montées', async () => {
    const auth = reactive({ user: { id: 'student' } })
    const first = mountList(auth)
    first.state.searchTerm.value = 'Meyriez'
    first.wrapper.unmount()
    auth.user = null
    auth.user = { id: 'student' }
    await nextTick()
    const second = mountList(auth)
    expect(second.state.restored.value).toBe(false)
    expect(second.state.searchTerm.value).toBe('')
  })

  it('réinitialise immédiatement les contrôles d’une liste encore montée lors d’un changement de compte', () => {
    const auth = reactive({ user: { id: 'first' } })
    const first = mountList(auth)
    first.state.searchTerm.value = 'Recherche du premier compte'
    first.state.filters.value.cantons.push('VS')
    auth.user = { id: 'second' }
    expect(first.state.searchTerm.value).toBe('')
    expect(first.state.filters.value.cantons).toEqual([])
    first.wrapper.unmount()
    const second = mountList(auth)
    expect(second.state.searchTerm.value).toBe('')
  })
})
