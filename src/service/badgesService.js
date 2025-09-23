import { ref as dbRef, get, set, update, push } from 'firebase/database'
import { db } from '../../firebase'
import notificationService from './notificationService.js'

// Configuration des badges disponibles
export const BADGES_CONFIG = {
  // 🌟 Badges de Démarrage
  FIRST_STEPS: {
    id: 'FIRST_STEPS',
    name: 'Premiers Pas',
    description: 'Complétez votre profil et rejoignez une maison',
    icon: '👶',
    color: '#4CAF50',
    xpBonus: 50,
    rarity: 'common',
    category: 'debut',
    condition: (userStats) => userStats.maison && userStats.totalXP >= 10
  },
  
  SOCIAL_BUTTERFLY: {
    id: 'SOCIAL_BUTTERFLY',
    name: 'Papillon Social',
    description: 'Créez 5 posts ou commentaires',
    icon: '🦋',
    color: '#FF9800',
    xpBonus: 100,
    rarity: 'common',
    category: 'social',
    condition: (userStats) => (userStats.stats?.postsCreated || 0) + (userStats.stats?.commentsCreated || 0) >= 5
  },
  
  STUDY_STREAK: {
    id: 'STUDY_STREAK',
    name: 'Série d\'Étude',
    description: 'Connectez-vous 7 jours consécutifs',
    icon: '🔥',
    color: '#F44336',
    xpBonus: 200,
    rarity: 'uncommon',
    category: 'engagement',
    condition: (userStats) => (userStats.stats?.loginStreak || 0) >= 7
  },
  
  // 🎓 Badges Académiques
  KNOWLEDGE_SEEKER: {
    id: 'KNOWLEDGE_SEEKER',
    name: 'Chercheur de Savoir',
    description: 'Créez 10 notes ou documents',
    icon: '📚',
    color: '#3F51B5',
    xpBonus: 150,
    rarity: 'uncommon',
    category: 'academique',
    condition: (userStats) => (userStats.stats?.notesCreated || 0) >= 10
  },
  
  MENTOR: {
    id: 'MENTOR',
    name: 'Mentor',
    description: 'Aidez 5 autres étudiants',
    icon: '👨‍🏫',
    color: '#9C27B0',
    xpBonus: 300,
    rarity: 'rare',
    category: 'social',
    condition: (userStats) => (userStats.stats?.helpedStudents || 0) >= 5
  },
  
  // 🏆 Badges de Niveau
  RISING_STAR: {
    id: 'RISING_STAR',
    name: 'Étoile Montante',
    description: 'Atteignez le niveau 5',
    icon: '⭐',
    color: '#FFD700',
    xpBonus: 250,
    rarity: 'uncommon',
    category: 'progression',
    condition: (userStats) => userStats.niveau >= 5
  },
  
  EXPERT: {
    id: 'EXPERT',
    name: 'Expert',
    description: 'Atteignez le niveau 10',
    icon: '🎯',
    color: '#FF5722',
    xpBonus: 500,
    rarity: 'rare',
    category: 'progression',
    condition: (userStats) => userStats.niveau >= 10
  },
  
  LEGEND: {
    id: 'LEGEND',
    name: 'Légende',
    description: 'Atteignez le niveau 15',
    icon: '👑',
    color: '#E91E63',
    xpBonus: 1000,
    rarity: 'legendary',
    category: 'progression',
    condition: (userStats) => userStats.niveau >= 15
  },
  
  // 🏠 Badges de Maison
  HOUSE_CHAMPION: {
    id: 'HOUSE_CHAMPION',
    name: 'Champion de Maison',
    description: 'Soyez dans le top 3 de votre maison',
    icon: '🏆',
    color: '#FFC107',
    xpBonus: 400,
    rarity: 'rare',
    category: 'competition',
    condition: (userStats, houseStats) => {
      if (!houseStats || !houseStats.members) return false
      const userRank = houseStats.members.findIndex(member => member.userId === userStats.userId) + 1
      return userRank > 0 && userRank <= 3
    }
  },
  
  HOUSE_PRIDE: {
    id: 'HOUSE_PRIDE',
    name: 'Fierté de Maison',
    description: 'Représentez votre maison pendant 30 jours',
    icon: '🛡️',
    color: '#607D8B',
    xpBonus: 200,
    rarity: 'uncommon',
    category: 'loyaute',
    condition: (userStats) => {
      if (!userStats.dateSelection) return false
      const daysSinceSelection = Math.floor((Date.now() - new Date(userStats.dateSelection).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceSelection >= 30
    }
  },
  
  // 🎉 Badges Spéciaux
  EARLY_ADOPTER: {
    id: 'EARLY_ADOPTER',
    name: 'Pionnier',
    description: 'Parmi les 100 premiers utilisateurs',
    icon: '🚀',
    color: '#00BCD4',
    xpBonus: 500,
    rarity: 'legendary',
    category: 'special',
    condition: (userStats) => false // À attribuer manuellement
  },
  
  COMMUNITY_BUILDER: {
    id: 'COMMUNITY_BUILDER',
    name: 'Bâtisseur de Communauté',
    description: 'Créez ou gérez une communauté',
    icon: '🏗️',
    color: '#795548',
    xpBonus: 300,
    rarity: 'rare',
    category: 'social',
    condition: (userStats) => (userStats.stats?.communitiesCreated || 0) >= 1
  }
}

// Catégories de badges pour l'organisation
export const BADGE_CATEGORIES = {
  debut: { name: 'Démarrage', icon: '🌟', color: '#4CAF50' },
  social: { name: 'Social', icon: '👥', color: '#FF9800' },
  academique: { name: 'Académique', icon: '🎓', color: '#3F51B5' },
  progression: { name: 'Progression', icon: '📈', color: '#9C27B0' },
  competition: { name: 'Compétition', icon: '🏆', color: '#FFC107' },
  engagement: { name: 'Engagement', icon: '🔥', color: '#F44336' },
  loyaute: { name: 'Loyauté', icon: '🛡️', color: '#607D8B' },
  special: { name: 'Spécial', icon: '✨', color: '#E91E63' }
}

// Niveaux de rareté
export const BADGE_RARITY = {
  common: { name: 'Commun', color: '#9E9E9E', glow: false },
  uncommon: { name: 'Peu Commun', color: '#4CAF50', glow: false },
  rare: { name: 'Rare', color: '#FF9800', glow: true },
  legendary: { name: 'Légendaire', color: '#9C27B0', glow: true }
}

/**
 * Vérifie quels badges un utilisateur peut débloquer
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userStats - Statistiques de l'utilisateur
 * @param {Object} houseStats - Statistiques de la maison (optionnel)
 * @returns {Array} Liste des badges débloqués
 */
export const checkUnlockedBadges = async (userId, userStats, houseStats = null) => {
  try {
    // Récupérer les badges actuels de l'utilisateur
    const userBadgesRef = dbRef(db, `Users/${userId}/gamification/badges`)
    const userBadgesSnapshot = await get(userBadgesRef)
    const currentBadges = userBadgesSnapshot.val() || {}
    
    const newlyUnlocked = []
    
    // Vérifier chaque badge
    for (const [badgeId, badgeConfig] of Object.entries(BADGES_CONFIG)) {
      // Skip si déjà débloqué
      if (currentBadges[badgeId]) continue
      
      // Vérifier la condition
      if (badgeConfig.condition(userStats, houseStats)) {
        newlyUnlocked.push({
          ...badgeConfig,
          unlockedAt: new Date().toISOString()
        })
      }
    }
    
    return newlyUnlocked
  } catch (error) {
    console.error('Erreur lors de la vérification des badges:', error)
    return []
  }
}

/**
 * Débloque un badge pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} badge - Configuration du badge
 * @returns {boolean} Succès du déblocage
 */
export const unlockBadge = async (userId, badge) => {
  try {
    const badgeData = {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      rarity: badge.rarity,
      category: badge.category,
      xpBonus: badge.xpBonus,
      unlockedAt: new Date().toISOString()
    }
    
    // Sauvegarder le badge
    const badgeRef = dbRef(db, `Users/${userId}/gamification/badges/${badge.id}`)
    await set(badgeRef, badgeData)
    
    // Ajouter l'XP bonus
    if (badge.xpBonus > 0) {
      const { addUserXP } = await import('./hesHousesService')
      await addUserXP(userId, 'BADGE_UNLOCKED', badge.xpBonus, `Badge débloqué: ${badge.name}`)
    }
    
    // Enregistrer dans l'historique
    const historyRef = dbRef(db, `Users/${userId}/gamification/badgeHistory`)
    await push(historyRef, {
      badgeId: badge.id,
      badgeName: badge.name,
      xpBonus: badge.xpBonus,
      unlockedAt: badgeData.unlockedAt
    })

    // Déclencher notification pour le nouveau badge
    try {
      await notificationService.createNotification(userId, {
        type: 'badge',
        title: 'Nouveau Badge !',
        message: `Badge "${badge.name}" débloqué !`,
        data: { 
          badgeId: badge.id, 
          badgeName: badge.name,
          icon: badge.icon,
          rarity: badge.rarity,
          xpBonus: badge.xpBonus
        }
      })
    } catch (notificationError) {
      console.warn('Erreur lors de l\'envoi de la notification badge:', notificationError)
    }
    
    console.log(`🏆 Badge débloqué pour ${userId}: ${badge.name} (+${badge.xpBonus} XP)`)
    return true
  } catch (error) {
    console.error('Erreur lors du déblocage du badge:', error)
    return false
  }
}

/**
 * Récupère tous les badges d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} Badges de l'utilisateur
 */
export const getUserBadges = async (userId) => {
  try {
    const badgesRef = dbRef(db, `Users/${userId}/gamification/badges`)
    const snapshot = await get(badgesRef)
    return snapshot.val() || {}
  } catch (error) {
    console.error('Erreur lors de la récupération des badges:', error)
    return {}
  }
}

/**
 * Récupère l'historique des badges d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Array} Historique des badges
 */
export const getUserBadgeHistory = async (userId) => {
  try {
    const historyRef = dbRef(db, `Users/${userId}/gamification/badgeHistory`)
    const snapshot = await get(historyRef)
    const history = snapshot.val() || {}
    
    return Object.values(history).sort((a, b) => 
      new Date(b.unlockedAt) - new Date(a.unlockedAt)
    )
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des badges:', error)
    return []
  }
}

/**
 * Vérifie et débloque automatiquement les badges basés sur les actions utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} action - Action effectuée par l'utilisateur
 * @param {Object} context - Contexte supplémentaire (XP, niveau, etc.)
 * @returns {Array} Badges débloqués
 */
export const checkAndUnlockActionBadges = async (userId, action, context = {}) => {
  try {
    const userBadges = await getUserBadges(userId)
    const userStats = context.userStats || await getUserGamificationStats(userId)
    const newBadges = []

    // Vérifier les badges basés sur l'action spécifique
    switch (action) {
      case 'LOGIN':
        // Badge première connexion
        if (!userBadges.FIRST_LOGIN && userStats.totalLogins === 1) {
          newBadges.push(BADGES_CONFIG.FIRST_LOGIN)
        }
        // Badge connexion régulière (7 jours consécutifs)
        if (!userBadges.LOGIN_STREAK_7 && userStats.loginStreak >= 7) {
          newBadges.push(BADGES_CONFIG.LOGIN_STREAK_7)
        }
        // Badge connexion dédiée (30 jours consécutifs)
        if (!userBadges.LOGIN_STREAK_30 && userStats.loginStreak >= 30) {
          newBadges.push(BADGES_CONFIG.LOGIN_STREAK_30)
        }
        break

      case 'QUIZ_COMPLETE':
        // Badge première quête
        if (!userBadges.FIRST_QUEST && userStats.questsCompleted === 1) {
          newBadges.push(BADGES_CONFIG.FIRST_QUEST)
        }
        // Badge explorateur (5 quêtes)
        if (!userBadges.QUEST_EXPLORER && userStats.questsCompleted >= 5) {
          newBadges.push(BADGES_CONFIG.QUEST_EXPLORER)
        }
        break

      case 'XP_GAINED':
        // Badge premiers pas (100 XP)
        if (!userBadges.XP_MILESTONE_100 && userStats.totalXP >= 100) {
          newBadges.push(BADGES_CONFIG.XP_MILESTONE_100)
        }
        // Badge progresseur (500 XP)
        if (!userBadges.XP_MILESTONE_500 && userStats.totalXP >= 500) {
          newBadges.push(BADGES_CONFIG.XP_MILESTONE_500)
        }
        // Badge expert (1000 XP)
        if (!userBadges.XP_MILESTONE_1000 && userStats.totalXP >= 1000) {
          newBadges.push(BADGES_CONFIG.XP_MILESTONE_1000)
        }
        break

      case 'LEVEL_UP':
        // Badge niveau 5
        if (!userBadges.LEVEL_5 && userStats.niveau >= 5) {
          newBadges.push(BADGES_CONFIG.LEVEL_5)
        }
        // Badge niveau 10
        if (!userBadges.LEVEL_10 && userStats.niveau >= 10) {
          newBadges.push(BADGES_CONFIG.LEVEL_10)
        }
        break

      case 'CHALLENGE_COMPLETED':
        // Badge premier défi
        if (!userBadges.FIRST_CHALLENGE && userStats.challengesCompleted === 1) {
          newBadges.push(BADGES_CONFIG.FIRST_CHALLENGE)
        }
        // Badge challenger (5 défis)
        if (!userBadges.CHALLENGE_MASTER && userStats.challengesCompleted >= 5) {
          newBadges.push(BADGES_CONFIG.CHALLENGE_MASTER)
        }
        break
    }

    // Débloquer les nouveaux badges
    const unlockedBadges = []
    for (const badge of newBadges) {
      const success = await unlockBadge(userId, badge)
      if (success) {
        unlockedBadges.push(badge)
      }
    }

    return unlockedBadges
  } catch (error) {
    console.error('Erreur lors de la vérification des badges automatiques:', error)
    return []
  }
}

/**
 * Récupère les statistiques gamification d'un utilisateur pour les badges
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} Statistiques utilisateur
 */
const getUserGamificationStats = async (userId) => {
  try {
    const userRef = dbRef(db, `Users/${userId}/gamification`)
    const snapshot = await get(userRef)
    const data = snapshot.val() || {}
    
    return {
      totalXP: data.totalXP || 0,
      niveau: data.niveau || 1,
      loginStreak: data.loginStreak || 0,
      totalLogins: data.totalLogins || 0,
      questsCompleted: data.questsCompleted || 0,
      challengesCompleted: data.challengesCompleted || 0,
      badgesUnlocked: Object.keys(data.badges || {}).length
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des stats utilisateur:', error)
    return {}
  }
}

/**
 * Calcule les statistiques des badges d'un utilisateur
 * @param {Object} userBadges - Badges de l'utilisateur
 * @returns {Object} Statistiques des badges
 */
export const calculateBadgeStats = (userBadges) => {
  const badges = Object.values(userBadges || {})
  const totalBadges = badges.length
  const totalPossible = Object.keys(BADGES_CONFIG).length
  
  const byRarity = badges.reduce((acc, badge) => {
    acc[badge.rarity] = (acc[badge.rarity] || 0) + 1
    return acc
  }, {})
  
  const byCategory = badges.reduce((acc, badge) => {
    acc[badge.category] = (acc[badge.category] || 0) + 1
    return acc
  }, {})
  
  const totalXPFromBadges = badges.reduce((total, badge) => 
    total + (badge.xpBonus || 0), 0
  )
  
  return {
    totalBadges,
    totalPossible,
    completionPercentage: Math.round((totalBadges / totalPossible) * 100),
    byRarity,
    byCategory,
    totalXPFromBadges
  }
}

/**
 * Vérifie automatiquement et débloque les nouveaux badges
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userStats - Statistiques de l'utilisateur
 * @param {Object} houseStats - Statistiques de la maison (optionnel)
 * @returns {Array} Badges nouvellement débloqués
 */
export const autoCheckAndUnlockBadges = async (userId, userStats, houseStats = null) => {
  try {
    const newBadges = await checkUnlockedBadges(userId, userStats, houseStats)
    const unlockedBadges = []
    
    for (const badge of newBadges) {
      const success = await unlockBadge(userId, badge)
      if (success) {
        unlockedBadges.push(badge)
      }
    }
    
    return unlockedBadges
  } catch (error) {
    console.error('Erreur lors de la vérification automatique des badges:', error)
    return []
  }
}

export default {
  BADGES_CONFIG,
  BADGE_CATEGORIES,
  BADGE_RARITY,
  checkUnlockedBadges,
  unlockBadge,
  getUserBadges,
  getUserBadgeHistory,
  calculateBadgeStats,
  autoCheckAndUnlockBadges,
  checkAndUnlockActionBadges
}
