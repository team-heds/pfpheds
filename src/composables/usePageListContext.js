import { effectScope, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

function clone(value) {
  if (value instanceof Set) return new Set(Array.from(value, clone))
  if (Array.isArray(value)) return value.map(clone)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]))
  return value
}

/** Bounded, account-scoped state for list controls only; never localStorage. */
export function createPageListContextCache({ maxEntries = 20, maxCharacters = 16384 } = {}) {
  const entries = new Map()
  let account = null
  return {
    activateAccount(userId) {
      const next = userId || null
      if (next !== account) entries.clear()
      account = next
    },
    read(userId, key) {
      if (!userId || userId !== account || !entries.has(key)) return undefined
      const value = entries.get(key)
      entries.delete(key)
      entries.set(key, value)
      return clone(value)
    },
    write(userId, key, value) {
      if (!userId || userId !== account) return
      const encoded = JSON.stringify(value, (_key, item) => item instanceof Set ? Array.from(item) : item)
      if (encoded.length > maxCharacters) return
      entries.delete(key)
      entries.set(key, clone(value))
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value)
    },
    clear() { entries.clear() },
  }
}

const cache = createPageListContextCache()
let trackedStore = null
let accountScope = null

function trackAccount(authStore) {
  if (trackedStore === authStore) return
  accountScope?.stop()
  trackedStore = authStore
  accountScope = effectScope(true)
  accountScope.run(() => watch(() => authStore.user?.id || null, userId => cache.activateAccount(userId), { immediate: true, flush: 'sync' }))
}

/**
 * Opt in only refs that contain list search/filter/folder state. The detached
 * account watcher clears the cache on logout even when neither list is mounted.
 */
export function usePageListContext(key, fields, { authStore = useAuthStore() } = {}) {
  trackAccount(authStore)
  const defaults = Object.fromEntries(Object.entries(fields).map(([name, state]) => [name, clone(state.value)]))
  const restored = ref(false)
  let stateAccount = null
  let syncing = false

  watch(() => authStore.user?.id || null, userId => {
    syncing = true
    stateAccount = userId
    const saved = cache.read(userId, key)
    restored.value = saved !== undefined
    for (const [name, state] of Object.entries(fields)) state.value = clone(saved?.[name] ?? defaults[name])
    syncing = false
  }, { immediate: true, flush: 'sync' })

  watch(Object.values(fields), () => {
    const userId = authStore.user?.id || null
    if (syncing || userId !== stateAccount) return
    cache.write(userId, key, Object.fromEntries(Object.entries(fields).map(([name, state]) => [name, state.value])))
  }, { deep: true, flush: 'sync' })

  return { restored }
}

export function disposePageListContexts() {
  accountScope?.stop()
  accountScope = null
  trackedStore = null
  cache.clear()
}

export function clearPageListContexts() {
  cache.clear()
}

if (import.meta.hot) import.meta.hot.dispose(disposePageListContexts)
