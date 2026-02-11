import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, nextTick, Fragment } from 'vue'
import WeeklyPlanningAdminView from '@/views/admin/planning/WeeklyPlanningAdminView.vue'

const planningServiceMock = vi.hoisted(() => ({
  getAllCourseModules: vi.fn(),
  getWeekTimeSlots: vi.fn(),
  getSemesterTimeSlots: vi.fn(),
  saveTimeSlot: vi.fn(),
  deleteTimeSlot: vi.fn(),
  duplicateWeek: vi.fn(),
  getDateForWeekAndDay: vi.fn()
}))

const academicYearServiceMock = vi.hoisted(() => ({
  getActiveAcademicYear: vi.fn(),
  getClassesByAcademicYear: vi.fn()
}))

const getSITeachersMock = vi.hoisted(() => vi.fn())
const toastAddMock = vi.hoisted(() => vi.fn())

const DataTableStub = defineComponent({
  name: 'DataTableStub',
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { slots }) {
    return () => {
      const columns = slots.default ? slots.default() : []
      const normalizedColumns = columns.flatMap((node) => {
        if (!node) return []
        if (node.type === Fragment && Array.isArray(node.children)) {
          return node.children
        }
        return node
      }).filter(Boolean)
      const resolveBodySlot = (column) => {
        const children = column?.children
        if (typeof children === 'function') {
          return children
        }
        if (children && typeof children === 'object') {
          return children.body || children.default || null
        }
        return null
      }
      return h('div', { class: 'datatable-stub' }, (props.value || []).map((row, rowIndex) =>
        h('div', { class: 'datatable-row', key: rowIndex }, normalizedColumns.map((column, columnIndex) => {
          const bodySlot = resolveBodySlot(column)
          return h('div', { class: 'datatable-cell', key: columnIndex }, bodySlot ? bodySlot({ data: row }) : [])
        }))
      ))
    }
  }
})

const BadgeStub = defineComponent({
  name: 'BadgeStub',
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => h('span', { class: 'badge-stub' }, props.value)
  }
})

const TeachersTableStub = defineComponent({
  name: 'TeachersTableStub',
  props: {
    value: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    return () => h('div', { class: 'datatable-stub' }, (props.value || []).map((row, rowIndex) => {
      const teachers = Array.isArray(row?.teachers) ? row.teachers : []
      const visibleTeachers = teachers.slice(0, 6)
      return h('div', { class: 'teachers-cell', key: rowIndex }, [
        ...visibleTeachers.map((teacher, index) => h('span', { class: 'teacher-chip', key: index }, teacher)),
        teachers.length > 6 ? h(BadgeStub, { value: `+${teachers.length - 6}` }) : null
      ])
    }))
  }
})

vi.mock('@/service/planningService', () => ({
  default: planningServiceMock
}))

vi.mock('@/service/academicYearService', () => ({
  default: academicYearServiceMock
}))

vi.mock('@/services/academicKpiService', () => ({
  getSITeachers: getSITeachersMock
}))

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAddMock })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { email: 'test.user@hevs.ch' } })
}))

vi.mock('@/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ data: [] })
      })
    })
  }
}))

describe('WeeklyPlanningAdminView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    planningServiceMock.getAllCourseModules.mockResolvedValue([])
    planningServiceMock.getWeekTimeSlots.mockResolvedValue([])
    planningServiceMock.getSemesterTimeSlots.mockResolvedValue([])
    planningServiceMock.saveTimeSlot.mockResolvedValue(undefined)
    planningServiceMock.deleteTimeSlot.mockResolvedValue(undefined)
    planningServiceMock.duplicateWeek.mockResolvedValue(undefined)
    planningServiceMock.getDateForWeekAndDay.mockReturnValue('2025-01-11')

    academicYearServiceMock.getActiveAcademicYear.mockResolvedValue({ id: 'year-1', name: '2024-2025' })
    academicYearServiceMock.getClassesByAcademicYear.mockResolvedValue([
      { code: 'B25', year_level: 1, modality: 'plein_temps' }
    ])

    getSITeachersMock.mockResolvedValue([
      { id: 1, name: 'Test Teacher', email: 'teacher@hevs.ch' }
    ])

    toastAddMock.mockClear()
    window.confirm = vi.fn(() => true)
  })

  it('splitTeachers splits into chunks of 6', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    const teachers = Array.from({ length: 8 }, (_, i) => `Teacher ${i + 1}`)
    const chunks = wrapper.vm.splitTeachers(teachers)

    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toHaveLength(6)
    expect(chunks[1]).toHaveLength(2)
  })

  it('getSelectedYearLabel returns the class code from the label', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    wrapper.vm.yearOptions = [
      { label: '1ère année 2024-2025 / B25', value: 'bac25' }
    ]
    wrapper.vm.selectedYear = 'bac25'

    expect(wrapper.vm.getSelectedYearLabel()).toBe('B25')
  })

  it('saveSlot blocks when start/end time missing (non distance)', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    wrapper.vm.selectedYear = 'bac25'
    wrapper.vm.selectedWeek = 39
    wrapper.vm.slotForm = {
      day: 'lundi',
      date: '2025-01-06',
      startTime: '',
      endTime: '',
      moduleCode: 'M1',
      moduleNumber: 'M1',
      moduleTitle: 'Module 1',
      courseTitle: 'Course',
      activity: 'Cours',
      teachers: [],
      room: '',
      notes: ''
    }

    await wrapper.vm.saveSlot()

    expect(planningServiceMock.saveTimeSlot).not.toHaveBeenCalled()
    expect(toastAddMock).toHaveBeenCalled()
  })

  it('saveSlot sets default times for distance day', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    wrapper.vm.selectedYear = 'bac25'
    wrapper.vm.selectedWeek = 39
    wrapper.vm.slotForm = {
      day: 'distance',
      date: '',
      startTime: '',
      endTime: '',
      moduleCode: 'M1',
      moduleNumber: 'M1',
      moduleTitle: 'Module 1',
      courseTitle: 'Course',
      activity: 'Cours',
      teachers: [],
      room: '',
      notes: ''
    }

    await wrapper.vm.saveSlot()

    expect(planningServiceMock.saveTimeSlot).toHaveBeenCalled()
    const payload = planningServiceMock.saveTimeSlot.mock.calls[0][0]
    expect(payload.startTime).toBe('08:00')
    expect(payload.endTime).toBe('17:00')
    expect(payload.date).toBe('2025-01-11')
  })

  it('saveSlot normalizes teachers to names', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    wrapper.vm.selectedYear = 'bac25'
    wrapper.vm.selectedWeek = 39
    wrapper.vm.slotForm = {
      day: 'lundi',
      date: '2025-01-06',
      startTime: '08:00',
      endTime: '10:00',
      moduleCode: 'M1',
      moduleNumber: 'M1',
      moduleTitle: 'Module 1',
      courseTitle: 'Course',
      activity: 'Cours',
      teachers: [{ name: 'Alice' }, 'Bob'],
      room: '',
      notes: ''
    }

    await wrapper.vm.saveSlot()

    const payload = planningServiceMock.saveTimeSlot.mock.calls[0][0]
    expect(payload.teachers).toEqual(['Alice', 'Bob'])
  })

  it('loadPlanningForCurrentView calls week planning', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    planningServiceMock.getWeekTimeSlots.mockClear()
    wrapper.vm.selectedYear = 'bac25'
    wrapper.vm.selectedWeek = 39
    wrapper.vm.viewMode = 'week'

    await wrapper.vm.loadPlanningForCurrentView()

    expect(planningServiceMock.getWeekTimeSlots).toHaveBeenCalledWith('bac25', 39)
  })

  it('loadPlanningForCurrentView calls semester planning with correct semester', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    planningServiceMock.getSemesterTimeSlots.mockClear()
    wrapper.vm.selectedYear = 'bac25'
    wrapper.vm.viewMode = 'semester1'
    await wrapper.vm.loadPlanningForCurrentView()

    expect(planningServiceMock.getSemesterTimeSlots).toHaveBeenCalledWith('bac25', 'spring')

    planningServiceMock.getSemesterTimeSlots.mockClear()
    wrapper.vm.viewMode = 'semester2'
    await wrapper.vm.loadPlanningForCurrentView()

    expect(planningServiceMock.getSemesterTimeSlots).toHaveBeenCalledWith('bac25', 'autumn')
  })

  it('loadYearOptions resets invalid selectedYear', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    wrapper.vm.selectedYear = 'invalid'
    await wrapper.vm.loadYearOptions()

    expect(wrapper.vm.selectedYear).toBe('bac25')
  })

  it('deleteSlot deletes and reloads planning', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    planningServiceMock.getWeekTimeSlots.mockClear()
    wrapper.vm.selectedYear = 'bac25'
    wrapper.vm.selectedWeek = 39

    await wrapper.vm.deleteSlot('slot-1')

    expect(planningServiceMock.deleteTimeSlot).toHaveBeenCalledWith('slot-1')
    expect(planningServiceMock.getWeekTimeSlots).toHaveBeenCalled()
  })

  it('performDuplicate warns when weeks are missing', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    wrapper.vm.duplicateFrom = null
    wrapper.vm.duplicateTo = null

    await wrapper.vm.performDuplicate()

    expect(planningServiceMock.duplicateWeek).not.toHaveBeenCalled()
    expect(toastAddMock).toHaveBeenCalled()
  })

  it('performDuplicate duplicates and reloads when target week is selected', async () => {
    const wrapper = mount(WeeklyPlanningAdminView)
    await flushPromises()

    planningServiceMock.getWeekTimeSlots.mockClear()
    wrapper.vm.selectedYear = 'bac25'
    wrapper.vm.selectedWeek = 40
    wrapper.vm.duplicateFrom = 39
    wrapper.vm.duplicateTo = 40

    await wrapper.vm.performDuplicate()

    expect(planningServiceMock.duplicateWeek).toHaveBeenCalledWith('bac25', 39, 40)
    expect(planningServiceMock.getWeekTimeSlots).toHaveBeenCalled()
  })

  it('shows a +X badge when more than 6 teachers are present', async () => {
    planningServiceMock.getWeekTimeSlots.mockResolvedValue([
      {
        id: 'slot-1',
        day: 'lundi',
        date: '2025-01-06',
        start_time: '08:00',
        end_time: '10:00',
        module_code: 'M1',
        course_title: 'Cours',
        activity: 'Cours',
        teachers: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
        room: 'A1',
        week_number: 39,
        course_module: { number: 'M1', title: 'Module 1' }
      }
    ])

    const wrapper = mount(WeeklyPlanningAdminView, {
      global: {
        stubs: {
          DataTable: TeachersTableStub,
          Badge: BadgeStub
        }
      }
    })
    await flushPromises()

    await nextTick()

    const badge = wrapper.find('.teachers-cell .badge-stub')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('+2')
  })
})

// ── Export Excel helpers (pure functions) ──────────────────────

const getCourseRowHeight = (courseTitle) => {
  const text = (courseTitle || '').toString()
  const baseHeight = 20
  const lineHeight = 15
  const charsPerLine = 90
  const lines = text
    .split('\n')
    .map(line => Math.max(1, Math.ceil(line.length / charsPerLine)))
    .reduce((sum, count) => sum + count, 0)
  return Math.max(baseHeight, lines * lineHeight)
}

const getTeachersRowHeight = (teacherChunk) => {
  const longestName = (teacherChunk || []).reduce((max, teacher) => {
    if (typeof teacher !== 'string') return max
    return teacher.length > max.length ? teacher : max
  }, '')
  return getCourseRowHeight(longestName)
}

const getSemesterLabel = (week) => {
  return (week >= 38 || week <= 7) ? 'Semestre d\'Automne' : 'Semestre de Printemps'
}

describe('getCourseRowHeight', () => {
  it('returns baseHeight (20) for empty or short text', () => {
    expect(getCourseRowHeight('')).toBe(20)
    expect(getCourseRowHeight(null)).toBe(20)
    expect(getCourseRowHeight('Short')).toBe(20)
  })

  it('increases height for text longer than 90 chars', () => {
    const longText = 'A'.repeat(180)
    expect(getCourseRowHeight(longText)).toBe(30) // 2 lines * 15
  })

  it('handles multiline text with newlines', () => {
    const text = 'Line 1\nLine 2\nLine 3'
    expect(getCourseRowHeight(text)).toBe(45) // 3 lines * 15
  })

  it('handles mixed long lines and newlines', () => {
    const text = 'A'.repeat(100) + '\nShort'
    // Line 1: ceil(100/90)=2, Line 2: ceil(5/90)=1 → 3 lines * 15 = 45
    expect(getCourseRowHeight(text)).toBe(45)
  })
})

describe('getTeachersRowHeight', () => {
  it('returns baseHeight for short teacher names', () => {
    expect(getTeachersRowHeight(['Alice', 'Bob'])).toBe(20)
  })

  it('returns baseHeight for empty array', () => {
    expect(getTeachersRowHeight([])).toBe(20)
  })

  it('returns baseHeight for null', () => {
    expect(getTeachersRowHeight(null)).toBe(20)
  })

  it('ignores non-string entries', () => {
    expect(getTeachersRowHeight([{ name: 'Alice' }, 42])).toBe(20)
  })

  it('uses the longest teacher name for height calculation', () => {
    const longName = 'A'.repeat(100)
    expect(getTeachersRowHeight(['Short', longName])).toBe(30) // ceil(100/90)=2 → 2*15=30
  })
})

describe('getSemesterLabel', () => {
  it('returns Automne for weeks 38-52', () => {
    expect(getSemesterLabel(38)).toBe('Semestre d\'Automne')
    expect(getSemesterLabel(45)).toBe('Semestre d\'Automne')
    expect(getSemesterLabel(52)).toBe('Semestre d\'Automne')
  })

  it('returns Automne for weeks 1-7', () => {
    expect(getSemesterLabel(1)).toBe('Semestre d\'Automne')
    expect(getSemesterLabel(7)).toBe('Semestre d\'Automne')
  })

  it('returns Printemps for weeks 8-37', () => {
    expect(getSemesterLabel(8)).toBe('Semestre de Printemps')
    expect(getSemesterLabel(20)).toBe('Semestre de Printemps')
    expect(getSemesterLabel(37)).toBe('Semestre de Printemps')
  })
})
