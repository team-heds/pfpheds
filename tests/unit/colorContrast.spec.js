import { describe, expect, it } from 'vitest'
import { getReadableTextColor } from '../../src/utils/colorContrast.js'

describe('getReadableTextColor', () => {
  it('utilise un texte sombre sur le jaune Doloris', () => {
    expect(getReadableTextColor('#FFD700')).toBe('#111827')
  })

  it('choisit la variante qui offre le meilleur contraste pour chaque maison', () => {
    expect(getReadableTextColor('#2E8B57')).toBe('#111827')
    expect(getReadableTextColor('#DC143C')).toBe('#ffffff')
    expect(getReadableTextColor('#4169E1')).toBe('#ffffff')
  })

  it('garde un comportement sûr pour une couleur invalide', () => {
    expect(getReadableTextColor('inconnue')).toBe('#ffffff')
  })
})
