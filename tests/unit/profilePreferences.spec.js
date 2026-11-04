import { describe, expect, it } from 'vitest'
import {
  getCantonOfOriginLabel,
  getProfileLanguageLabel,
  normalizeProfilePreferences,
  PROFILE_LANGUAGE_OPTIONS,
  SWISS_CANTON_OPTIONS,
} from '@/domain/profile/profilePreferences'

describe('préférences personnelles du profil', () => {
  it('propose les deux langues et les 26 cantons suisses', () => {
    expect(PROFILE_LANGUAGE_OPTIONS.map(({ value }) => value)).toEqual(['fr', 'de'])
    expect(SWISS_CANTON_OPTIONS).toHaveLength(26)
    expect(new Set(SWISS_CANTON_OPTIONS.map(({ value }) => value)).size).toBe(26)
  })

  it('normalise les valeurs avant leur enregistrement', () => {
    expect(normalizeProfilePreferences({
      city: '  Sion  ',
      preferredLanguage: 'FR',
      cantonOfOrigin: 'vs',
    })).toEqual({
      city: 'Sion',
      preferred_language: 'fr',
      canton_of_origin: 'VS',
    })
  })

  it('transforme les valeurs vides ou inconnues en null', () => {
    expect(normalizeProfilePreferences({
      city: ' ',
      preferredLanguage: 'it',
      cantonOfOrigin: 'XX',
    })).toEqual({
      city: null,
      preferred_language: null,
      canton_of_origin: null,
    })
  })

  it('fournit des libellés lisibles', () => {
    expect(getProfileLanguageLabel('de')).toBe('Allemand')
    expect(getCantonOfOriginLabel('VS')).toBe('Valais (VS)')
  })
})
