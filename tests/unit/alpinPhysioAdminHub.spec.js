import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { defaultAlpinPhysioSiteContent } from '../../src/data/alpinPhysioSiteContent'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

describe('Alp’in Physio administration hub', () => {
  it('exposes every administration section through protected routes', () => {
    const routes = read('src/router/routes/admin.js')
    for (const pathName of [
      '/admin/alpinphysio',
      '/admin/alpinphysio/events',
      '/admin/alpinphysio/presences',
      '/admin/alpinphysio/materiel',
      '/admin/alpinphysio/site',
      '/admin/alpinphysio/equipe',
    ]) expect(routes).toContain(`path: '${pathName}'`)
    expect(routes).toContain("'alpinphysio.events.manage'")
    expect(routes).toContain("'alpinphysio.attendance.manage'")
  })

  it('keeps events and attendance on Supabase only', () => {
    const service = read('src/service/alpinPhysioAdminService.js')
    const detail = read('src/components/events/EventDetail.vue')
    expect(service).toContain("from('events')")
    expect(service).toContain("from('event_registrations')")
    expect(service).toContain("from('event_material_items')")
    expect(service).toContain("from('posts')")
    expect(service).not.toMatch(/firebase|firestore/i)
    expect(detail).not.toMatch(/firebase|firestore/i)
  })

  it('defines explicit RLS boundaries for managers and students', () => {
    const migration = read('supabase/migrations/20260930121711_alpinphysio_admin_hub.sql')
    expect(migration).toContain('create policy event_responses_insert_own')
    expect(migration).toContain('user_uid = (select auth.uid())::text')
    expect(migration).toContain('create policy event_material_manage')
    expect(migration).toContain('create policy alpin_track_manager_add_coordinators')
    expect(migration).toContain("track_id = 'ALPIN'")
    expect(migration).toContain("role = 'COORDINATOR'")
    expect(migration).toContain('create policy alpin_site_public_read')
  })

  it('synchronizes only published events to the feed', () => {
    const service = read('src/service/alpinPhysioAdminService.js')
    expect(service).toContain("event.status !== 'published' || !event.show_in_feed")
    expect(service).toContain("upsert(post, { onConflict: 'event_id' })")
    expect(service).toContain('event_id: event.id')
  })

  it('keeps the complete public content editable from the administration', () => {
    const editor = read('src/components/alpinphysio/AlpinPhysioSiteEditor.vue')
    const publicPage = read('src/views/associations/AlpinPhysioView.vue')

    expect(defaultAlpinPhysioSiteContent.committee).toHaveLength(9)
    expect(defaultAlpinPhysioSiteContent.activities).toHaveLength(3)
    expect(defaultAlpinPhysioSiteContent.partnershipSteps).toHaveLength(4)
    expect(defaultAlpinPhysioSiteContent.galleryPhotos).toHaveLength(5)
    expect(defaultAlpinPhysioSiteContent.partners).toHaveLength(4)
    expect(editor).toContain('Modifier toute la vitrine')
    expect(editor).toContain("add('committee'")
    expect(editor).toContain("add('galleryPhotos'")
    expect(publicPage).toContain('siteContent.committee')
    expect(publicPage).toContain('siteContent.galleryPhotos')
  })
})
