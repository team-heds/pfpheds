import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const source = (path) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8')

describe('écrans mobiles restants', () => {
  it('donne à l’assistant un titre et une conversation pleine hauteur', () => {
    const view = source('views/apps/tools/ChatBotView.vue')
    expect(view).toContain('<h1 :id="titleId">')
    expect(view).toContain('role="log"')
    expect(view).not.toContain('max-width:480px')
  })

  it('redessine le QR code au retour sur l’écran et annonce la génération', () => {
    const qr = source('components/ui/QrCodeGenerator.vue')
    expect(qr).toContain('onActivated(renderQr)')
    expect(qr).toContain('Génération du QR code…')
  })

  it('garde la navigation des capsules sur une ligne', () => {
    const nav = source('components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue')
    expect(nav).toContain('aria-label="Sommaire"')
    expect(nav).toMatch(/@media \(max-width: 768px\)[\s\S]*capsules-ir-nav__label/)
  })

  it('empêche Care Convers de dépasser l’écran', () => {
    expect(source('views/pages/CareConvers.vue')).toContain('grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr)')
  })
})
