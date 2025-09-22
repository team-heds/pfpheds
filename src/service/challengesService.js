import { ref as dbRef, get, set, update, push } from 'firebase/database'
import { db } from '../../firebase'
import { notificationService } from './notificationService.js'

// ========================================
// CONFIGURATION DES DÉFIS HEBDOMADAIRES
// ========================================

export const CHALLENGE_TYPES = {
  XP_GAIN: 'xp_gain',
  LOGIN_STREAK: 'login_streak',
  QUIZ_COMPLETE: 'quiz_complete',
  BADGE_UNLOCK: 'badge_unlock',
  SOCIAL_INTERACTION: 'social_interaction',
  EXPLORATION: 'exploration'
}

export const CHALLENGE_DIFFICULTY = {
  EASY: {
    name: 'Facile',
    color: '#22C55E',
    xpMultiplier: 1,
    icon: '🟢'
  },
  MEDIUM: {
    name: 'Moyen',
    color: '#F59E0B',
    xpMultiplier: 1.5,
    icon: '🟡'
  },
  HARD: {
    name: 'Difficile',
    color: '#EF4444',
    xpMultiplier: 2,
    icon: '🔴'
  },
  LEGENDARY: {
    name: 'Légendaire',
    color: '#8B5CF6',
    xpMultiplier: 3,
    icon: '🟣'
  }
}

// Configuration des défis disponibles
export const CHALLENGES_CONFIG = {
  // Défis XP
  weekly_xp_500: {
    id: 'weekly_xp_500',
    name: 'Collectionneur d\'XP',
    description: 'Gagne 500 XP cette semaine',
    type: CHALLENGE_TYPES.XP_GAIN,
    difficulty: 'EASY',
    target: 500,
    reward: {
      xp: 100,
      badge: null,
      title: 'Collectionneur Débutant'
    },
    icon: '⭐',
    category: 'progression'
  },
  
  weekly_xp_1500: {
    id: 'weekly_xp_1500',
    name: 'Maître de l\'XP',
    description: 'Gagne 1500 XP cette semaine',
    type: CHALLENGE_TYPES.XP_GAIN,
    difficulty: 'MEDIUM',
    target: 1500,
    reward: {
      xp: 300,
      badge: null,
      title: 'Maître de l\'XP'
    },
    icon: '🌟',
    category: 'progression'
  },

  weekly_xp_3000: {
    id: 'weekly_xp_3000',
    name: 'Légende de l\'XP',
    description: 'Gagne 3000 XP cette semaine',
    type: CHALLENGE_TYPES.XP_GAIN,
    difficulty: 'HARD',
    target: 3000,
    reward: {
      xp: 600,
      badge: 'weekly_legend',
      title: 'Légende Hebdomadaire'
    },
    icon: '💫',
    category: 'progression'
  },

  // Défis de connexion
  weekly_login_5: {
    id: 'weekly_login_5',
    name: 'Fidèle de la Semaine',
    description: 'Connecte-toi 5 jours cette semaine',
    type: CHALLENGE_TYPES.LOGIN_STREAK,
    difficulty: 'EASY',
    target: 5,
    reward: {
      xp: 150,
      badge: null,
      title: 'Fidèle'
    },
    icon: '📅',
    category: 'engagement'
  },

  weekly_login_7: {
    id: 'weekly_login_7',
    name: 'Présence Parfaite',
    description: 'Connecte-toi tous les jours cette semaine',
    type: CHALLENGE_TYPES.LOGIN_STREAK,
    difficulty: 'MEDIUM',
    target: 7,
    reward: {
      xp: 400,
      badge: 'perfect_week',
      title: 'Présence Parfaite'
    },
    icon: '🏆',
    category: 'engagement'
  },

  // Défis de quiz
  weekly_quiz_3: {
    id: 'weekly_quiz_3',
    name: 'Érudit de la Semaine',
    description: 'Complète 3 quiz cette semaine',
    type: CHALLENGE_TYPES.QUIZ_COMPLETE,
    difficulty: 'EASY',
    target: 3,
    reward: {
      xp: 200,
      badge: null,
      title: 'Érudit'
    },
    icon: '📚',
    category: 'apprentissage'
  },

  weekly_quiz_7: {
    id: 'weekly_quiz_7',
    name: 'Maître du Savoir',
    description: 'Complète 7 quiz cette semaine',
    type: CHALLENGE_TYPES.QUIZ_COMPLETE,
    difficulty: 'MEDIUM',
    target: 7,
    reward: {
      xp: 500,
      badge: 'quiz_master',
      title: 'Maître du Savoir'
    },
    icon: '🎓',
    category: 'apprentissage'
  },

  // Défis de badges
  weekly_badges_2: {
    id: 'weekly_badges_2',
    name: 'Chasseur de Badges',
    description: 'Débloque 2 nouveaux badges cette semaine',
    type: CHALLENGE_TYPES.BADGE_UNLOCK,
    difficulty: 'MEDIUM',
    target: 2,
    reward: {
      xp: 300,
      badge: null,
      title: 'Chasseur de Badges'
    },
    icon: '🏅',
    category: 'collection'
  },

  weekly_badges_5: {
    id: 'weekly_badges_5',
    name: 'Collectionneur Ultime',
    description: 'Débloque 5 nouveaux badges cette semaine',
    type: CHALLENGE_TYPES.BADGE_UNLOCK,
    difficulty: 'LEGENDARY',
    target: 5,
    reward: {
      xp: 1000,
      badge: 'ultimate_collector',
      title: 'Collectionneur Ultime'
    },
    icon: '👑',
    category: 'collection'
  }
}

// ========================================
// LOGIQUE DE GESTION DES DÉFIS
// ========================================

/**
 * Génère les défis de la semaine courante
 * @returns {Array} Liste des défis sélectionnés pour cette semaine
 */
export function generateWeeklyChallenges() {
  const currentWeek = getCurrentWeekNumber()
  const allChallenges = Object.values(CHALLENGES_CONFIG)
  
  // Algorithme de sélection basé sur la semaine pour avoir des défis cohérents
  const seed = currentWeek * 7 // Seed basé sur la semaine
  const selectedChallenges = []
  
  // Sélectionner 1 défi facile, 2 moyens, 1 difficile
  const easyChallenges = allChallenges.filter(c => c.difficulty === 'EASY')
  const mediumChallenges = allChallenges.filter(c => c.difficulty === 'MEDIUM')
  const hardChallenges = allChallenges.filter(c => c.difficulty === 'HARD')
  const legendaryChallenges = allChallenges.filter(c => c.difficulty === 'LEGENDARY')
  
  // Sélection pseudo-aléatoire mais déterministe
  selectedChallenges.push(easyChallenges[seed % easyChallenges.length])
  selectedChallenges.push(mediumChallenges[seed % mediumChallenges.length])
  selectedChallenges.push(mediumChallenges[(seed + 1) % mediumChallenges.length])
  selectedChallenges.push(hardChallenges[seed % hardChallenges.length])
  
  // 20% de chance d'avoir un défi légendaire
  if (seed % 5 === 0) {
    selectedChallenges.push(legendaryChallenges[seed % legendaryChallenges.length])
  }
  
  return selectedChallenges.map(challenge => ({
    ...challenge,
    weekNumber: currentWeek,
    startDate: getWeekStartDate(),
    endDate: getWeekEndDate(),
    progress: 0,
    completed: false,
    completedAt: null
  }))
}

/**
 * Récupère les défis actifs d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Défis actifs de l'utilisateur
 */
export async function getUserActiveChallenges(userId) {
  try {
    const currentWeek = getCurrentWeekNumber()
    const challengesRef = dbRef(db, `Users/${userId}/gamification/challenges/week_${currentWeek}`)
    const snapshot = await get(challengesRef)
    
    if (snapshot.exists()) {
      return Object.values(snapshot.val())
    } else {
      // Générer de nouveaux défis pour cette semaine
      const newChallenges = generateWeeklyChallenges()
      await initializeUserWeeklyChallenges(userId, newChallenges)
      return newChallenges
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des défis:', error)
    return []
  }
}

/**
 * Initialise les défis hebdomadaires pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Array} challenges - Défis à initialiser
 */
export async function initializeUserWeeklyChallenges(userId, challenges) {
  try {
    const currentWeek = getCurrentWeekNumber()
    const challengesRef = dbRef(db, `Users/${userId}/gamification/challenges/week_${currentWeek}`)
    
    const challengesData = {}
    challenges.forEach(challenge => {
      challengesData[challenge.id] = challenge
    })
    
    await set(challengesRef, challengesData)
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des défis:', error)
  }
}

/**
 * Met à jour le progrès d'un défi
 * @param {string} userId - ID de l'utilisateur
 * @param {string} challengeType - Type de défi
 * @param {number} increment - Valeur à ajouter au progrès
 * @param {Object} context - Contexte supplémentaire
 */
export async function updateChallengeProgress(userId, challengeType, increment = 1, context = {}) {
  try {
    const currentWeek = getCurrentWeekNumber()
    const challengesRef = dbRef(db, `Users/${userId}/gamification/challenges/week_${currentWeek}`)
    const snapshot = await get(challengesRef)
    
    if (!snapshot.exists()) {
      // Initialiser les défis si ils n'existent pas
      const newChallenges = generateWeeklyChallenges()
      await initializeUserWeeklyChallenges(userId, newChallenges)
      return await updateChallengeProgress(userId, challengeType, increment, context)
    }
    
    const challenges = snapshot.val()
    const completedChallenges = []
    
    // Mettre à jour tous les défis correspondant au type
    for (const challengeId in challenges) {
      const challenge = challenges[challengeId]
      
      if (challenge.type === challengeType && !challenge.completed) {
        const oldProgress = challenge.progress || 0
        const newProgress = Math.min(oldProgress + increment, challenge.target)
        
        challenge.progress = newProgress
        
        // Vérifier si le défi est complété
        if (newProgress >= challenge.target) {
          challenge.completed = true
          challenge.completedAt = new Date().toISOString()
          completedChallenges.push(challenge)
          
          // Ajouter les récompenses
          await awardChallengeReward(userId, challenge)

          // Déclencher notification pour le défi complété
          try {
            await notificationService.createNotification(userId, {
              type: 'challenge',
              title: 'Défi Relevé !',
              message: `Défi "${challenge.name}" terminé !`,
              data: { 
                challengeId: challengeId, 
                challengeName: challenge.name,
                challengeType: challenge.type,
                reward: challenge.reward,
                xpReward: challenge.reward?.xp || 0
              }
            })
          } catch (notificationError) {
            console.warn('Erreur lors de l\'envoi de la notification défi:', notificationError)
          }

          // Vérifier et débloquer automatiquement les badges liés aux défis
          try {
            const badgesService = await import('./badgesService')
            const actionBadges = await badgesService.default.checkAndUnlockActionBadges(userId, 'CHALLENGE_COMPLETED', {})
            if (actionBadges.length > 0) {
              console.log(`🏆 ${actionBadges.length} badge(s) débloqué(s) après complétion de défi:`, 
                actionBadges.map(b => b.name).join(', '))
            }
          } catch (badgeError) {
            console.warn('Erreur lors de la vérification des badges défi:', badgeError)
          }
        }
        
        // Mettre à jour dans Firebase
        const challengeRef = dbRef(db, `Users/${userId}/gamification/challenges/week_${currentWeek}/${challengeId}`)
        await update(challengeRef, {
          progress: challenge.progress,
          completed: challenge.completed,
          completedAt: challenge.completedAt
        })
      }
    }
    
    return completedChallenges
  } catch (error) {
    console.error('Erreur lors de la mise à jour du progrès:', error)
    return []
  }
}

/**
 * Attribue les récompenses d'un défi complété
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} challenge - Défi complété
 */
export async function awardChallengeReward(userId, challenge) {
  try {
    const userRef = dbRef(db, `Users/${userId}/gamification`)
    const snapshot = await get(userRef)
    const userData = snapshot.val() || {}
    
    // Ajouter l'XP de récompense
    if (challenge.reward.xp > 0) {
      const hesHousesService = await import('./hesHousesService')
      await hesHousesService.addUserXP(userId, 'CHALLENGE_COMPLETE', challenge.reward.xp)
    }
    
    // Ajouter le titre si applicable
    if (challenge.reward.title) {
      const titles = userData.titles || []
      if (!titles.includes(challenge.reward.title)) {
        titles.push(challenge.reward.title)
        await update(userRef, { titles })
      }
    }
    
    // Débloquer le badge si applicable
    if (challenge.reward.badge) {
      const badgesService = await import('./badgesService')
      await badgesService.default.unlockBadge(userId, challenge.reward.badge)
    }
    
    // Enregistrer dans l'historique
    const historyRef = dbRef(db, `Users/${userId}/gamification/challengeHistory`)
    await push(historyRef, {
      challengeId: challenge.id,
      challengeName: challenge.name,
      completedAt: challenge.completedAt,
      reward: challenge.reward,
      weekNumber: challenge.weekNumber
    })
    
  } catch (error) {
    console.error('Erreur lors de l\'attribution des récompenses:', error)
  }
}

/**
 * Récupère l'historique des défis d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} limit - Nombre maximum de défis à récupérer
 * @returns {Promise<Array>} Historique des défis
 */
export async function getUserChallengeHistory(userId, limit = 20) {
  try {
    const historyRef = dbRef(db, `Users/${userId}/gamification/challengeHistory`)
    const snapshot = await get(historyRef)
    
    if (snapshot.exists()) {
      const history = Object.values(snapshot.val())
      return history
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, limit)
    }
    
    return []
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return []
  }
}

/**
 * Calcule les statistiques des défis d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Statistiques des défis
 */
export async function getUserChallengeStats(userId) {
  try {
    const history = await getUserChallengeHistory(userId, 1000)
    const currentChallenges = await getUserActiveChallenges(userId)
    
    const stats = {
      totalCompleted: history.length,
      currentWeekCompleted: currentChallenges.filter(c => c.completed).length,
      currentWeekTotal: currentChallenges.length,
      totalXPFromChallenges: history.reduce((sum, h) => sum + (h.reward.xp || 0), 0),
      completionRate: 0,
      streakWeeks: 0,
      favoriteCategory: null
    }
    
    // Calculer le taux de complétion
    if (stats.currentWeekTotal > 0) {
      stats.completionRate = Math.round((stats.currentWeekCompleted / stats.currentWeekTotal) * 100)
    }
    
    // Calculer la catégorie favorite
    const categoryCount = {}
    history.forEach(h => {
      const challenge = CHALLENGES_CONFIG[h.challengeId]
      if (challenge) {
        categoryCount[challenge.category] = (categoryCount[challenge.category] || 0) + 1
      }
    })
    
    if (Object.keys(categoryCount).length > 0) {
      stats.favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b
      )
    }
    
    return stats
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error)
    return {
      totalCompleted: 0,
      currentWeekCompleted: 0,
      currentWeekTotal: 0,
      totalXPFromChallenges: 0,
      completionRate: 0,
      streakWeeks: 0,
      favoriteCategory: null
    }
  }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Récupère le numéro de la semaine courante
 * @returns {number} Numéro de la semaine
 */
function getCurrentWeekNumber() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now - start
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  return Math.floor(diff / oneWeek)
}

/**
 * Récupère la date de début de la semaine courante
 * @returns {string} Date de début au format ISO
 */
function getWeekStartDate() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Lundi comme premier jour
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

/**
 * Récupère la date de fin de la semaine courante
 * @returns {string} Date de fin au format ISO
 */
function getWeekEndDate() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? 0 : 7) // Dimanche comme dernier jour
  const sunday = new Date(now.setDate(diff))
  sunday.setHours(23, 59, 59, 999)
  return sunday.toISOString()
}

/**
 * Vérifie si c'est une nouvelle semaine et réinitialise les défis si nécessaire
 * @param {string} userId - ID de l'utilisateur
 */
export async function checkAndResetWeeklyChallenges(userId) {
  try {
    const currentWeek = getCurrentWeekNumber()
    const userRef = dbRef(db, `Users/${userId}/gamification/lastChallengeWeek`)
    const snapshot = await get(userRef)
    
    const lastWeek = snapshot.val()
    
    if (!lastWeek || lastWeek < currentWeek) {
      // Nouvelle semaine, générer de nouveaux défis
      const newChallenges = generateWeeklyChallenges()
      await initializeUserWeeklyChallenges(userId, newChallenges)
      await set(userRef, currentWeek)
      
      return newChallenges
    }
    
    return null
  } catch (error) {
    console.error('Erreur lors de la vérification des défis hebdomadaires:', error)
    return null
  }
}

// Export par défaut
export default {
  CHALLENGE_TYPES,
  CHALLENGE_DIFFICULTY,
  CHALLENGES_CONFIG,
  generateWeeklyChallenges,
  getUserActiveChallenges,
  initializeUserWeeklyChallenges,
  updateChallengeProgress,
  awardChallengeReward,
  getUserChallengeHistory,
  getUserChallengeStats,
  checkAndResetWeeklyChallenges
}
