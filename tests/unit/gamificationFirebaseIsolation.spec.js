import { describe, expect, it } from 'vitest'
import adminRoutesSource from '@/router/routes/admin.js?raw'
import dynamicRoutesSource from '@/composables/useDynamicRoutes.js?raw'
import routerSource from '@/router.js?raw'
import authStoreSource from '@/stores/authStore.js?raw'

const gamificationSources = import.meta.glob([
  '/src/components/gamification/**/*.{js,vue}',
  '/src/components/admin/{AdminDashboardGamification,BadgeManagement,ChallengeManagement,HouseManagement,QuestManagement,UserManagement}.vue',
  '/src/service/{adminBadgesService,adminChallengesService,adminDashboardStatsService,adminQuestsService,badgesService,challengesService,gamificationIntegration,gamificationServiceSupabase,userQuestsService}.js',
  '/src/router/routes/{admin,profiles}.js',
  '/src/components/common/utils/Navbar.vue',
  '/src/stores/authStore.js',
  '/src/router.js'
], { eager: true, query: '?raw', import: 'default' })

const forbiddenFirebaseImport = /(?:from\s*|import\s*\()['"](?:firebase(?:\/[^'"]*)?|@\/firebase(?:\.js)?|root\/firebase|\.\.\/\.\.\/firebase(?:\.js)?)[ '")]/

describe('isolation Firebase de la gamification', () => {
  it('redirige l’ancienne console de défis vers la console Supabase', () => {
    const legacyRoute = adminRoutesSource.match(/\{ path: '\/admin\/defis'.*?\},/s)?.[0] || ''
    expect(legacyRoute).toContain("redirect: { name: 'AdminChallengeManagement' }")
    expect(legacyRoute).not.toContain('AdminDefisView.vue')
  })

  it('empêche une route dynamique de réactiver l’ancienne console', () => {
    expect(dynamicRoutesSource).toMatch(/protectedRoutes\s*=\s*\[[\s\S]*'AdminDefisView'/)
  })

  it('garde le socle de navigation et d’authentification Supabase-only', () => {
    for (const source of [routerSource, authStoreSource]) {
      expect(source).not.toMatch(/from ['"](?:@\/firebase|firebase\/auth|@\/service\/rolesService)['"]/)
    }
  })

  it('interdit tout import Firebase dans le graphe gamification actif', () => {
    const offenders = Object.entries(gamificationSources)
      .filter(([, source]) => forbiddenFirebaseImport.test(source))
      .map(([file]) => file)
    expect(offenders).toEqual([])
  })
})
