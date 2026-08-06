import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const routerSource = readFileSync(join(process.cwd(), 'src/router.js'), 'utf8')

describe('navigation vers le changement de mot de passe', () => {
  it('laisse passer le callback avant tout chargement de routes dynamiques', () => {
    const recoveryBypass = routerSource.indexOf(
      "if (to.path === '/reset-password' || to.path === '/new-password')",
    )
    const dynamicRoutesLoad = routerSource.indexOf('if (!dynamicRoutesLoaded)')

    expect(recoveryBypass).toBeGreaterThan(-1)
    expect(dynamicRoutesLoad).toBeGreaterThan(-1)
    expect(recoveryBypass).toBeLessThan(dynamicRoutesLoad)
  })

  it('conserve les deux routes de récupération publiques', () => {
    const authRoutes = readFileSync(join(process.cwd(), 'src/router/routes/auth.js'), 'utf8')

    expect(authRoutes).toContain("path: '/reset-password'")
    expect(authRoutes).toContain("path: '/new-password'")
    expect(authRoutes).toContain('requiresAuth: false')
  })

  it('masque la navigation mobile authentifiée sur les écrans publics', () => {
    const authRoutes = readFileSync(join(process.cwd(), 'src/router/routes/auth.js'), 'utf8')

    expect(authRoutes).toMatch(
      /path: '\/reset-password'.*?requiresAuth: false, hideMobileNav: true/s,
    )
    expect(authRoutes).toMatch(/path: '\/home'.*?hideMobileNav: true/s)
  })
})
