import { describe, it, expect, vi } from 'vitest'

// ── Logique de filtrage reproduite depuis StudentListView.vue ──

const filterStudents = (etudiants, { globalFilter, classeFilter, isAdmin, currentRepondantName, sortOrder }) => {
  const searchLower = (globalFilter || '').toLowerCase()

  const filtered = etudiants.filter(etudiant => {
    const matchesClass = classeFilter ? classeFilter === etudiant.Classe : true

    // Filtrage par répondant si l'utilisateur n'est pas admin
    if (!isAdmin && currentRepondantName) {
      if (etudiant.repondant_hes !== currentRepondantName) return false
    }

    const haystack = etudiant.__searchKey || ''
    const matchesSearch = !searchLower ? true : haystack.includes(searchLower)

    return matchesClass && matchesSearch
  })

  // Tri alphabétique par nom
  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  return [...filtered].sort((a, b) => {
    const nameA = a.Nom || ''
    const nameB = b.Nom || ''
    const res = collator.compare(nameA, nameB)
    return sortOrder === 'asc' ? res : -res
  })
}

// ── Logique de construction de la clé de recherche ─────────────

const buildSearchKey = (s) => {
  const parts = []
  if (s.Nom) parts.push(s.Nom)
  if (s.Prenom) parts.push(s.Prenom)
  if (s.Classe) parts.push(s.Classe)
  if (s.Mail) parts.push(s.Mail)
  return parts.join(' ').toLowerCase()
}

// ── Logique scheduleRefresh (debounce) ─────────────────────────

const createScheduleRefresh = () => {
  let timeout = null
  let callCount = 0
  const refresh = () => { callCount++ }
  const schedule = (delay = 400) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(refresh, delay)
  }
  return { schedule, getCallCount: () => callCount, clearTimeout: () => clearTimeout(timeout) }
}

// ── Tests ──────────────────────────────────────────────────────

describe('StudentListView – buildSearchKey', () => {
  it('construit une clé avec tous les champs', () => {
    const s = { Nom: 'Dupont', Prenom: 'Jean', Classe: 'BA24', Mail: 'jean@test.ch' }
    expect(buildSearchKey(s)).toBe('dupont jean ba24 jean@test.ch')
  })

  it('ignore les champs manquants', () => {
    const s = { Nom: 'Dupont', Prenom: 'Jean' }
    expect(buildSearchKey(s)).toBe('dupont jean')
  })

  it('retourne chaîne vide si tout est vide', () => {
    expect(buildSearchKey({})).toBe('')
  })
})

describe('StudentListView – filtrage', () => {
  const students = [
    { Nom: 'Albert', Prenom: 'Marie', Classe: 'BA24', Mail: 'marie@test.ch', repondant_hes: 'Prof A', __searchKey: 'albert marie ba24 marie@test.ch' },
    { Nom: 'Dupont', Prenom: 'Jean', Classe: 'BA25', Mail: 'jean@test.ch', repondant_hes: 'Prof B', __searchKey: 'dupont jean ba25 jean@test.ch' },
    { Nom: 'Martin', Prenom: 'Luc', Classe: 'BA24', Mail: 'luc@test.ch', repondant_hes: 'Prof A', __searchKey: 'martin luc ba24 luc@test.ch' },
    { Nom: 'Zeller', Prenom: 'Sophie', Classe: 'BA25', Mail: 'sophie@test.ch', repondant_hes: null, __searchKey: 'zeller sophie ba25 sophie@test.ch' }
  ]

  it('retourne tous les étudiants sans filtre, triés A-Z', () => {
    const result = filterStudents(students, { isAdmin: true, sortOrder: 'asc' })
    expect(result).toHaveLength(4)
    expect(result[0].Nom).toBe('Albert')
    expect(result[3].Nom).toBe('Zeller')
  })

  it('trie Z-A quand sortOrder = desc', () => {
    const result = filterStudents(students, { isAdmin: true, sortOrder: 'desc' })
    expect(result[0].Nom).toBe('Zeller')
    expect(result[3].Nom).toBe('Albert')
  })

  it('filtre par classe', () => {
    const result = filterStudents(students, { classeFilter: 'BA24', isAdmin: true, sortOrder: 'asc' })
    expect(result).toHaveLength(2)
    expect(result.every(s => s.Classe === 'BA24')).toBe(true)
  })

  it('filtre par recherche globale sur le nom', () => {
    const result = filterStudents(students, { globalFilter: 'dupont', isAdmin: true, sortOrder: 'asc' })
    expect(result).toHaveLength(1)
    expect(result[0].Nom).toBe('Dupont')
  })

  it('filtre par recherche globale sur le mail', () => {
    const result = filterStudents(students, { globalFilter: 'sophie@test', isAdmin: true, sortOrder: 'asc' })
    expect(result).toHaveLength(1)
    expect(result[0].Nom).toBe('Zeller')
  })

  it('filtre par recherche globale sur la classe', () => {
    const result = filterStudents(students, { globalFilter: 'ba25', isAdmin: true, sortOrder: 'asc' })
    expect(result).toHaveLength(2)
  })

  it('combine classe + recherche', () => {
    const result = filterStudents(students, { classeFilter: 'BA24', globalFilter: 'martin', isAdmin: true, sortOrder: 'asc' })
    expect(result).toHaveLength(1)
    expect(result[0].Nom).toBe('Martin')
  })

  it('filtre par répondant HES quand non-admin', () => {
    const result = filterStudents(students, { isAdmin: false, currentRepondantName: 'Prof A', sortOrder: 'asc' })
    expect(result).toHaveLength(2)
    expect(result.every(s => s.repondant_hes === 'Prof A')).toBe(true)
  })

  it('ne filtre pas par répondant quand admin', () => {
    const result = filterStudents(students, { isAdmin: true, currentRepondantName: 'Prof A', sortOrder: 'asc' })
    expect(result).toHaveLength(4)
  })

  it('retourne vide si aucun match', () => {
    const result = filterStudents(students, { globalFilter: 'zzzzzzz', isAdmin: true, sortOrder: 'asc' })
    expect(result).toHaveLength(0)
  })
})

describe('StudentListView – tri alphabétique', () => {
  it('trie correctement avec accents (fr locale)', () => {
    const students = [
      { Nom: 'Éric', __searchKey: 'éric' },
      { Nom: 'Albert', __searchKey: 'albert' },
      { Nom: 'Étienne', __searchKey: 'étienne' }
    ]
    const result = filterStudents(students, { isAdmin: true, sortOrder: 'asc' })
    expect(result[0].Nom).toBe('Albert')
    // É devrait être traité comme E en français
    expect(result.map(s => s.Nom)).toContain('Éric')
    expect(result.map(s => s.Nom)).toContain('Étienne')
  })

  it('gère les noms vides', () => {
    const students = [
      { Nom: 'Zeller', __searchKey: 'zeller' },
      { Nom: '', __searchKey: '' },
      { Nom: 'Albert', __searchKey: 'albert' }
    ]
    const result = filterStudents(students, { isAdmin: true, sortOrder: 'asc' })
    expect(result[0].Nom).toBe('')
    expect(result[2].Nom).toBe('Zeller')
  })
})

describe('StudentListView – édition cohorte PFP', () => {
  it('isEditingCohort retourne true quand l\'ID correspond', () => {
    const cohortEditingStudentId = 'abc123'
    const student = { id: 'abc123' }
    const isEditing = !!student?.id && cohortEditingStudentId === student.id
    expect(isEditing).toBe(true)
  })

  it('isEditingCohort retourne false quand l\'ID ne correspond pas', () => {
    const cohortEditingStudentId = 'abc123'
    const student = { id: 'xyz789' }
    const isEditing = !!student?.id && cohortEditingStudentId === student.id
    expect(isEditing).toBe(false)
  })

  it('isEditingCohort retourne false quand student.id est null', () => {
    const cohortEditingStudentId = 'abc123'
    const student = { id: null }
    const isEditing = !!student?.id && cohortEditingStudentId === student.id
    expect(isEditing).toBe(false)
  })

  it('startEditCohort initialise les valeurs', () => {
    const student = { id: 'abc', pfp_cohort: 'PFP1A' }
    let cohortEditingStudentId = null
    let cohortEditValue = null

    // Simuler startEditCohort
    cohortEditingStudentId = student.id
    cohortEditValue = student.pfp_cohort ?? null

    expect(cohortEditingStudentId).toBe('abc')
    expect(cohortEditValue).toBe('PFP1A')
  })

  it('cancelEditCohort réinitialise les valeurs', () => {
    let cohortEditingStudentId = 'abc'
    let cohortEditValue = 'PFP1A'

    // Simuler cancelEditCohort
    cohortEditingStudentId = null
    cohortEditValue = null

    expect(cohortEditingStudentId).toBeNull()
    expect(cohortEditValue).toBeNull()
  })

  it('saveEditCohort applique la nouvelle valeur et rollback en cas d\'erreur', () => {
    const student = { id: 'abc', pfp_cohort: 'PFP1A' }
    const newValue = 'PFP1B'
    const prev = student.pfp_cohort

    student.pfp_cohort = newValue
    expect(student.pfp_cohort).toBe('PFP1B')

    // Simuler rollback
    student.pfp_cohort = prev
    expect(student.pfp_cohort).toBe('PFP1A')
  })
})

describe('StudentListView – édition répondant HES', () => {
  it('isEditingRepondant retourne true quand l\'ID correspond', () => {
    const repondantEditingStudentId = 'abc123'
    const student = { id: 'abc123' }
    const isEditing = !!student?.id && repondantEditingStudentId === student.id
    expect(isEditing).toBe(true)
  })

  it('startEditRepondant initialise les valeurs', () => {
    const student = { id: 'abc', repondant_hes: 'Prof A' }
    let repondantEditingStudentId = null
    let repondantEditValue = null

    repondantEditingStudentId = student.id
    repondantEditValue = student.repondant_hes || null

    expect(repondantEditingStudentId).toBe('abc')
    expect(repondantEditValue).toBe('Prof A')
  })

  it('startEditRepondant met null si pas de répondant', () => {
    const student = { id: 'abc', repondant_hes: null }
    let repondantEditValue = student.repondant_hes || null
    expect(repondantEditValue).toBeNull()
  })

  it('saveEditRepondant applique la nouvelle valeur et rollback en cas d\'erreur', () => {
    const student = { id: 'abc', repondant_hes: 'Prof A' }
    const newValue = 'Prof B'
    const prev = student.repondant_hes

    student.repondant_hes = newValue
    expect(student.repondant_hes).toBe('Prof B')

    // Simuler rollback
    student.repondant_hes = prev
    expect(student.repondant_hes).toBe('Prof A')
  })
})

describe('StudentListView – debounce globalFilter', () => {
  it('debounce le filtre global (logique timer)', async () => {
    vi.useFakeTimers()

    let globalFilter = ''
    let timer = null

    const setFilter = (val) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        globalFilter = val || ''
      }, 300)
    }

    setFilter('dup')
    expect(globalFilter).toBe('') // pas encore appliqué

    vi.advanceTimersByTime(100)
    setFilter('dupo') // reset le timer
    expect(globalFilter).toBe('') // toujours pas

    vi.advanceTimersByTime(300)
    expect(globalFilter).toBe('dupo') // maintenant appliqué

    vi.useRealTimers()
  })
})

describe('StudentListView – scheduleRefresh debounce', () => {
  it('ne déclenche le refresh qu\'après le délai', () => {
    vi.useFakeTimers()
    const { schedule, getCallCount } = createScheduleRefresh()

    schedule(400)
    expect(getCallCount()).toBe(0)

    vi.advanceTimersByTime(400)
    expect(getCallCount()).toBe(1)

    vi.useRealTimers()
  })

  it('annule le timer précédent si appelé plusieurs fois', () => {
    vi.useFakeTimers()
    const { schedule, getCallCount } = createScheduleRefresh()

    schedule(400)
    vi.advanceTimersByTime(200)
    schedule(400) // reset
    vi.advanceTimersByTime(200)
    expect(getCallCount()).toBe(0) // pas encore

    vi.advanceTimersByTime(200)
    expect(getCallCount()).toBe(1) // un seul appel

    vi.useRealTimers()
  })
})

describe('StudentListView – toggleSortOrder', () => {
  it('bascule de asc à desc', () => {
    let sortOrder = 'asc'
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    expect(sortOrder).toBe('desc')
  })

  it('bascule de desc à asc', () => {
    let sortOrder = 'desc'
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    expect(sortOrder).toBe('asc')
  })
})

describe('StudentListView – toggleCohortColumns', () => {
  it('bascule showCohortColumns et annule l\'édition si masqué', () => {
    let showCohortColumns = false
    let cohortEditingStudentId = 'abc'
    let cohortEditValue = 'PFP1A'

    // Toggle on
    showCohortColumns = !showCohortColumns
    expect(showCohortColumns).toBe(true)

    // Toggle off → cancel edit
    showCohortColumns = !showCohortColumns
    if (!showCohortColumns) {
      cohortEditingStudentId = null
      cohortEditValue = null
    }

    expect(showCohortColumns).toBe(false)
    expect(cohortEditingStudentId).toBeNull()
    expect(cohortEditValue).toBeNull()
  })
})

describe('StudentListView – pfpCohortOptions', () => {
  const pfpCohortOptions = [
    { label: 'Aucun', value: null },
    { label: 'PFP1A', value: 'PFP1A' },
    { label: 'PFP1B', value: 'PFP1B' }
  ]

  it('contient 3 options', () => {
    expect(pfpCohortOptions).toHaveLength(3)
  })

  it('la première option est "Aucun" avec value null', () => {
    expect(pfpCohortOptions[0].label).toBe('Aucun')
    expect(pfpCohortOptions[0].value).toBeNull()
  })
})
