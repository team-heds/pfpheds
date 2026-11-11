import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('garde-fous des jeux', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('désactive toutes les expériences non validées par défaut en production', () => {
    const environment = source('.env.production.example')

    for (const key of ['GAMES_HUB', 'DAILY_WHEEL', 'ROM_RUNNER', 'TOURNAMENTS', 'VENTRIGLISSE', 'WORD_OF_DAY']) {
      expect(environment).toContain(`VITE_GAMIFICATION_${key}=false`)
    }
  })

  it('protège les routes et impose une authentification au Ventriglisse', () => {
    const routes = source('src/router/routes/apps.js')

    expect(routes).toContain("beforeEnter: featureGuard('gamesHub')")
    expect(routes).toContain("beforeEnter: featureGuard('romRunner')")
    expect(routes).toContain("beforeEnter: featureGuard('tournaments')")
    expect(routes).toContain("beforeEnter: featureGuard('ventriglisse'), meta: { requiresAuth: true }")
  })

  it('refuse réellement les routes désactivées et autorise une activation explicite', async () => {
    vi.stubEnv('VITE_GAMIFICATION_GAMES_HUB', 'false')
    let routes = (await import('@/router/routes/apps.js')).default
    let gameRoute = routes.find((route) => route.name === 'GameView')
    expect(gameRoute.beforeEnter()).toEqual({ path: '/outils', replace: true })

    vi.resetModules()
    vi.stubEnv('VITE_GAMIFICATION_GAMES_HUB', 'true')
    routes = (await import('@/router/routes/apps.js')).default
    gameRoute = routes.find((route) => route.name === 'GameView')
    expect(gameRoute.beforeEnter()).toBe(true)
    expect(routes.find((route) => route.name === 'Ventriglisse3D').meta.requiresAuth).toBe(true)
  })

  it('masque les tournois et les cartes de jeu qui ne sont pas activés', () => {
    const tools = source('src/views/apps/tools/ToolsView.vue')
    const hub = source('src/views/apps/tools/GameView.vue')
    const dynamicRoutes = source('src/composables/useDynamicRoutes.js')

    expect(tools).toContain("outil.to !== '/tournois' || gamificationFeatures.tournaments")
    expect(tools).toContain("outil.to !== '/game' || gamificationFeatures.gamesHub")
    expect(hub).toContain('v-if="gamificationFeatures.dailyWheel"')
    expect(hub).toContain('v-if="gamificationFeatures.romRunner"')
    expect(hub).toContain('v-if="gamificationFeatures.ventriglisse"')
    for (const routeName of ['GameView', 'GameHub', 'RomRunnerView', 'TournoisView', 'TournoiDetailsView']) {
      expect(dynamicRoutes).toContain(`'${routeName}'`)
    }
  })

  it('active le centre de jeux et le Ventriglisse uniquement dans le build test', () => {
    const testBuild = source('deploy/staging/build-current-test.mjs')
    const production = source('.env.production.example')

    expect(testBuild).toContain("VITE_GAMIFICATION_GAMES_HUB: 'true'")
    expect(testBuild).toContain("VITE_GAMIFICATION_VENTRIGLISSE: 'true'")
    expect(production).toContain('VITE_GAMIFICATION_GAMES_HUB=false')
    expect(production).toContain('VITE_GAMIFICATION_VENTRIGLISSE=false')
  })
})
