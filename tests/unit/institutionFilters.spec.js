import { describe, expect, it } from 'vitest'
import {
  createInstitutionPlaceIndex,
  filterInstitutions,
  getAvailableCantons,
  hasPfpOffer,
  hasValidInstitutionCoordinates,
  placeMatchesInstitutionFilters,
} from '@/service/institutionFiltersService'

const institutions = [
  { InstitutionId: '1', Name: 'Hôpital du Valais', Locality: 'Sion', Canton: 'VS', Latitude: 46.2, Longitude: 7.3 },
  { InstitutionId: 2, Name: 'Clinique de Fribourg', Locality: 'Fribourg', Canton: 'FR', Latitude: null, Longitude: null },
  { InstitutionId: '3', Name: 'Cabinet caché', Locality: 'Bulle', Canton: 'FR', is_hidden: true, Latitude: 46.6, Longitude: 7.1 },
]

const places = [
  { PlaceId: 'a', InstitutionId: 1, AIGU: true, MSQ: false, FR: true, DE: false, PFP2: { 2026: 2 }, PFP3: {} },
  { PlaceId: 'b', InstitutionId: '1', AIGU: false, MSQ: true, FR: false, DE: true, PFP2: { 2026: 0 }, PFP3: { 2026: '1' } },
  { PlaceId: 'c', InstitutionId: '2', AIGU: false, MSQ: true, FR: true, DE: false, PFP2: {}, PFP3: { 2026: 0 } },
]

describe('institutionFiltersService', () => {
  it('indexes text and numeric institution identifiers together', () => {
    const index = createInstitutionPlaceIndex(places)
    expect(index.get('1')).toHaveLength(2)
    expect(index.get('2')).toHaveLength(1)
  })

  it('recognizes only non-empty PFP offers', () => {
    expect(hasPfpOffer({})).toBe(false)
    expect(hasPfpOffer({ 2026: 0 })).toBe(false)
    expect(hasPfpOffer({ 2026: '2' })).toBe(true)
    expect(hasPfpOffer({ '2025-2026': 1 })).toBe(true)
  })

  it('uses OR inside a family and AND between active families on the same place', () => {
    expect(placeMatchesInstitutionFilters(places[0], {
      criter: ['MSQ', 'AIGU'],
      languages: ['FR'],
      pfp: ['PFP2'],
    })).toBe(true)

    expect(placeMatchesInstitutionFilters(places[0], {
      criter: ['AIGU'],
      languages: ['DE'],
      pfp: ['PFP2'],
    })).toBe(false)
  })

  it('does not combine properties from different places', () => {
    const result = filterInstitutions({
      institutions,
      places,
      filters: { criter: ['AIGU'], languages: ['DE'], pfp: ['PFP3'] },
    })
    expect(result).toEqual([])
  })

  it('filters consistently by search, canton and real place columns', () => {
    const result = filterInstitutions({
      institutions,
      places,
      searchTerm: 'hopital',
      filters: { cantons: ['VS'], criter: ['MSQ'], languages: ['DE'], pfp: ['PFP3'] },
    })
    expect(result.map((institution) => institution.InstitutionId)).toEqual(['1'])
  })

  it('keeps institutions without places when no place filter is active and excludes hidden ones', () => {
    const result = filterInstitutions({ institutions, places, filters: {} })
    expect(result.map((institution) => institution.InstitutionId)).toEqual(['1', 2])
  })

  it('returns sorted cantons from visible institutions only', () => {
    expect(getAvailableCantons(institutions)).toEqual(['FR', 'VS'])
  })

  it('identifies institutions that can be displayed on the map', () => {
    expect(hasValidInstitutionCoordinates(institutions[0])).toBe(true)
    expect(hasValidInstitutionCoordinates(institutions[1])).toBe(false)
  })
})
