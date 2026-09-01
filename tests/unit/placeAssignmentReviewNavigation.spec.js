import { describe, expect, it } from 'vitest'
import pfpRoutes from '@/router/routes/pfp'

describe('place assignment review navigation', () => {
  it('keeps the canonical review page authenticated and permission protected', () => {
    const route = pfpRoutes.find(item => item.name === 'FPValidationPlaces')

    expect(route).toMatchObject({
      path: '/admin/formation-pratique/validation-places',
      meta: { requiresAuth: true, need: 'page1.access' }
    })
  })

  it('does not expose a public duplicate of the canonical route', () => {
    const matchingRoutes = pfpRoutes.filter(item => item.path === '/admin/formation-pratique/validation-places')
    expect(matchingRoutes).toHaveLength(1)
  })
})
