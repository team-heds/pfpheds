import { describe, it, expect } from 'vitest'
import { computePriorityScore, CRITERIA_KEYS } from '@/composables/helpers/computePriorityScore'

// Fixed RNG for deterministic tests (always returns 0.5)
const fixedRng = () => 0.5

// Helper to create a profile with all criteria at 0 (all missing)
const allMissing = (opts = {}) => ({
  criteria: Object.fromEntries(CRITERIA_KEYS.map(k => [k, 0])),
  sae: false,
  casParticulier: false,
  ...opts
})

// Helper to create a profile with all criteria validated
const allValidated = (opts = {}) => ({
  criteria: Object.fromEntries(CRITERIA_KEYS.map(k => [k, 1])),
  sae: false,
  casParticulier: false,
  ...opts
})

describe('computePriorityScore', () => {
  describe('null profile', () => {
    it('returns a small random score when profile is null', () => {
      const score = computePriorityScore(null, 'PFP2', fixedRng)
      expect(score).toBe(0.5)
    })

    it('returns a small random score when profile is undefined', () => {
      const score = computePriorityScore(undefined, 'PFP4', fixedRng)
      expect(score).toBe(0.5)
    })
  })

  describe('critères manquants globaux (A)', () => {
    it('scores max 40 pts when all 8 criteria missing', () => {
      const profile = allMissing()
      const score = computePriorityScore(profile, 'PFP2', fixedRng)
      // A: (8/8)*40 = 40, B: DE=15 + SYSINT=10 = 25, C: 0, D: 0, F: 0.5
      // Total: 65.5 * 1.0 = 65.5
      expect(score).toBe(65.5)
    })

    it('scores 0 pts when all criteria validated', () => {
      const profile = allValidated()
      const score = computePriorityScore(profile, 'PFP2', fixedRng)
      // A: 0, B: 0, C: 0, D: 0, F: 0.5
      // Total: 0.5 * 1.0 = 0.5
      expect(score).toBe(0.5)
    })

    it('scores proportionally for partial missing', () => {
      // 4 out of 8 missing (MSQ, NEUROGER, AIGU, REHAB)
      const profile = allValidated({
        criteria: { MSQ: 0, SYSINT: 1, NEUROGER: 0, AIGU: 0, REHAB: 0, AMBU: 1, FR: 1, DE: 1 }
      })
      const score = computePriorityScore(profile, 'PFP2', fixedRng)
      // A: (4/8)*40 = 20, B: DE=0 + SYSINT=0 = 0, C: 0, D: 0, F: 0.5
      // Total: 20.5 * 1.0 = 20.5
      expect(score).toBe(20.5)
    })
  })

  describe('bonus critères critiques (B)', () => {
    it('adds +15 when DE is missing', () => {
      const withDE = allValidated({ criteria: { ...allValidated().criteria, DE: 0 } })
      const withoutDE = allValidated()
      const scoreWithDE = computePriorityScore(withDE, 'PFP2', fixedRng)
      const scoreWithoutDE = computePriorityScore(withoutDE, 'PFP2', fixedRng)
      // Difference should include +15 (DE bonus) + 5 (1/8 * 40 missing global)
      expect(scoreWithDE - scoreWithoutDE).toBe(20)
    })

    it('adds +10 when SYSINT is missing', () => {
      const withSYSINT = allValidated({ criteria: { ...allValidated().criteria, SYSINT: 0 } })
      const withoutSYSINT = allValidated()
      const scoreWith = computePriorityScore(withSYSINT, 'PFP2', fixedRng)
      const scoreWithout = computePriorityScore(withoutSYSINT, 'PFP2', fixedRng)
      // Difference: +10 (SYSINT bonus) + 5 (1/8 * 40 missing global)
      expect(scoreWith - scoreWithout).toBe(15)
    })

    it('adds +25 when both DE and SYSINT missing', () => {
      const both = allValidated({
        criteria: { ...allValidated().criteria, DE: 0, SYSINT: 0 }
      })
      const neither = allValidated()
      const scoreBoth = computePriorityScore(both, 'PFP2', fixedRng)
      const scoreNeither = computePriorityScore(neither, 'PFP2', fixedRng)
      // Difference: +15 + 10 (bonus) + 10 (2/8 * 40 missing global)
      expect(scoreBoth - scoreNeither).toBe(35)
    })
  })

  describe('bonus SAE (C) et cas particulier (D)', () => {
    it('adds +12 for SAE student', () => {
      const sae = allValidated({ sae: true })
      const noSae = allValidated({ sae: false })
      const diff = computePriorityScore(sae, 'PFP2', fixedRng) - computePriorityScore(noSae, 'PFP2', fixedRng)
      expect(diff).toBe(12)
    })

    it('adds +8 for cas particulier', () => {
      const cas = allValidated({ casParticulier: true })
      const noCas = allValidated({ casParticulier: false })
      const diff = computePriorityScore(cas, 'PFP2', fixedRng) - computePriorityScore(noCas, 'PFP2', fixedRng)
      expect(diff).toBe(8)
    })

    it('adds +20 when both SAE and cas particulier', () => {
      const both = allValidated({ sae: true, casParticulier: true })
      const neither = allValidated()
      const diff = computePriorityScore(both, 'PFP2', fixedRng) - computePriorityScore(neither, 'PFP2', fixedRng)
      expect(diff).toBe(20)
    })
  })

  describe('multiplicateur PFP (E)', () => {
    it('applies ×1.15 for PFP4', () => {
      const profile = allMissing()
      const score = computePriorityScore(profile, 'PFP4', fixedRng)
      // Raw: 40 + 15 + 10 + 0 + 0 + 0.5 = 65.5
      // Final: 65.5 * 1.15 = 75.325 → rounded to 2 decimals
      expect(score).toBeCloseTo(75.33, 1)
    })

    it('applies ×1.05 for PFP3', () => {
      const profile = allMissing()
      const score = computePriorityScore(profile, 'PFP3', fixedRng)
      // Raw: 65.5
      // Final: 65.5 * 1.05 = 68.775 → 68.78
      expect(score).toBe(68.78)
    })

    it('applies ×1.0 for PFP2', () => {
      const profile = allMissing()
      const score = computePriorityScore(profile, 'PFP2', fixedRng)
      expect(score).toBe(65.5)
    })

    it('applies ×1.0 for PFP1', () => {
      const profile = allMissing()
      const score = computePriorityScore(profile, 'PFP1', fixedRng)
      expect(score).toBe(65.5)
    })
  })

  describe('tiebreaker (F)', () => {
    it('adds randomness between 0 and 1', () => {
      const profile = allValidated()
      const scoreZero = computePriorityScore(profile, 'PFP2', () => 0)
      const scoreOne = computePriorityScore(profile, 'PFP2', () => 0.999)
      expect(scoreZero).toBe(0)
      expect(scoreOne).toBe(1)
    })

    it('produces different scores with different random seeds', () => {
      const profile = allValidated()
      const scores = new Set()
      for (let i = 0; i < 10; i++) {
        scores.add(computePriorityScore(profile, 'PFP2', () => i / 10))
      }
      expect(scores.size).toBe(10)
    })
  })

  describe('scénarios réalistes', () => {
    it('PFP4 student SAE with DE+SYSINT missing scores highest', () => {
      const profile = allMissing({ sae: true, casParticulier: true })
      const score = computePriorityScore(profile, 'PFP4', fixedRng)
      // Raw: 40 + 15 + 10 + 12 + 8 + 0.5 = 85.5
      // Final: 85.5 * 1.15 = 98.325 → rounded to 2 decimals
      expect(score).toBeCloseTo(98.33, 1)
    })

    it('PFP2 student with all criteria validated scores near zero', () => {
      const profile = allValidated()
      const score = computePriorityScore(profile, 'PFP2', () => 0)
      expect(score).toBe(0)
    })

    it('ordering is correct: more missing criteria = higher score', () => {
      const student1 = allValidated({ criteria: { ...allValidated().criteria, DE: 0, SYSINT: 0, MSQ: 0 } })
      const student2 = allValidated({ criteria: { ...allValidated().criteria, MSQ: 0 } })
      const score1 = computePriorityScore(student1, 'PFP2', fixedRng)
      const score2 = computePriorityScore(student2, 'PFP2', fixedRng)
      expect(score1).toBeGreaterThan(score2)
    })

    it('SAE student ranks higher than non-SAE with same criteria', () => {
      const sae = allMissing({ sae: true })
      const noSae = allMissing({ sae: false })
      const scoreSae = computePriorityScore(sae, 'PFP2', fixedRng)
      const scoreNoSae = computePriorityScore(noSae, 'PFP2', fixedRng)
      expect(scoreSae).toBeGreaterThan(scoreNoSae)
    })
  })

  describe('CRITERIA_KEYS', () => {
    it('contains exactly 8 criteria', () => {
      expect(CRITERIA_KEYS).toHaveLength(8)
    })

    it('includes all expected criteria', () => {
      expect(CRITERIA_KEYS).toEqual(['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE'])
    })
  })
})
