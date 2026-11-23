import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8')
const tokens = read('assets/styles/tokens.scss')
const foundations = read('assets/styles/platform-foundations.scss')

const luminance = (hex) => {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => parseInt(value, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}
const contrast = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

describe('anneau de focus', () => {
  it('atteint 3:1 dans les deux thèmes', () => {
    expect(contrast('#775f00', '#ffffff')).toBeGreaterThanOrEqual(3)
    expect(contrast('#f3c300', '#0b213f')).toBeGreaterThanOrEqual(3)
  })

  it('suit le thème et l’emporte sur les pages', () => {
    expect(tokens).toContain("--app-color-focus: #775f00")
    expect(tokens).toMatch(/:root:not\(\[data-theme='light'\]\) \{\s*--app-color-focus: #f3c300;/)
    expect(foundations).toContain('--app-focus-ring: var(--app-color-focus')
    expect(foundations).toContain('outline-color: var(--app-focus-ring) !important')
  })

  it('n’a plus de couleur figée dans l’administration', () => {
    expect(read('components/admin/layouts/AdminLayout.vue')).not.toContain('#ffcc00')
  })
})

describe('échelle commune', () => {
  it('définit les rayons 6, 8, 12 et 16 px', () => {
    for (const value of ['--app-radius-sm: 0.375rem', '--app-radius-md: 0.5rem', '--app-radius-lg: 0.75rem', '--app-radius-xl: 1rem']) {
      expect(tokens).toContain(value)
    }
  })

  it('utilise les hauteurs de contrôle partagées', () => {
    expect(foundations).toContain('--form-control-height: var(--app-control-height)')
    expect(foundations).toContain('min-height: var(--app-control-height-sm)')
  })
})

describe('texte sur fond jaune', () => {
  it('garde un contraste lisible', () => {
    expect(contrast('#172033', '#f3c300')).toBeGreaterThanOrEqual(4.5)
  })
})
