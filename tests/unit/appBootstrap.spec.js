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

  it('matches only the two recovery routes', () => {
    expect(isPasswordRecoveryPath('/reset-password')).toBe(true)
    expect(isPasswordRecoveryPath('/new-password')).toBe(true)
    expect(isPasswordRecoveryPath('/home')).toBe(false)
    expect(isPasswordRecoveryPath('/admin')).toBe(false)
  })
})
