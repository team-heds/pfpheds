import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRateLimit } from '@/composables/useRateLimit'

describe('useRateLimit', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('allows attempts under the limit', () => {
    const { recordAttempt, isLocked } = useRateLimit({ maxAttempts: 3 })

    expect(isLocked()).toBe(false)
    expect(recordAttempt()).toBe(true)
    expect(recordAttempt()).toBe(true)
  })

  it('blocks after max attempts reached', () => {
    const { recordAttempt, isLocked } = useRateLimit({ maxAttempts: 3, lockoutDuration: 60_000 })

    expect(recordAttempt()).toBe(true)  // 1
    expect(recordAttempt()).toBe(true)  // 2
    expect(recordAttempt()).toBe(false) // 3 → locked
    expect(isLocked()).toBe(true)
  })

  it('returns remaining attempts correctly', () => {
    const { recordAttempt, remainingAttempts } = useRateLimit({ maxAttempts: 3 })

    expect(remainingAttempts.value).toBe(3)
    recordAttempt()
    expect(remainingAttempts.value).toBe(2)
    recordAttempt()
    expect(remainingAttempts.value).toBe(1)
    recordAttempt()
    expect(remainingAttempts.value).toBe(0)
  })

  it('rejects attempts while locked', () => {
    const { recordAttempt, isLocked } = useRateLimit({ maxAttempts: 1, lockoutDuration: 60_000 })

    recordAttempt() // locks
    expect(isLocked()).toBe(true)
    expect(recordAttempt()).toBe(false)
  })

  it('unlocks after lockout duration expires', () => {
    const { recordAttempt, isLocked, remainingAttempts } = useRateLimit({ maxAttempts: 1, lockoutDuration: 1000 })

    recordAttempt() // locks
    expect(isLocked()).toBe(true)

    // Simulate time passing
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1500)

    expect(isLocked()).toBe(false)
    expect(remainingAttempts.value).toBe(1)
  })

  it('getLockoutRemaining returns seconds left', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const { recordAttempt, getLockoutRemaining } = useRateLimit({ maxAttempts: 1, lockoutDuration: 30_000 })

    recordAttempt() // locks
    expect(getLockoutRemaining()).toBe(30)

    vi.spyOn(Date, 'now').mockReturnValue(now + 10_000)
    expect(getLockoutRemaining()).toBe(20)

    vi.spyOn(Date, 'now').mockReturnValue(now + 30_000)
    expect(getLockoutRemaining()).toBe(0)
  })

  it('reset clears all state', () => {
    const { recordAttempt, reset, isLocked, remainingAttempts } = useRateLimit({ maxAttempts: 2, lockoutDuration: 60_000 })

    recordAttempt()
    recordAttempt() // locks
    expect(isLocked()).toBe(true)
    expect(remainingAttempts.value).toBe(0)

    reset()
    expect(isLocked()).toBe(false)
    expect(remainingAttempts.value).toBe(2)
    expect(recordAttempt()).toBe(true)
  })

  it('cleans up old attempts outside the window', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const { recordAttempt, remainingAttempts } = useRateLimit({
      maxAttempts: 3,
      windowDuration: 5000,
      lockoutDuration: 60_000,
    })

    recordAttempt() // attempt at now
    recordAttempt() // attempt at now
    expect(remainingAttempts.value).toBe(1)

    // Move time past the window
    vi.spyOn(Date, 'now').mockReturnValue(now + 6000)

    // Old attempts should be cleaned, so this should succeed
    expect(recordAttempt()).toBe(true)
    expect(remainingAttempts.value).toBe(2) // only 1 attempt in window now
  })

  it('uses default options when none provided', () => {
    const { recordAttempt, remainingAttempts } = useRateLimit()

    expect(remainingAttempts.value).toBe(5) // default maxAttempts
    expect(recordAttempt()).toBe(true)
    expect(remainingAttempts.value).toBe(4)
  })
})
