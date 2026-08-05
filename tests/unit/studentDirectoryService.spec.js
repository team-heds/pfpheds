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
          { user_id: 's1', Classe: 'BA24' },
          { user_id: 's2', Classe: 'BA25' }
        ]
      }
    })

    expect(await getAllStudents()).toHaveLength(2)
    expect(await countStudents()).toBe(2)
    expect(await getStudentById('s2')).toMatchObject({ Classe: 'BA25' })
    expect(await getStudentsByClass('BA24')).toEqual([{ user_id: 's1', Classe: 'BA24' }])
    expect(apiGet).toHaveBeenCalledTimes(1)
    expect(apiGet).toHaveBeenCalledWith('/audiences/students')
  })

  it('never invents students when the server returns an invalid payload', async () => {
    apiGet.mockResolvedValue({ data: { data: null } })
    expect(await getAllStudents()).toEqual([])
  })
})
