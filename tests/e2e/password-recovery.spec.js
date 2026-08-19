import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]

test.describe('Réinitialisation du mot de passe', () => {
  test.describe.configure({ mode: 'serial' })

  for (const requestCase of [
    { name: 'adresse connue', email: 'etudiant.connu@hevs.ch' },
    { name: 'adresse inconnue', email: 'adresse.inconnue@example.invalid' },
  ]) {
    test(`affiche la même confirmation pour une ${requestCase.name}`, async ({ page }) => {
      let recoveryRequests = 0
      await page.route('**/api/auth/password-recovery', async route => {
        recoveryRequests += 1
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({
            message:
              'Si cette adresse est associée à un compte, un email de réinitialisation sera envoyé.',
          }),
        })
      })

      await page.goto('/')
      await page.locator('input[type="email"]').first().fill(requestCase.email)
      await page.getByText('Mot de passe oublié ?').click()

      await expect(page.getByText('Email envoyé').first()).toBeVisible()
      expect(recoveryRequests).toBe(1)
    })
  }

  for (const viewport of viewports) {
    test(`affiche un lien expiré de façon accessible sur ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/reset-password?error=access_denied&error_code=otp_expired')

      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Définir un nouveau mot de passe',
      )
      await expect(page.getByRole('alert')).toContainText('Lien expiré')
      await expect(page.getByLabel('Adresse email')).toBeVisible()
      await expect(page.getByLabel('Code reçu par email')).toBeVisible()

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(horizontalOverflow).toBeLessThanOrEqual(2)
    })
  }

  test('ne transforme pas une visite ordinaire en session de récupération', async ({ page }) => {
    await page.goto('/reset-password')

    await expect(page.getByRole('alert')).toContainText('Lien invalide')
    await expect(page).toHaveURL(/\/reset-password$/)
  })
})
