import { afterEach, describe, expect, it, vi } from 'vitest'
import questExpirationService from '@/service/questExpirationService'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/supabase', () => ({ supabase: { from } }))

const queryResult = (result) => {
  const query = {
    update: () => query,
    select: () => query,
    neq: () => query,
    eq: () => query,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  }
  return query
}

describe('questExpirationService.runScheduledCheck', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    from.mockReset()
  })

  it('attend le prochain passage après une coupure réseau, sans erreur console', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    from.mockImplementation(() => queryResult({
      data: null,
      error: { message: 'TypeError: Failed to fetch', details: 'TypeError: Failed to fetch' }
    }))

    await expect(questExpirationService.runScheduledCheck()).resolves.toBe(0)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('journalise une vraie erreur serveur sans casser la vérification', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    from.mockImplementation(() => queryResult({ data: null, error: { message: 'permission denied' } }))

    await expect(questExpirationService.runScheduledCheck()).resolves.toBe(0)
    expect(consoleError).toHaveBeenCalledOnce()
  })

  it('ne lance aucune requête hors ligne', async () => {
    vi.stubGlobal('navigator', { onLine: false })

    await expect(questExpirationService.runScheduledCheck()).resolves.toBe(0)
    expect(from).not.toHaveBeenCalled()
  })

  it('garde la remontée d’erreur pour un appel direct', async () => {
    from.mockImplementation(() => queryResult({ data: null, error: { message: 'Failed to fetch' } }))

    await expect(questExpirationService.updateExpiredQuests()).rejects.toMatchObject({ message: 'Failed to fetch' })
  })
})
