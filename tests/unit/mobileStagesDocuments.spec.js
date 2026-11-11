import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import FilterSidebar from '@/components/common/filters/FilterSidebar.vue'

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8')

function mountSidebar(props = {}) {
  return mount(FilterSidebar, {
    props: {
      cantons: ['FR', 'VS'],
      filters: { cantons: ['VS'], criter: ['MSQ'], languages: [], pfp: [] },
      searchTerm: '',
      resultCount: 12,
      idPrefix: 'test-mobile-filters',
      ...props,
    },
    global: { stubs: { Checkbox: true, InputText: true } },
  })
}

describe('stages, carte et documents sur téléphone', () => {
  it('replie les filtres derrière un bouton qui annonce son état et le nombre de filtres actifs', async () => {
    const wrapper = mountSidebar()
    const toggle = wrapper.get('.filter-toggle')
    const groups = wrapper.get('.filter-groups')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBe(groups.attributes('id'))
    expect(groups.classes()).toContain('filter-groups--collapsed')
    expect(toggle.text()).toContain('Afficher les filtres')
    expect(wrapper.get('.filter-toggle__count').text()).toBe('2')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(groups.classes()).not.toContain('filter-groups--collapsed')
    expect(toggle.text()).toContain('Masquer les filtres')
  })

  it('ne replie les filtres que sur petit écran (la colonne ordinateur reste ouverte)', () => {
    const source = readSource('src/components/common/filters/FilterSidebar.vue')
    const beforeMobile = source.slice(source.indexOf('<style'), source.indexOf('@media (max-width:63.99rem)'))

    expect(beforeMobile).toContain('.filter-toggle { display:none; }')
    expect(beforeMobile).not.toContain('.filter-groups--collapsed')
  })

  it('affiche les communautés en fiches plutôt qu’en tableau large', () => {
    const source = readSource('src/views/social/CommunitiesView.vue')
    expect(source).not.toContain('responsiveLayout="scroll"')
    expect(source.match(/responsiveLayout="stack" breakpoint="640px"/g)).toHaveLength(2)
  })

  it('laisse la page Documents défiler seule sur téléphone', () => {
    const source = readSource('src/views/home/DocumentsView.vue')
    const block = source.slice(source.indexOf('Téléphone : un seul défilement'))
    expect(block).toContain('.scrollable-container')
    expect(block).toContain('overflow: visible')
    expect(block).toContain('-webkit-line-clamp: 2')
  })
})
