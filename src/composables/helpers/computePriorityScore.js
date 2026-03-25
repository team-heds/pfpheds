/**
 * Priority Score v2.0 — Calcul basé sur critères métier
 *
 * Barème (max ~100 pts avant multiplicateur):
 *   A. Critères manquants globaux : (missingCount / 8) × 40 → 0-40 pts
 *   B. Bonus critères critiques   : DE manquant +15, SYSINT manquant +10 → 0-25 pts
 *   C. Bonus SAE                  : +12 pts
 *   D. Bonus cas particulier      : +8 pts
 *   E. Multiplicateur PFP         : PFP4 ×1.15, PFP3 ×1.05, autres ×1.0
 *   F. Tiebreaker aléatoire       : 0-1 pt
 */

export const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

/**
 * @param {Object} profile - { criteria: { MSQ: 0|n, SYSINT: 0|n, ... }, sae: bool, casParticulier: bool }
 * @param {string} pfpType - 'PFP1'|'PFP2'|'PFP3'|'PFP4'
 * @param {Function} [randomFn] - Optional RNG for deterministic testing (default: Math.random)
 * @returns {number} Final priority score rounded to 2 decimals
 */
export function computePriorityScore(profile, pfpType, randomFn = Math.random) {
  if (!profile) {
    return Math.round(randomFn() * 100) / 100
  }

  const missingCriteria = CRITERIA_KEYS.filter(c => profile.criteria[c] === 0)
  const missingCount = missingCriteria.length

  // A. Critères manquants globaux
  const missingGlobalScore = (missingCount / CRITERIA_KEYS.length) * 40

  // B. Bonus critères critiques
  const bonusDE = profile.criteria.DE === 0 ? 15 : 0
  const bonusSYSINT = profile.criteria.SYSINT === 0 ? 10 : 0

  // C & D. Bonus SAE et cas particulier
  const bonusSae = profile.sae ? 12 : 0
  const bonusCas = profile.casParticulier ? 8 : 0

  // E. Multiplicateur PFP
  let pfpMultiplier = 1.0
  if (pfpType === 'PFP4') pfpMultiplier = 1.15
  else if (pfpType === 'PFP3') pfpMultiplier = 1.05

  // F. Tiebreaker
  const tiebreaker = randomFn() * 1

  const rawScore = missingGlobalScore + bonusDE + bonusSYSINT + bonusSae + bonusCas + tiebreaker
  return Math.round(rawScore * pfpMultiplier * 100) / 100
}
