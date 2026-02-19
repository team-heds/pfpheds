/**
 * Service d'Alertes PFP pour le Secrétariat
 * Analyse les données de formation pratique et génère des alertes contextuelles
 *
 * Tables Supabase utilisées :
 *   - places              : offres PFP par année (PFP1A.2026, etc.) + critères (MSQ, SYSINT…)
 *   - StudentsPhysio      : notes (pfp1a…pfp4), retakes, absences, remarques par user_id/year
 *   - student_result_vote : attributions (user_id, pfp_type, pfp_echec, pfp_validee, pfp_arret…)
 *   - suivi_cas_particuliers : lignes plates (user_id, pfp_field, couleur, commentaire)
 *   - institutions        : InstitutionId, Name, ConventionDate, AccordCadreDate
 *   - user_profiles       : user_id, family_name, forname, classe
 */

export class PfpAlertsService {
  constructor() {
    this.alerts = []
  }

  /**
   * Analyser les offres/propositions et détecter les déséquilibres
   */
  analyzeOffers(places, year) {
    const alerts = []
    const pfpTypes = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

    pfpTypes.forEach(pfp => {
      let totalOffres = 0

      places.forEach(place => {
        totalOffres += parseInt(place[pfp]?.[year]) || 0
      })

      if (totalOffres === 0) {
        alerts.push({
          type: 'no_offers',
          category: 'offres',
          pfpType: pfp,
          severity: 'warn',
          title: `Aucune offre ${pfp}`,
          message: `${pfp}: aucune place enregistrée pour ${year}`,
          data: { offres: 0 },
          action: `Vérifier les offres ${pfp} pour ${year}`,
          timestamp: new Date().toISOString()
        })
      }
    })

    return alerts
  }

  /**
   * Analyser les notes PFP (StudentsPhysio) et détecter échecs, notes manquantes, retakes
   */
  analyzeNotes(notes) {
    const alerts = []
    if (!notes || notes.length === 0) return alerts

    const noteKeys = ['pfp1a', 'pfp1b', 'pfp2', 'pfp3', 'pfp4']
    const pfpLabels = { pfp1a: 'PFP1A', pfp1b: 'PFP1B', pfp2: 'PFP2', pfp3: 'PFP3', pfp4: 'PFP4' }
    const total = notes.length

    // Échecs (note = F) sans retake
    const echecsSansRetake = []
    notes.forEach(n => {
      noteKeys.forEach(key => {
        const val = String(n[key] ?? '').trim().toUpperCase()
        const retake = String(n[key + '_retake'] ?? '').trim().toUpperCase()
        if (val === 'F' && !retake) {
          echecsSansRetake.push({ user_id: n.user_id, pfp: pfpLabels[key] })
        }
      })
    })

    if (echecsSansRetake.length > 0) {
      alerts.push({
        type: 'echec_sans_retake',
        category: 'notes',
        severity: echecsSansRetake.length > 5 ? 'error' : 'warn',
        title: `${echecsSansRetake.length} échec(s) sans rattrapage`,
        message: `${echecsSansRetake.length} note(s) F sans rattrapage renseigné`,
        data: { count: echecsSansRetake.length },
        action: 'Vérifier les rattrapages pour les échecs',
        timestamp: new Date().toISOString()
      })
    }

    // Échecs au rattrapage (retake = F)
    const echecsRetake = []
    notes.forEach(n => {
      noteKeys.forEach(key => {
        const retake = String(n[key + '_retake'] ?? '').trim().toUpperCase()
        if (retake === 'F') {
          echecsRetake.push({ user_id: n.user_id, pfp: pfpLabels[key] })
        }
      })
    })

    if (echecsRetake.length > 0) {
      alerts.push({
        type: 'echec_retake',
        category: 'notes',
        severity: 'error',
        title: `${echecsRetake.length} échec(s) au rattrapage`,
        message: `${echecsRetake.length} étudiant(s) ont échoué au rattrapage (note F)`,
        data: { count: echecsRetake.length },
        action: 'Action requise : échecs définitifs au rattrapage',
        timestamp: new Date().toISOString()
      })
    }

    // Absences élevées (> 2 jours par PFP)
    const highAbsences = []
    notes.forEach(n => {
      noteKeys.forEach(key => {
        const abs = Number(n[key + '_absences']) || 0
        if (abs > 2) {
          highAbsences.push({ user_id: n.user_id, pfp: pfpLabels[key], absences: abs })
        }
      })
    })

    if (highAbsences.length > 0) {
      alerts.push({
        type: 'high_absences',
        category: 'notes',
        severity: highAbsences.length > 10 ? 'error' : 'warn',
        title: `${highAbsences.length} absences élevées`,
        message: `${highAbsences.length} PFP avec plus de 2 jours d'absence`,
        data: { count: highAbsences.length },
        action: 'Vérifier les absences élevées',
        timestamp: new Date().toISOString()
      })
    }

    // Étudiants sans aucune note
    const noNotes = notes.filter(n =>
      noteKeys.every(key => {
        const val = String(n[key] ?? '').trim()
        return !val || val === '-'
      })
    )

    if (noNotes.length > 0) {
      const pct = Math.round((noNotes.length / total) * 100)
      alerts.push({
        type: 'no_notes',
        category: 'notes',
        severity: pct > 50 ? 'warn' : 'info',
        title: `${noNotes.length} étudiants sans note`,
        message: `${pct}% des étudiants n'ont aucune note PFP renseignée`,
        data: { count: noNotes.length, total, percent: pct },
        action: 'Compléter les notes manquantes',
        timestamp: new Date().toISOString()
      })
    }

    return alerts
  }

  /**
   * Analyser les attributions (student_result_vote) : échecs, arrêts, non-attribués
   */
  analyzeAssignments(assignments) {
    const alerts = []
    if (!assignments || assignments.length === 0) return alerts

    const total = assignments.length

    // Échecs PFP
    const echecs = assignments.filter(a => a.pfp_echec === true)
    if (echecs.length > 0) {
      alerts.push({
        type: 'pfp_echecs',
        category: 'attributions',
        severity: echecs.length > 5 ? 'error' : 'warn',
        title: `${echecs.length} échec(s) PFP`,
        message: `${echecs.length} attribution(s) marquée(s) en échec`,
        data: { count: echecs.length, total },
        action: 'Traiter les échecs PFP et planifier les rattrapages',
        timestamp: new Date().toISOString()
      })
    }

    // Arrêts PFP
    const arrets = assignments.filter(a => a.pfp_arret === true)
    if (arrets.length > 0) {
      alerts.push({
        type: 'pfp_arrets',
        category: 'attributions',
        severity: arrets.length > 3 ? 'error' : 'warn',
        title: `${arrets.length} arrêt(s) PFP`,
        message: `${arrets.length} stage(s) interrompu(s)`,
        data: { count: arrets.length, total },
        action: 'Réattribuer les stages interrompus',
        timestamp: new Date().toISOString()
      })
    }

    // Attributions sans place assignée
    const noPlace = assignments.filter(a => !a.assigned_place_id && !a.assigned_place_name)
    if (noPlace.length > 0) {
      const pct = Math.round((noPlace.length / total) * 100)
      alerts.push({
        type: 'no_place_assigned',
        category: 'attributions',
        severity: pct > 30 ? 'error' : 'warn',
        title: `${noPlace.length} attribution(s) sans place`,
        message: `${pct}% des attributions n'ont pas de place assignée`,
        data: { count: noPlace.length, total, percent: pct },
        action: 'Assigner les places manquantes',
        timestamp: new Date().toISOString()
      })
    }

    return alerts
  }

  /**
   * Analyser les cas particuliers (suivi_cas_particuliers)
   * Structure: lignes plates avec user_id, pfp_field, couleur, commentaire
   */
  analyzeCasParticuliers(suivis) {
    const alerts = []
    if (!suivis || suivis.length === 0) return alerts

    // Regrouper par couleur
    const redEntries = suivis.filter(s => s.couleur === 'rouge')
    const blackEntries = suivis.filter(s => s.couleur === 'noir')
    const orangeEntries = suivis.filter(s => s.couleur === 'orange')

    // Compter les étudiants uniques par couleur
    const uniqueRed = new Set(redEntries.map(s => s.user_id)).size
    const uniqueBlack = new Set(blackEntries.map(s => s.user_id)).size
    const uniqueOrange = new Set(orangeEntries.map(s => s.user_id)).size

    if (uniqueBlack > 0) {
      alerts.push({
        type: 'black_cases',
        category: 'cas_particuliers',
        severity: 'error',
        title: `${uniqueBlack} cas noir(s)`,
        message: `${uniqueBlack} étudiant(s) avec un PFP marqué en noir (situation critique)`,
        data: { count: uniqueBlack },
        action: 'Action immédiate requise pour les cas noirs',
        timestamp: new Date().toISOString()
      })
    }

    if (uniqueRed > 0) {
      alerts.push({
        type: 'red_cases',
        category: 'cas_particuliers',
        severity: uniqueRed > 5 ? 'error' : 'warn',
        title: `${uniqueRed} cas rouge(s)`,
        message: `${uniqueRed} étudiant(s) avec un PFP marqué en rouge`,
        data: { count: uniqueRed },
        action: 'Traiter les cas rouges en priorité',
        timestamp: new Date().toISOString()
      })
    }

    if (uniqueOrange > 0) {
      alerts.push({
        type: 'orange_cases',
        category: 'cas_particuliers',
        severity: 'info',
        title: `${uniqueOrange} cas orange`,
        message: `${uniqueOrange} étudiant(s) avec un PFP marqué en orange (à surveiller)`,
        data: { count: uniqueOrange },
        action: 'Surveiller les cas orange',
        timestamp: new Date().toISOString()
      })
    }

    return alerts
  }

  /**
   * Analyser les institutions (conventions/accords manquants)
   */
  analyzeInstitutions(institutions) {
    const alerts = []
    if (!institutions || institutions.length === 0) return alerts

    const noConvention = institutions.filter(i => !i.ConventionDate)
    const noAccord = institutions.filter(i => !i.AccordCadreDate)
    const noDocs = institutions.filter(i => !i.ConventionDate && !i.AccordCadreDate)

    if (noDocs.length > 0) {
      alerts.push({
        type: 'no_docs',
        category: 'institutions',
        severity: noDocs.length > 10 ? 'error' : 'warn',
        title: `${noDocs.length} institutions sans documents`,
        message: `${noDocs.length} institutions n'ont ni convention ni accord cadre`,
        data: { count: noDocs.length, institutions: noDocs.slice(0, 5).map(i => i.Name) },
        action: 'Contacter les institutions pour obtenir les documents',
        timestamp: new Date().toISOString()
      })
    }

    if (noConvention.length > noDocs.length) {
      const onlyNoConv = noConvention.length - noDocs.length
      alerts.push({
        type: 'no_convention',
        category: 'institutions',
        severity: 'info',
        title: `${onlyNoConv} conventions manquantes`,
        message: `${onlyNoConv} institutions ont un accord cadre mais pas de convention`,
        data: { count: onlyNoConv },
        action: 'Demander les conventions manquantes',
        timestamp: new Date().toISOString()
      })
    }

    if (noAccord.length > noDocs.length) {
      const onlyNoAccord = noAccord.length - noDocs.length
      alerts.push({
        type: 'no_accord',
        category: 'institutions',
        severity: 'info',
        title: `${onlyNoAccord} accords cadre manquants`,
        message: `${onlyNoAccord} institutions ont une convention mais pas d'accord cadre`,
        data: { count: onlyNoAccord },
        action: 'Demander les accords cadre manquants',
        timestamp: new Date().toISOString()
      })
    }

    return alerts
  }

  /**
   * Lancer une analyse complète et stocker les alertes
   */
  runFullAnalysis({ places, year, notes, assignments, suivis, institutions }) {
    this.alerts = []

    if (places && year) {
      this.alerts.push(...this.analyzeOffers(places, year))
    }
    if (notes) {
      this.alerts.push(...this.analyzeNotes(notes))
    }
    if (assignments) {
      this.alerts.push(...this.analyzeAssignments(assignments))
    }
    if (suivis) {
      this.alerts.push(...this.analyzeCasParticuliers(suivis))
    }
    if (institutions) {
      this.alerts.push(...this.analyzeInstitutions(institutions))
    }

    // Trier par sévérité: error > warn > info
    const severityOrder = { error: 0, warn: 1, info: 2 }
    this.alerts.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))

    return this.alerts
  }

  /**
   * Obtenir les alertes par catégorie
   */
  getAlertsByCategory(category) {
    return this.alerts.filter(a => a.category === category)
  }

  /**
   * Obtenir les statistiques d'alertes
   */
  getStats() {
    return {
      total: this.alerts.length,
      critical: this.alerts.filter(a => a.severity === 'error').length,
      warning: this.alerts.filter(a => a.severity === 'warn').length,
      info: this.alerts.filter(a => a.severity === 'info').length,
      byCategory: {
        offres: this.alerts.filter(a => a.category === 'offres').length,
        notes: this.alerts.filter(a => a.category === 'notes').length,
        attributions: this.alerts.filter(a => a.category === 'attributions').length,
        cas_particuliers: this.alerts.filter(a => a.category === 'cas_particuliers').length,
        institutions: this.alerts.filter(a => a.category === 'institutions').length
      }
    }
  }

  /**
   * Vider les alertes
   */
  clear() {
    this.alerts = []
  }
}

export const pfpAlerts = new PfpAlertsService()
export default pfpAlerts
