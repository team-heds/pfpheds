const hashText = (value) => {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const seededRandom = (seed) => {
  let state = seed || 1
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const normalizeVentriglisseParticipants = (participants, limit = 6) => {
  const seen = new Map()
  return participants.slice(0, limit).map((participant, index) => {
    const fallback = `Joueur ${index + 1}`
    const rawName = String(participant?.name || fallback).trim().slice(0, 32) || fallback
    const count = (seen.get(rawName.toLocaleLowerCase('fr')) || 0) + 1
    seen.set(rawName.toLocaleLowerCase('fr'), count)
    return {
      ...participant,
      name: count === 1 ? rawName : `${rawName} ${count}`,
    }
  })
}

export const createVentriglisseRace = (participants, round = 1) => {
  const normalized = normalizeVentriglisseParticipants(participants)
  const raceSeed = hashText(`${round}:${normalized.map(({ name }) => name).join('|')}`)
  const random = seededRandom(raceSeed)

  return normalized.map((participant, index) => ({
    ...participant,
    lane: index + 1,
    distance: 0,
    velocity: 26 + random() * 10,
    drag: 3.6 + random() * 2,
  }))
}

export const rankVentriglisseRace = (participants) => (
  [...participants].sort((left, right) => (
    right.distance - left.distance || left.lane - right.lane
  ))
)

export const scoreVentriglisseRound = (participants) => (
  rankVentriglisseRace(participants).map((participant, index, ranking) => {
    const roundPoints = Math.max(1, ranking.length - index)
    return {
      ...participant,
      roundPoints,
      score: (participant.score || 0) + roundPoints,
    }
  })
)
