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

  it('verrouille la redirection et versionne le modèle de récupération', () => {
    const override = readFileSync(
      join(repositoryRoot, 'backend/deployment/supabase-auth-security.override.yml'),
      'utf8',
    )
    const template = readFileSync(
      join(repositoryRoot, 'public/auth-email-templates/password-recovery.html'),
      'utf8',
    )

    expect(override).toContain('GOTRUE_SITE_URL: "https://hedsvs.ch"')
    expect(override).toContain(
      'GOTRUE_URI_ALLOW_LIST: "https://hedsvs.ch/reset-password*,https://www.hedsvs.ch/reset-password*"',
    )
    expect(override).toContain(
      'GOTRUE_MAILER_TEMPLATES_RECOVERY: "https://hedsvs.ch/auth-email-templates/password-recovery.html"',
    )
    expect(override).toContain('GOTRUE_MAILER_SUBJECTS_RECOVERY:')
    expect(template.match(/{{ \.ConfirmationURL }}/g)).toHaveLength(1)
    expect(template).toContain('une heure')
    expect(template).toContain('une seule fois')
    expect(template).not.toMatch(/access_token|refresh_token|service_role|token=/i)
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
    expect(clientConfig.indexOf('getPasswordRecoveryCallbackTarget(window.location)')).toBeLessThan(
      clientConfig.indexOf('createClient(supabaseUrl, supabaseAnonKey'),
    )
    expect(clientConfig).toContain('detectSessionInUrl: !isPasswordRecoveryRoute')
  })
})
