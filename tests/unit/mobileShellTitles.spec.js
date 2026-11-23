import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import appRoutes from '@/router/routes/apps'

const source = (path) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8')

describe('titres de la coque mobile', () => {
  it('réserve le nom de l’onglet à sa page racine', () => {
    const shell = source('mobile/shell/MobileAppShell.vue')
    expect(shell).toContain('route.path === tab?.root')
    expect(shell).not.toContain("liveTitle.value || tab?.label")
  })

  it.each([['/notes', 'Notes'], ['/tasklist', 'Tâches'], ['/outils', 'Outils']])('donne un titre à %s', (path, title) => {
    expect(appRoutes.find((route) => route.path === path).meta.title).toBe(title)
  })
})

describe('cibles tactiles de la coque', () => {
  it.each([
    'mobile/home/FeedFilterChips.vue',
    'mobile/institutions/InstitutionListView.vue',
    'mobile/institutions/InstitutionsTab.vue',
    'mobile/map/MapTab.vue',
    'mobile/profile/ProfileTab.vue',
  ])('%s garde 44 px', (file) => {
    expect(source(file)).toContain('min-height: 44px')
  })

  it('laisse le bouton Publier à sa largeur', () => {
    expect(source('mobile/home/CreateScreen.vue')).toMatch(/\.m-create__publish \{[^}]*flex: 0 0 auto;/)
  })
})
