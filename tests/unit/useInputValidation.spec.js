import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, sanitizeText, validateId } from '@/composables/useInputValidation'

describe('useInputValidation', () => {
  // ==================== validateEmail ====================
  describe('validateEmail', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('user@example.com').valid).toBe(true)
      expect(validateEmail('first.last@domain.ch').valid).toBe(true)
      expect(validateEmail('user+tag@sub.domain.org').valid).toBe(true)
    })

    it('rejects empty or missing email', () => {
      expect(validateEmail('').valid).toBe(false)
      expect(validateEmail(null).valid).toBe(false)
      expect(validateEmail(undefined).valid).toBe(false)
    })

    it('rejects invalid email formats', () => {
      expect(validateEmail('notanemail').valid).toBe(false)
      expect(validateEmail('@domain.com').valid).toBe(false)
      expect(validateEmail('user@').valid).toBe(false)
    })

    it('rejects emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@b.ch'
      expect(validateEmail(longEmail).valid).toBe(false)
    })

    it('returns a message on invalid', () => {
      const result = validateEmail('')
      expect(result.message).toBeTruthy()
      expect(typeof result.message).toBe('string')
    })
  })

  // ==================== validatePassword ====================
  describe('validatePassword', () => {
    it('accepts valid passwords', () => {
      expect(validatePassword('abc123').valid).toBe(true)
      expect(validatePassword('strongP@ss!').valid).toBe(true)
    })

    it('rejects empty or missing password', () => {
      expect(validatePassword('').valid).toBe(false)
      expect(validatePassword(null).valid).toBe(false)
    })

    it('rejects passwords shorter than minLength', () => {
      expect(validatePassword('ab').valid).toBe(false)
      expect(validatePassword('abc', { minLength: 4 }).valid).toBe(false)
    })

    it('rejects passwords longer than 128 chars', () => {
      expect(validatePassword('a'.repeat(129)).valid).toBe(false)
    })

    it('uses custom minLength', () => {
      expect(validatePassword('abcdefgh', { minLength: 10 }).valid).toBe(false)
      expect(validatePassword('abcdefghij', { minLength: 10 }).valid).toBe(true)
    })
  })

  // ==================== sanitizeText ====================
  describe('sanitizeText', () => {
    it('trims whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello')
    })

    it('removes HTML angle brackets', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })

    it('truncates to maxLength', () => {
      expect(sanitizeText('abcdefghij', { maxLength: 5 })).toBe('abcde')
    })

    it('returns empty string for non-string input', () => {
      expect(sanitizeText(null)).toBe('')
      expect(sanitizeText(undefined)).toBe('')
      expect(sanitizeText(123)).toBe('')
    })

    it('uses default maxLength of 500', () => {
      const long = 'a'.repeat(600)
      expect(sanitizeText(long).length).toBe(500)
    })
  })

  // ==================== validateId ====================
  describe('validateId', () => {
    it('accepts UUIDs', () => {
      const result = validateId('550e8400-e29b-41d4-a716-446655440000')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('accepts numeric IDs', () => {
      expect(validateId('12345').valid).toBe(true)
    })

    it('accepts alphanumeric IDs with dashes/underscores', () => {
      expect(validateId('my-item_01').valid).toBe(true)
    })

    it('rejects empty or null', () => {
      expect(validateId('').valid).toBe(false)
      expect(validateId(null).valid).toBe(false)
    })

    it('rejects IDs with special characters', () => {
      expect(validateId('id; DROP TABLE').valid).toBe(false)
      expect(validateId('<script>').valid).toBe(false)
      expect(validateId('../../../etc/passwd').valid).toBe(false)
    })

    it('trims whitespace before validation', () => {
      expect(validateId('  abc123  ').valid).toBe(true)
      expect(validateId('  abc123  ').sanitized).toBe('abc123')
    })
  })
})
