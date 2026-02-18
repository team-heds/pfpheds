import { db } from '../../firebase'
import { ref as dbRef, push, update, remove, get, onValue } from 'firebase/database'

// Path constant
const DEFIS_PATH = 'defis'

// Create a new challenge (défi)
export const createDefi = async (defi) => {
  const now = new Date().toISOString()
  const data = {
    title: defi.title || '',
    description: defi.description || '',
    type: defi.type || 'general',
    goal: defi.goal || '',
    reward: Number(defi.reward) || 0, // XP reward
    deadline: defi.deadline || null, // ISO date string
    targetHouse: defi.targetHouse || 'all', // optional: Harmonis|Elaris|Doloris|Solencia|all
    active: defi.active !== undefined ? !!defi.active : true,
    createdAt: now,
    updatedAt: now
  }
  const listRef = dbRef(db, DEFIS_PATH)
  const newRef = await push(listRef, data)
  return { id: newRef.key, ...data }
}

// List all challenges
export const listDefis = async () => {
  const snapshot = await get(dbRef(db, DEFIS_PATH))
  if (!snapshot.exists()) return []
  const val = snapshot.val() || {}
  return Object.entries(val).map(([id, item]) => ({ id, ...item }))
}

// List active upcoming challenges (optionally filtered by house)
export const getActiveDefis = async (house = null) => {
  const items = await listDefis()
  const now = new Date()
  return items.filter(d => {
    if (!d.active) return false
    if (d.deadline && new Date(d.deadline) < now) return false
    if (house && d.targetHouse && d.targetHouse !== 'all' && d.targetHouse !== house) return false
    return true
  }).sort((a, b) => {
    const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
    const dbb = b.deadline ? new Date(b.deadline).getTime() : Infinity
    return da - dbb
  })
}

// Subscribe to active upcoming challenges (real-time)
export const subscribeActiveDefis = (house = null, callback) => {
  const ref = dbRef(db, DEFIS_PATH)
  const unsubscribe = onValue(ref, (snapshot) => {
    const val = snapshot.val() || {}
    const items = Object.entries(val).map(([id, item]) => ({ id, ...item }))
    const now = new Date()
    const filtered = items.filter(d => {
      if (!d.active) return false
      if (d.deadline && new Date(d.deadline) < now) return false
      if (house && d.targetHouse && d.targetHouse !== 'all' && d.targetHouse !== house) return false
      return true
    }).sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const dbb = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return da - dbb
    })
    callback(filtered)
  })
  return unsubscribe
}

// Update an existing challenge by id
export const updateDefi = async (id, updates) => {
  const now = new Date().toISOString()
  const upd = { ...updates, updatedAt: now }
  await update(dbRef(db, `${DEFIS_PATH}/${id}`), upd)
}

// Delete a challenge
export const deleteDefi = async (id) => {
  await remove(dbRef(db, `${DEFIS_PATH}/${id}`))
}
