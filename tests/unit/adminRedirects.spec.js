import { describe, expect, it } from 'vitest'

import { getPostLoginRedirect } from '@/config/adminRedirects'

describe('getPostLoginRedirect', () => {
  it('redirige le rôle académique restreint vers son dashboard', () => {
    expect(getPostLoginRedirect(['auth.redirect.dashboard_rm'])).toBe('/admin/dashboard-rm')
  })

  it('redirige les autres utilisateurs vers le feed', () => {
    expect(getPostLoginRedirect(['admin'])).toBe('/feed')
    expect(getPostLoginRedirect()).toBe('/feed')
  })
})
