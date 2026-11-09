import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const routeContext = vi.hoisted(() => ({ profileGuard: vi.fn(), features: { userJourney: true, badgesChallenges: true } }))
vi.mock('@/router/guards/profileAccessGuard', () => ({ profileAccessGuard: routeContext.profileGuard }))
vi.mock('@/config/gamificationFeatures', () => ({ gamificationFeatures: routeContext.features }))
import profileRoutes from '@/router/routes/profiles'
afterEach(() => { routeContext.features.userJourney = true })

const source = (relativePath) => readFileSync(
  resolve(process.cwd(), relativePath),
  'utf8',
)

describe('gamification user journey safeguards', () => {
  it('keeps the Supabase user journey and the house quiz disabled by default', () => {
    const flags = source('src/config/gamificationFeatures.js')
    const productionEnvironment = source('.env.production.example')

    expect(flags).toContain('VITE_GAMIFICATION_USER_UI')
    expect(flags).toContain('VITE_GAMIFICATION_HOUSE_QUIZ')
    expect(productionEnvironment).toContain('VITE_GAMIFICATION_USER_UI=false')
    expect(productionEnvironment).toContain('VITE_GAMIFICATION_HOUSE_QUIZ=false')
  })

  it('protects other gamification profiles and keeps a self route', () => {
    const self = profileRoutes.find(route => route.name === 'GamificationProfileSelf')
    const other = profileRoutes.find(route => route.name === 'GamificationProfilePage')
    const houseBanner = source('src/components/gamification/BandeauMaison.vue')
    const gameMasterBanner = source('src/components/gamification/BandeauGameMaster.vue')

    expect(self.path).toBe('/gamification-profile')
    expect(self.component).toBeTypeOf('function')
    expect(self.redirect).toBeUndefined()
    expect(self.meta.requiresAuth).toBe(true)
    expect(self.beforeEnter()).toBe(true)
    expect(other.beforeEnter).toBe(routeContext.profileGuard)
    expect(profileRoutes.find(route => route.path === '/gamification/quests').redirect).toEqual({ name: 'QuestsPage' })
    expect(houseBanner).toContain("name: 'GamificationProfileSelf'")
    expect(gameMasterBanner).toContain("name: 'GamificationProfileSelf'")
  })

  it('keeps the self hub behind its existing rollout flag', () => {
    routeContext.features.userJourney = false
    expect(profileRoutes.find(route => route.name === 'GamificationProfileSelf').beforeEnter()).toEqual({ name: 'QuestsPage' })
  })

  it('feeds notifications from the authenticated user Supabase XP history only', () => {
    const component = source('src/components/gamification/notifications/GamificationNotification.vue')

    expect(component).toContain("import { supabase } from '@/supabase'")
    expect(component).toContain("table: 'xp_history'")
    expect(component).not.toContain("@/service/gamificationService'")
  })

  it('makes gamification cards reachable and operable from the keyboard', () => {
    const badge = source('src/components/gamification/BadgeCard.vue')
    const challenge = source('src/components/gamification/ChallengeCard.vue')
    const quest = source('src/components/gamification/QuestCard.vue')
    const sidebar = source('src/components/gamification/QuestsSidebarCard.vue')

    for (const component of [badge, challenge, quest]) {
      expect(component).toContain('tabindex="0"')
      expect(component).toContain('@keydown.enter')
      expect(component).toContain('@keydown.space.prevent')
      expect(component).toContain(':focus-visible')
    }
    expect(sidebar).toContain('<button')
    expect(sidebar).toContain('aria-label="Voir toutes les quêtes"')
  })

  it('names ranking controls and gamification search fields for assistive technology', () => {
    const ranking = source('src/components/gamification/HousesRankingPage.vue')
    const pageHeader = source('src/components/gamification/GamificationPageHeader.vue')
    const quests = source('src/components/gamification/QuestsPage.vue')
    const achievements = source('src/components/gamification/AchievementsPage.vue')

    expect(ranking).toContain('@back="$router.go(-1)"')
    expect(pageHeader).toContain('label="Retour"')
    expect(ranking).toContain('aria-label="Actualiser le classement"')
    expect(ranking).toContain('@keydown.space.prevent="viewHouseDetails(house.name)"')
    expect(quests).toContain('for="quest-search"')
    expect(quests).toContain('aria-label="Effacer la recherche"')
    expect(achievements).toContain('for="badge-search"')
    expect(achievements).toContain('Mes badges')
  })

  it('keeps viewed-profile data separate from the authenticated administrator', () => {
    const profile = source('src/components/user/library/CardNameProfile.vue')

    expect(profile).not.toContain('await fetchGamificationData(currentUserId)')
    expect(profile).toContain('userId === currentUserId')
    expect(profile.match(/gamificationIntegration\.onProfileUpdate\(/g)).toHaveLength(1)
    expect(profile).not.toContain('const giveUserXP')
    expect(profile).toContain("name: 'GamificationProfilePage'")
    expect(profile).toContain("name: 'HousesRankingPage'")
  })

  it('never lets the browser write house XP directly', () => {
    const profile = source('src/components/gamification/GamificationProfilePage.vue')

    expect(profile).not.toContain(".from('houses')\n      .update")
    expect(profile).not.toContain('addHousePoints')
    expect(profile).not.toContain('authStore.isFirebaseUser')
  })

  it('exposes the admin gamification menu only through the feature flag', () => {
    const menu = source('src/config/adminMenu.js')

    expect(menu).toContain('gamificationFeatures.userJourney')
    expect(menu).toContain("label: 'Dashboard Gamification'")
  })

  it('records Supabase login rewards only when the user journey is enabled', () => {
    const login = source('src/views/auth/LoginHome.vue')

    expect(login).toContain('gamificationFeatures.userJourney')
    expect(login).toContain('gamificationIntegration.onLogin')
    expect(login).toContain("loginMethod: 'supabase'")
    expect(login).toContain("route.query.redirect.startsWith('/')")
    expect(login).toContain("!route.query.redirect.startsWith('//')")
    expect(login).toContain('router.replace(redirectPath)')
  })
})
