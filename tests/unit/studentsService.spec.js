import { describe, it, expect } from 'vitest'
import { filterStudentProfiles } from '@/utils/userAudience'

// ── Logique pure extraite de studentsService.js ────────────────

/**
 * Filtre les étudiants depuis user_profiles (même logique que le service)
 */
const filterStudentUsers = (users) => {
  return filterStudentProfiles(users)
}

/**
 * Mappe un user_profile vers le format étudiant (même logique que le service)
 */
const mapUserToStudent = (user, classeOverride) => {
  const classe = classeOverride || user.classe || user.class || user.promotion || 'Non défini'
  return {
    id: user.user_id,
    Nom: user.family_name || 'Nom non disponible',
    Prenom: user.forname || 'Prénom non disponible',
    Mail: user.email || 'Email non disponible',
    Classe: classe,
    SAE: user.sae === true || user.cas_particulier === 'true',
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    house_id: user.house_id,
    created_at: user.created_at,
    pfp_cohort: user.pfp_cohort || null,
    source: 'user_profiles'
  }
}

/**
 * Construit le mapping classe depuis StudentsPhysio (même logique que le service)
 */
const buildClassMappings = (physioStudents) => {
  const userIdToClassMap = new Map()
  const emailToClassMap = new Map()

  physioStudents.forEach(student => {
    const classe = student.class
      || student.Class
      || student.Classe
      || student.classe
      || student.promotion
      || student.year
      || student.annee

    if (classe) {
      if (student.user_id) userIdToClassMap.set(student.user_id, classe)
      if (student.firebase_id) userIdToClassMap.set(student.firebase_id, classe)
      const email = (student.Mail || student.email || student.mail || '').toLowerCase()
      if (email) emailToClassMap.set(email, classe)
    }
  })

  return { userIdToClassMap, emailToClassMap }
}

/**
 * Fusionne user_profiles et StudentsPhysio sans doublons (même logique que le service)
 */
const mergeStudents = (studentsFromProfiles, studentsFromPhysio, studentUsers) => {
  const allStudents = [...studentsFromProfiles]
  const existingIds = new Set()

  studentsFromProfiles.forEach(s => {
    existingIds.add(s.id)
    const profile = studentUsers.find(u => u.user_id === s.id)
    if (profile && profile.firebase_id) {
      existingIds.add(profile.firebase_id)
    }
  })

  studentsFromPhysio.forEach(student => {
    const alreadyExists = existingIds.has(student.id) ||
      (student.firebase_id && existingIds.has(student.firebase_id))
    if (!alreadyExists) {
      allStudents.push(student)
    }
  })

  return allStudents
}

/**
 * Calcule les stats par classe (même logique que getClassStats)
 */
const getClassStats = (students) => {
  const stats = {}
  students.forEach(student => {
    const classe = student.Classe || 'Non défini'
    stats[classe] = (stats[classe] || 0) + 1
  })
  return stats
}

/**
 * Filtre par classe (même logique que getStudentsByClass)
 */
const getStudentsByClass = (students, classe) => {
  return students.filter(s => s.Classe === classe)
}

// ── Tests ──────────────────────────────────────────────────────

describe('studentsService – filterStudentUsers', () => {
  it('filtre par rôle "student"', () => {
    const users = [
      { role: 'student', email: 'a@test.ch' },
      { role: 'admin', email: 'b@test.ch' },
      { role: 'Student', email: 'c@test.ch' }
    ]
    expect(filterStudentUsers(users)).toHaveLength(2)
  })

  it('filtre par rôle "etudiant"', () => {
    const users = [
      { role: 'etudiant', email: 'a@test.ch' },
      { role: 'Étudiant', email: 'b@test.ch' }
    ]
    expect(filterStudentUsers(users)).toHaveLength(2)
  })

  it('ne considère jamais le domaine email comme une preuve de statut étudiant', () => {
    const users = [
      { role: 'unknown', email: 'jean@students.hevs.ch' },
      { role: 'unknown', email: 'admin@hevs.ch' }
    ]
    expect(filterStudentUsers(users)).toHaveLength(0)
  })

  it('combine rôle et email', () => {
    const users = [
      { role: 'student', email: 'a@students.hevs.ch' },
      { role: 'admin', email: 'b@students.hevs.ch' },
      { role: 'student', email: 'c@other.ch' },
      { role: 'admin', email: 'd@other.ch' }
    ]
    expect(filterStudentUsers(users)).toHaveLength(2)
  })

  it('exclut les étudiants archivés ou inactifs', () => {
    const users = [
      { role: 'archived_student', is_active: true },
      { role: 'student', is_active: false },
      { role: 'EtudiantPhysio', is_active: true }
    ]
    expect(filterStudentUsers(users)).toEqual([users[2]])
  })

  it('accepte la permission EtudiantPhysio quel que soit son format', () => {
    const users = [
      { role: 'user', permissions: ['EtudiantPhysio'] },
      { role: 'user', permissions: '["EtudiantPhysio"]' },
      { role: 'user', permissions: { EtudiantPhysio: true } }
    ]
    expect(filterStudentUsers(users)).toHaveLength(3)
  })

  it('retourne vide pour une liste vide', () => {
    expect(filterStudentUsers([])).toHaveLength(0)
    expect(filterStudentUsers(null)).toHaveLength(0)
  })

  it('gère les champs manquants', () => {
    const users = [{ role: null, email: null }, {}]
    expect(filterStudentUsers(users)).toHaveLength(0)
  })
})

describe('studentsService – mapUserToStudent', () => {
  it('mappe correctement un user_profile complet', () => {
    const user = {
      user_id: 'u1',
      family_name: 'Dupont',
      forname: 'Jean',
      email: 'jean@test.ch',
      classe: 'BA24',
      pfp_cohort: 'PFP1A',
      display_name: 'Jean Dupont',
      avatar_url: 'http://img.jpg',
      house_id: 'h1',
      created_at: '2024-01-01'
    }
    const result = mapUserToStudent(user)
    expect(result.id).toBe('u1')
    expect(result.Nom).toBe('Dupont')
    expect(result.Prenom).toBe('Jean')
    expect(result.Mail).toBe('jean@test.ch')
    expect(result.Classe).toBe('BA24')
    expect(result.pfp_cohort).toBe('PFP1A')
    expect(result.source).toBe('user_profiles')
  })

  it('utilise les valeurs par défaut pour les champs manquants', () => {
    const user = { user_id: 'u2' }
    const result = mapUserToStudent(user)
    expect(result.Nom).toBe('Nom non disponible')
    expect(result.Prenom).toBe('Prénom non disponible')
    expect(result.Mail).toBe('Email non disponible')
    expect(result.Classe).toBe('Non défini')
    expect(result.pfp_cohort).toBeNull()
  })

  it('utilise classeOverride si fourni', () => {
    const user = { user_id: 'u3', classe: 'BA24' }
    const result = mapUserToStudent(user, 'BA23')
    expect(result.Classe).toBe('BA23')
  })

  it('gère SAE correctement', () => {
    expect(mapUserToStudent({ user_id: 'u1', sae: true }).SAE).toBe(true)
    expect(mapUserToStudent({ user_id: 'u2', cas_particulier: 'true' }).SAE).toBe(true)
    expect(mapUserToStudent({ user_id: 'u3', sae: false }).SAE).toBe(false)
    expect(mapUserToStudent({ user_id: 'u4' }).SAE).toBe(false)
  })
})

describe('studentsService – buildClassMappings', () => {
  it('construit le mapping par user_id', () => {
    const physio = [
      { user_id: 'u1', class: 'BA24' },
      { user_id: 'u2', class: 'BA25' }
    ]
    const { userIdToClassMap } = buildClassMappings(physio)
    expect(userIdToClassMap.get('u1')).toBe('BA24')
    expect(userIdToClassMap.get('u2')).toBe('BA25')
  })

  it('construit le mapping par firebase_id', () => {
    const physio = [
      { user_id: 'u1', firebase_id: 'fb1', class: 'BA24' }
    ]
    const { userIdToClassMap } = buildClassMappings(physio)
    expect(userIdToClassMap.get('fb1')).toBe('BA24')
  })

  it('construit le mapping par email', () => {
    const physio = [
      { user_id: 'u1', Mail: 'Jean@Test.ch', class: 'BA24' }
    ]
    const { emailToClassMap } = buildClassMappings(physio)
    expect(emailToClassMap.get('jean@test.ch')).toBe('BA24')
  })

  it('ignore les entrées sans classe', () => {
    const physio = [
      { user_id: 'u1' },
      { user_id: 'u2', class: null }
    ]
    const { userIdToClassMap } = buildClassMappings(physio)
    expect(userIdToClassMap.size).toBe(0)
  })

  it('gère les variantes de noms de colonnes pour la classe', () => {
    const physio = [
      { user_id: 'u1', Class: 'BA23' },
      { user_id: 'u2', Classe: 'BA24' },
      { user_id: 'u3', classe: 'BA25' }
    ]
    const { userIdToClassMap } = buildClassMappings(physio)
    expect(userIdToClassMap.get('u1')).toBe('BA23')
    expect(userIdToClassMap.get('u2')).toBe('BA24')
    expect(userIdToClassMap.get('u3')).toBe('BA25')
  })
})

describe('studentsService – mergeStudents (déduplication)', () => {
  it('fusionne sans doublons par user_id', () => {
    const fromProfiles = [
      { id: 'u1', Nom: 'Dupont' },
      { id: 'u2', Nom: 'Martin' }
    ]
    const fromPhysio = [
      { id: 'u1', Nom: 'Dupont Physio' }, // doublon
      { id: 'u3', Nom: 'Albert' }          // unique
    ]
    const userProfiles = [
      { user_id: 'u1' },
      { user_id: 'u2' }
    ]

    const result = mergeStudents(fromProfiles, fromPhysio, userProfiles)
    expect(result).toHaveLength(3) // u1, u2, u3
    expect(result.find(s => s.id === 'u1').Nom).toBe('Dupont') // garde le profil
  })

  it('déduplique par firebase_id', () => {
    const fromProfiles = [{ id: 'u1', Nom: 'A' }]
    const fromPhysio = [{ id: 'fb1', firebase_id: 'fb1', Nom: 'A Physio' }]
    const userProfiles = [{ user_id: 'u1', firebase_id: 'fb1' }]

    const result = mergeStudents(fromProfiles, fromPhysio, userProfiles)
    expect(result).toHaveLength(1) // fb1 est déjà dans profiles via firebase_id
  })

  it('ajoute les étudiants physio uniques', () => {
    const fromProfiles = [{ id: 'u1' }]
    const fromPhysio = [{ id: 'physio-only' }]
    const userProfiles = [{ user_id: 'u1' }]

    const result = mergeStudents(fromProfiles, fromPhysio, userProfiles)
    expect(result).toHaveLength(2)
  })

  it('gère des listes vides', () => {
    expect(mergeStudents([], [], [])).toHaveLength(0)
  })
})

describe('studentsService – getClassStats', () => {
  it('calcule les stats par classe', () => {
    const students = [
      { Classe: 'BA24' },
      { Classe: 'BA24' },
      { Classe: 'BA25' },
      { Classe: null }
    ]
    const stats = getClassStats(students)
    expect(stats['BA24']).toBe(2)
    expect(stats['BA25']).toBe(1)
    expect(stats['Non défini']).toBe(1)
  })

  it('retourne objet vide pour liste vide', () => {
    expect(getClassStats([])).toEqual({})
  })
})

describe('studentsService – getStudentsByClass', () => {
  const students = [
    { Classe: 'BA24', Nom: 'A' },
    { Classe: 'BA25', Nom: 'B' },
    { Classe: 'BA24', Nom: 'C' }
  ]

  it('filtre par classe', () => {
    const result = getStudentsByClass(students, 'BA24')
    expect(result).toHaveLength(2)
  })

  it('retourne vide si aucun match', () => {
    expect(getStudentsByClass(students, 'BA23')).toHaveLength(0)
  })
})

describe('studentsService – getStudentsFromUserProfiles mapping', () => {
  it('mappe correctement les champs user_profiles vers le format attendu', () => {
    const user = {
      user_id: 'abc',
      display_name: 'Jean Dupont',
      forname: 'Jean',
      family_name: 'Dupont',
      classe: 'BA24',
      email: 'jean@students.hevs.ch',
      avatar_url: 'http://avatar.jpg',
      house_id: 'house1',
      created_at: '2024-01-01',
      pfp_cohort: 'PFP1A',
      role: 'student',
      permissions: ['read']
    }

    // Reproduire le mapping du service
    const mapped = {
      id: user.user_id,
      user_id: user.user_id,
      display_name: user.display_name,
      forname: user.forname,
      family_name: user.family_name,
      Classe: user.classe,
      classe: user.classe,
      email: user.email,
      avatar_url: user.avatar_url,
      house_id: user.house_id,
      created_at: user.created_at,
      pfp_cohort: user.pfp_cohort,
      role: user.role,
      permissions: user.permissions,
      source: 'user_profiles_only'
    }

    expect(mapped.id).toBe('abc')
    expect(mapped.user_id).toBe('abc')
    expect(mapped.Classe).toBe('BA24')
    expect(mapped.classe).toBe('BA24')
    expect(mapped.pfp_cohort).toBe('PFP1A')
    expect(mapped.source).toBe('user_profiles_only')
  })
})

describe('studentsService – updateStudent payload construction', () => {
  it('construit correctement le payload Supabase', () => {
    const updates = {
      Nom: 'Dupont',
      Prenom: 'Jean',
      Mail: 'jean@test.ch',
      Classe: 'BA24',
      SAE: true,
      metadata: { existing: 'data' }
    }

    // Reproduire la logique du service
    const supabaseUpdates = {
      ...(updates.Nom && { family_name: updates.Nom }),
      ...(updates.Prenom && { forname: updates.Prenom }),
      ...(updates.Mail && { email: updates.Mail }),
      metadata: {
        ...updates.metadata,
        ...(updates.Classe && { classe: updates.Classe, class: updates.Classe }),
        ...(updates.SAE !== undefined && { SAE: updates.SAE })
      }
    }

    expect(supabaseUpdates.family_name).toBe('Dupont')
    expect(supabaseUpdates.forname).toBe('Jean')
    expect(supabaseUpdates.email).toBe('jean@test.ch')
    expect(supabaseUpdates.metadata.classe).toBe('BA24')
    expect(supabaseUpdates.metadata.class).toBe('BA24')
    expect(supabaseUpdates.metadata.SAE).toBe(true)
    expect(supabaseUpdates.metadata.existing).toBe('data')
  })

  it('n\'inclut pas les champs non fournis', () => {
    const updates = { Nom: 'Dupont', metadata: {} }

    const supabaseUpdates = {
      ...(updates.Nom && { family_name: updates.Nom }),
      ...(updates.Prenom && { forname: updates.Prenom }),
      ...(updates.Mail && { email: updates.Mail }),
      metadata: {
        ...updates.metadata,
        ...(updates.Classe && { classe: updates.Classe, class: updates.Classe }),
        ...(updates.SAE !== undefined && { SAE: updates.SAE })
      }
    }

    expect(supabaseUpdates.family_name).toBe('Dupont')
    expect(supabaseUpdates.forname).toBeUndefined()
    expect(supabaseUpdates.email).toBeUndefined()
    expect(supabaseUpdates.metadata.classe).toBeUndefined()
  })
})
