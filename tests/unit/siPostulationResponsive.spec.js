import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const view = readFileSync('src/views/admin/soins-infirmiers/SIPostulationCoursesView.vue', 'utf8')

describe('SI postulation responsive experience', () => {
  it('offers a compact rendering with the same planning and vote actions', () => {
    expect(view).toContain('class="desktop-results"')
    expect(view).toContain('class="compact-results"')
    expect(view).toContain('class="slot-card"')

    expect(view.match(/@click="viewInPlanning\(/g)).toHaveLength(2)
    expect(view.match(/removeVote\(.*\) : submitVote\(/g)).toHaveLength(2)
  })

  it('keeps all decision-making fields visible in compact mode', () => {
    const compactTemplate = view.slice(
      view.indexOf('<div class="compact-results"'),
      view.indexOf('</template>\n\n<style scoped>')
    )

    for (const field of [
      'row.moduleNumber',
      'row.courseTitle',
      'row.classCode',
      'row.dayLabel',
      'row.timeRange',
      'row.weekNumber',
      'row.teacherLabel',
      'row.voteCount',
      'row.hasMyVote'
    ]) {
      expect(compactTemplate).toContain(field)
    }
  })

  it('groups related desktop fields so the action column remains visible', () => {
    expect(view).toContain('header="Classe / semaine"')
    expect(view).toContain('header="Créneau"')
    expect(view).toContain("Semaine {{ data.weekNumber || '—' }}")
    expect(view).toContain("{{ data.timeRange || 'Horaire à préciser' }}")
    expect(view).not.toContain('header="Libellé enseignant"')
    expect(view).not.toContain('header="Horaire"')
    expect(view).not.toContain('class="results-eyebrow"')
  })

  it('switches before tablet width and preserves accessible touch targets', () => {
    expect(view).toContain('@media (max-width: 1100px)')
    expect(view).toContain('.desktop-results {\n    display: none;')
    expect(view).toContain('.compact-results {\n    display: grid;')
    expect(view).toContain('min-height: 44px;')
    expect(view).toContain('aria-live="polite"')
    expect(view).toContain(':aria-busy="loading"')
  })
})
