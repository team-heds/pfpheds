import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PRECACHE_BUDGET_BYTES,
  collectShellFiles,
  selectShellEntries,
} from '../../scripts/pwa/shellPrecache.mjs'
import { cacheableAssetResponse, isBuildAsset } from '@/utils/assetCache'
import { handleChunkLoadFailure, startupOffline } from '@/service/startupConnectivity'

const chunk = (fileName, imports = [], extra = {}) => ({
  type: 'chunk',
  fileName,
  imports,
  isEntry: false,
  viteMetadata: { importedCss: new Set() },
  ...extra,
})

describe('précache de la coque', () => {
  const bundle = {
    'assets/index.js': chunk('assets/index.js', ['assets/vendor.js'], {
      isEntry: true,
      viteMetadata: { importedCss: new Set(['assets/index.css']) },
    }),
    'assets/vendor.js': chunk('assets/vendor.js'),
    'assets/exceljs.js': chunk('assets/exceljs.js'),
    'assets/three.js': chunk('assets/three.js'),
    'index.html': { type: 'asset', source: '<link rel="stylesheet" href="/assets/theme.css">' },
  }

  it('garde le démarrage et exclut les outils lourds', () => {
    const files = collectShellFiles(bundle)
    expect([...files]).toEqual(expect.arrayContaining([
      'index.html',
      'assets/index.js',
      'assets/vendor.js',
      'assets/index.css',
      'assets/theme.css',
    ]))
    expect(files.has('assets/exceljs.js')).toBe(false)
    expect(files.has('assets/three.js')).toBe(false)
  })

  it('filtre le manifeste et conserve les polices', () => {
    const entries = ['index.html', 'assets/index.js', 'assets/jspdf.js', 'assets/icons.woff2']
      .map((url) => ({ url, size: 10 }))
    const { manifest, warnings } = selectShellEntries(entries, new Set(['index.html', 'assets/index.js']))
    expect(manifest.map((entry) => entry.url)).toEqual(['index.html', 'assets/index.js', 'assets/icons.woff2'])
    expect(warnings).toEqual([])
  })

  it('signale un dépassement du budget', () => {
    const { warnings } = selectShellEntries(
      [{ url: 'index.html', size: PRECACHE_BUDGET_BYTES + 1 }],
      new Set(['index.html']),
    )
    expect(warnings).toHaveLength(1)
  })

  it('refuse un précache vide', () => {
    expect(() => selectShellEntries([], new Set())).toThrow('coque')
  })
})

describe('cache des écrans visités', () => {
  const origin = 'https://app.example.test'

  it('ne vise que les fichiers versionnés du site', () => {
    expect(isBuildAsset(new URL(`${origin}/assets/page-a1.js`), origin)).toBe(true)
    expect(isBuildAsset(new URL(`${origin}/rest/v1/posts`), origin)).toBe(false)
    expect(isBuildAsset(new URL('https://cdn.example.test/assets/page.js'), origin)).toBe(false)
  })

  it('ne garde jamais une page HTML à la place d’un fichier', () => {
    const asset = new Response('x', { headers: { 'content-type': 'text/javascript' } })
    const html = new Response('<html>', { headers: { 'content-type': 'text/html' } })
    expect(cacheableAssetResponse(asset)).toBe(asset)
    expect(cacheableAssetResponse(html)).toBeNull()
    expect(cacheableAssetResponse(new Response('x', { status: 404 }))).toBeNull()
  })
})

describe('écran non disponible hors ligne', () => {
  const failure = new TypeError('Failed to fetch dynamically imported module: /assets/page.js')

  afterEach(() => { startupOffline.value = false })

  it('affiche l’écran hors ligne sans réseau', async () => {
    await expect(handleChunkLoadFailure(failure, { probe: vi.fn(async () => false) })).resolves.toBe(true)
    expect(startupOffline.value).toBe(true)
  })

  it('ne l’affiche pas quand le site répond', async () => {
    await expect(handleChunkLoadFailure(failure, { probe: vi.fn(async () => true) })).resolves.toBe(false)
    expect(startupOffline.value).toBe(false)
  })

  it('ignore une erreur sans rapport', async () => {
    const probe = vi.fn()
    await expect(handleChunkLoadFailure(new Error('JWT expired'), { probe })).resolves.toBe(false)
    expect(probe).not.toHaveBeenCalled()
  })
})
