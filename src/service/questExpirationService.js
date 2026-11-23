import { supabase } from '@/supabase'

/**
 * Service pour gérer l'expiration automatique des quêtes
 */
const isNetworkFailure = (error) =>
  /Failed to fetch|NetworkError|Load failed/i.test(`${error?.message || ''} ${error?.details || ''}`)

class QuestExpirationService {
  
  /**
   * Mettre à jour le statut des quêtes expirées
   * @param {string} userId - ID utilisateur (optionnel, pour un user spécifique)
   * @returns {Promise<number>} Nombre de quêtes mises à jour
   */
  async updateExpiredQuests(userId = null) {
    try {
      const now = new Date().toISOString()
      
      let query = supabase
        .from('user_quest_progress')
        .update({ 
          status: 'failed',
          updated_at: now
        })
        .neq('status', 'completed')
        .neq('status', 'failed')
      
      // Ajouter filtre userId si fourni
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      // Jointure avec quests pour vérifier end_date
      const { data: progressData, error: progressError } = await supabase
        .from('user_quest_progress')
        .select(`
          id,
          user_id,
          quest_id,
          status,
          quest:quests(end_date)
        `)
        .neq('status', 'completed')
        .neq('status', 'failed')
      
      if (progressError) throw progressError
      
      // Filtrer les quêtes dont end_date est dépassée
      const expiredQuests = progressData.filter(p => {
        if (!p.quest?.end_date) return false
        const endTime = new Date(p.quest.end_date).getTime()
        return Date.now() >= endTime
      })
      
      if (expiredQuests.length === 0) {
          return 0
      }
      
      // Mettre à jour chaque quête expirée
      const updates = expiredQuests.map(q => 
        supabase
          .from('user_quest_progress')
          .update({ 
            status: 'failed',
            updated_at: now
          })
          .eq('id', q.id)
      )
      
      await Promise.all(updates)
      
      return expiredQuests.length
      
    } catch (error) {
      if (!isNetworkFailure(error)) {
        console.error('❌ Erreur mise à jour quêtes expirées:', error)
      }
      throw error
    }
  }
  
  /**
   * Vérifier si une quête spécifique est expirée
   * @param {Object} quest - Objet quête
   * @returns {boolean} True si expirée
   */
  isQuestExpired(quest) {
    if (!quest.endDate) return false
    const endTime = new Date(quest.endDate).getTime()
    return Date.now() >= endTime
  }
  
  /**
   * Obtenir le temps restant avant expiration
   * @param {Object} quest - Objet quête
   * @returns {Object} { days, hours, minutes, expired }
   */
  getTimeRemaining(quest) {
    if (!quest.endDate) return { days: 0, hours: 0, minutes: 0, expired: false }
    
    const endTime = new Date(quest.endDate).getTime()
    const diff = endTime - Date.now()
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true }
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return { days, hours, minutes, expired: false }
  }
  
  /**
   * Démarrer la vérification périodique des expirations
   * @param {number} intervalMinutes - Intervalle en minutes (défaut: 5)
   * @returns {number} ID de l'intervalle
   */
  startPeriodicCheck(intervalMinutes = 5) {
    // Vérification immédiate
    void this.runScheduledCheck()
    
    // Puis toutes les X minutes
    return setInterval(() => {
      void this.runScheduledCheck()
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Vérification de fond : une coupure réseau attend simplement le prochain passage.
   * @returns {Promise<number>} Nombre de quêtes mises à jour
   */
  async runScheduledCheck() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 0

    try {
      return await this.updateExpiredQuests()
    } catch {
      // Déjà journalisé si ce n'est pas une coupure réseau.
      return 0
    }
  }
  
  /**
   * Arrêter la vérification périodique
   * @param {number} intervalId - ID de l'intervalle à arrêter
   */
  stopPeriodicCheck(intervalId) {
    if (intervalId) {
      clearInterval(intervalId)
    }
  }
}

// Export singleton
const questExpirationService = new QuestExpirationService()
export default questExpirationService
