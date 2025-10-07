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
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .insert({
          title: questData.title,
          description: questData.description,
          type: questData.type,
          difficulty: questData.difficulty,
          points: questData.points,
          xp_reward: questData.rewards?.xp || questData.points,
          status: questData.status || 'active'
        })
        .select()
        .single()
      
      if (questError) throw questError
      
      console.log('✅ Quête créée:', quest.id)
      
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
        } else {
          console.log(`✅ ${stepsToInsert.length} étapes créées`)
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
          status: questData.status
        })
        .eq('id', questId)
        .select()
        .single()
      
      if (questError) throw questError
      
      console.log('✅ Quête mise à jour:', questId)
      
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
      
      console.log('✅ Quête supprimée:', questId)
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
      // Récupérer tous les utilisateurs
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      
      if (usersError) throw usersError
      
      console.log(`📢 Attribution de la quête ${questId} à ${users.users.length} utilisateurs...`)
      
      // Créer les entrées de progression pour chaque utilisateur
      const progressEntries = users.users.map(user => ({
        user_id: user.id,
        quest_id: questId,
        status: 'not_started',
        progress: 0
      }))
      
      // Insertion avec gestion des doublons
      const { data, error } = await supabase
        .from('user_quest_progress')
        .upsert(progressEntries, { 
          onConflict: 'user_id,quest_id',
          ignoreDuplicates: true 
        })
      
      if (error) {
        console.warn('⚠️ Erreur attribution (possiblement normal si déjà existant):', error)
      } else {
        console.log(`✅ Quête assignée à ${progressEntries.length} utilisateurs`)
      }
      
      return progressEntries.length
      
    } catch (error) {
      console.error('❌ Erreur attribution quête:', error)
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
      
      console.log(`✅ Statut quête ${questId} changé en ${newStatus}`)
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
