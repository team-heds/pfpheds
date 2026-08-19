import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const readSource = (relativePath) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8')

describe('platform delivery reliability contract', () => {
  it('never caches backend, auth or self-hosted Supabase requests', () => {
    const worker = readSource('src/sw.js')

    expect(worker).toContain("'/api/'")
    expect(worker).toContain("'/auth/v1/'")
    expect(worker).toContain("'/rest/v1/'")
    expect(worker).toContain("url.hostname === 'api2.hedsvs.ch'")
    expect(worker).toContain('new NetworkOnly()')
    expect(worker).not.toContain("cacheName: 'supabase-api'")
  })

  it('limits runtime caching to navigations instead of application bundles', () => {
    const worker = readSource('src/sw.js')
    const main = readSource('src/main.js')

    expect(worker).toContain("request.mode === 'navigate'")
    expect(worker).toContain("cacheName: 'navigation-pages'")
    expect(worker).not.toContain("cacheName: 'static-resources'")
    expect(main).not.toContain("navigator.serviceWorker.register('/sw.js')")
    expect(main).not.toContain("from 'firebase/auth'")
    expect(main).not.toContain("from '@/firebase'")
  })

  it('revalidates deployment entry points while keeping hashed assets immutable', () => {
    const nginx = readSource('deploy/nginx.frontend.prod.conf')

    expect(nginx).toContain('location = /index.html')
    expect(nginx).toContain('location = /sw.js')
    expect(nginx).toContain('no-store, no-cache, must-revalidate')
    expect(nginx).toContain('^/assets/.*\\.(js|css|woff|woff2|ttf|eot)')
    expect(nginx).toContain('max-age=31536000, immutable')
  })

  it('preserves production errors needed to diagnose incidents', () => {
    const vite = readSource('vite.config.js')

    expect(vite).toContain("drop: process.env.NODE_ENV === 'production' ? ['debugger'] : []")
    expect(vite).toContain("pure: process.env.NODE_ENV === 'production' ? ['console.debug'] : []")
    expect(vite).not.toContain("['console', 'debugger']")
  })
})
