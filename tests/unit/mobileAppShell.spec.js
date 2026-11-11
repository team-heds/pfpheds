import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import appRoutes from '@/router/routes/apps'
import {
  isIosDevice,
  isStandaloneDisplay,
  markInstallPromptDismissed,
  wasInstallPromptDismissed,
} from '@/utils/pwaInstall'

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8')

function memoryStorage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}

describe('socle de l’application mobile', () => {
  it('chaque destination de la barre du bas correspond à une page existante', () => {
    const nav = readSource('src/components/common/utils/MobileBottomNav.vue')
    const declared = [...nav.matchAll(/to: '(\/[a-z-]+)'/g)].map(match => match[1])
    const appPaths = new Set(appRoutes.map(route => route.path))

    expect(declared).toContain('/mobile-search')
    expect(appPaths.has('/mobile-search')).toBe(true)
    expect(appPaths.has('/mobile-outils')).toBe(true)
  })

  it('déclare les balises et les icônes nécessaires à l’installation', () => {
    const html = readSource('index.html')
    const config = readSource('vite.config.js')

    expect(html).toContain('viewport-fit=cover')
    expect(html).toContain('name="theme-color"')
    expect(html).toContain('rel="apple-touch-icon"')
    for (const icon of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) {
      expect(readFileSync(join(process.cwd(), 'public/icons', icon)).length).toBeGreaterThan(1000)
    }
    expect(config).toContain("purpose: 'maskable'")
    expect(config).toContain("lang: 'fr'")
  })

  it('ne dimensionne plus les publications sur la largeur de la fenêtre', () => {
    const post = readSource('src/components/social/library/PostItem.vue')
    expect(post).not.toContain('width: 96vw')
  })
})

describe('invitation d’installation', () => {
  it('reconnaît iPhone, iPad récent et écarte un ordinateur', () => {
    expect(isIosDevice({ navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' } })).toBe(true)
    expect(isIosDevice({ navigator: { userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 5 } })).toBe(true)
    expect(isIosDevice({ navigator: { userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 0 } })).toBe(false)
    expect(isIosDevice({ navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14)' } })).toBe(false)
  })

  it('détecte l’application déjà installée', () => {
    expect(isStandaloneDisplay({ navigator: { standalone: true } })).toBe(true)
    expect(isStandaloneDisplay({ navigator: {}, matchMedia: () => ({ matches: true }) })).toBe(true)
    expect(isStandaloneDisplay({ navigator: {}, matchMedia: () => ({ matches: false }) })).toBe(false)
  })

  it('ne repropose pas l’installation pendant 30 jours après un refus', () => {
    const storage = memoryStorage()
    const day = 24 * 60 * 60 * 1000
    expect(wasInstallPromptDismissed(storage, 0)).toBe(false)
    markInstallPromptDismissed(storage, 1000)
    expect(wasInstallPromptDismissed(storage, 1000 + 29 * day)).toBe(true)
    expect(wasInstallPromptDismissed(storage, 1000 + 31 * day)).toBe(false)
  })

  it('reste utilisable quand le stockage est indisponible', () => {
    const broken = { getItem() { throw new Error('bloqué') }, setItem() { throw new Error('bloqué') } }
    expect(wasInstallPromptDismissed(broken)).toBe(false)
    expect(() => markInstallPromptDismissed(broken)).not.toThrow()
  })
})
