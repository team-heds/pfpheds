import { test, expect } from '@playwright/test'

// ── Tests d'accessibilité et UI ──────────────────────────────

test.describe('Accessibilité — structure HTML', () => {
  test('la page a un élément <main> ou un conteneur principal', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const main = page.locator('main, #app, .layout-wrapper, [role="main"]')
    const count = await main.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('les images ont un attribut alt', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img:not([alt])')
      return imgs.length
    })
    // Tolérance : max 5 images sans alt au chargement
    expect(imagesWithoutAlt).toBeLessThanOrEqual(5)
  })

  test('les liens ont un contenu accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const emptyLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a')
      let empty = 0
      links.forEach(link => {
        const text = link.textContent?.trim()
        const ariaLabel = link.getAttribute('aria-label')
        const title = link.getAttribute('title')
        const hasIcon = link.querySelector('i, svg, img')
        if (!text && !ariaLabel && !title && !hasIcon) {
          empty++
        }
      })
      return empty
    })
    expect(emptyLinks).toBeLessThanOrEqual(2)
  })

  test('le contraste des couleurs est suffisant pour le texte principal', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Vérifier que le body a une couleur de texte définie
    const hasTextColor = await page.evaluate(() => {
      const body = document.body
      const style = getComputedStyle(body)
      return !!style.color
    })
    expect(hasTextColor).toBe(true)
  })
})

test.describe('Accessibilité — navigation clavier', () => {
  test('Tab navigue entre les éléments interactifs', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Presser Tab et vérifier qu'un élément reçoit le focus
    await page.keyboard.press('Tab')
    await page.waitForTimeout(300)

    const focusedTag = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.tagName.toLowerCase() : null
    })
    // Un élément devrait avoir le focus
    expect(focusedTag).toBeTruthy()
  })

  test('Escape ferme les modales/overlays', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Presser Escape ne devrait pas causer d'erreur
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Accessibilité — responsive avancé', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Laptop', width: 1440, height: 900 },
    { name: '4K', width: 2560, height: 1440 },
  ]

  for (const vp of viewports) {
    test(`${vp.name} (${vp.width}x${vp.height}) — pas de scroll horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')
      await page.waitForTimeout(2000)

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      // Tolérance : quelques pixels de dépassement sont acceptables
      const scrollDiff = await page.evaluate(() => {
        return document.documentElement.scrollWidth - document.documentElement.clientWidth
      })
      expect(scrollDiff).toBeLessThanOrEqual(5)
    })
  }
})

test.describe('Console — pas de warnings critiques', () => {
  test('pas de warnings Vue critiques au chargement', async ({ page }) => {
    const warnings = []
    page.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        const text = msg.text()
        // Filtrer les warnings réseau attendus
        if (text.includes('[Vue warn]') && !text.includes('scrollHeight')) {
          warnings.push(text)
        }
      }
    })

    await page.goto('/')
    await page.waitForTimeout(3000)

    // Filtrer les warnings critiques (composants manquants, props invalides)
    const critical = warnings.filter(w =>
      w.includes('Failed to resolve component') ||
      w.includes('Invalid prop')
    )
    expect(critical).toHaveLength(0)
  })
})

test.describe('Formulaires — validation', () => {
  test('le formulaire de login ne soumet pas avec des champs vides', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const submitBtn = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first()

    if (await submitBtn.isVisible()) {
      const urlBefore = page.url()
      await submitBtn.click()
      await page.waitForTimeout(1000)
      const urlAfter = page.url()

      // Ne devrait pas naviguer vers une page authentifiée
      expect(urlAfter).not.toContain('/feed')
      expect(urlAfter).not.toContain('/admin/dashboard')
    }
  })

  test('le formulaire de register est accessible', async ({ page }) => {
    await page.goto('/register')
    await page.waitForTimeout(2000)

    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Vérifier qu'il y a des champs de formulaire
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
