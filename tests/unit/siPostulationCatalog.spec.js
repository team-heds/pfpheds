import { describe, expect, it, vi } from 'vitest'
import {
  buildPostulationRows,
  fetchPlanningSlotsPaginated,
  formatPostulationDay,
  normalizePostulationText
} from '@/service/siPostulationService'

const courseA = { id: 'course-a', name: 'Cours A' }
const courseB = { id: 'course-b', name: 'Cours B' }
const moduleA = { id: 1, code: 'SI-A', number: 'A', title: 'Module A' }

function slot(overrides = {}) {
  return {
    id: 1,
    class_code: 'BA25',
    module_code: 'SI-A',
    week_number: 41,
    day: 'friday',
    day_index: 4,
    start_time: '13:00',
    end_time: '14:00',
    teachers: ['postulation'],
    course_title: 'Communication clinique',
    ...overrides
  }
}

describe('HEDS25-633 catalogue des postulations SI', () => {
  it('normalise les titres et utilise la vraie colonne day', () => {
    expect(normalizePostulationText(' Communication\n  clinique\t')).toBe('Communication clinique')
    expect(formatPostulationDay(slot())).toBe('Vendredi')
  })

  it('conserve le lien direct et le vrai titre du créneau', () => {
    const [row] = buildPostulationRows({
      slots: [slot({ course_id: courseA.id, course_title: '  Soins\nrelationnels ' })],
      modules: [moduleA],
      courses: [courseA]
    })

    expect(row.courseId).toBe(courseA.id)
    expect(row.courseLinkSource).toBe('direct')
    expect(row.courseTitle).toBe('Soins relationnels')
  })

  it('déduit uniquement un lien de cours unique dans le même module', () => {
    const rows = buildPostulationRows({
      slots: [
        slot({ id: 1, course_id: null }),
        slot({ id: 2, teachers: ['Mme Exemple'], course_id: courseA.id })
      ],
      modules: [moduleA],
      courses: [courseA]
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].courseId).toBe(courseA.id)
    expect(rows[0].courseLinkSource).toBe('module_unique')
  })

  it('refuse un lien arbitraire quand plusieurs cours existent dans le module', () => {
    const rows = buildPostulationRows({
      slots: [
        slot({ id: 1, course_id: null }),
        slot({ id: 2, teachers: ['Mme A'], course_id: courseA.id }),
        slot({ id: 3, teachers: ['M. B'], course_id: courseB.id })
      ],
      modules: [moduleA],
      courses: [courseA, courseB]
    })

    expect(rows[0].courseId).toBeNull()
    expect(rows[0].courseLinkSource).toBe('missing')
  })

  it('pagine au-delà de 1000 lignes et filtre l’année académique active', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => slot({ id: index + 1 }))
    const secondPage = [slot({ id: 1001 }), slot({ id: 1002, class_code: 'BA24' })]
    const range = vi.fn((from) => Promise.resolve({
      data: from === 0 ? firstPage : secondPage,
      error: null
    }))
    const order = vi.fn(() => ({ range }))
    const select = vi.fn(() => ({ order, in: vi.fn(() => ({ order })) }))
    const client = { from: vi.fn(() => ({ select })) }

    const result = await fetchPlanningSlotsPaginated({
      classCodes: new Set(['BA25']),
      pageSize: 1000,
      client
    })

    expect(range).toHaveBeenCalledTimes(2)
    expect(result).toHaveLength(1001)
    expect(result.at(-1).id).toBe(1001)
  })

  it('refuse une requête non limitée à une année académique', async () => {
    await expect(fetchPlanningSlotsPaginated({ classCodes: new Set() }))
      .rejects.toThrow('année académique active')
  })
})
