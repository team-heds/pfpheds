import { createConnection } from 'node:net'
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import process from 'node:process'
import { CRITICAL_SUPABASE_CONTRACTS } from '../src/service/supabaseContracts.js'

const DEFAULT_TIMEOUT_MS = 4_000

export function parseEnv(content = '') {
  const env = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function readEnvFile(path) {
  return existsSync(path) ? parseEnv(readFileSync(path, 'utf8')) : null
}

function normalizedBaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '')
}

export async function probePort(port, host = '127.0.0.1', timeoutMs = 800) {
  return await new Promise((resolve) => {
    const socket = createConnection({ port, host })
    const done = (listening) => {
      socket.destroy()
      resolve(listening)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function verifySupabaseContracts({
  supabaseUrl,
  supabaseKey,
  fetchImpl = fetchWithTimeout
}) {
  const baseUrl = normalizedBaseUrl(supabaseUrl)
  if (!baseUrl || !supabaseKey) {
    return { ok: false, message: 'configuration Supabase incomplète' }
  }

  let validated = 0
  const protectedTables = []
  for (const [table, columns] of Object.entries(CRITICAL_SUPABASE_CONTRACTS)) {
    const query = new URL(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`)
    query.searchParams.set('select', columns.join(','))
    query.searchParams.set('limit', '0')

    let response
    try {
      response = await fetchImpl(query, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json'
        }
      })
    } catch (error) {
      return {
        ok: false,
        message: `Supabase inaccessible (${error?.name === 'AbortError' ? 'timeout' : 'réseau'})`
      }
    }

    if (response.status === 401 || response.status === 403) {
      protectedTables.push(table)
      continue
    }
    if (!response.ok) {
      return { ok: false, message: `contrat ${table} refusé (HTTP ${response.status})` }
    }
    validated += 1
  }

  const protectedMessage = protectedTables.length
    ? `, ${protectedTables.length} protégé(s) par les droits API`
    : ''
  return {
    ok: true,
    message: `${validated} contrats validés${protectedMessage}`
  }
}

export async function runDoctor({
  cwd = process.cwd(),
  logger = console,
  probePortImpl = probePort,
  fetchImpl = fetchWithTimeout
} = {}) {
  const results = []
  const report = (level, label, detail) => {
    results.push({ level, label, detail })
    logger.log(`[${level}] ${label}: ${detail}`)
  }

  const frontendPath = `${cwd}/.env`
  const backendPath = `${cwd}/backend/.env`
  const frontendEnv = readEnvFile(frontendPath)
  const backendEnv = readEnvFile(backendPath)

  if (!frontendEnv) report('FAIL', 'env frontend', '.env manquant')
  else {
    const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_KEY'].filter((key) => !frontendEnv[key])
    report(
      missing.length ? 'FAIL' : 'OK',
      'env frontend',
      missing.length ? `clés manquantes: ${missing.join(', ')}` : 'clés requises présentes'
    )
  }

  if (!backendEnv) report('FAIL', 'env backend', 'backend/.env manquant')
  else {
    const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((key) => !backendEnv[key])
    report(
      missing.length ? 'FAIL' : 'OK',
      'env backend',
      missing.length ? `clés manquantes: ${missing.join(', ')}` : 'clés requises présentes'
    )
  }

  const frontendPort = 5180
  const backendPort = Number.parseInt(backendEnv?.PORT || '3000', 10)
  const [frontendListening, backendListening] = await Promise.all([
    probePortImpl(frontendPort),
    probePortImpl(backendPort)
  ])
  report(
    frontendListening ? 'OK' : 'WARN',
    `port ${frontendPort}`,
    frontendListening ? 'frontend joignable' : 'frontend non démarré'
  )
  report(
    backendListening ? 'OK' : 'WARN',
    `port ${backendPort}`,
    backendListening ? 'backend joignable' : 'backend non démarré'
  )

  if (backendListening) {
    try {
      const response = await fetchImpl(`http://127.0.0.1:${backendPort}/health/ready`)
      report(response.ok ? 'OK' : 'FAIL', 'backend readiness', `HTTP ${response.status}`)
    } catch (error) {
      report('FAIL', 'backend readiness', error?.name === 'AbortError' ? 'timeout' : 'inaccessible')
    }
  } else {
    report('WARN', 'backend readiness', 'ignoré car le backend est arrêté')
  }

  const contractResult = await verifySupabaseContracts({
    supabaseUrl: backendEnv?.SUPABASE_URL || frontendEnv?.VITE_SUPABASE_URL,
    supabaseKey:
      backendEnv?.SUPABASE_SERVICE_ROLE_KEY ||
      backendEnv?.SUPABASE_KEY ||
      frontendEnv?.VITE_SUPABASE_KEY,
    fetchImpl
  })
  report(contractResult.ok ? 'OK' : 'FAIL', 'Supabase', contractResult.message)

  const failures = results.filter(({ level }) => level === 'FAIL').length
  logger.log(
    failures ? `[doctor] ${failures} erreur(s) à corriger.` : '[doctor] Environnement prêt.'
  )
  return { ok: failures === 0, results }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const result = await runDoctor()
  process.exitCode = result.ok ? 0 : 1
}
