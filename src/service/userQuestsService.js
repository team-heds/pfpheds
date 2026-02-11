import { supabase } from '@/supabase'

/**
 * Service pour la gestion utilisateur des quêtes sur Supabase
 */
class UserQuestsService {
  
  /**
   * Récupérer les quêtes d'un utilisateur
   * @param {string} userId - ID utilisateur
   * @returns {Promise<Array>} Quêtes de l'utilisateur
   */
  async getUserQuests(userId) {
    try {
      const { data, error } = await supabase
        .from('user_quest_progress')
        .select(`
          *,
          quest:quests(
            id,
            title,
            description,
            type,
            difficulty,
            points,
            xp_reward,
            status,
            icon,
            start_date,
            end_date,
            duration,
            is_recurring,
            recurring_type,
            min_level,
            max_level,
            target_houses,
            steps:quest_steps(
              id,
              step_order,
              title,
              description,
              required
            )
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      // Restructurer les données pour compatibilité QuestCard
      return data.map(progress => ({
        ...progress.quest,
        // Aplatir la progression au niveau supérieur pour QuestCard
        status: progress.status,
        progress: progress.progress,
        current_step: progress.current_step,
        started_at: progress.started_at,
        completed_at: progress.completed_at,
        updated_at: progress.updated_at,
        // Garder aussi userProgress pour compatibilité
        userProgress: {
          id: progress.id,
          status: progress.status,
          progress: progress.progress,
          current_step: progress.current_step,
          started_at: progress.started_at,
          completed_at: progress.completed_at,
          updated_at: progress.updated_at
        },
        // Trier les étapes
        steps: progress.quest?.steps?.sort((a, b) => a.step_order - b.step_order) || []
      }))
      
    } catch (error) {
      console.error('❌ Erreur récupération quêtes utilisateur:', error)
      throw error
    }
  }
  
  /**
   * Récupérer les nouvelles quêtes (moins de 7 jours)
   * @param {string} userId - ID utilisateur
   * @returns {Promise<Array>} Nouvelles quêtes
   */
  async getNewQuests(userId) {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data, error } = await supabase
        .from('user_quest_progress')
        .select(`
          *,
          quest:quests(
            id,
            title,
            description,
            type,
            difficulty,
            points,
            xp_reward,
            icon,
            start_date,
            end_date,
            duration
          )
        `)
        .eq('user_id', userId)
        .neq('status', 'completed')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      
      return data.map(progress => ({
        id: progress.quest.id,
        title: progress.quest.title,
        description: progress.quest.description,
        difficulty: progress.quest.difficulty,
        type: progress.quest.type,
        xp_reward: progress.quest.xp_reward,
        points: progress.quest.points,
        icon: progress.quest.icon,
        start_date: progress.quest.start_date,
        end_date: progress.quest.end_date,
        duration: progress.quest.duration,
        progress: progress.progress,
        status: progress.status,
        isNew: true,
        createdAt: progress.created_at
      }))
      
    } catch (error) {
      console.error('❌ Erreur récupération nouvelles quêtes:', error)
      return []
    }
  }
  
  /**
   * Récupérer les quêtes actives (non complétées)
   * @param {string} userId - ID utilisateur
   * @returns {Promise<Array>} Quêtes actives
   */
  async getActiveQuests(userId) {
    try {
      const { data, error } = await supabase
        .from('user_quest_progress')
        .select(`
          *,
          quest:quests(*)
        `)
        .eq('user_id', userId)
        .in('status', ['not_started', 'in_progress'])
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      return data.map(progress => ({
        ...progress.quest,
        userProgress: {
          status: progress.status,
          progress: progress.progress,
          current_step: progress.current_step
        }
      }))
      
    } catch (error) {
      console.error('❌ Erreur récupération quêtes actives:', error)
      return []
    }
  }
  
  /**
   * Démarrer une quête
   * @param {string} userId - ID utilisateur
   * @param {string} questId - ID quête
   * @returns {Promise<Object>} Progression créée
   */
  async startQuest(userId, questId) {
    try {
      const { data, error } = await supabase
        .from('user_quest_progress')
        .upsert({
          user_id: userId,
          quest_id: questId,
          status: 'in_progress',
          progress: 0,
          current_step: 0,
          started_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,quest_id'
        })
        .select()
        .single()
      
      if (error) throw error
      
      return data
      
    } catch (error) {
      console.error('❌ Erreur démarrage quête:', error)
      throw error
    }
  }
  
  /**
   * Mettre à jour la progression d'une quête
   * @param {string} userId - ID utilisateur
   * @param {string} questId - ID quête
   * @param {number} progress - Progression (0-100)
   * @param {number} currentStep - Étape actuelle
   * @returns {Promise<Object>} Progression mise à jour
   */
  async updateQuestProgress(userId, questId, progress, currentStep) {
    try {
      const updateData = {
        progress,
        current_step: currentStep,
        updated_at: new Date().toISOString()
      }
      
      // Si complétée à 100%
      if (progress >= 100) {
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('user_quest_progress')
        .update(updateData)
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .select()
        .single()
      
      if (error) throw error
      
      return data
      
    } catch (error) {
      console.error('❌ Erreur mise à jour progression:', error)
      throw error
    }
  }
  
  /**
   * Compléter une quête
   * @param {string} userId - ID utilisateur
   * @param {string} questId - ID quête
   * @returns {Promise<Object>} Progression complétée
   */
  async completeQuest(userId, questId) {
    try {
      const { data, error } = await supabase
        .rpc('complete_quest', {
          p_user_id: userId,
          p_quest_id: questId
        })
      
      if (error) throw error
      
      return data
      
    } catch (error) {
      console.error('❌ Erreur complétion quête:', error)
      throw error
    }
  }
  
  /**
   * Obtenir les statistiques de quêtes d'un utilisateur
   * @param {string} userId - ID utilisateur
   * @returns {Promise<Object>} Statistiques
   */
  async getQuestStats(userId) {
    try {
      const { data, error } = await supabase
        .from('user_quest_progress')
        .select('status, progress, quest:quests(xp_reward)')
        .eq('user_id', userId)
      
      if (error) throw error
      
      const stats = {
        total: data.length,
        notStarted: data.filter(q => q.status === 'not_started').length,
        inProgress: data.filter(q => q.status === 'in_progress').length,
        completed: data.filter(q => q.status === 'completed').length,
        failed: data.filter(q => q.status === 'failed').length,
        totalXP: data
          .filter(q => q.status === 'completed')
          .reduce((sum, q) => sum + (q.quest?.xp_reward || 0), 0),
        averageProgress: data.length > 0
          ? Math.round(data.reduce((sum, q) => sum + q.progress, 0) / data.length)
          : 0
      }
      
      return stats
      
    } catch (error) {
      console.error('❌ Erreur statistiques quêtes:', error)
      return {
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        failed: 0,
        totalXP: 0,
        averageProgress: 0
      }
    }
  }
  
  /**
   * S'abonner aux changements en temps réel
   * @param {string} userId - ID utilisateur
   * @param {Function} callback - Fonction appelée lors de changements
   * @returns {RealtimeChannel} Canal Supabase
   */
  subscribeToQuestUpdates(userId, callback) {
    try {
      const channel = supabase
        .channel(`user-quests-${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_quest_progress',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          callback(payload)
        })
        .subscribe()
      return channel
    } catch (e) {
      console.warn('⚠️ Abonnement temps réel indisponible:', e)
      return null
    }
  }
  
  /**
   * Se désabonner des mises à jour
   * @param {RealtimeChannel} channel - Canal à fermer
   */
  unsubscribeFromQuestUpdates(channel) {
    if (channel) {
      if (typeof channel.unsubscribe === 'function') {
        channel.unsubscribe()
      } else {
        try { supabase.removeChannel(channel) } catch {}
      }
    }
  }
}

// Export singleton
const userQuestsService = new UserQuestsService()
export default userQuestsService
