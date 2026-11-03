import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const root = fileURLToPath(new URL('../../', import.meta.url))
process.chdir(root)
const mode = process.argv[2] || '--check'
if (!['--check', '--build-only', '--deploy'].includes(mode) || process.argv.length > 3) {
  console.error('Usage: bash deploy_hedsvs.sh [--check|--build-only|--deploy]')
  process.exit(1)
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} a échoué (code ${result.status}).`)
  return result
}

try {
  const env = { ...process.env, ...loadEnv('production', root, 'VITE_') }
  for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_KEY', 'VITE_API_BASE_URL']) {
    if (!env[name]?.trim()) throw new Error(`Variable manquante : ${name}. Configurez .env.production.local.`)
  }
  // Deployment targets this project's production environment only.
  for (const name of ['VITE_SUPABASE_URL', 'VITE_API_BASE_URL', 'VITE_SUPABASE_REST_URL']) {
    if (!env[name]) continue
    const url = new URL(env[name])
    if (url.protocol !== 'https:' || url.hostname !== 'api2.hedsvs.ch' || url.username || url.password) {
      throw new Error(`${name} doit cibler https://api2.hedsvs.ch en production.`)
    }
  }
  const key = env.VITE_SUPABASE_KEY
  let publicKey = key.startsWith('sb_publishable_')
  try { publicKey ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon' } catch {}
  if (!publicKey) throw new Error('VITE_SUPABASE_KEY doit être une clé publique publishable ou anon, jamais service_role.')

  const target = process.env.DEPLOY_SSH_HOST || 'heds-vps'
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.@-]*$/.test(target)) throw new Error('DEPLOY_SSH_HOST invalide.')
  const options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=10']
  if (process.env.SSH_KEY) options.push('-i', process.env.SSH_KEY, '-o', 'IdentitiesOnly=yes')
  if (mode !== '--build-only') {
    run('ssh', [...options, target, 'bash -s -- check'], {
      stdio: ['pipe', 'inherit', 'inherit'],
      input: fs.readFileSync(new URL('./remote.sh', import.meta.url)),
    })
  }
  console.log('Configuration de production valide (valeurs masquées).')
  if (mode === '--check') process.exit(0)

  run('npm', ['run', 'build:all'], { env })
  for (const file of ['dist/index.html', 'dist/docs/index.html', 'dist/presentation/index.html']) {
    if (!fs.existsSync(file)) throw new Error(`Build incomplet : ${file}.`)
  }
  const assets = fs.readdirSync('dist/assets').filter(name => name.endsWith('.js'))
    .map(name => fs.readFileSync(path.join('dist/assets', name), 'utf8')).join('\n')
  for (const name of ['VITE_SUPABASE_URL', 'VITE_API_BASE_URL']) {
    if (!assets.includes(env[name])) throw new Error(`${name} absent du bundle.`)
  }
  if (mode === '--build-only') process.exit(0)

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pfpheds-deploy-'))
  const release = path.basename(temp)
  try {
    // No node_modules or environment files; backend/uploads is application code.
    for (const [folder, archive] of [['dist', 'frontend.tar.gz'], ['backend', 'backend.tar.gz']]) {
      run('tar', ['--exclude=node_modules', '--exclude=.env', '--exclude=.env.*', '--exclude=.DS_Store',
        '-czf', path.join(temp, archive), '-C', folder, '.'], { env: { ...process.env, COPYFILE_DISABLE: '1' } })
    }
    run('ssh', [...options, target, `umask 077; mkdir /tmp/${release}`])
    run('scp', [...options, path.join(temp, 'frontend.tar.gz'), path.join(temp, 'backend.tar.gz'), `${target}:/tmp/${release}/`])
    run('ssh', [...options, target, `bash -s -- deploy ${release}`], {
      stdio: ['pipe', 'inherit', 'inherit'],
      input: fs.readFileSync(new URL('./remote.sh', import.meta.url)),
    })
    for (const url of ['https://hedsvs.ch/', 'https://hedsvs.ch/docs/', 'https://hedsvs.ch/presentation/']) {
      run('curl', ['--fail', '--silent', '--show-error', '--location', '--max-time', '30', '--output', '/dev/null', url])
    }
    console.log('Déploiement complet terminé : site, documentation, présentations, backend et worker.')
  } finally {
    fs.rmSync(temp, { recursive: true, force: true })
  }
} catch (error) {
  console.error(`[ERREUR] ${error.message}`)
  process.exitCode = 1
}
