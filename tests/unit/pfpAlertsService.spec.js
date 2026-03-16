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

    it('détecte aucune offre pour un PFP (totalOffres === 0)', () => {
      const places = [
        { PFP4: { '2026': '0' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const noOffer = alerts.find(a => a.type === 'no_offers' && a.pfpType === 'PFP4')
      expect(noOffer).toBeDefined()
      expect(noOffer.severity).toBe('warn')
      expect(noOffer.category).toBe('offres')
    })

    it('pas d\'alerte no_offers si PFP a des offres > 0', () => {
      const places = [
        { PFP1A: { '2026': '10' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      const pfp1aAlerts = alerts.filter(a => a.pfpType === 'PFP1A')
      expect(pfp1aAlerts).toHaveLength(0)
    })

    it('gère les places sans données — génère no_offers pour chaque PFP', () => {
      const places = [{ NomPlace: 'Test' }]
      const alerts = service.analyzeOffers(places, year)
      const noOffers = alerts.filter(a => a.type === 'no_offers')
      expect(noOffers).toHaveLength(5) // PFP1A, PFP1B, PFP2, PFP3, PFP4
    })

    it('agrège plusieurs places', () => {
      const places = [
        { PFP1A: { '2026': '5' } },
        { PFP1A: { '2026': '8' } }
      ]
      const alerts = service.analyzeOffers(places, year)
      // 5+8 = 13 > 0, donc pas de no_offers pour PFP1A
      const pfp1aAlerts = alerts.filter(a => a.pfpType === 'PFP1A')
      expect(pfp1aAlerts).toHaveLength(0)
    })

    it('retourne un tableau vide si places est vide', () => {
      const alerts = service.analyzeOffers([], year)
      // Aucune place → totalOffres = 0 pour tous les PFP
      const noOffers = alerts.filter(a => a.type === 'no_offers')
      expect(noOffers).toHaveLength(5)
    })
  })

  // ── analyzeNotes ───────────────────────────────────────────

  describe('analyzeNotes', () => {
    it('détecte les échecs sans retake (note F)', () => {
      const notes = [
        { user_id: 'u1', pfp1a: 'F', pfp1a_retake: '', pfp2: 'P' }
      ]
      const alerts = service.analyzeNotes(notes)
      const echec = alerts.find(a => a.type === 'echec_sans_retake')
      expect(echec).toBeDefined()
      expect(echec.data.count).toBe(1)
    })

    it('pas d\'alerte si F avec retake renseigné', () => {
      const notes = [
        { user_id: 'u1', pfp1a: 'F', pfp1a_retake: 'P' }
      ]
      const alerts = service.analyzeNotes(notes)
      const echec = alerts.find(a => a.type === 'echec_sans_retake')
      expect(echec).toBeUndefined()
    })

    it('détecte les échecs au rattrapage (retake = F)', () => {
      const notes = [
        { user_id: 'u1', pfp2_retake: 'F' }
      ]
      const alerts = service.analyzeNotes(notes)
      const echecRetake = alerts.find(a => a.type === 'echec_retake')
      expect(echecRetake).toBeDefined()
      expect(echecRetake.severity).toBe('error')
    })

    it('détecte les absences élevées (> 2 jours)', () => {
      const notes = [
        { user_id: 'u1', pfp1a_absences: 5 }
      ]
      const alerts = service.analyzeNotes(notes)
      const abs = alerts.find(a => a.type === 'high_absences')
      expect(abs).toBeDefined()
      expect(abs.data.count).toBe(1)
    })

    it('détecte les étudiants sans aucune note', () => {
      const notes = [
        { user_id: 'u1' }, // pas de note
        { user_id: 'u2', pfp1a: 'P' } // avec note
      ]
      const alerts = service.analyzeNotes(notes)
      const noNotes = alerts.find(a => a.type === 'no_notes')
      expect(noNotes).toBeDefined()
      expect(noNotes.data.count).toBe(1)
    })

    it('severity error si > 5 échecs sans retake', () => {
      const notes = Array(8).fill(null).map((_, i) => ({
        user_id: `u${i}`, pfp1a: 'F', pfp1a_retake: ''
      }))
      const alerts = service.analyzeNotes(notes)
      const echec = alerts.find(a => a.type === 'echec_sans_retake')
      expect(echec.severity).toBe('error')
    })

    it('retourne vide si pas de notes', () => {
      expect(service.analyzeNotes([])).toHaveLength(0)
      expect(service.analyzeNotes(null)).toHaveLength(0)
    })
  })

  // ── analyzeAssignments ─────────────────────────────────────

  describe('analyzeAssignments', () => {
    it('détecte les échecs PFP', () => {
      const assignments = [
        { user_id: 'u1', pfp_echec: true },
        { user_id: 'u2', pfp_echec: false }
      ]
      const alerts = service.analyzeAssignments(assignments)
      const echecs = alerts.find(a => a.type === 'pfp_echecs')
      expect(echecs).toBeDefined()
      expect(echecs.data.count).toBe(1)
    })

    it('détecte les arrêts PFP', () => {
      const assignments = [
        { user_id: 'u1', pfp_arret: true }
      ]
      const alerts = service.analyzeAssignments(assignments)
      const arrets = alerts.find(a => a.type === 'pfp_arrets')
      expect(arrets).toBeDefined()
    })

    it('détecte les attributions sans place assignée', () => {
      const assignments = [
        { user_id: 'u1', assigned_place_id: null, assigned_place_name: null },
        { user_id: 'u2', assigned_place_id: 'p1', assigned_place_name: 'Place 1' }
      ]
      const alerts = service.analyzeAssignments(assignments)
      const noPlace = alerts.find(a => a.type === 'no_place_assigned')
      expect(noPlace).toBeDefined()
      expect(noPlace.data.count).toBe(1)
    })

    it('severity error si > 5 échecs', () => {
      const assignments = Array(8).fill(null).map((_, i) => ({
        user_id: `u${i}`, pfp_echec: true
      }))
      const alerts = service.analyzeAssignments(assignments)
      const echecs = alerts.find(a => a.type === 'pfp_echecs')
      expect(echecs.severity).toBe('error')
    })

    it('retourne vide si pas d\'attributions', () => {
      expect(service.analyzeAssignments([])).toHaveLength(0)
      expect(service.analyzeAssignments(null)).toHaveLength(0)
    })
  })

  // ── analyzeCasParticuliers ─────────────────────────────────

  describe('analyzeCasParticuliers', () => {
    it('détecte les cas rouges (structure plate)', () => {
      const suivis = [
        { user_id: 'u1', couleur: 'rouge', commentaire: 'Problème' }
      ]
      const alerts = service.analyzeCasParticuliers(suivis)
      const red = alerts.find(a => a.type === 'red_cases')
      expect(red).toBeDefined()
      expect(red.data.count).toBe(1)
    })

    it('détecte les cas noirs', () => {
      const suivis = [
        { user_id: 'u1', couleur: 'noir', commentaire: 'Critique' }
      ]
      const alerts = service.analyzeCasParticuliers(suivis)
      const black = alerts.find(a => a.type === 'black_cases')
      expect(black).toBeDefined()
      expect(black.severity).toBe('error')
    })

    it('détecte les cas orange', () => {
      const suivis = [
        { user_id: 'u1', couleur: 'orange', commentaire: 'Attention' }
      ]
      const alerts = service.analyzeCasParticuliers(suivis)
      const orange = alerts.find(a => a.type === 'orange_cases')
      expect(orange).toBeDefined()
      expect(orange.severity).toBe('info')
    })

    it('severity error si > 5 cas rouges (étudiants uniques)', () => {
      const suivis = Array(8).fill(null).map((_, i) => ({
        user_id: `u${i}`, couleur: 'rouge', commentaire: 'test'
      }))
      const alerts = service.analyzeCasParticuliers(suivis)
      const red = alerts.find(a => a.type === 'red_cases')
      expect(red.severity).toBe('error')
    })

    it('compte les étudiants uniques, pas les entrées', () => {
      const suivis = [
        { user_id: 'u1', couleur: 'rouge', commentaire: 'PFP1' },
        { user_id: 'u1', couleur: 'rouge', commentaire: 'PFP2' }, // même étudiant
        { user_id: 'u2', couleur: 'rouge', commentaire: 'PFP3' }
      ]
      const alerts = service.analyzeCasParticuliers(suivis)
      const red = alerts.find(a => a.type === 'red_cases')
      expect(red.data.count).toBe(2) // 2 étudiants uniques
    })

    it('pas d\'alerte si aucun cas rouge/noir/orange', () => {
      const suivis = [
        { user_id: 'u1', couleur: 'vert', commentaire: 'Bien' }
      ]
      const alerts = service.analyzeCasParticuliers(suivis)
      expect(alerts).toHaveLength(0)
    })

    it('retourne vide si pas de suivis', () => {
      expect(service.analyzeCasParticuliers([])).toHaveLength(0)
      expect(service.analyzeCasParticuliers(null)).toHaveLength(0)
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

    it('retourne vide si pas d\'institutions', () => {
      expect(service.analyzeInstitutions([])).toHaveLength(0)
      expect(service.analyzeInstitutions(null)).toHaveLength(0)
    })
  })

  // ── runFullAnalysis ────────────────────────────────────────

  describe('runFullAnalysis', () => {
    it('agrège les alertes de toutes les sources', () => {
      const data = {
        places: [{ NomPlace: 'Test' }], // pas de PFP → 5 no_offers
        year: '2026',
        notes: [{ user_id: 'u1', pfp1a: 'F', pfp1a_retake: '' }],
        assignments: [{ user_id: 'u1', pfp_echec: true }],
        suivis: [{ user_id: 'u1', couleur: 'rouge', commentaire: 'x' }],
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

    it('fonctionne avec des données vides', () => {
      const alerts = service.runFullAnalysis({})
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
        { category: 'cas_particuliers', type: 'b' },
        { category: 'offres', type: 'c' }
      ]
      expect(service.getAlertsByCategory('offres')).toHaveLength(2)
      expect(service.getAlertsByCategory('cas_particuliers')).toHaveLength(1)
      expect(service.getAlertsByCategory('unknown')).toHaveLength(0)
    })
  })

  // ── getStats ───────────────────────────────────────────────

  describe('getStats', () => {
    it('calcule les statistiques correctement', () => {
      service.alerts = [
        { severity: 'error', category: 'offres' },
        { severity: 'warn', category: 'offres' },
        { severity: 'warn', category: 'cas_particuliers' },
        { severity: 'info', category: 'institutions' }
      ]

      const stats = service.getStats()
      expect(stats.total).toBe(4)
      expect(stats.critical).toBe(1)
      expect(stats.warning).toBe(2)
      expect(stats.info).toBe(1)
      expect(stats.byCategory.offres).toBe(2)
      expect(stats.byCategory.cas_particuliers).toBe(1)
      expect(stats.byCategory.institutions).toBe(1)
      expect(stats.byCategory.notes).toBe(0)
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
