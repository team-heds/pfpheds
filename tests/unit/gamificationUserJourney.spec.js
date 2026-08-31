import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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
    const routes = source('src/router/routes/profiles.js')
    const houseBanner = source('src/components/gamification/BandeauMaison.vue')
    const gameMasterBanner = source('src/components/gamification/BandeauGameMaster.vue')

    expect(routes).toMatch(/path: '\/gamification-profile'.*redirect: \{ name: 'QuestsPage' \}/)
    expect(routes).toMatch(/path: '\/gamification-profile\/:id'.*beforeEnter: profileAccessGuard/)
    expect(routes).toContain("path: '/gamification/quests', redirect: { name: 'QuestsPage' }")
    expect(houseBanner).toContain("name: 'GamificationProfileSelf'")
    expect(gameMasterBanner).toContain("name: 'GamificationProfileSelf'")
  })

  it('feeds notifications from the authenticated user Supabase XP history only', () => {
    const component = source('src/components/gamification/notifications/GamificationNotification.vue')

    expect(component).toContain("import { supabase } from '@/supabase'")
    expect(component).toContain("table: 'xp_history'")
    expect(component).toContain('filter: `user_id=eq.${props.userId}`')
    expect(component).toContain('supabase.removeChannel(listenerId.value)')
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
})
