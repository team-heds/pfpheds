import apiClient from './apiClient'
import { requireAcademicYear } from '@/domain/pfp/academicPeriod'

const CACHE_TTL_MS = 5 * 60 * 1000
const caches = new Map()

export function invalidateStudentDirectoryCache() {
  caches.clear()
}

async function loadStudentDirectory(year) {
  const response = year
    ? await apiClient.get('/audiences/students', { params: { year } })
    : await apiClient.get('/audiences/students')
  if (!Array.isArray(response.data?.data)) {
    throw new Error('Invalid student directory response')
  }
  return response.data.data
}

export async function getAllStudents(year) {
  const canonical = year === undefined ? null : requireAcademicYear(year)
  const key = canonical || 'latest'
  if (!caches.has(key)) caches.set(key, { at: 0, data: null, inFlight: null })
  const cache = caches.get(key)
  const now = Date.now()
  if (cache.inFlight) return await cache.inFlight
  if (cache.data && now - cache.at < CACHE_TTL_MS) return cache.data

  cache.inFlight = loadStudentDirectory(canonical)
  try {
    const students = await cache.inFlight
    cache.data = students
    cache.at = Date.now()
    return students
  } finally {
    cache.inFlight = null
  }
}

export async function getStudentById(userId, year) {
  const normalizedId = String(userId || '').trim()
  if (!normalizedId) return null
  const students = await getAllStudents(year)
  return students.find((student) => String(student.user_id || student.id) === normalizedId) || null
}

export async function getStudentsByClass(classe, year) {
  const expectedClass = String(classe || '').trim()
  if (!expectedClass) return []
  const students = await getAllStudents(year)
  return students.filter((student) => student.Classe === expectedClass)
}

export async function countStudents(year) {
  return (await getAllStudents(year)).length
}

export default {
  countStudents,
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  invalidateStudentDirectoryCache
}
