import { describe, expect, it } from 'vitest'
import {
  createTeacherIdentityResolver,
  normalizeTeacherIdentityKey,
  parseTeacherIdentityEntry
} from '../../src/domain/si/teacherIdentity'

const teachers = [
  {
    id: 'teacher-elodie',
    name: 'Elodie Perruchoud',
    email: 'elodie.perruchoud@hevs.ch'
  },
  {
    id: 'teacher-line',
    name: 'Line Martin',
    email: 'line.martin@hevs.ch'
  }
]

describe('SI teacher identity resolver', () => {
  it('resolves UUID, email, dotted login and display name to one canonical teacher', () => {
    const { resolve } = createTeacherIdentityResolver(teachers)
    const variants = [
      { user_id: 'teacher-elodie' },
      { email: 'ELODIE.PERRUCHOUD@HEVS.CH' },
      'elodie.perruchoud',
      'Élodie Perruchoud'
    ]

    for (const variant of variants) {
      expect(resolve(variant)).toMatchObject({
        status: 'resolved',
        key: 'user:teacher-elodie',
        teacher: { id: 'teacher-elodie' }
      })
    }
  })

  it('resolves serialized legacy JSON', () => {
    const { resolve } = createTeacherIdentityResolver(teachers)
    expect(resolve('{"profile_id":"teacher-line","display_name":"Ancienne valeur"}')).toMatchObject({
      status: 'resolved',
      source: 'id',
      key: 'user:teacher-line'
    })
  })

  it('keeps an unknown external teacher separate and diagnosable', () => {
    const { resolve } = createTeacherIdentityResolver(teachers)
    expect(resolve('Intervenante Externe')).toMatchObject({
      status: 'unresolved',
      key: 'legacy:intervenante externe',
      displayName: 'Intervenante Externe'
    })
  })

  it('never chooses arbitrarily between ambiguous canonical profiles', () => {
    const { resolve } = createTeacherIdentityResolver([
      ...teachers,
      { id: 'teacher-line-2', name: 'Line Martin', email: 'line.martin2@hevs.ch' }
    ])
    const result = resolve('Line Martin')
    expect(result.status).toBe('ambiguous')
    expect(result.candidates).toHaveLength(2)
    expect(result.teacher).toBeNull()
  })

  it('excludes placeholders and preserves manual legacy aliases', () => {
    const { resolve } = createTeacherIdentityResolver(teachers)
    expect(resolve('postulation').status).toBe('excluded')
    expect(normalizeTeacherIdentityKey('MNICOLE.BARMAZ')).toBe('marie nicole barmaz')
  })

  it('parses plain strings and JSON objects without executing content', () => {
    expect(parseTeacherIdentityEntry('Line Martin')).toEqual({ name: 'Line Martin' })
    expect(parseTeacherIdentityEntry('{"email":"line.martin@hevs.ch"}')).toEqual({ email: 'line.martin@hevs.ch' })
  })
})
