/**
 * Service de Gestion du Planning Académique
 * Gère la structure de programme Bachelor of Science in Nursing
 */

import { ref as dbRef, get, set, update, push, remove } from 'firebase/database'
import { db } from '../../firebase.js'

class AcademicPlanningService {
  constructor() {
    this.basePath = 'academic_planning'
  }

  // ==================== GESTION DES ANNÉES ACADÉMIQUES ====================

  /**
   * Récupère toutes les années académiques
   */
  async getAllAcademicYears() {
    try {
      const yearsRef = dbRef(db, `${this.basePath}/years`)
      const snapshot = await get(yearsRef)
      return snapshot.val() || {}
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur getAllAcademicYears:', error)
      throw error
    }
  }

  /**
   * Récupère une année académique spécifique
   */
  async getAcademicYear(yearId) {
    try {
      const yearRef = dbRef(db, `${this.basePath}/years/${yearId}`)
      const snapshot = await get(yearRef)
      return snapshot.val()
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur getAcademicYear:', error)
      throw error
    }
  }

  /**
   * Crée ou met à jour une année académique
   */
  async saveAcademicYear(yearId, yearData) {
    try {
      const yearRef = dbRef(db, `${this.basePath}/years/${yearId}`)
      await set(yearRef, {
        ...yearData,
        lastUpdated: new Date().toISOString()
      })
      console.log('[AcademicPlanningService] Année académique sauvegardée:', yearId)
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur saveAcademicYear:', error)
      throw error
    }
  }

  // ==================== GESTION DES CELLULES DE PLANNING ====================

  /**
   * Récupère les cellules de planning pour une année/semestre spécifique
   */
  async getPlanningCells(yearId, semester) {
    try {
      const cellsRef = dbRef(db, `${this.basePath}/years/${yearId}/semesters/${semester}/cells`)
      const snapshot = await get(cellsRef)
      return snapshot.val() || {}
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur getPlanningCells:', error)
      throw error
    }
  }

  /**
   * Sauvegarde une cellule de planning
   * @param {string} yearId - ID de l'année (ex: "bac25")
   * @param {string} semester - Semestre ("autumn" ou "spring")
   * @param {string} day - Jour de la semaine ("lu", "ma", "me", "je", "ve")
   * @param {number} week - Numéro de semaine
   * @param {object} cellData - Données de la cellule (courseCode, color, label, etc.)
   */
  async savePlanningCell(yearId, semester, day, week, cellData) {
    try {
      const cellRef = dbRef(db, `${this.basePath}/years/${yearId}/semesters/${semester}/cells/${day}_${week}`)
      await set(cellRef, {
        ...cellData,
        day,
        week,
        lastUpdated: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur savePlanningCell:', error)
      throw error
    }
  }

  /**
   * Supprime une cellule de planning
   */
  async deletePlanningCell(yearId, semester, day, week) {
    try {
      const cellRef = dbRef(db, `${this.basePath}/years/${yearId}/semesters/${semester}/cells/${day}_${week}`)
      await remove(cellRef)
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur deletePlanningCell:', error)
      throw error
    }
  }

  // ==================== GESTION DES CODES DE COURS ====================

  /**
   * Récupère tous les codes de cours (légende)
   */
  async getAllCourseCodes() {
    try {
      const codesRef = dbRef(db, `${this.basePath}/course_codes`)
      const snapshot = await get(codesRef)
      return snapshot.val() || {}
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur getAllCourseCodes:', error)
      throw error
    }
  }

  /**
   * Ajoute ou met à jour un code de cours
   */
  async saveCourseCode(codeId, codeData) {
    try {
      const codeRef = dbRef(db, `${this.basePath}/course_codes/${codeId}`)
      await set(codeRef, {
        ...codeData,
        id: codeId,
        lastUpdated: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur saveCourseCode:', error)
      throw error
    }
  }

  /**
   * Supprime un code de cours
   */
  async deleteCourseCode(codeId) {
    try {
      const codeRef = dbRef(db, `${this.basePath}/course_codes/${codeId}`)
      await remove(codeRef)
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur deleteCourseCode:', error)
      throw error
    }
  }

  // ==================== UTILITAIRES ====================

  /**
   * Initialise le planning avec les données par défaut
   */
  async initializeDefaultPlanning() {
    try {
      // Codes de cours par défaut avec palette cohérente
      const defaultCourseCodes = {
        // 1ère année - MODULES THÉORIQUES (Bleus)
        'ia1': {
          moduleNumber: '1011',
          label: 'Éthique et communication 1a',
          color: '#64B5F6',  // Bleu clair
          year: 1
        },
        'ia1b': {
          moduleNumber: '1012',
          label: 'Introduction à la santé et chirurgie adulte',
          color: '#42A5F5',  // Bleu moyen
          year: 1
        },
        'ia1c': {
          moduleNumber: '1013',
          label: 'Douleur et soins de fin de vie',
          color: '#2196F3',  // Bleu
          year: 1
        },
        'ia1d': {
          moduleNumber: '1014',
          label: 'Raisonnement clinique 1a',
          color: '#1E88E5',  // Bleu foncé
          year: 1
        },
        'ia1e': {
          moduleNumber: '1015',
          label: 'EBP 1a',
          color: '#1976D2',  // Bleu très foncé
          year: 1
        },
        
        // 1ère année - PFP (Verts)
        'pfp1': {
          moduleNumber: 'PFP1',
          label: 'PFP 1',
          color: '#66BB6A',  // Vert clair
          year: 1
        },
        'pfp2': {
          moduleNumber: 'PFP2',
          label: 'PFP 2',
          color: '#4CAF50',  // Vert
          year: 1
        },
        
        // JOURS FÉRIÉS (Gris foncés)
        'immacule_conception': {
          label: 'Immaculée Conception',
          color: '#616161',  // Gris foncé
          year: 1
        },
        'escalade': {
          label: 'Escalade',
          color: '#757575',  // Gris moyen
          year: 1
        },
        'ascension': {
          label: 'Ascension',
          color: '#616161',  // Gris foncé
          year: 1
        },
        'fete_dieu': {
          label: 'Fête-Dieu',
          color: '#757575',  // Gris moyen
          year: 1
        },
        
        // VACANCES ET INTERRUPTIONS (Oranges/Jaunes)
        'vacances': {
          label: 'Vacances',
          color: '#FFA726',  // Orange
          year: 1
        },
        'interruption_cours': {
          label: 'Interruption de cours',
          color: '#FFB74D',  // Orange clair
          year: 1
        },

        // 2ème année - MODULES THÉORIQUES (Violets/Mauves)
        'ia2': {
          moduleNumber: '2011',
          label: 'Raisonnement clinique 2',
          color: '#BA68C8',  // Violet clair
          year: 2
        },
        'ia2b': {
          moduleNumber: '2021',
          label: 'Soins psychoéducatifs et soins en chirurgie',
          color: '#AB47BC',  // Violet moyen
          year: 2
        },
        'ia2c': {
          moduleNumber: '2031',
          label: 'Environnement professionnel',
          color: '#9C27B0',  // Violet
          year: 2
        },
        'ia2d': {
          moduleNumber: '2041',
          label: 'PI&AgP et communication en soins 2b',
          color: '#8E24AA',  // Violet foncé
          year: 2
        },
        'ia2e': {
          moduleNumber: '2051',
          label: 'Éthique et communication 2b',
          color: '#7B1FA2',  // Violet très foncé
          year: 2
        },
        'ia2f': {
          moduleNumber: '2061',
          label: 'Soins cardio-vasculaires et réanimation',
          color: '#CE93D8',  // Violet très clair
          year: 2
        },
        'ia2g': {
          moduleNumber: '2071',
          label: 'Soins respiratoires et rénaux',
          color: '#AB47BC',  // Violet moyen
          year: 2
        },
        
        // 2ème année - PFP (Verts)
        'pfp3': {
          moduleNumber: 'PFP3',
          label: 'PFP 3',
          color: '#66BB6A',  // Vert clair
          year: 2
        },
        'pfp4': {
          moduleNumber: 'PFP4',
          label: 'PFP 4',
          color: '#4CAF50',  // Vert
          year: 2
        },

        // 3ème année - MODULES THÉORIQUES (Cyan/Teal)
        'ia3': {
          moduleNumber: '3014',
          label: 'Raisonnement clinique 3',
          color: '#4DD0E1',  // Cyan clair
          year: 3
        },
        'ia3a': {
          moduleNumber: '3033',
          label: 'Éthique et communication 3',
          color: '#26C6DA',  // Cyan moyen
          year: 3
        },
        'ia3b': {
          moduleNumber: '3041',
          label: 'Polypathologie et états de choc',
          color: '#00BCD4',  // Cyan
          year: 3
        },
        'ia3c': {
          moduleNumber: '3043',
          label: 'Oncologie et soins palliatifs',
          color: '#00ACC1',  // Cyan foncé
          year: 3
        },
        'ia3d': {
          moduleNumber: '3051',
          label: 'Module à option',
          color: '#0097A7',  // Cyan très foncé
          year: 3
        },
        'ia3e': {
          moduleNumber: '3016',
          label: 'TB Travail de Bachelor',
          color: '#00838F',  // Teal foncé
          year: 3
        },
        
        // 3ème année - PFP (Verts)
        'pfp5': {
          moduleNumber: 'PFP5',
          label: 'PFP 5',
          color: '#66BB6A',  // Vert clair
          year: 3
        },
        'pfp6': {
          moduleNumber: 'PFP6',
          label: 'PFP 6',
          color: '#4CAF50',  // Vert
          year: 3
        },
        
        // ÉVALUATION FINALE (Rouge)
        'synthese_tb': {
          moduleNumber: 'TB',
          label: 'Synthèse TB',
          color: '#EF5350',  // Rouge clair
          year: 3
        }
      }

      // Sauvegarder les codes de cours
      for (const [codeId, codeData] of Object.entries(defaultCourseCodes)) {
        await this.saveCourseCode(codeId, codeData)
      }

      // Créer les structures pour les 3 années
      const years = ['bac25', 'bac24', 'bac23']
      const yearLabels = {
        'bac25': '1ère année 2025-2026 / Bac 25',
        'bac24': '2ème année 2025-2026 / Bac 24',
        'bac23': '3ème année 2025-2026 / Bac 23'
      }

      for (const yearId of years) {
        await this.saveAcademicYear(yearId, {
          id: yearId,
          label: yearLabels[yearId],
          academicYear: '2025-2026',
          semesters: {
            autumn: {
              label: "Semestre d'automne",
              startWeek: 38,
              endWeek: 51,
              cells: {}
            },
            spring: {
              label: "Semestre de printemps",
              startWeek: 1,
              endWeek: 37,
              cells: {}
            }
          }
        })
      }

      console.log('[AcademicPlanningService] Planning par défaut initialisé')
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur initializeDefaultPlanning:', error)
      throw error
    }
  }

  /**
   * Génère la grille de semaines pour un semestre
   */
  generateWeekGrid(semester) {
    if (semester === 'autumn') {
      // Automne : S38-S52 (15 semaines) + S1-S7 (7 semaines) = 22 semaines
      const endOfYear = Array.from({ length: 15 }, (_, i) => i + 38) // 38-52
      const startOfYear = Array.from({ length: 7 }, (_, i) => i + 1) // 1-7
      return [...endOfYear, ...startOfYear]
    } else {
      // Printemps : S8-S37 (30 semaines)
      return Array.from({ length: 30 }, (_, i) => i + 8) // Semaines 8-37
    }
  }

  /**
   * Génère toutes les semaines de l'année académique
   */
  generateAllWeeks() {
    // Automne (38-52 + 1-7) + Printemps (8-37)
    const autumnEnd = Array.from({ length: 15 }, (_, i) => i + 38) // 38-52
    const autumnStart = Array.from({ length: 7 }, (_, i) => i + 1) // 1-7
    const springWeeks = Array.from({ length: 30 }, (_, i) => i + 8) // 8-37
    return [...autumnEnd, ...autumnStart, ...springWeeks]
  }

  /**
   * Ajoute les numéros de module aux codes existants
   */
  async migrateModuleNumbers() {
    try {
      const moduleNumbers = {
        // 1ère année
        'ia1': '1011',
        'ia1b': '1012',
        'ia1c': '1013',
        'ia1d': '1014',
        'ia1e': '1015',
        'pfp1': 'PFP1',
        'pfp2': 'PFP2',
        
        // 2ème année
        'ia2': '2011',
        'ia2b': '2021',
        'ia2c': '2031',
        'ia2d': '2041',
        'ia2e': '2051',
        'ia2f': '2061',
        'ia2g': '2071',
        'pfp3': 'PFP3',
        'pfp4': 'PFP4',
        
        // 3ème année
        'ia3': '3014',
        'ia3a': '3033',
        'ia3b': '3041',
        'ia3c': '3043',
        'ia3d': '3051',
        'ia3e': '3016',
        'pfp5': 'PFP5',
        'pfp6': 'PFP6',
        'synthese_tb': 'TB'
      }

      const courseCodes = await this.getAllCourseCodes()
      
      for (const [codeId, moduleNumber] of Object.entries(moduleNumbers)) {
        if (courseCodes[codeId]) {
          await update(dbRef(db, `${this.basePath}/courseCodes/${codeId}`), {
            moduleNumber: moduleNumber
          })
        }
      }
      
      console.log('[AcademicPlanningService] Numéros de module migrés avec succès')
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur migrateModuleNumbers:', error)
      throw error
    }
  }

  /**
   * Obtient la couleur d'un code de cours
   */
  async getCourseCodeColor(codeId) {
    try {
      const codes = await this.getAllCourseCodes()
      return codes[codeId]?.color || '#CCCCCC'
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur getCourseCodeColor:', error)
      return '#CCCCCC'
    }
  }

  /**
   * Clone un planning d'une année à une autre
   */
  async clonePlanning(fromYearId, toYearId) {
    try {
      const fromYear = await this.getAcademicYear(fromYearId)
      if (!fromYear) {
        throw new Error('Année source introuvable')
      }

      await this.saveAcademicYear(toYearId, {
        ...fromYear,
        id: toYearId
      })

      console.log(`[AcademicPlanningService] Planning cloné de ${fromYearId} vers ${toYearId}`)
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur clonePlanning:', error)
      throw error
    }
  }

  /**
   * Exporte le planning en JSON
   */
  async exportPlanningToJSON(yearId) {
    try {
      const yearData = await this.getAcademicYear(yearId)
      const courseCodes = await this.getAllCourseCodes()

      const exportData = {
        year: yearData,
        courseCodes,
        exportDate: new Date().toISOString()
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur exportPlanningToJSON:', error)
      throw error
    }
  }

  /**
   * Exporte le planning en Excel
   */
  async exportPlanningToExcel(yearId) {
    try {
      // Import dynamique de xlsx
      const XLSX = await import('xlsx')
      
      const yearData = await this.getAcademicYear(yearId)
      const courseCodes = await this.getAllCourseCodes()

      if (!yearData) {
        throw new Error('Année académique non trouvée')
      }

      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new()

      // Fonction helper pour convertir hex en RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 }
      }

      // Générer les semestres
      const semesters = [
        { name: 'Automne', key: 'autumn', weeks: this.generateWeekGrid('autumn') },
        { name: 'Printemps', key: 'spring', weeks: this.generateWeekGrid('spring') }
      ]

      const days = ['lu', 'ma', 'me', 'je', 've']
      const dayLabels = {
        lu: 'Lundi',
        ma: 'Mardi',
        me: 'Mercredi',
        je: 'Jeudi',
        ve: 'Vendredi'
      }

      semesters.forEach(semester => {
        const cells = yearData.semesters?.[semester.key]?.cells || {}
        
        // Créer les données de la feuille
        const data = []
        
        // Header avec les numéros de semaines
        const header = ['Jour', ...semester.weeks.map(w => `S${w}`)]
        data.push(header)

        // Ajouter les lignes pour chaque jour
        days.forEach(day => {
          const row = [dayLabels[day]]
          semester.weeks.forEach(week => {
            const cellKey = `${day}_${week}`
            const cell = cells[cellKey]
            row.push(cell?.displayLabel || cell?.courseCode?.toUpperCase() || '')
          })
          data.push(row)
        })

        // Créer la feuille
        const ws = XLSX.utils.aoa_to_sheet(data)

        // Appliquer les styles et couleurs
        const range = XLSX.utils.decode_range(ws['!ref'])
        
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
            
            if (!ws[cellAddress]) continue

            // Style de base
            ws[cellAddress].s = {
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: 'FF000000' } },
                bottom: { style: 'thin', color: { rgb: 'FF000000' } },
                left: { style: 'thin', color: { rgb: 'FF000000' } },
                right: { style: 'thin', color: { rgb: 'FF000000' } }
              }
            }

            // Header row
            if (R === 0) {
              ws[cellAddress].s.font = { bold: true, color: { rgb: 'FFFFFFFF' } }
              ws[cellAddress].s.fill = { fgColor: { rgb: 'FF2196F3' } }
            }
            // Day column
            else if (C === 0) {
              ws[cellAddress].s.font = { bold: true }
              ws[cellAddress].s.fill = { fgColor: { rgb: 'FFE0E0E0' } }
            }
            // Data cells
            else {
              const day = days[R - 1]
              const week = semester.weeks[C - 1]
              const cellKey = `${day}_${week}`
              const cell = cells[cellKey]
              
              if (cell && cell.courseCode && courseCodes[cell.courseCode]) {
                const color = courseCodes[cell.courseCode].color
                const rgb = hexToRgb(color)
                const hexColor = `FF${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`
                ws[cellAddress].s.fill = { fgColor: { rgb: hexColor.toUpperCase() } }
                ws[cellAddress].s.font = { bold: true, color: { rgb: 'FFFFFFFF' } }
              }
            }
          }
        }

        // Définir les largeurs de colonnes
        ws['!cols'] = [{ wch: 12 }, ...semester.weeks.map(() => ({ wch: 8 }))]
        
        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, ws, semester.name)
      })

      // Ajouter une feuille pour la légende
      const legendData = [
        ['Code', 'Description', 'Couleur', 'Année'],
        ...Object.entries(courseCodes).map(([code, data]) => [
          code.toUpperCase(),
          data.label,
          data.color,
          data.year || '-'
        ])
      ]
      
      const wsLegend = XLSX.utils.aoa_to_sheet(legendData)
      
      // Style de la légende
      const legendRange = XLSX.utils.decode_range(wsLegend['!ref'])
      for (let C = legendRange.s.c; C <= legendRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
        if (wsLegend[cellAddress]) {
          wsLegend[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFFFF' } },
            fill: { fgColor: { rgb: 'FF2196F3' } },
            alignment: { horizontal: 'center' }
          }
        }
      }
      
      wsLegend['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 8 }]
      XLSX.utils.book_append_sheet(wb, wsLegend, 'Légende')

      // Générer le fichier
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true })
      
      return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur exportPlanningToExcel:', error)
      throw error
    }
  }

  /**
   * Importe un planning depuis JSON
   */
  async importPlanningFromJSON(jsonData, yearId) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData

      // Importer les codes de cours
      if (data.courseCodes) {
        for (const [codeId, codeData] of Object.entries(data.courseCodes)) {
          await this.saveCourseCode(codeId, codeData)
        }
      }

      // Importer l'année académique
      if (data.year) {
        await this.saveAcademicYear(yearId, data.year)
      }

      console.log('[AcademicPlanningService] Planning importé avec succès')
      return true
    } catch (error) {
      console.error('[AcademicPlanningService] Erreur importPlanningFromJSON:', error)
      throw error
    }
  }
}

// Instance singleton
const academicPlanningService = new AcademicPlanningService()

export default academicPlanningService
