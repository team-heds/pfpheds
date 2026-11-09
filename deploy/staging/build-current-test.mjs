// Build the current working tree in an isolated directory. No repository .env
// file is copied; staging values are injected explicitly into the child.
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'heds-current-test-'))

for (const entry of [
  'index.html',
  'package.json',
  'package-lock.json',
  'vite.config.js',
  'jsconfig.json',
  'firebase.js',
  'backend/domain',
  'src',
  'public'
]) {
  await fs.cp(path.join(root, entry), path.join(directory, entry), {
    recursive: true
  })
}

await fs.symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'))

const values = Object.fromEntries(
  (await fs.readFile(path.join(root, 'deploy/staging/.env'), 'utf8'))
    .split(/\r?\n/)
    .flatMap((line) => {
      const trimmed = line.trim()
      const index = trimmed.indexOf('=')
      return !trimmed || trimmed.startsWith('#') || index < 1
        ? []
        : [[trimmed.slice(0, index), trimmed.slice(index + 1)]]
    })
)

const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith('VITE_'))
)

Object.assign(env, {
  VITE_SUPABASE_URL: 'https://test.hedsvs.ch',
  VITE_SUPABASE_REST_URL: 'https://test.hedsvs.ch/rest/v1',
  VITE_SUPABASE_KEY: values.STAGING_ANON_KEY,
  VITE_API_URL: 'https://test.hedsvs.ch/api',
  VITE_API_BASE_URL: 'https://test.hedsvs.ch/api',
  VITE_BACKEND_URL: 'https://test.hedsvs.ch',
  VITE_APP_ENV: 'staging',
  VITE_SUPABASE_REALTIME: 'false',
  VITE_GAMIFICATION_USER_UI: 'true',
  VITE_GAMIFICATION_HOUSE_QUIZ: 'true',
  VITE_GAMIFICATION_BADGES_CHALLENGES: 'true',
  VITE_GAMIFICATION_GAMES_HUB: 'true',
  VITE_GAMIFICATION_DAILY_WHEEL: 'false',
  VITE_GAMIFICATION_ROM_RUNNER: 'false',
  VITE_GAMIFICATION_TOURNAMENTS: 'false',
  VITE_GAMIFICATION_VENTRIGLISSE: 'true'
})

execFileSync('npm', ['run', 'build'], {
  cwd: directory,
  env,
  stdio: 'inherit'
})

console.log(`FRONTEND_BUILD=${directory}`)
