import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase.js'

export const useCalendarCellsStore = defineStore('calendarCellsStore', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchBySemester = async (semesterId) => {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('calendar_cells')
      .select('*')
      .eq('semester_id', semesterId)
    if (err) error.value = err.message
    else items.value = data || []
    loading.value = false
    return items.value
  }

  const fetchBySemesterWeek = async (semesterId, weekNumber) => {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('calendar_cells')
      .select('*')
      .eq('semester_id', semesterId)
      .eq('week_number', weekNumber)
    if (err) error.value = err.message
    loading.value = false
    return data || []
  }

  const fetchByModule = async (moduleId) => {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('calendar_cells')
      .select('*')
      .eq('module_id', moduleId)
    if (err) error.value = err.message
    loading.value = false
    return data || []
  }

  // Upsert: create or update a cell. Expect a payload containing at least semester_id, week_number, day_of_week
  const upsertCell = async (payload) => {
    const { data, error: err } = await supabase
      .from('calendar_cells')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
    if (err) throw err
    // Merge into local items
    for (const c of data || []) {
      const idx = items.value.findIndex(x => x.id === c.id)
      if (idx !== -1) items.value[idx] = c
      else items.value.push(c)
    }
    return data
  }

  // Upsert par clés (semester_id, week_number, day_of_week) si aucune contrainte unique n'existe côté DB
  const upsertByKeys = async (payload) => {
    const { semester_id, week_number, day_of_week } = payload
    if (!semester_id || !week_number || !day_of_week) throw new Error('Missing composite keys')

    // Cherche une cellule existante
    const { data: existing, error: selErr } = await supabase
      .from('calendar_cells')
      .select('*')
      .eq('semester_id', semester_id)
      .eq('week_number', week_number)
      .eq('day_of_week', day_of_week)
      .limit(1)
    if (selErr) throw selErr

    if (existing && existing.length) {
      const id = existing[0].id
      const { data, error: updErr } = await supabase
        .from('calendar_cells')
        .update({
          type: payload.type ?? existing[0].type,
          module_id: payload.module_id ?? existing[0].module_id,
          course_id: payload.course_id ?? existing[0].course_id,
          notes: payload.notes ?? existing[0].notes,
          date: payload.date ?? existing[0].date,
        })
        .eq('id', id)
        .select('*')
      if (updErr) throw updErr
      // merge local
      const c = data?.[0]
      if (c) {
        const idx = items.value.findIndex(x => x.id === c.id)
        if (idx !== -1) items.value[idx] = c
        else items.value.push(c)
      }
      return data
    } else {
      // insert
      const { data, error: insErr } = await supabase
        .from('calendar_cells')
        .insert(payload)
        .select('*')
      if (insErr) throw insErr
      for (const c of data || []) items.value.push(c)
      return data
    }
  }

  const removeOne = async (id) => {
    const { error: err } = await supabase.from('calendar_cells').delete().eq('id', id)
    if (err) throw err
    items.value = items.value.filter(c => c.id !== id)
    return true
  }

  return {
    items,
    loading,
    error,
    fetchBySemester,
    fetchBySemesterWeek,
    fetchByModule,
    upsertCell,
    upsertByKeys,
    removeOne,
  }
})
