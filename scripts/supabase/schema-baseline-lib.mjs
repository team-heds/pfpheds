import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

export const LEGACY_SQL_ROOTS = [
  'backend/supabase/migrations',
  'migrations',
  'src/database/migrations',
  'sql',
]

export const DESTRUCTIVE_SQL_PATTERNS = [
  { id: 'drop', regex: /\bdrop\s+(?:table|schema|view|materialized\s+view|function|procedure|extension|policy|trigger|index|type|sequence|domain|column|constraint)\b/i },
  { id: 'alter-drop', regex: /\balter\s+(?:table|view|type|domain)\b[\s\S]*?\bdrop\s+(?:column|constraint|attribute|value)\b/i },
  { id: 'truncate', regex: /\btruncate\s+(?:table\s+)?/i },
  { id: 'disable-rls', regex: /\bdisable\s+row\s+level\s+security\b/i },
  { id: 'delete', regex: /\bdelete\s+from\b/i },
  { id: 'update', regex: /\bupdate\s+(?:only\s+)?(?:[a-z_][\w$]*\.)?[a-z_][\w$]*\s+set\b/i },
]

export function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

export function normalizePath(value) {
  return value.split(path.sep).join('/')
}

export function listSqlFiles(root, relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory)
  if (!existsSync(absoluteDirectory)) return []

  const files = []
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(absolutePath)
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.sql')) {
        files.push(normalizePath(path.relative(root, absolutePath)))
      }
    }
  }
  visit(absoluteDirectory)
  return files.sort()
}

export function loadJson(root, relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'))
}

function verifyManifest(root, manifest, actualPaths, label) {
  const errors = []
  const expected = new Map(manifest.files.map((entry) => [entry.path, entry]))
  const actual = new Set(actualPaths)

  for (const filePath of actual) {
    const entry = expected.get(filePath)
    if (!entry) {
      errors.push(`${label}: fichier SQL non autorisé: ${filePath}`)
      continue
    }
    const actualHash = sha256(readFileSync(path.join(root, filePath)))
    if (actualHash !== entry.sha256) {
      errors.push(`${label}: empreinte modifiée: ${filePath}`)
    }
  }

  for (const filePath of expected.keys()) {
    if (!actual.has(filePath)) errors.push(`${label}: fichier gelé manquant: ${filePath}`)
  }

  return errors
}

export function verifyLegacySql(root) {
  const manifest = loadJson(root, 'supabase/baseline/legacy-sql-manifest.json')
  const actualPaths = LEGACY_SQL_ROOTS.flatMap((directory) => listSqlFiles(root, directory))
  return verifyManifest(root, manifest, actualPaths, 'legacy SQL')
}

export function verifyCanonicalMigrations(root) {
  const manifest = loadJson(root, 'supabase/baseline/canonical-migrations-manifest.json')
  const actualPaths = listSqlFiles(root, 'supabase/migrations')
  const frozenPaths = new Set(manifest.files.map((entry) => entry.path))
  const errors = verifyManifest(
    root,
    manifest,
    actualPaths.filter((filePath) => frozenPaths.has(filePath)),
    'migration canonique',
  )

  const newPaths = actualPaths.filter((filePath) => !frozenPaths.has(filePath))
  for (const filePath of newPaths) {
    const fileName = path.basename(filePath)
    if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(fileName)) {
      errors.push(`migration canonique: nouveau nom invalide (timestamp UTC sur 14 chiffres requis): ${filePath}`)
    }
  }

  return { errors, newPaths }
}

export function validateAppendOnlyChanges(changes) {
  const errors = []
  for (const { status, filePath, previousPath } of changes) {
    if (status === 'A' || status === '??') continue
    const detail = previousPath ? `${previousPath} -> ${filePath}` : filePath
    errors.push(`migration canonique: historique non append-only (${status}): ${detail}`)
  }
  return errors
}

function parseGitNameStatus(output) {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [rawStatus, firstPath, secondPath] = line.split('\t')
      const status = rawStatus.startsWith('R') || rawStatus.startsWith('C') ? rawStatus[0] : rawStatus
      return secondPath
        ? { status, previousPath: normalizePath(firstPath), filePath: normalizePath(secondPath) }
        : { status, filePath: normalizePath(firstPath) }
    })
}

export function verifyAppendOnlyGit(root, environment = process.env) {
  const baseRef = environment.SCHEMA_GUARD_BASE_REF
    || (environment.GITHUB_BASE_REF ? `origin/${environment.GITHUB_BASE_REF}` : 'origin/prod')
  try {
    const mergeBase = execFileSync('git', ['merge-base', 'HEAD', baseRef], { cwd: root, encoding: 'utf8' }).trim()
    const committed = execFileSync(
      'git',
      ['diff', '--name-status', '--find-renames', mergeBase, '--', 'supabase/migrations'],
      { cwd: root, encoding: 'utf8' },
    )
    const worktree = execFileSync(
      'git',
      ['diff', '--name-status', '--find-renames', 'HEAD', '--', 'supabase/migrations'],
      { cwd: root, encoding: 'utf8' },
    )
    return validateAppendOnlyChanges([...parseGitNameStatus(committed), ...parseGitNameStatus(worktree)])
  } catch (error) {
    return [`migration canonique: comparaison Git impossible avec ${baseRef}: ${error.message}`]
  }
}

export function findDestructiveStatements(sql) {
  return DESTRUCTIVE_SQL_PATTERNS.filter(({ regex }) => regex.test(sql)).map(({ id }) => id)
}

export function verifyDestructiveSql(root, canonicalPaths) {
  const allowlist = loadJson(root, 'supabase/schema-guard-allowlist.json')
  const allowed = new Map(allowlist.files.map((entry) => [entry.path, entry]))
  const errors = []

  for (const filePath of canonicalPaths) {
    const content = readFileSync(path.join(root, filePath))
    const findings = findDestructiveStatements(content.toString('utf8'))
    if (findings.length === 0) continue

    const exception = allowed.get(filePath)
    if (!exception) {
      errors.push(`migration destructive non autorisée (${findings.join(', ')}): ${filePath}`)
      continue
    }
    if (sha256(content) !== exception.sha256) {
      errors.push(`exception destructive invalide après modification: ${filePath}`)
    }
    if (!exception.reason?.trim()) errors.push(`exception destructive sans justification: ${filePath}`)
  }

  return errors
}

export function verifyBaselineArtifacts(root) {
  const errors = []
  const baselineDirectory = path.join(root, 'supabase/baseline')
  const dumpPath = path.join(baselineDirectory, 'public-schema.sql')
  const catalogPath = path.join(baselineDirectory, 'catalog.json')
  const stackPath = path.join(baselineDirectory, 'stack.json')
  const internalDependenciesPath = path.join(baselineDirectory, 'internal-dependencies.sql')

  for (const filePath of [dumpPath, catalogPath, stackPath, internalDependenciesPath]) {
    if (!existsSync(filePath)) errors.push(`artefact baseline manquant: ${normalizePath(path.relative(root, filePath))}`)
  }
  if (errors.length > 0) return errors

  const dump = readFileSync(dumpPath)
  const dumpText = dump.toString('utf8')
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
  const stack = JSON.parse(readFileSync(stackPath, 'utf8'))
  const internalDependencies = readFileSync(internalDependenciesPath)

  if (sha256(dump) !== stack.dumpSha256) errors.push('baseline: empreinte SHA-256 du dump incohérente')
  if (sha256(readFileSync(catalogPath)) !== stack.catalogSha256) {
    errors.push('baseline: empreinte SHA-256 du catalogue incohérente')
  }
  if (sha256(internalDependencies) !== stack.internalDependenciesSha256) {
    errors.push('baseline: empreinte des dépendances internes incohérente')
  }
  if (!Array.isArray(stack.exposedSchemas) || !stack.exposedSchemas.includes('public')) {
    errors.push('baseline: schéma Data API public non déclaré')
  }
  if (/^COPY\s+public\.|^INSERT\s+INTO\s+public\./im.test(dumpText)) {
    errors.push('baseline: données métier détectées dans le dump schema-only')
  }
  if (!Array.isArray(catalog.relations) || catalog.relations.length < 1) errors.push('baseline: catalogue des relations vide')
  if (!Array.isArray(catalog.policies)) errors.push('baseline: policies absentes du catalogue')
  if (!Array.isArray(catalog.triggers)) errors.push('baseline: triggers absents du catalogue')
  if (!Array.isArray(catalog.tableGrants)) errors.push('baseline: grants absents du catalogue')
  if (!Array.isArray(catalog.foreignKeys) || !Array.isArray(catalog.viewDependencies)) {
    errors.push('baseline: dépendances absentes du catalogue')
  }

  const countedCollections = [
    'relations',
    'functions',
    'policies',
    'triggers',
    'tableGrants',
    'routineGrants',
    'foreignKeys',
    'viewDependencies',
  ]
  for (const collection of countedCollections) {
    const expected = stack.objectCounts?.[collection]
    const actual = catalog[collection]?.length
    if (!Number.isInteger(expected)) errors.push(`baseline: compteur ${collection} absent de stack.json`)
    else if (actual !== expected) errors.push(`baseline: ${actual} ${collection} dans le catalogue, ${expected} attendus`)
  }

  return errors
}

export function runSchemaBaselineChecks(root) {
  const canonical = verifyCanonicalMigrations(root)
  const canonicalPaths = listSqlFiles(root, 'supabase/migrations')
  return [
    ...verifyLegacySql(root),
    ...canonical.errors,
    ...verifyAppendOnlyGit(root),
    ...verifyDestructiveSql(root, canonicalPaths),
    ...verifyBaselineArtifacts(root),
  ]
}
