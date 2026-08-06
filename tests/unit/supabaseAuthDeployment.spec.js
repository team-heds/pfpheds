import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = process.cwd()

describe('Supabase Auth recovery deployment', () => {
  it('impose une expiration serveur d’une heure', () => {
    const override = readFileSync(
      join(repositoryRoot, 'backend/deployment/supabase-auth-security.override.yml'),
      'utf8',
    )

    expect(override).toMatch(/auth:\s+[\s\S]*GOTRUE_MAILER_OTP_EXP:\s*["']?3600["']?/)
  })

  it('charge l’override de sécurité pendant le déploiement', () => {
    const deployScript = readFileSync(join(repositoryRoot, 'deploy-hedsvs.ps1'), 'utf8')

    expect(deployScript).toContain(
      '-f $remoteBackendPath/deployment/supabase-auth-security.override.yml',
    )
  })

  it('réserve l’échange automatique des callbacks aux routes hors récupération', () => {
    const clientConfig = readFileSync(join(repositoryRoot, 'src/supabase.js'), 'utf8')

    expect(clientConfig).toContain("new Set(['/reset-password', '/new-password'])")
    expect(clientConfig).toContain('detectSessionInUrl: !isPasswordRecoveryRoute')
  })
})
