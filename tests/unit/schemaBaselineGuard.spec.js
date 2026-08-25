import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  findDestructiveStatements,
  verifyBaselineArtifacts,
  validateAppendOnlyChanges,
  verifyCanonicalMigrations,
  verifyLegacySql,
} from '../../scripts/supabase/schema-baseline-lib.mjs'

const temporaryDirectories = []

function createRoot() {
  const root = mkdtempSync(path.join(tmpdir(), 'schema-baseline-'))
  temporaryDirectories.push(root)
  return root
}

function write(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, content)
}

function hash(content) {
  return createHash('sha256').update(content).digest('hex')
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe('Supabase schema baseline guard', () => {
  it('détecte les opérations SQL destructrices', () => {
    expect(findDestructiveStatements('drop table public.demo;')).toContain('drop')
    expect(findDestructiveStatements('alter table demo disable row level security;')).toContain('disable-rls')
    expect(findDestructiveStatements('truncate public.demo;')).toContain('truncate')
    expect(findDestructiveStatements('delete from public.demo;')).toContain('delete')
    expect(findDestructiveStatements('update public.demo set active = false;')).toContain('update')
    expect(findDestructiveStatements('alter table public.demo drop column name;')).toContain('alter-drop')
    expect(findDestructiveStatements('drop index public.demo_idx;')).toContain('drop')
    expect(findDestructiveStatements('drop type public.demo_type;')).toContain('drop')
    expect(findDestructiveStatements('drop sequence public.demo_seq;')).toContain('drop')
    expect(findDestructiveStatements('create table public.demo(id uuid);')).toEqual([])
  })

  it('refuse toute modification, suppression ou renommage d’une migration déjà suivie', () => {
    expect(validateAppendOnlyChanges([
      { status: 'A', filePath: 'supabase/migrations/20260824150000_new.sql' },
      { status: '??', filePath: 'supabase/migrations/20260824150001_local.sql' },
    ])).toEqual([])
    expect(validateAppendOnlyChanges([
      { status: 'M', filePath: 'supabase/migrations/old.sql' },
      { status: 'D', filePath: 'supabase/migrations/deleted.sql' },
      { status: 'R', previousPath: 'supabase/migrations/a.sql', filePath: 'supabase/migrations/b.sql' },
    ])).toHaveLength(3)
  })

  it('gèle chaque fichier SQL legacy par chemin et empreinte', () => {
    const root = createRoot()
    const legacyPath = 'migrations/legacy.sql'
    const content = 'select 1;\n'
    write(root, legacyPath, content)
    write(
      root,
      'supabase/baseline/legacy-sql-manifest.json',
      JSON.stringify({ files: [{ path: legacyPath, sha256: hash(content) }] }),
    )

    expect(verifyLegacySql(root)).toEqual([])
    write(root, legacyPath, 'select 2;\n')
    expect(verifyLegacySql(root)).toContain(`legacy SQL: empreinte modifiée: ${legacyPath}`)
  })

  it('impose un timestamp UTC complet aux nouvelles migrations canoniques', () => {
    const root = createRoot()
    write(root, 'supabase/baseline/canonical-migrations-manifest.json', JSON.stringify({ files: [] }))
    write(root, 'supabase/migrations/20260824_bad.sql', 'select 1;\n')
    write(root, 'supabase/migrations/20260824150000_good.sql', 'select 1;\n')

    const result = verifyCanonicalMigrations(root)
    expect(result.newPaths).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('20260824_bad.sql')
  })

  it('valide l’intégrité du dump et la cohérence du catalogue', () => {
    const root = createRoot()
    const dump = 'create table public.demo(id uuid);\n'
    const catalog = {
      relations: [{ name: 'demo', kind: 'table' }],
      functions: [],
      policies: [],
      triggers: [],
      tableGrants: [],
      routineGrants: [],
      foreignKeys: [],
      viewDependencies: [],
    }
    const stack = {
      exposedSchemas: ['public'],
      dumpSha256: hash(dump),
      catalogSha256: hash(JSON.stringify(catalog)),
      internalDependenciesSha256: hash('select 1;\n'),
      objectCounts: {
        relations: 1,
        functions: 0,
        policies: 0,
        triggers: 0,
        tableGrants: 0,
        routineGrants: 0,
        foreignKeys: 0,
        viewDependencies: 0,
      },
    }
    write(root, 'supabase/baseline/public-schema.sql', dump)
    write(root, 'supabase/baseline/catalog.json', JSON.stringify(catalog))
    write(root, 'supabase/baseline/stack.json', JSON.stringify(stack))
    write(root, 'supabase/baseline/internal-dependencies.sql', 'select 1;\n')

    expect(verifyBaselineArtifacts(root)).toEqual([])

    write(root, 'supabase/baseline/catalog.json', JSON.stringify({ ...catalog, policies: [{ name: 'drift' }] }))
    expect(verifyBaselineArtifacts(root)).toContain('baseline: empreinte SHA-256 du catalogue incohérente')
  })
})
