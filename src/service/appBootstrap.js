const PASSWORD_RECOVERY_PATHS = new Set(['/reset-password', '/new-password'])

export function isPasswordRecoveryPath(pathname) {
  return PASSWORD_RECOVERY_PATHS.has(pathname)
}

export async function bootstrapApplication(options) {
  const {
    pathname,
    initializeAuth,
    initializeUser,
    waitForRouter,
    mount,
    onError = () => {},
  } = options

  try {
    if (!isPasswordRecoveryPath(pathname)) {
      await initializeAuth()
      await initializeUser()
    }
    await waitForRouter()
  } catch (error) {
    onError(error)
  } finally {
    mount()
  }
}
