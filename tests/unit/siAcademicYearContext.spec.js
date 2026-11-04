import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'

const academicYearServiceMock = vi.hoisted(() => ({
  getActiveAcademicYear: vi.fn(),
  getClassesByAcademicYear: vi.fn()
}))

vi.mock('@/service/academicYearService', () => ({
  default: academicYearServiceMock
}))

import {
  buildAcademicClassCodeSet,
  getAcademicClassCodeAliases,
  resetActiveAcademicYearContext,
  slotBelongsToAcademicYear,
  useActiveAcademicYearContext
} from '@/composables/useActiveAcademicYearContext'

describe('contexte partagé de l’année académique SI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetActiveAcademicYearContext()
  })

  it('normalise les alias B/BAC et filtre aussi les créneaux multi-classes', () => {
    const codes = buildAcademicClassCodeSet([
      { code: 'B25' },
      { code: 'B26-EE' }
    ])

    expect(getAcademicClassCodeAliases('bac25')).toEqual(expect.arrayContaining(['BAC25', 'B25']))
    expect(codes.has('BAC25')).toBe(true)
    expect(codes.has('B26-EE')).toBe(true)
    expect(slotBelongsToAcademicYear({ class_code: 'BAC25' }, codes)).toBe(true)
    expect(slotBelongsToAcademicYear({ class_codes: ['BAC24', 'BAC26-EE'] }, codes)).toBe(true)
    expect(slotBelongsToAcademicYear({ class_code: 'BAC24' }, codes)).toBe(false)
    expect(slotBelongsToAcademicYear({ class_code: 'BAC25' }, new Set())).toBe(false)
  })

  it('partage un seul chargement entre plusieurs écrans SI', async () => {
    academicYearServiceMock.getActiveAcademicYear.mockResolvedValue({
      id: 'year-2026',
      name: '2026-2027',
      start_date: '2026-08-01'
    })
    academicYearServiceMock.getClassesByAcademicYear.mockResolvedValue([
      { id: 'class-1', code: 'B26' }
    ])

    const dashboardContext = useActiveAcademicYearContext()
    const workloadContext = useActiveAcademicYearContext()

    await Promise.all([
      dashboardContext.loadActiveAcademicYearContext(),
      workloadContext.loadActiveAcademicYearContext()
    ])

    expect(academicYearServiceMock.getActiveAcademicYear).toHaveBeenCalledTimes(1)
    expect(academicYearServiceMock.getClassesByAcademicYear).toHaveBeenCalledTimes(1)
    expect(dashboardContext.activeYearName.value).toBe('2026-2027')
    expect(workloadContext.activeYearId.value).toBe('year-2026')
    expect(workloadContext.academicStartYear.value).toBe(2026)
    expect(workloadContext.activeClassCodes.value.has('BAC26')).toBe(true)
  })

  it('remplace entièrement le périmètre lors d’un changement d’année', async () => {
    academicYearServiceMock.getActiveAcademicYear
      .mockResolvedValueOnce({ id: 'year-2026', name: '2026-2027' })
      .mockResolvedValueOnce({ id: 'year-2027', name: '2027-2028' })
    academicYearServiceMock.getClassesByAcademicYear
      .mockResolvedValueOnce([{ code: 'B26' }])
      .mockResolvedValueOnce([{ code: 'B27' }])

    const context = useActiveAcademicYearContext()
    await context.loadActiveAcademicYearContext()
    expect(context.activeClassCodes.value.has('BAC26')).toBe(true)

    await context.loadActiveAcademicYearContext({ force: true })
    expect(context.activeYearName.value).toBe('2027-2028')
    expect(context.activeClassCodes.value.has('BAC26')).toBe(false)
    expect(context.activeClassCodes.value.has('BAC27')).toBe(true)
  })

  it('efface le périmètre obsolète après un échec et autorise une nouvelle tentative', async () => {
    academicYearServiceMock.getActiveAcademicYear
      .mockResolvedValueOnce({ id: 'year-2026', name: '2026-2027' })
      .mockRejectedValueOnce(new Error('service indisponible'))
      .mockResolvedValueOnce({ id: 'year-2027', name: '2027-2028' })
    academicYearServiceMock.getClassesByAcademicYear
      .mockResolvedValueOnce([{ code: 'B26' }])
      .mockResolvedValueOnce([{ code: 'B27' }])

    const context = useActiveAcademicYearContext()
    await context.loadActiveAcademicYearContext()

    await expect(context.loadActiveAcademicYearContext({ force: true }))
      .rejects.toThrow('service indisponible')
    expect(context.activeYearId.value).toBeNull()
    expect(context.activeClassCodes.value.size).toBe(0)
    expect(context.error.value).toMatchObject({ message: 'service indisponible' })

    await context.loadActiveAcademicYearContext({ force: true })
    expect(context.activeYearName.value).toBe('2027-2028')
    expect(context.activeClassCodes.value.has('BAC27')).toBe(true)
    expect(context.error.value).toBeNull()
  })

  it('branche les quatre écrans métier sur la source partagée', () => {
    const files = [
      'src/views/admin/soins-infirmiers/DashboardSecretariatSI.vue',
      'src/views/admin/soins-infirmiers/DailyPlanningView.vue',
      'src/views/admin/soins-infirmiers/WorkloadView.vue',
      'src/views/admin/soins-infirmiers/SIPostulationCoursesView.vue'
    ]

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      expect(source).toContain('useActiveAcademicYearContext')
      expect(source).not.toContain("@/service/academicYearService")
    }
  })
})
