import { supabase } from '@/supabase'

/**
 * Service pour la gestion admin des quêtes sur Supabase
 */
class AdminQuestsService {
  
  /**
   * Récupérer toutes les quêtes (admin)
   * @returns {Promise<Array>} Liste des quêtes avec leurs étapes
   */
  async getQuests() {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          steps:quest_steps(
            id,
            step_order,
            title,
            description,
            required
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Trier les étapes par ordre
      return data.map(quest => ({
        ...quest,
        steps: quest.steps?.sort((a, b) => a.step_order - b.step_order) || []
      }))
      
    } catch (error) {
      console.error('❌ Erreur récupération quêtes:', error)
      throw error
    }
  }
  
  /**
   * Récupérer une quête par ID
   * @param {string} questId - ID de la quête
   * @returns {Promise<Object>} Détails de la quête
   */
  async getQuestById(questId) {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          steps:quest_steps(
            id,
            step_order,
            title,
            description,
            required
          )
        `)
        .eq('id', questId)
        .single()
      
      if (error) throw error
      
      // Trier les étapes
      data.steps = data.steps?.sort((a, b) => a.step_order - b.step_order) || []
      
      return data
      
    } catch (error) {
      console.error('❌ Erreur récupération quête:', error)
      throw error
    }
  }
  
  /**
   * Créer une nouvelle quête
   * @param {Object} questData - Données de la quête
   * @returns {Promise<Object>} Quête créée
   */
  async createQuest(questData) {
    try {
      // 1. Créer la quête
      const questPayload = {
        title: questData.title,
        description: questData.description,
        type: questData.type,
        difficulty: questData.difficulty,
        points: questData.points,
        xp_reward: questData.rewards?.xp || questData.points,
        status: questData.status || 'active'
      }

      // Ajouter les nouveaux champs seulement s'ils existent dans le schema
      // IMPORTANT: Assurez-vous d'avoir exécuté la migration add_quest_columns_safe.sql
      if (questData.icon) questPayload.icon = questData.icon
      if (questData.startDate) questPayload.start_date = questData.startDate
      if (questData.endDate) questPayload.end_date = questData.endDate
      if (questData.duration !== undefined) questPayload.duration = questData.duration
      if (questData.isRecurring !== undefined) questPayload.is_recurring = questData.isRecurring
      if (questData.recurringType) questPayload.recurring_type = questData.recurringType
      if (questData.minLevel !== undefined) questPayload.min_level = questData.minLevel
      if (questData.maxLevel !== undefined) questPayload.max_level = questData.maxLevel
      if (questData.targetHouses) questPayload.target_houses = questData.targetHouses

      const { data: quest, error: questError } = await supabase
        .from('quests')
        .insert(questPayload)
        .select()
        .single()
      
      if (questError) {
        console.error('❌ Erreur Supabase:', questError)
        throw questError
      }
      
      if (!quest) {
        throw new Error('Aucune quête retournée par Supabase')
      }
      
      // 2. Créer les étapes si présentes
      if (questData.steps && questData.steps.length > 0) {
        const stepsToInsert = questData.steps.map((step, index) => ({
          quest_id: quest.id,
          step_order: index + 1,
          title: step.title,
          description: step.description || null,
          required: step.required !== false
        }))
        
        const { error: stepsError } = await supabase
          .from('quest_steps')
          .insert(stepsToInsert)
        
        if (stepsError) {
          console.error('⚠️ Erreur création étapes:', stepsError)
          // On ne lance pas d'erreur car la quête est créée
        }
      }
      
      // 3. Si statut = active, assigner automatiquement à tous les utilisateurs
      if (quest.status === 'active') {
        await this.assignQuestToAllUsers(quest.id)
      }
      
      return quest
      
    } catch (error) {
      console.error('❌ Erreur création quête:', error)
      throw error
    }
  }
  
  /**
   * Mettre à jour une quête existante
   * @param {string} questId - ID de la quête
   * @param {Object} questData - Nouvelles données
   * @returns {Promise<Object>} Quête mise à jour
   */
  async updateQuest(questId, questData) {
    try {
      // 1. Mettre à jour la quête
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .update({
          title: questData.title,
          description: questData.description,
          type: questData.type,
          difficulty: questData.difficulty,
          points: questData.points,
          xp_reward: questData.rewards?.xp || questData.points,
          status: questData.status,
          icon: questData.icon,
          // Dates avec timezone
          start_date: questData.startDate || null,
          end_date: questData.endDate || null,
          duration: questData.duration || null,
          is_recurring: questData.isRecurring || false,
          recurring_type: questData.recurringType || null,
          min_level: questData.minLevel || 1,
          max_level: questData.maxLevel || null,
          target_houses: questData.targetHouses || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', questId)
        .select()
        .single()
      
      if (questError) throw questError
      
      // 2. Gérer les étapes (supprimer et recréer)
      if (questData.steps) {
        // Supprimer les anciennes étapes
        await supabase
          .from('quest_steps')
          .delete()
          .eq('quest_id', questId)
        
        // Créer les nouvelles étapes
        if (questData.steps.length > 0) {
          const stepsToInsert = questData.steps.map((step, index) => ({
            quest_id: questId,
            step_order: index + 1,
            title: step.title,
            description: step.description || null,
            required: step.required !== false
          }))
          
          await supabase
            .from('quest_steps')
            .insert(stepsToInsert)
        }
      }
      
      // 3. Si passage à active, assigner à tous les utilisateurs
      if (quest.status === 'active') {
        await this.assignQuestToAllUsers(questId)
      }
      
      return quest
      
    } catch (error) {
      console.error('❌ Erreur mise à jour quête:', error)
      throw error
    }
  }
  
  /**
   * Supprimer une quête
   * @param {string} questId - ID de la quête
   * @returns {Promise<boolean>} Succès
   */
  async deleteQuest(questId) {
    try {
      // Les étapes et progressions seront supprimées automatiquement (CASCADE)
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId)
      
      if (error) throw error
      
      return true
      
    } catch (error) {
      console.error('❌ Erreur suppression quête:', error)
      throw error
    }
  }
  
  /**
   * Assigner une quête à tous les utilisateurs actifs
   * @param {string} questId - ID de la quête
   * @returns {Promise<number>} Nombre d'assignations
   */
  async assignQuestToAllUsers(questId) {
    try {
      // Appeler la fonction PostgreSQL côté serveur
      const { data, error } = await supabase.rpc('assign_quest_to_all_users', {
        p_quest_id: questId
      })
      
      if (error) throw error
      
      return data
      
    } catch (error) {
      console.error('❌ Erreur attribution quête:', error)
      console.warn('⚠️ Vérifiez que la fonction SQL assign_quest_to_all_users() existe')
      // Ne pas bloquer si l'attribution échoue
      return 0
    }
  }
  
  /**
   * Obtenir les statistiques d'une quête
   * @param {string} questId - ID de la quête
   * @returns {Promise<Object>} Statistiques
   */
  async getQuestStatistics(questId) {
    try {
      const { data, error } = await supabase
        .from('user_quest_progress')
        .select('status, progress')
        .eq('quest_id', questId)
      
      if (error) throw error
      
      const stats = {
        total: data.length,
        notStarted: data.filter(p => p.status === 'not_started').length,
        inProgress: data.filter(p => p.status === 'in_progress').length,
        completed: data.filter(p => p.status === 'completed').length,
        failed: data.filter(p => p.status === 'failed').length,
        averageProgress: data.length > 0 
          ? Math.round(data.reduce((sum, p) => sum + p.progress, 0) / data.length)
          : 0
      }
      
      return stats
      
    } catch (error) {
      console.error('❌ Erreur statistiques quête:', error)
      throw error
    }
  }
  
  /**
   * Changer le statut d'une quête (activer/archiver)
   * @param {string} questId - ID de la quête
   * @param {string} newStatus - Nouveau statut
   * @returns {Promise<Object>} Quête mise à jour
   */
  async changeQuestStatus(questId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('quests')
        .update({ status: newStatus })
        .eq('id', questId)
        .select()
        .single()
      
      if (error) throw error
      
      // Si activation, assigner à tous les utilisateurs
      if (newStatus === 'active') {
        await this.assignQuestToAllUsers(questId)
      }
      
      return data
      
    } catch (error) {
      console.error('❌ Erreur changement statut:', error)
      throw error
    }
  }
  
  /**
   * Dupliquer une quête existante
   * @param {string} questId - ID de la quête à dupliquer
   * @returns {Promise<Object>} Nouvelle quête créée
   */
  async duplicateQuest(questId) {
    try {
      // Récupérer la quête originale
      const original = await this.getQuestById(questId)
      
      // Créer une copie avec un nouveau titre
      const duplicate = {
        ...original,
        title: `${original.title} (Copie)`,
        status: 'draft', // Mettre en brouillon par défaut
        steps: original.steps.map(step => ({
          title: step.title,
          description: step.description,
          required: step.required
        }))
      }
      
      // Supprimer les champs qui ne doivent pas être copiés
      delete duplicate.id
      delete duplicate.created_by
      delete duplicate.created_at
      delete duplicate.updated_at
      delete duplicate.participants_count
      delete duplicate.completion_count
      
      return await this.createQuest(duplicate)
      
    } catch (error) {
      console.error('❌ Erreur duplication quête:', error)
      throw error
    }
  }
}

// Export singleton
const adminQuestsService = new AdminQuestsService()
export default adminQuestsService
