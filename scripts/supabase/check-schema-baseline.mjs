import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runSchemaBaselineChecks } from './schema-baseline-lib.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDirectory, '../..')
const errors = runSchemaBaselineChecks(root)

if (errors.length > 0) {
  console.error('Échec du contrôle de baseline Supabase:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Baseline Supabase valide: dump, catalogue, migrations canoniques et lignées legacy contrôlés.')
