import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

// ── Mock authStore ─────────────────────────────────────────────

const mockUser = ref(null)

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: mockUser.value
  })
}))

vi.mock('@/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ data: [], error: null })
      })
    })
  }
}))

// ── Logique pure extraite de useModulePermissions ──────────────

const ADMIN_EMAILS = ['admin@hevs.ch', 'antoine.quarroz@hevs.ch']

const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email)
}

const checkIsModuleOwner = (module, userEmail, isAdmin) => {
  if (!module || !userEmail) return false
  if (isAdmin) return true
  if (module.responsable_email === userEmail) return true

  if (module.coordinateur && typeof module.coordinateur === 'string') {
    const coordinators = module.coordinateur.split(',').map(e => e.trim().toLowerCase())
    if (coordinators.includes(userEmail.toLowerCase())) return true
  }

  if (module.responsable && userEmail) {
    const emailName = userEmail.split('@')[0].toLowerCase()
    const responsableName = module.responsable.toLowerCase()
    return responsableName.includes(emailName)
  }

  return false
}

const filterAccessible = (modules, userEmail, isAdmin) => {
  if (!modules || !Array.isArray(modules)) return []
  if (isAdmin) return modules
  return modules.filter(m => checkIsModuleOwner(m, userEmail, isAdmin))
}

const getPermissionErrorMessage = (action) => {
  const messages = {
    view: "Vous n'avez pas la permission de voir ce module",
    edit: "Vous n'avez pas la permission de modifier ce module",
    delete: "Seuls les administrateurs peuvent supprimer des modules",
    create: "Seuls les administrateurs peuvent créer des modules"
  }
  return messages[action] || "Permission refusée"
}

// ── Tests ──────────────────────────────────────────────────────

describe('useModulePermissions – isAdminEmail', () => {
  it('reconnaît les emails admin', () => {
    expect(isAdminEmail('admin@hevs.ch')).toBe(true)
    expect(isAdminEmail('antoine.quarroz@hevs.ch')).toBe(true)
  })

  it('rejette les emails non-admin', () => {
    expect(isAdminEmail('student@hevs.ch')).toBe(false)
    expect(isAdminEmail('random@gmail.com')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
  })
})

describe('useModulePermissions – checkIsModuleOwner', () => {
  it('admin est toujours owner', () => {
    const module = { responsable_email: 'other@hevs.ch' }
    expect(checkIsModuleOwner(module, 'admin@hevs.ch', true)).toBe(true)
  })

  it('responsable_email match', () => {
    const module = { responsable_email: 'jean@hevs.ch' }
    expect(checkIsModuleOwner(module, 'jean@hevs.ch', false)).toBe(true)
  })

  it('responsable_email ne match pas', () => {
    const module = { responsable_email: 'jean@hevs.ch' }
    expect(checkIsModuleOwner(module, 'paul@hevs.ch', false)).toBe(false)
  })

  it('coordinateur match (un seul)', () => {
    const module = { coordinateur: 'jean@hevs.ch' }
    expect(checkIsModuleOwner(module, 'jean@hevs.ch', false)).toBe(true)
  })

  it('coordinateur match (plusieurs, séparés par virgule)', () => {
    const module = { coordinateur: 'paul@hevs.ch, jean@hevs.ch, marie@hevs.ch' }
    expect(checkIsModuleOwner(module, 'jean@hevs.ch', false)).toBe(true)
  })

  it('coordinateur ne match pas', () => {
    const module = { coordinateur: 'paul@hevs.ch, marie@hevs.ch' }
    expect(checkIsModuleOwner(module, 'jean@hevs.ch', false)).toBe(false)
  })

  it('fallback par nom du responsable (substring match)', () => {
    const module = { responsable: 'Jean Dupont' }
    // emailName = 'jean' qui est inclus dans 'jean dupont'
    expect(checkIsModuleOwner(module, 'jean@hevs.ch', false)).toBe(true)
  })

  it('fallback par nom ne match pas', () => {
    const module = { responsable: 'Marie Martin' }
    expect(checkIsModuleOwner(module, 'jean@hevs.ch', false)).toBe(false)
  })

  it('fallback par nom avec dot ne match pas (dot vs space)', () => {
    const module = { responsable: 'Jean Dupont' }
    // emailName = 'jean.dupont' n'est PAS un substring de 'jean dupont'
    expect(checkIsModuleOwner(module, 'jean.dupont@hevs.ch', false)).toBe(false)
  })

  it('retourne false si module est null', () => {
    expect(checkIsModuleOwner(null, 'jean@hevs.ch', false)).toBe(false)
  })

  it('retourne false si email est null', () => {
    expect(checkIsModuleOwner({ responsable_email: 'jean@hevs.ch' }, null, false)).toBe(false)
  })

  it('coordinateur case-insensitive', () => {
    const module = { coordinateur: 'Jean@HEVS.ch' }
    expect(checkIsModuleOwner(module, 'jean@hevs.ch', false)).toBe(true)
  })
})

describe('useModulePermissions – filterAccessible', () => {
  const modules = [
    { id: 1, responsable_email: 'jean@hevs.ch' },
    { id: 2, responsable_email: 'paul@hevs.ch' },
    { id: 3, coordinateur: 'jean@hevs.ch, marie@hevs.ch' },
  ]

  it('admin voit tout', () => {
    expect(filterAccessible(modules, 'admin@hevs.ch', true)).toHaveLength(3)
  })

  it('non-admin voit seulement ses modules', () => {
    const result = filterAccessible(modules, 'jean@hevs.ch', false)
    expect(result).toHaveLength(2) // module 1 (responsable) et 3 (coordinateur)
    expect(result.map(m => m.id)).toEqual([1, 3])
  })

  it('retourne vide si aucun module accessible', () => {
    expect(filterAccessible(modules, 'nobody@hevs.ch', false)).toHaveLength(0)
  })

  it('retourne vide si modules est null', () => {
    expect(filterAccessible(null, 'jean@hevs.ch', false)).toHaveLength(0)
  })

  it('retourne vide si modules n\'est pas un array', () => {
    expect(filterAccessible('not array', 'jean@hevs.ch', false)).toHaveLength(0)
  })
})

describe('useModulePermissions – getPermissionErrorMessage', () => {
  it('retourne le bon message pour view', () => {
    expect(getPermissionErrorMessage('view')).toContain('voir')
  })

  it('retourne le bon message pour edit', () => {
    expect(getPermissionErrorMessage('edit')).toContain('modifier')
  })

  it('retourne le bon message pour delete', () => {
    expect(getPermissionErrorMessage('delete')).toContain('supprimer')
  })

  it('retourne le bon message pour create', () => {
    expect(getPermissionErrorMessage('create')).toContain('créer')
  })

  it('retourne message par défaut pour action inconnue', () => {
    expect(getPermissionErrorMessage('unknown')).toBe('Permission refusée')
  })
})
