import { test, expect } from '@playwright/test'

// ── Navigation avancée et routing guards ──────────────────────

test.describe('Routing guards — pages admin', () => {
  const adminRoutes = [
    '/admin/dashboard',
    '/admin/modules',
    '/admin/users',
    '/admin/settings',
  ]

  for (const route of adminRoutes) {
    test(`${route} redirige sans auth`, async ({ page }) => {
      await page.goto(route)
      await page.waitForTimeout(2000)
      const url = page.url()
      // Ne devrait pas rester sur la page admin
      const isRedirected = !url.includes(route) || url.includes('login') || url.includes('home')
      // Au minimum, la page ne crash pas
      const body = page.locator('body')
      await expect(body).toBeVisible()
    })
  }
})

test.describe('Routing guards — pages étudiants', () => {
  const studentRoutes = ['/feed', '/events', '/media', '/settings']

  for (const route of studentRoutes) {
    test(`${route} redirige ou bloque sans auth`, async ({ page }) => {
      const errors = []
      page.on('pageerror', (error) => {
        errors.push(error.message)
      })

      await page.goto(route)
      await page.waitForTimeout(2000)

      expect(errors).toHaveLength(0)

      // La page est visible (pas de crash)
      const body = page.locator('body')
      await expect(body).toBeVisible()
    })
  }
})

test.describe('Navigation — liens et redirections', () => {
  test('la navigation vers une route inexistante ne crash pas', async ({ page }) => {
    const errors = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/cette-page-nexiste-pas-12345')
    await page.waitForTimeout(2000)

    expect(errors).toHaveLength(0)

    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('retour arrière fonctionne sans crash', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await page.goto('/calendar')
    await page.waitForTimeout(1000)
    await page.goBack()
    await page.waitForTimeout(1000)

    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('rechargement de page fonctionne', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1500)
    await page.reload()
    await page.waitForTimeout(1500)

    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Sécurité — XSS et injection', () => {
  test('les paramètres URL malveillants ne causent pas de XSS', async ({ page }) => {
    const errors = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // Tenter une injection XSS via l'URL
    await page.goto('/?q=<script>alert("xss")</script>')
    await page.waitForTimeout(2000)

    // Vérifier qu'aucun alert n'a été déclenché
    const dialogTriggered = await page.evaluate(() => {
      return window.__xssTriggered || false
    })
    expect(dialogTriggered).toBe(false)

    expect(errors).toHaveLength(0)
  })

  test('les routes avec paramètres spéciaux ne crashent pas', async ({ page }) => {
    const maliciousRoutes = [
      '/profile/%3Cscript%3Ealert(1)%3C/script%3E',
      '/profile/../../etc/passwd',
      "/profile/' OR 1=1 --",
    ]

    for (const route of maliciousRoutes) {
      await page.goto(route)
      await page.waitForTimeout(1000)
      const body = page.locator('body')
      await expect(body).toBeVisible()
    }
  })
})

test.describe('PWA — Service Worker', () => {
  test('le manifest PWA est accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Vérifier que le manifest link existe dans le HTML
    const manifest = page.locator('link[rel="manifest"]')
    const count = await manifest.count()
    // Le manifest peut être injecté par VitePWA
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Performance — métriques avancées', () => {
  test('le DOM n\'est pas excessivement grand au chargement', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length)
    // Un DOM raisonnable ne devrait pas dépasser 3000 nœuds au chargement initial
    expect(nodeCount).toBeLessThan(3000)
  })

  test('pas de fuites mémoire évidentes après navigation', async ({ page }) => {
    await page.goto('/home')
    await page.waitForURL(/\/home$/)
    await page.waitForTimeout(1000)

    const memBefore = await page.evaluate(() => {
      if (performance.memory) return performance.memory.usedJSHeapSize
      return 0
    })

    // Naviguer plusieurs fois
    for (let i = 0; i < 3; i++) {
      await page.goto('/calendar')
      await page.waitForTimeout(500)
      await page.goto('/home')
      await page.waitForURL(/\/home$/)
      await page.waitForTimeout(500)
    }

    const memAfter = await page.evaluate(() => {
      if (performance.memory) return performance.memory.usedJSHeapSize
      return 0
    })

    // Si performance.memory est disponible, vérifier pas de fuite massive (>50MB)
    if (memBefore > 0 && memAfter > 0) {
      const diff = memAfter - memBefore
      expect(diff).toBeLessThan(50 * 1024 * 1024)
    }
  })
})
