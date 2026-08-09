import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const tokens = read('src/assets/styles/tokens.scss')
const lightVariables = read('src/assets/theme/theme-light/_variables.scss')

const relativeLuminance = (hex) => {
  const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

const contrast = (foreground, background) => {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe('design token contract', () => {
  it.each([
    '--app-color-brand', '--app-color-on-brand', '--app-color-page', '--app-color-surface',
    '--app-font-size-page-title', '--app-space-4', '--app-radius-xl', '--app-shadow-md',
    '--app-control-height', '--app-touch-target', '--app-content-max', '--app-social-side-width',
    '--app-duration-normal',
  ])('publishes %s', (token) => {
    expect(tokens).toContain(token)
  })

  it('keeps the exact yellow brand and publishes an accessible future-facing text token', () => {
    expect(tokens).toContain('--app-color-brand: #f3c300')
    expect(contrast('#f3c300', '#172033')).toBeGreaterThanOrEqual(4.5)
  })

  it('preserves the legacy visual values used by the current application', () => {
    expect(tokens).toContain('--brand-yellow: #F3C300')
    expect(tokens).toContain('--brand-yellow-600: #D49F3F')
    expect(tokens).toContain('--brand-green: #3ECF8E')
    expect(tokens).toContain('--brand-green-600: #2DD4BF')
    expect(tokens).toContain('--font-weight-extrabold: 800')
    expect(tokens).toContain('--focus-ring: 0 0 0 0.2rem rgba(62, 207, 142, 0.25)')
    expect(lightVariables).toMatch(/--surface-ground:\s*#EFF3F8/)
    expect(lightVariables).toMatch(/--surface-card:\s*#ffffff/)
  })

  it('keeps stable social sidebars until the three-column layout no longer fits', () => {
    const social = read('src/components/common/layouts/SocialThreeColumnLayout.vue')
    const admin = read('src/components/admin/layouts/AdminLayout.vue')
    expect(social).toContain('--social-side-column: clamp(15rem, 20vw, 25.5rem)')
    expect(social).toContain('minmax(30rem, 1fr)')
    expect(social).toContain('@media (max-width: 63.99rem)')
    expect(social).toContain('@media (max-width: 52rem)')
    expect(admin).toContain('grid-template-columns: 280px 1fr 320px')
    expect(admin).toContain('@media (max-width: 1279px)')
    expect(admin).toContain('@media (max-width: 959px)')
  })

  it('keeps the PrimeIcons font stylesheet in the application bundle', () => {
    expect(read('src/assets/styles/styles.scss')).toMatch(/@import\s+["']primeicons\/primeicons\.css["']/)
  })

  it.each([
    'src/views/institutions/Institution.vue',
    'src/components/common/filters/FiltreMap.vue',
  ])('%s uses the shared social layout instead of a duplicate responsive grid', (file) => {
    const source = read(file)
    expect(source).toContain('<SocialThreeColumnLayout')
    expect(source).not.toContain('grid-template-columns: 1fr 3fr 1fr')
  })
})
