// src/stores/todoStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase.js'

export const useTodoStore = defineStore('todos', () => {
  // ---- state
  const todos = ref([])
  const loading = ref(false)
  const mutating = ref(false)
  const lastSyncedAt = ref(null)
  const draft = ref({ id: null, title: '', content: '' })

  let pollTimer = null
  const DEFAULT_POLL_MS = 10000

  // ---- actions CRUD
  const fetchTodos = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('id,title,content,created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        if (error.code === '401' || error.code === '403') {
          todos.value = []
          lastSyncedAt.value = Date.now()
          return
        }
        throw error
      }
      todos.value = data ?? []
      lastSyncedAt.value = Date.now()
    } finally {
      loading.value = false
    }
  }

  const addTodo = async () => {
    const title = draft.value.title?.trim()
    if (!title) throw new Error('Titre requis')

    mutating.value = true
    try {
      const payload = {
        title,
        content: (draft.value.content ?? '').trim() || null
      }
      const { data, error } = await supabase
        .from('todos')
        .insert(payload, { returning: 'representation' })
        .select('id,title,content,created_at')
        .single()

      if (error) throw error
      todos.value = [data, ...todos.value]
      resetDraft()
    } finally {
      mutating.value = false
    }
  }

  const updateTodo = async () => {
    const id = draft.value.id
    const title = draft.value.title?.trim()
    if (!id) return
    if (!title) throw new Error('Titre requis')

    mutating.value = true
    try {
      const { data, error } = await supabase
        .from('todos')
        .update({
          title,
          content: (draft.value.content ?? '').trim() || null
        })
        .eq('id', id)
        .select('id,title,content,created_at')
        .single()

      if (error) throw error
      todos.value = todos.value.map(t => (t.id === data.id ? data : t))
      resetDraft()
    } finally {
      mutating.value = false
    }
  }

  const deleteTodo = async (id) => {
    if (!id) return
    mutating.value = true
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id)
      if (error) throw error
      todos.value = todos.value.filter(t => t.id !== id)
    } finally {
      mutating.value = false
    }
  }

  // ---- helpers
  const edit = (row) => {
    draft.value = { id: row.id, title: row.title ?? '', content: row.content ?? '' }
  }
  const resetDraft = () => {
    draft.value = { id: null, title: '', content: '' }
  }

  // ---- polling
  const startPolling = (ms = DEFAULT_POLL_MS) => {
    stopPolling()
    pollTimer = setInterval(fetchTodos, ms)
  }
  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return {
    // state
    todos, loading, mutating, lastSyncedAt, draft,
    // actions
    fetchTodos, addTodo, updateTodo, deleteTodo, edit, resetDraft,
    // polling
    startPolling, stopPolling
  }
})
