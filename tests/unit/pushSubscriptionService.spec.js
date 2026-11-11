import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const backend = vi.hoisted(() => ({ session: null, rows: [], insertError: null, calls: [] }))

vi.mock('@/supabase', () => {
  const table = () => {
    const filters = {}
    const query = {
      select: () => query,
      eq: (column, value) => { filters[column] = value; return query },
      limit: async () => ({
        data: backend.rows.filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value)),
        error: null,
      }),
      insert: async (row) => {
        backend.calls.push(['insert', row])
        if (!backend.insertError) backend.rows.push(row)
        return { error: backend.insertError }
      },
      delete: () => ({
        eq: async (column, value) => {
          backend.calls.push(['delete', column, value])
          backend.rows = backend.rows.filter((row) => row[column] !== value)
          return { error: null }
        },
      }),
    }
    return query
  }
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: backend.session } }) },
      from: (name) => { backend.calls.push(['from', name]); return table() },
    },
  }
})

import {
  PUSH_STATES,
  disablePushOnThisDevice,
  enablePushForCurrentUser,
  getPushState,
  urlBase64ToUint8Array,
} from '@/service/pushSubscriptionService'

const makeSubscription = (endpoint) => ({
  endpoint,
  unsubscribe: vi.fn(async () => { device.subscription = null; return true }),
  toJSON: () => ({ keys: { p256dh: 'p256dh-key', auth: 'auth-key' } }),
})

const device = { subscription: null, permission: 'default', nextEndpoint: 'https://push.example/new', installed: true }

function installBrowser() {
  const pushManager = {
    getSubscription: vi.fn(async () => device.subscription),
    subscribe: vi.fn(async () => { device.subscription = makeSubscription(device.nextEndpoint); return device.subscription }),
  }
  vi.stubGlobal('PushManager', function PushManager() {})
  vi.stubGlobal('Notification', {
    get permission() { return device.permission },
    requestPermission: vi.fn(async () => device.permission),
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { ready: Promise.resolve({ pushManager }), getRegistration: async () => (device.installed ? { pushManager } : undefined) },
  })
  return pushManager
}

describe('abonnement aux notifications push', () => {
  let pushManager

  beforeEach(() => {
    backend.session = { user: { id: 'user-1' } }
    backend.rows = []
    backend.insertError = null
    backend.calls = []
    Object.assign(device, { subscription: null, permission: 'default', nextEndpoint: 'https://push.example/new', installed: true })
    vi.stubEnv('VITE_VAPID_PUBLIC', 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U')
    pushManager = installBrowser()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    delete navigator.serviceWorker
  })

  it('décode la clé publique du serveur', () => {
    expect([...urlBase64ToUint8Array('AQID')]).toEqual([1, 2, 3])
    expect([...urlBase64ToUint8Array('_-8')]).toEqual([255, 239])
  })

  it('signale un navigateur sans notifications ou un site non configuré', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC', '')
    expect(await getPushState()).toBe(PUSH_STATES.NOT_CONFIGURED)
    vi.unstubAllGlobals()
    expect(await getPushState()).toBe(PUSH_STATES.UNSUPPORTED)
  })

  it('n’attend pas indéfiniment quand le service worker du site est absent', async () => {
    device.installed = false
    expect(await getPushState()).toBe(PUSH_STATES.NOT_CONFIGURED)
    device.permission = 'granted'
    expect(await getPushState()).toBe(PUSH_STATES.NOT_CONFIGURED)
    await expect(enablePushForCurrentUser()).rejects.toMatchObject({ code: 'not_configured' })
  })

  it('distingue bloqué, désactivé et activé pour le compte connecté', async () => {
    device.permission = 'denied'
    expect(await getPushState()).toBe(PUSH_STATES.DENIED)

    device.permission = 'granted'
    expect(await getPushState()).toBe(PUSH_STATES.DISABLED)

    // Abonnement du navigateur enregistré pour un autre compte : pas « activé » pour moi.
    device.subscription = makeSubscription('https://push.example/old')
    backend.rows = [{ id: 1, endpoint: 'https://push.example/old', user_id: 'someone-else' }]
    expect(await getPushState()).toBe(PUSH_STATES.DISABLED)

    backend.rows = [{ id: 1, endpoint: 'https://push.example/old', user_id: 'user-1' }]
    expect(await getPushState()).toBe(PUSH_STATES.ENABLED)
  })

  it('enregistre l’abonnement au nom du compte connecté, jamais anonyme', async () => {
    device.permission = 'granted'
    expect(await enablePushForCurrentUser()).toBe(PUSH_STATES.ENABLED)

    expect(pushManager.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }))
    const [, row] = backend.calls.find(([name]) => name === 'insert')
    expect(row).toMatchObject({
      user_id: 'user-1',
      endpoint: 'https://push.example/new',
      p256dh: 'p256dh-key',
      auth: 'auth-key',
      platform: 'web',
    })
    expect(await getPushState()).toBe(PUSH_STATES.ENABLED)
  })

  it('refuse sans compte connecté ou sans autorisation du navigateur', async () => {
    backend.session = null
    await expect(enablePushForCurrentUser()).rejects.toMatchObject({ code: 'auth_required' })

    backend.session = { user: { id: 'user-1' } }
    device.permission = 'denied'
    await expect(enablePushForCurrentUser()).rejects.toMatchObject({ code: 'denied' })
    expect(pushManager.subscribe).not.toHaveBeenCalled()
    expect(backend.calls.some(([name]) => name === 'insert')).toBe(false)
  })

  it('remplace l’abonnement laissé par un autre compte sur le même navigateur', async () => {
    device.permission = 'granted'
    const previous = makeSubscription('https://push.example/old')
    device.subscription = previous
    backend.rows = [{ id: 1, endpoint: 'https://push.example/old', user_id: 'someone-else' }]

    await enablePushForCurrentUser()

    expect(previous.unsubscribe).toHaveBeenCalled()
    expect(backend.rows.at(-1)).toMatchObject({ user_id: 'user-1', endpoint: 'https://push.example/new' })
  })

  it('ne réinscrit pas un appareil déjà activé pour ce compte', async () => {
    device.permission = 'granted'
    device.subscription = makeSubscription('https://push.example/mine')
    backend.rows = [{ id: 1, endpoint: 'https://push.example/mine', user_id: 'user-1' }]

    await enablePushForCurrentUser()
    expect(pushManager.subscribe).not.toHaveBeenCalled()
    expect(backend.calls.some(([name]) => name === 'insert')).toBe(false)
  })

  it('annule l’abonnement du navigateur si l’enregistrement échoue', async () => {
    device.permission = 'granted'
    backend.insertError = { message: 'row-level security' }
    await expect(enablePushForCurrentUser()).rejects.toMatchObject({ code: 'save_failed' })
    expect(device.subscription).toBeNull()
  })

  it('désactive : supprime la ligne puis l’abonnement du navigateur', async () => {
    device.permission = 'granted'
    await enablePushForCurrentUser()
    expect(await disablePushOnThisDevice()).toBe(PUSH_STATES.DISABLED)
    expect(backend.rows).toHaveLength(0)
    expect(device.subscription).toBeNull()
    expect(await getPushState()).toBe(PUSH_STATES.DISABLED)
  })
})
