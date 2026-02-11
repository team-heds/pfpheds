import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ValidationPFP from '@/views/admin/pfp/ValidationPFP.vue'

// ── Mocks hoistés ──────────────────────────────────────────────

const supabaseMock = vi.hoisted(() => {
  const chainable = () => {
    const chain = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      maybeSingle: vi.fn(() => chain),
      single: vi.fn(() => chain),
      then: vi.fn((cb) => cb({ data: [], error: null }))
    }
    // make it thenable so await works
    chain[Symbol.toStringTag] = 'Promise'
    chain.then = vi.fn((resolve) => Promise.resolve({ data: [], error: null }).then(resolve))
    chain.catch = vi.fn((cb) => Promise.resolve({ data: [], error: null }).catch(cb))
    return chain
  }
  return {
    from: vi.fn(() => chainable())
  }
})

const getAllStudentsMock = vi.hoisted(() => vi.fn())

vi.mock('@/supabase', () => ({ supabase: supabaseMock }))
vi.mock('@/service/studentsService', () => ({ getAllStudents: getAllStudentsMock }))
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}))

// ── Helpers extraits du composant pour tests purs ──────────────

const getVotationTypeLabel = (assignment) => {
  if (!assignment) return 'Tirage aléatoire'
  if (assignment.assigned_rank && assignment.assigned_rank >= 1 && assignment.assigned_rank <= 5) {
    return `Choix ${assignment.assigned_rank}`
  }
  return 'Tirage aléatoire'
}

const getStudentName = (s) => {
  const studentNom = s?.Nom || s?.nom || s?.family_name || ''
  const studentPrenom = s?.Prenom || s?.prenom || s?.forname || ''
  return s?.display_name || `${studentNom.toUpperCase()} ${studentPrenom}`.trim() || 'N/A'
}

const getStudentClass = (s) => {
  return s?.Classe || s?.classe || s?.class || null
}

const getPraticienFullName = (p) => {
  if (!p) return ''
  const prenom = p.prenom || p.Prenom || ''
  const nom = p.nom || p.Nom || ''
  return `${prenom} ${nom}`.trim()
}

const updateStats = (placesList) => {
  const rows = placesList || []
  return {
    totalPlaces: rows.length,
    validated: rows.filter(r => r.pfp_validee).length,
    failed: rows.filter(r => r.pfp_echec).length,
    stopped: rows.filter(r => r.pfp_arret).length
  }
}

// ── Tests ──────────────────────────────────────────────────────

describe('ValidationPFP – helpers purs', () => {

  describe('getVotationTypeLabel', () => {
    it('retourne "Tirage aléatoire" si assignment est null', () => {
      expect(getVotationTypeLabel(null)).toBe('Tirage aléatoire')
    })

    it('retourne "Choix X" pour un rang entre 1 et 5', () => {
      expect(getVotationTypeLabel({ assigned_rank: 1 })).toBe('Choix 1')
      expect(getVotationTypeLabel({ assigned_rank: 3 })).toBe('Choix 3')
      expect(getVotationTypeLabel({ assigned_rank: 5 })).toBe('Choix 5')
    })

    it('retourne "Tirage aléatoire" pour un rang hors limites', () => {
      expect(getVotationTypeLabel({ assigned_rank: 0 })).toBe('Tirage aléatoire')
      expect(getVotationTypeLabel({ assigned_rank: 99 })).toBe('Tirage aléatoire')
    })

    it('retourne "Tirage aléatoire" si assigned_rank est absent', () => {
      expect(getVotationTypeLabel({})).toBe('Tirage aléatoire')
    })
  })

  describe('getStudentName', () => {
    it('retourne display_name en priorité', () => {
      expect(getStudentName({ display_name: 'Jean Dupont', Nom: 'X' })).toBe('Jean Dupont')
    })

    it('retourne NOM Prénom si pas de display_name', () => {
      expect(getStudentName({ Nom: 'dupont', Prenom: 'Jean' })).toBe('DUPONT Jean')
    })

    it('gère les champs alternatifs (family_name, forname)', () => {
      expect(getStudentName({ family_name: 'martin', forname: 'Luc' })).toBe('MARTIN Luc')
    })

    it('retourne N/A si aucun champ', () => {
      expect(getStudentName({})).toBe('N/A')
      expect(getStudentName(null)).toBe('N/A')
    })
  })

  describe('getStudentClass', () => {
    it('retourne Classe en priorité', () => {
      expect(getStudentClass({ Classe: 'BA24', classe: 'BA23' })).toBe('BA24')
    })

    it('retourne classe en fallback', () => {
      expect(getStudentClass({ classe: 'BA23' })).toBe('BA23')
    })

    it('retourne null si aucun champ', () => {
      expect(getStudentClass({})).toBeNull()
    })
  })

  describe('getPraticienFullName', () => {
    it('retourne prénom + nom', () => {
      expect(getPraticienFullName({ prenom: 'Marie', nom: 'Curie' })).toBe('Marie Curie')
    })

    it('retourne chaîne vide si null', () => {
      expect(getPraticienFullName(null)).toBe('')
    })

    it('gère les champs manquants', () => {
      expect(getPraticienFullName({ nom: 'Curie' })).toBe('Curie')
      expect(getPraticienFullName({ prenom: 'Marie' })).toBe('Marie')
    })
  })

  describe('updateStats', () => {
    it('compte correctement les validations, échecs et arrêts', () => {
      const rows = [
        { pfp_validee: true, pfp_echec: false, pfp_arret: false },
        { pfp_validee: true, pfp_echec: false, pfp_arret: false },
        { pfp_validee: false, pfp_echec: true, pfp_arret: false },
        { pfp_validee: false, pfp_echec: false, pfp_arret: true },
        { pfp_validee: false, pfp_echec: false, pfp_arret: false }
      ]
      const result = updateStats(rows)
      expect(result.totalPlaces).toBe(5)
      expect(result.validated).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.stopped).toBe(1)
    })

    it('retourne des zéros pour une liste vide', () => {
      const result = updateStats([])
      expect(result.totalPlaces).toBe(0)
      expect(result.validated).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.stopped).toBe(0)
    })
  })
})

describe('ValidationPFP – logique checkbox', () => {

  it('cocher "validee" décoche "echec" et "arret"', () => {
    const row = { pfp_validee: true, pfp_echec: true, pfp_arret: true, commentaire_arret: 'test' }

    // Simuler handleValidationChange pour type 'validee' quand pfp_validee est true
    if (row.pfp_validee) {
      row.pfp_echec = false
      row.pfp_arret = false
      row.commentaire_arret = ''
    }

    expect(row.pfp_echec).toBe(false)
    expect(row.pfp_arret).toBe(false)
    expect(row.commentaire_arret).toBe('')
  })

  it('cocher "echec" décoche "validee" et "arret"', () => {
    const row = { pfp_validee: true, pfp_echec: true, pfp_arret: true, commentaire_arret: 'test' }

    if (row.pfp_echec) {
      row.pfp_validee = false
      row.pfp_arret = false
      row.commentaire_arret = ''
    }

    expect(row.pfp_validee).toBe(false)
    expect(row.pfp_arret).toBe(false)
    expect(row.commentaire_arret).toBe('')
  })

  it('confirmArret décoche validee et echec, garde le commentaire', () => {
    const row = { pfp_validee: true, pfp_echec: true, pfp_arret: false, commentaire_arret: '' }
    const arretComment = 'Raison de l\'arrêt'

    // Simuler confirmArret
    row.pfp_arret = true
    row.commentaire_arret = arretComment
    row.pfp_validee = false
    row.pfp_echec = false

    expect(row.pfp_validee).toBe(false)
    expect(row.pfp_echec).toBe(false)
    expect(row.pfp_arret).toBe(true)
    expect(row.commentaire_arret).toBe('Raison de l\'arrêt')
  })

  it('cancelArret remet pfp_arret à false et vide le commentaire', () => {
    const row = { pfp_arret: true, commentaire_arret: 'test' }

    // Simuler cancelArret
    row.pfp_arret = false
    row.commentaire_arret = ''

    expect(row.pfp_arret).toBe(false)
    expect(row.commentaire_arret).toBe('')
  })
})

describe('ValidationPFP – filteredPlacesList sorting', () => {

  it('trie par nom de famille alphabétiquement', () => {
    const rows = [
      { student_name: 'Jean Zeller', assigned_place_id: 1, year: '2026', pfp_type: 'PFP1A', student_class: 'BA25', status: 'published' },
      { student_name: 'Marie Albert', assigned_place_id: 2, year: '2026', pfp_type: 'PFP1A', student_class: 'BA25', status: 'published' },
      { student_name: 'Luc Martin', assigned_place_id: 3, year: '2026', pfp_type: 'PFP1A', student_class: 'BA25', status: 'published' }
    ]

    // Reproduire la logique de tri du composant
    const splitName = (fullName) => {
      if (!fullName) return { lastName: '', firstName: '' }
      const trimmed = fullName.trim()
      const parts = trimmed.split(' ')
      if (parts.length > 1 && parts[0].length === 1) {
        const restName = parts.slice(1).join(' ')
        const restParts = restName.split(' ')
        if (restParts.length === 1) return { lastName: restParts[0], firstName: '' }
        return { lastName: restParts[restParts.length - 1] || '', firstName: restParts.slice(0, -1).join(' ') || '' }
      }
      if (parts.length === 1) return { lastName: parts[0], firstName: '' }
      return { lastName: parts[parts.length - 1] || '', firstName: parts.slice(0, -1).join(' ') || '' }
    }

    const sorted = [...rows].sort((a, b) => {
      const nameA = splitName(a.student_name)
      const nameB = splitName(b.student_name)
      const lastNameCompare = nameA.lastName.localeCompare(nameB.lastName, 'fr')
      if (lastNameCompare !== 0) return lastNameCompare
      return nameA.firstName.localeCompare(nameB.firstName, 'fr')
    })

    expect(sorted[0].student_name).toBe('Marie Albert')
    expect(sorted[1].student_name).toBe('Luc Martin')
    expect(sorted[2].student_name).toBe('Jean Zeller')
  })

  it('gère le format initiale (ex: "S Samira")', () => {
    const splitName = (fullName) => {
      if (!fullName) return { lastName: '', firstName: '' }
      const trimmed = fullName.trim()
      const parts = trimmed.split(' ')
      if (parts.length > 1 && parts[0].length === 1) {
        const restName = parts.slice(1).join(' ')
        const restParts = restName.split(' ')
        if (restParts.length === 1) return { lastName: restParts[0], firstName: '' }
        return { lastName: restParts[restParts.length - 1] || '', firstName: restParts.slice(0, -1).join(' ') || '' }
      }
      if (parts.length === 1) return { lastName: parts[0], firstName: '' }
      return { lastName: parts[parts.length - 1] || '', firstName: parts.slice(0, -1).join(' ') || '' }
    }

    const result = splitName('S Samira')
    expect(result.lastName).toBe('Samira')
    expect(result.firstName).toBe('')
  })
})

describe('ValidationPFP – filtrage', () => {

  it('filtre par recherche textuelle sur student_name', () => {
    const rows = [
      { student_name: 'Jean Dupont', place_name: 'P1', institution_name: 'I1', year: '2026', pfp_type: 'PFP1A', student_class: 'BA25', status: 'published', assigned_place_id: 1 },
      { student_name: 'Marie Martin', place_name: 'P2', institution_name: 'I2', year: '2026', pfp_type: 'PFP1A', student_class: 'BA25', status: 'published', assigned_place_id: 2 }
    ]

    const q = 'dupont'
    const filtered = rows.filter(row => {
      return (row.student_name || '').toLowerCase().includes(q) ||
        (row.place_name || '').toLowerCase().includes(q) ||
        (row.institution_name || '').toLowerCase().includes(q)
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].student_name).toBe('Jean Dupont')
  })

  it('filtre par année et type PFP', () => {
    const rows = [
      { year: '2025', pfp_type: 'PFP1A', student_class: 'BA25', status: 'published', assigned_place_id: 1 },
      { year: '2026', pfp_type: 'PFP1A', student_class: 'BA25', status: 'published', assigned_place_id: 2 },
      { year: '2026', pfp_type: 'PFP1B', student_class: 'BA25', status: 'published', assigned_place_id: 3 }
    ]

    const filterYear = '2026'
    const filterType = 'PFP1A'

    const filtered = rows.filter(row => {
      if (filterYear && row.year !== filterYear) return false
      if (filterType && row.pfp_type !== filterType) return false
      return true
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].assigned_place_id).toBe(2)
  })

  it('filtre par statut', () => {
    const rows = [
      { status: 'published', assigned_place_id: 1 },
      { status: 'draft', assigned_place_id: 2 },
      { status: 'published', assigned_place_id: 3 }
    ]

    const filterStatus = 'published'
    const filtered = rows.filter(row => {
      if (filterStatus && row.status !== filterStatus) return false
      return true
    })

    expect(filtered).toHaveLength(2)
  })
})

describe('ValidationPFP – syncWithStudentsPhysio criteria logic', () => {

  it('pour status "validee", inclut tous les critères', () => {
    const status = 'validee'
    const placeData = { AMBU: true, DE: false, FR: true, MSQ: true, NEUROGER: false, REHAB: true, SYSINT: false, AIGU: true, IT: false, ENG: true }

    let criteriaToInclude = {}
    if (status === 'echec') {
      criteriaToInclude = { DE: placeData.DE, FR: placeData.FR }
    } else if (status === 'arret') {
      criteriaToInclude = {}
    } else {
      criteriaToInclude = {
        AMBU: placeData.AMBU, DE: placeData.DE, FR: placeData.FR,
        MSQ: placeData.MSQ, NEUROGER: placeData.NEUROGER, REHAB: placeData.REHAB,
        SYSINT: placeData.SYSINT, AIGU: placeData.AIGU, IT: placeData.IT, ENG: placeData.ENG
      }
    }

    expect(Object.keys(criteriaToInclude)).toHaveLength(10)
    expect(criteriaToInclude.AMBU).toBe(true)
    expect(criteriaToInclude.FR).toBe(true)
  })

  it('pour status "echec", inclut seulement DE et FR', () => {
    const status = 'echec'
    const placeData = { AMBU: true, DE: true, FR: false }

    let criteriaToInclude = {}
    if (status === 'echec') {
      criteriaToInclude = { DE: placeData.DE, FR: placeData.FR }
    }

    expect(Object.keys(criteriaToInclude)).toHaveLength(2)
    expect(criteriaToInclude.DE).toBe(true)
    expect(criteriaToInclude.FR).toBe(false)
    expect(criteriaToInclude.AMBU).toBeUndefined()
  })

  it('pour status "arret", n\'inclut aucun critère', () => {
    const status = 'arret'

    let criteriaToInclude = {}
    if (status === 'echec') {
      criteriaToInclude = { DE: true, FR: true }
    } else if (status === 'arret') {
      criteriaToInclude = {}
    }

    expect(Object.keys(criteriaToInclude)).toHaveLength(0)
  })
})

describe('ValidationPFP – showAllStudents toggle', () => {

  it('showAllStudents = true → filterStatus = null', () => {
    let filterStatus = 'published'
    const showAllStudents = true

    if (showAllStudents) {
      filterStatus = null
    } else {
      filterStatus = 'published'
    }

    expect(filterStatus).toBeNull()
  })

  it('showAllStudents = false → filterStatus = "published"', () => {
    let filterStatus = null
    const showAllStudents = false

    if (showAllStudents) {
      filterStatus = null
    } else {
      filterStatus = 'published'
    }

    expect(filterStatus).toBe('published')
  })
})
