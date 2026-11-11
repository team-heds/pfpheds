import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  emptyPartnershipRequest, partnershipReplyLink, partnershipStatusLabel, validatePartnershipRequest,
} from '../../src/utils/alpinPhysioPartnership'

const read = (file) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
const valid = () => ({ ...emptyPartnershipRequest(), organization: 'Trail des Tests', contact_name: 'Camille Exemple', email: 'camille@example.org' })

describe('Alp’in Physio — formulaire de demande de partenariat', () => {
  it('accepte une demande minimale', () => {
    expect(validatePartnershipRequest(valid())).toEqual({})
  })

  it('signale chaque champ obligatoire manquant', () => {
    expect(Object.keys(validatePartnershipRequest(emptyPartnershipRequest())).sort()).toEqual(['contact_name', 'email', 'organization'])
    expect(validatePartnershipRequest()).toHaveProperty('email')
  })

  it('refuse une adresse e-mail invalide et un nombre de masseurs incohérent', () => {
    expect(validatePartnershipRequest({ ...valid(), email: 'camille@' })).toHaveProperty('email')
    expect(validatePartnershipRequest({ ...valid(), masseurs_count: '0' })).toHaveProperty('masseurs_count')
    expect(validatePartnershipRequest({ ...valid(), masseurs_count: '2.5' })).toHaveProperty('masseurs_count')
    expect(validatePartnershipRequest({ ...valid(), masseurs_count: 8 })).toEqual({})
  })

  it('limite la longueur des textes comme la base', () => {
    expect(validatePartnershipRequest({ ...valid(), message: 'x'.repeat(2001) })).toHaveProperty('message')
    expect(validatePartnershipRequest({ ...valid(), organization: 'x'.repeat(161) })).toHaveProperty('organization')
    expect(validatePartnershipRequest({ ...valid(), event_date: '14.08.2027' })).toHaveProperty('event_date')
    expect(validatePartnershipRequest({ ...valid(), event_date: '2027-08-14' })).toEqual({})
  })

  it('prépare une réponse par e-mail et des libellés en français', () => {
    const link = partnershipReplyLink({ email: 'camille@example.org', organization: 'Trail & Co', contact_name: 'Camille' })
    expect(link.startsWith('mailto:camille@example.org?subject=')).toBe(true)
    expect(link).toContain(encodeURIComponent('Trail & Co'))
    expect(partnershipStatusLabel('in_progress')).toBe('En cours')
    expect(partnershipStatusLabel('inconnu')).toBe('inconnu')
  })
})

describe('Alp’in Physio — parcours organisateur', () => {
  const page = read('src/views/associations/AlpinPhysioView.vue')
  const form = read('src/components/alpinphysio/AlpinPartnershipForm.vue')
  const migration = read('supabase/migrations/20261111153000_alpinphysio_partnership_requests.sql')

  it('la page publique propose le formulaire et le contrat téléchargeable', () => {
    expect(page).toContain('<AlpinPartnershipForm :email="siteContent.email" />')
    expect(page).toContain('v-if="siteContent.contractUrl"')
    expect(page).toContain("scrollTo('partnership-request')")
    expect(read('src/data/alpinPhysioSiteContent.js')).toContain("contractUrl: ''")
  })

  it('le formulaire est accessible : libellés reliés, erreurs annoncées, champ piège masqué', () => {
    for (const id of ['pr-organization', 'pr-name', 'pr-email', 'pr-phone', 'pr-date', 'pr-location', 'pr-count', 'pr-message']) {
      expect(form).toContain(`for="${id}"`)
      expect(form).toContain(`id="${id}"`)
    }
    expect(form).toContain('role="alert"')
    expect(form).toContain('class="request__trap" aria-hidden="true"')
    expect(form).toContain('tabindex="-1"')
  })

  it('les demandes ne sont lisibles que par les responsables', () => {
    expect(migration).toContain('alter table public.alpinphysio_partnership_requests enable row level security')
    expect(migration).toContain('revoke all on table public.alpinphysio_partnership_requests from public, anon, authenticated')
    expect(migration).toContain('create policy alpin_partnership_manager_read')
    expect(migration).not.toMatch(/for insert/i)
    expect(migration).toContain('grant execute on function public.submit_alpinphysio_partnership_request(jsonb) to anon, authenticated, service_role')
  })

  it('la gestion a un onglet Demandes protégé', () => {
    expect(read('src/router/routes/admin.js')).toContain("path: '/admin/alpinphysio/demandes'")
    expect(read('src/config/adminMenu.js')).toContain("to: '/admin/alpinphysio/demandes'")
    expect(read('src/views/admin/alpinphysio/AlpinPhysioAdminView.vue')).toContain('<AlpinPartnershipRequests />')
  })
})
