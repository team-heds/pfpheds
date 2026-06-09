import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const routerPushMock = vi.hoisted(() => vi.fn())
const toastAddMock = vi.hoisted(() => vi.fn())

const mockData = vi.hoisted(() => ({
  studentResultVote: [
    {
      id: 'assign-1',
      user_id: 'user-1',
      assigned_place_id: 501,
      assigned_place_name: 'Neurologie',
      assigned_institution_name: 'Hopital Riviera',
      assigned_praticien_id: 900,
      pfp_type: 'PFP3',
      assigned_rank: 2,
      year: '2026',
      status: 'published',
      pfp_validee: false,
      pfp_echec: false,
      pfp_arret: false
    }
  ],
  places: [
    {
      PlaceId: 501,
      InstitutionId: 77,
      InstitutionName: 'Hopital Riviera',
      Institution: 'Hopital Riviera',
      NomPlace: 'Neurologie',
      AMBU: true,
      DE: false,
      FR: true,
      MSQ: false,
      NEUROGER: true,
      REHAB: false,
      SYSINT: false,
      AIGU: false,
      assigned_praticien_id: 900
    }
  ],
  praticiens: [
    {
      id: 900,
      nom: 'Martin',
      prenom: 'Alice',
      mail: 'alice.martin@heds.ch',
      institution: 77
    }
  ],
  studentsPhysio: [],
  userProfile: {
    role: 'admin'
  }
}))

const buildQuery = (table) => {
  const state = {
    filters: []
  }

  const resolveCurrent = () => resolveData(table, state.filters)

  const api = {
    select: vi.fn(() => api),
    eq: vi.fn((field, value) => {
      state.filters.push({ field, value })
      return api
    }),
    order: vi.fn(async () => resolveCurrent()),
    maybeSingle: vi.fn(async () => {
      if (table === 'user_profiles') {
        return { data: mockData.userProfile, error: null }
      }
      return { data: null, error: null }
    }),
    single: vi.fn(async () => {
      if (table === 'places') {
        const placeIdFilter = state.filters.find((filter) => filter.field === 'PlaceId')
        const place = mockData.places.find((entry) => entry.PlaceId === placeIdFilter?.value)
        return { data: place || null, error: null }
      }
      return { data: null, error: null }
    }),
    insert: vi.fn(async () => ({ error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null }))
    })),
    then: (resolve, reject) => resolveCurrent().then(resolve, reject)
  }

  return api
}

const resolveData = async (table, filters) => {
  if (table === 'student_result_vote') {
    const filtered = mockData.studentResultVote.filter((entry) =>
      filters.every((filter) => entry[filter.field] === filter.value)
    )
    return { data: filtered, error: null }
  }

  if (table === 'places') {
    return { data: mockData.places, error: null }
  }

  if (table === 'praticiens_formateurs') {
    return { data: mockData.praticiens, error: null }
  }

  if (table === 'StudentsPhysio') {
    return { data: mockData.studentsPhysio, error: null }
  }

  return { data: [], error: null }
}

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'admin-1' } }, error: null }))
    },
    from: vi.fn((table) => buildQuery(table))
  }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushMock
  })
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: toastAddMock
  })
}))

vi.mock('@/stores/institutionsStore', () => ({
  useInstitutionsStore: () => ({
    institutions: [{ InstitutionId: 77, Name: 'Hopital Riviera' }],
    fetchInstitutions: vi.fn(async () => [{ InstitutionId: 77, Name: 'Hopital Riviera' }]),
    getInstitutionNameById: vi.fn((id) => (Number(id) === 77 ? 'Hopital Riviera' : 'Institution inconnue'))
  })
}))

import VotationResultProfil from '@/components/user/details/VotationResultProfil.vue'

describe('VotationResultProfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche une affectation enrichie et route vers InstitutionId', async () => {
    const wrapper = mount(VotationResultProfil, {
      props: {
        userId: 'user-1'
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Hopital Riviera')
    expect(wrapper.text()).toContain('Neurologie')
    expect(wrapper.text()).toContain('Alice Martin')
    expect(wrapper.vm.assignedPlaces[0].InstitutionId).toBe(77)
    expect(wrapper.vm.getVotationType(wrapper.vm.assignedPlaces[0])).toBe('Choix 2')

    wrapper.vm.navigateToInstitution(wrapper.vm.assignedPlaces[0].InstitutionId)

    expect(routerPushMock).toHaveBeenCalledWith({
      name: 'InstitutionView',
      params: { id: 77 }
    })
  })

  it('garde PlaceId comme assigned_place_id lors de la selection dans la modale', async () => {
    const wrapper = mount(VotationResultProfil, {
      props: {
        userId: 'user-1'
      }
    })

    await flushPromises()

    await wrapper.vm.onPlaceSelected({ value: 501 })

    expect(wrapper.vm.newAssignment.assigned_place_id).toBe(501)
    expect(wrapper.vm.newAssignment.assigned_institution_name).toBe('Hopital Riviera')
    expect(wrapper.vm.newAssignment.praticien_formateur).toBe(900)
  })
})
