import { describe, expect, it } from 'vitest'
import {
  filterStudents,
  getStudentCaseCategories,
  hasCaseFollowUp,
  isActiveSaeFollowUp,
  matchesStudentFilters,
  normalizeFollowUpFilterText
} from '../../src/domain/pfp/caseFollowUpFilters'

const fields = ['pfp1', 'pfp2', 'sae']

describe('filtres du suivi des cas particuliers', () => {
  it('recherche sans dépendre des accents, tirets ou majuscules', () => {
    const sevane = { etudiant: 'VERLY Sévane', classe: 'BA25' }
    const noah = { etudiant: 'IN-ALBON Noah', classe: 'BA25' }

    expect(matchesStudentFilters(sevane, { query: 'sevane' })).toBe(true)
    expect(matchesStudentFilters(noah, { query: 'in albon' })).toBe(true)
    expect(normalizeFollowUpFilterText('  CÉLIA—Wicky ')).toBe('celia wicky')
  })

  it('combine correctement la recherche et la classe', () => {
    const students = [
      { etudiant: 'FIORINA Louise', classe: 'BA26' },
      { etudiant: 'GENOUD Axelle', classe: 'BA25' }
    ]

    expect(filterStudents(students, { classe: 'BA26' })).toHaveLength(1)
    expect(filterStudents(students, { query: 'axelle', classe: 'BA26' })).toEqual([])
  })

  it('considère une couleur active comme un suivi même sans commentaire', () => {
    expect(hasCaseFollowUp({ sae: { couleur: 'orange', commentaire: '' } }, fields)).toBe(true)
    expect(hasCaseFollowUp({ pfp1: { couleur: 'blanc', commentaire: '  ' } }, fields)).toBe(false)
    expect(hasCaseFollowUp({ info_etudiant: { commentaire: 'Suivi LPP' } }, fields)).toBe(true)
  })

  it('ne classe comme cas particuliers que les SAE, lésés ou échecs de stage', () => {
    const plain = { user_id: 'plain', sae: { couleur: 'blanc' } }
    const sae = { user_id: 'sae', sae: { couleur: 'orange' } }
    const multiple = { user_id: 'multiple', sae: { couleur: 'rouge' } }
    const context = {
      lesedStudentIds: new Set(['lese', 'multiple']),
      failedStudentIds: new Set(['echec', 'multiple'])
    }

    expect(isActiveSaeFollowUp(plain)).toBe(false)
    expect(isActiveSaeFollowUp(sae)).toBe(true)
    expect(getStudentCaseCategories(plain, context)).toEqual([])
    expect(getStudentCaseCategories({ user_id: 'lese' }, context)).toEqual(['lese'])
    expect(getStudentCaseCategories({ user_id: 'echec' }, context)).toEqual(['echec'])
    expect(getStudentCaseCategories(multiple, context)).toEqual(['sae', 'lese', 'echec'])
  })
})
