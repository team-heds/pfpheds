import { describe, expect, it, vi } from 'vitest'
import { searchAvailableRoutes } from '@/service/searchRouteCatalog'

function createRouter() {
  const routes = new Map([
    ['FeedView', { need: 'authenticated', path: '/feed' }],
    ['Profile', { need: 'authenticated', path: '/profile/:id' }],
    ['DashboardView', { need: ['admin'], path: '/admin' }],
  ])
  return {
    hasRoute: vi.fn((name) => routes.has(name)),
    resolve: vi.fn((route) => {
      const definition = routes.get(route.name) || { need: 'authenticated', path: `/${route.name}` }
      return {
        meta: { need: definition.need },
        href: definition.path.replace(':id', route.params?.id || ''),
      }
    }),
  }
}

describe('searchRouteCatalog', () => {
  it('résout Mon profil avec l’identifiant Supabase courant', () => {
    const results = searchAvailableRoutes({
      router: createRouter(),
      roleStore: { can: vi.fn(() => false) },
      userId: 'supabase-user-id',
      query: 'profil',
    })

    expect(results[0].route).toEqual({ name: 'Profile', params: { id: 'supabase-user-id' } })
    expect(results[0].path).toBe('/profile/supabase-user-id')
  })

  it('n’expose pas une page admin sans permission', () => {
    const results = searchAvailableRoutes({
      router: createRouter(),
      roleStore: { can: vi.fn(() => false) },
      userId: 'student-id',
      query: 'admin',
    })

    expect(results).toEqual([])
  })
})
