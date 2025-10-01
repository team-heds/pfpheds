/**
 * Service de gamification Supabase
 * Compatible avec CardNameProfile.vue pour afficher les maisons HES
 */

import { supabase } from '../supabase.js'

// Configuration des maisons HES (compatible avec hesHousesService)
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

// Configuration des niveaux (compatible avec hesHousesService)
export const LEVEL_CONFIG = {
  1: { name: 'Étudiant·e', xpRequired: 0, xpToNext: 50 },
  2: { name: 'Stagiaire', xpRequired: 50, xpToNext: 75 },
  3: { name: 'Assistant·e', xpRequired: 125, xpToNext: 100 },
  4: { name: 'Praticien·ne Junior', xpRequired: 225, xpToNext: 150 },
  5: { name: 'Soignant·e', xpRequired: 375, xpToNext: 200 }
}

// Cache simple pour éviter les requêtes répétées
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

class GamificationServiceSupabase {
  constructor() {
    this.supabase = supabase
    this.cache = cache
  }

  /**
   * Récupère les données de gamification d'un utilisateur depuis Supabase
   * Compatible avec CardNameProfile.vue
   */
  async getUserGamificationData(userId) {
    try {
      const cacheKey = `gamification_${userId}`
      const cached = this.cache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data
      }

      // Récupérer les données depuis gamification_data (table correcte)
      const { data: gamificationData, error } = await this.supabase
        .from('gamification_data')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur Supabase gamification:', error)
        return this.getDefaultGamificationData()
      }

      if (!gamificationData) {
        return this.getDefaultGamificationData()
      }

      // Récupérer les informations de la maison
      let houseInfo = null
      if (gamificationData.house_id) {
        const { data: houseData } = await this.supabase
          .from('houses')
          .select('*')
          .eq('id', gamificationData.house_id)
          .single()

        if (houseData) {
          houseInfo = {
            name: houseData.name,
            color: houseData.color,
            motto: houseData.motto,
            description: houseData.description
          }
        }
      }

      // Convertir les données Supabase au format attendu par CardNameProfile
      const formattedData = {
        maison: houseInfo?.name?.toLowerCase() || null,
        niveau: gamificationData.current_level || 1,
        xp: gamificationData.total_xp || 0,
        totalXP: gamificationData.total_xp || 0,
        xpToNext: this.calculateXPToNext(gamificationData.current_level || 1, gamificationData.total_xp || 0),
        lastXPGain: null,
        loginStreak: 0, // À implémenter si nécessaire
        badges: [],
        quests: [],
        challenges: [],
        houseInfo: houseInfo
      }

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: formattedData,
        timestamp: Date.now()
      })

      return formattedData

    } catch (error) {
      console.error('Erreur lors de la récupération des données de gamification:', error)
      return this.getDefaultGamificationData()
    }
  }

  /**
   * Calcule l'XP nécessaire pour le prochain niveau
   */
  calculateXPToNext(currentLevel, currentXP) {
    const nextLevel = currentLevel + 1
    if (nextLevel > 5) return 0 // Niveau max atteint
    
    const nextLevelConfig = LEVEL_CONFIG[nextLevel]
    if (!nextLevelConfig) return 0
    
    return Math.max(0, nextLevelConfig.xpRequired - currentXP)
  }

  /**
   * Données par défaut si aucune donnée trouvée
   */
  getDefaultGamificationData() {
    return {
      maison: null,
      niveau: 1,
      xp: 0,
      totalXP: 0,
      xpToNext: 50,
      lastXPGain: null,
      loginStreak: 0,
      badges: [],
      quests: [],
      challenges: [],
      houseInfo: null
    }
  }

  /**
   * Récupère les informations d'une maison par nom
   */
  getHouseInfo(houseName) {
    if (!houseName) return null
    return HES_HOUSES[houseName.toLowerCase()] || null
  }

  /**
   * Vérifie si un utilisateur a une maison valide
   */
  async userHasValidHouse(userId) {
    try {
      const gamificationData = await this.getUserGamificationData(userId)
      return gamificationData && gamificationData.maison !== null
    } catch (error) {
      console.error('Erreur lors de la vérification de la maison:', error)
      return false
    }
  }

  /**
   * Invalide le cache pour un utilisateur
   */
  invalidateCache(userId) {
    const cacheKey = `gamification_${userId}`
    this.cache.delete(cacheKey)
  }

  /**
   * Ajoute de l'XP à un utilisateur (placeholder pour compatibilité)
   */
  async addUserXP(userId, action, customXP = null) {
    try {
      // Pour l'instant, on ne fait que invalider le cache
      // L'ajout d'XP sera géré par le service principal
      this.invalidateCache(userId)
      
      console.log(`XP ajouté pour ${userId}: ${action} (+${customXP || 10} XP)`)
      
      // Retourner les nouvelles données
      return await this.getUserGamificationData(userId)
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'XP:', error)
      throw error
    }
  }
}

// Instance singleton
const gamificationServiceSupabase = new GamificationServiceSupabase()

export default gamificationServiceSupabase
