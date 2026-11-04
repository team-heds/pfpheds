const test = require('node:test')
const assert = require('node:assert/strict')
const {
  OUT_OF_CHOICE_RANK,
  assignByWeightedChoices
} = require('../domain/weightedChoiceAssignment')

const place = (PlaceId, remainingCapacity = 1, criteriaCovered = []) => ({ PlaceId, remainingCapacity, criteriaCovered })
const student = (userId, choices, extra = {}) => ({ userId, choices, missingCriteria: [], donePlaceIds: [], ...extra })
const byUser = (result) => new Map(result.assignments.map((a) => [a.userId, a]))

test('chaque étudiant obtient son 1er choix quand c’est possible', () => {
  const result = assignByWeightedChoices({
    students: [student('a', ['P1', 'P2']), student('b', ['P2', 'P1'])],
    places: [place('P1'), place('P2')],
    seed: 1
  })
  const map = byUser(result)
  assert.equal(map.get('a').choiceRank, 1)
  assert.equal(map.get('b').choiceRank, 1)
})

test('minimise les lésés avant d’optimiser les rangs', () => {
  // Glouton naïf : a prend P1 (1er choix), b n'a plus rien → 1 lésé.
  // Optimal : a prend P2 (2e choix), b prend P1 → 0 lésé.
  const result = assignByWeightedChoices({
    students: [student('a', ['P1', 'P2'], { sae: true }), student('b', ['P1'])],
    places: [place('P1'), place('P2')],
    seed: 1
  })
  const map = byUser(result)
  assert.equal(map.get('b').placeId, 'P1')
  assert.equal(map.get('a').placeId, 'P2')
  assert.ok(result.assignments.every((a) => a.choiceRank !== OUT_OF_CHOICE_RANK))
})

test('le choix 1 pèse plus que le choix 2 : on évite un 5e choix pour offrir un 1er choix', () => {
  // a : P1 puis P2 ; b : P2 puis … P1 en 5e. Donner P1 à a et P2 à b (1+1) bat P2 à a et P1 à b (2+5).
  const result = assignByWeightedChoices({
    students: [student('a', ['P1', 'P2']), student('b', ['P2', 'X', 'Y', 'Z', 'P1'])],
    places: [place('P1'), place('P2')],
    seed: 3
  })
  const map = byUser(result)
  assert.equal(map.get('a').placeId, 'P1')
  assert.equal(map.get('b').placeId, 'P2')
})

test('à égalité, un étudiant SAE obtient la place disputée', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const result = assignByWeightedChoices({
      students: [student('normal', ['P1', 'P2']), student('sae', ['P1', 'P2'], { sae: true })],
      places: [place('P1'), place('P2')],
      seed
    })
    assert.equal(byUser(result).get('sae').placeId, 'P1')
  }
})

test('une place déjà effectuée n’est jamais réattribuée à l’étudiant', () => {
  const result = assignByWeightedChoices({
    students: [student('a', ['P1'], { donePlaceIds: ['P1'] })],
    places: [place('P1'), place('P2')],
    seed: 1
  })
  const assignment = byUser(result).get('a')
  assert.equal(assignment.placeId, 'P2')
  assert.equal(assignment.choiceRank, OUT_OF_CHOICE_RANK)
})

test('hors choix : la place qui couvre le plus de critères manquants', () => {
  const result = assignByWeightedChoices({
    students: [student('a', ['FULL'], { missingCriteria: ['DE', 'SYSINT'] })],
    places: [place('FULL', 0), place('P_FR', 1, ['FR']), place('P_DE_SYS', 1, ['DE', 'SYSINT'])],
    seed: 1
  })
  const assignment = byUser(result).get('a')
  assert.equal(assignment.placeId, 'P_DE_SYS')
  assert.deepEqual(assignment.criteriaCovered, ['DE', 'SYSINT'])
})

test('respecte les capacités multiples et signale les étudiants sans place', () => {
  const result = assignByWeightedChoices({
    students: [student('a', ['P1']), student('b', ['P1']), student('c', ['P1'])],
    places: [place('P1', 2)],
    seed: 1
  })
  assert.equal(result.assignments.filter((a) => a.placeId === 'P1').length, 2)
  assert.equal(result.unassigned.length, 1)
})

test('le tirage est reproductible avec la même graine', () => {
  const input = {
    students: ['a', 'b', 'c', 'd'].map((id) => student(id, ['P1', 'P2'])),
    places: [place('P1', 2), place('P2', 2)]
  }
  const first = assignByWeightedChoices({ ...input, seed: 42 })
  const second = assignByWeightedChoices({ ...input, seed: 42 })
  assert.deepEqual(first.assignments, second.assignments)
  const draws = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) =>
    assignByWeightedChoices({ ...input, seed }).assignments.filter((a) => a.placeId === 'P1').map((a) => a.userId).sort().join()))
  assert.ok(draws.size > 1, 'des graines différentes doivent pouvoir départager différemment')
})

test('sur une volée réaliste, le nombre de lésés égale le minimum théorique', () => {
  let state = 7
  const rand = () => ((state = (state * 1103515245 + 12345) % 2147483648) / 2147483648)
  const places = Array.from({ length: 40 }, (_, i) => place(`P${i}`, i % 7 === 0 ? 2 : 1))
  const ids = places.map((p) => p.PlaceId)
  const capacity = places.reduce((sum, p) => sum + p.remainingCapacity, 0)
  const students = Array.from({ length: capacity }, (_, i) => {
    const picks = new Set()
    while (picks.size < 5) picks.add(ids[Math.floor(Math.pow(rand(), 2) * ids.length)])
    return student(`s${i}`, [...picks])
  })

  // Minimum théorique : couplage maximal sur les seuls choix.
  const slots = places.flatMap((p) => Array(p.remainingCapacity).fill(p.PlaceId))
  const owner = new Array(slots.length).fill(-1)
  const augment = (s, seen) => slots.some((pid, j) => {
    if (seen[j] || !students[s].choices.includes(pid)) return false
    seen[j] = true
    if (owner[j] < 0 || augment(owner[j], seen)) { owner[j] = s; return true }
    return false
  })
  const matched = students.filter((_, s) => augment(s, new Array(slots.length).fill(false))).length

  const result = assignByWeightedChoices({ students, places, seed: 9 })
  const lesed = result.assignments.filter((a) => a.choiceRank === OUT_OF_CHOICE_RANK).length
  assert.equal(result.assignments.length, students.length)
  assert.equal(lesed, students.length - matched)
  const load = new Map()
  result.assignments.forEach((a) => load.set(a.placeId, (load.get(a.placeId) || 0) + 1))
  places.forEach((p) => assert.ok((load.get(p.PlaceId) || 0) <= p.remainingCapacity))
})
