// Service d'intégration gamification
// Point central pour toutes les actions utilisateur et déclenchement des événements gamification

import { autoCheckAndUnlockBadges, checkAndUnlockActionBadges } from './badgesService'
import gamificationService from './gamificationService'
import * as questsService from './questsService'
import * as challengesService from './challengesService'
import notificationService from './notificationService'

class GamificationIntegration {
  constructor() {
    this.xpActions = {
      LOGIN: 5,
      PROFILE_UPDATE: 10,
      QUIZ_COMPLETE: 50,
      POST: 25,
      COMMENT: 15,
      REPLY: 10,
      LIKE: 2,
      SHARE: 10,
      ACHIEVEMENT: 100
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
      let xpGained = 0
      
      // Attribuer XP si applicable
      if (this.shouldGiveXP(action)) {
        xpGained = await this.addXPForAction(userId, action, actionData)
      }

      // Vérifier et débloquer les badges
      const unlockedBadges = await checkAndUnlockActionBadges(userId, action, {
        ...actionData,
        xpGained
      })

      // Mettre à jour les quêtes
      await this.updateQuestProgress(userId, action, actionData)

      // Mettre à jour les défis
      await this.updateChallengeProgress(userId, action, actionData)

      // Logger l'action
      await gamificationService.logAction(action, userId, {
        ...actionData,
        xpGained,
        badgesUnlocked: unlockedBadges.length
      })

      return {
        success: true,
        xpGained,
        badgesUnlocked: unlockedBadges,
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
    const xpAmount = this.xpActions[action.toUpperCase()] || 0
    
    if (xpAmount > 0) {
      // Utiliser le service HES existant pour ajouter l'XP
      const { addUserXP } = await import('./hesHousesService')
      await addUserXP(userId, action.toUpperCase(), xpAmount)
      return xpAmount
    }
    
    return 0
  }

  /**
   * Met à jour le progrès des quêtes
   */
  async updateQuestProgress(userId, action, actionData) {
    try {
      // Les quêtes seront mises à jour automatiquement par les services existants
      // Cette méthode peut être étendue selon les besoins spécifiques
      // Quest update for action handled by existing services
    } catch (error) {
      console.error('Erreur lors de la mise à jour des quêtes:', error)
    }
  }

  /**
   * Met à jour le progrès des défis
   */
  async updateChallengeProgress(userId, action, actionData) {
    try {
      // Mapper les actions vers les types de défis
      const challengeTypeMap = {
        'LOGIN': 'daily_login',
        'POST': 'create_post',
        'COMMENT': 'create_comment',
        'LIKE': 'give_like',
        'PROFILE_UPDATE': 'update_profile'
      }
      
      const challengeType = challengeTypeMap[action.toUpperCase()]
      if (challengeType) {
        await challengesService.updateChallengeProgress(userId, challengeType, 1, actionData)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des défis:', error)
    }
  }

  /**
   * Vérifie si une quête correspond à l'action
   */
  questMatchesAction(quest, action, actionData) {
    if (!quest.requirements || !quest.requirements.actions) return false
    return quest.requirements.actions.includes(action.toLowerCase())
  }

  /**
   * Vérifie si un défi correspond à l'action
   */
  challengeMatchesAction(challenge, action, actionData) {
    if (!challenge.requirements || !challenge.requirements.actions) return false
    return challenge.requirements.actions.includes(action.toLowerCase())
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
   * Déclenche les événements pour un quiz terminé
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
   * Déclenche les événements pour une interaction sociale
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
   * Déclenche les événements pour un achievement débloqué
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
