import { db } from '../firebase'
import { ref as dbRef, get, set, update, remove } from 'firebase/database'

class WeeklyPlanningService {
  constructor() {
    this.basePath = 'weeklyPlanning'
  }

  /**
   * Structure d'un créneau horaire:
   * {
   *   day: 'lundi',
   *   date: '16.02.2026',
   *   startTime: '09h00',
   *   endTime: '11h00',
   *   moduleCode: 'ia1', // Référence au code de cours du minibrick
   *   moduleNumber: '1012',
   *   moduleTitle: 'M1012 - Raisonnement clinique 1b',
   *   courseTitle: 'Introduction Module: questions-réponses...', // Nom affiché dans le planning
   *   activity: 'Détails complémentaires...',
   *   teachers: ['Line Martin', 'Chloé Zufferey'],
   *   room: '',
   *   notes: ''
   * }
   */

  /**
   * Obtenir le planning d'une semaine spécifique
   */
  async getWeekPlanning(yearId, weekNumber) {
    try {
      const snapshot = await get(dbRef(db, `${this.basePath}/${yearId}/week${weekNumber}`))
      return snapshot.exists() ? snapshot.val() : {}
    } catch (error) {
      console.error('[WeeklyPlanningService] Erreur getWeekPlanning:', error)
      throw error
    }
  }

  /**
   * Sauvegarder un créneau horaire
   */
  async saveTimeSlot(yearId, weekNumber, slotId, slotData) {
    try {
      await set(
        dbRef(db, `${this.basePath}/${yearId}/week${weekNumber}/${slotId}`),
        {
          ...slotData,
          updatedAt: new Date().toISOString()
        }
      )
      console.log('[WeeklyPlanningService] Créneau sauvegardé:', slotId)
    } catch (error) {
      console.error('[WeeklyPlanningService] Erreur saveTimeSlot:', error)
      throw error
    }
  }

  /**
   * Supprimer un créneau horaire
   */
  async deleteTimeSlot(yearId, weekNumber, slotId) {
    try {
      await remove(dbRef(db, `${this.basePath}/${yearId}/week${weekNumber}/${slotId}`))
      console.log('[WeeklyPlanningService] Créneau supprimé:', slotId)
    } catch (error) {
      console.error('[WeeklyPlanningService] Erreur deleteTimeSlot:', error)
      throw error
    }
  }

  /**
   * Générer automatiquement les créneaux d'une semaine basés sur le minibrick
   */
  async generateWeekFromMinibrick(yearId, weekNumber, minibrickData) {
    try {
      const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
      const dayKeys = ['lu', 'ma', 'me', 'je', 've']
      
      const timeSlots = []
      
      for (let d = 0; d < days.length; d++) {
        const dayKey = dayKeys[d]
        const cellKey = `${dayKey}_${weekNumber}`
        
        // Vérifier si ce jour a un module dans le minibrick
        if (minibrickData[cellKey] && minibrickData[cellKey].courseCode) {
          const courseCode = minibrickData[cellKey].courseCode
          
          // Créer des créneaux par défaut (à personnaliser ensuite)
          timeSlots.push({
            id: `${dayKey}_${weekNumber}_morning`,
            day: days[d],
            date: '', // À remplir manuellement
            startTime: '09h00',
            endTime: '12h00',
            moduleCode: courseCode,
            moduleNumber: minibrickData[cellKey].moduleNumber || '',
            moduleTitle: minibrickData[cellKey].moduleTitle || '',
            courseTitle: '',
            activity: '',
            teachers: [],
            room: '',
            notes: ''
          })
          
          timeSlots.push({
            id: `${dayKey}_${weekNumber}_afternoon`,
            day: days[d],
            date: '', // À remplir manuellement
            startTime: '13h00',
            endTime: '16h00',
            moduleCode: courseCode,
            moduleNumber: minibrickData[cellKey].moduleNumber || '',
            moduleTitle: minibrickData[cellKey].moduleTitle || '',
            courseTitle: '',
            activity: '',
            teachers: [],
            room: '',
            notes: ''
          })
        }
      }
      
      // Sauvegarder tous les créneaux
      for (const slot of timeSlots) {
        await this.saveTimeSlot(yearId, weekNumber, slot.id, slot)
      }
      
      return timeSlots
    } catch (error) {
      console.error('[WeeklyPlanningService] Erreur generateWeekFromMinibrick:', error)
      throw error
    }
  }

  /**
   * Obtenir toutes les semaines d'une année
   */
  async getAllWeeks(yearId) {
    try {
      const snapshot = await get(dbRef(db, `${this.basePath}/${yearId}`))
      return snapshot.exists() ? snapshot.val() : {}
    } catch (error) {
      console.error('[WeeklyPlanningService] Erreur getAllWeeks:', error)
      throw error
    }
  }

  /**
   * Dupliquer une semaine
   */
  async duplicateWeek(yearId, fromWeek, toWeek) {
    try {
      const sourceData = await this.getWeekPlanning(yearId, fromWeek)
      
      // Dupliquer avec de nouveaux IDs
      const duplicatedSlots = {}
      for (const [slotId, slotData] of Object.entries(sourceData)) {
        const newId = slotId.replace(`_${fromWeek}_`, `_${toWeek}_`)
        duplicatedSlots[newId] = {
          ...slotData,
          date: '', // Réinitialiser la date
          createdAt: new Date().toISOString()
        }
      }
      
      await set(dbRef(db, `${this.basePath}/${yearId}/week${toWeek}`), duplicatedSlots)
      console.log('[WeeklyPlanningService] Semaine dupliquée:', fromWeek, '->', toWeek)
    } catch (error) {
      console.error('[WeeklyPlanningService] Erreur duplicateWeek:', error)
      throw error
    }
  }

  /**
   * Exporter une semaine en JSON
   */
  async exportWeekToJSON(yearId, weekNumber) {
    try {
      const weekData = await this.getWeekPlanning(yearId, weekNumber)
      
      return JSON.stringify({
        yearId,
        weekNumber,
        exportDate: new Date().toISOString(),
        slots: weekData
      }, null, 2)
    } catch (error) {
      console.error('[WeeklyPlanningService] Erreur exportWeekToJSON:', error)
      throw error
    }
  }
}

export default new WeeklyPlanningService()
