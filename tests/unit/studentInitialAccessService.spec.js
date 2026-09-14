import { describe, expect, it, vi } from 'vitest'

vi.mock('@/service/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))
import {
  canRequestInitialAccess,
  initialAccessPresentation
} from '@/service/studentInitialAccessService'

describe('studentInitialAccessService', () => {
  it('présente les cinq états sans donnée sensible', () => {
    expect(initialAccessPresentation({ status: 'pending' })).toEqual({
      label: 'À envoyer',
      severity: 'secondary',
      action: 'Envoyer l’accès'
    })
    expect(initialAccessPresentation({ status: 'sent' }).action).toBe('Renvoyer')
    expect(initialAccessPresentation({ status: 'used' }).action).toBeNull()
    expect(initialAccessPresentation({ status: 'expired' }).severity).toBe('warning')
    expect(initialAccessPresentation({ status: 'error' }).severity).toBe('danger')
  })

  it('active l’action uniquement pour les étudiants actifs BA26/BAC26', () => {
    expect(canRequestInitialAccess({ role: 'student', classe: 'BA26', is_active: true })).toBe(true)
    expect(canRequestInitialAccess({ role: 'EtudiantPhysio', classe: 'BAC-26' })).toBe(true)
    expect(
      canRequestInitialAccess({ role: 'user', rolesList: ['EtudiantPhysio'], classe: 'BA26' })
    ).toBe(true)
    expect(canRequestInitialAccess({ role: 'teacher', classe: 'BA26' })).toBe(false)
    expect(canRequestInitialAccess({ role: 'student', classe: 'BA25' })).toBe(false)
    expect(canRequestInitialAccess({ role: 'student', classe: 'BA26', is_active: false })).toBe(
      false
    )
  })
})
