import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const routerPushMock = vi.hoisted(() => vi.fn())
const toastAddMock = vi.hoisted(() => vi.fn())

const mockData = vi.hoisted(() => ({
  studentResultVote: [
    {
      id: 'rv-1',
      user_id: 'user-1',
      assigned_place_id: 501,
      assigned_place_name: 'Neurologie',
      assigned_institution_name: 'Hopital Riviera',
      assigned_praticien_id: 900,
      pfp_type: 'PFP3',
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
      AIGU: false
    }
  ],
  studentsPhysio: [],
  institutions: [
    { InstitutionId: 77, Name: 'Hopital Riviera' }
  ],
  praticiens: [
    {
      id: 900,
      institution: 77,
      prenom: 'Alice',
      nom: 'Martin',
      mail: 'alice.martin@heds.ch'
    }
  ],
  studentDocuments: [],
  userProfile: {
    role: 'admin',
    pfp1: null
  }
}))

const resolveRows = async (table, filters, inFilter) => {
  if (table === 'student_result_vote') {
    return {
      data: mockData.studentResultVote.filter((entry) =>
        filters.every((filter) => entry[filter.field] === filter.value)
      ),
      error: null
    }
  }

  if (table === 'places') {
    return { data: mockData.places, error: null }
  }

  if (table === 'StudentsPhysio') {
    return { data: mockData.studentsPhysio, error: null }
  }

  if (table === 'institutions') {
    let data = mockData.institutions
    if (inFilter?.field === 'InstitutionId') {
      data = data.filter((entry) => inFilter.values.includes(entry.InstitutionId))
    }
    return { data, error: null }
  }

  if (table === 'praticiens_formateurs') {
    return { data: mockData.praticiens, error: null }
  }

  if (table === 'student_documents') {
    return { data: mockData.studentDocuments, error: null }
  }

  return { data: [], error: null }
}

const buildQuery = (table) => {
  const state = {
    filters: [],
    inFilter: null
  }

  const resolveCurrent = () => resolveRows(table, state.filters, state.inFilter)

  const api = {
    select: vi.fn(() => api),
    eq: vi.fn((field, value) => {
      state.filters.push({ field, value })
      return api
    }),
    in: vi.fn((field, values) => {
      state.inFilter = { field, values }
      return api
    }),
    order: vi.fn(async () => resolveCurrent()),
    maybeSingle: vi.fn(async () => {
      if (table === 'user_profiles') {
        return { data: mockData.userProfile, error: null }
      }
      if (table === 'StudentsPhysio') {
        return { data: null, error: null }
      }
      return { data: null, error: null }
    }),
    single: vi.fn(async () => ({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: { id: 'doc-1' }, error: null }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null }))
    })),
    then: (resolve, reject) => resolveCurrent().then(resolve, reject)
  }

  return api
}

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'admin-1' } }, error: null }))
    },
    from: vi.fn((table) => buildQuery(table)),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/doc.pdf' } })),
        remove: vi.fn(async () => ({ error: null }))
      }))
    }
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
    institutions: mockData.institutions,
    fetchInstitutions: vi.fn(async () => mockData.institutions),
    getInstitutionNameById: vi.fn((id) => (Number(id) === 77 ? 'Hopital Riviera' : 'Institution inconnue'))
  })
}))

import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'

describe('ResumStageUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hydrate un stage publie avec InstitutionId et praticien assigne', async () => {
    const wrapper = mount(ResumStageUserProfile, {
      props: {
        userId: '',
        userProfile: null
      }
    })

    await wrapper.setProps({ userId: 'user-1' })
    await flushPromises()

    expect(wrapper.vm.assignedPlaces).toHaveLength(1)
    expect(wrapper.vm.assignedPlaces[0].IDPlace).toBe(501)
    expect(wrapper.vm.assignedPlaces[0].InstitutionId).toBe(77)
    expect(wrapper.vm.assignedPlaces[0].Institutionname).toBe('Hopital Riviera')
    expect(wrapper.vm.getPraticienFormateurInfos(wrapper.vm.assignedPlaces[0])).toBe('Alice Martin')
    expect(wrapper.vm.getPraticienFormateurContact(wrapper.vm.assignedPlaces[0])).toBe('alice.martin@heds.ch')
  })

  it('navigue vers la fiche institution avec InstitutionId', async () => {
    const wrapper = mount(ResumStageUserProfile, {
      props: {
        userId: '',
        userProfile: null
      }
    })

    await wrapper.setProps({ userId: 'user-1' })
    await flushPromises()

    wrapper.vm.navigateToInstitution(wrapper.vm.assignedPlaces[0].InstitutionId)

    expect(routerPushMock).toHaveBeenCalledWith({
      name: 'InstitutionView',
      params: { id: 77 }
    })
  })
})
