const cleanText = value => String(value ?? '').trim()

export const PFP_STAGE_EXPORT_COLUMNS = Object.freeze([
  { header: 'Institution', key: 'institution', width: 30 },
  { header: 'Place de stage', key: 'placeName', width: 24 },
  { header: 'Critères', key: 'criteres', width: 20 },
  { header: 'Domaine d\'expertise', key: 'domaine', width: 22 },
  { header: 'Classe', key: 'classe', width: 10 },
  { header: 'Nom étudiant·es', key: 'nom', width: 16 },
  { header: 'Prénom étudiant·es', key: 'prenom', width: 14 },
  { header: 'PF', key: 'pf', width: 22 },
  { header: 'Email PF', key: 'pfEmail', width: 28 },
  { header: 'Répondant HES', key: 'repondantHes', width: 22 },
  { header: 'Formateur·trice HES', key: 'formateurHES', width: 22 },
  { header: 'Année', key: 'annee', width: 8 },
  { header: 'CPT', key: 'cptStatus', width: 14 },
  { header: 'Évaluation', key: 'evalStatus', width: 14 },
  { header: 'Particularités', key: 'particularites', width: 18 },
  { header: 'Absences en jours', key: 'absences', width: 14 },
  { header: 'Notes', key: 'notes', width: 8 },
  { header: 'Remarques', key: 'remarques', width: 35 }
])

export const FP_OVERVIEW_IDENTITY_COLUMNS = Object.freeze([
  { header: 'Nom', key: 'nom', width: 16 },
  { header: 'Prénom', key: 'prenom', width: 14 },
  { header: 'Classe', key: 'classe', width: 10 },
  { header: 'Répondant HES', key: 'repondantHes', width: 22 }
])

export function assertFpOverviewDataResults(results = {}) {
  for (const [label, result] of Object.entries(results)) {
    if (!result?.error) continue
    const error = new Error(`Impossible de charger ${label}`)
    error.cause = result.error
    throw error
  }
}

export function getFpOverviewGroupBounds(index, subColumnCount) {
  const start = FP_OVERVIEW_IDENTITY_COLUMNS.length + 1 + index * subColumnCount
  return { start, end: start + subColumnCount - 1 }
}

export function buildFpOverviewStudentFields(student = {}) {
  return {
    userId: student.id || student.user_id || '',
    nom: cleanText(student.Nom || student.family_name),
    prenom: cleanText(student.Prenom || student.forname),
    classe: cleanText(student.Classe || student.classe) || '-',
    repondantHes: cleanText(student.repondant_hes)
  }
}

export function matchesFpOverviewSearch(row = {}, query = '') {
  const normalizedQuery = cleanText(query).toLocaleLowerCase('fr')
  if (!normalizedQuery) return true

  return [
    row.nom,
    row.prenom,
    row.placeName,
    row.institutionName,
    row.praticienName,
    row.praticienMail,
    row.repondantHes
  ].some(value => cleanText(value).toLocaleLowerCase('fr').includes(normalizedQuery))
}

export function buildFpOverviewExportIdentity(row = {}) {
  return {
    nom: cleanText(row.nom),
    prenom: cleanText(row.prenom),
    classe: cleanText(row.classe),
    repondantHes: cleanText(row.repondantHes),
    formateurHES: ''
  }
}
