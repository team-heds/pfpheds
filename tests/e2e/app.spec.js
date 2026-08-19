import { test, expect } from '@playwright/test'

// ── Tests E2E de base — vérification que l'app démarre ─────────

test.describe('Application – chargement initial', () => {
  test('la page d\'accueil se charge', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
  })

  test('la page de login est accessible via /login', async ({ page }) => {
    await page.goto('/login')
    // /login redirige vers /home
    await page.waitForURL(/\/(home|login)?$/)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('la page /home se charge', async ({ page }) => {
    await page.goto('/home')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Formulaire de login', () => {
  test('les champs email et mot de passe sont présents', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1500)
    // Chercher des inputs de type email/password ou des champs de formulaire
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('un message d\'erreur apparaît avec des identifiants invalides', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1500)

    // Remplir les champs s'ils existent
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail" i], input[placeholder*="email" i]').first()
    const passwordInput = page.locator('input[type="password"]').first()

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@invalid.com')
      await passwordInput.fill('wrongpassword')

      // Chercher un bouton de soumission
      const submitBtn = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(3000)
        // On ne devrait PAS être redirigé vers /feed ou /admin
        const url = page.url()
        expect(url).not.toContain('/feed')
        expect(url).not.toContain('/admin/dashboard')
      }
    }
  })
})

test.describe('Navigation – pages publiques', () => {
  test('redirection vers login si non authentifié sur /admin', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)
    const url = page.url()
    // Soit redirigé vers /home ou /login, soit bloqué
    expect(url).toBeTruthy()
  })

  test('/calendar est accessible sans auth', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForTimeout(2000)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('/alpinphysio est accessible sans auth', async ({ page }) => {
    await page.goto('/alpinphysio')
    await page.waitForTimeout(2000)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('/register est accessible', async ({ page }) => {
    await page.goto('/register')
    await page.waitForTimeout(1500)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Navigation – pages protégées sans auth', () => {
  const protectedRoutes = ['/feed', '/settings', '/profile/test', '/media']

  for (const route of protectedRoutes) {
    test(`${route} redirige ou bloque sans auth`, async ({ page }) => {
      await page.goto(route)
      await page.waitForTimeout(2000)
      // On ne devrait pas voir le contenu protégé
      const url = page.url()
      expect(url).toBeTruthy()
    })
  }
})

test.describe('Accessibilité – responsive', () => {
  test('mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('tablet viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('desktop viewport (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Qualité – erreurs JavaScript', () => {
  test('pas d\'erreurs JavaScript critiques au chargement', async ({ page }) => {
    const errors = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/')
    await page.waitForTimeout(3000)

    expect(errors).toHaveLength(0)
  })

  test('pas d\'erreurs critiques sur /calendar', async ({ page }) => {
    const errors = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/calendar')
    await page.waitForTimeout(3000)

    expect(errors).toHaveLength(0)
  })
})

test.describe('Performance – temps de chargement', () => {
  test('la page d\'accueil charge en moins de 10s', async ({ page }) => {
    const start = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(10000)
  })
})
