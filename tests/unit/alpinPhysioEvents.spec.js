import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { buildFeedPostContent, escapeHtml, toApiDate, toLocalInputValue } from '../../src/utils/alpinPhysioEvents'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

describe('Alp’in Physio — dates des événements', () => {
  it('affiche l’heure locale dans le champ de saisie, pas l’heure UTC', () => {
    const local = new Date(2026, 10, 23, 8, 30)
    expect(toLocalInputValue(local.toISOString())).toBe('2026-11-23T08:30')
  })

  it('ne décale pas l’heure après un aller-retour modification puis enregistrement', () => {
    const stored = new Date(2026, 6, 4, 7, 0).toISOString()
    let value = stored
    for (let i = 0; i < 3; i += 1) value = toApiDate(toLocalInputValue(value))
    expect(value).toBe(stored)
  })

  it('tolère les valeurs vides ou invalides', () => {
    expect(toLocalInputValue(null)).toBe('')
    expect(toLocalInputValue('pas une date')).toBe('')
    expect(toApiDate('')).toBeNull()
    expect(toApiDate('pas une date')).toBeNull()
  })

  it('la vue de gestion utilise ces conversions', () => {
    const view = read('src/views/admin/alpinphysio/AlpinPhysioAdminView.vue')
    expect(view).toContain("from '@/utils/alpinPhysioEvents'")
    expect(view).not.toContain('toISOString().slice(0, 16)')
  })
})

describe('Alp’in Physio — publication dans le feed', () => {
  it('échappe le texte saisi par les responsables', () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">`)).toBe('&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;')
    const content = buildFeedPostContent({ title: '<script>x</script>', lieu: 'Zinal & <b>co</b>', description: null }, '23 novembre 2026')
    expect(content).not.toContain('<script>')
    expect(content).not.toContain('<b>')
    expect(content).toContain('&lt;script&gt;x&lt;/script&gt;')
    expect(content).toContain('Zinal &amp; &lt;b&gt;co&lt;/b&gt;')
    expect(content).toContain('<a href="/events">')
  })
})

describe('Alp’in Physio — tableau de bord', () => {
  it('compte le matériel manquant sur tous les événements à venir', () => {
    const service = read('src/service/alpinPhysioAdminService.js')
    const view = read('src/views/admin/alpinphysio/AlpinPhysioAdminView.vue')
    expect(service).toContain('export async function countMissingMaterials')
    expect(view).toContain('countMissingMaterials(upcomingEvents.value.map((event) => event.id))')
  })
})
