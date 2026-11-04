import { describe, expect, it } from 'vitest'
import {
  INSTITUTION_PLACEHOLDER,
  institutionImageOf,
  showInstitutionPlaceholder
} from '@/utils/institutionImage'

describe('institutionImageOf', () => {
  it('retourne la première photo valide', () => {
    expect(institutionImageOf({ ImageURL: ['', 'https://x/a.jpg', 'https://x/b.jpg'] })).toBe('https://x/a.jpg')
    expect(institutionImageOf({ ImageURL: 'https://x/c.jpg' })).toBe('https://x/c.jpg')
  })

  it('retourne le visuel neutre sans photo', () => {
    expect(institutionImageOf({ ImageURL: [] })).toBe(INSTITUTION_PLACEHOLDER)
    expect(institutionImageOf({ ImageURL: '  ' })).toBe(INSTITUTION_PLACEHOLDER)
    expect(institutionImageOf(null)).toBe(INSTITUTION_PLACEHOLDER)
  })

  it('n’utilise plus l’image d’exemple du modèle eduport', () => {
    expect(INSTITUTION_PLACEHOLDER).not.toMatch(/eduport|webestica/)
  })
})

describe('showInstitutionPlaceholder', () => {
  it('remplace une photo cassée une seule fois', () => {
    const img = document.createElement('img')
    img.src = 'https://x/cassee.jpg'
    showInstitutionPlaceholder({ target: img })
    expect(img.getAttribute('src')).toBe(INSTITUTION_PLACEHOLDER)
    img.src = 'https://x/autre.jpg'
    showInstitutionPlaceholder({ target: img })
    expect(img.getAttribute('src')).toBe('https://x/autre.jpg')
  })
})
