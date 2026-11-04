/**
 * Attribution des places PFP par choix pondérés.
 *
 * Ordre de priorité (strict) :
 *   1. le moins possible d'étudiants hors de leurs choix (« lésés ») ;
 *   2. les meilleurs rangs de choix pour toute la volée : le choix 1 pèse plus que le 2, etc. ;
 *   3. SAE puis cas particulier prioritaires lorsqu'ils se disputent une place ;
 *   4. hors choix : la place qui couvre le plus de critères manquants ;
 *   5. un tirage au sort reproductible (graine) ne départage que les vrais ex aequo.
 * Une place déjà effectuée par l'étudiant ne lui est jamais attribuée.
 *
 * L'affectation est optimale pour la volée entière (méthode hongroise sur les créneaux de
 * capacité), pas étudiant par étudiant.
 */

const CRITERIA_KEYS = Object.freeze(['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE'])

// Coût d'un choix selon son rang. La progression croissante évite de donner un 5e choix à
// quelqu'un pour offrir un 1er choix à un autre.
const RANK_COSTS = Object.freeze([0, 1, 3, 6, 10])
const OUT_OF_CHOICE_RANK = 99

// Paliers de coût : chaque palier domine la somme maximale du palier inférieur pour toute
// la volée (≤ 25 000 par étudiant pour les rangs, ≤ 250 000 pour la priorité hors choix),
// ce qui garantit l'ordre strict des règles 1 → 5 jusqu'à plusieurs milliers d'étudiants.
const LESE_COST = 1e9
const NO_PLACE_COST = 1e12
const FORBIDDEN_COST = 1e13

const priorityWeight = (student) => 1 + (student.sae ? 1 : 0) + (student.casParticulier ? 0.5 : 0)

function createRandom(seed) {
  let state = Number(seed) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromString(value) {
  let hash = 2166136261
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

// Méthode hongroise (minimisation), n lignes ≤ m colonnes.
function solveAssignment(rowCount, columnCount, cost) {
  const INF = Number.POSITIVE_INFINITY
  const u = new Array(rowCount + 1).fill(0)
  const v = new Array(columnCount + 1).fill(0)
  const p = new Array(columnCount + 1).fill(0)
  const way = new Array(columnCount + 1).fill(0)

  for (let i = 1; i <= rowCount; i++) {
    p[0] = i
    let j0 = 0
    const minv = new Array(columnCount + 1).fill(INF)
    const used = new Array(columnCount + 1).fill(false)
    do {
      used[j0] = true
      const i0 = p[j0]
      let delta = INF
      let j1 = 0
      for (let j = 1; j <= columnCount; j++) {
        if (used[j]) continue
        const current = cost(i0 - 1, j - 1) - u[i0] - v[j]
        if (current < minv[j]) {
          minv[j] = current
          way[j] = j0
        }
        if (minv[j] < delta) {
          delta = minv[j]
          j1 = j
        }
      }
      for (let j = 0; j <= columnCount; j++) {
        if (used[j]) {
          u[p[j]] += delta
          v[j] -= delta
        } else {
          minv[j] -= delta
        }
      }
      j0 = j1
    } while (p[j0] !== 0)
    do {
      const j1 = way[j0]
      p[j0] = p[j1]
      j0 = j1
    } while (j0)
  }

  const rowToColumn = new Array(rowCount).fill(-1)
  for (let j = 1; j <= columnCount; j++) if (p[j]) rowToColumn[p[j] - 1] = j - 1
  return rowToColumn
}

/**
 * @param {object} input
 * @param {Array} input.students - { userId, choices: PlaceId[] (ordre = rang), missingCriteria, donePlaceIds,
 *                                    completedStageCount, sae, casParticulier, priorityScore }
 * @param {Array} input.places - { PlaceId, remainingCapacity, criteriaCovered: string[] }
 * @param {number|string} input.seed - graine du tirage au sort
 * @returns {{ assignments: Array<{ userId, placeId, choiceRank, criteriaCovered }>, unassigned: string[], seed: number }}
 */
function assignByWeightedChoices({ students, places, seed }) {
  const numericSeed = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : seedFromString(seed)
  const random = createRandom(numericSeed)

  const slots = []
  places.forEach((place) => {
    for (let i = 0; i < Math.max(0, place.remainingCapacity || 0); i++) slots.push(place)
  })

  const prepared = students.map((student) => {
    const done = new Set((student.donePlaceIds || []).map(String))
    const missing = Array.isArray(student.missingCriteria) ? student.missingCriteria : []
    const choices = (student.choices || []).map(String).filter((id, index, all) => id && all.indexOf(id) === index)
    const germanFirst = Number(student.completedStageCount || 0) === 1 && missing.includes('DE')
    return { student, done, missing, choices, germanFirst, weight: priorityWeight(student), noise: new Map() }
  })

  const tieBreak = (entry, placeId) => {
    if (!entry.noise.has(placeId)) entry.noise.set(placeId, random() * 0.001)
    return entry.noise.get(placeId)
  }

  const coveredBy = (entry, place) =>
    (place.criteriaCovered || []).filter((criteria) => entry.missing.includes(criteria))

  // Colonnes = créneaux réels + une colonne « sans place » par étudiant (si la capacité manque).
  const columnCount = slots.length + prepared.length
  const cost = (row, column) => {
    const entry = prepared[row]
    if (column >= slots.length) return NO_PLACE_COST
    const place = slots[column]
    const placeId = String(place.PlaceId)
    if (entry.done.has(placeId)) return FORBIDDEN_COST

    const rankIndex = entry.choices.indexOf(placeId)
    if (rankIndex >= 0) {
      const rankCost = RANK_COSTS[Math.min(rankIndex, RANK_COSTS.length - 1)]
      return rankCost * entry.weight * 1000 + tieBreak(entry, placeId)
    }

    // Hors choix : toujours après les choix, puis priorité aux SAE pour ne pas être lésés,
    // puis la place la plus utile pour les critères manquants.
    const covered = coveredBy(entry, place).length
    const germanBonus = entry.germanFirst && (place.criteriaCovered || []).includes('DE') ? 1 : 0
    return LESE_COST + entry.weight * 1e5 - (covered + germanBonus) * 100 + tieBreak(entry, placeId)
  }

  const rowToColumn = prepared.length ? solveAssignment(prepared.length, columnCount, cost) : []

  const assignments = []
  const unassigned = []
  prepared.forEach((entry, row) => {
    const column = rowToColumn[row]
    const place = column >= 0 && column < slots.length ? slots[column] : null
    if (!place || entry.done.has(String(place.PlaceId))) {
      unassigned.push(entry.student.userId)
      return
    }
    const rankIndex = entry.choices.indexOf(String(place.PlaceId))
    assignments.push({
      userId: entry.student.userId,
      placeId: place.PlaceId,
      choiceRank: rankIndex >= 0 ? rankIndex + 1 : OUT_OF_CHOICE_RANK,
      criteriaCovered: coveredBy(entry, place),
    })
  })

  return { assignments, unassigned, seed: numericSeed }
}

module.exports = {
  CRITERIA_KEYS,
  OUT_OF_CHOICE_RANK,
  RANK_COSTS,
  assignByWeightedChoices,
  seedFromString,
}
