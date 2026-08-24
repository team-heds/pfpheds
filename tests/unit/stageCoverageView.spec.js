import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CouvertureStages from '@/views/admin/formation-pratique/secretariat/CouvertureStages.vue'

const state = vi.hoisted(() => ({
  responses: {},
  calls: []
}))

vi.mock('@/supabase', () => ({
  supabase: {
    from(table) {
      state.calls.push({ table, method: 'from' })
      return {
        select(columns) {
          const response = () => Promise.resolve(state.responses[table])
          const builder = {
            order(column) {
              state.calls.push({ table, method: 'order', args: [column] })
              return response()
            },
            eq(column, value) {
              state.calls.push({ table, method: 'eq', args: [column, value] })
              return builder
            },
            in(column, values) {
              state.calls.push({ table, method: 'in', args: [column, values] })
              return builder
            },
            not(column, operator, value) {
              state.calls.push({ table, method: 'not', args: [column, operator, value] })
              return builder
            },
            then(resolve, reject) {
              return response().then(resolve, reject)
            }
          }
          state.calls.push({ table, method: 'select', args: [columns] })
          return builder
        }
      }
    }
  }
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() })
}))

const stubs = {
  AdminLayout: { template: '<div><slot /></div>' },
  DataTable: { template: '<div><slot name="header" /><slot name="empty" /></div>' },
  Column: true,
  Button: true,
  Checkbox: true,
  Dropdown: true,
  InputText: true,
  Tag: true,
  Toast: true,
  RouterLink: { template: '<a><slot /></a>' }
}

describe('CouvertureStages', () => {
  beforeEach(() => {
    state.calls = []
    state.responses = {
      institutions: { data: [], error: null },
      places: { data: [], error: null },
      student_result_vote: { data: [], error: null }
    }
  })

  it('renders an explicit empty state after a successful empty response', async () => {
    const now = new Date()
    const academicEndYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
    const wrapper = mount(CouvertureStages, { global: { stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('0Institutions éligibles')
    expect(wrapper.text()).toContain('Aucune institution ne correspond à ces filtres.')
    expect(wrapper.text()).not.toContain('Les données n’ont pas pu être chargées')
    expect(state.calls).toEqual(expect.arrayContaining([
      { table: 'student_result_vote', method: 'eq', args: ['status', 'published'] },
      { table: 'student_result_vote', method: 'eq', args: ['pfp_type', 'PFP1A'] },
      {
        table: 'student_result_vote',
        method: 'in',
        args: ['year', [String(academicEndYear), `${academicEndYear - 1}-${academicEndYear}`]]
      },
      { table: 'student_result_vote', method: 'not', args: ['assigned_place_id', 'is', null] }
    ]))
  })

  it('renders a request failure as an error instead of an empty list', async () => {
    state.responses.institutions = { data: null, error: { message: 'Accès refusé' } }
    const wrapper = mount(CouvertureStages, { global: { stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Les données n’ont pas pu être chargées')
    expect(wrapper.text()).toContain('Impossible de charger la couverture des stages.')
    expect(wrapper.text()).not.toContain('Accès refusé')
    expect(wrapper.text()).not.toContain('Aucune institution ne correspond à ces filtres.')
  })
})
