// Generate narrowly scoped, versioned media chunks from the exact live graph.
// This only reads production; every output is a local candidate for review.
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { parse } from 'acorn'
import MagicString from 'magic-string'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { createRenderer, createVNode } from '@vue/runtime-core'

const root = process.cwd()
const baselineDir = path.join(root, '.codex-tmp/storage-prod-institutions-baseline')
const candidateDir = path.join(root, '.codex-tmp/storage-prod-institutions-candidate')
const shared = './storageMediaService-HEDS25-storage-v1.js'
const fallback = '/assets/institution-placeholder-HEDS25-storage-v1.svg'
const files = {
  list: 'Institution-DUZMgrbd.js',
  detail: 'InstitutionView-DuwZiSnv.js',
  form: 'InstitutionFormModif-D7HIBn4j.js',
  places: 'PlacesViewPHYFP-18sEtdrV.js',
  create: 'CreatePlaceDialog-CEoJRrGx.js'
}
await fs.mkdir(baselineDir, { recursive: true })
await fs.mkdir(path.join(candidateDir, 'assets'), { recursive: true })

function walk(node, visitor, parent) {
  if (!node || typeof node !== 'object') return
  if (node.type) visitor(node, parent)
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visitor, node))
    else if (value?.type) walk(value, visitor, node)
  }
}
const checksum = value => createHash('sha256').update(value).digest('hex')
const ast = value => parse(value, { ecmaVersion: 'latest', sourceType: 'module' })
const compiled = new Map()
const report = { generatedAt: new Date().toISOString(), scope: 'institution/place media only', files: [], mappings: {}, behaviorTests: [] }
for (const [kind, file] of Object.entries(files)) {
  const source = execFileSync('ssh', ['heds-vps', `docker exec supabase-caddy-1 cat /var/www/pfpheds-frontend/assets/${file}`], { encoding: 'utf8' })
  await fs.writeFile(path.join(baselineDir, file), source)
  const tree = ast(source)
  const edit = new MagicString(source)
  const changes = []
  const nodes = predicate => {
    const matches = []
    walk(tree, (node, parent) => { if (predicate(node, parent)) matches.push(node) })
    return matches
  }
  const one = (label, predicate) => {
    const matches = nodes(predicate)
    assert.equal(matches.length, 1, `${file}: ${label} must have one exact AST target`)
    return matches[0]
  }
  const text = node => source.slice(node.start, node.end)
  const replace = (label, node, value) => { edit.overwrite(node.start, node.end, value); changes.push(label) }
  const addProp = (node, value) => edit.appendLeft(node.end - 1, `,${value}`)
  const dynamicProps = (label, props, required) => {
    const call = one(`${label} render call`, n => n.type === 'CallExpression' && n.arguments[1] === props)
    const argument = call.arguments[4]
    assert.ok(argument, `${file}: ${label} must declare dynamic props`)
    const declaration = argument.type === 'Identifier'
      ? one(`${label} dynamic props declaration`, n => n.type === 'VariableDeclarator' && n.id?.name === argument.name && n.init?.type === 'ArrayExpression').init
      : argument
    assert.equal(declaration.type, 'ArrayExpression')
    const existing = declaration.elements.map(entry => entry.value)
    replace(`${label} updates event closures when the row changes`, declaration, JSON.stringify([...new Set([...existing, ...required])]))
  }
  if (kind !== 'list') {
    assert.ok(!source.includes('__hedsUploadPfpDocument'))
    edit.prepend(`import{uploadPfpDocument as __hedsUploadPfpDocument,openPfpDocument as __hedsOpenPfpDocument}from${JSON.stringify(shared)};\n`)
  }
  if (kind === 'list') {
    const imageMethod = one('institution image method', n => n.type === 'Property' && n.key?.name === 'getInstitutionImage' && n.method)
    assert.equal(text(imageMethod.value.params[0]), 't')
    replace('local placeholder instead of external stock image', imageMethod.value.body, `{return Array.isArray(t.ImageURL)&&t.ImageURL[0]?t.ImageURL[0]:${JSON.stringify(fallback)}}`)
    const props = one('card image props', n => n.type === 'ObjectExpression' && text(n).includes('src:n.getInstitutionImage(s)') && text(n).length < 250)
    addProp(props, `onError:__hedsEvent=>{const image=__hedsEvent.currentTarget;image.alt=\`Photo indisponible pour \${s.Name}\`;if(!image.src.endsWith(${JSON.stringify(fallback)}))image.src=${JSON.stringify(fallback)}}`)
    dynamicProps('institution image', props, ['onError'])
    changes.push('broken image uses local accessible placeholder')
  }
  if (kind === 'form') {
    const pdfUpload = one('institution PDF upload', n => n.type === 'IfStatement' && text(n).includes('cyberlearn.pdf') && text(n).length < 350)
    assert.ok(text(pdfUpload).startsWith('if(y.value)'))
    replace('institution PDF upload through Supabase', pdfUpload, `if(y.value){const uploaded=await __hedsUploadPfpDocument('institutions',p,y.value);o.value.CyberleanURL=uploaded.url}`)
    const legacyDelete = one('legacy Firebase delete', n => n.type === 'IfStatement' && text(n).includes('firebasestorage.googleapis.com') && text(n).length < 1000)
    replace('preserve original Firebase objects when removing references', legacyDelete, '')
    const link = one('institution PDF link', n => n.type === 'ObjectExpression' && text(n) === '{href:o.value.CyberleanURL,target:"_blank"}')
    const open = `__hedsEvent.preventDefault();__hedsOpenPfpDocument(o.value.CyberleanURL).catch(error=>c.add({severity:'error',summary:'Document indisponible',detail:error.message,life:4000}))`
    addProp(link, `rel:'noopener noreferrer',onClick:__hedsEvent=>{${open}},onAuxclick:__hedsEvent=>{if(__hedsEvent.button===1){${open}}}`)
    dynamicProps('institution form PDF', link, ['onClick', 'onAuxclick'])
    changes.push('institution PDF reader uses a short signed URL')
  }
  if (kind === 'detail') {
    const handler = one('institution document click handler', n => n.type === 'FunctionDeclaration' && n.id?.name === 'Y' && text(n).includes('Clic sur fichier:'))
    replace('open institution or place PDF via signature', handler, `async function Y(t){try{await __hedsOpenPfpDocument(t.url)}catch(error){window.alert(error.message)}}`)
    const link = one('institution file link', n => n.type === 'ObjectExpression' && text(n).includes('class:"iv-file",onClick:') && text(n).length < 220)
    const click = link.properties.find(p => p.key?.name === 'onClick')
    assert.equal(text(click.value), 'B=>Y(u)')
    replace('prevent direct browser navigation to private path', click.value, 'B=>{B.preventDefault();Y(u)}')
    addProp(link, `rel:'noopener noreferrer',onAuxclick:B=>{if(B.button===1){B.preventDefault();Y(u)}}`)
    dynamicProps('institution detail PDF', link, ['onClick', 'onAuxclick'])
    const fetchPlaces = one('institution places list', n => n.type === 'VariableDeclarator' && n.id?.name === 'i' && n.init?.type === 'AwaitExpression' && text(n.init).includes('J.fetchPlacesByInstitution(t)'))
    replace('handle institution without places', fetchPlaces.init, '(await J.fetchPlacesByInstitution(t))||[]')
    const noPlaces = one('empty places early return', n => n.type === 'IfStatement' && text(n).includes('Aucune place trouvée pour l\'institution') && text(n).length < 280)
    replace('keep global concept visible without places', noPlaces, '')
    const loop = one('document collection loop', n => n.type === 'ForOfStatement' && text(n).includes('Document sans nom'))
    edit.appendRight(loop.end, `if(d&&!b.has(d.trim()))b.set(d.trim(),{name:'Concept de formation pratique',url:d.trim(),isGlobal:true});`)
    changes.push('include global institution concept even when places have specific PDFs')
  }
  if (kind === 'places') {
    const upload = one('place PDF upload function', n => n.type === 'FunctionDeclaration' && n.id?.name === 'nl' && text(n).includes('Upload vers Firebase Storage'))
    replace('place PDF upload with preserved update and UI states', upload.body, `{if(!D.value||!M.value?.PlaceId)return;he.value=true;try{const uploaded=await __hedsUploadPfpDocument('places',M.value.PlaceId,D.value);const updated=await f.updatePlace(M.value.PlaceId,{fileurl:uploaded.url,filename:D.value.name});if(updated)Object.assign(M.value,updated);await f.fetchPlaces();v.add({severity:'success',summary:'Succès',detail:'Document uploadé avec succès !',life:3000});te.value=false;D.value=null;M.value=null}catch(error){v.add({severity:'error',summary:'Upload impossible',detail:error.message||'Le document n’a pas pu être téléversé.',life:5000})}finally{he.value=false}}`)
    const link = one('place PDF link', n => n.type === 'ObjectExpression' && text(n) === '{key:0,href:t.fileurl||t.fileURL,target:"_blank",class:"text-primary"}')
    const open = `__hedsEvent.preventDefault();__hedsOpenPfpDocument(t.fileurl||t.fileURL).catch(error=>v.add({severity:'error',summary:'Document indisponible',detail:error.message,life:4000}))`
    addProp(link, `rel:'noopener noreferrer',onClick:__hedsEvent=>{${open}},onAuxclick:__hedsEvent=>{if(__hedsEvent.button===1){${open}}}`)
    dynamicProps('place PDF', link, ['onClick', 'onAuxclick'])
    changes.push('place PDF reader uses a short signed URL')
    const pdfFilter = one('PDF-only filter', n => n.type === 'LogicalExpression' && text(n) === 'r.fileURL||r.FileURL||r.pdfUrl||r.PdfUrl||r.fileUrl')
    replace('PDF-only filter recognizes canonical fileurl field', pdfFilter, 'r.fileurl||r.fileURL||r.FileURL||r.pdfUrl||r.PdfUrl||r.fileUrl')
  }
  if (kind === 'create') {
    const generateId = one('place ID generator', n => n.type === 'FunctionDeclaration' && n.id?.name === 'J' && text(n).includes('Date.now().toString(36)'))
    edit.appendRight(generateId.end, 'let __hedsPendingPlaceId=J(),__hedsUploadedPdfName="";')
    changes.push('share one PlaceId between uploaded path and created row')
    const upload = one('new place PDF upload function', n => n.type === 'FunctionDeclaration' && n.id?.name === 'K' && text(n).includes('Upload vers Firebase Storage'))
    replace('new place upload via private Supabase bucket', upload.body, `{if(!d.value)return false;h.value=true;try{const uploaded=await __hedsUploadPfpDocument('places',__hedsPendingPlaceId,d.value);l.value.fileURL=uploaded.url;__hedsUploadedPdfName=uploaded.name;alert('✅ Fichier uploadé avec succès !');$();return true}catch(error){alert('Erreur lors du téléversement du fichier : '+error.message);return false}finally{h.value=false}}`)
    const placeId = one('created row PlaceId', n => n.type === 'Property' && n.key?.name === 'PlaceId' && text(n.value) === 'J()')
    replace('persist the same PlaceId used by Storage', placeId.value, '__hedsPendingPlaceId')
    const filename = one('uploaded PDF original filename', n => n.type === 'Property' && n.key?.name === 'filename' && text(n.value).includes('d.value'))
    replace('retain original PDF filename after clearing selection', filename.value, `__hedsUploadedPdfName||${text(filename.value)}`)
    const uploadBeforeCreate = one('automatic upload awaiting', n => n.type === 'AwaitExpression' && text(n) === 'await K()')
    replace('abort create if automatic PDF upload failed', uploadBeforeCreate, `await(async()=>{if(!await K())throw new Error('Le document n’a pas été téléversé. La place n’a pas été créée.')})()`)
    const close = one('create modal reset function', n => n.type === 'FunctionDeclaration' && n.id?.name === 'G' && text(n).includes('B.value=!1,E.value=!1,$()'))
    edit.appendLeft(close.body.start + 1, '__hedsPendingPlaceId=J();__hedsUploadedPdfName="";')
    changes.push('reset pending document state between new places')
  }
  const outputName = file.replace(/-[A-Za-z0-9_-]+\.js$/, '-HEDS25-storage-v1.js')
  const output = edit.toString()
  ast(output)
  compiled.set(kind, output)
  await fs.writeFile(path.join(candidateDir, 'assets', outputName), output)
  report.mappings[file] = outputName
  report.files.push({ original: file, candidate: outputName, beforeSha256: checksum(source), afterSha256: checksum(output), changes })
}

// Wire only the new CreatePlaceDialog into the new PlacesView. Every remaining
// dependency keeps the exact production filename, export names and runtime.
const newPlaces = report.mappings[files.places]
const placesPath = path.join(candidateDir, 'assets', newPlaces)
const placesText = await fs.readFile(placesPath, 'utf8')
assert.equal(placesText.split(`./${files.create}`).length - 1, 1)
const linkedPlaces = placesText.replace(`./${files.create}`, `./${report.mappings[files.create]}`)
ast(linkedPlaces)
await fs.writeFile(placesPath, linkedPlaces)
compiled.set('places', linkedPlaces)
report.files.find(entry => entry.original === files.places).afterSha256 = checksum(linkedPlaces)

// Pure behavior checks execute only extracted patched function bodies with
// controlled mocks; no application bootstrap, network request or DB write.
function extract(kind, predicate) {
  const source = compiled.get(kind)
  const matches = []
  walk(ast(source), node => { if (predicate(node, source)) matches.push(node) })
  assert.equal(matches.length, 1)
  return source.slice(matches[0].start, matches[0].end)
}
const reference = value => ({ value })
const uploadCalls = []
const updates = []
const context = {
  __hedsUploadPfpDocument: async (...args) => { uploadCalls.push(args); return { url: 'https://api2.hedsvs.ch/private.pdf', name: 'concept.pdf' } },
  D: reference({ name: 'concept.pdf' }), M: reference({ PlaceId: 'place-1' }), he: reference(false), te: reference(true),
  f: { updatePlace: async (...args) => { updates.push(args); return { fileurl: args[1].fileurl } }, fetchPlaces: async () => {} },
  v: { add() {} }
}
await vm.runInNewContext(`(${extract('places', n => n.type === 'FunctionDeclaration' && n.id?.name === 'nl')})()`, context)
assert.equal(uploadCalls[0][0], 'places')
assert.equal(uploadCalls[0][1], 'place-1')
assert.equal(updates[0][1].fileurl, 'https://api2.hedsvs.ch/private.pdf')
assert.equal(context.he.value, false)
assert.equal(context.M.value, null)
report.behaviorTests.push('place upload sends the current PlaceId and persists URL; loading and dialog states restore')

const createContext = {
  d: reference({ name: 'concept.pdf' }), h: reference(false), l: reference({}),
  __hedsPendingPlaceId: 'place-new', __hedsUploadedPdfName: '',
  __hedsUploadPfpDocument: async (kind, id) => { assert.equal(kind, 'places'); assert.equal(id, 'place-new'); return { url: 'https://api2.hedsvs.ch/private.pdf', name: 'concept.pdf' } },
  alert() {}, $() {}
}
assert.equal(await vm.runInNewContext(`(${extract('create', n => n.type === 'FunctionDeclaration' && n.id?.name === 'K')})()`, createContext), true)
assert.equal(createContext.l.value.fileURL, 'https://api2.hedsvs.ch/private.pdf')
assert.equal(createContext.__hedsUploadedPdfName, 'concept.pdf')
assert.equal(createContext.h.value, false)
const failureContext = { ...createContext, d: reference({ name: 'concept.pdf' }), __hedsUploadPfpDocument: async () => { throw new Error('Storage unavailable') } }
assert.equal(await vm.runInNewContext(`(${extract('create', n => n.type === 'FunctionDeclaration' && n.id?.name === 'K')})()`, failureContext), false)
assert.equal(failureContext.h.value, false)
report.behaviorTests.push('new place upload reuses pending ID, retains filename, and returns failure without creating place')

const creationCalls = []
const newPlaceContext = {
  E: reference(false), L: reference(false), d: reference(null),
  l: reference({ NomPlace: 'Descriptif', InstitutionId: 'inst-1', fileURL: 'https://api2.hedsvs.ch/private.pdf', pfpValues2025: {}, pfpValues2026: {}, pfpValues2027: {} }),
  r: { institutions: [{ InstitutionId: 'inst-1' }] },
  b: { createPlace: async row => { creationCalls.push(['create', row]); return row }, updatePlace: async (...args) => creationCalls.push(['update', ...args]), fetchPlaceById: async () => {} },
  __hedsPendingPlaceId: 'place-new', __hedsUploadedPdfName: 'concept.pdf',
  J() { throw new Error('Must not generate a different PlaceId') },
  alert() {}, G() {}, A: async () => {}, g() {}, K: async () => false,
  setTimeout(callback) { callback() }, console: { log() {}, error() {} }
}
const createFunction = extract('create', n => n.type === 'FunctionDeclaration' && n.id?.name === 'ae' && n.async)
await vm.runInNewContext(`(${createFunction})()`, newPlaceContext)
assert.equal(creationCalls[0][1].PlaceId, 'place-new')
assert.equal(creationCalls[1][1], 'place-new')
assert.equal(creationCalls[1][2].filename, 'concept.pdf')
assert.equal(newPlaceContext.L.value, false)
const noCreateCalls = []
const failedCreation = { ...newPlaceContext,
  l: reference({ NomPlace: 'Descriptif', InstitutionId: 'inst-1', fileURL: '' }), d: reference({ name: 'concept.pdf' }),
  b: { createPlace: async row => noCreateCalls.push(row) }
}
await vm.runInNewContext(`(${createFunction})()`, failedCreation)
assert.equal(noCreateCalls.length, 0)
assert.equal(failedCreation.L.value, false)
report.behaviorTests.push('created PlaceId and persisted PDF filename match upload; failed automatic upload aborts row creation')

const readerCalls = []
const readerContext = { __hedsOpenPfpDocument: async value => readerCalls.push(value), window: { alert() { throw new Error('unexpected alert') } } }
await vm.runInNewContext(`(${extract('detail', n => n.type === 'FunctionDeclaration' && n.id?.name === 'Y')})({url:'https://api2.hedsvs.ch/private.pdf'})`, readerContext)
assert.deepEqual(readerCalls, ['https://api2.hedsvs.ch/private.pdf'])
report.behaviorTests.push('institution document reader delegates to signed document helper')

const institutionUpload = extract('form', (node, source) => node.type === 'IfStatement' && source.slice(node.start, node.end).startsWith("if(y.value){const uploaded=await __hedsUploadPfpDocument("))
const institutionContext = { y: reference({ name: 'concept.pdf' }), p: 'inst-1', o: reference({}),
  __hedsUploadPfpDocument: async (kind, id) => { assert.equal(kind, 'institutions'); assert.equal(id, 'inst-1'); return { url: 'https://api2.hedsvs.ch/private-institution.pdf' } }
}
await vm.runInNewContext(`(async()=>{${institutionUpload}})()`, institutionContext)
assert.equal(institutionContext.o.value.CyberleanURL, 'https://api2.hedsvs.ch/private-institution.pdf')
report.behaviorTests.push('institution PDF handler persists the URL returned for the current InstitutionId')

const imageHandler = extract('list', (node, source) => node.type === 'ArrowFunctionExpression' && source.slice(node.start, node.end).includes('image.src.endsWith(') && source.slice(node.start, node.end).length < 500)
const image = { alt: '' }
let imageSource = 'broken', imageSourceAssignments = 0
Object.defineProperty(image, 'src', { get: () => imageSource, set: value => { imageSource = value; imageSourceAssignments++ } })
vm.runInNewContext(`(${imageHandler})({currentTarget:image})`, { image, s: { Name: 'Institution test' } })
assert.equal(image.src, fallback)
assert.equal(image.alt, 'Photo indisponible pour Institution test')
vm.runInNewContext(`(${imageHandler})({currentTarget:image})`, { image, s: { Name: 'Institution test' } })
assert.equal(imageSourceAssignments, 1)
report.behaviorTests.push('broken institution image uses local placeholder and does not reassign an already failed fallback')

for (const [kind, marker] of [['form', 'o.value.CyberleanURL'], ['detail', 'class:"iv-file"'], ['places', 't.fileurl||t.fileURL']]) {
  const source = compiled.get(kind)
  const tree = ast(source)
  let propsNode
  walk(tree, node => {
    if (node.type === 'ObjectExpression' && node.properties.some(p => p.key?.name === 'onAuxclick') && source.slice(node.start, node.end).includes(marker)) {
      assert.equal(propsNode, undefined)
      propsNode = node
    }
  })
  assert.ok(propsNode)
  let call
  walk(tree, node => { if (node.type === 'CallExpression' && node.arguments[1] === propsNode) call = node })
  assert.ok(call)
  let dynamicArray = call.arguments[4]
  if (dynamicArray.type === 'Identifier') {
    const name = dynamicArray.name
    walk(tree, node => { if (node.type === 'VariableDeclarator' && node.id?.name === name && node.init?.type === 'ArrayExpression') dynamicArray = node.init })
  }
  assert.equal(dynamicArray.type, 'ArrayExpression')
  for (const key of ['href', 'onClick', 'onAuxclick']) assert.ok(dynamicArray.elements.some(node => node.value === key), `${kind}: dynamic ${key}`)
}
// Exercise Vue's real PATCH_FLAG.PROPS update with two replacement row objects
// and the exact props/closure expressions emitted in the patched places chunk.
{
  const source = compiled.get('places')
  let propsNode
  walk(ast(source), node => { if (node.type === 'ObjectExpression' && node.properties.some(p => p.key?.name === 'onAuxclick') && source.slice(node.start, node.end).includes('t.fileurl||t.fileURL')) propsNode = node })
  const clicks = []
  const getProps = row => vm.runInNewContext(`(${source.slice(propsNode.start, propsNode.end)})`, {
    t: row, __hedsOpenPfpDocument: async url => clicks.push(url), v: { add() { throw new Error('unexpected open failure') } }
  })
  const renderer = createRenderer({
    createElement: tag => ({ tag, props: {}, children: [] }),
    insert: (element, parent) => parent.children.push(element),
    remove() {}, setElementText() {}, parentNode() {}, nextSibling() {},
    createText: text => ({ text }), createComment: text => ({ text }), setText() {},
    patchProp: (element, key, _previous, next) => { element.props[key] = next }
  })
  const container = { children: [] }
  const dynamic = ['href', 'onClick', 'onAuxclick']
  renderer.render(createVNode('a', getProps({ fileurl: 'https://api2.hedsvs.ch/old.pdf' }), null, 8, dynamic), container)
  renderer.render(createVNode('a', getProps({ fileurl: 'https://api2.hedsvs.ch/new.pdf' }), null, 8, dynamic), container)
  const event = { button: 0, preventDefault() {} }
  container.children[0].props.onClick(event)
  container.children[0].props.onAuxclick({ ...event, button: 1 })
  container.children[0].props.onAuxclick({ ...event, button: 2 })
  assert.deepEqual(clicks, ['https://api2.hedsvs.ch/new.pdf', 'https://api2.hedsvs.ch/new.pdf'])
}
report.behaviorTests.push('all PDF links update click and middle-click closures; real Vue row replacement opens the new PDF for both buttons')

const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="416" viewBox="0 0 640 416"><rect width="640" height="416" fill="#0b213f"/><g fill="none" stroke="#f3c300" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M252 270V126h136v144M236 270h168M276 152h16m28 0h16m28 0h0M276 184h16m28 0h16m28 0h0M276 216h16m28 0h16m28 0h0M304 270v-30h32v30"/></g><text x="320" y="328" text-anchor="middle" fill="#b5c3d3" font-family="system-ui,sans-serif" font-size="22">Photo indisponible</text></svg>`
await fs.writeFile(path.join(candidateDir, 'assets', path.basename(fallback)), placeholder)
await fs.writeFile(path.join(candidateDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ candidateDir, baselineDir, mappings: report.mappings, behaviorTests: report.behaviorTests }, null, 2))
