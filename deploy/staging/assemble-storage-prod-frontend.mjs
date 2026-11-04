// Preserve the exact production graph and its voting hotfixes. Add only
// versioned media chunks and update their entry/precache references.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { parse } from 'acorn'

const root = process.cwd()
const baseline = path.join(root, '.codex-tmp/storage-prod-live')
const physio = path.join(root, '.codex-tmp/storage-prod-candidate')
const institutions = path.join(root, '.codex-tmp/storage-prod-institutions-candidate')
const output = path.join(root, '.codex-tmp/storage-prod-release')
const oldRoot = 'index-HEDS25-votation-v4.js'
const newRoot = 'index-HEDS25-storage-v1.js'
const sha = input => createHash('sha256').update(input).digest('hex')
const revision = input => createHash('md5').update(input).digest('hex')
const ast = input => parse(input, { ecmaVersion: 'latest', sourceType: 'module' })
const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return
  if (node.type) visit(node)
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit))
    else if (value && typeof value === 'object') walk(value, visit)
  }
}
const json = async file => JSON.parse(await fs.readFile(file, 'utf8'))
const a = await json(path.join(physio, 'filephysio-patch-manifest.json'))
const b = await json(path.join(institutions, 'report.json'))
const mappings = { ...a.mappings, ...b.mappings }
assert.equal(Object.keys(mappings).length, 8)
const originalRoot = await fs.readFile(path.join(baseline, 'assets', oldRoot), 'utf8')
const html = await fs.readFile(path.join(baseline, 'index.html'), 'utf8')
const worker = await fs.readFile(path.join(baseline, 'sw.js'), 'utf8')
assert.equal(sha(originalRoot), 'c4476d5d4d7fa284428ef8f6ab66581e027d55717c061736f41188e7de2b49a5')
assert.equal(sha(html), 'de9289f157dcc56c4b1ba4a991605e792c5a27fe29bec6658c4419128c537fb6')
assert.equal(sha(worker), 'c77c6d21f12f99491c12b33a868bfef3f07db700a08f2a6e798391e15f168129')
for (const [filename, hash] of Object.entries(a.expectedInputHashes)) {
  assert.equal(sha(await fs.readFile(path.join(baseline, 'assets', filename))), hash, `Unexpected baseline: ${filename}`)
}
for (const file of b.files) assert.equal(sha(await fs.readFile(path.join(baseline, 'assets', file.original))), file.beforeSha256)

await fs.mkdir(path.join(output, 'assets'), { recursive: true })
const assets = new Map()
for (const entry of [...a.assets, a.helper]) {
  const code = await fs.readFile(path.join(physio, entry.filename), 'utf8')
  assert.equal(sha(code), entry.sha256)
  assets.set(entry.filename, code)
}
for (const entry of b.files) {
  const code = await fs.readFile(path.join(institutions, 'assets', entry.candidate), 'utf8')
  assert.equal(sha(code), entry.afterSha256)
  assets.set(entry.candidate, code)
}
const placeholder = 'institution-placeholder-HEDS25-storage-v1.svg'
const svg = await fs.readFile(path.join(institutions, 'assets', placeholder), 'utf8')
assert(svg.startsWith('<svg ') && !/<script|onload=|href=/i.test(svg))
assets.set(placeholder, svg)

let rewrittenRoot = originalRoot
const referenceCounts = {}
for (const [before, after] of Object.entries(mappings)) {
  referenceCounts[before] = rewrittenRoot.split(before).length - 1
  rewrittenRoot = rewrittenRoot.split(before).join(after)
}
let restored = rewrittenRoot
for (const [before, after] of Object.entries(mappings)) restored = restored.split(after).join(before)
assert.equal(restored, originalRoot, 'A non-media root change was detected')
assets.set(newRoot, rewrittenRoot)
assert.equal(html.split(oldRoot).length - 1, 1)
// The historical lazy chunks import exports from the original application
// entry. Canonicalize those imports to this entry BEFORE module evaluation;
// otherwise the old entry executes a second bootstrap with an obsolete router.
const importMap = JSON.stringify({ imports: { '/assets/index-Eg7w2WHW.js': `/assets/${newRoot}` } })
const rewrittenHtml = html.replace(oldRoot, newRoot)
const moduleTag = `<script type="module" crossorigin src="/assets/${newRoot}"></script>`
assert.equal(rewrittenHtml.split(moduleTag).length - 1, 1)
const newHtml = rewrittenHtml.replace(moduleTag, `<script type="importmap">${importMap}</script>\n  ${moduleTag}`)

const arrays = []
walk(ast(worker), node => {
  if (node.type === 'ArrayExpression' && node.elements.length > 100 && node.elements.every(entry => entry?.type === 'ObjectExpression' && entry.properties.some(p => (p.key.name || p.key.value) === 'url'))) arrays.push(node)
})
assert.equal(arrays.length, 1, 'Unexpected Workbox precache manifest')
const manifest = arrays[0]
const entries = manifest.elements.map(entry => Object.fromEntries(entry.properties.map(prop => [prop.key.name || prop.key.value, prop.value.value])))
for (const entry of entries) {
  if (entry.url === 'index.html') entry.revision = revision(newHtml)
  const filename = entry.url.replace(/^assets\//, '')
  const replacement = filename === oldRoot ? newRoot : mappings[filename]
  if (replacement) {
    entry.url = `assets/${replacement}`
    entry.revision = revision(assets.get(replacement))
  }
}
for (const [filename, code] of assets) {
  const url = `assets/${filename}`
  if (!entries.some(entry => entry.url === url)) entries.push({ revision: revision(code), url })
}
assert.equal(new Set(entries.map(entry => entry.url)).size, entries.length)
const newWorker = worker.slice(0, manifest.start) + JSON.stringify(entries) + worker.slice(manifest.end)
ast(newWorker)

// Validate every module dependency and named import against the unchanged
// production exports, so no second Vue/vendor/application runtime is introduced.
const readAsset = async filename => assets.has(filename) ? assets.get(filename) : fs.readFile(path.join(baseline, 'assets', filename), 'utf8')
const exportCache = new Map()
async function exportsOf(filename) {
  if (exportCache.has(filename)) return exportCache.get(filename)
  const names = new Set()
  for (const node of ast(await readAsset(filename)).body) {
    if (node.type === 'ExportDefaultDeclaration') names.add('default')
    if (node.type === 'ExportNamedDeclaration') {
      for (const spec of node.specifiers) names.add(spec.exported.name || spec.exported.value)
      if (node.declaration?.id) names.add(node.declaration.id.name)
      for (const item of node.declaration?.declarations || []) if (item.id.type === 'Identifier') names.add(item.id.name)
    }
  }
  exportCache.set(filename, names)
  return names
}
let importsChecked = 0
for (const [filename, code] of assets) {
  if (!filename.endsWith('.js')) continue
  const nodes = []
  walk(ast(code), node => { if (node.type === 'ImportDeclaration' || node.type === 'ImportExpression' && node.source.type === 'Literal') nodes.push(node) })
  for (const node of nodes) {
    const source = node.source.value
    if (!source.startsWith('./')) continue
    const dependency = source.slice(2)
    if (!assets.has(dependency)) await fs.access(path.join(baseline, 'assets', dependency))
    if (node.type === 'ImportDeclaration' && dependency.endsWith('.js')) {
      const exports = await exportsOf(dependency)
      for (const spec of node.specifiers) {
        const name = spec.type === 'ImportDefaultSpecifier' ? 'default' : spec.imported?.name || spec.imported?.value
        if (name) assert(exports.has(name), `${filename}: missing export ${name} in ${dependency}`)
      }
    }
    importsChecked++
  }
}
const protectedAssets = []
assert.deepEqual([...await exportsOf('index-Eg7w2WHW.js')].sort(), [...await exportsOf(newRoot)].sort(), 'Canonical entry exports must exactly match the historical entry')
for (const filename of await fs.readdir(path.join(baseline, 'assets'))) {
  if (!filename.startsWith('._') && /votation|votationSession|votationEligibility/i.test(filename) && filename.endsWith('.js')) {
    protectedAssets.push({ filename, sha256: sha(await fs.readFile(path.join(baseline, 'assets', filename))) })
  }
}
for (const [filename, code] of assets) await fs.writeFile(path.join(output, 'assets', filename), code)
await fs.writeFile(path.join(output, 'index.html'), newHtml)
await fs.writeFile(path.join(output, 'sw.js'), newWorker)
const report = {
  scope: 'Production media only, preserving deployed voting logic',
  expectedIndex: sha(html), expectedWorker: sha(worker), originalRootSha256: sha(originalRoot),
  publishedIndex: sha(newHtml), publishedWorker: sha(newWorker),
  newRoot, rootInverseComparisonExact: true, referenceCounts, importsChecked,
  entryCanonicalization: { importMap, exportedBindingsUnchanged: true },
  assets: [...assets].map(([filename, code]) => ({ filename, sha256: sha(code) })),
  protectedAssets, otherProductionAssetsOverwritten: 0,
}
await fs.writeFile(path.join(output, 'release-report.json'), JSON.stringify(report, null, 2))
await fs.writeFile(path.join(output, 'SHA256SUMS'), [
  ...report.assets.map(entry => `${entry.sha256}  assets/${entry.filename}`),
  `${report.publishedIndex}  index.html`, `${report.publishedWorker}  sw.js`,
].join('\n') + '\n')
await fs.writeFile(path.join(output, 'PRESERVED_SHA256SUMS'), report.protectedAssets.map(entry => `${entry.sha256}  assets/${entry.filename}`).join('\n') + '\n')
console.log(JSON.stringify({ output, assetCount: assets.size, importsChecked, votingAssetsPreserved: protectedAssets.length, rootInverseComparisonExact: true, publishedIndex: report.publishedIndex }, null, 2))
