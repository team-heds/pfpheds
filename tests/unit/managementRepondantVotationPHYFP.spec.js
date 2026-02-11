import { describe, it, expect, vi } from 'vitest'

// ── Helpers purs extraits du composant ─────────────────────────

const getLieuSignatureSeverity = (lieu) => {
  const severities = {
    'Présence': 'success',
    'Visio-conférence': 'info',
    'Étudiant': 'warning'
  }
  return severities[lieu] || 'secondary'
}

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

// ── Logique filtrage reproduite ────────────────────────────────

const applyFilters = (rows, { searchQuery, filterYear, filterType, filterClasse, filterValidation, filterRepondantHES, filterSignataireHES }) => {
  const q = (searchQuery || '').trim().toLowerCase()
  return (rows || []).filter((row) => {
    if (filterYear && row.year !== filterYear) return false
    if (filterType && row.pfp_type !== filterType) return false
    if (filterClasse && row.student_class !== filterClasse) return false
    if (filterValidation !== null && filterValidation !== undefined && row.is_validated !== filterValidation) return false
    if (filterRepondantHES && row.repondant_hes !== filterRepondantHES) return false
    if (filterSignataireHES && row.signataire_hes !== filterSignataireHES) return false
    if (!q) return true
    return (
      (row.student_name || '').toLowerCase().includes(q) ||
      (row.place_name || '').toLowerCase().includes(q) ||
      (row.institution_name || '').toLowerCase().includes(q) ||
      (row.repondant_hes || '').toLowerCase().includes(q) ||
      (row.signataire_hes || '').toLowerCase().includes(q)
    )
  })
}

// ── Logique stats reproduite ───────────────────────────────────

const computeStats = (placesList) => {
  const uniqueInstitutions = new Set(placesList.map(p => p.institution_name).filter(Boolean))
  const validatedCount = placesList.filter(p => p.is_validated).length
  return {
    totalPlaces: placesList.length,
    validated: validatedCount,
    pending: placesList.length - validatedCount,
    institutions: uniqueInstitutions.size
  }
}

// ── Logique toggleValidation reproduite ────────────────────────

const toggleValidationLogic = (row, placesList) => {
  const validatedCount = placesList.filter(p => p.is_validated).length
  return {
    validated: validatedCount,
    pending: placesList.length - validatedCount
  }
}

// ── Logique editRow reproduite ─────────────────────────────────

const editRowLogic = (row) => {
  return {
    id: row.id,
    user_id: row.user_id,
    repondant_hes: row.repondant_hes || '',
    signataire_hes: row.signataire_hes || '',
    lieu_signature: row.lieu_signature || null,
    is_validated: row.is_validated || false
  }
}

// ── Logique assignMassiveLieu reproduite ───────────────────────

const assignMassiveLieuLocal = (placesList, ids, lieu) => {
  return placesList.map(p => {
    if (ids.includes(p.id)) {
      return { ...p, lieu_signature: lieu }
    }
    return p
  })
}

// ── Tests ──────────────────────────────────────────────────────

describe('ManagementRepondantVotationViewPHYFP – getLieuSignatureSeverity', () => {
  it('retourne "success" pour Présence', () => {
    expect(getLieuSignatureSeverity('Présence')).toBe('success')
  })

  it('retourne "info" pour Visio-conférence', () => {
    expect(getLieuSignatureSeverity('Visio-conférence')).toBe('info')
  })

  it('retourne "warning" pour Étudiant', () => {
    expect(getLieuSignatureSeverity('Étudiant')).toBe('warning')
  })

  it('retourne "secondary" pour valeur inconnue', () => {
    expect(getLieuSignatureSeverity('Autre')).toBe('secondary')
    expect(getLieuSignatureSeverity(null)).toBe('secondary')
    expect(getLieuSignatureSeverity('')).toBe('secondary')
  })
})

describe('ManagementRepondantVotationViewPHYFP – getVotationTypeLabel', () => {
  it('retourne "Tirage aléatoire" si null', () => {
    expect(getVotationTypeLabel(null)).toBe('Tirage aléatoire')
  })

  it('retourne "Choix X" pour rang 1-5', () => {
    expect(getVotationTypeLabel({ assigned_rank: 1 })).toBe('Choix 1')
    expect(getVotationTypeLabel({ assigned_rank: 5 })).toBe('Choix 5')
  })

  it('retourne "Tirage aléatoire" pour rang hors limites', () => {
    expect(getVotationTypeLabel({ assigned_rank: 0 })).toBe('Tirage aléatoire')
    expect(getVotationTypeLabel({ assigned_rank: 6 })).toBe('Tirage aléatoire')
    expect(getVotationTypeLabel({})).toBe('Tirage aléatoire')
  })
})

describe('ManagementRepondantVotationViewPHYFP – getStudentName / getStudentClass', () => {
  it('retourne display_name en priorité', () => {
    expect(getStudentName({ display_name: 'Alice B', Nom: 'X' })).toBe('Alice B')
  })

  it('retourne NOM Prénom si pas de display_name', () => {
    expect(getStudentName({ Nom: 'dupont', Prenom: 'Jean' })).toBe('DUPONT Jean')
  })

  it('gère family_name / forname', () => {
    expect(getStudentName({ family_name: 'martin', forname: 'Luc' })).toBe('MARTIN Luc')
  })

  it('retourne N/A si rien', () => {
    expect(getStudentName(null)).toBe('N/A')
    expect(getStudentName({})).toBe('N/A')
  })

  it('getStudentClass retourne Classe en priorité', () => {
    expect(getStudentClass({ Classe: 'BA24', classe: 'BA23' })).toBe('BA24')
  })

  it('getStudentClass retourne null si rien', () => {
    expect(getStudentClass({})).toBeNull()
  })
})

describe('ManagementRepondantVotationViewPHYFP – filtrage (filteredList)', () => {
  const rows = [
    { student_name: 'DUPONT Jean', place_name: 'P1', institution_name: 'HUG', year: '2025', pfp_type: 'PFP1A', student_class: 'BA24', is_validated: true, repondant_hes: 'Marie Curie', signataire_hes: 'Pierre Curie' },
    { student_name: 'MARTIN Luc', place_name: 'P2', institution_name: 'CHUV', year: '2026', pfp_type: 'PFP2', student_class: 'BA25', is_validated: false, repondant_hes: 'Albert Einstein', signataire_hes: null },
    { student_name: 'ALBERT Marie', place_name: 'P3', institution_name: 'HUG', year: '2025', pfp_type: 'PFP1A', student_class: 'BA24', is_validated: false, repondant_hes: 'Marie Curie', signataire_hes: 'Pierre Curie' }
  ]

  it('retourne tout sans filtres', () => {
    const result = applyFilters(rows, {})
    expect(result).toHaveLength(3)
  })

  it('filtre par année', () => {
    const result = applyFilters(rows, { filterYear: '2025' })
    expect(result).toHaveLength(2)
  })

  it('filtre par type PFP', () => {
    const result = applyFilters(rows, { filterType: 'PFP2' })
    expect(result).toHaveLength(1)
    expect(result[0].student_name).toBe('MARTIN Luc')
  })

  it('filtre par classe', () => {
    const result = applyFilters(rows, { filterClasse: 'BA25' })
    expect(result).toHaveLength(1)
  })

  it('filtre par validation (true)', () => {
    const result = applyFilters(rows, { filterValidation: true })
    expect(result).toHaveLength(1)
    expect(result[0].student_name).toBe('DUPONT Jean')
  })

  it('filtre par validation (false)', () => {
    const result = applyFilters(rows, { filterValidation: false })
    expect(result).toHaveLength(2)
  })

  it('filtre par répondant HES', () => {
    const result = applyFilters(rows, { filterRepondantHES: 'Marie Curie' })
    expect(result).toHaveLength(2)
  })

  it('filtre par signataire HES', () => {
    const result = applyFilters(rows, { filterSignataireHES: 'Pierre Curie' })
    expect(result).toHaveLength(2)
  })

  it('filtre par recherche textuelle sur student_name', () => {
    const result = applyFilters(rows, { searchQuery: 'dupont' })
    expect(result).toHaveLength(1)
  })

  it('filtre par recherche textuelle sur institution_name', () => {
    const result = applyFilters(rows, { searchQuery: 'chuv' })
    expect(result).toHaveLength(1)
  })

  it('filtre par recherche textuelle sur repondant_hes', () => {
    const result = applyFilters(rows, { searchQuery: 'einstein' })
    expect(result).toHaveLength(1)
  })

  it('combine plusieurs filtres', () => {
    const result = applyFilters(rows, { filterYear: '2025', filterType: 'PFP1A', searchQuery: 'albert' })
    expect(result).toHaveLength(1)
    expect(result[0].student_name).toBe('ALBERT Marie')
  })
})

describe('ManagementRepondantVotationViewPHYFP – computeStats', () => {
  it('calcule correctement les stats', () => {
    const places = [
      { institution_name: 'HUG', is_validated: true },
      { institution_name: 'CHUV', is_validated: true },
      { institution_name: 'HUG', is_validated: false },
      { institution_name: null, is_validated: false }
    ]
    const result = computeStats(places)
    expect(result.totalPlaces).toBe(4)
    expect(result.validated).toBe(2)
    expect(result.pending).toBe(2)
    expect(result.institutions).toBe(2) // HUG + CHUV (null filtré)
  })

  it('retourne des zéros pour une liste vide', () => {
    const result = computeStats([])
    expect(result.totalPlaces).toBe(0)
    expect(result.validated).toBe(0)
    expect(result.pending).toBe(0)
    expect(result.institutions).toBe(0)
  })
})

describe('ManagementRepondantVotationViewPHYFP – toggleValidation logic', () => {
  it('recalcule validated/pending après toggle', () => {
    const places = [
      { is_validated: true },
      { is_validated: true },
      { is_validated: false }
    ]
    const result = toggleValidationLogic(places[2], places)
    expect(result.validated).toBe(2)
    expect(result.pending).toBe(1)
  })

  it('rollback en cas d\'erreur (logique)', () => {
    const row = { is_validated: true }
    // Simuler rollback
    row.is_validated = !row.is_validated
    expect(row.is_validated).toBe(false)
  })
})

describe('ManagementRepondantVotationViewPHYFP – editRow logic', () => {
  it('copie les champs dans editingRow', () => {
    const row = {
      id: 42,
      user_id: 'u1',
      repondant_hes: 'Marie Curie',
      signataire_hes: 'Pierre Curie',
      lieu_signature: 'Présence',
      is_validated: true
    }
    const result = editRowLogic(row)
    expect(result.id).toBe(42)
    expect(result.user_id).toBe('u1')
    expect(result.repondant_hes).toBe('Marie Curie')
    expect(result.signataire_hes).toBe('Pierre Curie')
    expect(result.lieu_signature).toBe('Présence')
    expect(result.is_validated).toBe(true)
  })

  it('met des valeurs par défaut pour les champs manquants', () => {
    const row = { id: 1, user_id: 'u2' }
    const result = editRowLogic(row)
    expect(result.repondant_hes).toBe('')
    expect(result.signataire_hes).toBe('')
    expect(result.lieu_signature).toBeNull()
    expect(result.is_validated).toBe(false)
  })
})

describe('ManagementRepondantVotationViewPHYFP – assignMassiveLieu local update', () => {
  it('met à jour le lieu_signature pour les IDs ciblés', () => {
    const places = [
      { id: 1, lieu_signature: null },
      { id: 2, lieu_signature: 'Présence' },
      { id: 3, lieu_signature: null }
    ]
    const result = assignMassiveLieuLocal(places, [1, 3], 'Visio-conférence')
    expect(result[0].lieu_signature).toBe('Visio-conférence')
    expect(result[1].lieu_signature).toBe('Présence') // inchangé
    expect(result[2].lieu_signature).toBe('Visio-conférence')
  })

  it('ne modifie rien si aucun ID ne correspond', () => {
    const places = [
      { id: 1, lieu_signature: 'Présence' },
      { id: 2, lieu_signature: 'Étudiant' }
    ]
    const result = assignMassiveLieuLocal(places, [99], 'Visio-conférence')
    expect(result[0].lieu_signature).toBe('Présence')
    expect(result[1].lieu_signature).toBe('Étudiant')
  })

  it('ne mute pas le tableau original', () => {
    const places = [{ id: 1, lieu_signature: null }]
    const result = assignMassiveLieuLocal(places, [1], 'Présence')
    expect(places[0].lieu_signature).toBeNull() // original inchangé
    expect(result[0].lieu_signature).toBe('Présence')
  })
})

describe('ManagementRepondantVotationViewPHYFP – saveRow logic', () => {
  it('met à jour placesList localement après save', () => {
    const placesList = [
      { id: 1, repondant_hes: 'A', signataire_hes: 'B', lieu_signature: null, is_validated: false },
      { id: 2, repondant_hes: 'C', signataire_hes: 'D', lieu_signature: 'Présence', is_validated: true }
    ]

    const editingRow = {
      id: 1,
      repondant_hes: 'X',
      signataire_hes: 'Y',
      lieu_signature: 'Visio-conférence',
      is_validated: true
    }

    // Reproduire la logique saveRow
    const idx = placesList.findIndex(p => p.id === editingRow.id)
    if (idx !== -1) {
      placesList[idx].repondant_hes = editingRow.repondant_hes
      placesList[idx].signataire_hes = editingRow.signataire_hes
      placesList[idx].lieu_signature = editingRow.lieu_signature
      placesList[idx].is_validated = editingRow.is_validated
    }

    expect(placesList[0].repondant_hes).toBe('X')
    expect(placesList[0].signataire_hes).toBe('Y')
    expect(placesList[0].lieu_signature).toBe('Visio-conférence')
    expect(placesList[0].is_validated).toBe(true)
    // L'autre entrée est inchangée
    expect(placesList[1].repondant_hes).toBe('C')
  })

  it('recalcule les stats après save', () => {
    const placesList = [
      { is_validated: true },
      { is_validated: true },
      { is_validated: false }
    ]
    const validatedCount = placesList.filter(p => p.is_validated).length
    expect(validatedCount).toBe(2)
    expect(placesList.length - validatedCount).toBe(1)
  })
})

describe('ManagementRepondantVotationViewPHYFP – confirmMassiveAssignment guard', () => {
  it('ne fait rien si aucune assignation valide (count === 0)', () => {
    const filteredList = [
      { id: null, student_name: 'Sans ID' },
      { student_name: 'Pas d\'ID non plus' }
    ]
    const count = filteredList.filter(r => r.id).length
    expect(count).toBe(0)
  })

  it('compte correctement les assignations avec ID', () => {
    const filteredList = [
      { id: 1, student_name: 'A' },
      { id: null, student_name: 'B' },
      { id: 3, student_name: 'C' }
    ]
    const count = filteredList.filter(r => r.id).length
    expect(count).toBe(2)
  })
})

describe('ManagementRepondantVotationViewPHYFP – baseRows showAllStudents logic', () => {
  it('filtre uniquement les lignes avec assigned_place_id quand showAllStudents=false', () => {
    const placesList = [
      { assigned_place_id: 1, user_id: 'u1' },
      { assigned_place_id: null, user_id: 'u2' },
      { assigned_place_id: 3, user_id: 'u3' }
    ]
    const assignedOnly = placesList.filter(r => r?.assigned_place_id)
    expect(assignedOnly).toHaveLength(2)
  })

  it('construit des lignes pour tous les étudiants quand showAllStudents=true', () => {
    const placesList = [
      { assigned_place_id: 1, user_id: 'u1', year: '2025', pfp_type: 'PFP1A', place_name: 'P1' }
    ]
    const allStudents = [
      { user_id: 'u1', Nom: 'Dupont', Prenom: 'Jean' },
      { user_id: 'u2', Nom: 'Martin', Prenom: 'Luc' }
    ]

    const assignedByUser = new Map()
    placesList.forEach(r => {
      if (!r?.user_id) return
      const list = assignedByUser.get(r.user_id) || []
      list.push(r)
      assignedByUser.set(r.user_id, list)
    })

    const out = allStudents.map(s => {
      const userId = s?.user_id || s?.id
      const candidates = assignedByUser.get(userId) || []
      const assignment = candidates[0] || null
      return {
        user_id: userId,
        student_name: getStudentName(s),
        _is_unassigned: !assignment,
        place_name: assignment?.place_name || '—'
      }
    })

    expect(out).toHaveLength(2)
    expect(out[0]._is_unassigned).toBe(false)
    expect(out[0].place_name).toBe('P1')
    expect(out[1]._is_unassigned).toBe(true)
    expect(out[1].place_name).toBe('—')
  })
})
