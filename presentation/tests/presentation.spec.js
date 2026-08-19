import { expect, test } from '@playwright/test'

test('charge la présentation et le sommaire', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/presentation/')
  await expect(page.getByRole('heading', { name: 'PFPHEdS' })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('heading', { name: 'Sommaire principal' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Jira et la gestion du travail' })).toBeVisible()
  expect(errors).toEqual([])
})

test('charge la présentation dédiée aux agents IA', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/presentation/agents-ia-developpement/')
  await expect(page.getByRole('heading', { name: 'Développer avec des agents IA' })).toBeVisible()
  await page.goto('/presentation/agents-ia-developpement/#/sommaire')
  await expect(page.getByRole('heading', { name: 'Une méthode de travail, pas un bouton magique' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Du diff à la preuve' })).toBeVisible()
  expect(errors).toEqual([])
})

test('les slides agents IA restent dans le viewport', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1600, height: 820 })
  await page.goto('/presentation/agents-ia-developpement/')
  await page.waitForFunction(() => window.Reveal?.isReady?.())

  const issues = await page.evaluate(async () => {
    const deck = window.Reveal
    const results = []

    for (const item of deck.getSlides()) {
      const indices = deck.getIndices(item)
      deck.slide(indices.h, indices.v || 0)
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const current = deck.getCurrentSlide()
      const slideBox = current.getBoundingClientRect()
      const children = [...current.children].filter((child) => !child.matches('aside.notes'))
      const boxes = children.map((child) => child.getBoundingClientRect()).filter((box) => box.width > 1 && box.height > 1)
      const overflowX = current.scrollWidth - current.clientWidth
      const maxBottom = Math.max(...boxes.map((box) => box.bottom), slideBox.top)
      const overflowY = maxBottom - slideBox.bottom

      if (overflowX > 6 || overflowY > 18) {
        results.push({ id: current.id, overflowX: Math.round(overflowX), overflowY: Math.round(overflowY) })
      }
    }

    return results
  })

  expect(issues).toEqual([])
})

test('captures visuelles des slides agents IA', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 820 })
  const slides = [
    ['accueil', 'Développer avec des agents IA'],
    ['un-bon-prompt-ressemble-a-une-mini-specification', 'Un bon prompt ressemble à une mini-spécification'],
    ['securite-reduire-ce-que-l-agent-peut-voir-et-faire', 'Sécurité : réduire ce que l’agent peut voir et faire'],
    ['conclusion', 'L’agent accélère la boucle ; l’équipe garde le jugement'],
  ]

  for (const [id, heading] of slides) {
    await page.goto(`/presentation/agents-ia-developpement/#/${id}`)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await page.waitForTimeout(900)
    await page.screenshot({ path: `test-results/visual-smoke/agents-ia-${id}.png`, fullPage: false })
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/presentation/agents-ia-developpement/#/sommaire')
  await expect(page.locator('#sommaire')).toBeVisible()
  await page.screenshot({ path: 'test-results/visual-smoke/agents-ia-mobile.png', fullPage: false })
})

test('navigue vers un chapitre depuis le sommaire', async ({ page }) => {
  await page.goto('/presentation/#/sommaire')
  await page.getByRole('link', { name: 'Jira et la gestion du travail' }).click()
  await expect(page.getByRole('heading', { name: 'Jira et la gestion du travail' })).toBeVisible()
  await expect(page).toHaveURL(/jira/)
})

test('rend les liens principaux externes cliquables et sécurisés', async ({ page }) => {
  await page.goto('/presentation/#/git-vs-github')
  const link = page.getByRole('link', { name: 'Ouvrir le dépôt GitHub PFPHEdS' })
  await expect(link).toHaveAttribute('href', 'https://github.com/team-heds/pfpheds')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', /noopener/)
})

test('copie une commande', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/presentation/#/recuperer-le-projet')
  await page.getByRole('button', { name: 'Copier la commande' }).first().click()
  await expect(page.getByRole('button', { name: 'Copier la commande' }).first()).toHaveText('Copié')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('git clone')
})

test('supporte un hash de slide précis', async ({ page }) => {
  await page.goto('/presentation/#/rls-row-level-security')
  await expect(page.getByRole('heading', { name: 'RLS : Row Level Security' })).toBeVisible()
})

test('affichage mobile sans débordement horizontal évident', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/presentation/#/sommaire')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 4)
  expect(overflow).toBe(false)
})

test('les slides principales ne débordent pas horizontalement', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/presentation/')
  const overflows = await page.evaluate(async () => {
    const deck = window.Reveal
    const slides = deck.getSlides()
    const results = []

    for (const slide of slides) {
      const indices = deck.getIndices(slide)
      deck.slide(indices.h, indices.v || 0)
      await new Promise((resolve) => window.requestAnimationFrame(resolve))
      const current = deck.getCurrentSlide()
      const overflowX = current.scrollWidth - current.clientWidth
      if (overflowX > 6) {
        results.push({ id: current.id || current.querySelector('h2,h3')?.textContent || 'sans-id', overflowX })
      }
    }

    return results
  })

  expect(overflows).toEqual([])
})

test('les slides principales restent dans la hauteur utile', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/presentation/')
  const overflows = await page.evaluate(async () => {
    const deck = window.Reveal
    const slides = deck.getSlides()
    const results = []

    for (const slide of slides) {
      const indices = deck.getIndices(slide)
      deck.slide(indices.h, indices.v || 0)
      await new Promise((resolve) => window.requestAnimationFrame(resolve))
      const current = deck.getCurrentSlide()
      const slideBox = current.getBoundingClientRect()
      const children = [...current.children].filter((child) => !child.matches('aside.notes'))
      const maxBottom = Math.max(...children.map((child) => child.getBoundingClientRect().bottom), slideBox.top)
      const overflowY = maxBottom - slideBox.bottom

      if (overflowY > 18) {
        results.push({ id: current.id || current.querySelector('h2,h3')?.textContent || 'sans-id', overflowY: Math.round(overflowY) })
      }
    }

    return results
  })

  expect(overflows).toEqual([])
})

test('les ressources principales sont chargées', async ({ page }) => {
  const failed = []
  page.on('requestfailed', (request) => failed.push(request.url()))
  await page.goto('/presentation/')
  await page.waitForLoadState('networkidle')
  expect(failed).toEqual([])
})

test('captures visuelles de contrôle des slides clés', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 820 })
  const slides = [
    ['accueil', 'PFPHEdS'],
    ['sommaire', 'Sommaire principal'],
    ['frontend', 'La stack frontend'],
    ['jira-decrit-le-besoin-github-montre-le-changement', 'Jira décrit le besoin ; GitHub montre le changement'],
    ['rls-row-level-security', 'RLS : Row Level Security'],
    ['reprise-externe', 'Reprise par l’entreprise externe'],
    ['conclusion', 'Conclusion'],
  ]

  for (const [id, heading] of slides) {
    await page.goto(`/presentation/#/${id}`)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await page.waitForTimeout(1100)
    await page.screenshot({ path: `test-results/visual-smoke/${id}.png`, fullPage: false })
  }
})

test('contrôle qualité viewport de toutes les slides', async ({ page }) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 1600, height: 820 })
  await page.goto('/presentation/')
  await page.waitForFunction(() => window.Reveal?.isReady?.())

  const slideIds = await page.evaluate(() => window.Reveal.getSlides().map((slide) => slide.id).filter(Boolean))
  const issues = []

  for (const id of slideIds) {
    await page.goto(`/presentation/#/${id}`)
    await page.waitForFunction(() => window.Reveal?.isReady?.())
    await page.waitForFunction((expectedId) => window.Reveal?.getCurrentSlide?.()?.id === expectedId, id)
    await page.waitForTimeout(900)

    const result = await page.evaluate(() => {
      const current = window.Reveal.getCurrentSlide()
      const children = [...current.children].filter((child) => !child.matches('aside.notes'))
      const boxes = children.map((child) => child.getBoundingClientRect()).filter((box) => box.width > 1 && box.height > 1)

      if (!boxes.length) {
        return { id: current.id, issue: 'slide sans contenu mesurable' }
      }

      const bounds = {
        left: Math.min(...boxes.map((box) => box.left)),
        right: Math.max(...boxes.map((box) => box.right)),
        top: Math.min(...boxes.map((box) => box.top)),
        bottom: Math.max(...boxes.map((box) => box.bottom)),
      }

      const guard = { left: 88, right: 1512, top: 54, bottom: 792 }
      const overflow = {
        left: Math.round(Math.max(0, guard.left - bounds.left)),
        right: Math.round(Math.max(0, bounds.right - guard.right)),
        top: Math.round(Math.max(0, guard.top - bounds.top)),
        bottom: Math.round(Math.max(0, bounds.bottom - guard.bottom)),
      }

      return {
        id: current.id,
        title: current.querySelector('h1,h2,h3')?.textContent?.trim() || current.id,
        bounds: Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, Math.round(value)])),
        overflow,
      }
    })

    if (result.issue || Object.values(result.overflow).some(Boolean)) {
      issues.push(result)
    }
  }

  expect(issues).toEqual([])
})
