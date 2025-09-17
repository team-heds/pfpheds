import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase.js'

export const useCoursesStore = defineStore('coursesStore', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('courses')
      .select('*, modules(id, name, code)')
      .order('name', { ascending: true })
    if (err) error.value = err.message
    else items.value = data || []
    loading.value = false
    return items.value
  }

  const fetchByModule = async (moduleId) => {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('courses')
      .select('*, modules(id, name, code)')
      .eq('module_id', moduleId)
      .order('name', { ascending: true })
    if (err) error.value = err.message
    loading.value = false
    return data || []
  }

  const getById = async (id) => {
    const { data, error: err } = await supabase
      .from('courses')
      .select('*, modules(id, name, code)')
      .eq('id', id)
      .single()
    if (err) throw err
    return data
  }

  const createOne = async (payload) => {
    const { data, error: err } = await supabase
      .from('courses')
      .insert(payload)
      .select('*')
      .single()
    if (err) throw err
    items.value.push(data)
    return data
  }

  const updateOne = async (id, payload) => {
    const { data, error: err } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()
    if (err) throw err
    const idx = items.value.findIndex(s => s.id === id)
    if (idx !== -1) items.value[idx] = data
    return data
  }

  const removeOne = async (id) => {
    const { error: err } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
    if (err) throw err
    items.value = items.value.filter(s => s.id !== id)
    return true
  }

  return { items, loading, error, fetchAll, fetchByModule, getById, createOne, updateOne, removeOne }
})
