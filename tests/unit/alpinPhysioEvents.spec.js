import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { toApiDate, toLocalInputValue } from '../../src/utils/alpinPhysioEvents'

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
  const migration = read('supabase/migrations/20261111150000_alpinphysio_feed_sync.sql')
  const service = read('src/service/alpinPhysioAdminService.js')

  it('est tenue à jour par la base, plus par le navigateur', () => {
    expect(service).not.toContain("from('posts')")
    expect(migration).toContain('create or replace trigger alpinphysio_event_feed_post_sync')
    expect(migration).toContain('security definer')
    expect(migration).toContain("new.status is distinct from 'published'")
    expect(migration).toContain('on conflict (event_id) do update')
  })

  it('échappe le texte saisi par les responsables', () => {
    for (const field of ['new.title', 'new.lieu', 'new.description']) {
      expect(migration).toContain(`public.alpinphysio_html_escape(${field})`)
    }
  })

  it('ne réattribue pas un événement modifié par un autre responsable', () => {
    expect(service).toContain("insert({ ...payload, admin_uid: userId })")
    expect(service).toContain("update(payload).eq('id', input.id)")
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
