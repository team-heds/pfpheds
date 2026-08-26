const test = require('node:test')
const assert = require('node:assert/strict')
const {
  filterSITeacherProfiles,
  filterStudentProfiles,
  filterTeacherProfiles,
  isSITeacherProfile,
  isStudentProfile,
  isTeacherProfile
} = require('../security/userAudience')

test('student audience excludes every staff primary role even with legacy student data', () => {
  const profiles = [
    { user_id: 'student', role: 'EtudiantPhysio', is_active: true },
    { user_id: 'legacy-student', role: 'user', permissions: ['EtudiantPhysio'], is_active: true },
    { user_id: 'admin', role: 'admin', permissions: ['EtudiantPhysio'], is_active: true },
    { user_id: 'teacher', role: 'EnseignantSoins', permissions: ['EtudiantPhysio'], is_active: true },
    { user_id: 'inactive', role: 'EtudiantPhysio', is_active: false },
    { user_id: 'archived', role: 'archived_student', is_active: true }
  ]

  assert.deepEqual(
    filterStudentProfiles(profiles).map((profile) => profile.user_id),
    ['student', 'legacy-student']
  )
  assert.equal(isStudentProfile(profiles[2]), false)
  assert.equal(isStudentProfile(profiles[3]), false)
})

test('SI teacher audience only accepts active SI teacher profiles', () => {
  const profiles = [
    { user_id: 'teacher', role: 'EnseignantSoins', is_active: true },
    { user_id: 'legacy-teacher', role: 'user', permissions: 'EnseignantSoins', is_active: true },
    { user_id: 'student', role: 'EtudiantPhysio', permissions: ['EnseignantSoins'], is_active: true },
    { user_id: 'physio', role: 'EnseignantPhysio', is_active: true },
    { user_id: 'inactive', role: 'EnseignantSoins', is_active: false }
  ]

  assert.deepEqual(
    filterSITeacherProfiles(profiles).map((profile) => profile.user_id),
    ['teacher', 'legacy-teacher']
  )
  assert.equal(isSITeacherProfile(profiles[2]), false)
})

test('dashboard teacher audience accepts active teachers from both tracks', () => {
  const profiles = [
    { user_id: 'si', role: 'EnseignantSoins', is_active: true },
    { user_id: 'physio', role: 'EnseignantPhysio', is_active: true },
    { user_id: 'rm', role: 'RMPhysio', is_active: true },
    { user_id: 'legacy', role: 'user', permissions: ['RepondantHES'], is_active: true },
    { user_id: 'student', role: 'EtudiantPhysio', permissions: ['EnseignantPhysio'], is_active: true },
    { user_id: 'inactive', role: 'EnseignantSoins', is_active: false }
  ]

  assert.deepEqual(
    filterTeacherProfiles(profiles).map((profile) => profile.user_id),
    ['si', 'physio', 'rm', 'legacy']
  )
  assert.equal(isTeacherProfile(profiles[4]), false)
})
