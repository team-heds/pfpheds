import { describe, expect, it, vi } from 'vitest'
import {
  badgeIcon,
  challengeProgress,
  displayNameOf,
  featuredChallenges,
  houseOf,
  levelSummary,
} from '@/mobile/profile/profileHelpers'
import { applyScheme, currentScheme } from '@/mobile/profile/theme'

describe('profil mobile : identité et maison', () => {
  it('reconnaît la maison, quelle que soit son écriture', () => {
    expect(houseOf('Solencia')).toMatchObject({ key: 'solencia', name: 'Solencia' })
    expect(houseOf('Solencia').banner).toMatch(/FondSolencia/)
    expect(houseOf('elaris').crest).toMatch(/BlasonElaris/)
    expect(houseOf(' harmonis ')).toMatchObject({ key: 'harmonis' })
    expect(houseOf('GameMaster').name).toBe('Maître du jeu')
    expect(houseOf('')).toBeNull()
    expect(houseOf('inconnue')).toBeNull()
  })

  it('choisit le nom à afficher', () => {
    expect(displayNameOf({ display_name: ' Eden Mahiet ' })).toBe('Eden Mahiet')
    expect(displayNameOf({ forname: 'Liam', family_name: 'Laurier' })).toBe('Liam Laurier')
    expect(displayNameOf(null, 'ba26.test@hevs.ch')).toBe('ba26.test')
    expect(displayNameOf(null)).toBe('Mon profil')
  })
})

describe('profil mobile : progression', () => {
  it('résume le niveau et l’avancée vers le suivant', () => {
    const summary = levelSummary({ level: 1, xp: 75 })
    expect(summary).toMatchObject({ level: 1, xp: 75, isMax: false, toNext: 25, percent: 75 })
    expect(summary.name).toBe('Étudiant·e Physio')
  })

  it('reste cohérent aux bornes', () => {
    expect(levelSummary({ level: 20, xp: 999999 })).toMatchObject({ level: 20, isMax: true, percent: 100, toNext: 0 })
    expect(levelSummary({})).toMatchObject({ level: 1, xp: 0 })
    expect(levelSummary({ level: 99, xp: -5 })).toMatchObject({ level: 20, xp: 0 })
  })

  it('écrit l’avancée d’un défi', () => {
    expect(challengeProgress({ target: 5, progress: 2 })).toEqual({ label: '2/5', percent: 40, completed: false })
    expect(challengeProgress({ target: 5, progress: 9 })).toEqual({ label: '5/5', percent: 100, completed: true })
    expect(challengeProgress({ target: 1, progress: 0, completed: true })).toEqual({ label: '1/1', percent: 100, completed: true })
    expect(challengeProgress({})).toEqual({ label: '0/1', percent: 0, completed: false })
  })

  it('met en avant les défis en cours les plus avancés', () => {
    const list = [
      { id: 'a', target: 5, progress: 1 },
      { id: 'b', target: 1, progress: 1, completed: true },
      { id: 'c', target: 4, progress: 3 },
      { id: 'd', target: 10, progress: 0 },
    ]
    expect(featuredChallenges(list).map((item) => item.challenge.id)).toEqual(['c', 'a', 'd'])
    expect(featuredChallenges(list, 4).map((item) => item.challenge.id)).toEqual(['c', 'a', 'd', 'b'])
  })

  it('affiche le pictogramme d’un badge, icône ou émoji', () => {
    expect(badgeIcon({ icon: 'pi pi-star' })).toEqual({ className: 'pi pi-star', text: '' })
    expect(badgeIcon({ icon: 'pi-bolt' })).toEqual({ className: 'pi pi-bolt', text: '' })
    expect(badgeIcon({ icon: '🔥' })).toEqual({ className: '', text: '🔥' })
    expect(badgeIcon({})).toEqual({ className: '', text: '★' })
  })
})

describe('thème clair ou sombre', () => {
  const setup = (withDimLink) => {
    document.head.querySelectorAll('link[data-theme-link]').forEach((link) => link.remove())
    const add = (scheme, media) => {
      const link = document.createElement('link')
      link.dataset.themeLink = 'heds'
      link.dataset.themeScheme = scheme
      link.media = media
      document.head.appendChild(link)
      return link
    }
    return { dim: withDimLink ? add('dim', 'all') : null, light: add('light', 'not all') }
  }

  it('active le thème clair puis revient au sombre', () => {
    const { dim, light } = setup(true)
    const listener = vi.fn()
    window.addEventListener('heds:theme-change', listener)
    expect(currentScheme()).toBe('dim')
    expect(applyScheme('light')).toBe('light')
    expect(light.media).toBe('all')
    expect(dim.media).toBe('not all')
    expect(applyScheme('dim')).toBe('dim')
    expect(light.media).toBe('not all')
    expect(listener).toHaveBeenCalledTimes(2)
    window.removeEventListener('heds:theme-change', listener)
  })

  it('fonctionne quand le thème sombre est intégré à la feuille principale', () => {
    const { light } = setup(false)
    expect(applyScheme('light')).toBe('light')
    expect(applyScheme('dim')).toBe('dim')
    expect(light.disabled).toBe(true)
  })
})
