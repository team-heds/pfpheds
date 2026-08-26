import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  finishNavigationMeasurement,
  getNavigationMetrics,
  resetNavigationMetrics,
  startNavigationMeasurement
} from '@/service/navigationPerformanceService'

describe('mesure des changements de page', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetNavigationMetrics()
  })

  it('mesure uniquement les noms de routes, sans URL ni paramètres', () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(10).mockReturnValueOnce(210)
    const started = startNavigationMeasurement(
      { name: 'StudentList', path: '/students/private-id', query: { email: 'secret@example.org' } },
      { name: 'Dashboard' }
    )
    const metric = finishNavigationMeasurement(started)

    expect(metric).toMatchObject({ from: 'Dashboard', to: 'StudentList', durationMs: 200 })
    expect(JSON.stringify(metric)).not.toContain('private-id')
    expect(JSON.stringify(metric)).not.toContain('secret@example.org')
  })

  it('borne l’historique aux 50 dernières navigations', () => {
    for (let index = 0; index < 55; index += 1) {
      finishNavigationMeasurement({ startedAt: performance.now(), from: 'A', to: `R${index}` })
    }
    expect(getNavigationMetrics()).toHaveLength(50)
    expect(getNavigationMetrics()[0].to).toBe('R5')
  })
})
