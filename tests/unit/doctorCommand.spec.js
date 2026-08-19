import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseEnv, runDoctor, verifySupabaseContracts } from '../../scripts/doctor.mjs'

const tempDirectories = []

afterEach(() => {
  for (const directory of tempDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true })
})

describe('npm run doctor', () => {
  it('parse les variables sans exposer leur contenu', () => {
    expect(parseEnv('A=secret\nB="value"\n# C=ignored')).toEqual({ A: 'secret', B: 'value' })
  })

  it('valide chaque contrat avec des GET limités à zéro ligne', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    const result = await verifySupabaseContracts({
      supabaseUrl: 'https://supabase.example/rest/v1',
      supabaseKey: 'not-logged',
      fetchImpl: fetchMock
    })

    expect(result.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalled()
    for (const [url] of fetchMock.mock.calls) expect(url.searchParams.get('limit')).toBe('0')
  })

  it('échoue sur une colonne invalide mais accepte une table protégée', async () => {
    const protectedResult = await verifySupabaseContracts({
      supabaseUrl: 'https://supabase.example',
      supabaseKey: 'not-logged',
      fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 403 }),
    })
    expect(protectedResult.ok).toBe(true)
    expect(protectedResult.message).toContain('protégé(s)')

    const invalidResult = await verifySupabaseContracts({
      supabaseUrl: 'https://supabase.example',
      supabaseKey: 'not-logged',
      fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 400 }),
    })
    expect(invalidResult.ok).toBe(false)
    expect(invalidResult.message).toContain('HTTP 400')
  })

  it('contrôle env, ports, backend et Supabase sans journaliser les secrets', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'heds-doctor-'))
    tempDirectories.push(cwd)
    mkdirSync(join(cwd, 'backend'))
    writeFileSync(
      join(cwd, '.env'),
      'VITE_SUPABASE_URL=https://supabase.example\nVITE_SUPABASE_KEY=frontend-secret\n'
    )
    writeFileSync(
      join(cwd, 'backend/.env'),
      'SUPABASE_URL=https://supabase.example\nSUPABASE_SERVICE_ROLE_KEY=server-secret\nPORT=3000\n'
    )

    const messages = []
    const logger = { log: (message) => messages.push(message) }
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    const result = await runDoctor({
      cwd,
      logger,
      probePortImpl: vi.fn().mockResolvedValue(true),
      fetchImpl
    })

    expect(result.ok).toBe(true)
    expect(messages.join('\n')).not.toContain('frontend-secret')
    expect(messages.join('\n')).not.toContain('server-secret')
    expect(messages.join('\n')).toContain('[doctor] Environnement prêt.')
  })
})
