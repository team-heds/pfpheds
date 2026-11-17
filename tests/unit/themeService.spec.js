import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  currentScheme,
  initTheme,
  readPreference,
  resolveScheme,
  setPreference,
  toggleScheme,
} from '@/theme/themeService'
import { useTheme } from '@/theme/useTheme'
import { useLayout } from '@/layout/composables/layout'

const root = path.resolve(__dirname, '../..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

// Page comme en production : la feuille claire en <link>, puis la feuille
// principale (qui contient le thème sombre) ajoutée après elle.
function productionHead() {
  document.head.innerHTML = `
    <meta name="theme-color" content="#0B213F">
    <link data-theme-link="heds" data-theme-scheme="light" rel="stylesheet" href="/assets/theme-light.css" media="not all">
    <link id="main-css" rel="stylesheet" href="/assets/index.css">`
  delete document.documentElement.dataset.theme
  return document.head.querySelector('[data-theme-scheme="light"]')
}

let systemLight = false
const systemListeners = new Set()
function fakeMatchMedia() {
  window.matchMedia = vi.fn((query) => ({
    get matches() { return query === '(prefers-color-scheme: light)' ? systemLight : false },
    addEventListener: (_type, listener) => systemListeners.add(listener),
    removeEventListener: (_type, listener) => systemListeners.delete(listener),
  }))
}
function systemChanges(light) {
  systemLight = light
  systemListeners.forEach((listener) => listener())
}

beforeEach(() => {
  localStorage.clear()
  systemLight = false
  systemListeners.clear()
  fakeMatchMedia()
})
afterEach(() => {
  setPreference('dim')
  localStorage.clear()
})

describe('thème : un seul réglage', () => {
  it('sombre par défaut, et rien d’autre qu’un des trois choix', () => {
    expect(readPreference()).toBe('dim')
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(readPreference()).toBe('dim')
    localStorage.setItem(THEME_STORAGE_KEY, 'auto')
    expect(readPreference()).toBe('auto')
  })

  it('« automatique » suit le réglage du système', () => {
    expect(resolveScheme('auto')).toBe('dim')
    systemLight = true
    expect(resolveScheme('auto')).toBe('light')
    expect(resolveScheme('dim')).toBe('dim')
  })

  it('le choix est gardé et appliqué ; le thème clair passe après la feuille principale', () => {
    const light = productionHead()
    const listener = vi.fn()
    window.addEventListener('heds:theme-change', listener)
    expect(setPreference('light')).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(light.media).toBe('all')
    expect(light.disabled).toBe(false)
    expect(document.head.lastElementChild).toBe(light)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#ffffff')
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { scheme: 'light', preference: 'light' } }))
    expect(setPreference('dim')).toBe('dim')
    expect(light.media).toBe('not all')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#0B213F')
    window.removeEventListener('heds:theme-change', listener)
  })

  it('« automatique » change de thème quand le système change', () => {
    productionHead()
    setPreference('auto')
    expect(currentScheme()).toBe('dim')
    systemChanges(true)
    expect(currentScheme()).toBe('light')
    systemChanges(false)
    expect(currentScheme()).toBe('dim')
    // Un choix fixe arrête de suivre le système.
    setPreference('dim')
    systemChanges(true)
    expect(currentScheme()).toBe('dim')
  })

  it('au démarrage, le choix enregistré est rappliqué', () => {
    productionHead()
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    expect(initTheme()).toBe('light')
    expect(toggleScheme()).toBe('dim')
    expect(readPreference()).toBe('dim')
  })

  it('stockage refusé (navigation privée) : le thème change quand même', () => {
    productionHead()
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('refusé') })
    expect(setPreference('light')).toBe('light')
    spy.mockRestore()
  })

  it('tous les boutons partagent le même état, y compris l’ancien réglage de mise en page', () => {
    productionHead()
    const theme = useTheme()
    const { layoutConfig } = useLayout()
    setPreference('light')
    expect(theme.scheme.value).toBe('light')
    expect(theme.isDark.value).toBe(false)
    expect(layoutConfig.colorScheme.value).toBe('light')
    theme.setPreference('auto')
    expect(theme.preference.value).toBe('auto')
    expect(theme.scheme.value).toBe('dim')
  })
})

describe('thème : avant le premier rendu et dans le code', () => {
  it('index.html applique le choix enregistré avant le premier rendu', () => {
    const html = read('index.html')
    const headScript = html.slice(html.indexOf("localStorage.getItem('heds.theme')") - 200, html.indexOf('</head>'))
    expect(headScript).toMatch(/prefers-color-scheme: light/)
    expect(headScript).toMatch(/setAttribute\('data-theme', scheme\)/)
    expect(headScript).toMatch(/meta\[name="theme-color"\]/)
    expect(html).toMatch(/<body>\s*<script>[\s\S]*?document\.head\.appendChild\(lightSheet\)/)
  })

  it('plus aucune détection du thème par l’adresse de la feuille de style', () => {
    for (const file of [
      'src/components/admin/widgets/KpiCard.vue',
      'src/components/admin/widgets/charts/BarChart.vue',
      'src/components/admin/widgets/charts/DoughnutChart.vue',
      'src/components/admin/widgets/charts/LineChart.vue',
      'src/components/admin/widgets/charts/PieChart.vue',
      'src/components/ui/buttons/SwitchColor.vue',
      'src/layout/AppConfig.vue',
      'src/layout/AppDarkAndLightMode.vue',
    ]) {
      const source = read(file)
      expect(source, file).not.toMatch(/theme-dim|includes\('theme-light'\)/)
      expect(source, file).toMatch(/useTheme/)
    }
  })
})
