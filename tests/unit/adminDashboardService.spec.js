import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Pure logic extracted from adminDashboardService.js ────────

/**
 * Compute global stats from raw query results (same logic as getGlobalStats)
 */
const computeGlobalStats = ({ modules, teacherRoles, rmRoles, coursesCount, allRoles }) => {
  return {
    totalModules: modules.length,
    totalCourses: coursesCount || 0,
    totalUsersWithRoles: new Set(allRoles.map(r => r.user_id)).size,
    si: {
      modules: modules.filter(m => m.track_id === 'SI').length,
      teachers: new Set(teacherRoles.filter(r => r.track_id === 'SI').map(r => r.user_id)).size,
      rm: new Set(rmRoles.filter(r => r.track_id === 'SI').map(r => r.user_id)).size
    },
    phy: {
      modules: modules.filter(m => m.track_id === 'PHY').length,
      teachers: new Set(teacherRoles.filter(r => r.track_id === 'PHY').map(r => r.user_id)).size,
      rm: new Set(rmRoles.filter(r => r.track_id === 'PHY').map(r => r.user_id)).size
    },
    modulesNoTrack: modules.filter(m => !m.track_id).length
  }
}

/**
 * Format track roles with user info (same logic as getAllTrackRoles)
 */
const formatTrackRoles = (rawRoles) => {
  return (rawRoles || []).map(r => ({
    id: r.id,
    userId: r.user_id,
    trackId: r.track_id,
    role: r.role,
    isActive: r.is_active,
    assignedAt: r.assigned_at,
    expiresAt: r.expires_at,
    userName: r.user_profiles?.display_name ||
              `${r.user_profiles?.forname || ''} ${r.user_profiles?.family_name || ''}`.trim() ||
              r.user_profiles?.email ||
              'Inconnu',
    userEmail: r.user_profiles?.email
  }))
}

/**
 * Format users for role assignment (same logic as getUsersForRoleAssignment)
 */
const formatUsersForAssignment = (rawUsers) => {
  return (rawUsers || []).map(u => ({
    id: u.user_id,
    email: u.email,
    name: u.display_name || `${u.forname || ''} ${u.family_name || ''}`.trim() || u.email,
    currentRole: u.role
  }))
}

/**
 * Validate role assignment inputs (same logic as assignTrackRole)
 */
const validateRoleAssignment = (userId, trackId, role) => {
  const allowedRoles = ['ADMIN', 'RM', 'TEACHER', 'SECRETARIAT', 'STUDENT']
  const errors = []
  if (!userId) errors.push('userId invalide')
  if (!trackId) errors.push('trackId invalide')
  if (!allowedRoles.includes(role)) errors.push(`Rôle invalide: ${role}`)
  return { valid: errors.length === 0, errors }
}

/**
 * Default fallback stats (same as catch block in getGlobalStats)
 */
const getDefaultStats = () => ({
  totalModules: 0,
  totalCourses: 0,
  totalUsersWithRoles: 0,
  si: { modules: 0, teachers: 0, rm: 0 },
  phy: { modules: 0, teachers: 0, rm: 0 },
  modulesNoTrack: 0
})

// ── Tests ──────────────────────────────────────────────────────

describe('adminDashboardService – computeGlobalStats', () => {
  it('computes stats correctly with mixed data', () => {
    const input = {
      modules: [
        { id: 1, track_id: 'SI' },
        { id: 2, track_id: 'SI' },
        { id: 3, track_id: 'PHY' },
        { id: 4, track_id: null }
      ],
      teacherRoles: [
        { user_id: 'u1', track_id: 'SI' },
        { user_id: 'u2', track_id: 'SI' },
        { user_id: 'u3', track_id: 'PHY' }
      ],
      rmRoles: [
        { user_id: 'u4', track_id: 'SI' },
        { user_id: 'u5', track_id: 'PHY' }
      ],
      coursesCount: 42,
      allRoles: [
        { user_id: 'u1' },
        { user_id: 'u2' },
        { user_id: 'u3' },
        { user_id: 'u4' },
        { user_id: 'u5' }
      ]
    }

    const stats = computeGlobalStats(input)
    expect(stats.totalModules).toBe(4)
    expect(stats.totalCourses).toBe(42)
    expect(stats.totalUsersWithRoles).toBe(5)
    expect(stats.si.modules).toBe(2)
    expect(stats.si.teachers).toBe(2)
    expect(stats.si.rm).toBe(1)
    expect(stats.phy.modules).toBe(1)
    expect(stats.phy.teachers).toBe(1)
    expect(stats.phy.rm).toBe(1)
    expect(stats.modulesNoTrack).toBe(1)
  })

  it('handles empty data', () => {
    const stats = computeGlobalStats({
      modules: [],
      teacherRoles: [],
      rmRoles: [],
      coursesCount: 0,
      allRoles: []
    })
    expect(stats.totalModules).toBe(0)
    expect(stats.totalCourses).toBe(0)
    expect(stats.totalUsersWithRoles).toBe(0)
    expect(stats.si.modules).toBe(0)
    expect(stats.phy.modules).toBe(0)
    expect(stats.modulesNoTrack).toBe(0)
  })

  it('deduplicates users with multiple roles in same track', () => {
    const input = {
      modules: [],
      teacherRoles: [
        { user_id: 'u1', track_id: 'SI' },
        { user_id: 'u1', track_id: 'SI' } // same user, same track
      ],
      rmRoles: [],
      coursesCount: 0,
      allRoles: [{ user_id: 'u1' }, { user_id: 'u1' }]
    }
    const stats = computeGlobalStats(input)
    expect(stats.si.teachers).toBe(1) // deduplicated
    expect(stats.totalUsersWithRoles).toBe(1)
  })

  it('handles null coursesCount', () => {
    const stats = computeGlobalStats({
      modules: [],
      teacherRoles: [],
      rmRoles: [],
      coursesCount: null,
      allRoles: []
    })
    expect(stats.totalCourses).toBe(0)
  })
})

describe('adminDashboardService – formatTrackRoles', () => {
  it('formats roles with full user profile', () => {
    const raw = [{
      id: 1,
      user_id: 'u1',
      track_id: 'SI',
      role: 'TEACHER',
      is_active: true,
      assigned_at: '2024-01-01',
      expires_at: null,
      user_profiles: {
        display_name: 'Jean Dupont',
        forname: 'Jean',
        family_name: 'Dupont',
        email: 'jean@test.ch'
      }
    }]

    const result = formatTrackRoles(raw)
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('u1')
    expect(result[0].trackId).toBe('SI')
    expect(result[0].role).toBe('TEACHER')
    expect(result[0].isActive).toBe(true)
    expect(result[0].userName).toBe('Jean Dupont')
    expect(result[0].userEmail).toBe('jean@test.ch')
  })

  it('falls back to forname + family_name when no display_name', () => {
    const raw = [{
      id: 2,
      user_id: 'u2',
      track_id: 'PHY',
      role: 'RM',
      is_active: true,
      assigned_at: '2024-01-01',
      expires_at: null,
      user_profiles: {
        forname: 'Marie',
        family_name: 'Martin',
        email: 'marie@test.ch'
      }
    }]

    const result = formatTrackRoles(raw)
    expect(result[0].userName).toBe('Marie Martin')
  })

  it('falls back to email when no name fields', () => {
    const raw = [{
      id: 3,
      user_id: 'u3',
      track_id: 'SI',
      role: 'TEACHER',
      is_active: false,
      assigned_at: null,
      expires_at: null,
      user_profiles: { email: 'anon@test.ch' }
    }]

    const result = formatTrackRoles(raw)
    expect(result[0].userName).toBe('anon@test.ch')
  })

  it('falls back to "Inconnu" when no user_profiles', () => {
    const raw = [{
      id: 4,
      user_id: 'u4',
      track_id: 'SI',
      role: 'STUDENT',
      is_active: true,
      assigned_at: null,
      expires_at: null,
      user_profiles: null
    }]

    const result = formatTrackRoles(raw)
    expect(result[0].userName).toBe('Inconnu')
  })

  it('returns empty array for null input', () => {
    expect(formatTrackRoles(null)).toEqual([])
  })
})

describe('adminDashboardService – formatUsersForAssignment', () => {
  it('formats users with display_name', () => {
    const raw = [{
      user_id: 'u1',
      email: 'jean@test.ch',
      display_name: 'Jean Dupont',
      forname: 'Jean',
      family_name: 'Dupont',
      role: 'admin'
    }]

    const result = formatUsersForAssignment(raw)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('u1')
    expect(result[0].name).toBe('Jean Dupont')
    expect(result[0].currentRole).toBe('admin')
  })

  it('falls back to forname + family_name', () => {
    const raw = [{
      user_id: 'u2',
      email: 'marie@test.ch',
      forname: 'Marie',
      family_name: 'Martin',
      role: 'student'
    }]

    const result = formatUsersForAssignment(raw)
    expect(result[0].name).toBe('Marie Martin')
  })

  it('falls back to email when no name', () => {
    const raw = [{
      user_id: 'u3',
      email: 'anon@test.ch',
      role: 'student'
    }]

    const result = formatUsersForAssignment(raw)
    expect(result[0].name).toBe('anon@test.ch')
  })

  it('returns empty array for null input', () => {
    expect(formatUsersForAssignment(null)).toEqual([])
  })
})

describe('adminDashboardService – validateRoleAssignment', () => {
  it('accepts valid inputs', () => {
    const result = validateRoleAssignment('user-123', 'SI', 'TEACHER')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing userId', () => {
    const result = validateRoleAssignment(null, 'SI', 'TEACHER')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('userId invalide')
  })

  it('rejects missing trackId', () => {
    const result = validateRoleAssignment('u1', null, 'TEACHER')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('trackId invalide')
  })

  it('rejects invalid role', () => {
    const result = validateRoleAssignment('u1', 'SI', 'SUPERADMIN')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Rôle invalide: SUPERADMIN')
  })

  it('accepts all allowed roles', () => {
    const allowed = ['ADMIN', 'RM', 'TEACHER', 'SECRETARIAT', 'STUDENT']
    allowed.forEach(role => {
      expect(validateRoleAssignment('u1', 'SI', role).valid).toBe(true)
    })
  })

  it('reports multiple errors at once', () => {
    const result = validateRoleAssignment(null, null, 'INVALID')
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })
})

describe('adminDashboardService – getDefaultStats', () => {
  it('returns zeroed stats object', () => {
    const stats = getDefaultStats()
    expect(stats.totalModules).toBe(0)
    expect(stats.totalCourses).toBe(0)
    expect(stats.totalUsersWithRoles).toBe(0)
    expect(stats.si).toEqual({ modules: 0, teachers: 0, rm: 0 })
    expect(stats.phy).toEqual({ modules: 0, teachers: 0, rm: 0 })
    expect(stats.modulesNoTrack).toBe(0)
  })
})
