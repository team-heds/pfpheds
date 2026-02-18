import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Pure logic extracted from rolesService.js ────────────────

const ROLES = {
  GAME_MASTER: 'game_master',
  HOUSE_COACH: 'house_coach',
  PROFESSOR: 'professor',
  ADMIN: 'admin',
  STUDENT: 'student'
}

const PERMISSIONS = {
  MANAGE_ALL: 'manage_all',
  CREATE_CHALLENGES: 'create_challenges',
  EDIT_CHALLENGES: 'edit_challenges',
  DELETE_CHALLENGES: 'delete_challenges',
  VIEW_CHALLENGES: 'view_challenges',
  CREATE_QUESTS: 'create_quests',
  EDIT_QUESTS: 'edit_quests',
  DELETE_QUESTS: 'delete_quests',
  VIEW_QUESTS: 'view_quests',
  CREATE_BADGES: 'create_badges',
  EDIT_BADGES: 'edit_badges',
  DELETE_BADGES: 'delete_badges',
  VIEW_BADGES: 'view_badges',
  MANAGE_USERS: 'manage_users',
  ASSIGN_ROLES: 'assign_roles',
  VIEW_USER_STATS: 'view_user_stats',
  MANAGE_HOUSES: 'manage_houses',
  MANAGE_HOUSE_POINTS: 'manage_house_points',
  VIEW_HOUSE_STATS: 'view_house_stats',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data'
}

const ROLE_PERMISSIONS = {
  [ROLES.GAME_MASTER]: [
    PERMISSIONS.MANAGE_ALL, PERMISSIONS.CREATE_CHALLENGES, PERMISSIONS.EDIT_CHALLENGES,
    PERMISSIONS.DELETE_CHALLENGES, PERMISSIONS.VIEW_CHALLENGES, PERMISSIONS.CREATE_QUESTS,
    PERMISSIONS.EDIT_QUESTS, PERMISSIONS.DELETE_QUESTS, PERMISSIONS.VIEW_QUESTS,
    PERMISSIONS.CREATE_BADGES, PERMISSIONS.EDIT_BADGES, PERMISSIONS.DELETE_BADGES,
    PERMISSIONS.VIEW_BADGES, PERMISSIONS.MANAGE_USERS, PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.VIEW_USER_STATS, PERMISSIONS.MANAGE_HOUSES, PERMISSIONS.MANAGE_HOUSE_POINTS,
    PERMISSIONS.VIEW_HOUSE_STATS, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.EXPORT_DATA
  ],
  [ROLES.HOUSE_COACH]: [
    PERMISSIONS.CREATE_CHALLENGES, PERMISSIONS.EDIT_CHALLENGES, PERMISSIONS.VIEW_CHALLENGES,
    PERMISSIONS.CREATE_QUESTS, PERMISSIONS.EDIT_QUESTS, PERMISSIONS.VIEW_QUESTS,
    PERMISSIONS.VIEW_BADGES, PERMISSIONS.VIEW_USER_STATS, PERMISSIONS.MANAGE_HOUSE_POINTS,
    PERMISSIONS.VIEW_HOUSE_STATS, PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.PROFESSOR]: [
    PERMISSIONS.CREATE_CHALLENGES, PERMISSIONS.EDIT_CHALLENGES, PERMISSIONS.VIEW_CHALLENGES,
    PERMISSIONS.VIEW_QUESTS, PERMISSIONS.VIEW_BADGES, PERMISSIONS.VIEW_USER_STATS,
    PERMISSIONS.VIEW_HOUSE_STATS, PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_ALL, PERMISSIONS.CREATE_CHALLENGES, PERMISSIONS.EDIT_CHALLENGES,
    PERMISSIONS.DELETE_CHALLENGES, PERMISSIONS.VIEW_CHALLENGES, PERMISSIONS.CREATE_QUESTS,
    PERMISSIONS.EDIT_QUESTS, PERMISSIONS.DELETE_QUESTS, PERMISSIONS.VIEW_QUESTS,
    PERMISSIONS.CREATE_BADGES, PERMISSIONS.EDIT_BADGES, PERMISSIONS.DELETE_BADGES,
    PERMISSIONS.VIEW_BADGES, PERMISSIONS.MANAGE_USERS, PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.VIEW_USER_STATS, PERMISSIONS.MANAGE_HOUSES, PERMISSIONS.MANAGE_HOUSE_POINTS,
    PERMISSIONS.VIEW_HOUSE_STATS, PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.EXPORT_DATA
  ],
  [ROLES.STUDENT]: []
}

/**
 * Check if a role has a specific permission (same logic as hasPermission)
 */
const hasPermissionForRole = (role, permission) => {
  if (role === ROLES.GAME_MASTER || role === ROLES.ADMIN) return true
  const rolePermissions = ROLE_PERMISSIONS[role] || []
  return rolePermissions.includes(permission)
}

/**
 * Validate role (same logic as setUserRole)
 */
const isValidRole = (role) => Object.values(ROLES).includes(role)

/**
 * Convert Supabase user_roles data to roles object (same logic as getUserRolesSupabase)
 */
const convertRolesDataToObject = (rolesData) => {
  const rolesObject = {}
  ;(rolesData || []).forEach(role => {
    if (role.is_active) {
      rolesObject[role.role_name] = true
    }
  })
  return rolesObject
}

/**
 * Convert single profile role to object (same logic as getUserRolesSupabase fallback)
 */
const convertProfileRoleToObject = (profileData) => {
  if (profileData?.role) {
    return { [profileData.role]: true }
  }
  return { user: true }
}

/**
 * Format users with roles (same logic as getAllUsersWithRoles)
 */
const formatUsersWithRoles = (usersObj) => {
  const usersWithRoles = []
  for (const [userId, userData] of Object.entries(usersObj)) {
    usersWithRoles.push({
      id: userId,
      email: userData.email,
      displayName: userData.displayName,
      house: userData.house,
      role: userData.role || ROLES.STUDENT,
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin
    })
  }
  return usersWithRoles
}

// ── Tests ──────────────────────────────────────────────────────

describe('rolesService – ROLES constants', () => {
  it('defines all expected roles', () => {
    expect(ROLES.GAME_MASTER).toBe('game_master')
    expect(ROLES.HOUSE_COACH).toBe('house_coach')
    expect(ROLES.PROFESSOR).toBe('professor')
    expect(ROLES.ADMIN).toBe('admin')
    expect(ROLES.STUDENT).toBe('student')
  })

  it('has exactly 5 roles', () => {
    expect(Object.keys(ROLES)).toHaveLength(5)
  })
})

describe('rolesService – PERMISSIONS constants', () => {
  it('defines all expected permissions', () => {
    expect(Object.keys(PERMISSIONS)).toHaveLength(21)
    expect(PERMISSIONS.MANAGE_ALL).toBe('manage_all')
    expect(PERMISSIONS.EXPORT_DATA).toBe('export_data')
  })
})

describe('rolesService – ROLE_PERMISSIONS mapping', () => {
  it('game_master has all permissions', () => {
    const allPerms = Object.values(PERMISSIONS)
    allPerms.forEach(perm => {
      expect(ROLE_PERMISSIONS[ROLES.GAME_MASTER]).toContain(perm)
    })
  })

  it('admin has all permissions', () => {
    const allPerms = Object.values(PERMISSIONS)
    allPerms.forEach(perm => {
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toContain(perm)
    })
  })

  it('student has no permissions', () => {
    expect(ROLE_PERMISSIONS[ROLES.STUDENT]).toHaveLength(0)
  })

  it('house_coach cannot delete challenges', () => {
    expect(ROLE_PERMISSIONS[ROLES.HOUSE_COACH]).not.toContain(PERMISSIONS.DELETE_CHALLENGES)
  })

  it('house_coach can manage house points', () => {
    expect(ROLE_PERMISSIONS[ROLES.HOUSE_COACH]).toContain(PERMISSIONS.MANAGE_HOUSE_POINTS)
  })

  it('professor cannot create quests', () => {
    expect(ROLE_PERMISSIONS[ROLES.PROFESSOR]).not.toContain(PERMISSIONS.CREATE_QUESTS)
  })

  it('professor can view analytics', () => {
    expect(ROLE_PERMISSIONS[ROLES.PROFESSOR]).toContain(PERMISSIONS.VIEW_ANALYTICS)
  })
})

describe('rolesService – hasPermissionForRole', () => {
  it('game_master always returns true', () => {
    expect(hasPermissionForRole(ROLES.GAME_MASTER, PERMISSIONS.MANAGE_ALL)).toBe(true)
    expect(hasPermissionForRole(ROLES.GAME_MASTER, 'nonexistent_perm')).toBe(true)
  })

  it('admin always returns true', () => {
    expect(hasPermissionForRole(ROLES.ADMIN, PERMISSIONS.MANAGE_ALL)).toBe(true)
    expect(hasPermissionForRole(ROLES.ADMIN, 'nonexistent_perm')).toBe(true)
  })

  it('student has no permissions', () => {
    expect(hasPermissionForRole(ROLES.STUDENT, PERMISSIONS.VIEW_CHALLENGES)).toBe(false)
    expect(hasPermissionForRole(ROLES.STUDENT, PERMISSIONS.MANAGE_ALL)).toBe(false)
  })

  it('professor can view challenges but not delete them', () => {
    expect(hasPermissionForRole(ROLES.PROFESSOR, PERMISSIONS.VIEW_CHALLENGES)).toBe(true)
    expect(hasPermissionForRole(ROLES.PROFESSOR, PERMISSIONS.DELETE_CHALLENGES)).toBe(false)
  })

  it('unknown role has no permissions', () => {
    expect(hasPermissionForRole('unknown_role', PERMISSIONS.VIEW_CHALLENGES)).toBe(false)
  })
})

describe('rolesService – isValidRole', () => {
  it('accepts valid roles', () => {
    Object.values(ROLES).forEach(role => {
      expect(isValidRole(role)).toBe(true)
    })
  })

  it('rejects invalid roles', () => {
    expect(isValidRole('superadmin')).toBe(false)
    expect(isValidRole('')).toBe(false)
    expect(isValidRole(null)).toBe(false)
    expect(isValidRole(undefined)).toBe(false)
  })
})

describe('rolesService – convertRolesDataToObject', () => {
  it('converts active roles to object', () => {
    const data = [
      { role_name: 'admin', is_active: true },
      { role_name: 'editor', is_active: true },
      { role_name: 'viewer', is_active: false }
    ]
    const result = convertRolesDataToObject(data)
    expect(result).toEqual({ admin: true, editor: true })
  })

  it('returns empty object for empty array', () => {
    expect(convertRolesDataToObject([])).toEqual({})
  })

  it('returns empty object for null', () => {
    expect(convertRolesDataToObject(null)).toEqual({})
  })

  it('ignores inactive roles', () => {
    const data = [{ role_name: 'admin', is_active: false }]
    expect(convertRolesDataToObject(data)).toEqual({})
  })
})

describe('rolesService – convertProfileRoleToObject', () => {
  it('converts profile role to object', () => {
    expect(convertProfileRoleToObject({ role: 'admin' })).toEqual({ admin: true })
  })

  it('returns default user role when no role', () => {
    expect(convertProfileRoleToObject({})).toEqual({ user: true })
    expect(convertProfileRoleToObject(null)).toEqual({ user: true })
  })
})

describe('rolesService – formatUsersWithRoles', () => {
  it('formats users correctly', () => {
    const users = {
      'uid1': {
        email: 'admin@test.ch',
        displayName: 'Admin User',
        house: 'Phoenix',
        role: 'admin',
        createdAt: '2024-01-01',
        lastLogin: '2024-06-01'
      },
      'uid2': {
        email: 'student@test.ch',
        displayName: 'Student User'
      }
    }

    const result = formatUsersWithRoles(users)
    expect(result).toHaveLength(2)

    const admin = result.find(u => u.id === 'uid1')
    expect(admin.email).toBe('admin@test.ch')
    expect(admin.role).toBe('admin')
    expect(admin.house).toBe('Phoenix')

    const student = result.find(u => u.id === 'uid2')
    expect(student.role).toBe(ROLES.STUDENT) // default
  })

  it('returns empty array for empty object', () => {
    expect(formatUsersWithRoles({})).toHaveLength(0)
  })
})
