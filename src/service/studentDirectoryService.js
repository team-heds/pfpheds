import apiClient from './apiClient'

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = {
  at: 0,
  data: null,
  inFlight: null
}

export function invalidateStudentDirectoryCache() {
  cache.at = 0
  cache.data = null
}

async function loadStudentDirectory() {
  const response = await apiClient.get('/audiences/students')
  if (!Array.isArray(response.data?.data)) {
    throw new Error('Invalid student directory response')
  }
  return response.data.data
}

export async function getAllStudents() {
  const now = Date.now()
  if (cache.inFlight) return await cache.inFlight
  if (cache.data && now - cache.at < CACHE_TTL_MS) return cache.data

  cache.inFlight = loadStudentDirectory()
  try {
    const students = await cache.inFlight
    cache.data = students
    cache.at = Date.now()
    return students
  } finally {
    cache.inFlight = null
  }
}

export async function getStudentById(userId) {
  const normalizedId = String(userId || '').trim()
  if (!normalizedId) return null
  const students = await getAllStudents()
  return students.find((student) => String(student.user_id || student.id) === normalizedId) || null
}

export async function getStudentsByClass(classe) {
  const expectedClass = String(classe || '').trim()
  if (!expectedClass) return []
  const students = await getAllStudents()
  return students.filter((student) => student.Classe === expectedClass)
}

export async function countStudents() {
  return (await getAllStudents()).length
}

export default {
  countStudents,
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  invalidateStudentDirectoryCache
}
