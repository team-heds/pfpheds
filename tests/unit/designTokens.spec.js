import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const tokens = read('src/assets/styles/tokens.scss')
const lightVariables = read('src/assets/theme/theme-light/_variables.scss')
const lightTheme = read('src/assets/theme/theme-light/heds/theme.scss')

const migratedComponents = [
  'src/components/common/layout/PageHeader.vue',
  'src/components/common/states/EmptyState.vue',
  'src/components/common/states/ErrorState.vue',
  'src/components/common/states/LoadingState.vue',
  'src/components/common/forms/FormShell.vue',
  'src/components/common/forms/FormSection.vue',
  'src/components/common/forms/FormField.vue',
  'src/components/common/forms/FormActions.vue',
  'src/components/common/forms/FormStatus.vue',
  'src/components/common/forms/AuthForm.vue',
  'src/components/common/tables/DataTableToolbar.vue',
  'src/components/admin/layouts/AdminLayout.vue',
  'src/components/common/layouts/SocialThreeColumnLayout.vue',
]

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

  it('keeps the exact yellow brand and pairs it with accessible dark text', () => {
    expect(tokens).toContain('--app-color-brand: #f3c300')
    expect(contrast('#f3c300', '#172033')).toBeGreaterThanOrEqual(4.5)
    expect(lightTheme).toMatch(/\$primaryTextColor:\s*#172033/)
  })

  it('uses softened light surfaces instead of pure white for the page', () => {
    expect(lightVariables).toMatch(/--surface-ground:\s*#eef1f0/)
    expect(lightVariables).toMatch(/--surface-card:\s*#fbfbf8/)
    expect(lightVariables).toMatch(/--surface-border:\s*#d8deda/)
    expect(contrast('#566173', '#eef1f0')).toBeGreaterThanOrEqual(4.5)
  })

  it.each(migratedComponents)('%s consumes application tokens without local hex colors', (file) => {
    const source = read(file)
    const style = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
    expect(style).toContain('var(--app-')
    expect(style).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('defines desktop, tablet and mobile reflow in shared layouts', () => {
    const social = read('src/components/common/layouts/SocialThreeColumnLayout.vue')
    const admin = read('src/components/admin/layouts/AdminLayout.vue')
    expect(social).toContain('@media (max-width: 80rem)')
    expect(social).toContain('@media (max-width: 60rem)')
    expect(admin).toContain('@media (max-width: 80rem)')
    expect(admin).toContain('@media (max-width: 60rem)')
    expect(tokens).toContain('@media (max-width: 40rem)')
  })
})
