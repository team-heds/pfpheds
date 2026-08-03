import { describe, expect, it } from 'vitest'
import {
  getPasswordRuleStates,
  validateNewPassword,
} from '@/utils/passwordResetValidation'

describe('passwordResetValidation', () => {
  it('valide toutes les règles de complexité attendues', () => {
    const states = getPasswordRuleStates('Nouveau!2026')

    expect(states).toEqual([
      expect.objectContaining({ id: 'length', valid: true }),
      expect.objectContaining({ id: 'uppercase', valid: true }),
      expect.objectContaining({ id: 'lowercase', valid: true }),
      expect.objectContaining({ id: 'number', valid: true }),
      expect.objectContaining({ id: 'special', valid: true }),
    ])
  })

  it('refuse un mot de passe trop faible', () => {
    const result = validateNewPassword('password', 'password')

    expect(result.valid).toBe(false)
    expect(result.message).toContain('Règle manquante')
    expect(result.ruleStates.some(rule => !rule.valid)).toBe(true)
  })

  it('refuse une confirmation différente', () => {
    const result = validateNewPassword('Nouveau!2026', 'Different!2026')

    expect(result.valid).toBe(false)
    expect(result.message).toBe('Les deux mots de passe doivent être identiques.')
  })

  it('accepte un mot de passe robuste confirmé', () => {
    const result = validateNewPassword('Nouveau!2026', 'Nouveau!2026')

    expect(result.valid).toBe(true)
    expect(result.message).toBe('')
  })
})
