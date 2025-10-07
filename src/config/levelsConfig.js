/**
 * Configuration du système de niveaux HES - 20 niveaux
 * Basé sur le parcours de formation en physiothérapie
 */

export const LEVELS_CONFIG = {
  // Phase 1: Novice (1-5)
  1: {
    name: 'Étudiant·e Physio',
    phase: 'Novice',
    xpMin: 0,
    xpMax: 99,
    xpRequired: 100,
    description: 'Premier pas dans le monde de la physiothérapie',
    icon: 'pi-user',
    color: '#95a5a6',
    rewards: []
  },
  2: {
    name: 'Observateur·rice',
    phase: 'Novice',
    xpMin: 100,
    xpMax: 399,
    xpRequired: 300,
    description: 'Tu observes les techniques de rééducation',
    icon: 'pi-eye',
    color: '#95a5a6',
    rewards: []
  },
  3: {
    name: 'Apprenti·e Thérapeute',
    phase: 'Novice',
    xpMin: 400,
    xpMax: 899,
    xpRequired: 500,
    description: 'Tu apprends les mobilisations de base',
    icon: 'pi-book',
    color: '#95a5a6',
    rewards: ['unlock_forum_posts']
  },
  4: {
    name: 'Stagiaire Physio',
    phase: 'Novice',
    xpMin: 900,
    xpMax: 1599,
    xpRequired: 700,
    description: 'Tes premiers stages en cabinet et hôpital',
    icon: 'pi-briefcase',
    color: '#95a5a6',
    rewards: []
  },
  5: {
    name: 'Assistant·e Physio',
    phase: 'Novice',
    xpMin: 1600,
    xpMax: 2499,
    xpRequired: 900,
    description: 'PALIER 1 - Tu assistes dans les traitements',
    icon: 'pi-users',
    color: '#3498db',
    isPalier: true,
    palierBonus: 500,
    rewards: [
      'badge_assistant',
      'house_points_500',
      'unlock_discussions'
    ]
  },

  // Phase 2: Intermédiaire (6-10)
  6: {
    name: 'Physiothérapeute Junior',
    phase: 'Intermédiaire',
    xpMin: 2500,
    xpMax: 3599,
    xpRequired: 1100,
    description: 'Tu traites tes premiers patients en autonomie',
    icon: 'pi-id-card',
    color: '#2ecc71',
    rewards: []
  },
  7: {
    name: 'Thérapeute Confirmé·e',
    phase: 'Intermédiaire',
    xpMin: 3600,
    xpMax: 4899,
    xpRequired: 1300,
    description: 'Tu gères des prises en charge complètes',
    icon: 'pi-heart',
    color: '#2ecc71',
    rewards: []
  },
  8: {
    name: 'Physiothérapeute Diplômé·e',
    phase: 'Intermédiaire',
    xpMin: 4900,
    xpMax: 6399,
    xpRequired: 1500,
    description: 'Ton diplôme HES de physiothérapie !',
    icon: 'pi-check-circle',
    color: '#2ecc71',
    rewards: ['badge_diplome', 'unlock_quizzes']
  },
  9: {
    name: 'Clinicien·ne Physio',
    phase: 'Intermédiaire',
    xpMin: 6400,
    xpMax: 8099,
    xpRequired: 1700,
    description: 'Expertise en raisonnement clinique',
    icon: 'pi-chart-line',
    color: '#2ecc71',
    rewards: []
  },
  10: {
    name: 'Spécialiste',
    phase: 'Intermédiaire',
    xpMin: 8100,
    xpMax: 9999,
    xpRequired: 1900,
    description: 'PALIER 2 - Spécialisation (sport, neuro, pédiatrie...)',
    icon: 'pi-star',
    color: '#9b59b6',
    isPalier: true,
    palierBonus: 1000,
    rewards: [
      'badge_specialiste',
      'house_points_1000',
      'unlock_challenges',
      'avatar_special'
    ]
  },

  // Phase 3: Avancé (11-15)
  11: {
    name: 'Expert·e Thérapie Manuelle',
    phase: 'Avancé',
    xpMin: 10000,
    xpMax: 12099,
    xpRequired: 2100,
    description: 'Maîtrise avancée des techniques manuelles',
    icon: 'pi-shield',
    color: '#e67e22',
    rewards: []
  },
  12: {
    name: 'Physiothérapeute Référent·e',
    phase: 'Avancé',
    xpMin: 12100,
    xpMax: 14399,
    xpRequired: 2300,
    description: 'On te consulte pour les cas complexes',
    icon: 'pi-compass',
    color: '#e67e22',
    rewards: ['unlock_mentoring']
  },
  13: {
    name: 'Formateur·rice Clinique',
    phase: 'Avancé',
    xpMin: 14400,
    xpMax: 16899,
    xpRequired: 2500,
    description: 'Tu formes les futurs physiothérapeutes',
    icon: 'pi-graduation-cap',
    color: '#e67e22',
    rewards: ['unlock_teaching']
  },
  14: {
    name: 'Responsable Rééducation',
    phase: 'Avancé',
    xpMin: 16900,
    xpMax: 19599,
    xpRequired: 2700,
    description: 'Tu coordonnes les équipes de physiothérapie',
    icon: 'pi-sitemap',
    color: '#e67e22',
    rewards: []
  },
  15: {
    name: 'Cadre de Santé Physio',
    phase: 'Avancé',
    xpMin: 19600,
    xpMax: 22499,
    xpRequired: 2900,
    description: 'PALIER 3 - Leadership en physiothérapie',
    icon: 'pi-crown',
    color: '#f39c12',
    isPalier: true,
    palierBonus: 1500,
    rewards: [
      'badge_manager',
      'house_points_1500',
      'unlock_quests_creation',
      'custom_title',
      'name_color'
    ]
  },

  // Phase 4: Maître (16-20)
  16: {
    name: 'Maître Physiothérapeute',
    phase: 'Maître',
    xpMin: 22500,
    xpMax: 25599,
    xpRequired: 3100,
    description: 'Excellence reconnue en physiothérapie',
    icon: 'pi-star-fill',
    color: '#e74c3c',
    rewards: []
  },
  17: {
    name: 'Consultant·e Expert·e',
    phase: 'Maître',
    xpMin: 25600,
    xpMax: 28899,
    xpRequired: 3300,
    description: 'Expertise recherchée en rééducation',
    icon: 'pi-briefcase',
    color: '#e74c3c',
    rewards: ['unlock_consulting']
  },
  18: {
    name: 'Chercheur·se en Physiothérapie',
    phase: 'Maître',
    xpMin: 28900,
    xpMax: 32399,
    xpRequired: 3500,
    description: 'Tu innoves dans les pratiques de rééducation',
    icon: 'pi-search',
    color: '#e74c3c',
    rewards: ['unlock_research']
  },
  19: {
    name: 'Professeur·e HES Physio',
    phase: 'Maître',
    xpMin: 32400,
    xpMax: 36099,
    xpRequired: 3700,
    description: 'Tu enseignes à la Haute École de Santé',
    icon: 'pi-book',
    color: '#e74c3c',
    rewards: ['unlock_courses']
  },
  20: {
    name: 'Légende Physiothérapie HES',
    phase: 'Maître',
    xpMin: 36100,
    xpMax: Infinity,
    xpRequired: 3900,
    description: 'PALIER 4 - Sommet de la physiothérapie HES !',
    icon: 'pi-trophy',
    color: '#8e44ad',
    isPalier: true,
    palierBonus: 3000,
    isMaxLevel: true,
    rewards: [
      'badge_legende',
      'house_points_3000',
      'all_privileges',
      'hall_of_fame',
      'mentor_badge_permanent',
      'profile_skin_exclusive',
      'animated_badge'
    ]
  }
}

/**
 * Bonus spécifiques par maison et par palier
 */
export const HOUSE_PALIER_BONUSES = {
  Harmonis: {
    1: {
      name: 'Équilibre Parfait',
      description: 'Méditation quotidienne débloquée',
      bonus: 'unlock_daily_meditation'
    },
    2: {
      name: 'Bonus Bien-être',
      description: '+10% XP sur activités de bien-être',
      bonus: 'xp_wellness_10'
    },
    3: {
      name: 'Sage d\'Harmonis',
      description: 'Deviens mentor automatique',
      bonus: 'auto_mentor'
    },
    4: {
      name: 'Gardien de l\'Harmonie',
      description: 'Avatar exclusif Harmonis',
      bonus: 'exclusive_avatar'
    }
  },
  Elaris: {
    1: {
      name: 'Lumière du Savoir',
      description: 'Quiz bonus débloqués',
      bonus: 'unlock_bonus_quizzes'
    },
    2: {
      name: 'Bonus Apprentissage',
      description: '+10% XP sur quiz et cours',
      bonus: 'xp_learning_10'
    },
    3: {
      name: 'Porteur de Lumière',
      description: 'Créer des quiz pour les autres',
      bonus: 'create_quizzes'
    },
    4: {
      name: 'Phare d\'Elaris',
      description: 'Badge animé spécial',
      bonus: 'animated_badge_special'
    }
  },
  Doloris: {
    1: {
      name: 'Cœur Compatissant',
      description: 'Accès aux forums d\'entraide',
      bonus: 'unlock_support_forums'
    },
    2: {
      name: 'Bonus Entraide',
      description: '+10% XP sur entraide communautaire',
      bonus: 'xp_community_10'
    },
    3: {
      name: 'Empathie Incarnée',
      description: 'Support prioritaire aux nouveaux',
      bonus: 'priority_support'
    },
    4: {
      name: 'Ange de Doloris',
      description: 'Effets visuels exclusifs',
      bonus: 'exclusive_vfx'
    }
  },
  Solencia: {
    1: {
      name: 'Apaisement',
      description: 'Espaces de réflexion débloqués',
      bonus: 'unlock_reflection'
    },
    2: {
      name: 'Bonus Réflexion',
      description: '+10% XP sur activités de réflexion',
      bonus: 'xp_reflection_10'
    },
    3: {
      name: 'Gardien de la Paix',
      description: 'Rôle de modérateur',
      bonus: 'moderator_role'
    },
    4: {
      name: 'Étoile de Solencia',
      description: 'Thème de profil exclusif',
      bonus: 'exclusive_theme'
    }
  }
}

/**
 * Calcule le niveau depuis l'XP total
 */
export function getLevelFromXP(totalXP) {
  // Formule: niveau = sqrt(XP / 100)
  const level = Math.floor(Math.sqrt(totalXP / 100))
  return Math.min(Math.max(level, 1), 20) // Entre 1 et 20
}

/**
 * Calcule l'XP total nécessaire pour atteindre un niveau
 */
export function getXPForLevel(level) {
  return level * level * 100
}

/**
 * Calcule l'XP restant pour le niveau suivant
 */
export function getXPToNextLevel(currentLevel, currentXP) {
  if (currentLevel >= 20) return 0
  const nextLevelXP = getXPForLevel(currentLevel + 1)
  return Math.max(0, nextLevelXP - currentXP)
}

/**
 * Calcule le pourcentage de progression vers le niveau suivant
 */
export function getLevelProgress(currentLevel, currentXP) {
  if (currentLevel >= 20) return 100
  
  const currentLevelXP = getXPForLevel(currentLevel)
  const nextLevelXP = getXPForLevel(currentLevel + 1)
  const xpInCurrentLevel = currentXP - currentLevelXP
  const xpNeededForLevel = nextLevelXP - currentLevelXP
  
  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100))
}

/**
 * Récupère les informations d'un niveau
 */
export function getLevelInfo(level) {
  return LEVELS_CONFIG[level] || LEVELS_CONFIG[1]
}

/**
 * Récupère les bonus de maison pour un palier
 */
export function getHousePalierBonus(houseName, palierLevel) {
  const house = HOUSE_PALIER_BONUSES[houseName]
  if (!house) return null
  
  const palierNumber = palierLevel === 5 ? 1 : palierLevel === 10 ? 2 : palierLevel === 15 ? 3 : palierLevel === 20 ? 4 : null
  
  return house[palierNumber] || null
}

/**
 * Vérifie si un niveau est un palier
 */
export function isPalier(level) {
  return [5, 10, 15, 20].includes(level)
}

/**
 * Liste tous les paliers
 */
export function getAllPaliers() {
  return [5, 10, 15, 20].map(level => ({
    level,
    ...LEVELS_CONFIG[level]
  }))
}

/**
 * Calcule les récompenses pour passage de niveau
 */
export function getLevelRewards(level) {
  const levelInfo = getLevelInfo(level)
  const rewards = [...levelInfo.rewards]
  
  if (levelInfo.isPalier) {
    rewards.push(`house_points_${levelInfo.palierBonus}`)
  }
  
  return rewards
}

export default {
  LEVELS_CONFIG,
  HOUSE_PALIER_BONUSES,
  getLevelFromXP,
  getXPForLevel,
  getXPToNextLevel,
  getLevelProgress,
  getLevelInfo,
  getHousePalierBonus,
  isPalier,
  getAllPaliers,
  getLevelRewards
}
