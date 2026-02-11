import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Logique pure extraite de academicYearService.js ────────────

/**
 * Génère les codes de classes pour une année académique (même logique que le service)
 * @param {number} startYear - Année de départ (ex: 2025)
 * @param {string} modality - 'temps_plein', 'temps_partiel', 'en_emploi'
 * @param {string[]} existingCodes - Codes déjà existants
 * @returns {Array} Classes à créer
 */
const generateClassCodes = (startYear, modality = 'temps_plein', existingCodes = []) => {
  const modalitySuffixes = {
    temps_plein: '',
    temps_partiel: '-PT',
    en_emploi: '-EE'
  }

  const modalityNames = {
    temps_plein: 'Temps plein',
    temps_partiel: 'Temps partiel',
    en_emploi: 'En emploi'
  }

  const suffix = modalitySuffixes[modality] || ''
  const modalityName = modalityNames[modality] || 'Temps plein'
  const existingSet = new Set(existingCodes)

  const classes = []

  for (let level = 1; level <= 3; level++) {
    const classYear = startYear - (level - 1)
    const code = `B${classYear.toString().slice(-2)}${suffix}`

    if (!existingSet.has(code)) {
      classes.push({
        code,
        name: `Bachelor ${classYear} - ${level}${level === 1 ? 'ère' : 'ème'} année (${modalityName})`,
        year_level: level,
        modality
      })
    }
  }

  return classes
}

/**
 * Construit le mapping classe -> année d'étude (même logique que le service)
 * @param {Array} classes - Liste des classes avec code et year_level
 * @returns {Object} Mapping ex: { 'bac25': 1, 'bac24': 2, 'bac23': 3 }
 */
const buildClassYearLevelMapping = (classes) => {
  const mapping = {}
  classes.forEach(classItem => {
    const key = 'bac' + classItem.code.substring(1)
    mapping[key] = classItem.year_level
  })
  return mapping
}

// ── Tests ──────────────────────────────────────────────────────

describe('academicYearService – generateClassCodes', () => {
  it('génère 3 classes pour temps plein', () => {
    const classes = generateClassCodes(2025)
    expect(classes).toHaveLength(3)
    expect(classes[0].code).toBe('B25')
    expect(classes[1].code).toBe('B24')
    expect(classes[2].code).toBe('B23')
  })

  it('attribue les bons niveaux (year_level)', () => {
    const classes = generateClassCodes(2025)
    expect(classes[0].year_level).toBe(1)
    expect(classes[1].year_level).toBe(2)
    expect(classes[2].year_level).toBe(3)
  })

  it('génère les bons noms avec ordinal correct', () => {
    const classes = generateClassCodes(2025)
    expect(classes[0].name).toContain('1ère année')
    expect(classes[1].name).toContain('2ème année')
    expect(classes[2].name).toContain('3ème année')
  })

  it('ajoute le suffixe -PT pour temps partiel', () => {
    const classes = generateClassCodes(2025, 'temps_partiel')
    expect(classes[0].code).toBe('B25-PT')
    expect(classes[1].code).toBe('B24-PT')
    expect(classes[2].code).toBe('B23-PT')
    expect(classes[0].name).toContain('Temps partiel')
  })

  it('ajoute le suffixe -EE pour en emploi', () => {
    const classes = generateClassCodes(2025, 'en_emploi')
    expect(classes[0].code).toBe('B25-EE')
    expect(classes[1].code).toBe('B24-EE')
    expect(classes[2].code).toBe('B23-EE')
    expect(classes[0].name).toContain('En emploi')
  })

  it('exclut les classes déjà existantes', () => {
    const classes = generateClassCodes(2025, 'temps_plein', ['B25'])
    expect(classes).toHaveLength(2)
    expect(classes[0].code).toBe('B24')
    expect(classes[1].code).toBe('B23')
  })

  it('retourne vide si toutes les classes existent déjà', () => {
    const classes = generateClassCodes(2025, 'temps_plein', ['B25', 'B24', 'B23'])
    expect(classes).toHaveLength(0)
  })

  it('gère une année différente (2026)', () => {
    const classes = generateClassCodes(2026)
    expect(classes[0].code).toBe('B26')
    expect(classes[1].code).toBe('B25')
    expect(classes[2].code).toBe('B24')
  })

  it('inclut la modalité dans chaque classe', () => {
    const classes = generateClassCodes(2025, 'temps_partiel')
    classes.forEach(c => {
      expect(c.modality).toBe('temps_partiel')
    })
  })

  it('gère une modalité inconnue avec suffix vide', () => {
    const classes = generateClassCodes(2025, 'inconnu')
    expect(classes[0].code).toBe('B25')
    expect(classes[0].name).toContain('Temps plein') // fallback
  })
})

describe('academicYearService – buildClassYearLevelMapping', () => {
  it('construit le mapping correctement', () => {
    const classes = [
      { code: 'B25', year_level: 1 },
      { code: 'B24', year_level: 2 },
      { code: 'B23', year_level: 3 }
    ]
    const mapping = buildClassYearLevelMapping(classes)
    expect(mapping).toEqual({
      bac25: 1,
      bac24: 2,
      bac23: 3
    })
  })

  it('gère les classes avec suffixe', () => {
    const classes = [
      { code: 'B25-PT', year_level: 1 },
      { code: 'B24-PT', year_level: 2 }
    ]
    const mapping = buildClassYearLevelMapping(classes)
    expect(mapping).toEqual({
      'bac25-PT': 1,
      'bac24-PT': 2
    })
  })

  it('retourne objet vide pour liste vide', () => {
    expect(buildClassYearLevelMapping([])).toEqual({})
  })

  it('gère une seule classe', () => {
    const classes = [{ code: 'B26', year_level: 1 }]
    const mapping = buildClassYearLevelMapping(classes)
    expect(mapping).toEqual({ bac26: 1 })
  })
})

describe('academicYearService – cohérence generate + mapping', () => {
  it('le mapping des classes générées est correct', () => {
    const classes = generateClassCodes(2025)
    const mapping = buildClassYearLevelMapping(classes)
    expect(mapping.bac25).toBe(1)
    expect(mapping.bac24).toBe(2)
    expect(mapping.bac23).toBe(3)
  })

  it('le mapping des classes temps partiel est correct', () => {
    const classes = generateClassCodes(2025, 'temps_partiel')
    const mapping = buildClassYearLevelMapping(classes)
    expect(mapping['bac25-PT']).toBe(1)
    expect(mapping['bac24-PT']).toBe(2)
    expect(mapping['bac23-PT']).toBe(3)
  })
})
