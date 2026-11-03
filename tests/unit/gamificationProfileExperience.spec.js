import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const profile = readFileSync(
  resolve(process.cwd(), 'src/components/gamification/GamificationProfilePage.vue'),
  'utf8',
)

describe('profil gamification unifié', () => {
  it('rend les états essentiels compréhensibles et accessibles', () => {
    expect(profile).toContain('aria-live="polite"')
    expect(profile).toContain('role="alert"')
    expect(profile).toContain('role="progressbar"')
    expect(profile).toContain(':aria-valuenow="Math.round(xpProgress)"')
    expect(profile).toContain('Aucune maison attribuée')
    expect(profile).toContain('Aucune quête active')
    expect(profile).toContain('Aucun défi actif')
    expect(profile).toContain('Aucun badge obtenu')
  })

  it('propose toutes les destinations sans interaction dépendante du survol', () => {
    for (const path of ['/quests', '/challenges', '/achievements', '/houses/ranking']) {
      expect(profile).toContain(`to="${path}"`)
    }
    expect(profile).toContain('<button')
    expect(profile).toContain('min-height: 44px')
    expect(profile).toContain('button:focus-visible')
  })

  it('adapte la composition au mobile, à la tablette et au desktop', () => {
    expect(profile).toContain('@media (min-width: 700px)')
    expect(profile).toContain('@media (min-width: 1100px)')
    expect(profile).toContain('@media (prefers-reduced-motion: reduce)')
    expect(profile).toContain('overflow-wrap: anywhere')
    expect(profile).toContain('data-page-scroll')
    expect(profile).not.toContain('test-scroll-section')
    expect(profile).not.toContain('floating-particles')
    expect(profile).not.toContain('name-shine')
  })

  it('charge le profil ciblé indépendamment de la progression gamification', () => {
    expect(profile).toContain('const displayUserId = computed(() => props.id || authStore.user?.id)')
    expect(profile).toContain(".from('user_profiles')")
    expect(profile).toContain('const [gamificationData, profileResult] = await Promise.all')
    expect(profile).toContain("Consultation administrative en lecture seule")
    expect(profile).not.toContain('if (!gamificationData)')
  })

  it('traite correctement le niveau maximal', () => {
    expect(profile).toContain('const isMaximumLevel = computed(() => currentLevel.value >= 20)')
    expect(profile).toContain('Niveau maximal atteint.')
    expect(profile).toContain('isMaximumLevel.value ? 100')
  })
})
