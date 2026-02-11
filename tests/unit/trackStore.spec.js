import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Supabase
const { mockFrom, mockRpc, mockAuthGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockAuthGetUser: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    rpc: (...args) => mockRpc(...args),
    auth: {
      getUser: () => mockAuthGetUser(),
    },
  },
}))

import { useTrackStore } from '@/stores/trackStore'

describe('trackStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTrackStore()
    vi.clearAllMocks()
  })

  // ==================== INITIAL STATE ====================
  describe('initial state', () => {
    it('tracks is empty', () => {
      expect(store.tracks).toEqual([])
    })

    it('userTrackRoles is empty', () => {
      expect(store.userTrackRoles).toEqual([])
    })

    it('activeTrackId is null', () => {
      expect(store.activeTrackId).toBeNull()
    })

    it('loading is false', () => {
      expect(store.loading).toBe(false)
    })

    it('error is null', () => {
      expect(store.error).toBeNull()
    })

    it('initialized is false', () => {
      expect(store.initialized).toBe(false)
    })
  })

  // ==================== GETTERS ====================
  describe('getters', () => {
    it('isSuperAdmin returns false by default', () => {
      expect(store.isSuperAdmin).toBe(false)
    })

    it('isSuperAdmin returns true when user has SUPER_ADMIN role', () => {
      store.userTrackRoles = [{ role: 'SUPER_ADMIN', track_id: null }]
      expect(store.isSuperAdmin).toBe(true)
    })

    it('isSecretariat returns true when user has SECRETARIAT role', () => {
      store.userTrackRoles = [{ role: 'SECRETARIAT', track_id: 'SI' }]
      expect(store.isSecretariat).toBe(true)
    })

    it('isRF returns true when user has RF role', () => {
      store.userTrackRoles = [{ role: 'RF', track_id: 'SI' }]
      expect(store.isRF).toBe(true)
    })

    it('accessibleTracks returns all active tracks for SUPER_ADMIN', () => {
      store.userTrackRoles = [{ role: 'SUPER_ADMIN', track_id: null }]
      store.tracks = [
        { id: 'SI', is_active: true },
        { id: 'PHY', is_active: true },
        { id: 'OLD', is_active: false },
      ]
      expect(store.accessibleTracks).toHaveLength(2)
    })

    it('accessibleTracks returns only user tracks for non-admin', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      store.tracks = [
        { id: 'SI', is_active: true },
        { id: 'PHY', is_active: true },
      ]
      expect(store.accessibleTracks).toHaveLength(1)
      expect(store.accessibleTracks[0].id).toBe('SI')
    })

    it('hasAccessBoth returns true when user has 2+ tracks', () => {
      store.userTrackRoles = [
        { role: 'TEACHER', track_id: 'SI' },
        { role: 'TEACHER', track_id: 'PHY' },
      ]
      store.tracks = [
        { id: 'SI', is_active: true },
        { id: 'PHY', is_active: true },
      ]
      expect(store.hasAccessBoth).toBe(true)
    })

    it('hasAccessBoth returns false when user has 1 track', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      store.tracks = [
        { id: 'SI', is_active: true },
        { id: 'PHY', is_active: true },
      ]
      expect(store.hasAccessBoth).toBe(false)
    })

    it('activeTrack returns the active track object', () => {
      store.tracks = [
        { id: 'SI', label: 'Soins Infirmiers' },
        { id: 'PHY', label: 'Physiothérapie' },
      ]
      store.activeTrackId = 'PHY'
      expect(store.activeTrack).toEqual({ id: 'PHY', label: 'Physiothérapie' })
    })

    it('activeTrack returns null when no active track', () => {
      expect(store.activeTrack).toBeNull()
    })

    it('activeTrackRoles returns roles for active track', () => {
      store.userTrackRoles = [
        { role: 'TEACHER', track_id: 'SI' },
        { role: 'RM', track_id: 'SI' },
        { role: 'TEACHER', track_id: 'PHY' },
      ]
      store.activeTrackId = 'SI'
      expect(store.activeTrackRoles).toEqual(['TEACHER', 'RM'])
    })

    it('activeTrackRoles includes SUPER_ADMIN regardless of track', () => {
      store.userTrackRoles = [
        { role: 'SUPER_ADMIN', track_id: null },
      ]
      store.activeTrackId = 'SI'
      expect(store.activeTrackRoles).toContain('SUPER_ADMIN')
    })

    it('rolesByTrack groups roles correctly', () => {
      store.userTrackRoles = [
        { role: 'TEACHER', track_id: 'SI' },
        { role: 'RM', track_id: 'SI' },
        { role: 'TEACHER', track_id: 'PHY' },
      ]
      expect(store.rolesByTrack).toEqual({
        SI: ['TEACHER', 'RM'],
        PHY: ['TEACHER'],
      })
    })

    it('rolesByTrack uses GLOBAL for null track_id', () => {
      store.userTrackRoles = [{ role: 'SUPER_ADMIN', track_id: null }]
      expect(store.rolesByTrack).toEqual({ GLOBAL: ['SUPER_ADMIN'] })
    })
  })

  // ==================== LOAD TRACKS ====================
  describe('loadTracks', () => {
    it('loads active tracks from Supabase', async () => {
      const mockTracks = [
        { id: 'SI', label: 'Soins Infirmiers', is_active: true },
        { id: 'PHY', label: 'Physiothérapie', is_active: true },
      ]
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTracks, error: null }),
      })

      await store.loadTracks()

      expect(store.tracks).toEqual(mockTracks)
      expect(mockFrom).toHaveBeenCalledWith('tracks')
    })

    it('throws on Supabase error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      })

      await expect(store.loadTracks()).rejects.toThrow()
    })
  })

  // ==================== LOAD USER ROLES ====================
  describe('loadUserRoles', () => {
    it('loads roles via RPC when available', async () => {
      const mockRoles = [
        { track_id: 'SI', role: 'TEACHER' },
        { track_id: 'PHY', role: 'RM' },
      ]
      mockRpc.mockResolvedValue({ data: mockRoles, error: null })

      await store.loadUserRoles()

      expect(store.userTrackRoles).toEqual(mockRoles)
      expect(mockRpc).toHaveBeenCalledWith('api_my_track_roles')
    })

    it('falls back to direct query when RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC not found' } })
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

      const mockData = [
        { track_id: 'SI', role: 'TEACHER', granted_at: '2025-01-01', tracks: { label: 'SI', color: '#blue' } },
      ]
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      })

      await store.loadUserRoles()

      expect(store.userTrackRoles).toHaveLength(1)
      expect(store.userTrackRoles[0].track_id).toBe('SI')
      expect(store.userTrackRoles[0].track_label).toBe('SI')
    })

    it('sets empty roles when no user logged in (fallback)', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC fail' } })
      mockAuthGetUser.mockResolvedValue({ data: { user: null } })

      await store.loadUserRoles()

      expect(store.userTrackRoles).toEqual([])
    })
  })

  // ==================== SET ACTIVE TRACK ====================
  describe('setActiveTrack', () => {
    it('sets active track when user has access', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      store.setActiveTrack('SI')
      expect(store.activeTrackId).toBe('SI')
    })

    it('does not set track when user has no access', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      store.setActiveTrack('PHY')
      expect(store.activeTrackId).toBeNull()
    })

    it('SUPER_ADMIN can set any track', () => {
      store.userTrackRoles = [{ role: 'SUPER_ADMIN', track_id: null }]
      store.setActiveTrack('PHY')
      expect(store.activeTrackId).toBe('PHY')
    })
  })

  // ==================== CAN ACCESS TRACK ====================
  describe('canAccessTrack', () => {
    it('returns true for matching track', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      expect(store.canAccessTrack('SI')).toBe(true)
    })

    it('returns false for non-matching track', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      expect(store.canAccessTrack('PHY')).toBe(false)
    })

    it('SUPER_ADMIN can access any track', () => {
      store.userTrackRoles = [{ role: 'SUPER_ADMIN', track_id: null }]
      expect(store.canAccessTrack('PHY')).toBe(true)
    })
  })

  // ==================== HAS TRACK ROLE ====================
  describe('hasTrackRole', () => {
    it('returns true when user has specific role for track', () => {
      store.userTrackRoles = [{ role: 'RM', track_id: 'SI' }]
      expect(store.hasTrackRole('SI', 'RM')).toBe(true)
    })

    it('returns false when role does not match', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      expect(store.hasTrackRole('SI', 'RM')).toBe(false)
    })

    it('returns false when track does not match', () => {
      store.userTrackRoles = [{ role: 'RM', track_id: 'PHY' }]
      expect(store.hasTrackRole('SI', 'RM')).toBe(false)
    })

    it('SUPER_ADMIN always returns true', () => {
      store.userTrackRoles = [{ role: 'SUPER_ADMIN', track_id: null }]
      expect(store.hasTrackRole('PHY', 'RM')).toBe(true)
    })
  })

  // ==================== HAS ANY TRACK ROLE ====================
  describe('hasAnyTrackRole', () => {
    it('returns true when user has one of the roles', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      expect(store.hasAnyTrackRole('SI', ['RM', 'TEACHER'])).toBe(true)
    })

    it('returns false when user has none of the roles', () => {
      store.userTrackRoles = [{ role: 'STUDENT', track_id: 'SI' }]
      expect(store.hasAnyTrackRole('SI', ['RM', 'TEACHER'])).toBe(false)
    })
  })

  // ==================== HAS MIN ROLE ====================
  describe('hasMinRole', () => {
    it('TEACHER meets TEACHER minimum', () => {
      store.userTrackRoles = [{ role: 'TEACHER', track_id: 'SI' }]
      expect(store.hasMinRole('SI', 'TEACHER')).toBe(true)
    })

    it('RM meets TEACHER minimum (higher rank)', () => {
      store.userTrackRoles = [{ role: 'RM', track_id: 'SI' }]
      expect(store.hasMinRole('SI', 'TEACHER')).toBe(true)
    })

    it('STUDENT does not meet TEACHER minimum', () => {
      store.userTrackRoles = [{ role: 'STUDENT', track_id: 'SI' }]
      expect(store.hasMinRole('SI', 'TEACHER')).toBe(false)
    })

    it('SUPER_ADMIN always meets any minimum', () => {
      store.userTrackRoles = [{ role: 'SUPER_ADMIN', track_id: null }]
      expect(store.hasMinRole('SI', 'TEACHER')).toBe(true)
    })

    it('wrong track returns false', () => {
      store.userTrackRoles = [{ role: 'ADMIN', track_id: 'PHY' }]
      expect(store.hasMinRole('SI', 'TEACHER')).toBe(false)
    })
  })

  // ==================== INIT ====================
  describe('init', () => {
    it('initializes tracks and roles', async () => {
      // Mock loadTracks
      const mockTracks = [{ id: 'SI', is_active: true, label: 'SI' }]
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockTracks, error: null }),
      })

      // Mock loadUserRoles via RPC
      const mockRoles = [{ track_id: 'SI', role: 'TEACHER' }]
      mockRpc.mockResolvedValue({ data: mockRoles, error: null })

      await store.init()

      expect(store.initialized).toBe(true)
      expect(store.tracks).toEqual(mockTracks)
      expect(store.userTrackRoles).toEqual(mockRoles)
      expect(store.activeTrackId).toBe('SI')
      expect(store.loading).toBe(false)
    })

    it('does not re-initialize if already initialized', async () => {
      store.initialized = true
      await store.init()
      expect(mockFrom).not.toHaveBeenCalled()
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('handles errors gracefully', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } }),
      })

      await store.init()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
      expect(store.initialized).toBe(false)
    })
  })

  // ==================== RESET ====================
  describe('reset', () => {
    it('resets all state', () => {
      store.tracks = [{ id: 'SI' }]
      store.userTrackRoles = [{ role: 'TEACHER' }]
      store.activeTrackId = 'SI'
      store.loading = true
      store.error = 'err'
      store.initialized = true

      store.reset()

      expect(store.tracks).toEqual([])
      expect(store.userTrackRoles).toEqual([])
      expect(store.activeTrackId).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.initialized).toBe(false)
    })
  })
})
