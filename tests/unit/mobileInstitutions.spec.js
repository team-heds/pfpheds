import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/supabase.js', () => ({ supabase: {} }))

import InstitutionCard from '@/mobile/institutions/InstitutionCard.vue'
import { CRITERIA, indexPlacesById, splitCriteria } from '@/mobile/institutions/myStagesService'
import { useMobileInstitutionsStore } from '@/mobile/institutions/mobileInstitutionsStore'
import {
  activeFilterChips,
  buildFilterGroups,
  buildInstitutionFiles,
  countActiveFilters,
  directionsUrl,
  emptyFilters,
  formatStagePeriod,
  formatWebsiteUrl,
  indexOffers,
  languageLabel,
  stageStatus,
  summarizeOffer,
  toggleFilter,
} from '@/mobile/institutions/institutionHelpers'

describe('filtres des institutions (mobile)', () => {
  it('propose stage, domaine, langue et canton, avec des libellés lisibles', () => {
    const groups = buildFilterGroups(['VD', 'VS'])
    expect(groups.map((group) => group.label)).toEqual(['Stage', 'Domaine', 'Langue', 'Canton'])
    expect(groups[1].options.find((option) => option.value === 'MSQ')).toEqual({ value: 'MSQ', label: 'MSQ', hint: 'Musculo-squelettique' })
    expect(groups[2].options[0]).toEqual({ value: 'FR', label: 'Français' })
    expect(groups[3].options.map((option) => option.value)).toEqual(['VD', 'VS'])
  })

  it('ajoute et retire un filtre sans toucher à l’objet d’origine', () => {
    const start = emptyFilters()
    const withPfp = toggleFilter(start, 'pfp', 'PFP2')
    expect(start.pfp).toEqual([])
    expect(withPfp.pfp).toEqual(['PFP2'])
    expect(toggleFilter(withPfp, 'pfp', 'PFP2').pfp).toEqual([])
    expect(countActiveFilters(toggleFilter(withPfp, 'cantons', 'VS'))).toBe(2)
  })

  it('rappelle les filtres actifs en pastilles', () => {
    expect(activeFilterChips({ pfp: ['PFP2'], languages: ['DE'], cantons: ['VS'], criter: [] })).toEqual([
      { group: 'pfp', value: 'PFP2', label: 'PFP2' },
      { group: 'languages', value: 'DE', label: 'Allemand' },
      { group: 'cantons', value: 'VS', label: 'VS' },
    ])
  })

  it('garde recherche et filtres dans le magasin de l’onglet', () => {
    setActivePinia(createPinia())
    const store = useMobileInstitutionsStore()
    store.searchTerm = 'sion'
    store.toggle('criter', 'MSQ')
    expect(store.filters.criter).toEqual(['MSQ'])
    store.clearFilters()
    expect(store.searchTerm).toBe('sion')
    store.toggle('pfp', 'PFP1A')
    store.clearAll()
    expect(store.searchTerm).toBe('')
    expect(countActiveFilters(store.filters)).toBe(0)
  })
})

describe('offre et documents d’une institution', () => {
  const places = [
    { InstitutionId: 7, NomPlace: 'Neuro', MSQ: true, FR: 'true', PFP2: 3, fileurl: 'https://x/neuro.pdf' },
    { InstitutionId: 7, NomPlace: 'Ortho', REHAB: 1, DE: true, PFP1A: '0', PFP3: 'oui' },
    { InstitutionId: 9, NomPlace: 'Cabinet', AMBU: true },
  ]

  it('résume domaines, langues et stages proposés', () => {
    expect(summarizeOffer(places.slice(0, 2))).toEqual({ criteria: ['MSQ', 'REHAB'], languages: ['FR', 'DE'], pfp: ['PFP2', 'PFP3'] })
    const offers = indexOffers(places)
    expect(offers.get('9').criteria).toEqual(['AMBU'])
    expect(offers.get('7').pfp).toEqual(['PFP2', 'PFP3'])
  })

  it('liste les documents des places puis le document commun, sans doublon', () => {
    const files = buildInstitutionFiles({ CyberleanURL: ' https://x/concept.pdf ' }, places.slice(0, 2))
    expect(files).toEqual([
      { name: 'Neuro', url: 'https://x/neuro.pdf', isGlobal: false },
      { name: 'Ortho', url: 'https://x/concept.pdf', isGlobal: true },
    ])
    expect(buildInstitutionFiles({}, [{ NomPlace: 'Sans lien' }])).toEqual([])
    expect(buildInstitutionFiles({ CyberlearnURL: 'https://x/c.pdf' }, [])).toEqual([
      { name: 'Concept de formation pratique', url: 'https://x/c.pdf', isGlobal: true },
    ])
  })

  it('écrit la langue en toutes lettres', () => {
    expect(languageLabel('FR')).toBe('Français')
    expect(languageLabel('FR/ALL')).toBe('Français, Allemand')
    expect(languageLabel('Romanche')).toBe('Romanche')
    expect(languageLabel(null)).toBe('')
  })

  it('prépare le site web et l’itinéraire', () => {
    expect(formatWebsiteUrl('hopitalvs.ch')).toBe('https://hopitalvs.ch')
    expect(formatWebsiteUrl('http://exemple.ch')).toBe('http://exemple.ch')
    expect(formatWebsiteUrl('')).toBe('')
    expect(directionsUrl({ Latitude: '46.29', Longitude: 7.53 })).toBe('https://www.google.com/maps/dir/?api=1&destination=46.29,7.53')
    expect(directionsUrl({ Name: 'Hôpital', Locality: 'Sierre' })).toBe('https://www.google.com/maps/dir/?api=1&destination=H%C3%B4pital%2C%20Sierre')
    expect(directionsUrl({})).toBe('')
  })
})

describe('mes stages (mobile)', () => {
  it('nomme les statuts et les périodes', () => {
    expect(stageStatus('validee')).toEqual({ label: 'Réussi', tone: 'ok' })
    expect(stageStatus('echec').tone).toBe('danger')
    expect(stageStatus(undefined).label).toBe('En cours ou à venir')
    expect(formatStagePeriod({ year: '2026-2027' })).toBe('2026-2027')
    expect(formatStagePeriod({})).toBe('')
    expect(formatStagePeriod({ startDate: '2027-02-02', endDate: '2027-03-13' })).toMatch(/2.*févr.*–.*13.*mars.*2027/)
  })

  it('sépare les critères validés de ceux qui restent à valider', () => {
    const { validated, remaining } = splitCriteria({ MSQ: true, FR: true, AIGU: false })
    expect(validated.map((item) => item.key)).toEqual(['MSQ', 'FR'])
    expect(remaining.map((item) => item.key)).toEqual(['SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'DE'])
    expect(splitCriteria().validated).toEqual([])
    expect(CRITERIA.find((item) => item.key === 'DE').label).toBe('Stage en allemand')
  })

  it('retrouve une place par identifiant texte ou nombre', () => {
    const byId = indexPlacesById([{ PlaceId: '12', NomPlace: 'A' }, { id: 5, NomPlace: 'B' }, {}])
    expect(byId.get(12).NomPlace).toBe('A')
    expect(byId.get('12').NomPlace).toBe('A')
    expect(byId.get('5').NomPlace).toBe('B')
  })
})

describe('carte d’institution', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('affiche nom, lieu, canton et pastilles, et s’ouvre d’un appui', async () => {
    const institution = { InstitutionId: 7, Name: 'Hôpital de Sierre', Locality: 'Sierre', Language: 'FR', Canton: 'VS' }
    const wrapper = mount(InstitutionCard, {
      props: { institution, offer: { pfp: ['PFP1A', 'PFP2'], criteria: ['MSQ', 'AIGU', 'REHAB'], languages: ['FR'] } },
    })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.text()).toContain('Hôpital de Sierre')
    expect(wrapper.text()).toContain('Sierre · Français')
    expect(wrapper.get('.m-inst-card__canton').text()).toBe('VS')
    expect(wrapper.findAll('.m-inst-card__tag').map((tag) => tag.text())).toEqual(['PFP1A', 'PFP2', 'MSQ', 'AIGU', '+1'])
    await wrapper.trigger('click')
    expect(wrapper.emitted('open')[0]).toEqual([institution])
  })
})
