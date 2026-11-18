import { describe, expect, it, vi } from 'vitest'

vi.mock('@/supabase.js', () => ({ supabase: {} }))
vi.mock('@/service/gamificationIntegration', () => ({ default: {} }))

import { profileDisplayName } from '@/utils/profileDisplayName'
import { resolveProfileAuthorName } from '@/service/postPublishService'

const clientReturning = (data, error = null) => {
  const chain = { from: () => chain, select: () => chain, eq: () => chain, maybeSingle: async () => ({ data, error }) }
  return chain
}

describe('nom complet affiché dans le fil (décision du 16.11)', () => {
  it('prend display_name, sinon prénom et nom', () => {
    expect(profileDisplayName({ display_name: ' TEST RECETTE BA26 ' })).toBe('TEST RECETTE BA26')
    expect(profileDisplayName({ display_name: '', forname: 'Léa', family_name: 'Dupont' })).toBe('Léa Dupont')
    expect(profileDisplayName({ forname: 'Léa' })).toBe('Léa')
    expect(profileDisplayName(null)).toBe('')
  })

  it('enregistre les nouvelles publications avec le nom complet du profil', async () => {
    const user = { id: 'u1', email: 'lea.dupont@hevs.ch' }
    await expect(resolveProfileAuthorName(user, clientReturning({ forname: 'Léa', family_name: 'Dupont' }))).resolves.toBe('Léa Dupont')
    // Sans nom dans le profil ou en cas d'erreur : l'ancien nom de secours.
    await expect(resolveProfileAuthorName(user, clientReturning(null))).resolves.toBe('lea.dupont')
    const broken = { from() { throw new Error('hors ligne') } }
    await expect(resolveProfileAuthorName(user, broken)).resolves.toBe('lea.dupont')
  })
})
