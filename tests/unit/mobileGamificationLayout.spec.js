import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8')
const mobileBlock = (source) => source.slice(source.indexOf('Téléphone : un seul défilement'))

describe('gamification sur téléphone', () => {
  it.each([
    'src/components/gamification/ChallengesPage.vue',
    'src/components/gamification/AchievementsPage.vue',
    'src/components/gamification/HousesRankingPage.vue',
    'src/components/gamification/HouseStatsPage.vue',
    'src/views/mentoring/MentoringView.vue',
  ])('%s laisse la page défiler seule (pas de second bloc défilant)', (file) => {
    const block = mobileBlock(readSource(file))
    expect(block).toContain('.page-wrapper')
    expect(block).toContain('height: auto')
    expect(block).toContain('overflow: visible')
  })

  it('garde un bouton retour nommé « Retour » même réduit à une icône', () => {
    const header = readSource('src/components/gamification/GamificationPageHeader.vue')
    const wrapper = mount(GamificationPageHeader, {
      props: { title: 'Défis du moment', description: 'Avancez à votre rythme.' },
    })

    // Le libellé reste dans la page (masqué visuellement, lu par les lecteurs d'écran).
    expect(header).toContain('label="Retour"')
    expect(header).not.toMatch(/\.p-button-label\)\s*\{[^}]*display:\s*none/)
    expect(wrapper.find('h1').text()).toBe('Défis du moment')
  })

  it('n’affiche pas de champ de recherche sous 16 px sur téléphone', () => {
    const source = readSource('src/components/gamification/AchievementsPage.vue')
    const block = source.slice(source.indexOf('Sous 16 px'))
    expect(block).toContain('.search-input')
    expect(block).toContain('font-size: 1rem')
  })
})
