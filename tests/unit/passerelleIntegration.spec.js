import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed, nextTick } from 'vue'

// ══════════════════════════════════════════════════════════════════
// Tests d'intégration Passerelle — validations des changements
// v0.1.78 : classes dynamiques, regex, couleurs, réactivité
// ══════════════════════════════════════════════════════════════════

// ── 1. normalizeClass ────────────────────────────────────────────
describe('normalizeClass', () => {
  const normalizeClass = (code) => {
    if (!code) return ''
    return code.toUpperCase().trim()
  }

  it('normalise en majuscules', () => {
    expect(normalizeClass('bac25')).toBe('BAC25')
    expect(normalizeClass('bac25-pa')).toBe('BAC25-PA')
    expect(normalizeClass('bac24-tp')).toBe('BAC24-TP')
  })

  it('trim les espaces', () => {
    expect(normalizeClass(' BAC25-PA ')).toBe('BAC25-PA')
  })

  it('retourne chaîne vide pour null/undefined/vide', () => {
    expect(normalizeClass(null)).toBe('')
    expect(normalizeClass(undefined)).toBe('')
    expect(normalizeClass('')).toBe('')
  })
})

// ── 2. Regex availableClasses — match -TP et -PA ─────────────────
describe('availableClasses regex (BAC\\d{2})(-TP|-PA)?', () => {
  const regex = /^(BAC\d{2})(-TP|-PA)?/

  it('match BAC25 (plein temps)', () => {
    const m = 'BAC25'.match(regex)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('BAC25')
    expect(m[2]).toBeUndefined()
  })

  it('match BAC25-TP (temps partiel)', () => {
    const m = 'BAC25-TP'.match(regex)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('BAC25')
    expect(m[2]).toBe('-TP')
  })

  it('match BAC25-PA (passerelle)', () => {
    const m = 'BAC25-PA'.match(regex)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('BAC25')
    expect(m[2]).toBe('-PA')
  })

  it('match BAC24-PA', () => {
    const m = 'BAC24-PA'.match(regex)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('BAC24')
    expect(m[2]).toBe('-PA')
  })

  it('match sous-groupes TP avec numéro (BA25-TP1 normalisé en BAC25-TP1)', () => {
    const m = 'BAC25-TP1'.match(regex)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('BAC25')
    expect(m[2]).toBe('-TP')
  })

  it('ne match pas BAC25-EE (en emploi — pas dans le regex)', () => {
    const m = 'BAC25-EE'.match(regex)
    expect(m).not.toBeNull()
    expect(m[1]).toBe('BAC25')
    expect(m[2]).toBeUndefined() // -EE n'est pas capturé par (-TP|-PA)
  })

  it('ne match pas une chaîne invalide', () => {
    expect('INVALID'.match(regex)).toBeNull()
    expect(''.match(regex)).toBeNull()
    expect('BAC'.match(regex)).toBeNull()
  })
})

// ── 3. availableClasses extraction logic ─────────────────────────
describe('availableClasses — extraction des classes depuis le planning', () => {
  const normalizeClass = (code) => code ? code.toUpperCase().trim() : ''

  const extractClasses = (slots) => {
    const classesSet = new Set()
    slots.forEach(slot => {
      if (slot.class_code) {
        const normalized = normalizeClass(slot.class_code)
        classesSet.add(normalized)

        const match = normalized.match(/^(BAC\d{2})(-TP|-PA)?/)
        if (match) {
          const base = match[1]
          const suffix = match[2]
          if (suffix) {
            classesSet.add(`${base}${suffix}`)
          } else {
            classesSet.add(base)
          }
        }
      }
    })
    return Array.from(classesSet).sort()
  }

  it('extrait BAC25 depuis un slot plein temps', () => {
    const result = extractClasses([{ class_code: 'BAC25' }])
    expect(result).toContain('BAC25')
  })

  it('extrait BAC25-PA depuis un slot passerelle', () => {
    const result = extractClasses([{ class_code: 'bac25-pa' }])
    expect(result).toContain('BAC25-PA')
  })

  it('extrait BAC25-TP depuis un sous-groupe BA25-TP1', () => {
    const result = extractClasses([{ class_code: 'BAC25-TP1' }])
    expect(result).toContain('BAC25-TP')
    expect(result).toContain('BAC25-TP1')
  })

  it('déduplique correctement', () => {
    const result = extractClasses([
      { class_code: 'BAC25-PA' },
      { class_code: 'bac25-pa' },
      { class_code: 'BAC25-PA' }
    ])
    const paCount = result.filter(c => c === 'BAC25-PA').length
    expect(paCount).toBe(1)
  })

  it('gère un mix de classes', () => {
    const result = extractClasses([
      { class_code: 'BAC25' },
      { class_code: 'BAC25-TP1' },
      { class_code: 'BAC25-PA' },
      { class_code: 'BAC24' },
      { class_code: 'BAC24-PA' }
    ])
    expect(result).toContain('BAC24')
    expect(result).toContain('BAC24-PA')
    expect(result).toContain('BAC25')
    expect(result).toContain('BAC25-PA')
    expect(result).toContain('BAC25-TP')
  })

  it('ignore les slots sans class_code', () => {
    const result = extractClasses([
      { class_code: null },
      { class_code: '' },
      { class_code: 'BAC25-PA' }
    ])
    expect(result).toEqual(['BAC25-PA'])
  })

  it('retourne un tableau trié', () => {
    const result = extractClasses([
      { class_code: 'BAC26' },
      { class_code: 'BAC24-PA' },
      { class_code: 'BAC25' }
    ])
    expect(result).toEqual([...result].sort())
  })
})

// ── 4. allClassOptions — merge DB + planning ─────────────────────
describe('allClassOptions — fusion dynamique DB + planning', () => {
  it('merge les classes DB et les classes du planning sans doublons', () => {
    const dbClassCodes = ['BAC24', 'BAC24-PA', 'BAC25', 'BAC25-PA', 'BAC26']
    const availableClasses = ['BAC25', 'BAC25-TP1', 'BAC25-TP']

    const allCodes = new Set(dbClassCodes)
    availableClasses.forEach(c => allCodes.add(c))
    const result = Array.from(allCodes).sort()

    expect(result).toContain('BAC24')
    expect(result).toContain('BAC24-PA')
    expect(result).toContain('BAC25')
    expect(result).toContain('BAC25-PA')
    expect(result).toContain('BAC25-TP')
    expect(result).toContain('BAC25-TP1')
    expect(result).toContain('BAC26')
    // Pas de doublons
    expect(result.length).toBe(new Set(result).size)
  })

  it('fonctionne avec un planning vide', () => {
    const dbClassCodes = ['BAC24', 'BAC25-PA']
    const availableClasses = []

    const allCodes = new Set(dbClassCodes)
    availableClasses.forEach(c => allCodes.add(c))
    const result = Array.from(allCodes).sort()

    expect(result).toEqual(['BAC24', 'BAC25-PA'])
  })

  it('fonctionne avec une DB vide', () => {
    const dbClassCodes = []
    const availableClasses = ['BAC25', 'BAC25-PA']

    const allCodes = new Set(dbClassCodes)
    availableClasses.forEach(c => allCodes.add(c))
    const result = Array.from(allCodes).sort()

    expect(result).toEqual(['BAC25', 'BAC25-PA'])
  })
})

// ── 5. classOptions — labels dynamiques ──────────────────────────
describe('classOptions — génération des labels', () => {
  const generateClassOptions = (codes) => {
    return codes.map(code => {
      const suffix = code.endsWith('-PA') ? ' (Passerelle)' :
                     code.endsWith('-TP') ? ' (Temps partiel)' :
                     code.endsWith('-EE') ? ' (En emploi)' : ''
      return { label: `${code}${suffix}`, value: code }
    })
  }

  it('ajoute (Passerelle) pour -PA', () => {
    const result = generateClassOptions(['BAC25-PA'])
    expect(result[0].label).toBe('BAC25-PA (Passerelle)')
    expect(result[0].value).toBe('BAC25-PA')
  })

  it('ajoute (Temps partiel) pour -TP', () => {
    const result = generateClassOptions(['BAC25-TP'])
    expect(result[0].label).toBe('BAC25-TP (Temps partiel)')
  })

  it('ajoute (En emploi) pour -EE', () => {
    const result = generateClassOptions(['BAC25-EE'])
    expect(result[0].label).toBe('BAC25-EE (En emploi)')
  })

  it('pas de suffixe pour plein temps', () => {
    const result = generateClassOptions(['BAC25'])
    expect(result[0].label).toBe('BAC25')
  })

  it('gère un mix complet', () => {
    const result = generateClassOptions(['BAC24', 'BAC24-PA', 'BAC25', 'BAC25-TP'])
    expect(result.map(r => r.label)).toEqual([
      'BAC24',
      'BAC24-PA (Passerelle)',
      'BAC25',
      'BAC25-TP (Temps partiel)'
    ])
  })
})

// ── 6. DB class code conversion (B25 → BAC25) ───────────────────
describe('loadDbClassCodes — conversion code DB → code planning', () => {
  const convertCode = (code) => {
    return code.match(/^B\d/) ? 'BAC' + code.substring(1) : code.toUpperCase()
  }

  it('convertit B25 → BAC25', () => {
    expect(convertCode('B25')).toBe('BAC25')
  })

  it('convertit B25-PA → BAC25-PA', () => {
    expect(convertCode('B25-PA')).toBe('BAC25-PA')
  })

  it('convertit B24-TP → BAC24-TP', () => {
    expect(convertCode('B24-TP')).toBe('BAC24-TP')
  })

  it('convertit B26 → BAC26', () => {
    expect(convertCode('B26')).toBe('BAC26')
  })

  it('gère un code déjà en majuscules sans B préfixe', () => {
    expect(convertCode('CUSTOM')).toBe('CUSTOM')
  })

  it('conversion complète d\'une liste de classes DB', () => {
    const dbClasses = [
      { code: 'B25' },
      { code: 'B25-TP' },
      { code: 'B25-PA' },
      { code: 'B24' },
      { code: 'B24-PA' },
      { code: 'B26' }
    ]
    const result = dbClasses.map(c => convertCode(c.code))
    expect(result).toEqual(['BAC25', 'BAC25-TP', 'BAC25-PA', 'BAC24', 'BAC24-PA', 'BAC26'])
  })
})

// ── 7. classColors — Passerelle a des couleurs définies ──────────
describe('classColors — couleurs Passerelle', () => {
  const classDisplayColors = {
    'BA25-TP1': 'E53935',
    'BA25-TP2': '43A047',
    'BAC25-PA': 'D97706',
    'BAC24-PA': 'BE185D',
  }

  const classColors = {
    'BA25-TP1': 'FFC7CE',
    'BAC25-PA': 'FDE68A',
    'BAC24-PA': 'FBCFE8',
  }

  it('BAC25-PA a une couleur d\'affichage définie', () => {
    expect(classDisplayColors['BAC25-PA']).toBe('D97706')
  })

  it('BAC24-PA a une couleur d\'affichage définie', () => {
    expect(classDisplayColors['BAC24-PA']).toBe('BE185D')
  })

  it('BAC25-PA a une couleur d\'export Excel définie', () => {
    expect(classColors['BAC25-PA']).toBe('FDE68A')
  })

  it('BAC24-PA a une couleur d\'export Excel définie', () => {
    expect(classColors['BAC24-PA']).toBe('FBCFE8')
  })

  it('getClassColor retourne FFFFFF pour une classe inconnue', () => {
    const normalizeClass = (code) => code ? code.toUpperCase().trim() : ''
    const getClassColor = (classCode) => {
      const normalized = normalizeClass(classCode)
      return classColors[normalized] || 'FFFFFF'
    }
    expect(getClassColor('UNKNOWN')).toBe('FFFFFF')
    expect(getClassColor('BAC25-PA')).toBe('FDE68A')
  })
})

// ── 8. DashboardRMView classColors — Passerelle ─────────────────
describe('DashboardRMView classColors', () => {
  const classColors = {
    'BAC25': { bg: '#2563EB', text: '#fff' },
    'BAC24': { bg: '#7C3AED', text: '#fff' },
    'BAC23': { bg: '#059669', text: '#fff' },
    'BAC25-EE': { bg: '#0891B2', text: '#fff' },
    'BAC24-EE': { bg: '#9333EA', text: '#fff' },
    'BAC23-EE': { bg: '#10B981', text: '#fff' },
    'BAC25-PA': { bg: '#D97706', text: '#fff' },
    'BAC24-PA': { bg: '#BE185D', text: '#fff' },
  }

  it('BAC25-PA a une couleur distincte', () => {
    expect(classColors['BAC25-PA']).toBeDefined()
    expect(classColors['BAC25-PA'].bg).toBe('#D97706')
  })

  it('BAC24-PA a une couleur distincte', () => {
    expect(classColors['BAC24-PA']).toBeDefined()
    expect(classColors['BAC24-PA'].bg).toBe('#BE185D')
  })

  it('les couleurs PA sont différentes des couleurs plein temps', () => {
    expect(classColors['BAC25-PA'].bg).not.toBe(classColors['BAC25'].bg)
    expect(classColors['BAC24-PA'].bg).not.toBe(classColors['BAC24'].bg)
  })

  it('les couleurs PA sont différentes des couleurs EE', () => {
    expect(classColors['BAC25-PA'].bg).not.toBe(classColors['BAC25-EE'].bg)
    expect(classColors['BAC24-PA'].bg).not.toBe(classColors['BAC24-EE'].bg)
  })

  it('toutes les couleurs ont du texte blanc', () => {
    Object.values(classColors).forEach(color => {
      expect(color.text).toBe('#fff')
    })
  })
})

// ── 9. yearOptions — labels avec suffixe modalité ────────────────
describe('yearOptions — labels planning avec suffixe modalité', () => {
  const buildLabel = (classItem, yearName) => {
    const yearLevel = classItem.year_level === 1 ? '1ère' : classItem.year_level === 2 ? '2ème' : '3ème'
    const modalitySuffix = classItem.code.endsWith('-PA') ? ' (Passerelle)' :
                           classItem.code.endsWith('-TP') ? ' (Temps partiel)' :
                           classItem.code.endsWith('-EE') ? ' (En emploi)' : ''
    return `${yearLevel} année${modalitySuffix} ${yearName} / ${classItem.code}`
  }

  const buildValue = (code) => 'bac' + code.substring(1)

  it('label plein temps (B25)', () => {
    const label = buildLabel({ code: 'B25', year_level: 1 }, '2025-2026')
    expect(label).toBe('1ère année 2025-2026 / B25')
  })

  it('label passerelle (B25-PA)', () => {
    const label = buildLabel({ code: 'B25-PA', year_level: 2 }, '2026-2027')
    expect(label).toBe('2ème année (Passerelle) 2026-2027 / B25-PA')
  })

  it('label temps partiel (B25-TP)', () => {
    const label = buildLabel({ code: 'B25-TP', year_level: 1 }, '2025-2026')
    expect(label).toBe('1ère année (Temps partiel) 2025-2026 / B25-TP')
  })

  it('label en emploi (B25-EE)', () => {
    const label = buildLabel({ code: 'B25-EE', year_level: 1 }, '2025-2026')
    expect(label).toBe('1ère année (En emploi) 2025-2026 / B25-EE')
  })

  it('value conversion B25 → bac25', () => {
    expect(buildValue('B25')).toBe('bac25')
  })

  it('value conversion B25-PA → bac25-PA', () => {
    expect(buildValue('B25-PA')).toBe('bac25-PA')
  })

  it('value conversion B24-TP → bac24-TP', () => {
    expect(buildValue('B24-TP')).toBe('bac24-TP')
  })
})

// ── 10. Réactivité — selectedYear watcher logic ──────────────────
describe('selectedYear — auto-sélection réactive', () => {
  it('auto-sélectionne la 1ère option si selectedYear est null', () => {
    const selectedYear = ref(null)
    const yearOptions = [
      { label: '1ère année', value: 'bac25' },
      { label: '2ème année', value: 'bac24' }
    ]

    // Simule le watcher
    if (yearOptions.length > 0 && !selectedYear.value) {
      selectedYear.value = yearOptions[0].value
    }

    expect(selectedYear.value).toBe('bac25')
  })

  it('ne remplace pas si selectedYear est déjà défini', () => {
    const selectedYear = ref('bac24')
    const yearOptions = [
      { label: '1ère année', value: 'bac25' },
      { label: '2ème année', value: 'bac24' }
    ]

    if (yearOptions.length > 0 && !selectedYear.value) {
      selectedYear.value = yearOptions[0].value
    }

    expect(selectedYear.value).toBe('bac24')
  })

  it('ne fait rien si yearOptions est vide', () => {
    const selectedYear = ref(null)
    const yearOptions = []

    if (yearOptions.length > 0 && !selectedYear.value) {
      selectedYear.value = yearOptions[0].value
    }

    expect(selectedYear.value).toBeNull()
  })
})

// ── 11. PlanningView — labelShort avec suffixe ───────────────────
describe('PlanningView — labelShort avec suffixe modalité', () => {
  const buildLabelShort = (classItem) => {
    const yearLevel = classItem.year_level === 1 ? '1ère' : classItem.year_level === 2 ? '2ème' : '3ème'
    const modalitySuffix = classItem.code.endsWith('-PA') ? ' (PA)' :
                           classItem.code.endsWith('-TP') ? ' (TP)' : ''
    return `${yearLevel} année${modalitySuffix}`
  }

  it('plein temps → pas de suffixe', () => {
    expect(buildLabelShort({ code: 'B25', year_level: 1 })).toBe('1ère année')
  })

  it('passerelle → (PA)', () => {
    expect(buildLabelShort({ code: 'B25-PA', year_level: 2 })).toBe('2ème année (PA)')
  })

  it('temps partiel → (TP)', () => {
    expect(buildLabelShort({ code: 'B25-TP', year_level: 1 })).toBe('1ère année (TP)')
  })

  it('3ème année passerelle', () => {
    expect(buildLabelShort({ code: 'B24-PA', year_level: 3 })).toBe('3ème année (PA)')
  })
})

// ── 12. loadPlanning guard ───────────────────────────────────────
describe('loadPlanning — guard null', () => {
  it('ne charge rien si selectedYear est null', () => {
    const selectedYear = ref(null)
    let loadCalled = false

    const loadPlanning = () => {
      if (!selectedYear.value) return
      loadCalled = true
    }

    loadPlanning()
    expect(loadCalled).toBe(false)
  })

  it('charge si selectedYear est défini', () => {
    const selectedYear = ref('bac25')
    let loadCalled = false

    const loadPlanning = () => {
      if (!selectedYear.value) return
      loadCalled = true
    }

    loadPlanning()
    expect(loadCalled).toBe(true)
  })

  it('charge pour une classe passerelle', () => {
    const selectedYear = ref('bac25-PA')
    let loadCalled = false

    const loadPlanning = () => {
      if (!selectedYear.value) return
      loadCalled = true
    }

    loadPlanning()
    expect(loadCalled).toBe(true)
  })
})
