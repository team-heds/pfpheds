import fs from 'node:fs'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  user: null,
  session: null,
  initialized: true,
  initializeAuth: vi.fn(async () => {}),
}))

vi.mock('@/firebase', () => ({}))
vi.mock('@/supabase', () => ({ supabase: {} }))
vi.mock('@/service/rolesService', () => ({ default: { getUserRoles: vi.fn() } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => auth }))
vi.mock('@/composables/useDynamicRoutes', () => ({
  addDynamicRoutesToRouter: vi.fn(async () => {}),
}))
vi.mock('@/router/routes/index', async () => {
  const { default: calendarRoutes } = await import('@/router/routes/calendar')
  const Stub = { template: '<div />' }
  return {
    default: [
      ...calendarRoutes.map((route) => ({ ...route, component: Stub })),
      { path: '/', component: Stub, meta: { need: 'public' } },
      { path: '/home', component: Stub, meta: { need: 'public' } },
      { path: '/feed', component: Stub, meta: { need: 'public' } },
      { path: '/access', component: Stub, meta: { need: 'public' } },
    ],
  }
})

const EDIT_PATHS = ['/calendar/full/edit', '/calendar/admin', '/calendar/module/42/edit']
const READ_PATHS = ['/calendar', '/calendar/full', '/calendar/modules', '/calendar/module/42']

let router
let useRoleStore

const signInAs = (perms) => {
  const roleStore = useRoleStore()
  roleStore.initialized = true
  roleStore.perms = perms
  auth.user = perms ? { id: 'user-test', email: 'test@example.test' } : null
  auth.session = perms ? { user: auth.user } : null
  roleStore.session = auth.session
  if (!perms) roleStore.perms = []
}

const visit = async (target) => {
  await router.push('/access')
  await router.push(target)
  return router.currentRoute.value.path
}

describe('accès aux écrans d’édition du calendrier', () => {
  beforeAll(async () => {
    setActivePinia(createPinia())
    ;({ useRoleStore } = await import('@/stores/role'))
    ;({ default: router } = await import('@/router'))
  })

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it.each(EDIT_PATHS)('renvoie un visiteur hors de %s', async (target) => {
    signInAs(null)
    expect(await visit(target)).toBe('/home')
  })

  it.each(EDIT_PATHS)('refuse %s à un étudiant', async (target) => {
    signInAs(['etudiantphysio'])
    expect(await visit(target)).toBe('/access')
  })

  it.each(EDIT_PATHS)('ouvre %s à un administrateur', async (target) => {
    signInAs(['admin'])
    expect(await visit(target)).toBe(target)
  })

  it.each(EDIT_PATHS)('ouvre %s à un rôle de filière ADMIN', async (target) => {
    signInAs(['EnseignantSoins', 'RMSoins', 'SI.ADMIN'])
    expect(await visit(target)).toBe(target)
  })

  it.each(EDIT_PATHS)('refuse %s à un rôle de filière enseignant', async (target) => {
    signInAs(['EnseignantSoins', 'SI.TEACHER'])
    expect(await visit(target)).toBe('/access')
  })

  it.each(READ_PATHS)('laisse %s en lecture sans connexion', async (target) => {
    signInAs(null)
    expect(await visit(target)).toBe(target)
  })

  it('réserve les actions de la liste des modules aux éditeurs', () => {
    const view = fs.readFileSync(
      path.resolve(process.cwd(), 'src/views/planning/CalendarModulesList.vue'),
      'utf8',
    )
    expect(view).toContain('<Panel v-if="canEditCalendar" header="Créer un module">')
    expect(view).toContain('if (!canEditCalendar.value || !draft.value.name) return')
    expect(view).toMatch(/const remove = async \(id\) => \{\s+if \(!canEditCalendar\.value\) return/)
  })

  it('empêche une route dynamique de remplacer un écran d’édition', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/composables/useDynamicRoutes.js'),
      'utf8',
    )
    expect(source).toContain('...CALENDAR_EDIT_ROUTE_NAMES')
  })
})
