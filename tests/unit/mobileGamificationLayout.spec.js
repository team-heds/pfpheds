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

  it.each([
    ['src/components/gamification/ChallengesPage.vue', '.stats-overview'],
    ['src/components/gamification/AchievementsPage.vue', '.stats-overview'],
    ['src/components/gamification/QuestsPage.vue', '.quest-stats'],
  ])('%s range ses trois chiffres sur une seule ligne sur téléphone', (file, selector) => {
    // Recette 16.11 : trois grandes cartes empilées repoussaient le contenu de deux écrans.
    const source = readSource(file)
    const block = source.slice(source.indexOf('Téléphone : pleine largeur et chiffres sur une ligne'))
    expect(block).toContain('@media (max-width: 640px)')
    expect(block).toContain(selector)
    expect(block).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
  })

  it('affiche les cartes de chiffres en version compacte sur téléphone', () => {
    const card = readSource('src/components/gamification/GamificationStatCard.vue')
    const block = card.slice(card.indexOf('@media (max-width: 640px)'))
    expect(block).toContain('.game-stat__icon { display: none; }')
    expect(block).toContain('min-height: 0')
  })

  it('n’affiche pas de champ de recherche sous 16 px sur téléphone', () => {
    const source = readSource('src/components/gamification/AchievementsPage.vue')
    const block = source.slice(source.indexOf('Sous 16 px'))
    expect(block).toContain('.search-input')
    expect(block).toContain('font-size: 1rem')
  })
})
