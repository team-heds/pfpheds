import { describe, expect, it } from 'vitest'
import {
  assertFpOverviewDataResults,
  buildFpOverviewExportIdentity,
  buildFpOverviewStudentFields,
  FP_OVERVIEW_IDENTITY_COLUMNS,
  getFpOverviewGroupBounds,
  PFP_STAGE_EXPORT_COLUMNS,
  matchesFpOverviewSearch
} from '@/service/fpOverviewRespondentService'

describe('fpOverviewRespondentService', () => {
  it('maps the canonical student directory respondent without another lookup', () => {
    expect(buildFpOverviewStudentFields({
      id: 'student-1',
      Nom: 'Dupont',
      Prenom: 'Alice',
      Classe: 'BA24',
      repondant_hes: '  Marie Curie  '
    })).toEqual({
      userId: 'student-1',
      nom: 'Dupont',
      prenom: 'Alice',
      classe: 'BA24',
      repondantHes: 'Marie Curie'
    })
  })

  it('uses an empty value when no respondent is assigned', () => {
    expect(buildFpOverviewStudentFields({ id: 'student-2' }).repondantHes).toBe('')
  })

  it('includes the respondent in textual search', () => {
    const row = { nom: 'Dupont', repondantHes: 'Marie Curie' }
    expect(matchesFpOverviewSearch(row, 'curie')).toBe(true)
    expect(matchesFpOverviewSearch(row, 'einstein')).toBe(false)
  })

  it('keeps respondent and HES trainer as distinct export fields', () => {
    expect(buildFpOverviewExportIdentity({
      nom: 'Dupont',
      prenom: 'Alice',
      classe: 'BA24',
      repondantHes: 'Marie Curie'
    })).toMatchObject({
      repondantHes: 'Marie Curie',
      formateurHES: ''
    })
  })

  it('fails the whole view when a required Supabase result contains an error', () => {
    expect(() => assertFpOverviewDataResults({
      institutions: { data: null, error: { message: 'permission denied' } }
    })).toThrow('Impossible de charger institutions')
    expect(() => assertFpOverviewDataResults({ places: { data: [], error: null } })).not.toThrow()
  })

  it('locks the PFP export schema and keeps respondent separate from trainer', () => {
    expect(PFP_STAGE_EXPORT_COLUMNS).toHaveLength(18)
    expect(PFP_STAGE_EXPORT_COLUMNS.map(column => column.key)).toEqual([
      'institution', 'placeName', 'criteres', 'domaine', 'classe', 'nom', 'prenom',
      'pf', 'pfEmail', 'repondantHes', 'formateurHES', 'annee', 'cptStatus',
      'evalStatus', 'particularites', 'absences', 'notes', 'remarques'
    ])
  })

  it('locks overview identity columns and PFP group offsets', () => {
    expect(FP_OVERVIEW_IDENTITY_COLUMNS.map(column => column.key)).toEqual([
      'nom', 'prenom', 'classe', 'repondantHes'
    ])
    expect(getFpOverviewGroupBounds(0, 13)).toEqual({ start: 5, end: 17 })
    expect(getFpOverviewGroupBounds(3, 13)).toEqual({ start: 44, end: 56 })
  })
})
