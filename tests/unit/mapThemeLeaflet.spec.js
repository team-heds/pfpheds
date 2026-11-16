import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isLightSchemeActive } from '@/components/map/useMapTheme'

const read = (file) => fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8')

const themeDoc = (lightEnabled) => {
  document.head.innerHTML = ''
  const link = document.createElement('link')
  link.dataset.themeLink = 'heds'
  link.dataset.themeScheme = 'light'
  link.disabled = !lightEnabled
  link.media = lightEnabled ? 'all' : 'not all'
  document.head.appendChild(link)
  return document
}

describe('cartes Leaflet et thème', () => {
  it('détecte le thème clair à partir de la feuille de style active', () => {
    expect(isLightSchemeActive(themeDoc(true))).toBe(true)
    expect(isLightSchemeActive(themeDoc(false))).toBe(false)
    document.head.innerHTML = ''
    expect(isLightSchemeActive(document)).toBe(false)
  })

  // Vue réécrit tout l'attribut class quand une liaison :class change : les classes posées par
  // Leaflet (leaflet-container…) disparaissent et la carte devient vide au changement de thème.
  it.each([
    ['src/mobile/map/MapTab.vue', 'canvasRef'],
    ['src/components/map/DesktopInstitutionMap.vue', 'canvasRef'],
    ['src/components/map/InstitutionLocationMap.vue', 'canvasRef'],
  ])('%s ne lie pas de :class sur le conteneur Leaflet', (file, refName) => {
    const tag = read(file).match(new RegExp(`<div[^>]*ref="${refName}"[^>]*>`))?.[0]
    expect(tag).toBeTruthy()
    expect(tag).not.toMatch(/:class=/)
  })
})
