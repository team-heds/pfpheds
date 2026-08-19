import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import process from 'node:process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

if (!existsSync('backend/.env')) {
  console.error('[dev:full] Le fichier backend/.env est manquant.')
  console.error('[dev:full] Copiez backend/.env.example vers backend/.env puis configurez les valeurs locales.')
  process.exit(1)
}

const services = [
  { name: 'frontend', args: ['run', 'dev'] },
  { name: 'backend', args: ['--prefix', 'backend', 'run', 'dev'] },
]

const children = services.map(({ name, args }) => {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  child.on('error', (error) => {
    console.error(`[dev:full] Impossible de démarrer ${name}:`, error.message)
  })

  return { name, child }
})

let stopping = false

function stopAll(exitCode = 0) {
  if (stopping) return
  stopping = true

  for (const { child } of children) {
    if (!child.killed) child.kill('SIGTERM')
  }

  setTimeout(() => process.exit(exitCode), 250)
}

for (const { name, child } of children) {
  child.on('exit', (code, signal) => {
    if (stopping) return
    const reason = signal ? `signal ${signal}` : `code ${code ?? 1}`
    console.error(`[dev:full] ${name} s'est arrêté (${reason}). Arrêt des autres services.`)
    stopAll(code ?? 1)
  })
}

process.on('SIGINT', () => stopAll(0))
process.on('SIGTERM', () => stopAll(0))
