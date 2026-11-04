import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const report = JSON.parse(await fs.readFile('.codex-tmp/storage-prod-release/release-report.json', 'utf8'))
const sha = data => createHash('sha256').update(data).digest('hex')
async function verify(url, expected, type) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) })
  assert.equal(response.status, 200, `Unexpected status: ${new URL(url).pathname}`)
  if (type) assert(response.headers.get('content-type')?.includes(type))
  assert.equal(sha(Buffer.from(await response.arrayBuffer())), expected, `Published checksum mismatch: ${new URL(url).pathname}`)
}
await Promise.all([
  verify('https://www.hedsvs.ch/documents_pfp', report.publishedIndex, 'text/html'),
  verify('https://hedsvs.ch/institution', report.publishedIndex, 'text/html'),
  verify('https://www.hedsvs.ch/sw.js', report.publishedWorker, 'javascript'),
  ...report.assets.map(file => verify(`https://www.hedsvs.ch/assets/${file.filename}`, file.sha256, file.filename.endsWith('.svg') ? 'image/svg+xml' : 'javascript')),
])
assert.equal((await fetch('https://api2.hedsvs.ch/api/ping', { signal: AbortSignal.timeout(10000) })).status, 200)
console.log(JSON.stringify({ productionFrontendVerified: true, mediaAssets: report.assets.length, productionOrigins: ['hedsvs.ch', 'www.hedsvs.ch'], serviceWorkerVerified: true, productionApiHealthy: true, votingCodePreserved: report.rootInverseComparisonExact }, null, 2))
