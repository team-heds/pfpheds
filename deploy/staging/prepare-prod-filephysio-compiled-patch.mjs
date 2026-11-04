// Build a narrowly scoped production candidate from the exact live asset graph.
// No network writes, deployment, root bundle rebuild or application data changes.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import * as acorn from 'acorn'

const root = fileURLToPath(new URL('../../', import.meta.url))
const baseline = path.join(root, '.codex-tmp/storage-prod-baseline')
const output = path.join(root, '.codex-tmp/storage-prod-candidate')
const helper = 'storageMediaService-HEDS25-storage-v1.js'
const known = {
  'index-HEDS25-votation-v4.js': 'c4476d5d4d7fa284428ef8f6ab66581e027d55717c061736f41188e7de2b49a5',
  'DocumentsView-D2h_2Wg6.js': '81c5044ebbb2509089f74a9af5f3cf5ba3fa67788c07e5031492fc4d29380245',
  'AddFileDocPFP-XAlb6y_m.js': '4597c52f14fa0e5221543764d09ffff9cbed4087c5e58cdf9d0ec14952f2d9d0',
  'EditFileDocPFP-CeP8ZhL2.js': 'fb785ed2d69cd89995bfe0095df7ddb4742277cd2b23a92dfb8c152cb810fcd4',
  'institutionMediaService-Cfoxf0zb.js': '55fc049ec7b04aff17bebd7cc5ea142e1bb78e3dcbcdc755c201b7a0dda6e0fe',
}
const mappings = {
  'DocumentsView-D2h_2Wg6.js': 'DocumentsView-HEDS25-storage-v1.js',
  'AddFileDocPFP-XAlb6y_m.js': 'AddFileDocPFP-HEDS25-storage-v1.js',
  'EditFileDocPFP-CeP8ZhL2.js': 'EditFileDocPFP-HEDS25-storage-v1.js',
}
const hash = code => createHash('sha256').update(code).digest('hex')
const parse = code => acorn.parse(code, { sourceType: 'module', ecmaVersion: 'latest' })
function nodes(ast, predicate) {
  const results = []
  function walk(node, ancestors = []) {
    if (!node || typeof node !== 'object') return
    if (predicate(node, ancestors)) results.push({ node, ancestors })
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(child => walk(child, [...ancestors, node]))
      else if (value && typeof value === 'object') walk(value, [...ancestors, node])
    }
  }
  walk(ast)
  return results
}
function edit(code, changes) {
  const ordered = [...changes].sort((a, b) => b.start - a.start || b.end - a.end)
  let previous = code.length + 1
  for (const change of ordered) {
    assert(change.end <= previous, 'Overlapping AST edits refused')
    code = code.slice(0, change.start) + change.text + code.slice(change.end)
    previous = change.start
  }
  parse(code)
  return code
}
const originals = {}
for (const [filename, expected] of Object.entries(known)) {
  const code = await fs.readFile(path.join(baseline, filename), 'utf8')
  assert.equal(hash(code), expected, `Live baseline hash changed: ${filename}`)
  originals[filename] = code
}
const existingServiceAst = parse(originals['institutionMediaService-Cfoxf0zb.js'])
const authImport = existingServiceAst.body.find(node => node.type === 'ImportDeclaration')
assert.equal(authImport.source.value, './index-Eg7w2WHW.js')
assert.equal(authImport.specifiers[0].imported.name, 'g')

// Reuse the reviewed source services with the live authFetch binding. All other
// imports continue to target the existing production vendor/Supabase modules.
const sourceHashes = {}
async function serviceSource(filename, first) {
  const code = await fs.readFile(path.join(root, filename), 'utf8')
  sourceHashes[filename] = hash(code)
  const ast = parse(code)
  const imports = ast.body.filter(node => node.type === 'ImportDeclaration')
  assert.equal(imports.length, 1)
  assert.equal(imports[0].source.value, '@/service/apiClient')
  const baseFunctions = ast.body.filter(node => node.type === 'FunctionDeclaration' && node.id.name === 'backendBaseUrl')
  assert.equal(baseFunctions.length, 1)
  return edit(code, [
    { start: imports[0].start, end: imports[0].end, text: first ? 'import {g as authFetch} from "./index-Eg7w2WHW.js";' : '' },
    { start: baseFunctions[0].start, end: baseFunctions[0].end, text: first ? 'function backendBaseUrl(){return "https://api2.hedsvs.ch";}' : '' },
  ])
}
const helperCode = (await serviceSource('src/service/filePhysioMediaService.js', true)) + '\n' +
  (await serviceSource('src/service/pfpDocumentMediaService.js', false))
parse(helperCode)
assert(!helperCode.includes('import.meta.env'))
assert(!helperCode.includes('firebase'))
await fs.mkdir(output, { recursive: true })
await fs.writeFile(path.join(output, helper), helperCode)

const changesByFile = {}
const candidates = {}
for (const [oldName, newName] of Object.entries(mappings)) {
  const code = originals[oldName]
  const ast = parse(code)
  const changes = []
  const description = []
  if (oldName.startsWith('AddFileDocPFP') || oldName.startsWith('EditFileDocPFP')) {
    const isAdd = oldName.startsWith('AddFileDocPFP')
    const handlerName = isAdd ? 'g' : 'P'
    const found = nodes(ast, node => node.type === 'VariableDeclarator' && node.id.name === handlerName &&
      node.init?.type === 'ArrowFunctionExpression' && node.init.async && code.slice(node.init.start, node.init.end).includes('Upload vers Firebase Storage'))
    assert.equal(found.length, 1, 'Unexpected Firebase upload handler structure')
    const { node: handler, ancestors } = found[0]
    const setup = [...ancestors].reverse().find(node => node.type === 'FunctionExpression')
    assert(setup?.body?.type === 'BlockStatement')
    assert(!code.includes('__hedsBusy'))
    changes.push({ start: setup.body.start + 1, end: setup.body.start + 1, text: 'let __hedsBusy=false;' })
    const replacement = isAdd
      ? 'async()=>{if(__hedsBusy)return;if(!o.value.name.trim()){alert("Saisissez le nom du document.");return;}__hedsBusy=true;try{const __hedsUrl=s.value?__hedsValidateDocumentUrl(o.value.url):(await __hedsUploadDocument(a.value)).url;u("save",{id:crypto.randomUUID(),name:o.value.name.trim(),url:__hedsUrl});}catch(__hedsError){alert(__hedsError.message||"Le document n’a pas pu être téléversé.");}finally{__hedsBusy=false;}}'
      : 'async()=>{if(__hedsBusy)return;if(!l.name.trim()){alert("Saisissez le nom du document.");return;}__hedsBusy=true;try{l.url=a.value?(await __hedsUploadDocument(a.value)).url:__hedsValidateDocumentUrl(l.url);s("save",{...l,name:l.name.trim()});}catch(__hedsError){alert(__hedsError.message||"Le document n’a pas pu être téléversé.");}finally{__hedsBusy=false;}}'
    changes.push({ start: handler.init.start, end: handler.init.end, text: replacement })
    const firebaseImports = ast.body.filter(node => node.type === 'ImportDeclaration' && /\/firebase-[^/]+\.js$/.test(node.source.value))
    assert.equal(firebaseImports.length, 2)
    for (const imported of firebaseImports) changes.push({ start: imported.start, end: imported.end, text: '' })
    const fileInputs = nodes(ast, node => node.type === 'Property' && node.key.name === 'type' && node.value.value === 'file')
    assert.equal(fileInputs.length, 1)
    changes.push({ start: fileInputs[0].node.end, end: fileInputs[0].node.end, text: ',accept:__hedsDocumentAccept' })
    changes.push({ start: 0, end: 0, text: `import {uploadFilePhysioDocument as __hedsUploadDocument,validateDocumentUrl as __hedsValidateDocumentUrl,DOCUMENT_ACCEPT as __hedsDocumentAccept} from "./${helper}";` })
    description.push('Only upload save-handler replaced; existing render/layout kept', 'Firebase Storage imports removed', 'Supported file formats added to existing input')
  } else {
    const bulkHandlers = nodes(ast, node => node.type === 'VariableDeclarator' && node.id.name === 'G' &&
      node.init?.type === 'ArrowFunctionExpression' && code.slice(node.init.start, node.init.end).includes('window.open'))
    assert.equal(bulkHandlers.length, 1)
    changes.push({ start: bulkHandlers[0].node.init.start, end: bulkHandlers[0].node.init.end,
      text: '()=>{T.value.filter(s=>h.value.has(s.id)).forEach(__hedsOpenDocument)}' })
    const anchorProps = nodes(ast, node => node.type === 'Property' && node.key.name === 'href' &&
      node.value.type === 'MemberExpression' && node.value.property.name === 'url')
    assert.equal(anchorProps.length, 2)
    for (const { node } of anchorProps) {
      const fileVariable = node.value.object.name
      assert(['v', 'u'].includes(fileVariable))
      changes.push({ start: node.end, end: node.end, text: `,onClick:__hedsEvent=>{__hedsEvent.preventDefault();__hedsOpenDocument(${fileVariable})},onAuxclick:__hedsEvent=>{if(__hedsEvent.button===1){__hedsEvent.preventDefault();__hedsOpenDocument(${fileVariable})}}` })
    }
    const dynamicProperties = nodes(ast, node => node.type === 'VariableDeclarator' && node.init?.type === 'ArrayExpression' &&
      node.init.elements.length === 1 && node.init.elements[0].value === 'href')
    assert.equal(dynamicProperties.length, 2)
    for (const { node } of dynamicProperties) changes.push({ start: node.init.start, end: node.init.end, text: '["href","onClick","onAuxclick"]' })
    for (const node of ast.body.filter(node => node.type === 'ImportDeclaration')) {
      const dependency = node.source.value.replace(/^\.\//, '')
      if (mappings[dependency]) changes.push({ start: node.source.start, end: node.source.end, text: JSON.stringify('./' + mappings[dependency]) })
      if (/^firebase-.*\.js$/.test(dependency)) changes.push({ start: node.start, end: node.end, text: '' })
    }
    changes.push({ start: 0, end: 0, text: `import {openFilePhysioDocument as __hedsOpenDocumentRaw} from "./${helper}";const __hedsOpenDocument=__hedsFile=>__hedsOpenDocumentRaw(__hedsFile).catch(__hedsError=>alert(__hedsError.message||"Le document n’a pas pu être ouvert."));` })
    description.push('Only file anchor click/middle-click and bulk-open handlers added', 'Existing document tree/database actions, auth and layout retained', 'Add/Edit imports point to the scoped patched chunks')
  }
  const candidate = edit(code, changes)
  assert(!candidate.includes('Upload vers Firebase Storage'))
  candidates[newName] = candidate
  changesByFile[oldName] = description
  await fs.writeFile(path.join(output, newName), candidate)
}
const manifest = {
  schema: 1, generatedAt: new Date().toISOString(), environment: 'production-candidate-only',
  baselineRoot: { filename: 'index-HEDS25-votation-v4.js', sha256: known['index-HEDS25-votation-v4.js'] },
  mappings,
  expectedInputHashes: known,
  sourceServiceHashes: sourceHashes,
  helper: { filename: helper, sha256: hash(helperCode), authFetchImport: './index-Eg7w2WHW.js#g' },
  assets: Object.entries(candidates).map(([filename, code]) => ({ filename, sha256: hash(code), bytes: Buffer.byteLength(code) })),
  changesByFile,
  assembly: 'Replace only exact old mapped filenames in the existing active root bundle, including its __vite__mapDeps array; preserve all other bytes. Do not rebuild root or vendor modules.',
  deployed: false,
}
await fs.writeFile(path.join(output, 'filephysio-patch-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ output, helper, mappings, candidateAssets: Object.keys(candidates).length + 1, rootModified: false, deployed: false }, null, 2))
