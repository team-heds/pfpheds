import { describe, expect, it } from 'vitest'
import {
  boundsFor,
  clusterPoints,
  directionsUrl,
  institutionLatLng,
  languageLabel,
  spreadOffsets,
  summarizeOffers,
  websiteUrl,
} from '@/components/map/institutionMapHelpers'

describe('institutionMapHelpers', () => {
  it('ignore les coordonnées absentes, nulles ou impossibles', () => {
    expect(institutionLatLng({ Latitude: '46.2', Longitude: '7.3' })).toEqual([46.2, 7.3])
    expect(institutionLatLng({ Latitude: '', Longitude: '7.3' })).toBeNull()
    expect(institutionLatLng({ Latitude: 0, Longitude: 0 })).toBeNull()
    expect(institutionLatLng({ Latitude: 120, Longitude: 7 })).toBeNull()
  })

  it('cadre la Suisse sans dézoomer sur un stage à l’étranger, sauf demande', () => {
    const points = [[46.23, 7.36], [46.1, 7.07], [9.93, -84.08]]
    expect(boundsFor(points)).toEqual([[46.1, 7.07], [46.23, 7.36]])
    expect(boundsFor(points, { includeAbroad: true })).toEqual([[9.93, -84.08], [46.23, 7.36]])
    expect(boundsFor([[9.93, -84.08]])).toEqual([[9.93, -84.08], [9.93, -84.08]])
    expect(boundsFor([])).toBeNull()
  })

  it('regroupe les points proches à l’écran et garde les autres seuls', () => {
    const clusters = clusterPoints([
      { key: 'a', x: 0, y: 0 },
      { key: 'b', x: 20, y: 10 },
      { key: 'c', x: 300, y: 300 },
    ], 48)
    expect(clusters.map((cluster) => cluster.keys)).toEqual([['a', 'b'], ['c']])
    expect(clusters[0]).toMatchObject({ x: 10, y: 5 })
  })

  it('écarte en cercle les repères posés au même endroit', () => {
    expect(spreadOffsets(1)).toEqual([[0, 0]])
    const offsets = spreadOffsets(4, 20)
    expect(new Set(offsets.map(String)).size).toBe(4)
    offsets.forEach(([dx, dy]) => expect(Math.round(Math.hypot(dx, dy))).toBe(20))
  })

  it('compte les places qui correspondent aux filtres et résume l’offre', () => {
    const places = [
      { InstitutionId: 1, PFP2: true, REHAB: true, FR: true },
      { InstitutionId: 1, PFP3: 1, AIGU: '1', DE: true },
      { InstitutionId: 2, PFP1A: true },
    ]
    const all = summarizeOffers(places, {})
    expect(all.get('1')).toEqual({ places: 2, pfp: ['PFP2', 'PFP3'], criteria: ['AIGU', 'REHAB'] })
    expect(summarizeOffers(places, { pfp: ['PFP3'] }).get('1').places).toBe(1)
    expect(summarizeOffers(places, { pfp: ['PFP3'] }).get('2').places).toBe(0)
  })

  it('formate langue, itinéraire et site', () => {
    expect(languageLabel('FR/ALL')).toBe('Français, Allemand')
    expect(directionsUrl([46.2, 7.3])).toBe('https://www.google.com/maps/dir/?api=1&destination=46.2,7.3')
    expect(websiteUrl('www.hopitalvs.ch')).toBe('https://www.hopitalvs.ch')
    expect(websiteUrl('http://x.ch')).toBe('http://x.ch')
    expect(websiteUrl('')).toBe('')
  })
})
