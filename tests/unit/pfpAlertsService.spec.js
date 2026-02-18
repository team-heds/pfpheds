import { describe, it, expect, beforeEach } from 'vitest'
import { PfpAlertsService } from '@/service/pfpAlertsService'

describe('PfpAlertsService', () => {
  let service

  beforeEach(() => {
    service = new PfpAlertsService()
  })

  // ── analyzeOffers ──────────────────────────────────────────

  describe('analyzeOffers', () => {
    const year = '2026'

    it('détecte un déficit de propositions (< -5)', () => {
      const places = [
        { PFP1A: { '2026': '10' }, pfp1a_proposition: { '2026': '2' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const deficit = alerts.find(a => a.type === 'offer_deficit')
      expect(deficit).toBeDefined()
      expect(deficit.pfpType).toBe('PFP1A')
      expect(deficit.data.diff).toBe(-8)
    })

    it('severity error pour un gros déficit (> 15)', () => {
      const places = [
        { PFP2: { '2026': '20' }, pfp2_proposition: { '2026': '2' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const deficit = alerts.find(a => a.type === 'offer_deficit' && a.pfpType === 'PFP2')
      expect(deficit.severity).toBe('error')
    })

    it('severity warn pour un petit déficit (5-15)', () => {
      const places = [
        { PFP3: { '2026': '12' }, pfp3_proposition: { '2026': '4' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const deficit = alerts.find(a => a.type === 'offer_deficit' && a.pfpType === 'PFP3')
      expect(deficit.severity).toBe('warn')
    })

    it('détecte un surplus de propositions (> 10)', () => {
      const places = [
        { PFP1B: { '2026': '5' }, pfp1b_proposition: { '2026': '20' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const surplus = alerts.find(a => a.type === 'offer_surplus')
      expect(surplus).toBeDefined()
      expect(surplus.severity).toBe('info')
    })

    it('détecte aucune offre pour un PFP', () => {
      const places = [
        { PFP4: { '2026': '0' }, pfp4_proposition: { '2026': '3' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const noOffer = alerts.find(a => a.type === 'no_offers' && a.pfpType === 'PFP4')
      expect(noOffer).toBeDefined()
    })

    it('pas d\'alerte si offres et propositions sont équilibrées', () => {
      const places = [
        { PFP1A: { '2026': '10' }, pfp1a_proposition: { '2026': '10' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const pfp1aAlerts = alerts.filter(a => a.pfpType === 'PFP1A')
      expect(pfp1aAlerts).toHaveLength(0)
    })

    it('gère les places sans données', () => {
      const places = [{ NomPlace: 'Test' }]
      const alerts = service.analyzeOffers(places, year)
      // Devrait générer des alertes "no_offers" pour chaque PFP
      const noOffers = alerts.filter(a => a.type === 'no_offers')
      expect(noOffers).toHaveLength(5)
    })

    it('agrège plusieurs places', () => {
      const places = [
        { PFP1A: { '2026': '5' }, pfp1a_proposition: { '2026': '1' } },
        { PFP1A: { '2026': '8' }, pfp1a_proposition: { '2026': '1' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const deficit = alerts.find(a => a.type === 'offer_deficit' && a.pfpType === 'PFP1A')
      expect(deficit).toBeDefined()
      expect(deficit.data.offres).toBe(13)
      expect(deficit.data.propositions).toBe(2)
    })
  })

  // ── analyzeStudentCriteria ─────────────────────────────────

  describe('analyzeStudentCriteria', () => {
    it('détecte les étudiants sans aucun critère', () => {
      const students = [
        { scores: { MSQ: 0, SYSINT: 0, NEUROGER: 0, AIGU: 0, REHAB: 0, AMBU: 0, FR: 0, DE: 0 } },
        { scores: { MSQ: 1, SYSINT: 0, NEUROGER: 0, AIGU: 0, REHAB: 0, AMBU: 0, FR: 0, DE: 0 } }
      ]
      const alerts = service.analyzeStudentCriteria(students)
      const noCrit = alerts.find(a => a.type === 'no_criteria')
      expect(noCrit).toBeDefined()
      expect(noCrit.data.count).toBe(1)
      expect(noCrit.data.percent).toBe(50)
    })

    it('severity error si > 30% sans critère', () => {
      const students = Array(10).fill(null).map(() => ({
        scores: { MSQ: 0, SYSINT: 0, NEUROGER: 0, AIGU: 0, REHAB: 0, AMBU: 0, FR: 0, DE: 0 }
      }))
      // Ajouter 5 avec critères
      for (let i = 0; i < 5; i++) {
        students.push({ scores: { MSQ: 1, SYSINT: 1, NEUROGER: 1, AIGU: 1, REHAB: 1, AMBU: 1, FR: 1, DE: 1 } })
      }
      const alerts = service.analyzeStudentCriteria(students)
      const noCrit = alerts.find(a => a.type === 'no_criteria')
      expect(noCrit.severity).toBe('error')
    })

    it('détecte les critères faiblement validés (< 30%)', () => {
      const students = Array(10).fill(null).map(() => ({
        scores: { MSQ: 0, SYSINT: 1, NEUROGER: 1, AIGU: 1, REHAB: 1, AMBU: 1, FR: 1, DE: 1 }
      }))
      // 2 étudiants avec MSQ validé
      students[0].scores.MSQ = 1
      students[1].scores.MSQ = 1

      const alerts = service.analyzeStudentCriteria(students)
      const lowMSQ = alerts.find(a => a.type === 'low_criteria' && a.criteria === 'MSQ')
      expect(lowMSQ).toBeDefined()
      expect(lowMSQ.data.percent).toBe(20)
    })

    it('pas d\'alerte si tous les critères sont bien validés', () => {
      const students = Array(10).fill(null).map(() => ({
        scores: { MSQ: 2, SYSINT: 1, NEUROGER: 1, AIGU: 1, REHAB: 1, AMBU: 1, FR: 1, DE: 1 }
      }))
      const alerts = service.analyzeStudentCriteria(students)
      expect(alerts).toHaveLength(0)
    })

    it('retourne vide si pas d\'étudiants', () => {
      expect(service.analyzeStudentCriteria([])).toHaveLength(0)
    })
  })

  // ── analyzeCptEvaluations ──────────────────────────────────

  describe('analyzeCptEvaluations', () => {
    it('détecte les CPT incomplets (null)', () => {
      const evals = [
        { pfp1_cpt: true, pfp2_cpt: null, pfp3_cpt: true, pfp4_cpt: true, pfp1_eval: true, pfp2_eval: true, pfp3_eval: true, pfp4_eval: true },
        { pfp1_cpt: true, pfp2_cpt: true, pfp3_cpt: true, pfp4_cpt: true, pfp1_eval: true, pfp2_eval: true, pfp3_eval: true, pfp4_eval: true }
      ]
      const alerts = service.analyzeCptEvaluations(evals)
      const incomplete = alerts.find(a => a.type === 'incomplete_cpt')
      expect(incomplete).toBeDefined()
      expect(incomplete.data.count).toBe(1)
    })

    it('détecte les évaluations incomplètes', () => {
      const evals = [
        { pfp1_cpt: true, pfp2_cpt: true, pfp3_cpt: true, pfp4_cpt: true, pfp1_eval: null, pfp2_eval: null, pfp3_eval: true, pfp4_eval: true }
      ]
      const alerts = service.analyzeCptEvaluations(evals)
      const incomplete = alerts.find(a => a.type === 'incomplete_eval')
      expect(incomplete).toBeDefined()
    })

    it('détecte les CPT non conformes (false)', () => {
      const evals = [
        { pfp1_cpt: false, pfp2_cpt: true, pfp3_cpt: true, pfp4_cpt: true, pfp1_eval: true, pfp2_eval: true, pfp3_eval: true, pfp4_eval: true }
      ]
      const alerts = service.analyzeCptEvaluations(evals)
      const failed = alerts.find(a => a.type === 'failed_cpt')
      expect(failed).toBeDefined()
      expect(failed.data.count).toBe(1)
    })

    it('severity error si > 50% incomplets', () => {
      const evals = Array(10).fill(null).map(() => ({
        pfp1_cpt: null, pfp2_cpt: null, pfp3_cpt: null, pfp4_cpt: null,
        pfp1_eval: null, pfp2_eval: null, pfp3_eval: null, pfp4_eval: null
      }))
      const alerts = service.analyzeCptEvaluations(evals)
      const incomplete = alerts.find(a => a.type === 'incomplete_cpt')
      expect(incomplete.severity).toBe('error')
    })

    it('retourne vide si pas d\'évaluations', () => {
      expect(service.analyzeCptEvaluations([])).toHaveLength(0)
    })

    it('pas d\'alerte si tout est complet et conforme', () => {
      const evals = [
        { pfp1_cpt: true, pfp2_cpt: true, pfp3_cpt: true, pfp4_cpt: true, pfp1_eval: true, pfp2_eval: true, pfp3_eval: true, pfp4_eval: true }
      ]
      const alerts = service.analyzeCptEvaluations(evals)
      expect(alerts).toHaveLength(0)
    })
  })

  // ── analyzeCasParticuliers ─────────────────────────────────

  describe('analyzeCasParticuliers', () => {
    it('détecte les cas rouges', () => {
      const cases = [
        { etudiant: 'DUPONT Jean', pfp1: { couleur: 'rouge', commentaire: 'Problème' }, pfp2: { couleur: 'blanc', commentaire: '' } }
      ]
      const alerts = service.analyzeCasParticuliers(cases)
      const red = alerts.find(a => a.type === 'red_cases')
      expect(red).toBeDefined()
      expect(red.data.count).toBe(1)
    })

    it('détecte les cas noirs', () => {
      const cases = [
        { etudiant: 'MARTIN Paul', pfp3: { couleur: 'noir', commentaire: 'Critique' } }
      ]
      const alerts = service.analyzeCasParticuliers(cases)
      const black = alerts.find(a => a.type === 'black_cases')
      expect(black).toBeDefined()
      expect(black.severity).toBe('error')
    })

    it('severity error si > 5 cas rouges', () => {
      const cases = Array(8).fill(null).map((_, i) => ({
        etudiant: `Étudiant ${i}`,
        pfp1: { couleur: 'rouge', commentaire: 'test' }
      }))
      const alerts = service.analyzeCasParticuliers(cases)
      const red = alerts.find(a => a.type === 'red_cases')
      expect(red.severity).toBe('error')
    })

    it('pas d\'alerte si aucun cas rouge/noir', () => {
      const cases = [
        { etudiant: 'OK', pfp1: { couleur: 'vert', commentaire: 'Bien' } }
      ]
      const alerts = service.analyzeCasParticuliers(cases)
      expect(alerts).toHaveLength(0)
    })
  })

  // ── analyzeInstitutions ────────────────────────────────────

  describe('analyzeInstitutions', () => {
    it('détecte les institutions sans aucun document', () => {
      const institutions = [
        { Name: 'Hôpital A', ConventionDate: null, AccordCadreDate: null },
        { Name: 'Clinique B', ConventionDate: '2024-01-01', AccordCadreDate: '2024-06-01' }
      ]
      const alerts = service.analyzeInstitutions(institutions)
      const noDocs = alerts.find(a => a.type === 'no_docs')
      expect(noDocs).toBeDefined()
      expect(noDocs.data.count).toBe(1)
    })

    it('détecte les conventions manquantes (avec accord)', () => {
      const institutions = [
        { Name: 'Inst A', ConventionDate: null, AccordCadreDate: '2024-01-01' }
      ]
      const alerts = service.analyzeInstitutions(institutions)
      const noConv = alerts.find(a => a.type === 'no_convention')
      expect(noConv).toBeDefined()
    })

    it('severity error si > 10 institutions sans docs', () => {
      const institutions = Array(15).fill(null).map((_, i) => ({
        Name: `Inst ${i}`, ConventionDate: null, AccordCadreDate: null
      }))
      const alerts = service.analyzeInstitutions(institutions)
      const noDocs = alerts.find(a => a.type === 'no_docs')
      expect(noDocs.severity).toBe('error')
    })

    it('pas d\'alerte si toutes les institutions sont complètes', () => {
      const institutions = [
        { Name: 'OK', ConventionDate: '2024-01-01', AccordCadreDate: '2024-06-01' }
      ]
      const alerts = service.analyzeInstitutions(institutions)
      expect(alerts).toHaveLength(0)
    })
  })

  // ── runFullAnalysis ────────────────────────────────────────

  describe('runFullAnalysis', () => {
    it('agrège les alertes de toutes les sources', () => {
      const data = {
        places: [{ PFP1A: { '2026': '20' }, pfp1a_proposition: { '2026': '2' } }],
        year: '2026',
        students: [{ scores: { MSQ: 0, SYSINT: 0, NEUROGER: 0, AIGU: 0, REHAB: 0, AMBU: 0, FR: 0, DE: 0 } }],
        evaluations: [{ pfp1_cpt: null, pfp2_cpt: null, pfp3_cpt: null, pfp4_cpt: null, pfp1_eval: null, pfp2_eval: null, pfp3_eval: null, pfp4_eval: null }],
        cases: [{ etudiant: 'Test', pfp1: { couleur: 'rouge', commentaire: 'x' } }],
        institutions: [{ Name: 'X', ConventionDate: null, AccordCadreDate: null }]
      }

      const alerts = service.runFullAnalysis(data)
      expect(alerts.length).toBeGreaterThan(0)

      // Vérifier le tri par sévérité: tous les error avant les warn, tous les warn avant les info
      const severities = alerts.map(a => a.severity)
      const lastErrorIdx = severities.lastIndexOf('error')
      const firstWarnIdx = severities.indexOf('warn')
      const lastWarnIdx = severities.lastIndexOf('warn')
      const firstInfoIdx = severities.indexOf('info')
      if (lastErrorIdx >= 0 && firstWarnIdx >= 0) expect(lastErrorIdx).toBeLessThan(firstWarnIdx)
      if (lastWarnIdx >= 0 && firstInfoIdx >= 0) expect(lastWarnIdx).toBeLessThan(firstInfoIdx)
    })

    it('fonctionne avec des données partielles', () => {
      const alerts = service.runFullAnalysis({ students: [] })
      expect(alerts).toEqual([])
    })

    it('vide les alertes précédentes', () => {
      service.alerts = [{ type: 'old' }]
      service.runFullAnalysis({})
      expect(service.alerts).toHaveLength(0)
    })
  })

  // ── getAlertsByCategory ────────────────────────────────────

  describe('getAlertsByCategory', () => {
    it('filtre par catégorie', () => {
      service.alerts = [
        { category: 'offres', type: 'a' },
        { category: 'criteres', type: 'b' },
        { category: 'offres', type: 'c' }
      ]
      expect(service.getAlertsByCategory('offres')).toHaveLength(2)
      expect(service.getAlertsByCategory('criteres')).toHaveLength(1)
      expect(service.getAlertsByCategory('unknown')).toHaveLength(0)
    })
  })

  // ── getStats ───────────────────────────────────────────────

  describe('getStats', () => {
    it('calcule les statistiques correctement', () => {
      service.alerts = [
        { severity: 'error', category: 'offres' },
        { severity: 'warn', category: 'offres' },
        { severity: 'warn', category: 'criteres' },
        { severity: 'info', category: 'institutions' }
      ]

      const stats = service.getStats()
      expect(stats.total).toBe(4)
      expect(stats.critical).toBe(1)
      expect(stats.warning).toBe(2)
      expect(stats.info).toBe(1)
      expect(stats.byCategory.offres).toBe(2)
      expect(stats.byCategory.criteres).toBe(1)
      expect(stats.byCategory.institutions).toBe(1)
      expect(stats.byCategory.evaluations).toBe(0)
    })

    it('retourne des zéros si aucune alerte', () => {
      const stats = service.getStats()
      expect(stats.total).toBe(0)
      expect(stats.critical).toBe(0)
    })
  })

  // ── clear ──────────────────────────────────────────────────

  describe('clear', () => {
    it('vide les alertes', () => {
      service.alerts = [{ type: 'test' }, { type: 'test2' }]
      service.clear()
      expect(service.alerts).toHaveLength(0)
    })
  })
})
