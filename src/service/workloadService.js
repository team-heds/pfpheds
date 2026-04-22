import { supabase } from '@/supabase'

/**
 * Service de calcul de feuille de charges pour les enseignants SI
 * 
 * Pilier 1.1 — Enseignement de base
 * (préparation, présence, correction d'examens)
 * 
 * Coefficients selon le nombre d'enseignants par créneau :
 *   1 prof   → 4.0
 *   2 profs  → 2.5
 *   3+ profs → 2.2
 * 
 * Ateliers (pratique) : coefficient fixe 1.6
 */

// ── Coefficients Pilier 1.1 ────────────────────────────
export const PILIER_1_1_COEFFICIENTS = [
  { teacherCount: 1, coeff: 4.0, label: '1 enseignant' },
  { teacherCount: 2, coeff: 2.5, label: '2 enseignants' },
  { teacherCount: 3, coeff: 2.2, label: '3+ enseignants' }
]

export const ATELIER_COEFFICIENT = 1.6

// Types d'activité reconnus comme "atelier"
export const ATELIER_ACTIVITIES = ['Atelier', 'atelier', 'Pratique', 'pratique', 'Labo', 'labo']

// Entrées à ignorer (pas des vrais enseignants)
const EXCLUDED_TEACHERS = [
  '?', 'a réattribuer', 'a repourvoir', 'vacataire', 'postulation',
  'pas d\'enseignant', 'mentorat', 'médiation santé', 'nouveau rm',
  'infirmière.àdéfinir', 'physio.àdéfinir', 'intervenant externe ?',
  'sipe', 'arfec', 'queer valais', 'sofia'
]

const EXCLUDED_TEACHER_KEYWORDS = [
  'postulation',
  'repourvoir',
  'reattribuer',
  'réattribuer',
  'pas d\'enseignant',
  'a reattribuer',
  'a réattribuer'
]

// Alias manuels : variantes de noms impossibles à résoudre automatiquement
// Clé = teacherKey de la variante, Valeur = teacherKey canonique
const TEACHER_ALIASES = {
  'deborah dias': 'debora dias',
  'jonathan tam': 'jonathan tam tschopp',
  'jonathan tschopp tam': 'jonathan tam tschopp',
  'bestien cheseaux': 'bastien cheseaux',
  'camille gaglio': 'camille caglio',
  'romaine hornerger': 'romaine hornberger',
  'nathalie rouvinez nils': 'nathalie rouvinez neel',
  'dr ionnis rotas': 'dr ioannis rotas',
  'yohan obrist': 'yohann obrist',
  'mnicole barmaz': 'marie nicole barmaz',
  'calexandre fournier': 'alexandre fournier',
  'gerber fabien': 'fabien gerber',
  'rudaz laura': 'laura rudaz',
  'raetz sylvia': 'sylvia raetz',
  'gregory deletre': 'gregoire deletre',
  'rachel grange varone': 'rachel granges',
  'alainmiguel berard': 'alain berard',
  'matthieu wildhaber': 'mathieu wildhaber',
}

// ── Helpers ─────────────────────────────────────────────

/**
 * Supprime les accents d'une chaîne (é→e, è→e, ê→e, etc.)
 */
function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Génère une clé de regroupement insensible aux accents, tirets, casse, points
 * Applique les alias manuels pour fusionner les variantes impossibles à résoudre
 */
export function teacherKey(raw) {
  if (!raw) return null
  let k = raw.replace(/"/g, '').trim()
  if (!k) return null
  k = stripAccents(k)
  k = k.replace(/[.-]/g, ' ')   // points et tirets → espaces
  k = k.replace(/\s+/g, ' ').trim().toLowerCase()
  // Appliquer les alias manuels
  return TEACHER_ALIASES[k] || k
}

export function normalizeTeacherName(raw) {
  if (!raw) return null

  let source = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed && typeof parsed === 'object') {
          source = parsed.display_name || parsed.name || `${parsed.forname || ''} ${parsed.family_name || ''}`.trim() || parsed.email || ''
        }
      } catch {
        source = raw
      }
    }
  }

  if (typeof raw === 'object') {
    source = raw.display_name || raw.name || `${raw.forname || ''} ${raw.family_name || ''}`.trim() || raw.email || ''
  }

  if (typeof source !== 'string') return null

  let name = source.replace(/"/g, '').trim()
  if (!name) return null

  const lowered = name.toLowerCase()
  const loweredNoAccent = stripAccents(lowered)

  // Ignorer les entrées non-personnes
  if (EXCLUDED_TEACHERS.some(e => lowered === e)) return null
  if (EXCLUDED_TEACHER_KEYWORDS.some(k => lowered.includes(k) || loweredNoAccent.includes(stripAccents(k)))) return null
  // Ignorer les entrées descriptives (contient "enseignant", "intervenants", "physios", etc.)
  if (/^\d+ (enseignant|intervenant|physio)/i.test(name)) return null
  // Ignorer les entrées qui commencent par des descriptions longues
  if (/^(Diététicienne|Infirmière en)/i.test(name)) return null

  // Remplacer les points par des espaces (prenom.nom → prenom nom)
  name = name.replace(/\./g, ' ')
  // Normaliser les espaces multiples
  name = name.replace(/\s+/g, ' ').trim()

  // Title Case : chaque mot commence par une majuscule
  name = name.split(' ').map(word => {
    if (!word) return ''
    // Garder les particules en minuscule (de, da, al, du, le, la)
    if (['de', 'da', 'du', 'le', 'la', 'al', 'des', 'von'].includes(word.toLowerCase()) && word.length <= 3) {
      return word.toLowerCase()
    }
    // Gérer les tirets composés (epiney-perruchoud → Epiney-Perruchoud)
    if (word.includes('-')) {
      return word.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-')
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')

  return name
}

/**
 * Retourne le coefficient Pilier 1.1 selon le nombre de profs sur le créneau
 * @param {number} teacherCount - Nombre d'enseignants assignés au créneau
 * @param {boolean} isAtelier - true si activité de type atelier/pratique
 */
export function getCoefficient(teacherCount, isAtelier = false) {
  if (isAtelier) return ATELIER_COEFFICIENT
  if (teacherCount <= 1) return 4.0
  if (teacherCount === 2) return 2.5
  return 2.2 // 3+
}

/**
 * Retourne un label explicatif du coefficient
 */
export function getCoefficientLabel(teacherCount, isAtelier = false) {
  if (isAtelier) return 'Atelier → ×1.6'
  if (teacherCount <= 1) return '1 prof → ×4.0'
  if (teacherCount === 2) return '2 profs → ×2.5'
  return `${teacherCount} profs → ×2.2`
}

/**
 * Détermine si une activité est un atelier
 */
export function isAtelierActivity(activity) {
  if (!activity) return false
  const normalized = String(activity).toLowerCase().trim()
  return normalized === 'atelier' || normalized === 'atelier / pratique' || normalized === 'pratique' || normalized === 'labo'
}

function isAtelierTextFallback(text) {
  if (!text) return false
  const normalized = stripAccents(String(text).toLowerCase())
  return /\batelier\b/.test(normalized) || /\blabo\b/.test(normalized)
}

function classifyAtelierSlot(slot) {
  if (slot?.activity_type) {
    return {
      isAtelier: isAtelierActivity(slot.activity_type),
      source: 'activity_type'
    }
  }

  // Legacy fallback: l'activité libre peut contenir un préfixe de type "Atelier — ..."
  if (slot?.activity) {
    const activityHead = String(slot.activity).split('—')[0].trim()
    if (isAtelierActivity(activityHead)) return { isAtelier: true, source: 'activity' }
    if (isAtelierTextFallback(slot.activity)) return { isAtelier: true, source: 'activity' }
  }

  // Dernier recours pour anciens slots non structurés
  if (isAtelierTextFallback(slot?.course_title)) {
    return { isAtelier: true, source: 'course_title' }
  }

  return { isAtelier: false, source: 'none' }
}

/**
 * Normalise un code classe : tout en majuscules, trim
 * "bac26" → "BAC26", "BAC25-pa" → "BAC25-PA", "Bac25-TP" → "BAC25-TP"
 */
function normalizeClassCode(code) {
  if (!code) return 'non-assigné'
  return code.trim().toUpperCase()
}

function toPlanningClassCode(code) {
  if (!code) return null
  const raw = String(code).trim().toUpperCase()
  if (!raw) return null
  return /^B\d/.test(raw) ? `BAC${raw.slice(1)}` : raw
}

function buildAcademicYearClassCodeSet(classes) {
  const set = new Set()
  for (const cls of (classes || [])) {
    const raw = cls?.code
    if (!raw) continue
    const normalizedRaw = normalizeClassCode(raw)
    const planningCode = toPlanningClassCode(raw)

    if (normalizedRaw) set.add(normalizedRaw)
    if (planningCode) set.add(planningCode)
  }
  return set
}

/**
 * Parse un horaire en { h, m } en gérant tous les formats :
 *  "08:30", "08.30", "8.30", "0830", "1530", "8:30"
 */
function parseTime(t) {
  if (!t) return null
  t = t.trim()
  // Format HH:MM ou HH.MM
  if (t.includes(':') || t.includes('.')) {
    const sep = t.includes(':') ? ':' : '.'
    const parts = t.split(sep).map(Number)
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { h: parts[0], m: parts[1] }
    }
  }
  // Format HHMM (ex: "1530") ou HMM (ex: "930")
  if (/^\d{3,4}$/.test(t)) {
    const n = parseInt(t, 10)
    return { h: Math.floor(n / 100), m: n % 100 }
  }
  return null
}

/**
 * Calcule la durée en heures entre start_time et end_time
 * Gère les formats : "HH:MM", "HH.MM", "HHMM"
 */
export function computeHours(startTime, endTime) {
  const s = parseTime(startTime)
  const e = parseTime(endTime)
  if (!s || !e) return 0
  const hours = (e.h + e.m / 60) - (s.h + s.m / 60)
  return hours > 0 ? hours : 0
}

/**
 * Arrondit une valeur au 0.5 le plus proche
 */
function roundHalf(val) {
  return Math.round(val * 2) / 2
}

/**
 * Calcule le nombre de périodes entre start_time et end_time
 * - Journée complète (start < 12h et end > 12h) = 6 périodes
 * - Demi-journée = durée/45min arrondi au 0.5, plafonné à 3
 */
export function computePeriods(startTime, endTime) {
  const s = parseTime(startTime)
  const e = parseTime(endTime)
  if (!s || !e) return 0
  const startMin = s.h * 60 + s.m
  const endMin = e.h * 60 + e.m
  if (endMin <= startMin) return 0

  // Journée complète : commence le matin, finit l'après-midi
  if (s.h < 12 && e.h >= 13) return 6

  // Demi-journée : nombre entier de blocs de 45min, min 1, max 3
  const periods = Math.floor((endMin - startMin) / 45)
  return Math.min(Math.max(periods, 1), 3)
}

// ── Service principal ───────────────────────────────────

class WorkloadService {

  /**
   * Récupère tous les enseignants SI
   */
  async getTeachers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, forname, family_name, email')
      .eq('role', 'EnseignantSoins')
      .order('display_name')

    if (error) throw error
    return (data || []).map(t => ({
      id: t.user_id,
      name: t.display_name || `${t.forname || ''} ${t.family_name || ''}`.trim(),
      email: t.email
    }))
  }

  /**
   * Récupère les classes avec leur nombre d'étudiants
   */
  async getClassesWithStudentCount(academicYearId) {
    let query = supabase
      .from('classes')
      .select('*')
      .order('code')

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Met à jour le nombre d'étudiants d'une classe
   */
  async updateStudentCount(classId, studentCount) {
    const { data, error } = await supabase
      .from('classes')
      .update({ student_count: studentCount })
      .eq('id', classId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Récupère tous les créneaux d'un semestre pour toutes les classes
   */
  async getAllTimeSlots(semester) {
    let query = supabase
      .from('planning_time_slots')
      .select('*')
      .order('week_number')
      .order('day_index')
      .order('start_time')

    if (semester === 'spring') {
      query = query.gte('week_number', 8).lte('week_number', 37)
    } else if (semester === 'autumn') {
      query = query.or('week_number.gte.38,week_number.lte.7')
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Calcule la feuille de charges complète pour tous les enseignants
   * 
   * @param {string} semester - 'autumn', 'spring', ou 'all'
   * @param {string} academicYearId - ID de l'année académique
   * @returns {Object} { teachers: [...], summary: {...} }
   */
  async getModuleNames() {
    const { data, error } = await supabase
      .from('modules')
      .select('code, title')

    if (error) throw error
    const map = {}
    for (const m of (data || [])) {
      if (m.code && m.title) map[m.code.trim()] = m.title
    }
    return map
  }

  async computeWorkload(semester, academicYearId) {
    // 1. Charger les données
    const [teachers, classes, allSlotsRaw, moduleNames] = await Promise.all([
      this.getTeachers(),
      this.getClassesWithStudentCount(academicYearId),
      semester === 'all'
        ? this._getAllSlots()
        : this.getAllTimeSlots(semester),
      this.getModuleNames()
    ])

    const teachersById = new Map((teachers || []).map(t => [String(t.id || ''), t]))
    const resolveTeacherLabel = (rawEntry) => {
      if (!rawEntry) return null
      if (typeof rawEntry === 'string') {
        const trimmed = rawEntry.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (parsed && typeof parsed === 'object') {
              const parsedId = String(parsed.id || parsed.user_id || parsed.profile_id || '').trim()
              if (parsedId && teachersById.has(parsedId)) {
                return teachersById.get(parsedId)?.name || null
              }
              return parsed.display_name || parsed.name || `${parsed.forname || ''} ${parsed.family_name || ''}`.trim() || parsed.email || null
            }
          } catch {
            return rawEntry
          }
        }
        return rawEntry
      }

      if (typeof rawEntry === 'object') {
        const rawId = String(rawEntry.id || rawEntry.user_id || rawEntry.profile_id || '').trim()
        if (rawId && teachersById.has(rawId)) {
          return teachersById.get(rawId)?.name || null
        }

        return rawEntry.display_name || rawEntry.name || `${rawEntry.forname || ''} ${rawEntry.family_name || ''}`.trim() || rawEntry.email || null
      }

      return null
    }

    // 2. Filtrer les créneaux sur les classes de l'année académique active
    // (sinon on mélange plusieurs cohortes/années et les heures deviennent fausses)
    const classCodeSet = buildAcademicYearClassCodeSet(classes)
    const allSlots = classCodeSet.size > 0
      ? (allSlotsRaw || []).filter(slot => classCodeSet.has(normalizeClassCode(slot.class_code)))
      : (allSlotsRaw || [])

    // 3. Construire la feuille de charges par enseignant (groupé par teacherKey)
    // keyMap: teacherKey → { teacher, workload }
    // On garde le "meilleur" nom d'affichage (le plus long / avec accents)
    const teacherWorkloads = {}  // teacherKey → workload
    const keyDisplayName = {}    // teacherKey → meilleur nom d'affichage
    const diagnostics = {
      scannedSlots: allSlots.length,
      slotsWithoutTeachers: 0,
      slotsWithNoValidTeacher: 0,
      slotsWithInvalidTime: 0,
      slotsWithExcludedTeacherEntries: 0,
      atelierDetectedByActivityType: 0,
      atelierDetectedByFallback: 0,
      coefficientDistribution: {
        '1.6': 0,
        '2.2': 0,
        '2.5': 0,
        '4.0': 0
      },
      rows: []
    }

    function pickBestName(key, candidate) {
      const current = keyDisplayName[key]
      if (!current) { keyDisplayName[key] = candidate; return }
      // Préférer le nom le plus long (plus complet), avec accents
      if (candidate.length > current.length) keyDisplayName[key] = candidate
    }

    // Initialiser chaque prof depuis user_profiles
    for (const teacher of teachers) {
      const normName = normalizeTeacherName(teacher.name) || teacher.name
      const key = teacherKey(normName) || normName
      teacher.name = normName
      pickBestName(key, normName)
      if (!teacherWorkloads[key]) {
        teacherWorkloads[key] = {
          teacher,
          slots: [],
          totalPresencePeriods: 0,
          totalWeightedPeriods: 0,
          byModule: {},
          byClass: {},
          byActivity: { cours: { periods: 0, weighted: 0 }, atelier: { periods: 0, weighted: 0 } },
          _seenSlots: new Set()
        }
      }
    }

    // 4. Parcourir chaque créneau et attribuer aux profs
    for (const slot of allSlots) {
      const rawTeachers = Array.isArray(slot.teachers) ? slot.teachers : []
      if (rawTeachers.length === 0) {
        diagnostics.slotsWithoutTeachers++
        diagnostics.rows.push({
          slotId: slot.id,
          weekNumber: slot.week_number,
          day: slot.day,
          classCode: normalizeClassCode(slot.class_code),
          moduleCode: slot.module_code || '',
          courseTitle: slot.course_title || '',
          activityType: slot.activity_type || '',
          activity: slot.activity || '',
          rawTeacherCount: 0,
          normalizedTeacherCount: 0,
          rawTeachers: '',
          normalizedTeachers: '',
          periods: 0,
          isAtelier: false,
          atelierSource: 'none',
          coefficient: '',
          coeffLabel: '',
          weightedPeriods: 0,
          issue: 'no_teachers'
        })
        continue
      }

      const periods = computePeriods(slot.start_time, slot.end_time)
      if (periods <= 0) {
        diagnostics.slotsWithInvalidTime++
        diagnostics.rows.push({
          slotId: slot.id,
          weekNumber: slot.week_number,
          day: slot.day,
          classCode: normalizeClassCode(slot.class_code),
          moduleCode: slot.module_code || '',
          courseTitle: slot.course_title || '',
          activityType: slot.activity_type || '',
          activity: slot.activity || '',
          rawTeacherCount: rawTeachers.length,
          normalizedTeacherCount: 0,
          rawTeachers: rawTeachers.map(t => (typeof t === 'object' ? t?.name : t)).filter(Boolean).join(' | '),
          normalizedTeachers: '',
          periods: 0,
          isAtelier: false,
          atelierSource: 'none',
          coefficient: '',
          coeffLabel: '',
          weightedPeriods: 0,
          issue: 'invalid_time'
        })
        continue
      }

      // Détecter atelier avec priorité au champ structuré activity_type
      const atelierDetection = classifyAtelierSlot(slot)
      const isAtelier = atelierDetection.isAtelier
      if (isAtelier) {
        if (atelierDetection.source === 'activity_type') {
          diagnostics.atelierDetectedByActivityType++
        } else {
          diagnostics.atelierDetectedByFallback++
        }
      }
      // Normaliser et dédupliquer par teacherKey
      const seen = new Set()
      const slotTeacherKeys = []
      const normalizedTeacherNames = []
      for (const raw of rawTeachers) {
        const resolvedLabel = resolveTeacherLabel(raw)
        const norm = normalizeTeacherName(resolvedLabel)
        if (!norm) continue
        const key = teacherKey(norm)
        if (!key || seen.has(key)) continue
        seen.add(key)
        slotTeacherKeys.push(key)
        normalizedTeacherNames.push(norm)
        pickBestName(key, norm)
      }
      const teacherCount = slotTeacherKeys.length
      if (teacherCount === 0) {
        diagnostics.slotsWithNoValidTeacher++
        diagnostics.rows.push({
          slotId: slot.id,
          weekNumber: slot.week_number,
          day: slot.day,
          classCode: normalizeClassCode(slot.class_code),
          moduleCode: slot.module_code || '',
          courseTitle: slot.course_title || '',
          activityType: slot.activity_type || '',
          activity: slot.activity || '',
          rawTeacherCount: rawTeachers.length,
          normalizedTeacherCount: 0,
          rawTeachers: rawTeachers.map(t => (typeof t === 'object' ? t?.name : t)).filter(Boolean).join(' | '),
          normalizedTeachers: '',
          periods,
          isAtelier,
          atelierSource: atelierDetection.source,
          coefficient: '',
          coeffLabel: '',
          weightedPeriods: 0,
          issue: 'no_valid_teacher'
        })
        continue
      }

      if (teacherCount < rawTeachers.length) {
        diagnostics.slotsWithExcludedTeacherEntries++
      }

      const coeff = getCoefficient(teacherCount, isAtelier)
      const coeffLabel = getCoefficientLabel(teacherCount, isAtelier)
      const weightedPeriods = Math.round(periods * coeff * 10) / 10
      const coeffKey = coeff.toFixed(1)
      if (diagnostics.coefficientDistribution[coeffKey] !== undefined) {
        diagnostics.coefficientDistribution[coeffKey]++
      }

      diagnostics.rows.push({
        slotId: slot.id,
        weekNumber: slot.week_number,
        day: slot.day,
        classCode: normalizeClassCode(slot.class_code),
        moduleCode: slot.module_code || '',
        courseTitle: slot.course_title || '',
        activityType: slot.activity_type || '',
        activity: slot.activity || '',
        rawTeacherCount: rawTeachers.length,
        normalizedTeacherCount: teacherCount,
        rawTeachers: rawTeachers.map(t => (typeof t === 'object' ? t?.name : t)).filter(Boolean).join(' | '),
        normalizedTeachers: normalizedTeacherNames.join(' | '),
        periods,
        isAtelier,
        atelierSource: atelierDetection.source,
        coefficient: coeff,
        coeffLabel,
        weightedPeriods,
        issue: teacherCount < rawTeachers.length ? 'excluded_teacher_entries' : ''
      })

      for (const key of slotTeacherKeys) {

        // Si le prof n'est pas dans la liste user_profiles, l'ajouter dynamiquement
        if (!teacherWorkloads[key]) {
          teacherWorkloads[key] = {
            teacher: { id: null, name: keyDisplayName[key] || key, email: null },
            slots: [],
            totalPresencePeriods: 0,
            totalWeightedPeriods: 0,
            byModule: {},
            byClass: {},
            byActivity: { cours: { periods: 0, weighted: 0 }, atelier: { periods: 0, weighted: 0 } },
            _seenSlots: new Set()  // pour dédoublonner TP/PA
          }
        }

        const workload = teacherWorkloads[key]
        // Mettre à jour le nom d'affichage avec le meilleur trouvé
        workload.teacher.name = keyDisplayName[key] || workload.teacher.name

        // Dédoublonner : même semaine + jour + horaire = même créneau physique
        // (BAC25 et BAC25-PA/TP au même moment = un seul créneau réel)
        const slotFingerprint = `${slot.week_number}|${slot.day}|${slot.start_time}|${slot.end_time}`
        if (workload._seenSlots.has(slotFingerprint)) {
          // Créneau déjà compté pour ce prof, on ajoute juste la classe
          const existingSlot = workload.slots.find(s => 
            s.weekNumber === slot.week_number && s.day === slot.day &&
            s.startTime === slot.start_time && s.endTime === slot.end_time
          )
          if (existingSlot) {
            const normClass = normalizeClassCode(slot.class_code)
            if (normClass && !existingSlot.classCode.includes(normClass)) {
              existingSlot.classCode += ', ' + normClass
            }
          }
          continue
        }
        workload._seenSlots.add(slotFingerprint)

        // Détail du créneau
        workload.slots.push({
          id: slot.id,
          weekNumber: slot.week_number,
          day: slot.day,
          date: slot.date,
          startTime: slot.start_time,
          endTime: slot.end_time,
          classCode: normalizeClassCode(slot.class_code),
          moduleCode: slot.module_code,
          moduleName: moduleNames[slot.module_code] || slot.module_code || '',
          courseTitle: slot.course_title,
          activity: isAtelier ? 'Atelier' : (slot.activity || 'Cours'),
          room: slot.room,
          periods,
          teacherCount,
          isAtelier,
          coefficient: coeff,
          coeffLabel,
          weightedPeriods
        })

        // Totaux
        workload.totalPresencePeriods += periods
        workload.totalWeightedPeriods += weightedPeriods

        // Par module
        const moduleKey = slot.module_code || 'non-assigné'
        if (!workload.byModule[moduleKey]) {
          workload.byModule[moduleKey] = { periods: 0, weighted: 0, title: moduleNames[moduleKey] || moduleKey }
        }
        workload.byModule[moduleKey].periods += periods
        workload.byModule[moduleKey].weighted += weightedPeriods

        // Par classe
        const classKey = normalizeClassCode(slot.class_code)
        if (!workload.byClass[classKey]) {
          workload.byClass[classKey] = { periods: 0, weighted: 0 }
        }
        workload.byClass[classKey].periods += periods
        workload.byClass[classKey].weighted += weightedPeriods

        // Par type (cours vs atelier)
        const typeKey = isAtelier ? 'atelier' : 'cours'
        workload.byActivity[typeKey].periods += periods
        workload.byActivity[typeKey].weighted += weightedPeriods
      }
    }

    // 5. Arrondir les totaux, calculer détail coefficients, et trier
    const result = Object.values(teacherWorkloads)
      .filter(w => w.slots.length > 0)
      .map(w => {
        // Calculer la répartition par coefficient
        const coeffBreakdown = {}
        for (const s of w.slots) {
          const label = s.coeffLabel
          if (!coeffBreakdown[label]) {
            coeffBreakdown[label] = { label, coeff: s.coefficient, slots: 0, periods: 0, weighted: 0 }
          }
          coeffBreakdown[label].slots++
          coeffBreakdown[label].periods += s.periods
          coeffBreakdown[label].weighted += s.weightedPeriods
        }
        const byCoefficient = Object.values(coeffBreakdown)
          .map(c => ({
            ...c,
            periods: roundHalf(c.periods),
            weighted: Math.round(c.weighted * 10) / 10
          }))
          .sort((a, b) => b.weighted - a.weighted)

        return {
          teacher: w.teacher,
          slots: w.slots,
          totalPresencePeriods: roundHalf(w.totalPresencePeriods),
          totalWeightedPeriods: Math.round(w.totalWeightedPeriods * 10) / 10,
          byModule: Object.entries(w.byModule).map(([code, data]) => ({
            code,
            title: data.title,
            periods: roundHalf(data.periods),
            weighted: Math.round(data.weighted * 10) / 10
          })),
          byClass: Object.entries(w.byClass).map(([code, data]) => ({
            code,
            periods: roundHalf(data.periods),
            weighted: Math.round(data.weighted * 10) / 10
          })),
          byActivity: w.byActivity,
          byCoefficient
        }
      })
      .sort((a, b) => b.totalWeightedPeriods - a.totalWeightedPeriods)

    // 6. Résumé global
    const summary = {
      totalTeachers: result.length,
      totalPresencePeriods: roundHalf(result.reduce((s, w) => s + w.totalPresencePeriods, 0)),
      totalWeightedPeriods: Math.round(result.reduce((s, w) => s + w.totalWeightedPeriods, 0) * 10) / 10,
      totalSlots: result.reduce((s, w) => s + w.slots.length, 0),
      classesUsed: [...new Set(allSlots.map(s => s.class_code).filter(Boolean))].length
    }

    return { teachers: result, summary, classes, diagnostics }
  }

  /**
   * Charge tous les créneaux (les deux semestres)
   */
  async _getAllSlots() {
    const { data, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .order('week_number')
      .order('day_index')
      .order('start_time')

    if (error) throw error
    return data || []
  }
}

const workloadService = new WorkloadService()
export default workloadService
