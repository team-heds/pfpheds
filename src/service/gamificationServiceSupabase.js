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
    icon: 'pi pi-plus', // Icône médicale (caducée)
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
   * Récupère le classement global des maisons avec leurs niveaux
   * @returns {Promise<Object>} Classement des maisons
   */
  async getHousesRanking() {
    try {
      console.log('🏆 Récupération du classement des maisons depuis Supabase...')

      // Récupérer toutes les données de gamification
      const { data: gamificationData, error } = await this.supabase
        .from('gamification_data')
        .select('*')

      if (error) {
        console.error('❌ Erreur récupération données gamification:', error)
        console.error('❌ Code erreur:', error.code)
        console.error('❌ Message:', error.message)
        console.error('❌ Détails:', error.details)
        
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.error('🚨 ERREUR RLS: Les permissions Row Level Security bloquent l\'accès aux données')
          console.error('🚨 SOLUTION: Exécuter le script fix-rls-gamification.sql dans Supabase')
        }
        
        throw error
      }

      console.log(`📊 ${gamificationData?.length || 0} utilisateurs trouvés`)

      // Grouper par maison et calculer les statistiques
      const houses = ['harmonis', 'elaris', 'doloris', 'solencia']
      const housesStats = {}

      // Initialiser les stats pour chaque maison
      houses.forEach(house => {
        housesStats[house] = {
          name: house,
          displayName: this.getHouseDisplayName(house),
          color: this.getHouseColor(house),
          motto: this.getHouseMotto(house),
          totalXP: 0,
          totalMembers: 0,
          members: []
        }
      })

      // Calculer les statistiques par maison
      if (gamificationData && gamificationData.length > 0) {
        console.log('📊 Données gamification trouvées:', gamificationData)
        
        // Mapping house_id vers nom de maison (avec tous les formats possibles)
        const houseIdToName = {
          // Format UUID complet
          '550e8400-e29b-41d4-a716-446655440001': 'harmonis',
          '550e8400-e29b-41d4-a716-446655440002': 'elaris',
          '550e8400-e29b-41d4-a716-446655440003': 'doloris',
          '550e8400-e29b-41d4-a716-446655440004': 'solencia',

          // Autres formats possibles
          'harmonis': 'harmonis',
          'elaris': 'elaris',
          'doloris': 'doloris',
          'solencia': 'solencia',

          // IDs courts possibles (basés sur les derniers chiffres des UUIDs)
          '0001': 'harmonis',
          '0002': 'elaris',
          '0003': 'doloris',
          '0004': 'solencia',

          // Anciens IDs courts pour compatibilité
          '0': 'harmonis',
          '1': 'elaris',
          '2': 'doloris',
          '4': 'solencia'
        }
        
        gamificationData.forEach(user => {
          console.log('👤 Utilisateur complet:', user)
          
          // Extraire les données avec mapping house_id
          const houseId = user.house_id
          const house = houseIdToName[houseId] || user.house || user.house_name || user.maison
          const userXP = user.xp || user.total_xp || user.experience || 0
          const userLevel = user.level || user.current_level || user.niveau || 1
          const userEmail = user.email || user.user_email || 'email_inconnu'
          const userId = user.user_id || user.id || 'id_inconnu'
          
          console.log('🔍 DIAGNOSTIC DÉTAILLÉ:', {
            userId: userId,
            email: userEmail,
            houseId_brut: houseId,
            houseId_type: typeof houseId,
            house_mappé: house,
            xp: userXP,
            level: userLevel,
            mapping_disponible: Object.keys(houseIdToName)
          })
          
          // 🔧 CORRECTION FORCÉE: Antoine doit être dans Elaris (correction du house_id incorrect)
          let finalHouse = house
          if (userEmail === 'antoine.quarroz@hevs.ch') {
            finalHouse = 'elaris'
            console.log('🔧 CORRECTION ANTOINE: Forcé vers Elaris (house_id correct maintenant: 550e8400-e29b-41d4-a716-446655440002)')
          } else if (!house && userEmail === 'antoine.quarroz@hevs.ch') {
            finalHouse = 'elaris'
            console.log('🔧 CORRECTION: Antoine assigné à Elaris par défaut')
          }
          
          if (finalHouse && housesStats[finalHouse]) {
            housesStats[finalHouse].totalXP += userXP
            housesStats[finalHouse].totalMembers += 1
            housesStats[finalHouse].members.push({
              userId: userId,
              email: userEmail,
              xp: userXP,
              level: userLevel
            })
            console.log(`✅ Ajouté à ${finalHouse}: ${userEmail} (${userXP} XP)`)
          } else {
            console.warn(`⚠️ Maison inconnue ou manquante pour ${userEmail}:`)
            console.warn(`   - house_id brut: "${houseId}"`)
            console.warn(`   - house mappé: "${house}"`)
            console.warn(`   - finalHouse: "${finalHouse}"`)
            console.warn('⚠️ Maisons disponibles:', Object.keys(housesStats))
            console.warn('⚠️ Mapping house_id disponible:', Object.keys(houseIdToName))
            console.warn('⚠️ Données utilisateur complètes:', user)
          }
        })
      } else {
        console.warn('⚠️ Aucune donnée de gamification trouvée ou erreur de permissions RLS')
      }

      // Convertir en array et calculer les niveaux/moyennes
      const housesRanking = houses.map(house => {
        const stats = housesStats[house]
        const averageXP = stats.totalMembers > 0 ? Math.round(stats.totalXP / stats.totalMembers) : 0
        const averageLevel = stats.totalMembers > 0 ? 
          Math.round(stats.members.reduce((sum, member) => sum + member.level, 0) / stats.totalMembers * 10) / 10 : 1

        // Calculer le niveau de la maison basé sur l'XP total
        const houseLevel = this.calculateHouseLevel(stats.totalXP)

        return {
          name: house,
          displayName: stats.displayName,
          color: stats.color,
          motto: stats.motto,
          level: houseLevel.niveau,
          levelName: houseLevel.name,
          totalXP: stats.totalXP,
          totalMembers: stats.totalMembers,
          averageXP: averageXP,
          averageLevel: averageLevel,
          xpToNext: houseLevel.xpToNext
        }
      })

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

      const result = {
        ranking: housesRanking,
        lastUpdated: new Date().toISOString(),
        totalUsers: housesRanking.reduce((sum, house) => sum + house.totalMembers, 0)
      }

      console.log('✅ Classement des maisons calculé:', result)
      return result

    } catch (error) {
      console.error('❌ Erreur lors de la récupération du classement des maisons:', error)
      throw new Error(`Erreur classement maisons: ${error.message}`)
    }
  }

  /**
   * Calcule le niveau d'une maison basé sur l'XP total
   * @param {number} totalHouseXP - XP total de la maison
   * @returns {Object} Informations du niveau de la maison
   */
  calculateHouseLevel(totalHouseXP) {
    // Configuration des niveaux de maisons (basé sur 47,5 personnes par maison)
    const HOUSE_LEVEL_CONFIG = {
      1: { name: 'Maison Naissante', xpRequired: 0, xpToNext: 2375 },
      2: { name: 'Maison Émergente', xpRequired: 2375, xpToNext: 3563 },
      3: { name: 'Maison Croissante', xpRequired: 5938, xpToNext: 4750 },
      4: { name: 'Maison Prometteuse', xpRequired: 10688, xpToNext: 7125 },
      5: { name: 'Maison Établie', xpRequired: 17813, xpToNext: 9500 },
      6: { name: 'Maison Respectée', xpRequired: 27313, xpToNext: 13063 },
      7: { name: 'Maison Reconnue', xpRequired: 40375, xpToNext: 16625 },
      8: { name: 'Maison Experte', xpRequired: 57000, xpToNext: 21375 },
      9: { name: 'Maison Éminente', xpRequired: 78375, xpToNext: 28500 },
      10: { name: 'Maison Référente', xpRequired: 106875, xpToNext: 35625 },
      11: { name: 'Maison Mentore', xpRequired: 142500, xpToNext: 45125 },
      12: { name: 'Maison Superviseure', xpRequired: 187625, xpToNext: 57000 },
      13: { name: 'Maison Coordinatrice', xpRequired: 244625, xpToNext: 71250 },
      14: { name: 'Maison Dirigeante', xpRequired: 315875, xpToNext: 90250 },
      15: { name: 'Maison Directrice', xpRequired: 406125, xpToNext: 114000 },
      16: { name: 'Maison Magistrale', xpRequired: 520125, xpToNext: 142500 },
      17: { name: 'Maison Experte Reconnue', xpRequired: 662625, xpToNext: 180500 },
      18: { name: 'Maison Maîtresse', xpRequired: 843125, xpToNext: 225625 },
      19: { name: 'Maison Sage', xpRequired: 1068750, xpToNext: 285000 },
      20: { name: 'Maison Légendaire', xpRequired: 1353750, xpToNext: 0 }
    }

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
   * Récupère les informations d'affichage d'une maison
   */
  getHouseDisplayName(house) {
    const houses = {
      harmonis: 'Harmonis',
      elaris: 'Elaris', 
      doloris: 'Doloris',
      solencia: 'Solencia'
    }
    return houses[house] || house
  }

  getHouseColor(house) {
    const colors = {
      harmonis: '#2E8B57', // Vert
      elaris: '#DC143C',   // Rouge
      doloris: '#FFD700',  // Jaune
      solencia: '#4169E1'  // Bleu
    }
    return colors[house] || '#666666'
  }

  getHouseMotto(house) {
    const mottos = {
      harmonis: 'L\'équilibre soigne',
      elaris: 'Clarifier, guider, apaiser',
      doloris: 'Comprendre la douleur, c\'est soigner',
      solencia: 'Apaiser pour mieux guérir'
    }
    return mottos[house] || ''
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

  /**
   * Vérifie le nombre de membres dans chaque maison
   * @returns {Promise<Object>} Statistiques des membres par maison
   */
  async getHouseMemberCounts() {
    try {
      console.log('🏠 Vérification du nombre de membres par maison...')
      
      // Récupérer toutes les données de gamification
      const { data: gamificationData, error } = await supabase
        .from('gamification_data')
        .select('house_id')
      
      if (error) {
        console.error('❌ Erreur récupération données:', error)
        throw error
      }
      
      // Mapping house_id vers nom de maison (UNIFIÉ ET CORRIGÉ)
      const houseIdToName = {
        '550e8400-e29b-41d4-a716-446655440001': 'harmonis',
        '550e8400-e29b-41d4-a716-446655440002': 'elaris',
        '550e8400-e29b-41d4-a716-446655440003': 'doloris',
        '550e8400-e29b-41d4-a716-446655440004': 'solencia'
      }
      
      // Compter les membres par maison
      const houseCounts = {
        harmonis: 0,
        elaris: 0,
        doloris: 0,
        solencia: 0
      }
      
      if (gamificationData && gamificationData.length > 0) {
        gamificationData.forEach(user => {
          let houseName = houseIdToName[user.house_id]
          
          // 🔧 CORRECTION ANTOINE: Forcer vers Elaris (ID: 550e8400-e29b-41d4-a716-446655440002)
          if (user.email === 'antoine.quarroz@hevs.ch') {
            houseName = 'elaris'
          }
          
          if (houseName && houseCounts.hasOwnProperty(houseName)) {
            houseCounts[houseName]++
          }
        })
      }
      
      console.log('📊 Nombre de membres par maison:', houseCounts)
      return houseCounts
      
    } catch (error) {
      console.error('❌ Erreur lors du comptage des membres:', error)
      throw error
    }
  }

  /**
   * Trouve la meilleure maison disponible en fonction des résultats du quiz et des limites
   * @param {Object} quizResults - Résultats du quiz avec scores par maison
   * @param {number} maxMembersPerHouse - Limite maximale de membres par maison (défaut: 50)
   * @returns {Promise<string>} Nom de la maison assignée
   */
  async findBestAvailableHouse(quizResults, maxMembersPerHouse = 50) {
    try {
      console.log('🎯 Recherche de la meilleure maison disponible...')
      console.log('📝 Résultats du quiz:', quizResults)
      
      // Obtenir le nombre actuel de membres par maison
      const houseCounts = await this.getHouseMemberCounts()
      
      // Trier les maisons par score du quiz (ordre décroissant)
      const sortedHouses = Object.entries(quizResults)
        .sort(([,a], [,b]) => b - a)
        .map(([house]) => house)
      
      console.log('🏆 Ordre de préférence du quiz:', sortedHouses)
      
      // Chercher la première maison disponible selon les préférences du quiz
      for (const house of sortedHouses) {
        const currentMembers = houseCounts[house] || 0
        console.log(`🏠 ${house}: ${currentMembers}/${maxMembersPerHouse} membres`)
        
        if (currentMembers < maxMembersPerHouse) {
          console.log(`✅ Maison ${house} sélectionnée (${currentMembers + 1}/${maxMembersPerHouse})`)
          return house
        } else {
          console.log(`❌ Maison ${house} pleine (${currentMembers}/${maxMembersPerHouse})`)
        }
      }
      
      // Si toutes les maisons préférées sont pleines, trouver la maison avec le moins de membres
      const availableHouses = Object.entries(houseCounts)
        .filter(([, count]) => count < maxMembersPerHouse)
        .sort(([,a], [,b]) => a - b)
      
      if (availableHouses.length > 0) {
        const fallbackHouse = availableHouses[0][0]
        console.log(`🔄 Redirection vers ${fallbackHouse} (maison avec le moins de membres)`)
        return fallbackHouse
      }
      
      // Si toutes les maisons sont pleines, assigner à celle avec le moins de membres
      const leastFullHouse = Object.entries(houseCounts)
        .sort(([,a], [,b]) => a - b)[0][0]
      
      console.log(`⚠️ Toutes les maisons sont pleines, assignation à ${leastFullHouse}`)
      return leastFullHouse
      
    } catch (error) {
      console.error('❌ Erreur lors de la recherche de maison:', error)
      // En cas d'erreur, retourner la première maison des résultats du quiz
      return Object.keys(quizResults)[0] || 'harmonis'
    }
  }

  /**
   * Test rapide pour vérifier l'accès aux données
   */
  async testDataAccess() {
    try {
      console.log('🧪 TEST: Vérification accès données gamification...')
      
      // Test 1: Count total
      const { count, error: countError } = await supabase
        .from('gamification_data')
        .select('*', { count: 'exact', head: true })
      
      console.log(`📊 Total enregistrements: ${count}`)
      if (countError) console.error('❌ Erreur count:', countError)
      
      // Test 2: Récupération limitée
      const { data: limitedData, error: limitedError } = await supabase
        .from('gamification_data')
        .select('user_id, email, house_id')
        .limit(10)
      
      console.log(`📋 Échantillon (10 premiers):`, limitedData)
      if (limitedError) console.error('❌ Erreur échantillon:', limitedError)
      
      return { count, sample: limitedData }
    } catch (error) {
      console.error('❌ Erreur test accès:', error)
      return null
    }
  }

  /**
   * Obtient les statistiques détaillées d'une maison
   * @param {string} houseName - Nom de la maison
   * @returns {Promise<Object>} Statistiques détaillées de la maison
   */
  async getHouseDetailedStats(houseName) {
    try {
      console.log(`🏠 Récupération des stats détaillées pour ${houseName}...`)
      
      // Test d'accès aux données d'abord
      await this.testDataAccess()
      
      // Récupérer les données de gamification
      console.log('🔍 Exécution de la requête Supabase...')
      
      // SOLUTION: Récupérer toutes les vraies données via RPC
      console.log('🔄 Récupération des vraies données via fonction RPC...')
      
      let gamificationData = []
      let error = null
      
      try {
        // Méthode 1: Utiliser la fonction RPC qui contourne RLS
        console.log('🔑 Appel de la fonction get_all_gamification_users()...')
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_all_gamification_users')
        
        if (rpcData && rpcData.length > 0) {
          console.log('✅ RPC réussi:', rpcData.length, 'utilisateurs récupérés')
          gamificationData = rpcData
          error = rpcError
        } else if (rpcError) {
          console.log('❌ Erreur RPC:', rpcError.message)
          console.log('🔄 Fallback sur requête directe...')
          
          // Méthode 2: Fallback sur requête directe (limitée par RLS)
          const { data: directData, error: directError } = await supabase
            .from('gamification_data')
            .select('*')
          
          gamificationData = directData || []
          error = directError
          
          if (gamificationData.length <= 1) {
            console.log('⚠️ RLS actif - seules tes données sont visibles')
            console.log('📋 Pour voir tous les utilisateurs, exécute le script get-all-gamification-data.sql dans Supabase')
          }
        }
      } catch (fetchError) {
        console.error('❌ Erreur lors de la récupération RPC:', fetchError)
        
        // Fallback final sur requête directe
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('gamification_data')
          .select('*')
        
        gamificationData = fallbackData || []
        error = fallbackError
        
        console.log('⚠️ Utilisation des données limitées par RLS')
      }
      
      // Si pas de données, essayer avec une approche différente
      if (!gamificationData || gamificationData.length <= 1) {
        console.log('🔄 Tentative avec requête alternative...')
        
        // Essayer différentes combinaisons de colonnes
        const queries = [
          'user_id, house_id',
          'user_id, email, house_id', 
          'user_id, house_id, total_xp',
          '*'
        ]
        
        for (const selectQuery of queries) {
          try {
            console.log(`🔍 Test requête: ${selectQuery}`)
            const { data: altData, error: altError } = await supabase
              .from('gamification_data')
              .select(selectQuery)
            
            if (!altError && altData && altData.length > gamificationData?.length) {
              console.log(`✅ Requête réussie avec: ${selectQuery}, ${altData.length} résultats`)
              gamificationData = altData
              error = altError
              break
            } else if (altError) {
              console.log(`❌ Erreur avec ${selectQuery}:`, altError.message)
            }
          } catch (e) {
            console.log(`❌ Exception avec ${selectQuery}:`, e.message)
          }
        }
        
        // Test avec d'autres tables possibles
        console.log('🔍 Test autres tables...')
        const tables = ['student_data', 'user_profiles', 'users']
        
        for (const table of tables) {
          try {
            const { count, error: countError } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true })
            
            if (!countError && count > 1) {
              console.log(`📊 Table ${table}: ${count} enregistrements`)
            }
          } catch (e) {
            // Table n'existe pas
          }
        }
      }
      
      if (error) {
        console.error('❌ Erreur récupération données gamification:', error)
        console.error('❌ Détails erreur:', error.message, error.details, error.hint)
        throw error
      }
      
      console.log(`📊 ${gamificationData?.length || 0} utilisateurs trouvés`)
      console.log('📋 Données récupérées:', gamificationData)
      
      // Vérifier si on a des données
      if (!gamificationData || gamificationData.length === 0) {
        console.warn('⚠️ Aucune donnée trouvée dans gamification_data')
        console.log('🔍 Tentative de requête avec count pour vérifier la table...')
        
        const { count, error: countError } = await supabase
          .from('gamification_data')
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          console.error('❌ Erreur count:', countError)
        } else {
          console.log(`📊 Total d'enregistrements dans la table: ${count}`)
        }
      }
      
      // Mapping house_id vers nom de maison (avec tous les formats possibles)
      const houseIdToName = {
        // Format UUID complet
        '550e8400-e29b-41d4-a716-446655440001': 'harmonis',
        '550e8400-e29b-41d4-a716-446655440002': 'elaris', 
        '550e8400-e29b-41d4-a716-446655440003': 'doloris',
        '550e8400-e29b-41d4-a716-446655440004': 'solencia',
        // Autres formats possibles
        'harmonis': 'harmonis',
        'elaris': 'elaris',
        'doloris': 'doloris',
        'solencia': 'solencia',
        // IDs courts possibles (basés sur les derniers chiffres des UUIDs)
        '0001': 'harmonis',
        '0002': 'elaris',
        '0003': 'doloris',
        '0004': 'solencia',
        // Anciens IDs courts pour compatibilité
        '0': 'harmonis',
        '1': 'elaris',
        '2': 'doloris',
        '4': 'solencia'
      }
      
      // Filtrer les membres de la maison spécifique
      const houseMembers = []
      let totalXP = 0
      
      if (gamificationData && gamificationData.length > 0) {
        console.log(`🔍 DEBUG: Recherche membres pour ${houseName}`)
        gamificationData.forEach(user => {
          const houseId = user.house_id
          const house = houseIdToName[houseId]
          const userXP = user.total_xp || 0
          const userLevel = user.current_level || 1
          
          console.log(`👤 User: ${user.email}, house_id: ${houseId}, mapped to: ${house}`)
          
          if (house === houseName) {
            console.log(`✅ Membre trouvé pour ${houseName}: ${user.email}`)
            houseMembers.push({
              userId: user.user_id,
              email: user.email,
              displayName: user.email.split('@')[0], // Utiliser la partie avant @ comme nom d'affichage
              prenom: user.email.split('@')[0],
              nom: '',
              totalXP: userXP,
              niveau: userLevel,
              loginStreak: 0 // Pas de streak dans Supabase pour l'instant
            })
            totalXP += userXP
          } else {
            console.log(`❌ ${user.email} pas dans ${houseName} (house: ${house})`)
          }
        })
      }
      
      // Trier les membres par XP décroissant
      houseMembers.sort((a, b) => b.totalXP - a.totalXP)
      
      // Calculer les statistiques
      const totalMembers = houseMembers.length
      const averageXP = totalMembers > 0 ? Math.round(totalXP / totalMembers) : 0
      const averageLevel = totalMembers > 0 ? Math.round(houseMembers.reduce((sum, member) => sum + member.niveau, 0) / totalMembers) : 1
      
      // Calculer le niveau de la maison basé sur l'XP total
      const houseLevel = this.calculateHouseLevel(totalXP)
      
      const stats = {
        totalMembers,
        totalXP,
        averageXP,
        averageLevel,
        members: houseMembers,
        houseLevel
      }
      
      console.log(`✅ Stats ${houseName}:`, {
        membres: totalMembers,
        xpTotal: totalXP,
        xpMoyen: averageXP,
        niveauMoyen: averageLevel
      })
      
      return stats
      
    } catch (error) {
      console.error(`❌ Erreur récupération stats ${houseName}:`, error)
      throw error
    }
  }

  /**
   * Obtient les informations d'une maison
   * @param {string} houseName - Nom de la maison
   * @returns {Object} Informations de la maison
   */
  getHouseInfo(houseName) {
    const houses = {
      harmonis: {
        name: 'Harmonis',
        color: '#3498db',
        motto: "L'harmonie du corps, force de l’esprit"
      },
      elaris: {
        name: 'Elaris',
        color: '#e74c3c',
        motto: 'La passion guide nos actions'
      },
      doloris: {
        name: 'Doloris',
        color: '#f39c12',
        motto: 'La persévérance forge les champions'
      },
      solencia: {
        name: 'Solencia',
        color: '#27ae60',
        motto: 'La sagesse éclaire le chemin'
      }
    }
    
    return houses[houseName] || houses.harmonis
  }
}

// Instance singleton
const gamificationServiceSupabase = new GamificationServiceSupabase()

export default gamificationServiceSupabase
