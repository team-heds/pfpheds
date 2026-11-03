import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/supabase', () => ({ supabase: {} }))
vi.mock('@/supabase.js', () => ({ supabase: {} }))
vi.mock('@/service/votationSessionService', () => ({ default: { getAllActiveSessions: vi.fn() } }))
vi.mock('@/service/resultatVotationService', () => ({
  resultatVotationService: { getAssignmentCounts: vi.fn().mockResolvedValue({}) }
}))
import View from '../../src/views/admin/votations/VotationGenericView.vue'
import sessions from '../../src/service/votationSessionService'

const campaign = { id: 'priority', status: 'open', is_priority: true, pfp_type: 'PFP2', year: '2027', target_class: 'BA25' }
function context() {
  return {
    ...View.data(), isAdminPreview: true, userStore: { user: { id: 'admin' } },
    institutionsStore: { institutions: [], fetchInstitutions: vi.fn() },
    placesStore: {
      places: [{ PlaceId: 'test', InstitutionId: 'institution/avec espace', FR: true }],
      fetchPlaces: vi.fn()
    },
    votesStore: { saveVote: vi.fn() },
    checkExistingCampaignAssignment: vi.fn().mockResolvedValue(null),
    computeOfferSeatAvailability: vi.fn().mockReturnValue({
      activeCountByPlace: {},
      occupiedCountByPlace: {},
      foundOfferFields: false
    }),
    updateExpandedData: vi.fn()
  }
}
beforeEach(() => vi.clearAllMocks())
describe('voting view admin branch', () => {
  it('cannot submit a vote even when called directly', async () => {
    const vm = context()
    vm.selectedPlaces = Array(5).fill({ PlaceId: 'test' })
    await View.methods.sendVote.call(vm)
    expect(vm.votesStore.saveVote).not.toHaveBeenCalled()
    expect(View.methods.isPlaceDisabled.call(vm, {}, 0)).toBe(true)
  })
  it('keeps student validation unchanged', async () => {
    const vm = context()
    vm.isAdminPreview = false
    await View.methods.sendVote.call(vm)
    expect(vm.dialogMessage).toContain('exactement 5')
    expect(vm.votesStore.saveVote).not.toHaveBeenCalled()
  })
  it('loads a priority session without assigning a class to the admin', async () => {
    sessions.getAllActiveSessions.mockResolvedValue([campaign])
    const vm = context()
    await View.methods.refreshAdminPreview.call(vm)
    expect(vm.activeSession).toEqual(campaign)
    expect(vm.targetPFP).toBe('PFP2')
    expect(vm.selectedYear).toBe('2027')
    expect(vm.places[0].url).toBe('/institution/institution%2Favec%20espace')
    expect(vm.votesStore.saveVote).not.toHaveBeenCalled()
  })
  it('clears old data when a campaign closes during loading', async () => {
    sessions.getAllActiveSessions.mockResolvedValueOnce([campaign]).mockResolvedValueOnce([])
    const vm = context()
    vm.expandedPFPData = [{ PlaceId: 'old' }]
    await View.methods.refreshAdminPreview.call(vm)
    expect(vm.activeSession).toBeNull()
    expect(vm.expandedPFPData).toEqual([])
    expect(vm.updateExpandedData).not.toHaveBeenCalled()
  })
  it('ignores responses invalidated by another refresh', async () => {
    const vm = context()
    sessions.getAllActiveSessions.mockImplementation(async () => {
      vm.previewGeneration++
      return [campaign]
    })
    await View.methods.refreshAdminPreview.call(vm)
    expect(vm.activeSession).toBeNull()
    expect(vm.updateExpandedData).not.toHaveBeenCalled()
  })
  it('shows a readable failure without retaining old campaign data', async () => {
    sessions.getAllActiveSessions.mockRejectedValue(new Error('unavailable'))
    const vm = context()
    await View.methods.refreshAdminPreview.call(vm)
    expect(vm.activeSession).toBeNull()
    expect(vm.previewError).toContain('Impossible')
    expect(vm.sessionLoading).toBe(false)
  })
})
