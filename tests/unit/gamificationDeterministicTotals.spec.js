import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  getLevelFromXP,
  getLevelProgress,
  getXPForLevel,
  getXPToNextLevel,
} from '@/config/levelsConfig'

const source = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8')

describe('deterministic gamification totals', () => {
  it.each([
    [-10, 1],
    [0, 1],
    [99, 1],
    [100, 2],
    [399, 2],
    [400, 3],
    [36100, 20],
    [40000, 20],
  ])('maps %s XP to level %s', (xp, expectedLevel) => {
    expect(getLevelFromXP(xp)).toBe(expectedLevel)
  })

  it('uses the same quadratic thresholds for progress and the next level', () => {
    expect(getXPForLevel(1)).toBe(0)
    expect(getXPForLevel(2)).toBe(100)
    expect(getXPForLevel(3)).toBe(400)
    expect(getXPToNextLevel(2, 250)).toBe(150)
    expect(getLevelProgress(2, 250)).toBe(50)
    expect(getXPToNextLevel(20, 40000)).toBe(0)
  })

  it('routes privileged mutations through audited Supabase RPCs', () => {
    const users = source('src/components/admin/UserManagement.vue')

    expect(users).toContain("supabase.rpc('admin_adjust_user_gamification_xp'")
    expect(users).toContain("supabase.rpc('admin_assign_user_gamification_house'")
    expect(users).not.toMatch(/from\('gamification_data'\)[\s\S]{0,160}\.update\(/)
    expect(users).not.toMatch(/from\('xp_history'\)[\s\S]{0,160}\.insert\(/)
  })

  it('keeps house totals derived and removes browser-side level repairs', () => {
    const houses = source('src/components/admin/HouseManagement.vue')
    const profile = source('src/components/gamification/GamificationProfilePage.vue')

    expect(houses).toContain("supabase.rpc('get_house_gamification_totals'")
    expect(houses).toContain("somme des XP de ses membres")
    expect(houses).not.toContain('house_points_history')
    expect(houses).not.toContain('Attribuer Points')
    expect(profile).not.toMatch(/from\('gamification_data'\)[\s\S]{0,160}\.update\(/)
    expect(profile).not.toContain('updateLevelFromXP')
  })
})
