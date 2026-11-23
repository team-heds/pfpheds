import { describe, expect, it } from 'vitest'
import { hasAdminNavigationAccess } from '@/utils/userAudience'

describe('hasAdminNavigationAccess', () => {
  it('garde le bouton pour un rôle principal admin', () => {
    expect(hasAdminNavigationAccess({ role: 'admin', permissions: [] })).toBe(true)
  })

  it('reconnaît un enseignant admin par ses permissions', () => {
    expect(hasAdminNavigationAccess({ role: 'EnseignantSoins', permissions: ['EnseignantSoins', 'admin'] })).toBe(true)
    expect(hasAdminNavigationAccess({ role: 'EnseignantSoins', permissions: '["super.all"]' })).toBe(true)
  })

  it('ne donne pas le bouton aux autres comptes', () => {
    expect(hasAdminNavigationAccess({ role: 'EnseignantSoins', permissions: ['EnseignantSoins', 'RMSoins'] })).toBe(false)
    expect(hasAdminNavigationAccess({ role: 'EtudiantPhysio', permissions: ['EtudiantPhysio'] })).toBe(false)
    expect(hasAdminNavigationAccess(null)).toBe(false)
  })
})
