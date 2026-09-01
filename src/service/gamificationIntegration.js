/**
 * @module gamificationIntegration
 * @description Service central de gamification. Orchestre les actions utilisateur
 * (login, post, quiz, etc.) et déclenche l'attribution d'XP, badges et quêtes.
 *
 * @class GamificationIntegration
 * @method trackAction(userId, action, data) - Enregistre une action et attribue l'XP
 * @method checkBadges(userId) - Vérifie et débloque les badges éligibles
 * @method checkChallenges(userId) - Vérifie la progression des défis
 *
 * @exports {GamificationIntegration} gamificationIntegration - Instance singleton
 */
import gamificationServiceSupabase from './gamificationServiceSupabase'

class GamificationIntegration {
  constructor() {
    this.xpActions = {
      LOGIN: 5,
      PROFILE_UPDATE: 10,
      POST: 25
    }
  }

  /**
   * Traite une action utilisateur et déclenche tous les événements gamification
   * @param {string} userId - ID de l'utilisateur
   * @param {string} action - Type d'action
   * @param {object} actionData - Données supplémentaires de l'action
   */
  async processUserAction(userId, action, actionData = {}) {
    try {
      const rewardSupported = this.shouldGiveXP(action)
      let xpGained = { amount: 0, duplicate: false, badgesUnlocked: [] }
      
      // Attribuer XP si applicable
      if (rewardSupported) {
        xpGained = await this.addXPForAction(userId, action, actionData)
      }

      // Badges et défis sont évalués dans la même transaction Supabase.
      const unlockedBadges = xpGained.badgesUnlocked || []

      return {
        success: true,
        xpGained: xpGained.amount,
        badgesUnlocked: unlockedBadges,
        duplicate: xpGained.duplicate,
        rewardSupported,
        action,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Erreur lors du traitement de l\'action utilisateur:', error)
      return {
        success: false,
        error: error.message,
        action,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Détermine si une action doit donner de l'XP
   */
  shouldGiveXP(action) {
    return Object.keys(this.xpActions).includes(action.toUpperCase())
  }

  /**
   * Ajoute de l'XP pour une action spécifique
   */
  async addXPForAction(userId, action, actionData = {}) {
    const normalizedAction = action.toUpperCase()
    if (!this.shouldGiveXP(normalizedAction)) {
      return { amount: 0, duplicate: false, badgesUnlocked: [] }
    }

    const result = await gamificationServiceSupabase.addUserXP(
      userId,
      normalizedAction,
      actionData
    )

    return {
      amount: result?.xp_gained || 0,
      duplicate: Boolean(result?.duplicate),
      badgesUnlocked: result?.badges_unlocked || []
    }
  }

  // ============ MÉTHODES RACCOURCIES POUR ACTIONS SPÉCIFIQUES ============

  /**
   * Déclenche les événements pour une connexion utilisateur
   */
  async onLogin(userId, loginData = {}) {
    return await this.processUserAction(userId, 'LOGIN', {
      loginTime: loginData.loginTime || Date.now(),
      loginMethod: loginData.loginMethod || 'unknown',
      deviceType: loginData.deviceType || 'unknown',
      ...loginData
    })
  }

  /**
   * Déclenche les événements pour une mise à jour de profil
   */
  async onProfileUpdate(userId, profileData = {}) {
    return await this.processUserAction(userId, 'PROFILE_UPDATE', {
      profileCompleted: profileData.profileCompleted || false,
      hasAvatar: profileData.hasAvatar || false,
      hasBio: profileData.hasBio || false,
      hasCity: profileData.hasCity || false,
      ...profileData
    })
  }

  /**
   * Observe un quiz terminé. L'attribution de maison/XP reste exclusivement
   * gérée par la transaction Supabase assign_my_house.
   */
  async onQuizComplete(userId, quizData = {}) {
    return await this.processUserAction(userId, 'QUIZ_COMPLETE', {
      quizType: quizData.quizType || 'unknown',
      house: quizData.house || null,
      questionsAnswered: quizData.questionsAnswered || 0,
      ...quizData
    })
  }

  /**
   * Observe une interaction sociale. Seule la création vérifiée d'un POST
   * est récompensée; likes et commentaires restent non récompensés.
   */
  async onSocialInteraction(userId, interactionData = {}) {
    const action = interactionData.action || 'SOCIAL_INTERACTION'
    return await this.processUserAction(userId, action.toUpperCase(), {
      targetType: interactionData.targetType || 'unknown',
      targetId: interactionData.targetId || null,
      targetAuthorId: interactionData.targetAuthorId || null,
      ...interactionData
    })
  }

  /**
   * Observe un achievement. Les bonus de badge sont calculés par Supabase,
   * jamais à partir de cet événement navigateur.
   */
  async onAchievementUnlocked(userId, achievementData = {}) {
    return await this.processUserAction(userId, 'ACHIEVEMENT', {
      achievementId: achievementData.achievementId || null,
      achievementType: achievementData.achievementType || 'badge',
      rarity: achievementData.rarity || 'common',
      ...achievementData
    })
  }
}

// Export d'une instance singleton
const gamificationIntegration = new GamificationIntegration()
export default gamificationIntegration
