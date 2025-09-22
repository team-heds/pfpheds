import { ref as dbRef, get, set, update, push } from 'firebase/database'
import { db } from '../../firebase'
import { notificationService } from './notificationService.js'

// ========================================
// CONFIGURATION DES QUÊTES DYNAMIQUES
// ========================================

export const QUEST_TYPES = {
  STORY: 'story',           // Quêtes narratives
  PROGRESSION: 'progression', // Quêtes de progression
  EXPLORATION: 'exploration', // Quêtes d'exploration
  SOCIAL: 'social',         // Quêtes sociales
  CHALLENGE: 'challenge'    // Quêtes de défi
}

export const QUEST_DIFFICULTIES = {
  EASY: { name: 'Facile', color: '#4CAF50', multiplier: 1 },
  MEDIUM: { name: 'Moyen', color: '#FF9800', multiplier: 1.5 },
  HARD: { name: 'Difficile', color: '#F44336', multiplier: 2 },
  EPIC: { name: 'Épique', color: '#9C27B0', multiplier: 3 },
  LEGENDARY: { name: 'Légendaire', color: '#FFD700', multiplier: 5 }
}

export const QUEST_STATUS = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
}

// ========================================
// CONFIGURATION DES QUÊTES
// ========================================

export const QUEST_CATALOG = [
  // Quêtes d'introduction
  {
    id: 'newcomer_journey',
    title: 'Parcours du Nouveau',
    description: 'Découvre tous les aspects de la plateforme et deviens un membre actif de ta maison.',
    type: QUEST_TYPES.STORY,
    difficulty: 'EASY',
    house: 'all', // Disponible pour toutes les maisons
    prerequisites: [],
    duration: null, // Pas de limite de temps
    steps: [
      {
        id: 'complete_profile',
        title: 'Complète ton profil',
        description: 'Ajoute une photo et remplis tes informations personnelles',
        target: 1,
        current: 0,
        xp: 50,
        type: 'profile_completion'
      },
      {
        id: 'first_xp',
        title: 'Gagne tes premiers 100 XP',
        description: 'Participe aux activités pour gagner de l\'expérience',
        target: 100,
        current: 0,
        xp: 100,
        type: 'xp_gain'
      },
      {
        id: 'first_badge',
        title: 'Débloque ton premier badge',
        description: 'Accomplis un objectif pour débloquer ton premier badge',
        target: 1,
        current: 0,
        xp: 150,
        type: 'badge_unlock'
      },
      {
        id: 'first_challenge',
        title: 'Complète un défi hebdomadaire',
        description: 'Participe aux défis de la semaine',
        target: 1,
        current: 0,
        xp: 200,
        type: 'challenge_complete'
      }
    ],
    rewards: {
      xp: 500,
      badge: 'explorer',
      title: 'Explorateur',
      special: 'Accès aux quêtes avancées'
    }
  },
  
  // Quêtes de progression par maison
  {
    id: 'house_champion',
    title: 'Champion de ta Maison',
    description: 'Deviens un leader reconnu de ta maison et inspire les autres membres.',
    type: QUEST_TYPES.PROGRESSION,
    difficulty: 'MEDIUM',
    house: 'user_house', // Spécifique à la maison de l'utilisateur
    prerequisites: ['newcomer_journey'],
    duration: 30 * 24 * 60 * 60 * 1000, // 30 jours
    steps: [
      {
        id: 'reach_level_5',
        title: 'Atteins le niveau 5',
        description: 'Continue à gagner de l\'XP pour progresser',
        target: 5,
        current: 0,
        xp: 200,
        type: 'level_reach'
      },
      {
        id: 'unlock_badges',
        title: 'Débloque 5 badges',
        description: 'Collectionne différents badges en accomplissant des objectifs variés',
        target: 5,
        current: 0,
        xp: 300,
        type: 'badge_collection'
      },
      {
        id: 'complete_challenges',
        title: 'Complète 10 défis',
        description: 'Participe activement aux défis hebdomadaires',
        target: 10,
        current: 0,
        xp: 400,
        type: 'challenge_streak'
      },
      {
        id: 'earn_house_points',
        title: 'Gagne 1000 points pour ta maison',
        description: 'Contribue significativement au score de ta maison',
        target: 1000,
        current: 0,
        xp: 500,
        type: 'house_contribution'
      }
    ],
    rewards: {
      xp: 1500,
      badge: 'house_champion',
      title: 'Champion de Maison',
      special: 'Badge exclusif de ta maison'
    }
  },

  // Quête d'exploration
  {
    id: 'platform_explorer',
    title: 'Explorateur de la Plateforme',
    description: 'Découvre toutes les fonctionnalités et deviens un expert de la plateforme.',
    type: QUEST_TYPES.EXPLORATION,
    difficulty: 'EASY',
    house: 'all',
    prerequisites: [],
    duration: null,
    steps: [
      {
        id: 'visit_achievements',
        title: 'Visite la page des achievements',
        description: 'Explore tes badges et découvre ceux à débloquer',
        target: 1,
        current: 0,
        xp: 50,
        type: 'page_visit'
      },
      {
        id: 'visit_challenges',
        title: 'Visite la page des défis',
        description: 'Découvre les défis hebdomadaires disponibles',
        target: 1,
        current: 0,
        xp: 50,
        type: 'page_visit'
      },
      {
        id: 'check_leaderboard',
        title: 'Consulte le classement',
        description: 'Vois où tu te situes par rapport aux autres',
        target: 1,
        current: 0,
        xp: 75,
        type: 'page_visit'
      },
      {
        id: 'update_settings',
        title: 'Personnalise tes paramètres',
        description: 'Ajuste tes préférences et notifications',
        target: 1,
        current: 0,
        xp: 100,
        type: 'settings_update'
      }
    ],
    rewards: {
      xp: 275,
      badge: 'platform_expert',
      title: 'Expert Plateforme'
    }
  },

  // Quête sociale
  {
    id: 'social_butterfly',
    title: 'Papillon Social',
    description: 'Connecte-toi avec d\'autres étudiants et participe à la communauté.',
    type: QUEST_TYPES.SOCIAL,
    difficulty: 'MEDIUM',
    house: 'all',
    prerequisites: ['newcomer_journey'],
    duration: 14 * 24 * 60 * 60 * 1000, // 14 jours
    steps: [
      {
        id: 'share_achievement',
        title: 'Partage un accomplissement',
        description: 'Partage un badge ou une réussite avec la communauté',
        target: 1,
        current: 0,
        xp: 100,
        type: 'social_share'
      },
      {
        id: 'congratulate_others',
        title: 'Félicite 5 autres étudiants',
        description: 'Encourage tes camarades dans leurs réussites',
        target: 5,
        current: 0,
        xp: 150,
        type: 'social_interaction'
      },
      {
        id: 'join_house_activity',
        title: 'Participe à une activité de maison',
        description: 'Rejoins une activité organisée par ta maison',
        target: 1,
        current: 0,
        xp: 200,
        type: 'house_activity'
      }
    ],
    rewards: {
      xp: 450,
      badge: 'social_connector',
      title: 'Connecteur Social'
    }
  },

  // Quête de défi épique
  {
    id: 'legendary_scholar',
    title: 'Érudit Légendaire',
    description: 'Atteins l\'excellence académique et deviens une légende de ta maison.',
    type: QUEST_TYPES.CHALLENGE,
    difficulty: 'LEGENDARY',
    house: 'user_house',
    prerequisites: ['house_champion', 'platform_explorer'],
    duration: 90 * 24 * 60 * 60 * 1000, // 90 jours
    steps: [
      {
        id: 'reach_level_15',
        title: 'Atteins le niveau 15',
        description: 'Deviens un étudiant de haut niveau',
        target: 15,
        current: 0,
        xp: 1000,
        type: 'level_reach'
      },
      {
        id: 'collect_rare_badges',
        title: 'Collectionne 10 badges rares ou plus',
        description: 'Débloque des badges difficiles à obtenir',
        target: 10,
        current: 0,
        xp: 1500,
        type: 'rare_badge_collection'
      },
      {
        id: 'challenge_master',
        title: 'Maîtrise des défis (50 complétés)',
        description: 'Deviens un expert des défis hebdomadaires',
        target: 50,
        current: 0,
        xp: 2000,
        type: 'challenge_mastery'
      },
      {
        id: 'house_legend',
        title: 'Contribue 10000 points à ta maison',
        description: 'Deviens une légende de ta maison',
        target: 10000,
        current: 0,
        xp: 2500,
        type: 'house_legend'
      }
    ],
    rewards: {
      xp: 7000,
      badge: 'legendary_scholar',
      title: 'Érudit Légendaire',
      special: 'Badge animé exclusif + Accès aux quêtes secrètes'
    }
  }
]

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Obtient les quêtes disponibles pour un utilisateur
 */
export const getAvailableQuests = (userHouse, completedQuests = [], userLevel = 1) => {
  return QUEST_CATALOG.filter(quest => {
    // Vérifier la maison
    if (quest.house !== 'all' && quest.house !== 'user_house' && quest.house !== userHouse) {
      return false
    }
    
    // Vérifier si déjà complétée
    if (completedQuests.includes(quest.id)) {
      return false
    }
    
    // Vérifier les prérequis
    if (quest.prerequisites.length > 0) {
      const hasAllPrerequisites = quest.prerequisites.every(prereq => 
        completedQuests.includes(prereq)
      )
      if (!hasAllPrerequisites) {
        return false
      }
    }
    
    return true
  })
}

/**
 * Calcule le progrès total d'une quête
 */
export const calculateQuestProgress = (quest) => {
  if (!quest.steps || quest.steps.length === 0) return 0
  
  const totalSteps = quest.steps.length
  const completedSteps = quest.steps.filter(step => step.current >= step.target).length
  
  return Math.round((completedSteps / totalSteps) * 100)
}

/**
 * Vérifie si une quête est complète
 */
export const isQuestComplete = (quest) => {
  if (!quest.steps || quest.steps.length === 0) return false
  
  return quest.steps.every(step => step.current >= step.target)
}

/**
 * Vérifie si une quête a expiré
 */
export const isQuestExpired = (quest, startDate) => {
  if (!quest.duration || !startDate) return false
  
  const now = Date.now()
  const questStartTime = new Date(startDate).getTime()
  
  return (now - questStartTime) > quest.duration
}

/**
 * Calcule les récompenses totales d'une quête
 */
export const calculateQuestRewards = (quest) => {
  const stepXP = quest.steps.reduce((total, step) => total + step.xp, 0)
  const bonusXP = quest.rewards.xp || 0
  const difficulty = QUEST_DIFFICULTIES[quest.difficulty]
  
  return {
    totalXP: Math.round((stepXP + bonusXP) * difficulty.multiplier),
    badge: quest.rewards.badge,
    title: quest.rewards.title,
    special: quest.rewards.special
  }
}

// ========================================
// FONCTIONS DE GESTION DES QUÊTES
// ========================================

/**
 * Récupère les quêtes d'un utilisateur
 */
export const getUserQuests = async (userId) => {
  try {
    const questsRef = dbRef(db, `Users/${userId}/gamification/quests`)
    const snapshot = await get(questsRef)
    return snapshot.val() || {}
  } catch (error) {
    console.error('Erreur lors de la récupération des quêtes:', error)
    return {}
  }
}

/**
 * Initialise les quêtes pour un nouvel utilisateur
 */
export const initializeUserQuests = async (userId, userHouse) => {
  try {
    const userQuests = await getUserQuests(userId)
    
    // Si l'utilisateur a déjà des quêtes, ne pas réinitialiser
    if (Object.keys(userQuests).length > 0) {
      return userQuests
    }
    
    // Initialiser avec les quêtes de base disponibles
    const availableQuests = getAvailableQuests(userHouse, [], 1)
    const initialQuests = {}
    
    // Ajouter les quêtes d'introduction automatiquement
    const introQuests = availableQuests.filter(quest => 
      quest.prerequisites.length === 0 && quest.difficulty === 'EASY'
    )
    
    for (const quest of introQuests) {
      initialQuests[quest.id] = {
        ...quest,
        status: QUEST_STATUS.AVAILABLE,
        startDate: Date.now(),
        progress: 0,
        completedSteps: []
      }
    }
    
    const questsRef = dbRef(db, `Users/${userId}/gamification/quests`)
    await set(questsRef, initialQuests)
    
    return initialQuests
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des quêtes:', error)
    return {}
  }
}

/**
 * Démarre une quête pour un utilisateur
 */
export const startQuest = async (userId, questId) => {
  try {
    const quest = QUEST_CATALOG.find(q => q.id === questId)
    if (!quest) {
      throw new Error(`Quête ${questId} introuvable`)
    }
    
    const questRef = dbRef(db, `Users/${userId}/gamification/quests/${questId}`)
    const questData = {
      ...quest,
      status: QUEST_STATUS.IN_PROGRESS,
      startDate: Date.now(),
      progress: 0,
      completedSteps: []
    }
    
    await set(questRef, questData)
    
    console.log(`Quête ${questId} démarrée pour l'utilisateur ${userId}`)
    return questData
  } catch (error) {
    console.error('Erreur lors du démarrage de la quête:', error)
    throw error
  }
}

/**
 * Met à jour le progrès d'une quête
 */
export const updateQuestProgress = async (userId, questId, stepId, increment = 1) => {
  try {
    const questRef = dbRef(db, `Users/${userId}/gamification/quests/${questId}`)
    const snapshot = await get(questRef)
    
    if (!snapshot.exists()) {
      console.log(`Quête ${questId} non trouvée pour l'utilisateur ${userId}`)
      return null
    }
    
    const questData = snapshot.val()
    
    // Vérifier si la quête est active
    if (questData.status !== QUEST_STATUS.IN_PROGRESS && questData.status !== QUEST_STATUS.AVAILABLE) {
      return questData
    }
    
    // Vérifier si la quête a expiré
    if (isQuestExpired(questData, questData.startDate)) {
      await update(questRef, { status: QUEST_STATUS.EXPIRED })
      return { ...questData, status: QUEST_STATUS.EXPIRED }
    }
    
    // Trouver l'étape à mettre à jour
    const stepIndex = questData.steps.findIndex(step => step.id === stepId)
    if (stepIndex === -1) {
      console.log(`Étape ${stepId} non trouvée dans la quête ${questId}`)
      return questData
    }
    
    // Mettre à jour le progrès de l'étape
    const updatedSteps = [...questData.steps]
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      current: Math.min(updatedSteps[stepIndex].current + increment, updatedSteps[stepIndex].target)
    }
    
    // Vérifier si l'étape est complétée
    const stepCompleted = updatedSteps[stepIndex].current >= updatedSteps[stepIndex].target
    let completedSteps = questData.completedSteps || []
    
    if (stepCompleted && !completedSteps.includes(stepId)) {
      completedSteps.push(stepId)
    }
    
    // Calculer le nouveau progrès
    const progress = calculateQuestProgress({ steps: updatedSteps })
    
    // Vérifier si la quête est complète
    const questComplete = isQuestComplete({ steps: updatedSteps })
    const newStatus = questComplete ? QUEST_STATUS.COMPLETED : QUEST_STATUS.IN_PROGRESS
    
    // Mettre à jour la quête
    const updates = {
      steps: updatedSteps,
      progress,
      completedSteps,
      status: newStatus
    }
    
    if (questComplete) {
      updates.completedDate = Date.now()
    }
    
    await update(questRef, updates)
    
    const updatedQuest = { ...questData, ...updates }
    
    console.log(`Quête ${questId} mise à jour: ${progress}% complété`)
    
    return updatedQuest
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la quête:', error)
    return null
  }
}

/**
 * Complète une quête et attribue les récompenses
 */
export const completeQuest = async (userId, questId) => {
  try {
    const questRef = dbRef(db, `Users/${userId}/gamification/quests/${questId}`)
    const snapshot = await get(questRef)
    
    if (!snapshot.exists()) {
      throw new Error(`Quête ${questId} non trouvée`)
    }
    
    const questData = snapshot.val()
    const rewards = calculateQuestRewards(questData)
    
    // Marquer la quête comme complétée
    await update(questRef, {
      status: QUEST_STATUS.COMPLETED,
      completedDate: Date.now()
    })
    
    // Enregistrer les récompenses dans l'historique
    const rewardRef = dbRef(db, `Users/${userId}/gamification/questRewards`)
    await push(rewardRef, {
      questId,
      questTitle: questData.title,
      rewards,
      date: Date.now()
    })

    // Déclencher notification pour la quête complétée
    try {
      await notificationService.createNotification(userId, {
        type: 'quest',
        title: 'Quête Terminée !',
        message: `Quête "${questData.title}" complétée !`,
        data: { 
          questId: questId, 
          questName: questData.title,
          questType: questData.type,
          rewards: rewards,
          xpReward: rewards.xp || 0
        }
      })
    } catch (notificationError) {
      console.warn('Erreur lors de l\'envoi de la notification quête:', notificationError)
    }

    // Vérifier et débloquer automatiquement les badges liés aux quêtes
    try {
      const badgesService = await import('./badgesService')
      const actionBadges = await badgesService.default.checkAndUnlockActionBadges(userId, 'QUIZ_COMPLETE', {})
      if (actionBadges.length > 0) {
        console.log(`🏆 ${actionBadges.length} badge(s) débloqué(s) après complétion de quête:`, 
          actionBadges.map(b => b.name).join(', '))
      }
    } catch (badgeError) {
      console.warn('Erreur lors de la vérification des badges quête:', badgeError)
    }
    
    console.log(`Quête ${questId} complétée! Récompenses:`, rewards)
    
    return {
      quest: { ...questData, status: QUEST_STATUS.COMPLETED },
      rewards
    }
  } catch (error) {
    console.error('Erreur lors de la complétion de la quête:', error)
    throw error
  }
}

/**
 * Débloque de nouvelles quêtes basées sur les prérequis
 */
export const unlockNewQuests = async (userId, userHouse, completedQuestIds) => {
  try {
    const userQuests = await getUserQuests(userId)
    const availableQuests = getAvailableQuests(userHouse, completedQuestIds)
    
    const newQuests = {}
    let questsUnlocked = 0
    
    for (const quest of availableQuests) {
      // Vérifier si la quête n'est pas déjà dans les quêtes utilisateur
      if (!userQuests[quest.id]) {
        newQuests[quest.id] = {
          ...quest,
          status: QUEST_STATUS.AVAILABLE,
          startDate: null,
          progress: 0,
          completedSteps: []
        }
        questsUnlocked++
      }
    }
    
    if (questsUnlocked > 0) {
      const questsRef = dbRef(db, `Users/${userId}/gamification/quests`)
      await update(questsRef, newQuests)
      
      console.log(`${questsUnlocked} nouvelles quêtes débloquées pour l'utilisateur ${userId}`)
    }
    
    return newQuests
  } catch (error) {
    console.error('Erreur lors du déblocage de nouvelles quêtes:', error)
    return {}
  }
}

/**
 * Obtient les statistiques des quêtes d'un utilisateur
 */
export const getQuestStats = async (userId) => {
  try {
    const userQuests = await getUserQuests(userId)
    const questsArray = Object.values(userQuests)
    
    const stats = {
      totalQuests: questsArray.length,
      completedQuests: questsArray.filter(q => q.status === QUEST_STATUS.COMPLETED).length,
      inProgressQuests: questsArray.filter(q => q.status === QUEST_STATUS.IN_PROGRESS).length,
      availableQuests: questsArray.filter(q => q.status === QUEST_STATUS.AVAILABLE).length,
      totalXPFromQuests: 0,
      averageProgress: 0
    }
    
    // Calculer l'XP total des quêtes complétées
    const rewardsRef = dbRef(db, `Users/${userId}/gamification/questRewards`)
    const rewardsSnapshot = await get(rewardsRef)
    
    if (rewardsSnapshot.exists()) {
      const rewards = Object.values(rewardsSnapshot.val())
      stats.totalXPFromQuests = rewards.reduce((total, reward) => total + reward.rewards.totalXP, 0)
    }
    
    // Calculer le progrès moyen
    if (questsArray.length > 0) {
      const totalProgress = questsArray.reduce((sum, quest) => sum + (quest.progress || 0), 0)
      stats.averageProgress = Math.round(totalProgress / questsArray.length)
    }
    
    return stats
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques des quêtes:', error)
    return {
      totalQuests: 0,
      completedQuests: 0,
      inProgressQuests: 0,
      availableQuests: 0,
      totalXPFromQuests: 0,
      averageProgress: 0
    }
  }
}

// Export par défaut
export default {
  QUEST_TYPES,
  QUEST_DIFFICULTIES,
  QUEST_STATUS,
  QUEST_CATALOG,
  getAvailableQuests,
  calculateQuestProgress,
  isQuestComplete,
  isQuestExpired,
  calculateQuestRewards,
  getUserQuests,
  initializeUserQuests,
  startQuest,
  updateQuestProgress,
  completeQuest,
  unlockNewQuests,
  getQuestStats
}
