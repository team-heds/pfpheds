import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import {
  boundsFor,
  distanceKm,
  formatDistance,
  institutionLatLng,
  mappableInstitutions,
  searchOnMap,
} from '@/mobile/map/mapHelpers'
import { useMobileMapStore } from '@/mobile/map/mobileMapStore'

const institutions = [
  { InstitutionId: 1, Name: 'Hôpital de Sierre', Locality: 'Sierre', Canton: 'VS', Latitude: '46.29', Longitude: '7.53' },
  { InstitutionId: 2, Name: 'Clinique de Sion', Locality: 'Sion', Canton: 'VS', Latitude: 46.23, Longitude: 7.36 },
  { InstitutionId: 3, Name: 'Sans coordonnées', Locality: 'Sierre', Latitude: '', Longitude: null },
  { InstitutionId: 4, Name: 'Coordonnées nulles', Latitude: 0, Longitude: 0 },
  { InstitutionId: 5, Name: 'Stage à Montréal', Locality: 'Montréal', Latitude: 45.5, Longitude: -73.57 },
]

describe('carte mobile : institutions à placer', () => {
  it('ne garde que les institutions aux coordonnées utilisables', () => {
    expect(institutionLatLng(institutions[0])).toEqual([46.29, 7.53])
    expect(institutionLatLng(institutions[2])).toBeNull()
    expect(institutionLatLng(institutions[3])).toBeNull()
    expect(institutionLatLng({ Latitude: 120, Longitude: 7 })).toBeNull()
    expect(mappableInstitutions(institutions).map((item) => item.key)).toEqual(['1', '2', '5'])
  })

  it('cadre la Suisse sans dézoomer pour un stage lointain', () => {
    const points = mappableInstitutions(institutions).map((item) => item.latLng)
    expect(boundsFor(points)).toEqual([[46.23, 7.36], [46.29, 7.53]])
    expect(boundsFor([[45.5, -73.57]])).toEqual([[45.5, -73.57], [45.5, -73.57]])
    expect(boundsFor([])).toBeNull()
  })

  it('propose des suggestions : le nom d’abord, puis la localité, sans tenir compte des accents', () => {
    const items = mappableInstitutions(institutions)
    expect(searchOnMap(items, 'sie').map((item) => item.institution.Name)).toEqual(['Hôpital de Sierre'])
    expect(searchOnMap(items, 'hopital').map((item) => item.key)).toEqual(['1'])
    expect(searchOnMap(items, 'vs').map((item) => item.key)).toEqual(['2', '1'])
    expect(searchOnMap(items, 'montreal')).toHaveLength(1)
    expect(searchOnMap(items, 's')).toEqual([])
  })

  it('mesure et écrit une distance', () => {
    const km = distanceKm([46.29, 7.53], [46.23, 7.36])
    expect(km).toBeGreaterThan(13)
    expect(km).toBeLessThan(16)
    expect(formatDistance(0.42)).toBe('400 m')
    expect(formatDistance(3.26)).toBe('3,3 km')
    expect(formatDistance(42.4)).toBe('42 km')
    expect(formatDistance(NaN)).toBe('')
  })

  it('transmet une demande « voir sur la carte »', () => {
    setActivePinia(createPinia())
    const store = useMobileMapStore()
    store.focus(7)
    expect(store.focusKey).toBe('7')
    expect(store.focusRequest).toBe(1)
  })
})
