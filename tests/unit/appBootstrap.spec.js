import { describe, expect, it, vi } from 'vitest'
import { bootstrapApplication, isPasswordRecoveryPath } from '@/service/appBootstrap'

describe('appBootstrap', () => {
  it.each(['/reset-password', '/new-password'])(
    'mounts %s without waiting for an existing session',
    async (pathname) => {
      const initializeAuth = vi.fn(() => new Promise(() => {}))
      const initializeUser = vi.fn(() => new Promise(() => {}))
      const waitForRouter = vi.fn().mockResolvedValue(undefined)
      const mount = vi.fn()

      await bootstrapApplication({
        pathname,
        initializeAuth,
        initializeUser,
        waitForRouter,
        mount,
      })

      expect(initializeAuth).not.toHaveBeenCalled()
      expect(initializeUser).not.toHaveBeenCalled()
      expect(waitForRouter).toHaveBeenCalledOnce()
      expect(mount).toHaveBeenCalledOnce()
    },
  )

  it('keeps the full authentication bootstrap for protected routes', async () => {
    let releaseAuth
    const initializeAuth = vi.fn(
      () => new Promise((resolve) => {
        releaseAuth = resolve
      }),
    )
    const initializeUser = vi.fn().mockResolvedValue(undefined)
    const waitForRouter = vi.fn().mockResolvedValue(undefined)
    const mount = vi.fn()

    const bootstrap = bootstrapApplication({
      pathname: '/home',
      initializeAuth,
      initializeUser,
      waitForRouter,
      mount,
    })

    await Promise.resolve()
    expect(initializeAuth).toHaveBeenCalledOnce()
    expect(initializeUser).not.toHaveBeenCalled()
    expect(mount).not.toHaveBeenCalled()

    releaseAuth()
    await bootstrap

    expect(initializeUser).toHaveBeenCalledOnce()
    expect(waitForRouter).toHaveBeenCalledOnce()
    expect(mount).toHaveBeenCalledOnce()
  })

  it('mounts a controlled error state when the protected bootstrap fails', async () => {
    const onError = vi.fn()
    const mount = vi.fn()

    await bootstrapApplication({
      pathname: '/home',
      initializeAuth: vi.fn().mockRejectedValue(new Error('sensitive session detail')),
      initializeUser: vi.fn(),
      waitForRouter: vi.fn(),
      mount,
      onError,
    })

    expect(onError).toHaveBeenCalledOnce()
    expect(mount).toHaveBeenCalledOnce()
  })

  it('bounds a stalled bootstrap and exposes a retryable timeout', async () => {
    vi.useFakeTimers()
    const onError = vi.fn()
    const mount = vi.fn()

    const bootstrap = bootstrapApplication({
      pathname: '/home',
      initializeAuth: vi.fn(() => new Promise(() => {})),
      initializeUser: vi.fn(),
      waitForRouter: vi.fn(),
      mount,
      onError,
      timeoutMs: 50,
    })

    await vi.advanceTimersByTimeAsync(50)
    const result = await bootstrap

    expect(result.ok).toBe(false)
    expect(result.error).toMatchObject({
      code: 'BOOTSTRAP_TIMEOUT',
      retryable: true,
    })
    expect(onError).toHaveBeenCalledWith(result.error, { retry: expect.any(Function) })
    expect(mount).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('retries initialization without mounting the application twice', async () => {
    const initializeAuth = vi.fn()
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValueOnce(undefined)
    const mount = vi.fn()

    const result = await bootstrapApplication({
      pathname: '/home',
      initializeAuth,
      initializeUser: vi.fn().mockResolvedValue(undefined),
      waitForRouter: vi.fn().mockResolvedValue(undefined),
      mount,
    })

    const retryResult = await result.retry()

    expect(retryResult.ok).toBe(true)
    expect(initializeAuth).toHaveBeenCalledTimes(2)
    expect(mount).toHaveBeenCalledOnce()
  })

  it('matches only the two recovery routes', () => {
    expect(isPasswordRecoveryPath('/reset-password')).toBe(true)
    expect(isPasswordRecoveryPath('/new-password')).toBe(true)
    expect(isPasswordRecoveryPath('/home')).toBe(false)
    expect(isPasswordRecoveryPath('/admin')).toBe(false)
  })
})
