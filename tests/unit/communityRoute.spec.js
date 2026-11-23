import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import socialRoutes from '@/router/routes/social'

const Page = { template: '<div />' }

const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: socialRoutes.map((route) => (route.redirect ? route : { ...route, component: Page })),
})

describe('adresse historique d’une communauté', () => {
  it('ouvre la fiche Supabase avec le même identifiant', async () => {
    const router = createTestRouter()
    await router.push('/communities/11111111-1111-4111-8111-111111111111')

    expect(router.currentRoute.value.name).toBe('CommunityInfoView')
    expect(router.currentRoute.value.params.id).toBe('11111111-1111-4111-8111-111111111111')
  })

  it('laisse la fiche et la liste accessibles directement', async () => {
    const router = createTestRouter()

    await router.push('/communities/info/abc')
    expect(router.currentRoute.value.name).toBe('CommunityInfoView')

    await router.push('/communities')
    expect(router.currentRoute.value.name).toBe('CommunitiesView')
  })
})
