import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const source = new URL('../../', import.meta.url)
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'heds-deploy-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(path.join(root, 'scripts/deployment'), { recursive: true })
  for (const name of ['deploy.mjs', 'remote.sh']) {
    fs.copyFileSync(new URL(name, import.meta.url), path.join(root, 'scripts/deployment', name))
  }
  fs.symlinkSync(new URL('node_modules', source).pathname, path.join(root, 'node_modules'))
  fs.mkdirSync(path.join(root, 'bin'))
  const log = path.join(root, 'calls')
  for (const command of ['ssh', 'scp', 'tar', 'curl', 'npm']) {
    fs.writeFileSync(path.join(root, 'bin', command), `#!/bin/sh\necho ${command} >> "$TEST_LOG"\nexit 0\n`, { mode: 0o755 })
  }
  fs.writeFileSync(path.join(root, 'bin', 'ssh'), '#!/bin/sh\necho ssh >> "$TEST_LOG"\ncase "$*" in *"bash -s --"*) cat > "$TEST_LOG.stdin";; esac\n', { mode: 0o755 })
  const env = { ...process.env, PATH: `${root}/bin:${process.env.PATH}`, TEST_LOG: log,
    VITE_SUPABASE_URL: 'https://api2.hedsvs.ch', VITE_API_BASE_URL: 'https://api2.hedsvs.ch/api',
    VITE_SUPABASE_KEY: 'sb_publishable_test' }
  delete env.VITE_SUPABASE_REST_URL
  return { root, env, calls: () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [],
    run: (mode, overrides = {}) => spawnSync(process.execPath, [`${root}/scripts/deployment/deploy.mjs`, mode], {
      env: { ...env, ...overrides }, encoding: 'utf8',
    }) }
}

test('check uses only SSH; no build, transfer or publication', t => {
  const f = fixture(t)
  assert.equal(f.run('--check').status, 0)
  assert.deepEqual(f.calls(), ['ssh'])
  assert.match(fs.readFileSync(`${f.root}/calls.stdin`, 'utf8'), /set -euo pipefail/)
})
test('local API or privileged key stops before connecting', t => {
  const f = fixture(t)
  assert.equal(f.run('--deploy', { VITE_API_BASE_URL: 'http://localhost:3000' }).status, 1)
  const key = `x.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.x`
  const result = f.run('--deploy', { VITE_SUPABASE_KEY: key })
  assert.equal(result.status, 1)
  assert.ok(!result.stderr.includes(key))
  assert.deepEqual(f.calls(), [])
})
test('remote preflight failure stops before build and transfer', t => {
  const f = fixture(t)
  fs.writeFileSync(`${f.root}/bin/ssh`, '#!/bin/sh\nexit 7\n', { mode: 0o755 })
  assert.equal(f.run('--deploy').status, 1)
  assert.deepEqual(f.calls(), [])
})
test('incomplete build never transfers artifacts', t => {
  const f = fixture(t)
  assert.equal(f.run('--deploy').status, 1)
  assert.deepEqual(f.calls(), ['ssh', 'npm'])
})
test('complete artifacts publish frontend and backend then probe public routes', t => {
  const f = fixture(t)
  for (const folder of ['dist/docs', 'dist/presentation', 'dist/assets', 'backend']) {
    fs.mkdirSync(`${f.root}/${folder}`, { recursive: true })
  }
  for (const file of ['dist/index.html', 'dist/docs/index.html', 'dist/presentation/index.html']) {
    fs.writeFileSync(`${f.root}/${file}`, '<html></html>')
  }
  fs.writeFileSync(`${f.root}/dist/assets/app.js`, 'https://api2.hedsvs.ch https://api2.hedsvs.ch/api')
  assert.equal(f.run('--deploy').status, 0)
  assert.deepEqual(f.calls(), ['ssh', 'npm', 'tar', 'tar', 'ssh', 'scp', 'ssh', 'curl', 'curl', 'curl'])
})
