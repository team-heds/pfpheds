import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import * as acorn from 'acorn'

const output = new URL('../../.codex-tmp/storage-prod-candidate/', import.meta.url)
const parse = code => acorn.parse(code, { sourceType: 'module', ecmaVersion: 'latest' })
function find(ast, predicate) {
  const results = []
  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (predicate(node)) results.push(node)
    for (const value of Object.values(node)) Array.isArray(value) ? value.forEach(walk) : walk(value)
  }
  walk(ast)
  return results
}
async function handler(filename, name, context) {
  const code = await fs.readFile(new URL(filename, output), 'utf8')
  const matches = find(parse(code), node => node.type === 'VariableDeclarator' && node.id.name === name && node.init?.type === 'ArrowFunctionExpression')
  assert.equal(matches.length, 1)
  return vm.runInNewContext(`(${code.slice(matches[0].init.start, matches[0].init.end)})`, context)
}
async function helper(context) {
  let code = await fs.readFile(new URL('storageMediaService-HEDS25-storage-v1.js', output), 'utf8')
  const ast = parse(code)
  const edits = ast.body.filter(node => ['ImportDeclaration', 'ExportNamedDeclaration'].includes(node.type))
    .map(node => ({ start: node.start, end: node.type === 'ImportDeclaration' ? node.end : node.declaration.start }))
    .sort((a, b) => b.start - a.start)
  for (const edit of edits) code = code.slice(0, edit.start) + code.slice(edit.end)
  return vm.runInNewContext(code + ';({uploadFilePhysioDocument,getFilePhysioDownloadUrl,openFilePhysioDocument,uploadPfpDocument,getPfpDocumentDownloadUrl,openPfpDocument});', {
    URL, FormData, Blob, window: {}, ...context,
  })
}

test('compiled Add handler uploads through Supabase once and retains the existing save contract', async () => {
  const emitted = []
  let resolveUpload
  let calls = 0
  const context = {
    __hedsBusy: false,
    o: { value: { name: '  Nouveau PDF  ', url: '' } },
    s: { value: false }, a: { value: { name: 'new.pdf' } },
    __hedsUploadDocument: async () => { calls++; return new Promise(resolve => { resolveUpload = resolve }) },
    __hedsValidateDocumentUrl: value => value,
    u: (...args) => emitted.push(args),
    crypto: { randomUUID: () => 'new-id' },
    alert: () => assert.fail('Unexpected alert'),
  }
  const save = await handler('AddFileDocPFP-HEDS25-storage-v1.js', 'g', context)
  const pending = save()
  await save()
  assert.equal(calls, 1)
  resolveUpload({ url: 'https://api2.hedsvs.ch/storage/v1/object/authenticated/file-physio/document.pdf' })
  await pending
  assert.equal(emitted.length, 1)
  assert.deepEqual(JSON.parse(JSON.stringify(emitted[0])), ['save', { id: 'new-id', name: 'Nouveau PDF', url: 'https://api2.hedsvs.ch/storage/v1/object/authenticated/file-physio/document.pdf' }])
})

test('compiled Edit handler preserves id and replaces only the uploaded URL', async () => {
  const emitted = []
  const save = await handler('EditFileDocPFP-HEDS25-storage-v1.js', 'P', {
    __hedsBusy: false, l: { id: 'existing-id', name: 'Document', url: 'https://old.invalid/file.pdf' },
    a: { value: { name: 'replacement.pdf' } },
    __hedsUploadDocument: async () => ({ url: 'https://api2.hedsvs.ch/new.pdf' }),
    __hedsValidateDocumentUrl: () => assert.fail('Should use the uploaded URL'),
    s: (...args) => emitted.push(args), alert: () => assert.fail('Unexpected alert'),
  })
  await save()
  assert.deepEqual(JSON.parse(JSON.stringify(emitted[0])), ['save', { id: 'existing-id', name: 'Document', url: 'https://api2.hedsvs.ch/new.pdf' }])
})

test('compiled Document anchors and selection use signed opening while preserving hrefs', async () => {
  const code = await fs.readFile(new URL('DocumentsView-HEDS25-storage-v1.js', output), 'utf8')
  const ast = parse(code)
  const anchors = find(ast, node => node.type === 'ObjectExpression' && node.properties.some(property => property.key?.name === 'href'))
  assert.equal(anchors.length, 2)
  let opened = 0, prevented = 0
  for (const anchor of anchors) {
    assert(anchor.properties.some(property => property.key?.name === 'href' && property.value.property.name === 'url'))
    for (const eventName of ['onClick', 'onAuxclick']) {
      const property = anchor.properties.find(property => property.key?.name === eventName)
      assert(property)
      const click = vm.runInNewContext(`(${code.slice(property.value.start, property.value.end)})`, {
        v: { id: 'v' }, u: { id: 'u' }, __hedsOpenDocument: () => opened++,
      })
      click({ button: eventName === 'onAuxclick' ? 1 : 0, preventDefault: () => prevented++ })
    }
  }
  assert.equal(opened, 4)
  assert.equal(prevented, 4)
  const selected = []
  const bulk = await handler('DocumentsView-HEDS25-storage-v1.js', 'G', {
    T: { value: [{ id: 'a' }, { id: 'b' }] }, h: { value: new Set(['b']) }, __hedsOpenDocument: file => selected.push(file.id),
  })
  bulk()
  assert.deepEqual(selected, ['b'])
})

test('standalone helper uses the production API and signs at click for both document families', async () => {
  const requests = []
  const service = await helper({ authFetch: async (url, options) => {
    requests.push({ url, options })
    return { ok: true, json: async () => ({ url: 'https://api2.hedsvs.ch/storage/v1/object/sign/file-physio/form.pdf?token=temporary' }) }
  } })
  await service.getFilePhysioDownloadUrl({ id: 'file/id', url: 'https://api2.hedsvs.ch/storage/v1/object/authenticated/file-physio/documents/form.pdf' })
  assert.equal(requests[0].url, 'https://api2.hedsvs.ch/api/filePhysio/files/file%2Fid/download')
  assert.equal(requests[0].options.method, 'POST')
  await service.getPfpDocumentDownloadUrl('https://api2.hedsvs.ch/storage/v1/object/authenticated/pfp-documents/places/place/file.pdf')
  assert(requests[1].url.startsWith('https://api2.hedsvs.ch/api/institutions/documents/download?url='))
  const tabs = []
  const window = { open: () => {
    const tab = { opener: true, location: {}, close: () => assert.fail('Unexpected closed tab') }
    tabs.push(tab)
    return tab
  } }
  await service.openFilePhysioDocument({ id: 'file1', url: 'https://api2.hedsvs.ch/storage/v1/object/authenticated/file-physio/form.pdf' }, window)
  await service.openPfpDocument('https://api2.hedsvs.ch/storage/v1/object/authenticated/pfp-documents/places/place/file.pdf', window)
  assert.equal(tabs.length, 2)
  assert(tabs.every(tab => tab.opener === null && tab.location.href.includes('/object/sign/')))
})
