import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiGet = vi.hoisted(() => vi.fn())

vi.mock('@/service/apiClient', () => ({
  default: { get: apiGet }
}))

import {
  countStudents,
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  invalidateStudentDirectoryCache
} from '@/service/studentDirectoryService'

describe('studentDirectoryService', () => {
  beforeEach(() => {
    apiGet.mockReset()
    invalidateStudentDirectoryCache()
  })

  it('uses the authenticated server directory as the only list source', async () => {
    apiGet.mockResolvedValue({
      data: {
        data: [
          { user_id: 's1', Classe: 'BA24', repondant_hes: 'Marie Curie' },
          { user_id: 's2', Classe: 'BA25' }
        ]
      }
    })

    expect(await getAllStudents()).toHaveLength(2)
    expect(await countStudents()).toBe(2)
    expect(await getStudentById('s2')).toMatchObject({ Classe: 'BA25' })
    expect(await getStudentsByClass('BA24')).toEqual([{ user_id: 's1', Classe: 'BA24', repondant_hes: 'Marie Curie' }])
    expect(apiGet).toHaveBeenCalledTimes(1)
    expect(apiGet).toHaveBeenCalledWith('/audiences/students')
  })

  it('fails visibly instead of converting an invalid payload into an empty list', async () => {
    apiGet.mockResolvedValue({ data: { data: null } })
    await expect(getAllStudents()).rejects.toThrow('Invalid student directory response')
  })

  it('isolates academic-year caches and normalizes aliases', async () => {
    apiGet.mockImplementation(async (_url, options) => ({ data: { data: [{ user_id: 's', year: options?.params.year || 'latest' }] } }))
    expect((await getAllStudents('2026'))[0].year).toBe('2026')
    expect((await getAllStudents('2026-2027'))[0].year).toBe('2027')
    expect((await getAllStudents('2027'))[0].year).toBe('2027')
    expect((await getAllStudents())[0].year).toBe('latest')
    expect(apiGet).toHaveBeenCalledTimes(3)
    invalidateStudentDirectoryCache()
    await getAllStudents('2027')
    expect(apiGet).toHaveBeenCalledTimes(4)
  })

  it('does not reuse in-flight requests across years or after invalidation', async () => {
    let resolveOld
    apiGet.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValue({ data: { data: [{ user_id: 'new' }] } })
    const old = getAllStudents('2026')
    await getAllStudents('2027')
    invalidateStudentDirectoryCache()
    const current = await getAllStudents('2026')
    resolveOld({ data: { data: [{ user_id: 'old' }] } })
    await old
    expect(await getAllStudents('2026')).toBe(current)
    expect(current[0].user_id).toBe('new')
    expect(apiGet).toHaveBeenCalledTimes(3)
  })

  it('rejects invalid years without making an API request', async () => {
    await expect(getAllStudents('2027-2026')).rejects.toThrow()
    expect(apiGet).not.toHaveBeenCalled()
  })
})
