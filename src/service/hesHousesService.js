/**
 * Service pour la gestion des maisons HES
 * Gère les maisons Harmonis, Elaris, Doloris et Solencia
 */

import { getDatabase, ref as dbRef, get, update, set, push } from 'firebase/database'
import { db } from '../../firebase' // Chemin corrigé

// Configuration des niveaux et XP - Système à 20 niveaux (Reset annuel)
export const LEVEL_CONFIG = {
  1: { name: 'Étudiant·e', xpRequired: 0, xpToNext: 50 },
  2: { name: 'Stagiaire', xpRequired: 50, xpToNext: 75 },
  3: { name: 'Assistant·e', xpRequired: 125, xpToNext: 100 },
  4: { name: 'Praticien·ne Junior', xpRequired: 225, xpToNext: 150 },
  5: { name: 'Soignant·e', xpRequired: 375, xpToNext: 200 },
  6: { name: 'Thérapeute', xpRequired: 575, xpToNext: 275 },
  7: { name: 'Clinicien·ne', xpRequired: 850, xpToNext: 350 },
  8: { name: 'Spécialiste', xpRequired: 1200, xpToNext: 450 },
  9: { name: 'Expert·e Clinique', xpRequired: 1650, xpToNext: 600 },
  10: { name: 'Référent·e', xpRequired: 2250, xpToNext: 750 },
  11: { name: 'Mentor·e', xpRequired: 3000, xpToNext: 950 },
  12: { name: 'Superviseur·se', xpRequired: 3950, xpToNext: 1200 },
  13: { name: 'Coordinateur·trice', xpRequired: 5150, xpToNext: 1500 },
  14: { name: 'Chef·fe de Service', xpRequired: 6650, xpToNext: 1900 },
  15: { name: 'Directeur·trice Adjoint·e', xpRequired: 8550, xpToNext: 2400 },
  16: { name: 'Directeur·trice', xpRequired: 10950, xpToNext: 3000 },
  17: { name: 'Expert·e Reconnu·e', xpRequired: 13950, xpToNext: 3800 },
  18: { name: 'Maître·sse de la Discipline', xpRequired: 17750, xpToNext: 4750 },
  19: { name: 'Sage de la Maison', xpRequired: 22500, xpToNext: 6000 },
  20: { name: 'Légende Vivante', xpRequired: 28500, xpToNext: 0 }
}

// Actions qui donnent de l'XP - Système rebalancé (Reset annuel)
export const XP_ACTIONS = {
  LOGIN: { xp: 5, description: 'Connexion quotidienne' },
  QUIZ_COMPLETE: { xp: 10, description: 'Quiz de maison terminé' },
  PROFILE_UPDATE: { xp: 15, description: 'Profil mis à jour' },
  COMMENT: { xp: 8, description: 'Commentaire ajouté' },
  POST: { xp: 25, description: 'Publication créée' },
  LIKE: { xp: 1, description: 'Like donné' },
  SHARE: { xp: 12, description: 'Partage effectué' },
  ACHIEVEMENT: { xp: 200, description: 'Achievement débloqué' },
  DAILY_STREAK_3: { xp: 50, description: '3 jours consécutifs' },
  DAILY_STREAK_7: { xp: 150, description: '7 jours consécutifs' },
  DAILY_STREAK_30: { xp: 500, description: '30 jours consécutifs' },
  FIRST_POST: { xp: 75, description: 'Première publication' },
  FIRST_COMMENT: { xp: 50, description: 'Premier commentaire' },
  HELPFUL_COMMENT: { xp: 60, description: 'Commentaire utile (5+ likes)' },
  POPULAR_POST: { xp: 150, description: 'Publication populaire (10+ likes)' },
  MENTOR_HELP: { xp: 100, description: 'Aide apportée à un·e étudiant·e' },
  COURSE_COMPLETION: { xp: 300, description: 'Cours terminé' },
  RESEARCH_CONTRIBUTION: { xp: 500, description: 'Contribution à la recherche' },
  COMMUNITY_EVENT: { xp: 200, description: 'Participation à un événement' }
}

// Configuration des maisons HES
export const HES_HOUSES = {
  harmonis: {
    name: 'Harmonis',
    motto: 'L\'équilibre soigne',
    description: 'Tu es quelqu\'un de stable, paisible et centré. Tu cherches l\'harmonie autour de toi, tu aides les autres à se sentir bien sans faire de bruit. Tu sais que l\'équilibre soigne.',
    color: '#2E8B57', // Vert
    icon: 'pi pi-circle',
    traits: ['Stabilité', 'Paix', 'Équilibre', 'Harmonie', 'Sérénité']
  },
  elaris: {
    name: 'Elaris',
    motto: 'Clarifier, guider, apaiser',
    description: 'Tu es clair dans tes idées, tu aimes guider les autres et voir au-delà des apparences. Tu éclaires les chemins, tu transmets des idées avec calme et assurance.',
    color: '#DC143C', // Rouge
    icon: 'pi pi-sun',
    traits: ['Clarté', 'Leadership', 'Vision', 'Guidance', 'Assurance']
  },
  doloris: {
    name: 'Doloris',
    motto: 'Comprendre la douleur, c\'est soigner',
    description: 'Tu ressens profondément ce que les autres vivent. Tu as de la compassion, tu veux comprendre avant d\'agir. Tu ne fais pas les choses à moitié.',
    color: '#FFD700', // Jaune
    icon: 'pi pi-heart',
    traits: ['Empathie', 'Compassion', 'Compréhension', 'Profondeur', 'Sensibilité']
  },
  solencia: {
    name: 'Solencia',
    motto: 'Apaiser pour mieux guérir',
    description: 'Tu es doux, apaisant, et tu offres ta présence aux autres dans les moments difficiles. Tu sais écouter, rassurer et consoler.',
    color: '#4169E1', // Bleu
    icon: 'pi pi-moon',
    traits: ['Douceur', 'Réconfort', 'Écoute', 'Tendresse', 'Consolation']
  }
}

// Configuration des niveaux de maisons (basé sur 47,5 personnes par maison)
export const HOUSE_LEVEL_CONFIG = {
  1: { name: 'Maison Naissante', xpRequired: 0, xpToNext: 2375 }, // 50 * 47.5
  2: { name: 'Maison Émergente', xpRequired: 2375, xpToNext: 3563 }, // 75 * 47.5
  3: { name: 'Maison Croissante', xpRequired: 5938, xpToNext: 4750 }, // 100 * 47.5
  4: { name: 'Maison Prometteuse', xpRequired: 10688, xpToNext: 7125 }, // 150 * 47.5
  5: { name: 'Maison Établie', xpRequired: 17813, xpToNext: 9500 }, // 200 * 47.5
  6: { name: 'Maison Respectée', xpRequired: 27313, xpToNext: 13063 }, // 275 * 47.5
  7: { name: 'Maison Reconnue', xpRequired: 40375, xpToNext: 16625 }, // 350 * 47.5
  8: { name: 'Maison Experte', xpRequired: 57000, xpToNext: 21375 }, // 450 * 47.5
  9: { name: 'Maison Éminente', xpRequired: 78375, xpToNext: 28500 }, // 600 * 47.5
  10: { name: 'Maison Référente', xpRequired: 106875, xpToNext: 35625 }, // 750 * 47.5
  11: { name: 'Maison Mentore', xpRequired: 142500, xpToNext: 45125 }, // 950 * 47.5
  12: { name: 'Maison Superviseure', xpRequired: 187625, xpToNext: 57000 }, // 1200 * 47.5
  13: { name: 'Maison Coordinatrice', xpRequired: 244625, xpToNext: 71250 }, // 1500 * 47.5
  14: { name: 'Maison Dirigeante', xpRequired: 315875, xpToNext: 90250 }, // 1900 * 47.5
  15: { name: 'Maison Directrice', xpRequired: 406125, xpToNext: 114000 }, // 2400 * 47.5
  16: { name: 'Maison Magistrale', xpRequired: 520125, xpToNext: 142500 }, // 3000 * 47.5
  17: { name: 'Maison Experte Reconnue', xpRequired: 662625, xpToNext: 180500 }, // 3800 * 47.5
  18: { name: 'Maison Maîtresse', xpRequired: 843125, xpToNext: 225625 }, // 4750 * 47.5
  19: { name: 'Maison Sage', xpRequired: 1068750, xpToNext: 285000 }, // 6000 * 47.5
  20: { name: 'Maison Légendaire', xpRequired: 1353750, xpToNext: 0 } // 28500 * 47.5
}

/**
 * Récupère les informations d'une maison
 * @param {string} houseName - Nom de la maison
 * @returns {Object|null} Informations de la maison
 */
export function getHouseInfo(houseName) {
  return HES_HOUSES[houseName.toLowerCase()] || null
}

/**
 * Récupère toutes les maisons
 * @returns {Object} Toutes les maisons
 */
export function getAllHouses() {
  return HES_HOUSES
}

/**
 * Sauvegarde la maison d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} houseName - Nom de la maison
 * @returns {Promise<boolean>} Succès de l'opération
 */
export async function saveUserHouse(userId, houseName) {
  try {
    const houseInfo = getHouseInfo(houseName)
    if (!houseInfo) {
      throw new Error('Maison invalide')
    }

    const userRef = dbRef(getDatabase(), `Users/${userId}`)
    await update(userRef, {
      'gamification/maison': houseName.toLowerCase(),
      'gamification/niveau': 1,
      'gamification/xp': 0,
      'gamification/xpToNext': 50,
      'gamification/dateSelection': new Date().toISOString(),
      'gamification/houseInfo': {
        name: houseInfo.name,
        motto: houseInfo.motto,
        color: houseInfo.color,
        icon: houseInfo.icon
      }
    })

    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la maison:', error)
    return false
  }
}

/**
 * Récupère la maison d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} Informations de la maison de l'utilisateur
 */
export async function getUserHouse(userId) {
  try {
    const userRef = dbRef(getDatabase(), `Users/${userId}/gamification`)
    const snapshot = await get(userRef)
    const gamificationData = snapshot.val()
    
    if (gamificationData && gamificationData.maison) {
      return {
        house: gamificationData.maison,
        houseInfo: getHouseInfo(gamificationData.maison),
        niveau: gamificationData.niveau || 1,
        xp: gamificationData.xp || 0,
        xpToNext: gamificationData.xpToNext || 50,
        dateSelection: gamificationData.dateSelection
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération de la maison:', error)
    return null
  }
}

/**
 * Vérifie si un utilisateur a déjà une maison
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} True si l'utilisateur a une maison
 */
export async function userHasHouse(userId) {
  try {
    const userHouse = await getUserHouse(userId)
    return userHouse !== null
  } catch (error) {
    console.error('Erreur lors de la vérification de la maison:', error)
    return false
  }
}

/**
 * Réinitialise la maison d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} Succès de l'opération
 */
export async function resetUserHouse(userId) {
  try {
    const userRef = dbRef(getDatabase(), `Users/${userId}/gamification`)
    await update(userRef, {
      maison: null,
      niveau: 1,
      xp: 0,
      xpToNext: 50,
      houseInfo: null,
      dateSelection: null
    })

    return true
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la maison:', error)
    return false
  }
}

/**
 * Calcule la maison basée sur les réponses du quiz
 * @param {Array} answers - Tableau des réponses
 * @returns {string} Nom de la maison gagnante
 */
export function calculateHouseFromAnswers(answers) {
  const houseScores = {
    harmonis: 0,
    elaris: 0,
    doloris: 0,
    solencia: 0
  }
  
  // Compter les réponses pour chaque maison
  answers.forEach(answer => {
    if (houseScores.hasOwnProperty(answer.house)) {
      houseScores[answer.house]++
    }
  })
  
  // Trouver la maison avec le score le plus élevé
  let winningHouse = 'harmonis'
  let maxScore = 0
  
  for (const [house, score] of Object.entries(houseScores)) {
    if (score > maxScore) {
      maxScore = score
      winningHouse = house
    }
  }
  
  return winningHouse
}

/**
 * Récupère les statistiques des maisons
 * @returns {Promise<Object>} Statistiques par maison
 */
export async function getHouseStatistics() {
  try {
    const usersRef = dbRef(getDatabase(), 'Users')
    const snapshot = await get(usersRef)
    const users = snapshot.val() || {}
    
    const stats = {
      harmonis: { count: 0, members: [] },
      elaris: { count: 0, members: [] },
      doloris: { count: 0, members: [] },
      solencia: { count: 0, members: [] }
    }
    
    // Compter les membres de chaque maison
    for (const [userId, userData] of Object.entries(users)) {
      if (userData.gamification && userData.gamification.maison) {
        const house = userData.gamification.maison
        if (stats[house]) {
          stats[house].count++
          stats[house].members.push({
            id: userId,
            nom: userData.nom,
            prenom: userData.prenom,
            niveau: userData.gamification.niveau || 1,
            xp: userData.gamification.xp || 0
          })
        }
      }
    }
    
    // Trier les membres par niveau puis par XP
    for (const house of Object.keys(stats)) {
      stats[house].members.sort((a, b) => {
        if (b.niveau !== a.niveau) {
          return b.niveau - a.niveau
        }
        return b.xp - a.xp
      })
    }
    
    return stats
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return null
  }
}

/**
 * Calcule le niveau basé sur l'XP total
 * @param {number} totalXP - XP total de l'utilisateur
 * @returns {Object} Informations du niveau
 */
export function calculateLevel(totalXP) {
  for (let level = 20; level >= 1; level--) {
    if (totalXP >= LEVEL_CONFIG[level].xpRequired) {
      return {
        niveau: level,
        name: LEVEL_CONFIG[level].name,
        xpRequired: LEVEL_CONFIG[level].xpRequired,
        xpToNext: level < 20 ? LEVEL_CONFIG[level + 1].xpRequired - totalXP : 0
      }
    }
  }
  return {
    niveau: 1,
    name: 'Étudiant·e',
    xpRequired: 0,
    xpToNext: 50 - totalXP
  }
}

/**
 * Calcule le niveau d'une maison basé sur l'XP total de tous ses membres
 * @param {number} totalHouseXP - XP total de la maison
 * @returns {Object} Informations du niveau de la maison
 */
export function calculateHouseLevel(totalHouseXP) {
  for (let level = 20; level >= 1; level--) {
    if (totalHouseXP >= HOUSE_LEVEL_CONFIG[level].xpRequired) {
      return {
        niveau: level,
        name: HOUSE_LEVEL_CONFIG[level].name,
        xpRequired: HOUSE_LEVEL_CONFIG[level].xpRequired,
        xpToNext: level < 20 ? HOUSE_LEVEL_CONFIG[level + 1].xpRequired - totalHouseXP : 0
      }
    }
  }
  return {
    niveau: 1,
    name: 'Maison Naissante',
    xpRequired: 0,
    xpToNext: 2375 - totalHouseXP
  }
}

/**
 * Ajoute de l'XP à un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} action - Type d'action (LOGIN, QUIZ_COMPLETE, etc.)
 * @param {number} customXP - XP personnalisé (optionnel)
 * @returns {Promise<Object>} Nouvelles données de gamification
 */
export async function addUserXP(userId, action, customXP = null) {
  try {
    const userRef = dbRef(getDatabase(), `Users/${userId}/gamification`)
    const snapshot = await get(userRef)
    const currentData = snapshot.val() || {}
    
    // Calculer l'XP à ajouter
    const xpToAdd = customXP || XP_ACTIONS[action]?.xp || 0
    const newTotalXP = (currentData.totalXP || 0) + xpToAdd
    
    // Calculer le nouveau niveau
    const levelInfo = calculateLevel(newTotalXP)
    
    // Préparer les nouvelles données
    const newData = {
      ...currentData,
      xp: newTotalXP - levelInfo.xpRequired, // XP dans le niveau actuel
      totalXP: newTotalXP,
      niveau: levelInfo.niveau,
      xpToNext: levelInfo.xpToNext,
      lastXPGain: {
        amount: xpToAdd,
        action: action,
        description: XP_ACTIONS[action]?.description || 'Action personnalisée',
        timestamp: new Date().toISOString()
      }
    }
    
    // Sauvegarder dans Firebase
    await update(userRef, newData)
    
    // Ajouter à l'historique XP
    const historyRef = dbRef(getDatabase(), `Users/${userId}/gamification/xpHistory`)
    await push(historyRef, {
      amount: xpToAdd,
      action: action,
      description: XP_ACTIONS[action]?.description || 'Action personnalisée',
      timestamp: new Date().toISOString(),
      totalXPAfter: newTotalXP
    })
    
    return newData
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'XP:', error)
    throw error
  }
}

/**
 * Récupère les données complètes de gamification d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Données de gamification complètes
 */
export async function getUserGamificationData(userId) {
  try {
    const userRef = dbRef(getDatabase(), `Users/${userId}/gamification`)
    const snapshot = await get(userRef)
    const data = snapshot.val()
    
    if (!data) {
      return {
        maison: null,
        niveau: 1,
        xp: 0,
        totalXP: 0,
        xpToNext: 50,
        lastXPGain: null,
        dateSelection: null
      }
    }
    
    // Vérifier et corriger les niveaux si nécessaire
    if (data.totalXP) {
      const levelInfo = calculateLevel(data.totalXP)
      if (levelInfo.niveau !== data.niveau) {
        // Corriger automatiquement
        const correctedData = {
          ...data,
          niveau: levelInfo.niveau,
          xp: data.totalXP - levelInfo.xpRequired,
          xpToNext: levelInfo.xpToNext
        }
        await update(userRef, correctedData)
        return correctedData
      }
    }
    
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des données de gamification:', error)
    throw error
  }
}

/**
 * Initialise les données de gamification pour un nouvel utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} houseName - Nom de la maison
 * @returns {Promise<Object>} Données de gamification initiales
 */
export async function initializeUserGamification(userId, houseName) {
  try {
    const initialData = {
      maison: houseName.toLowerCase(),
      niveau: 1,
      xp: 0,
      totalXP: 0,
      xpToNext: 50,
      dateSelection: new Date().toISOString(),
      achievements: {},
      stats: {
        quizCompleted: 1,
        totalActions: 0,
        loginStreak: 0,
        lastLogin: new Date().toISOString()
      }
    }
    
    const userRef = dbRef(getDatabase(), `Users/${userId}/gamification`)
    await set(userRef, initialData)
    
    // Ajouter l'XP pour avoir terminé le quiz
    await addUserXP(userId, 'QUIZ_COMPLETE')
    
    return initialData
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la gamification:', error)
    throw error
  }
}

/**
 * Calcule et met à jour le streak de connexion d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} Nombre de jours de streak
 */
export async function updateLoginStreak(userId) {
  try {
    const userRef = dbRef(getDatabase(), `Users/${userId}/gamification`)
    const snapshot = await get(userRef)
    const data = snapshot.val()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayString = today.toISOString().split('T')[0]
    
    const lastLogin = data.stats?.lastLogin ? new Date(data.stats.lastLogin) : null
    let currentStreak = data.stats?.loginStreak || 0
    
    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0)
      const lastLoginString = lastLogin.toISOString().split('T')[0]
      
      if (lastLoginString === todayString) {
        // Déjà connecté aujourd'hui, pas de changement
        return currentStreak
      }
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayString = yesterday.toISOString().split('T')[0]
      
      if (lastLoginString === yesterdayString) {
        // Connexion hier, continuer le streak
        currentStreak += 1
      } else {
        // Streak cassé, recommencer
        currentStreak = 1
      }
    } else {
      // Première connexion
      currentStreak = 1
    }
    
    // Mettre à jour les stats
    await update(userRef, {
      'stats/loginStreak': currentStreak,
      'stats/lastLogin': new Date().toISOString(),
      'stats/totalLogins': (data.stats?.totalLogins || 0) + 1
    })
    
    // Ajouter XP pour la connexion
    await addUserXP(userId, 'LOGIN')
    
    // Bonus XP pour les streaks
    if (currentStreak === 3) {
      await addUserXP(userId, 'DAILY_STREAK_3')
    } else if (currentStreak === 7) {
      await addUserXP(userId, 'DAILY_STREAK_7')
    } else if (currentStreak === 30) {
      await addUserXP(userId, 'DAILY_STREAK_30')
    }
    
    return currentStreak
  } catch (error) {
    console.error('Erreur lors de la mise à jour du streak:', error)
    return 0
  }
}

/**
 * Récupère les statistiques complètes d'une maison avec classement des membres
 * @param {string} houseName - Nom de la maison
 * @returns {Promise<Object>} Statistiques complètes de la maison
 */
export async function getHouseDetailedStats(houseName) {
  try {
    const usersRef = dbRef(getDatabase(), 'Users')
    const snapshot = await get(usersRef)
    const users = snapshot.val() || {}
    
    const houseMembers = []
    let totalHouseXP = 0
    
    // Parcourir tous les utilisateurs pour trouver les membres de la maison
    Object.keys(users).forEach(userId => {
      const user = users[userId]
      const gamification = user.gamification
      
      if (gamification && gamification.maison === houseName.toLowerCase()) {
        const memberXP = gamification.totalXP || 0
        totalHouseXP += memberXP
        
        // Récupérer le nom depuis différentes sources possibles
        const displayName = user.displayName || user.UserName || user.nom || user.name || ''
        const email = user.email || user.Mail || ''
        
        // Construire le nom d'affichage
        let finalDisplayName = displayName
        if (!finalDisplayName && email) {
          finalDisplayName = email.split('@')[0]
        }
        if (!finalDisplayName) {
          finalDisplayName = `Utilisateur ${userId.slice(-4)}`
        }
        
        // Séparer en prénom et nom pour l'affichage
        const nameParts = finalDisplayName.split(' ')
        const firstName = nameParts[0] || finalDisplayName
        const lastName = nameParts.slice(1).join(' ') || ''

        houseMembers.push({
          userId: userId,
          prenom: firstName,
          nom: lastName,
          displayName: finalDisplayName,
          niveau: gamification.niveau || 1,
          xp: gamification.xp || 0,
          totalXP: memberXP,
          loginStreak: gamification.stats?.loginStreak || 0,
          dateSelection: gamification.dateSelection
        })
      }
    })
    
    // Trier les membres par XP total décroissant
    houseMembers.sort((a, b) => b.totalXP - a.totalXP)
    
    // Calculer le niveau de la maison
    const houseLevel = calculateHouseLevel(totalHouseXP)
    
    // Calculer les statistiques
    const averageXP = houseMembers.length > 0 ? Math.round(totalHouseXP / houseMembers.length) : 0
    const averageLevel = houseMembers.length > 0 ? 
      Math.round(houseMembers.reduce((sum, member) => sum + member.niveau, 0) / houseMembers.length * 10) / 10 : 0
    
    return {
      houseName: houseName,
      houseInfo: getHouseInfo(houseName),
      houseLevel: houseLevel,
      totalMembers: houseMembers.length,
      totalXP: totalHouseXP,
      averageXP: averageXP,
      averageLevel: averageLevel,
      members: houseMembers,
      topMembers: houseMembers.slice(0, 10), // Top 10
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des stats détaillées de la maison:', error)
    throw error
  }
}

/**
 * Récupère le classement global des maisons avec leurs niveaux
 * @returns {Promise<Object>} Classement des maisons
 */
export async function getHousesRanking() {
  try {
    const houses = ['harmonis', 'elaris', 'doloris', 'solencia']
    const housesRanking = []
    
    for (const houseName of houses) {
      const houseStats = await getHouseDetailedStats(houseName)
      housesRanking.push({
        name: houseName,
        displayName: houseStats.houseInfo.name,
        color: houseStats.houseInfo.color,
        motto: houseStats.houseInfo.motto,
        level: houseStats.houseLevel.niveau,
        levelName: houseStats.houseLevel.name,
        totalXP: houseStats.totalXP,
        totalMembers: houseStats.totalMembers,
        averageXP: houseStats.averageXP,
        averageLevel: houseStats.averageLevel,
        xpToNext: houseStats.houseLevel.xpToNext
      })
    }
    
    // Trier par niveau décroissant, puis par XP total décroissant
    housesRanking.sort((a, b) => {
      if (a.level !== b.level) {
        return b.level - a.level
      }
      return b.totalXP - a.totalXP
    })
    
    // Ajouter les positions
    housesRanking.forEach((house, index) => {
      house.position = index + 1
    })
    
    return {
      ranking: housesRanking,
      lastUpdated: new Date().toISOString(),
      totalUsers: housesRanking.reduce((sum, house) => sum + house.totalMembers, 0)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du classement des maisons:', error)
    throw error
  }
}

/**
 * Met à jour les statistiques globales des maisons avec les niveaux
 * @returns {Promise<Object>} Statistiques mises à jour
 */
export async function updateGlobalHouseStats() {
  try {
    const ranking = await getHousesRanking()
    const globalStatsRef = dbRef(getDatabase(), 'globalStats/houses')
    
    const statsToSave = {
      ranking: ranking.ranking,
      lastUpdated: ranking.lastUpdated,
      totalUsers: ranking.totalUsers
    }
    
    await set(globalStatsRef, statsToSave)
    return statsToSave
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques globales:', error)
    throw error
  }
}

/**
 * Fonction pour récupérer les statistiques complètes d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Statistiques de l'utilisateur
 */
export async function getUserGamificationStats(userId) {
  try {
    const userRef = dbRef(getDatabase(), `Users/${userId}`)
    const snapshot = await get(userRef)
    
    if (snapshot.exists()) {
      const userData = snapshot.val()
      const gamificationData = userData.gamification || {}
      
      // Calculer les jours depuis l'inscription
      const joinedAt = gamificationData.dateSelection || userData.createdAt || new Date().toISOString()
      
      return {
        displayName: userData.displayName || userData.nom || userData.prenom || 'Utilisateur',
        photoURL: userData.photoURL || null,
        email: userData.email || null,
        maison: gamificationData.maison || null,
        niveau: gamificationData.niveau || 1,
        xp: gamificationData.xp || 0,
        xpToNext: gamificationData.xpToNext || 100,
        streak: gamificationData.loginStreak || 0,
        streakMax: gamificationData.maxStreak || gamificationData.loginStreak || 0,
        joursActifs: gamificationData.joursActifs || 0,
        defisCompletes: gamificationData.defisCompletes || 0,
        pointsBonus: gamificationData.pointsBonus || 0,
        lastLogin: gamificationData.lastLogin || null,
        dateSelection: gamificationData.dateSelection || null,
        joinedAt: joinedAt,
        // Données utilisateur supplémentaires
        userId: userId,
        isActive: true
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération des stats utilisateur:', error)
    throw error
  }
}

export default {
  HES_HOUSES,
  LEVEL_CONFIG,
  XP_ACTIONS,
  HOUSE_LEVEL_CONFIG,
  getHouseInfo,
  getAllHouses,
  saveUserHouse,
  getUserHouse,
  userHasHouse,
  resetUserHouse,
  calculateHouseFromAnswers,
  getHouseStatistics,
  calculateLevel,
  calculateHouseLevel,
  addUserXP,
  getUserGamificationData,
  initializeUserGamification,
  updateLoginStreak,
  getHouseDetailedStats,
  getHousesRanking,
  updateGlobalHouseStats,
  getUserGamificationStats
}
