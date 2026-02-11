import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDebounce, useDebounceFn } from '@/composables/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns initial value immediately', () => {
    const source = ref('hello')
    const debounced = useDebounce(source, 300)
    expect(debounced.value).toBe('hello')
  })

  it('does not update before delay', async () => {
    const source = ref('a')
    const debounced = useDebounce(source, 300)

    source.value = 'b'
    await nextTick()
    vi.advanceTimersByTime(100)
    expect(debounced.value).toBe('a')
  })

  it('updates after delay', async () => {
    const source = ref('a')
    const debounced = useDebounce(source, 300)

    source.value = 'b'
    await nextTick()
    vi.advanceTimersByTime(300)
    expect(debounced.value).toBe('b')
  })

  it('only fires once for rapid changes', async () => {
    const source = ref('a')
    const debounced = useDebounce(source, 200)

    source.value = 'b'
    await nextTick()
    vi.advanceTimersByTime(100)

    source.value = 'c'
    await nextTick()
    vi.advanceTimersByTime(100)

    source.value = 'd'
    await nextTick()
    vi.advanceTimersByTime(200)

    expect(debounced.value).toBe('d')
  })

  it('uses default delay of 300ms', async () => {
    const source = ref(0)
    const debounced = useDebounce(source)

    source.value = 1
    await nextTick()
    vi.advanceTimersByTime(299)
    expect(debounced.value).toBe(0)

    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe(1)
  })
})

describe('useDebounceFn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('calls function after delay', () => {
    const fn = vi.fn()
    const debounced = useDebounceFn(fn, 200)

    debounced('arg1')
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledWith('arg1')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('only calls once for rapid invocations', () => {
    const fn = vi.fn()
    const debounced = useDebounceFn(fn, 200)

    debounced('a')
    debounced('b')
    debounced('c')

    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('cancel prevents execution', () => {
    const fn = vi.fn()
    const debounced = useDebounceFn(fn, 200)

    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(200)

    expect(fn).not.toHaveBeenCalled()
  })

  it('uses default delay of 300ms', () => {
    const fn = vi.fn()
    const debounced = useDebounceFn(fn)

    debounced()
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
