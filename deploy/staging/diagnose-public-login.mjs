import fs from 'node:fs/promises'

const base = 'https://test.hedsvs.ch'
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', import.meta.url)))
const authorization = `Basic ${Buffer.from(`${gate.username}:${gate.password}`).toString('base64')}`
const response = await fetch(`${base}/home`, { headers: { authorization }, redirect: 'manual' })
const body = await response.text()
const assetPaths = [...body.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(([, value]) => value)
  .filter(value => value.startsWith('/assets/'))
  .slice(0, 5)

const assets = []
for (const path of assetPaths) {
  const assetResponse = await fetch(base + path, { headers: { authorization } })
  assets.push({ path, status: assetResponse.status, type: assetResponse.headers.get('content-type') })
}

console.log(JSON.stringify({
  status: response.status,
  location: response.headers.get('location'),
  type: response.headers.get('content-type'),
  bodyLength: body.length,
  hasAppRoot: body.includes('id="app"'),
  assets
}, null, 2))
