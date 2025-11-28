/**
 * Service d'administration pour la gamification
 * Fournit les statistiques et données d'administration pour le système de gamification HEdS
 */

import { ref as dbRef, get } from 'firebase/database';
import { db, auth } from '../../firebase.js';

/**
 * Récupère les statistiques complètes de gamification pour l'administration
 * @returns {Promise<Object>} Statistiques de gamification
 */
export const getGamificationStats = async () => {
  try {
    console.log('[GamificationAdminService] Chargement des statistiques gamification...');

    // Récupérer les données en parallèle
    const [usersSnapshot, challengesSnapshot, questsSnapshot, badgesSnapshot, housesSnapshot, logsSnapshot] = await Promise.all([
      get(dbRef(db, 'users')).catch(() => ({ val: () => ({}) })),
      get(dbRef(db, 'gamification/challenges')).catch(() => ({ val: () => ({}) })),
      get(dbRef(db, 'gamification/quests')).catch(() => ({ val: () => ({}) })),
      get(dbRef(db, 'gamification/badges')).catch(() => ({ val: () => ({}) })),
      get(dbRef(db, 'gamification/houses')).catch(() => ({ val: () => ({}) })),
      get(dbRef(db, 'gamification/logs')).catch(() => ({ val: () => ({}) })) // Sans orderByChild pour éviter l'erreur d'index
    ]);

    // Traitement des utilisateurs
    const users = usersSnapshot.val() || {};
    const totalUsers = Object.keys(users).length;
    
    // Compter les utilisateurs avec gamification activée
    const gamificationUsers = Object.values(users).filter(user => 
      user.gamification && user.gamification.maison
    ).length;

    // Traitement des défis
    const challenges = challengesSnapshot.val() || {};
    const activeChallenges = Object.values(challenges).filter(challenge => 
      challenge.status === 'active'
    ).length;

    // Traitement des quêtes
    const quests = questsSnapshot.val() || {};
    const completedQuests = Object.values(quests).filter(quest => 
      quest.status === 'completed'
    ).length;

    // Traitement des badges
    const badges = badgesSnapshot.val() || {};
    const totalBadges = Object.keys(badges).length;

    // Traitement des maisons
    const houses = housesSnapshot.val() || {};
    const housesStats = {};
    
    // Calculer les statistiques par maison
    Object.keys(houses).forEach(houseId => {
      const house = houses[houseId];
      const members = house.members || {};
      housesStats[houseId] = {
        name: house.name || houseId,
        memberCount: Object.keys(members).length,
        totalXP: Object.values(members).reduce((sum, member) => sum + (member.xp || 0), 0),
        averageLevel: Object.values(members).length > 0 
          ? Object.values(members).reduce((sum, member) => sum + (member.niveau || 1), 0) / Object.values(members).length
          : 0
      };
    });

    // Traitement des logs (récupérer les 10 plus récents manuellement)
    const logs = logsSnapshot.val() || {};
    const recentLogs = Object.entries(logs)
      .map(([id, log]) => ({ id, ...log }))
      .filter(log => log.timestamp) // Filtrer ceux qui ont un timestamp
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10);

    const stats = {
      totalUsers,
      gamificationUsers,
      activeChallenges,
      completedQuests,
      totalBadges,
      houses: housesStats,
      recentLogs,
      lastUpdated: new Date().toISOString()
    };

    console.log('[GamificationAdminService] Statistiques chargées:', stats);
    return stats;

  } catch (error) {
    console.error('[GamificationAdminService] Erreur lors du chargement des statistiques:', error);
    
    // Retourner des données par défaut en cas d'erreur
    return {
      totalUsers: 0,
      gamificationUsers: 0,
      activeChallenges: 0,
      completedQuests: 0,
      totalBadges: 0,
      houses: {},
      recentLogs: [],
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Récupère les statistiques détaillées d'une maison spécifique
 * @param {string} houseId - ID de la maison
 * @returns {Promise<Object>} Statistiques de la maison
 */
export const getHouseStats = async (houseId) => {
  try {
    const houseSnapshot = await get(dbRef(db, `gamification/houses/${houseId}`));
    const house = houseSnapshot.val();
    
    if (!house) {
      throw new Error(`Maison ${houseId} non trouvée`);
    }

    const members = house.members || {};
    const memberIds = Object.keys(members);
    
    // Récupérer les détails des membres
    const memberDetails = await Promise.all(
      memberIds.map(async (memberId) => {
        const userSnapshot = await get(dbRef(db, `users/${memberId}`));
        const user = userSnapshot.val();
        return {
          id: memberId,
          name: user?.displayName || user?.email || 'Utilisateur inconnu',
          xp: members[memberId].xp || 0,
          niveau: members[memberId].niveau || 1,
          joinedAt: members[memberId].joinedAt || null
        };
      })
    );

    return {
      id: houseId,
      name: house.name,
      description: house.description,
      color: house.color,
      memberCount: memberIds.length,
      members: memberDetails,
      totalXP: memberDetails.reduce((sum, member) => sum + member.xp, 0),
      averageLevel: memberDetails.length > 0 
        ? memberDetails.reduce((sum, member) => sum + member.niveau, 0) / memberDetails.length
        : 0,
      topMembers: memberDetails
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 5)
    };

  } catch (error) {
    console.error(`[GamificationAdminService] Erreur lors du chargement des stats de la maison ${houseId}:`, error);
    throw error;
  }
};

/**
 * Récupère les logs d'activité gamification récents
 * @param {number} limit - Nombre de logs à récupérer (défaut: 20)
 * @returns {Promise<Array>} Liste des logs récents
 */
export const getRecentLogs = async (limit = 20) => {
  try {
    const logsSnapshot = await get(
      query(dbRef(db, 'gamification/logs'), orderByChild('timestamp'), limitToLast(limit))
    );
    
    const logs = logsSnapshot.val() || {};
    return Object.entries(logs)
      .map(([id, log]) => ({ id, ...log }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  } catch (error) {
    console.error('[GamificationAdminService] Erreur lors du chargement des logs:', error);
    return [];
  }
};

/**
 * Récupère les statistiques globales du système de gamification
 * @returns {Promise<Object>} Statistiques globales
 */
export const getGlobalStats = async () => {
  try {
    const stats = await getGamificationStats();
    
    return {
      overview: {
        totalUsers: stats.totalUsers,
        activeUsers: stats.gamificationUsers,
        engagementRate: stats.totalUsers > 0 ? (stats.gamificationUsers / stats.totalUsers * 100).toFixed(1) : 0
      },
      content: {
        activeChallenges: stats.activeChallenges,
        completedQuests: stats.completedQuests,
        totalBadges: stats.totalBadges
      },
      houses: stats.houses,
      activity: {
        recentActions: stats.recentLogs.length,
        lastActivity: stats.recentLogs[0]?.timestamp || null
      }
    };

  } catch (error) {
    console.error('[GamificationAdminService] Erreur lors du chargement des stats globales:', error);
    throw error;
  }
};

// Export par défaut
const gamificationAdminService = {
  getGamificationStats,
  getHouseStats,
  getRecentLogs,
  getGlobalStats
};

export default gamificationAdminService;
