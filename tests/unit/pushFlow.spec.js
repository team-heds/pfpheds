import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it, vi } from 'vitest'
import {
  NOTIFICATION_NAVIGATE,
  isInternalPath,
  openNotificationTarget,
  resolveNotificationUrl,
} from '@/utils/notificationClick'

const origin = 'https://app.example.test'
const project = (path) => resolve(process.cwd(), path)
const windowClient = (path, focused = false) => ({
  url: `${origin}${path}`,
  focused,
  focus: vi.fn(async () => 'focused'),
  postMessage: vi.fn(),
})
const clientsApi = (windows) => ({
  matchAll: vi.fn(async () => windows),
  openWindow: vi.fn(async () => 'opened'),
})

describe('lien d’une notification', () => {
  it('garde le chemin, les paramètres et l’ancre', () => {
    expect(resolveNotificationUrl('/mentorat?id=4#demande', origin)).toBe('/mentorat?id=4#demande')
  })

  it.each(['https://evil.example/x', '//evil.example/x', 'javascript:alert(1)'])('refuse %s', (url) => {
    expect(resolveNotificationUrl(url, origin)).toBe('/')
  })

  it('n’accepte qu’un chemin interne depuis le service worker', () => {
    expect(isInternalPath('/feed')).toBe(true)
    expect(isInternalPath('//evil.example')).toBe(false)
    expect(isInternalPath('https://evil.example')).toBe(false)
  })
})

describe('clic sur une notification', () => {
  it('met au premier plan la fenêtre déjà sur la bonne page', async () => {
    const target = windowClient('/mentorat?id=4')
    const api = clientsApi([windowClient('/feed'), target])
    await openNotificationTarget({ rawUrl: '/mentorat?id=4', origin, clientsApi: api })
    expect(target.focus).toHaveBeenCalled()
    expect(target.postMessage).not.toHaveBeenCalled()
    expect(api.openWindow).not.toHaveBeenCalled()
  })

  it('distingue deux pages avec des paramètres différents', async () => {
    const other = windowClient('/mentorat?id=3', true)
    const api = clientsApi([other])
    await openNotificationTarget({ rawUrl: '/mentorat?id=4', origin, clientsApi: api })
    expect(other.postMessage).toHaveBeenCalledWith({ type: NOTIFICATION_NAVIGATE, url: '/mentorat?id=4' })
    expect(other.focus).toHaveBeenCalled()
  })

  it('ouvre une fenêtre si l’application est fermée', async () => {
    const api = clientsApi([])
    await openNotificationTarget({ rawUrl: '/feed', origin, clientsApi: api })
    expect(api.openWindow).toHaveBeenCalledWith('/feed')
  })
})

describe('flux d’abonnement unique', () => {
  it('supprime le second client Supabase', () => {
    expect(existsSync(project('src/push.js'))).toBe(false)
    const store = readFileSync(project('src/stores/pushStore.js'), 'utf8')
    expect(store).not.toContain('createClient')
    expect(store).toContain('enablePushForCurrentUser')
  })

  it('utilise un badge monochrome existant', () => {
    expect(readFileSync(project('src/sw.js'), 'utf8')).toContain("badge: '/icons/notification-badge.png'")
    expect(existsSync(project('public/icons/notification-badge.png'))).toBe(true)
  })
})
