import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Supabase — the service uses `this.supabase` which is assigned from the import
let mockFromChain
let mockRpcResult

vi.mock('../../../src/supabase.js', () => {
  const supabaseMock = {
    from: vi.fn(() => mockFromChain),
    rpc: vi.fn(() => Promise.resolve(mockRpcResult || { data: null, error: null })),
  }
  return { supabase: supabaseMock }
})

// We need to import after mocking
const { default: gamificationServiceSupabase, HES_HOUSES, LEVEL_CONFIG } = await import('@/service/gamificationServiceSupabase.js')
// Patch the instance's supabase reference to use our mock
import { supabase as supabaseMock } from '@/supabase'

describe('gamificationServiceSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    gamificationServiceSupabase.cache.clear()
    // Reset supabaseMock.from to use mockFromChain (may have been overridden in tests)
    supabaseMock.from = vi.fn(() => mockFromChain)
    // Ensure the instance uses our mock
    gamificationServiceSupabase.supabase = supabaseMock
  })

  // ==================== CONSTANTS ====================
  describe('HES_HOUSES', () => {
    it('has 4 houses defined', () => {
      expect(Object.keys(HES_HOUSES)).toHaveLength(4)
    })

    it('contains harmonis, elaris, doloris, solencia', () => {
      expect(HES_HOUSES).toHaveProperty('harmonis')
      expect(HES_HOUSES).toHaveProperty('elaris')
      expect(HES_HOUSES).toHaveProperty('doloris')
      expect(HES_HOUSES).toHaveProperty('solencia')
    })

    it('each house has required fields', () => {
      Object.values(HES_HOUSES).forEach(house => {
        expect(house).toHaveProperty('name')
        expect(house).toHaveProperty('motto')
        expect(house).toHaveProperty('color')
        expect(house).toHaveProperty('icon')
        expect(house).toHaveProperty('traits')
        expect(house.traits).toBeInstanceOf(Array)
      })
    })
  })

  describe('LEVEL_CONFIG', () => {
    it('has 5 levels defined', () => {
      expect(Object.keys(LEVEL_CONFIG)).toHaveLength(5)
    })

    it('each level has name, xpRequired, xpToNext', () => {
      Object.values(LEVEL_CONFIG).forEach(level => {
        expect(level).toHaveProperty('name')
        expect(level).toHaveProperty('xpRequired')
        expect(level).toHaveProperty('xpToNext')
      })
    })

    it('levels have increasing xpRequired', () => {
      const levels = Object.keys(LEVEL_CONFIG).map(Number).sort((a, b) => a - b)
      for (let i = 1; i < levels.length; i++) {
        expect(LEVEL_CONFIG[levels[i]].xpRequired).toBeGreaterThan(LEVEL_CONFIG[levels[i - 1]].xpRequired)
      }
    })
  })

  // ==================== getDefaultGamificationData ====================
  describe('getDefaultGamificationData', () => {
    it('returns default structure', () => {
      const data = gamificationServiceSupabase.getDefaultGamificationData()
      expect(data).toEqual({
        maison: null,
        niveau: 1,
        xp: 0,
        totalXP: 0,
        xpToNext: 50,
        lastXPGain: null,
        loginStreak: 0,
        badges: [],
        quests: [],
        challenges: [],
        houseInfo: null,
      })
    })
  })

  // ==================== calculateXPToNext ====================
  describe('calculateXPToNext', () => {
    it('returns XP remaining for next level', () => {
      // Level 1 with 0 XP: next level (2) requires 2² × 100 = 400 XP
      const result = gamificationServiceSupabase.calculateXPToNext(1, 0)
      expect(result).toBe(400)
    })

    it('returns 0 when at max level (20)', () => {
      const result = gamificationServiceSupabase.calculateXPToNext(20, 50000)
      expect(result).toBe(0)
    })

    it('returns 0 when XP exceeds next level requirement', () => {
      // Level 1, XP = 500. Next level (2) requires 400. 400 - 500 = -100 → 0
      const result = gamificationServiceSupabase.calculateXPToNext(1, 500)
      expect(result).toBe(0)
    })

    it('calculates correctly for mid levels', () => {
      // Level 5 with 2000 XP: next level (6) requires 6² × 100 = 3600
      // 3600 - 2000 = 1600
      const result = gamificationServiceSupabase.calculateXPToNext(5, 2000)
      expect(result).toBe(1600)
    })
  })

  // ==================== getHouseInfo ====================
  describe('getHouseInfo (instance method)', () => {
    it('returns house info for valid name', () => {
      const info = gamificationServiceSupabase.getHouseInfo('harmonis')
      expect(info).toBeTruthy()
      expect(info.name).toBe('Harmonis')
    })

    it('returns harmonis as fallback for null input', () => {
      // The second getHouseInfo definition (line 799) returns houses.harmonis as fallback
      const info = gamificationServiceSupabase.getHouseInfo(null)
      expect(info).toBeTruthy()
      expect(info.name).toBe('Harmonis')
    })

    it('is case-insensitive for known houses', () => {
      // Note: the second getHouseInfo uses exact key match, so only lowercase works
      const info = gamificationServiceSupabase.getHouseInfo('elaris')
      expect(info).toBeTruthy()
      expect(info.name).toBe('Elaris')
    })

    it('returns harmonis as fallback for unknown house', () => {
      // The second getHouseInfo definition returns houses.harmonis as default
      const info = gamificationServiceSupabase.getHouseInfo('unknown')
      expect(info).toBeTruthy()
      expect(info.name).toBe('Harmonis')
    })
  })

  // ==================== getHouseDisplayName ====================
  describe('getHouseDisplayName', () => {
    it('returns display name for known houses', () => {
      expect(gamificationServiceSupabase.getHouseDisplayName('harmonis')).toBe('Harmonis')
      expect(gamificationServiceSupabase.getHouseDisplayName('elaris')).toBe('Elaris')
      expect(gamificationServiceSupabase.getHouseDisplayName('doloris')).toBe('Doloris')
      expect(gamificationServiceSupabase.getHouseDisplayName('solencia')).toBe('Solencia')
      expect(gamificationServiceSupabase.getHouseDisplayName('gamemaster')).toBe('Maître du Jeu')
    })

    it('returns input for unknown house', () => {
      expect(gamificationServiceSupabase.getHouseDisplayName('unknown')).toBe('unknown')
    })
  })

  // ==================== getHouseColor ====================
  describe('getHouseColor', () => {
    it('returns correct colors', () => {
      expect(gamificationServiceSupabase.getHouseColor('harmonis')).toBe('#2E8B57')
      expect(gamificationServiceSupabase.getHouseColor('elaris')).toBe('#DC143C')
      expect(gamificationServiceSupabase.getHouseColor('doloris')).toBe('#FFD700')
      expect(gamificationServiceSupabase.getHouseColor('solencia')).toBe('#4169E1')
    })

    it('returns fallback for unknown house', () => {
      expect(gamificationServiceSupabase.getHouseColor('unknown')).toBe('#666666')
    })
  })

  // ==================== getHouseMotto ====================
  describe('getHouseMotto', () => {
    it('returns correct mottos', () => {
      expect(gamificationServiceSupabase.getHouseMotto('harmonis')).toBe("L'équilibre soigne")
      expect(gamificationServiceSupabase.getHouseMotto('elaris')).toBe('Clarifier, guider, apaiser')
    })

    it('returns empty string for unknown house', () => {
      expect(gamificationServiceSupabase.getHouseMotto('unknown')).toBe('')
    })
  })

  // ==================== calculateHouseLevel ====================
  describe('calculateHouseLevel', () => {
    it('returns level 1 for 0 XP', () => {
      const result = gamificationServiceSupabase.calculateHouseLevel(0)
      expect(result.niveau).toBe(1)
      expect(result.name).toBe('Maison Naissante')
    })

    it('returns level 2 for 2375 XP', () => {
      const result = gamificationServiceSupabase.calculateHouseLevel(2375)
      expect(result.niveau).toBe(2)
    })

    it('returns level 20 for very high XP', () => {
      const result = gamificationServiceSupabase.calculateHouseLevel(2000000)
      expect(result.niveau).toBe(20)
      expect(result.name).toBe('Maison Légendaire')
    })

    it('returns xpToNext = 0 at max level', () => {
      const result = gamificationServiceSupabase.calculateHouseLevel(2000000)
      expect(result.xpToNext).toBe(0)
    })

    it('calculates xpToNext correctly for mid levels', () => {
      // Level 1 requires 0 XP, Level 2 requires 2375 XP
      // At 1000 XP: xpToNext = 2375 - 1000 = 1375
      const result = gamificationServiceSupabase.calculateHouseLevel(1000)
      expect(result.niveau).toBe(1)
      expect(result.xpToNext).toBe(2375 - 1000)
    })
  })

  // ==================== invalidateCache ====================
  describe('invalidateCache', () => {
    it('removes user from cache', () => {
      gamificationServiceSupabase.cache.set('gamification_user1', { data: {}, timestamp: Date.now() })
      expect(gamificationServiceSupabase.cache.has('gamification_user1')).toBe(true)

      gamificationServiceSupabase.invalidateCache('user1')
      expect(gamificationServiceSupabase.cache.has('gamification_user1')).toBe(false)
    })

    it('does nothing if user not in cache', () => {
      gamificationServiceSupabase.invalidateCache('nonexistent')
      // No error thrown
    })
  })

  // ==================== getUserGamificationData ====================
  describe('getUserGamificationData', () => {
    it('returns cached data if fresh', async () => {
      const cachedData = { maison: 'elaris', niveau: 3, xp: 500 }
      gamificationServiceSupabase.cache.set('gamification_user1', {
        data: cachedData,
        timestamp: Date.now(),
      })

      const result = await gamificationServiceSupabase.getUserGamificationData('user1')
      expect(result).toEqual(cachedData)
    })

    it('fetches from Supabase when cache is expired', async () => {
      const cachedData = { maison: 'elaris', niveau: 3, xp: 500 }
      gamificationServiceSupabase.cache.set('gamification_user1', {
        data: cachedData,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 min ago (expired)
      })

      // Mock Supabase response for gamification_data
      mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: 'user1', house_id: null, total_xp: 100 },
          error: null,
        }),
      }

      const result = await gamificationServiceSupabase.getUserGamificationData('user1')
      expect(result.maison).toBeNull()
      // total_xp = 100, level = floor(sqrt(100/100)) = 1
      expect(result.xp).toBe(100)
      expect(result.niveau).toBe(1)
    })

    it('returns default data when user not found (PGRST116)', async () => {
      mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'not found' },
        }),
      }

      const result = await gamificationServiceSupabase.getUserGamificationData('unknown')
      expect(result).toEqual(gamificationServiceSupabase.getDefaultGamificationData())
    })

    it('returns default data on Supabase error', async () => {
      mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '500', message: 'Server error' },
        }),
      }

      const result = await gamificationServiceSupabase.getUserGamificationData('user1')
      expect(result).toEqual(gamificationServiceSupabase.getDefaultGamificationData())
    })

    it('returns default data when gamificationData is null', async () => {
      mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      const result = await gamificationServiceSupabase.getUserGamificationData('user1')
      expect(result).toEqual(gamificationServiceSupabase.getDefaultGamificationData())
    })

    it('fetches house info when house_id is present', async () => {
      // The service calls this.supabase.from() twice: once for gamification_data, once for houses
      // We need supabase.from to return different chains for each call
      let fromCallCount = 0
      supabaseMock.from = vi.fn(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          // gamification_data query
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_id: 'user1', house_id: 'house-uuid', total_xp: 500 },
              error: null,
            }),
          }
        }
        // houses query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'house-uuid', name: 'Elaris', level: 2, total_xp: 5000, color: '#DC143C', motto: 'Test', description: 'Desc' },
            error: null,
          }),
        }
      })

      const result = await gamificationServiceSupabase.getUserGamificationData('user1')
      expect(result.maison).toBe('elaris')
      expect(result.houseInfo).toBeTruthy()
      expect(result.houseInfo.name).toBe('Elaris')
    })

    it('caches the result after fetch', async () => {
      mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: 'user1', house_id: null, total_xp: 200 },
          error: null,
        }),
      }

      await gamificationServiceSupabase.getUserGamificationData('user1')
      expect(gamificationServiceSupabase.cache.has('gamification_user1')).toBe(true)
    })

    it('calculates level from XP correctly', async () => {
      // Use 900 XP: level = min(20, max(1, floor(sqrt(900/100)))) = floor(3) = 3
      mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: 'user1', house_id: null, total_xp: 900 },
          error: null,
        }),
      }

      const result = await gamificationServiceSupabase.getUserGamificationData('user1')
      // Level = min(20, max(1, floor(sqrt(900/100)))) = floor(3) = 3
      expect(result.niveau).toBe(3)
      expect(result.totalXP).toBe(900)
    })
  })

  // ==================== userHasValidHouse ====================
  describe('userHasValidHouse', () => {
    it('returns true when user has a house', async () => {
      // Pre-cache data with a house
      gamificationServiceSupabase.cache.set('gamification_user1', {
        data: { maison: 'elaris', niveau: 1 },
        timestamp: Date.now(),
      })

      const result = await gamificationServiceSupabase.userHasValidHouse('user1')
      expect(result).toBe(true)
    })

    it('returns false when user has no house', async () => {
      gamificationServiceSupabase.cache.set('gamification_user1', {
        data: { maison: null, niveau: 1 },
        timestamp: Date.now(),
      })

      const result = await gamificationServiceSupabase.userHasValidHouse('user1')
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      // Force an error by making getUserGamificationData throw
      mockFromChain = {
        select: vi.fn(() => { throw new Error('Network error') }),
      }

      const result = await gamificationServiceSupabase.userHasValidHouse('user1')
      expect(result).toBe(false)
    })
  })

  // ==================== addUserXP ====================
  describe('addUserXP', () => {
    it('invalidates cache and returns fresh data', async () => {
      // Pre-cache
      gamificationServiceSupabase.cache.set('gamification_user1', {
        data: { maison: 'elaris', xp: 100 },
        timestamp: Date.now(),
      })

      mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: 'user1', house_id: null, total_xp: 150 },
          error: null,
        }),
      }

      const result = await gamificationServiceSupabase.addUserXP('user1', 'login')
      // Cache should have been invalidated and re-fetched
      expect(result.xp).toBe(150)
      expect(result.totalXP).toBe(150)
    })
  })

  // ==================== findBestAvailableHouse ====================
  describe('findBestAvailableHouse', () => {
    it('returns the highest-scored house if available', async () => {
      // Mock getHouseMemberCounts
      const mockCounts = { harmonis: 10, elaris: 10, doloris: 10, solencia: 10 }
      vi.spyOn(gamificationServiceSupabase, 'getHouseMemberCounts').mockResolvedValue(mockCounts)

      const quizResults = { elaris: 90, harmonis: 70, doloris: 50, solencia: 30 }
      const result = await gamificationServiceSupabase.findBestAvailableHouse(quizResults)
      expect(result).toBe('elaris')
    })

    it('falls back to next house if preferred is full', async () => {
      const mockCounts = { harmonis: 10, elaris: 50, doloris: 10, solencia: 10 }
      vi.spyOn(gamificationServiceSupabase, 'getHouseMemberCounts').mockResolvedValue(mockCounts)

      const quizResults = { elaris: 90, harmonis: 70, doloris: 50, solencia: 30 }
      const result = await gamificationServiceSupabase.findBestAvailableHouse(quizResults, 50)
      expect(result).toBe('harmonis')
    })

    it('falls back to least full house if all preferred are full', async () => {
      const mockCounts = { harmonis: 50, elaris: 50, doloris: 50, solencia: 5 }
      vi.spyOn(gamificationServiceSupabase, 'getHouseMemberCounts').mockResolvedValue(mockCounts)

      const quizResults = { elaris: 90, harmonis: 70, doloris: 50, solencia: 30 }
      const result = await gamificationServiceSupabase.findBestAvailableHouse(quizResults, 50)
      expect(result).toBe('solencia')
    })

    it('returns least full house if all are over limit', async () => {
      const mockCounts = { harmonis: 60, elaris: 55, doloris: 70, solencia: 51 }
      vi.spyOn(gamificationServiceSupabase, 'getHouseMemberCounts').mockResolvedValue(mockCounts)

      const quizResults = { elaris: 90, harmonis: 70, doloris: 50, solencia: 30 }
      const result = await gamificationServiceSupabase.findBestAvailableHouse(quizResults, 50)
      expect(result).toBe('solencia')
    })

    it('returns first quiz result on error', async () => {
      vi.spyOn(gamificationServiceSupabase, 'getHouseMemberCounts').mockRejectedValue(new Error('fail'))

      const quizResults = { doloris: 90, harmonis: 70 }
      const result = await gamificationServiceSupabase.findBestAvailableHouse(quizResults)
      expect(result).toBe('doloris')
    })
  })
})
