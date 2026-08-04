import { describe, expect, it } from 'vitest'
import {
  filterSITeacherProfiles,
  isSITeacherProfile,
  isStudentProfile,
  normalizePermissions,
} from '@/utils/userAudience'

describe('userAudience', () => {
  it('normalise les permissions venant de Supabase ou des anciens profils', () => {
    expect(normalizePermissions(['EtudiantPhysio'])).toEqual(['EtudiantPhysio'])
    expect(normalizePermissions('["EnseignantSoins"]')).toEqual(['EnseignantSoins'])
    expect(normalizePermissions({ EnseignantSoins: true, AdminSoins: false })).toEqual(['EnseignantSoins'])
  })

  it('sépare strictement étudiants et non-étudiants', () => {
    expect(isStudentProfile({ role: 'EtudiantPhysio', is_active: true })).toBe(true)
    expect(isStudentProfile({ role: 'admin', email: 'admin@students.hevs.ch', is_active: true })).toBe(false)
    expect(isStudentProfile({ role: 'archived_student', is_active: true })).toBe(false)
  })

  it('ne retourne que les enseignants SI actifs', () => {
    const profiles = [
      { user_id: 'si', role: 'EnseignantSoins', is_active: true },
      { user_id: 'phy', role: 'EnseignantPhysio', is_active: true },
      { user_id: 'inactive', permissions: ['EnseignantSoins'], is_active: false },
      { user_id: 'legacy', permissions: '["EnseignantSoins"]', is_active: true },
    ]

    expect(isSITeacherProfile(profiles[0])).toBe(true)
    expect(filterSITeacherProfiles(profiles).map(profile => profile.user_id)).toEqual(['si', 'legacy'])
  })
})
