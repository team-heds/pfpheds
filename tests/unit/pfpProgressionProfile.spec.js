import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shallowMount, flushPromises } from '@vue/test-utils'
const database = vi.hoisted(() => ({ votes: [], documents: [] }))
vi.mock('@/supabase', () => ({ supabase: {
  auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  from: vi.fn(table => {
    const data = table === 'student_result_vote' ? database.votes : table === 'student_documents' ? database.documents : []
    const query = { then: resolve => Promise.resolve({ data, error: null }).then(resolve) }
    for (const method of ['select', 'eq', 'order']) query[method] = () => query
    query.maybeSingle = async () => ({ data: null })
    return query
  })
} }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: vi.fn() }) }))
vi.mock('@/stores/institutionsStore', () => ({ useInstitutionsStore: () => ({
  fetchInstitutions: vi.fn(), getInstitutionNameById: () => '', institutions: []
}) }))
import Profile from '../../src/components/user/details/ResumStageUserProfile.vue'
import { buildProgressionProfileStages, getProfileDocumentSlot, normalizeProfileStageEntries, parseProfileAttemptEntries } from '../../src/utils/profileStages'

const vote = (id, type, year, flags = {}) => ({ id, pfp_type: type, year, assigned_place_id: 'place', ...flags })
describe('individual progression profile projection', () => {
  it('reads single-stage, array and dictionary legacy payloads without dropping attempts', () => {
    const stage = { PlaceId: 'a', pfp_type: 'PFP1A' }
    for (const value of [stage, [stage], { key: stage }, JSON.stringify(stage)]) {
      expect(parseProfileAttemptEntries(value)).toEqual([stage])
    }
    expect(parseProfileAttemptEntries('broken')).toEqual([])
  })
  it('preserves both PFP1 periods and renders a proven failed repetition as bis', () => {
    const stages = buildProgressionProfileStages({ studentResultVotes: [
      vote('first', 'PFP1A', '2026', { pfp_echec: true }),
      vote('second', 'PFP1B', '2027', { pfp_validee: true })
    ] })
    expect(stages.map(s => s._pfpLabel)).toEqual(['PFP1', 'PFP1 bis'])
    expect(stages.map(s => s.period)).toEqual(['PFP1A', 'PFP1B'])
  })
  it('separates the explicit individual level from the campaign without guessing', () => {
    const stages = buildProgressionProfileStages({ studentResultVotes: [
      vote('first', 'PFP1A', '2026', { pfp_echec: true }),
      vote('second', 'PFP2', '2027', { individual_pfp_type: 'PFP1' })
    ] })
    expect(stages[1]._pfpLabel).toBe('PFP1 bis')
    expect(stages[1].period).toBe('PFP2')
    const unknown = buildProgressionProfileStages({ studentResultVotes: [vote('second', 'PFP2', '2027')] })
    expect(unknown[0]._pfpLabel).toBe('PFP2')
    expect(unknown[0]._progressionNeedsReview).toBe(true)
  })
  it('deduplicates the same assignment reference across sources, not merely place/year', () => {
    const stages = buildProgressionProfileStages({
      studentResultVotes: [vote('a', 'PFP1A', '2026', { pfp_validee: true })],
      physioStages: [{ assignment_id: 'a', pfp_type: 'PFP1A', year: '2026', PlaceId: 'place', status: 'validee' }]
    })
    expect(stages).toHaveLength(1)
    const repeats = buildProgressionProfileStages({ studentResultVotes: [
      vote('a', 'PFP1A', '2026', { start_date: '2026-01-01', pfp_echec: true }),
      vote('b', 'PFP1A', '2026', { start_date: '2026-04-01' })
    ] })
    expect(repeats).toHaveLength(2)
    expect(repeats[1]._pfpLabel).toBe('PFP1 bis')
  })
  it('keeps unidentified legacy attempts and never guesses level or validation from index', () => {
    const stages = buildProgressionProfileStages({ physioStages: [{ PlaceId: 'a' }, { PlaceId: 'b' }] })
    expect(stages).toHaveLength(2)
    expect(stages.every(s => s._pfpLabel === 'PFP à vérifier' && s.status === 'a_verifier')).toBe(true)
  })
  it('does not turn contradictory booleans or an interruption into a pass', () => {
    const stages = buildProgressionProfileStages({ studentResultVotes: [
      vote('a', 'PFP1A', '2026', { pfp_validee: true, pfp_echec: 'true' }),
      vote('b', 'PFP1B', '2027', { pfp_arret: true, commentaire_arret: 'Interruption' })
    ] })
    expect(stages[0].status).toBe('a_verifier')
    expect(stages[1].status).toBe('arret')
    expect(stages[1].commentaire_arret).toBe('Interruption')
  })
  it('keeps existing criteria projection and legacy voting normalization unchanged', () => {
    const stages = buildProgressionProfileStages({ studentResultVotes: [vote('a', 'PFP1A', '2026')], placesById: new Map([['place', { FR: true }]]) })
    expect(stages[0].FR).toBe(true)
    const legacy = [{ pfp_type: 'PFP1A' }, { pfp_type: 'PFP1B' }, { pfp_type: 'PFP2' }]
    expect(normalizeProfileStageEntries(legacy)).toEqual([legacy[0], legacy[2]])
  })
  it('retains the legacy document slot only for an unambiguous existing match', () => {
    const stages = buildProgressionProfileStages({ studentResultVotes: [vote('a', 'PFP1A', '2026', { pfp_validee: true })] })
    const legacy = [{ _fpNumber: 1, IDPlace: 'place', year: '2026', _displayFpNumber: 1 }]
    expect(getProfileDocumentSlot(stages[0], stages, legacy)).toBe(1)
    expect(getProfileDocumentSlot(stages[0], [...stages, { ...stages[0], id: 'b' }], legacy)).toBeNull()
    expect(getProfileDocumentSlot({ ...stages[0], _progressionNeedsReview: true }, stages, legacy)).toBeNull()
  })
  it('wires the profile label and guards document controls instead of renumbering storage', () => {
    const component = readFileSync(resolve('src/components/user/details/ResumStageUserProfile.vue'), 'utf8')
    expect(component).toContain('{{ place._pfpLabel }}')
    expect(component).not.toContain('Formation Pratique {{ place._displayFpNumber')
    expect(component).toContain('getProfileDocumentSlot(stage, stages, legacyDocumentStages.value)')
    expect(component).toContain('legacyDocumentStages.value.forEach')
    expect(component).toContain('v-if="place._displayFpNumber"')
  })
  it('renders two attempts and hides ambiguous document controls in the real profile component', async () => {
    database.votes = [vote('a', 'PFP1A', '2026', { pfp_echec: true }), vote('b', 'PFP1B', '2027')]
    database.documents = [{ id: 'doc', pfp_number: 1, file_name: 'private.pdf' }]
    const wrapper = shallowMount(Profile, { props: { userId: 'synthetic-student' } })
    await flushPromises()
    expect(wrapper.findAll('h4').map(node => node.text())).toEqual(['PFP1', 'PFP1 bis'])
    expect(wrapper.findAllComponents({ name: 'FileUpload' })).toHaveLength(0)
    expect(wrapper.text()).not.toContain('private.pdf')
    expect(wrapper.text()).toContain('Aucun document n’a été déplacé')
    wrapper.unmount()
  })
  it('keeps documents accessible for a normal, unambiguous profile', async () => {
    database.votes = [vote('a', 'PFP1B', '2026', { pfp_validee: true })]
    database.documents = [{ id: 'doc', pfp_number: 1, file_name: 'stage.pdf' }]
    const wrapper = shallowMount(Profile, { props: { userId: 'synthetic-student' } })
    await flushPromises()
    expect(wrapper.find('h4').text()).toBe('PFP1')
    expect(wrapper.text()).toContain('stage.pdf')
    expect(wrapper.findAllComponents({ name: 'FileUpload' })).toHaveLength(1)
    wrapper.unmount()
  })
})
