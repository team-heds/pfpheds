import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  join(process.cwd(), 'src/views/admin/pfp/PlacesAssignmentView.vue'),
  'utf8'
)

describe('place assignment review view', () => {
  it('connects the visible table to the place assignment filters', () => {
    expect(source).toContain(':value="filteredResults"')
    expect(source).toContain('filterPlaceAssignmentReview(reviewRows.value')
    expect(source).toContain("label=\"Recherche par place\"")
    expect(source).toContain('Place, institution ou étudiant…')
  })

  it('publishes only the explicitly reviewed assignment ids', () => {
    expect(source).toContain(".in('id', idsToPublish)")
    expect(source).toContain(".in('id', publishedIds)")
    expect(source).not.toContain(".eq('year', selectedYear.value)\n      .eq('status', 'draft')")
  })

  it('does not mutate practitioner assignments during page loading', () => {
    const loadResultsBody = source.slice(source.indexOf('const loadResults'), source.indexOf('// Formater la date'))
    expect(loadResultsBody).not.toContain('await autoAssignPraticiens()')
  })

  it('keeps pedagogical validation distinct from publication review', () => {
    expect(source).toContain('header="Stage validé"')
    expect(source).toContain('Validation pédagogique après réalisation du stage')
    expect(source).toContain('review_status')
  })
})
