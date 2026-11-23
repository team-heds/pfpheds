import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import authRoutes from '@/router/routes/auth'
import appRoutes from '@/router/routes/apps'
import socialRoutes from '@/router/routes/social'
import profileRoutes from '@/router/routes/profiles'
import { accessMessage } from '@/utils/accessMessages'

const findRoute = (routes, path) => routes.find((route) => route.path === path)
const source = (path) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8')

describe('page d’accès refusé', () => {
  it('explique le refus selon la raison', () => {
    expect(accessMessage('profile-scope').title).toBe('Profil non accessible')
    expect(accessMessage('profile-check-failed').title).toBe('Vérification impossible')
  })

  it('garde un message clair pour une raison absente ou inconnue', () => {
    expect(accessMessage(undefined).title).toBe('Accès non autorisé')
    expect(accessMessage('constructor').title).toBe('Accès non autorisé')
  })

  it('n’affiche plus de message de développement', () => {
    for (const file of ['views/auth/AccessView.vue', 'views/auth/AuthErrorView.vue']) {
      expect(source(file)).not.toContain('en cours de')
    }
  })
})

describe('anciennes adresses de gabarit', () => {
  it.each([
    [authRoutes, '/verification', '/home'],
    [authRoutes, '/lock-screen', '/home'],
    [appRoutes, '/files', '/feed'],
    [appRoutes, '/mail', '/feed'],
    [appRoutes, '/list', '/feed'],
    [socialRoutes, '/hashtag/:hashtag', '/feed'],
  ])('%#', (routes, path, target) => {
    expect(findRoute(routes, path).redirect).toBe(target)
  })

  it('conserve les pages qui ont une vraie fonction', () => {
    expect(findRoute(authRoutes, '/register').component).toBeTypeOf('function')
    expect(findRoute(appRoutes, '/tasklist').component).toBeTypeOf('function')
  })

  it('réserve le diagnostic gamification aux administrateurs', () => {
    expect(findRoute(profileRoutes, '/diagnostic-gamification').meta.need).toEqual(['super.all', 'admin'])
  })
})

describe('accueil du planning', () => {
  const page = source('views/planning/HomePlanning.vue')

  it('ne contient plus les outils de test', () => {
    for (const text of ['TEST_MODE', 'signUp', 'signInWithPassword', 'useTodoStore', 'type="password"']) {
      expect(page).not.toContain(text)
    }
  })

  it('réserve le lien d’administration aux administrateurs', () => {
    expect(page).toContain("roleStore.can('admin')")
  })
})
