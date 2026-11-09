import { describe, expect, it, vi } from 'vitest'
import { needsDailyVisit, recordDailyVisit, zurichDay } from '@/utils/dailyVisit'

const memoryStorage = () => {
  const data = new Map()
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) }
}

describe('connexion du jour', () => {
  it('utilise le jour civil de Zurich', () => {
    // 23h30 UTC le 9 novembre = 00h30 le 10 novembre à Zurich
    expect(zurichDay(new Date('2026-11-09T23:30:00Z'))).toBe('2026-11-10')
    expect(zurichDay(new Date('2026-11-09T10:00:00Z'))).toBe('2026-11-09')
  })

  it('envoie une seule fois par jour et par utilisateur', async () => {
    const storage = memoryStorage()
    const onLogin = vi.fn().mockResolvedValue({ success: true })
    const now = new Date('2026-11-09T10:00:00Z')

    await recordDailyVisit({ userId: 'a', onLogin, storage, now })
    await recordDailyVisit({ userId: 'a', onLogin, storage, now: new Date('2026-11-09T18:00:00Z') })
    expect(onLogin).toHaveBeenCalledTimes(1)

    await recordDailyVisit({ userId: 'b', onLogin, storage, now })
    expect(onLogin).toHaveBeenCalledTimes(2)

    await recordDailyVisit({ userId: 'b', onLogin, storage, now: new Date('2026-11-10T07:00:00Z') })
    expect(onLogin).toHaveBeenCalledTimes(3)
  })

  it('réessaie plus tard si le serveur n’a pas répondu', async () => {
    const storage = memoryStorage()
    const now = new Date('2026-11-09T10:00:00Z')
    await recordDailyVisit({ userId: 'a', onLogin: vi.fn().mockRejectedValue(new Error('réseau')), storage, now })
    expect(needsDailyVisit('a', storage, now)).toBe(true)
    await recordDailyVisit({ userId: 'a', onLogin: vi.fn().mockResolvedValue({ success: false }), storage, now })
    expect(needsDailyVisit('a', storage, now)).toBe(true)
  })

  it('regroupe les appels simultanés (ouverture et formulaire de connexion)', async () => {
    const storage = memoryStorage()
    let resolve
    const onLogin = vi.fn(() => new Promise((r) => { resolve = r }))
    const now = new Date('2026-11-09T10:00:00Z')
    const first = recordDailyVisit({ userId: 'a', onLogin, storage, now })
    const second = recordDailyVisit({ userId: 'a', onLogin, storage, now })
    resolve({ success: true })
    await Promise.all([first, second])
    expect(onLogin).toHaveBeenCalledTimes(1)
  })

  it('ne fait rien sans utilisateur', async () => {
    const onLogin = vi.fn()
    await recordDailyVisit({ userId: null, onLogin, storage: memoryStorage() })
    expect(onLogin).not.toHaveBeenCalled()
  })
})
