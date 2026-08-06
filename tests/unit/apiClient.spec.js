import { describe, expect, it, vi } from 'vitest'

vi.mock('@/supabase', () => ({
  supabase: { auth: { getSession: vi.fn() } }
}))

const { resolveApiBaseUrl } = await import('@/service/apiClient')

describe('resolveApiBaseUrl', () => {
  it('routes production traffic to the dedicated API host when env points to localhost', () => {
    expect(resolveApiBaseUrl('http://localhost/api', {
      origin: 'https://hedsvs.ch',
      protocol: 'https:',
      hostname: 'hedsvs.ch'
    })).toBe('https://api2.hedsvs.ch/api')
  })

  it('does not send a relative production API path to the static frontend host', () => {
    expect(resolveApiBaseUrl('/api', {
      origin: 'https://hedsvs.ch',
      protocol: 'https:',
      hostname: 'hedsvs.ch'
    })).toBe('https://api2.hedsvs.ch/api')
  })

  it('keeps an explicit remote API URL', () => {
    expect(resolveApiBaseUrl('https://api2.hedsvs.ch/api/', {
      origin: 'https://hedsvs.ch',
      protocol: 'https:',
      hostname: 'hedsvs.ch'
    })).toBe('https://api2.hedsvs.ch/api')
  })

  it('keeps the local API URL during local development', () => {
    expect(resolveApiBaseUrl('/api', {
      origin: 'http://localhost:5174',
      protocol: 'http:',
      hostname: 'localhost'
    })).toBe('/api')
  })
})
