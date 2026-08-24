import { describe, expect, it } from 'vitest'
import adminMenu from '@/config/adminMenu'
import pfpRoutes from '@/router/routes/pfp'

describe('stage coverage navigation', () => {
  it('exposes the page only through the protected Secretariat route', () => {
    const route = pfpRoutes.find(item => item.name === 'CouvertureStages')
    expect(route).toMatchObject({
      path: '/admin/formation-pratique/secretariat/couverture-stages',
      meta: { requiresAuth: true, need: 'page1.access' }
    })
  })

  it('adds one matching entry to the Secretariat menu', () => {
    const physiotherapy = adminMenu.find(section => section.label === 'Physiothérapie')
    const secretariat = physiotherapy.items.find(item => item.label === 'Secrétariat FP')
    const entries = secretariat.items.filter(item => item.to === '/admin/formation-pratique/secretariat/couverture-stages')
    expect(entries).toHaveLength(1)
  })
})
