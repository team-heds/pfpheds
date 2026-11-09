import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '@/supabase'
import {
  assignPostulationTeachers,
  getRecentPostulationAssignments,
  undoPostulationAssignment
} from '@/service/siPostulationAssignmentService'

vi.mock('@/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn()
  }
}))

describe('HEDS25-639 affectation sécurisée des postulations SI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalise et déduplique les enseignants avant l’affectation atomique', async () => {
    supabase.rpc.mockResolvedValue({
      data: { assignment_id: 'assignment-1' },
      error: null
    })

    await expect(assignPostulationTeachers(4547, [' teacher-1 ', 'teacher-1', '', 'teacher-2']))
      .resolves.toEqual({ assignment_id: 'assignment-1' })

    expect(supabase.rpc).toHaveBeenCalledWith('assign_si_postulation_teachers', {
      p_slot_id: 4547,
      p_teacher_ids: ['teacher-1', 'teacher-2']
    })
  })

  it('refuse une affectation incomplète avant tout appel à Supabase', async () => {
    await expect(assignPostulationTeachers(null, ['teacher-1']))
      .rejects.toThrow('Le créneau et au moins un enseignant sont obligatoires.')
    await expect(assignPostulationTeachers(4547, []))
      .rejects.toThrow('Le créneau et au moins un enseignant sont obligatoires.')

    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('utilise la fonction atomique dédiée pour annuler une affectation', async () => {
    supabase.rpc.mockResolvedValue({
      data: { assignment_id: 'assignment-1', status: 'undone' },
      error: null
    })

    await expect(undoPostulationAssignment('assignment-1'))
      .resolves.toMatchObject({ status: 'undone' })
    expect(supabase.rpc).toHaveBeenCalledWith('undo_si_postulation_assignment', {
      p_assignment_id: 'assignment-1'
    })
  })

  it('limite l’historique aux modules visibles et borne la quantité demandée', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [{ id: 'assignment-1', module_code: 'SI-3061' }],
      error: null
    })
    const order = vi.fn(() => ({ limit }))
    const inFilter = vi.fn(() => ({ order }))
    const select = vi.fn(() => ({ in: inFilter }))
    supabase.from.mockReturnValue({ select })

    await expect(getRecentPostulationAssignments([' SI-3061 ', 'SI-3061'], 0))
      .resolves.toEqual([{ id: 'assignment-1', module_code: 'SI-3061' }])

    expect(supabase.from).toHaveBeenCalledWith('si_postulation_assignment_history')
    expect(inFilter).toHaveBeenCalledWith('module_code', ['SI-3061'])
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(limit).toHaveBeenCalledWith(12)
  })
})
