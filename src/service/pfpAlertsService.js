/**
 * Service d'Alertes PFP pour le Secrétariat
 * Analyse les données de formation pratique et génère des alertes contextuelles
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
      let totalPropositions = 0

      places.forEach(place => {
        totalOffres += parseInt(place[pfp]?.[year]) || 0
        totalPropositions += parseInt(place[`${pfp.toLowerCase()}_proposition`]?.[year]) || 0
      })

      const diff = totalPropositions - totalOffres

      // Alerte si sous-proposition significative (< -5)
      if (diff < -5) {
        alerts.push({
          type: 'offer_deficit',
          category: 'offres',
          pfpType: pfp,
          severity: Math.abs(diff) > 15 ? 'error' : 'warn',
          title: `Déficit de propositions ${pfp}`,
          message: `${pfp}: ${totalPropositions} propositions pour ${totalOffres} offres (${diff})`,
          data: { offres: totalOffres, propositions: totalPropositions, diff },
          action: `Trouver ${Math.abs(diff)} propositions supplémentaires pour ${pfp}`,
          timestamp: new Date().toISOString()
        })
      }

      // Alerte si surproposition significative (> 10)
      if (diff > 10) {
        alerts.push({
          type: 'offer_surplus',
          category: 'offres',
          pfpType: pfp,
          severity: 'info',
          title: `Surplus de propositions ${pfp}`,
          message: `${pfp}: ${totalPropositions} propositions pour ${totalOffres} offres (+${diff})`,
          data: { offres: totalOffres, propositions: totalPropositions, diff },
          action: `Rééquilibrer les propositions ${pfp}`,
          timestamp: new Date().toISOString()
        })
      }

      // Alerte si aucune offre
      if (totalOffres === 0) {
        alerts.push({
          type: 'no_offers',
          category: 'offres',
          pfpType: pfp,
          severity: 'warn',
          title: `Aucune offre ${pfp}`,
          message: `${pfp}: aucune offre enregistrée pour ${year}`,
          data: { offres: 0, propositions: totalPropositions },
          action: `Vérifier les offres ${pfp} pour ${year}`,
          timestamp: new Date().toISOString()
        })
      }
    })

    return alerts
  }

  /**
   * Analyser les critères étudiants et détecter les problèmes
   */
  analyzeStudentCriteria(students) {
    const alerts = []
    const criteriaLabels = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
    const total = students.length

    if (total === 0) return alerts

    // Étudiants sans aucun critère validé
    const noCriteria = students.filter(s =>
      criteriaLabels.every(c => (s.scores?.[c] || 0) === 0)
    )

    if (noCriteria.length > 0) {
      const pct = Math.round((noCriteria.length / total) * 100)
      alerts.push({
        type: 'no_criteria',
        category: 'criteres',
        severity: pct > 30 ? 'error' : 'warn',
        title: `${noCriteria.length} étudiants sans critère validé`,
        message: `${pct}% des étudiants n'ont aucun critère de formation pratique validé`,
        data: { count: noCriteria.length, total, percent: pct },
        action: 'Vérifier les données de validation des critères',
        timestamp: new Date().toISOString()
      })
    }

    // Critères avec faible taux de validation (< 30%)
    criteriaLabels.forEach(crit => {
      const validated = students.filter(s => (s.scores?.[crit] || 0) > 0).length
      const pct = Math.round((validated / total) * 100)

      if (pct < 30 && pct > 0) {
        alerts.push({
          type: 'low_criteria',
          category: 'criteres',
          criteria: crit,
          severity: 'warn',
          title: `Critère ${crit} faiblement validé`,
          message: `Seulement ${pct}% des étudiants ont validé ${crit} (${validated}/${total})`,
          data: { criteria: crit, validated, total, percent: pct },
          action: `Vérifier les stages ${crit}`,
          timestamp: new Date().toISOString()
        })
      }
    })

    return alerts
  }

  /**
   * Analyser les évaluations CPT et détecter les retards
   */
  analyzeCptEvaluations(evaluations) {
    const alerts = []
    const total = evaluations.length

    if (total === 0) return alerts

    const cptFields = ['pfp1_cpt', 'pfp2_cpt', 'pfp3_cpt', 'pfp4_cpt']
    const evalFields = ['pfp1_eval', 'pfp2_eval', 'pfp3_eval', 'pfp4_eval']

    // CPT non renseignés
    const incompleteCpt = evaluations.filter(e =>
      cptFields.some(f => e[f] === null)
    ).length

    if (incompleteCpt > 0) {
      const pct = Math.round((incompleteCpt / total) * 100)
      alerts.push({
        type: 'incomplete_cpt',
        category: 'evaluations',
        severity: pct > 50 ? 'error' : 'warn',
        title: `${incompleteCpt} CPT incomplets`,
        message: `${pct}% des étudiants ont des CPT non renseignés`,
        data: { count: incompleteCpt, total, percent: pct },
        action: 'Relancer les répondants pour compléter les CPT',
        timestamp: new Date().toISOString()
      })
    }

    // Évaluations non renseignées
    const incompleteEval = evaluations.filter(e =>
      evalFields.some(f => e[f] === null)
    ).length

    if (incompleteEval > 0) {
      const pct = Math.round((incompleteEval / total) * 100)
      alerts.push({
        type: 'incomplete_eval',
        category: 'evaluations',
        severity: pct > 50 ? 'error' : 'warn',
        title: `${incompleteEval} évaluations incomplètes`,
        message: `${pct}% des étudiants ont des évaluations non renseignées`,
        data: { count: incompleteEval, total, percent: pct },
        action: 'Relancer pour compléter les évaluations',
        timestamp: new Date().toISOString()
      })
    }

    // CPT échoués (false)
    const failedCpt = evaluations.filter(e =>
      cptFields.some(f => e[f] === false)
    ).length

    if (failedCpt > 0) {
      alerts.push({
        type: 'failed_cpt',
        category: 'evaluations',
        severity: failedCpt > 5 ? 'error' : 'warn',
        title: `${failedCpt} CPT non conformes`,
        message: `${failedCpt} étudiants ont au moins un CPT non conforme`,
        data: { count: failedCpt, total },
        action: 'Planifier un suivi pour les CPT non conformes',
        timestamp: new Date().toISOString()
      })
    }

    return alerts
  }

  /**
   * Analyser les cas particuliers
   */
  analyzeCasParticuliers(cases) {
    const alerts = []
    const pfpFields = ['pfp1', 'pfp1_prime', 'pfp2', 'pfp2_prime', 'pfp3', 'pfp3_prime', 'pfp4', 'pfp4_prime']

    // Cas rouges non résolus
    const redCases = cases.filter(c =>
      pfpFields.some(f => c[f]?.couleur === 'rouge')
    )

    if (redCases.length > 0) {
      alerts.push({
        type: 'red_cases',
        category: 'cas_particuliers',
        severity: redCases.length > 5 ? 'error' : 'warn',
        title: `${redCases.length} cas rouges actifs`,
        message: `${redCases.length} étudiants ont au moins un PFP marqué en rouge`,
        data: { count: redCases.length, students: redCases.map(c => c.etudiant) },
        action: 'Traiter les cas rouges en priorité',
        timestamp: new Date().toISOString()
      })
    }

    // Cas noirs (situations critiques)
    const blackCases = cases.filter(c =>
      pfpFields.some(f => c[f]?.couleur === 'noir')
    )

    if (blackCases.length > 0) {
      alerts.push({
        type: 'black_cases',
        category: 'cas_particuliers',
        severity: 'error',
        title: `${blackCases.length} cas noirs`,
        message: `${blackCases.length} étudiants ont un PFP marqué en noir (situation critique)`,
        data: { count: blackCases.length, students: blackCases.map(c => c.etudiant) },
        action: 'Action immédiate requise pour les cas noirs',
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

    return alerts
  }

  /**
   * Lancer une analyse complète et stocker les alertes
   */
  runFullAnalysis({ places, year, students, evaluations, cases, institutions }) {
    this.alerts = []

    if (places && year) {
      this.alerts.push(...this.analyzeOffers(places, year))
    }
    if (students) {
      this.alerts.push(...this.analyzeStudentCriteria(students))
    }
    if (evaluations) {
      this.alerts.push(...this.analyzeCptEvaluations(evaluations))
    }
    if (cases) {
      this.alerts.push(...this.analyzeCasParticuliers(cases))
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
        criteres: this.alerts.filter(a => a.category === 'criteres').length,
        evaluations: this.alerts.filter(a => a.category === 'evaluations').length,
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
