import { describe, it, expect } from 'vitest'
import { resolveSupabaseRestUrl } from '@/config/supabaseRest'

describe('resolveSupabaseRestUrl', () => {
  it('uses the explicit REST URL when provided', () => {
    expect(resolveSupabaseRestUrl({ VITE_SUPABASE_REST_URL: 'https://test.hedsvs.ch/rest/v1/' }))
      .toBe('https://test.hedsvs.ch/rest/v1')
  })

  it('derives the REST URL from the current Supabase URL', () => {
    expect(resolveSupabaseRestUrl({ VITE_SUPABASE_URL: 'http://localhost:5181/' }))
      .toBe('http://localhost:5181/rest/v1')
    expect(resolveSupabaseRestUrl({ VITE_SUPABASE_URL: 'https://test.hedsvs.ch/rest/v1' }))
      .toBe('https://test.hedsvs.ch/rest/v1')
  })

  it('never falls back to the production gateway', () => {
    expect(resolveSupabaseRestUrl({})).toBe('')
  })
})
