import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOUSE_TEXTS, houseDescription, houseMotto } from '@/domain/gamification/houseTexts'

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8')
const OLD_MOTTOS = ["équilibre soigne", 'Clarifier, guider, apaiser', 'Comprendre la douleur', 'Apaiser pour mieux guérir']

describe('textes des maisons (décision du 16.11 : ceux du classement)', () => {
  it('reprend la devise et la description de la table houses', () => {
    expect(houseMotto('Solencia')).toBe('Force et détermination professionnelle')
    expect(houseMotto('harmonis')).toBe("Harmonie et équilibre dans l'apprentissage")
    expect(houseMotto('Elaris')).toBe('Excellence et innovation pédagogique')
    expect(houseMotto('DOLORIS')).toBe('Compassion et empathie thérapeutique')
    expect(houseDescription('solencia')).toContain('force, la détermination et le leadership')
    expect(houseMotto('inconnue')).toBe('')
    expect(Object.keys(HOUSE_TEXTS)).toEqual(['harmonis', 'elaris', 'doloris', 'solencia', 'gamemaster'])
  })

  it.each([
    'src/components/user/profile/HESHouseQuiz.vue',
    'src/components/gamification/BandeauMaison.vue',
    'src/service/gamificationServiceSupabase.js',
  ])('%s n’affiche plus les anciennes devises', (file) => {
    const source = readSource(file)
    for (const old of OLD_MOTTOS) expect(source).not.toContain(old)
    expect(source).toContain('HOUSE_TEXTS')
  })
})
