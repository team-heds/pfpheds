import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'heds-test-frontend-'))
const build = path.join(directory, 'build')
const excludedRoots = new Set([
  '.agents', '.codex', '.codex-tmp', '.git',
  'artifacts', 'backend', 'deploy', 'dist', 'documentation',
  'node_modules', 'outputs', 'presentation',
])

await fs.cp(root, build, {
  recursive: true,
  filter(source) {
    const relative = path.relative(root, source)
    if (!relative) return true
    const parts = relative.split(path.sep)
    if (excludedRoots.has(parts[0])) return false
    return !parts.some(part => part === '.env' || part.startsWith('.env.'))
  },
})

// A small number of frontend modules share pure helpers with the backend.
await fs.cp(path.join(root, 'backend/domain'), path.join(build, 'backend/domain'), { recursive: true })
await fs.symlink(path.join(root, 'node_modules'), path.join(build, 'node_modules'))

const values = Object.fromEntries(
  (await fs.readFile(path.join(root, 'deploy/staging/.env'), 'utf8'))
    .split(/\r?\n/)
    .flatMap(line => {
      const trimmed = line.trim()
      const separator = trimmed.indexOf('=')
      return !trimmed || trimmed.startsWith('#') || separator < 1
        ? []
        : [[trimmed.slice(0, separator), trimmed.slice(separator + 1)]]
    })
)

if (!values.STAGING_ANON_KEY) throw new Error('STAGING_ANON_KEY is unavailable')

const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITE_')))
Object.assign(env, {
  VITE_SUPABASE_URL: 'https://test.hedsvs.ch',
  VITE_SUPABASE_REST_URL: 'https://test.hedsvs.ch/rest/v1',
  VITE_SUPABASE_KEY: values.STAGING_ANON_KEY,
  VITE_API_URL: 'https://test.hedsvs.ch/api',
  VITE_API_BASE_URL: 'https://test.hedsvs.ch/api',
  VITE_BACKEND_URL: 'https://test.hedsvs.ch',
  VITE_APP_ENV: 'staging',
  // The reduced staging stack intentionally has no Realtime service.
  VITE_SUPABASE_REALTIME: 'false',
  VITE_GAMIFICATION_USER_UI: 'true',
  VITE_GAMIFICATION_HOUSE_QUIZ: 'true',
  VITE_GAMIFICATION_BADGES_CHALLENGES: 'true',
  VITE_GAMIFICATION_MENTORING: 'true',
  VITE_GAMIFICATION_GAMES_HUB: 'false',
  VITE_GAMIFICATION_DAILY_WHEEL: 'false',
  VITE_GAMIFICATION_ROM_RUNNER: 'false',
  VITE_GAMIFICATION_TOURNAMENTS: 'false',
  VITE_GAMIFICATION_VENTRIGLISSE: 'false',
})

execFileSync('npm', ['run', 'build'], { cwd: build, env, stdio: 'inherit' })
console.log(`FRONTEND_BUILD=${path.join(build, 'dist')}`)
