const DEFAULT_EXCLUDED_TEACHERS = [
  '?', 'a réattribuer', 'a repourvoir', 'vacataire', 'postulation',
  'pas d\'enseignant', 'mentorat', 'médiation santé', 'nouveau rm',
  'infirmière.àdéfinir', 'physio.àdéfinir', 'intervenant externe ?',
  'sipe', 'arfec', 'queer valais', 'sofia'
]

const DEFAULT_EXCLUDED_KEYWORDS = [
  'postulation',
  'repourvoir',
  'reattribuer',
  'réattribuer',
  'pas d\'enseignant'
]

export const DEFAULT_TEACHER_ALIASES = {
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
  'matthieu wildhaber': 'mathieu wildhaber'
}

export function stripTeacherAccents(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function normalizeTeacherEmail(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return normalized.includes('@') ? normalized : null
}

export function normalizeTeacherIdentityKey(value, aliases = DEFAULT_TEACHER_ALIASES) {
  if (typeof value !== 'string') return null
  let key = value.replace(/"/g, '').trim()
  if (!key) return null
  key = stripTeacherAccents(key)
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  return aliases[key] || key
}

export function parseTeacherIdentityEntry(rawEntry) {
  if (!rawEntry) return null
  if (typeof rawEntry === 'object') return rawEntry
  if (typeof rawEntry !== 'string') return null

  const trimmed = rawEntry.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      // Une ancienne valeur peut ressembler à du JSON sans en être : elle reste un nom libre.
    }
  }
  return { name: trimmed }
}

function teacherDisplayName(teacher) {
  return teacher?.name || teacher?.display_name || `${teacher?.forname || ''} ${teacher?.family_name || ''}`.trim() || teacher?.email || 'Enseignant inconnu'
}

function entryDisplayName(entry) {
  return entry?.display_name || entry?.name || `${entry?.forname || ''} ${entry?.family_name || ''}`.trim() || entry?.email || ''
}

function isExcludedTeacherEntry(entry, excludedTeachers, excludedKeywords) {
  const label = entryDisplayName(entry)
  if (!label) return true
  const normalized = String(label).trim().toLowerCase()
  const normalizedWithoutAccents = stripTeacherAccents(normalized)

  if (excludedTeachers.some(item => normalized === item)) return true
  if (excludedKeywords.some(item => {
    const needle = String(item).toLowerCase()
    return normalized.includes(needle) || normalizedWithoutAccents.includes(stripTeacherAccents(needle))
  })) return true
  if (/^\d+ (enseignant|intervenant|physio)/i.test(label)) return true
  if (/^(Diététicienne|Infirmière en)/i.test(label)) return true
  return false
}

function addToIndex(index, value, teacher) {
  if (!value) return
  const matches = index.get(value) || []
  if (!matches.some(item => item.id === teacher.id)) matches.push(teacher)
  index.set(value, matches)
}

function canonicalResult(teacher, source, raw, displayName) {
  return {
    status: 'resolved',
    source,
    key: `user:${teacher.id}`,
    teacher,
    displayName: teacherDisplayName(teacher),
    rawDisplayName: displayName || '',
    raw
  }
}

export function createTeacherIdentityResolver(teachers = [], options = {}) {
  const aliases = { ...DEFAULT_TEACHER_ALIASES, ...(options.aliases || {}) }
  const excludedTeachers = (options.excludedTeachers || DEFAULT_EXCLUDED_TEACHERS)
    .map(item => String(item).trim().toLowerCase())
  const excludedKeywords = options.excludedKeywords || DEFAULT_EXCLUDED_KEYWORDS
  const byId = new Map()
  const byEmail = new Map()
  const byName = new Map()

  const canonicalTeachers = (teachers || []).map(rawTeacher => {
    const teacher = {
      ...rawTeacher,
      id: String(rawTeacher?.id || rawTeacher?.user_id || '').trim(),
      name: teacherDisplayName(rawTeacher),
      email: normalizeTeacherEmail(rawTeacher?.email)
    }
    if (teacher.id) byId.set(teacher.id, teacher)
    if (teacher.email) addToIndex(byEmail, teacher.email, teacher)

    const names = new Set([
      teacher.name,
      rawTeacher?.display_name,
      `${rawTeacher?.forname || ''} ${rawTeacher?.family_name || ''}`.trim(),
      teacher.email?.split('@')[0]
    ].filter(Boolean))
    for (const name of names) addToIndex(byName, normalizeTeacherIdentityKey(name, aliases), teacher)
    return teacher
  })

  function resolve(rawEntry) {
    const entry = parseTeacherIdentityEntry(rawEntry)
    if (!entry) {
      return { status: 'excluded', source: 'empty', key: null, teacher: null, displayName: '', raw: rawEntry }
    }
    const displayName = entryDisplayName(entry)
    const id = String(entry.id || entry.user_id || entry.profile_id || '').trim()
    if (id && byId.has(id)) return canonicalResult(byId.get(id), 'id', rawEntry, displayName)

    if (isExcludedTeacherEntry(entry, excludedTeachers, excludedKeywords)) {
      return { status: 'excluded', source: 'rule', key: null, teacher: null, displayName, raw: rawEntry }
    }

    const email = normalizeTeacherEmail(entry.email || (displayName.includes('@') ? displayName : ''))
    if (email) {
      const emailMatches = byEmail.get(email) || []
      if (emailMatches.length === 1) return canonicalResult(emailMatches[0], 'email', rawEntry, displayName)
      if (emailMatches.length > 1) {
        return {
          status: 'ambiguous', source: 'email', key: `legacy:${normalizeTeacherIdentityKey(email, aliases)}`,
          teacher: null, displayName, candidates: emailMatches, raw: rawEntry
        }
      }
    }

    const nameKey = normalizeTeacherIdentityKey(displayName, aliases)
    const nameMatches = nameKey ? (byName.get(nameKey) || []) : []
    if (nameMatches.length === 1) return canonicalResult(nameMatches[0], 'name', rawEntry, displayName)
    if (nameMatches.length > 1) {
      return {
        status: 'ambiguous', source: 'name', key: `legacy:${nameKey}`,
        teacher: null, displayName, candidates: nameMatches, raw: rawEntry
      }
    }

    return {
      status: 'unresolved',
      source: 'legacy',
      key: nameKey ? `legacy:${nameKey}` : null,
      teacher: null,
      displayName,
      raw: rawEntry
    }
  }

  return { resolve, teachers: canonicalTeachers }
}
