import { supabase } from '@/supabase'

export async function assignPostulationTeachers(slotId, teacherIds) {
  const selectedTeacherIds = [...new Set(
    (Array.isArray(teacherIds) ? teacherIds : [])
      .map(value => String(value || '').trim())
      .filter(Boolean)
  )]

  if (!slotId || selectedTeacherIds.length === 0) {
    throw new TypeError('Le créneau et au moins un enseignant sont obligatoires.')
  }

  const { data, error } = await supabase.rpc('assign_si_postulation_teachers', {
    p_slot_id: slotId,
    p_teacher_ids: selectedTeacherIds
  })

  if (error) throw error
  return data
}

export async function undoPostulationAssignment(assignmentId) {
  if (!assignmentId) throw new TypeError("L'identifiant de l’affectation est obligatoire.")

  const { data, error } = await supabase.rpc('undo_si_postulation_assignment', {
    p_assignment_id: assignmentId
  })

  if (error) throw error
  return data
}

export async function getRecentPostulationAssignments(moduleCodes = [], limit = 12) {
  const codes = [...new Set(
    (Array.isArray(moduleCodes) ? moduleCodes : [])
      .map(value => String(value || '').trim())
      .filter(Boolean)
  )]

  if (codes.length === 0) return []

  const { data, error } = await supabase
    .from('si_postulation_assignment_history')
    .select('id,slot_id,module_code,assigned_teacher_labels,status,created_at,undone_at')
    .in('module_code', codes)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Number(limit) || 12))

  if (error) throw error
  return data || []
}

