import { afterEach, describe, expect, it, vi } from 'vitest'
import { pageHealth, pageTextLength, resetPageHealth, trackedFetch } from '@/service/pageHealth'
import { installToastDedupe } from '@/utils/toastDedupe'
import adminRoutes from '@/router/routes/admin'
import appRoutes from '@/router/routes/apps'
import mediaRoutes from '@/router/routes/media'
import pageRoutes from '@/router/routes/pages'
import profileRoutes from '@/router/routes/profiles'

describe('échecs de chargement', () => {
  afterEach(resetPageHealth)

  it('compte les erreurs serveur et réseau, pas les réponses normales', async () => {
    await trackedFetch(async () => ({ status: 200 }))()
    await trackedFetch(async () => ({ status: 404 }))()
    await trackedFetch(async () => ({ status: 503 }))()
    await expect(trackedFetch(async () => { throw new TypeError('Failed to fetch') })()).rejects.toThrow()
    expect(pageHealth.failures).toBe(2)
  })

  it('ignore une requête annulée', async () => {
    await expect(trackedFetch(async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }) })()).rejects.toThrow()
    expect(pageHealth.failures).toBe(0)
  })

  it('mesure le texte de la page sans la navigation', () => {
    const root = document.createElement('div')
    root.innerHTML = '<nav>Accueil Profil Paramètres</nav><main>Contenu</main>'
    expect(pageTextLength(root)).toBe('Contenu'.length)
  })
})

describe('messages d’erreur', () => {
  const bus = () => ({ sent: [], emit(event, message) { this.sent.push([event, message?.summary]) } })

  it('ne garde qu’un message dans une rafale d’erreurs', () => {
    let time = 0
    const target = bus()
    installToastDedupe(target, () => time)
    target.emit('add', { severity: 'error', summary: 'A' })
    time = 500
    target.emit('add', { severity: 'error', summary: 'B' })
    time = 3000
    target.emit('add', { severity: 'error', summary: 'A' })
    time = 9000
    target.emit('add', { severity: 'error', summary: 'A' })
    expect(target.sent.map(([, summary]) => summary)).toEqual(['A', 'A'])
  })

  it('laisse passer les autres messages', () => {
    const target = bus()
    installToastDedupe(target, () => 0)
    target.emit('add', { severity: 'success', summary: 'Enregistré' })
    target.emit('add', { severity: 'success', summary: 'Enregistré' })
    target.emit('remove-all-groups')
    expect(target.sent).toHaveLength(3)
  })

  it('peut être retiré', () => {
    const target = bus()
    const original = target.emit
    const stop = installToastDedupe(target)
    stop()
    expect(target.emit).toBe(original)
    vi.restoreAllMocks()
  })
})

describe('pages techniques', () => {
  it.each([
    [adminRoutes, '/admin/supabase-diagnostic'],
    [appRoutes, '/tools/ftp-upload'],
    [appRoutes, '/supabase-demo'],
    [mediaRoutes, '/vimeo-test'],
    [pageRoutes, '/router-inspector'],
    [pageRoutes, '/docs/primevue'],
    [profileRoutes, '/diagnostic-gamification'],
  ])('%#', (routes, path) => {
    expect(routes.find((route) => route.path === path).meta.need).toEqual(['super.all'])
  })

  it('renvoie l’ancienne page de test des notifications vers les paramètres', () => {
    expect(pageRoutes.find((route) => route.path === '/push').redirect).toBe('/settings')
    expect(pageRoutes.find((route) => route.path === '/push2').redirect).toBe('/settings')
  })
})
