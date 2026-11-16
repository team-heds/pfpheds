import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  features: { userJourney: true },
  onProfileUpdate: vi.fn(),
}))

vi.mock('@/supabase', () => ({ supabase: {} }))
vi.mock('@/config/gamificationFeatures', () => ({ gamificationFeatures: mocks.features }))
vi.mock('@/service/gamificationIntegration', () => ({ default: { onProfileUpdate: mocks.onProfileUpdate } }))

import { profileInfoForm, recordProfileUpdate, saveProfileInfo } from '@/mobile/profile/profileInfo'

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8')

function fakeClient(result = { data: null, error: null }) {
  const calls = {}
  const chain = {
    from(table) { calls.table = table; return chain },
    update(values) { calls.values = values; return chain },
    eq(column, value) { calls.eq = [column, value]; return chain },
    select(columns) { calls.select = columns; return chain },
    single: async () => result,
  }
  return { client: chain, calls }
}

describe('profil sur téléphone : informations modifiables', () => {
  beforeEach(() => {
    mocks.features.userJourney = true
    mocks.onProfileUpdate.mockReset()
    mocks.onProfileUpdate.mockResolvedValue({ ok: true })
  })

  it('prépare le formulaire depuis le profil, champs vides compris', () => {
    expect(profileInfoForm({ city: 'Sion', preferred_language: 'fr', canton_of_origin: 'VS' }))
      .toEqual({ city: 'Sion', preferredLanguage: 'fr', cantonOfOrigin: 'VS' })
    expect(profileInfoForm(null)).toEqual({ city: '', preferredLanguage: '', cantonOfOrigin: '' })
  })

  it('n’écrit que ville, langue et canton, puis compte la mise à jour', async () => {
    const { client, calls } = fakeClient({ data: { city: 'Sion', preferred_language: 'de', canton_of_origin: 'VS' }, error: null })
    const saved = await saveProfileInfo('etudiant-1', { city: ' Sion ', preferredLanguage: 'de', cantonOfOrigin: 'vs' }, { client })

    expect(calls.table).toBe('user_profiles')
    expect(calls.eq).toEqual(['user_id', 'etudiant-1'])
    expect(Object.keys(calls.values).sort()).toEqual(['canton_of_origin', 'city', 'preferred_language', 'updated_at'])
    expect(calls.values).toMatchObject({ city: 'Sion', preferred_language: 'de', canton_of_origin: 'VS' })
    expect(saved.city).toBe('Sion')
    expect(mocks.onProfileUpdate).toHaveBeenCalledWith('etudiant-1', expect.objectContaining({ profileCompleted: true, hasCity: true }))
  })

  it('remonte une erreur d’enregistrement sans compter de points', async () => {
    const { client } = fakeClient({ data: null, error: new Error('refusé') })
    await expect(saveProfileInfo('etudiant-1', { city: 'Sion' }, { client })).rejects.toThrow('refusé')
    expect(mocks.onProfileUpdate).not.toHaveBeenCalled()
  })

  it('compte le changement de photo pour le défi « Profil à jour »', async () => {
    await recordProfileUpdate('etudiant-1', { hasAvatar: true })
    expect(mocks.onProfileUpdate).toHaveBeenCalledWith('etudiant-1', expect.objectContaining({ hasAvatar: true, profileCompleted: true }))
  })

  it('ne bloque jamais l’enregistrement si la gamification échoue ou est coupée', async () => {
    mocks.onProfileUpdate.mockRejectedValueOnce(new Error('panne'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(recordProfileUpdate('etudiant-1', { hasAvatar: true })).resolves.toBeNull()

    mocks.features.userJourney = false
    mocks.onProfileUpdate.mockClear()
    await recordProfileUpdate('etudiant-1', { hasAvatar: true })
    expect(mocks.onProfileUpdate).not.toHaveBeenCalled()
  })

  it('propose ces champs et compte la photo dans les Réglages', () => {
    const screen = readSource('src/mobile/profile/SettingsScreen.vue')
    expect(screen).toContain('Mes informations')
    expect(screen).toContain('v-model="info.city"')
    expect(screen).toContain('v-model="info.preferredLanguage"')
    expect(screen).toContain('v-model="info.cantonOfOrigin"')
    expect(screen).toContain('recordProfileUpdate(userId, { hasAvatar: true })')
    expect(readSource('src/mobile/profile/mobileProfileStore.js')).toContain('city, preferred_language, canton_of_origin')
  })
})
