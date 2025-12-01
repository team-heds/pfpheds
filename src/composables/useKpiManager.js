import { ref, computed, watch } from 'vue'
import { useRoleStore } from '@/stores/role'
import { getKpisForRole } from '@/config/kpiConfigs'
import * as dashboardService from '@/service/dashboardService'
import intelligentAlerts from '@/service/intelligentAlertsService'
import periodComparison from '@/service/periodComparisonService'

/**
 * Composable pour gérer les KPI d'un dashboard
 * @param {string} dashboardType - Type de dashboard (general, pfp, academique, gamification)
 * @returns {object} - Méthodes et données pour gérer les KPI
 */
export function useKpiManager(dashboardType) {
  const roleStore = useRoleStore()
  
  const loading = ref(true)
  const refreshing = ref(false)
  const kpiData = ref({})
  const period = ref('month') // day, week, month, quarter, year
  const compareMode = ref(false)
  const previousPeriodData = ref({})
  const alerts = ref([])
  const comparisons = ref({})
  
  // KPI config filtrée selon rôle utilisateur
  const availableKpis = computed(() => {
    return getKpisForRole(dashboardType, roleStore.perms || [], roleStore.isSuper)
  })
  
  // KPI avec leurs données enrichies (SIMPLIFIÉ pour éviter boucle infinie)
  const kpisWithData = computed(() => {
    return availableKpis.value.map(kpi => {
      const value = kpiData.value[kpi.dataKey] ?? 0
      
      // Préparer les données de graphique (SIMPLIFIÉ)
      const breakdownData = kpi.breakdownKey && kpiData.value[kpi.breakdownKey]
        ? kpiData.value[kpi.breakdownKey]
        : []

      return {
        ...kpi,
        value,
        loading: loading.value || refreshing.value,
        trend: null, // Désactivé temporairement
        comparison: '', // Désactivé temporairement
        comparisonData: null,
        chartData: breakdownData,
        alerts: [] // Désactivé temporairement
      }
    })
  })
  
  /**
   * Charger les données KPI
   */
  async function loadKpis() {
    loading.value = true
    console.log('🔄 [useKpiManager] Début loadKpis')
    try {
      // Grouper les KPI par fetchFn pour minimiser les appels
      const fetchGroups = {}
      availableKpis.value.forEach(kpi => {
        if (kpi.fetchFn && dashboardService[kpi.fetchFn]) {
          if (!fetchGroups[kpi.fetchFn]) {
            fetchGroups[kpi.fetchFn] = []
          }
          fetchGroups[kpi.fetchFn].push(kpi)
        }
      })
      
      console.log('📋 [useKpiManager] FetchGroups:', Object.keys(fetchGroups))
      
      // Appeler chaque service unique
      const promises = Object.keys(fetchGroups).map(async (fetchFn) => {
        try {
          console.log(`⚙️ [useKpiManager] Appel ${fetchFn}`)
          const data = await dashboardService[fetchFn]()
          console.log(`✅ [useKpiManager] ${fetchFn} retourné:`, data)
          return data || {}
        } catch (error) {
          console.error(`❌ [useKpiManager] Erreur fetchFn ${fetchFn}:`, error)
          return {}
        }
      })
      
      const results = await Promise.all(promises)
      console.log('📦 [useKpiManager] Tous les résultats:', results)
      
      // Merger les résultats de manière SAFE - construire un nouveau objet simple
      const oldKpiData = { ...kpiData.value }
      const mergedData = {}
      results.forEach(result => {
        if (result && typeof result === 'object') {
          Object.keys(result).forEach(key => {
            mergedData[key] = result[key]
          })
        }
      })
      kpiData.value = mergedData
      console.log('✨ [useKpiManager] kpiData final:', kpiData.value)
      
      // Désactiver l'analyse d'alertes temporairement (cause boucle infinie)
      // availableKpis.value.forEach(kpi => {
      //   const currentValue = kpiData.value[kpi.dataKey]
      //   const previousValue = oldKpiData[kpi.dataKey]
      //   
      //   if (currentValue !== undefined) {
      //     const kpiAlerts = intelligentAlerts.analyzeKPI(kpi, currentValue, previousValue)
      //     if (kpiAlerts.length > 0) {
      //       alerts.value.push(...kpiAlerts)
      //     }
      //   }
      // })
      
    } catch (error) {
      console.error('Erreur chargement KPI:', error)
      kpiData.value = {}
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Rafraîchir les données
   */
  async function refresh() {
    refreshing.value = true
    await loadKpis()
    refreshing.value = false
  }
  
  /**
   * Calculer la tendance (pourcentage de variation)
   * @param {string} dataKey - Clé de la donnée
   * @returns {number|null} - Pourcentage de variation
   */
  function calculateTrend(dataKey) {
    const current = kpiData.value[dataKey] ?? 0
    const previous = previousPeriodData.value[dataKey] ?? current
    
    if (previous === 0) return null
    
    const change = ((current - previous) / previous) * 100
    return Math.round(change)
  }
  
  /**
   * Construire le texte de comparaison
   * @param {string} dataKey - Clé de la donnée
   * @returns {string} - Texte de comparaison
   */
  function buildComparison(dataKey) {
    const current = kpiData.value[dataKey] ?? 0
    const previous = previousPeriodData.value[dataKey] ?? current - Math.floor(Math.random() * (current * 0.2))
    
    let periodText = ''
    switch (period.value) {
      case '7d':
        periodText = 'semaine dernière'
        break
      case '30d':
        periodText = 'mois dernier'
        break
      case '90d':
        periodText = 'trimestre dernier'
        break
      default:
        periodText = 'période précédente'
    }
    
    return `vs ${previous.toLocaleString()} ${periodText}`
  }
  
  /**
   * Obtenir les données pour le mini-chart
   * @param {string} dataKey - Clé de la donnée
   * @returns {array} - Tableau de valeurs pour le graphique
   */
  function getChartData(dataKey) {
    const current = kpiData.value[dataKey] ?? 0
    
    // Générer des données simulées d'évolution
    // TODO: Remplacer par vraies données historiques de la base
    const numPoints = period.value === '7d' ? 7 : period.value === '30d' ? 30 : 90
    const variation = 0.15 // 15% de variation
    
    const data = []
    for (let i = 0; i < numPoints; i++) {
      const randomVariation = (Math.random() - 0.5) * 2 * variation
      const value = Math.max(0, Math.round(current * (1 + randomVariation * (i / numPoints))))
      data.push(value)
    }
    
    // S'assurer que la dernière valeur est la valeur actuelle
    data[data.length - 1] = current
    
    return data
  }
  
  /**
   * Charger les données de la période précédente pour comparaison
   */
  async function loadPreviousPeriodData() {
    // TODO: Implémenter le chargement des données historiques depuis la base
    // Pour l'instant, on simule avec une variation aléatoire
    previousPeriodData.value = {}
    Object.keys(kpiData.value).forEach(key => {
      const current = kpiData.value[key] ?? 0
      const variation = (Math.random() - 0.3) * 0.25 // -30% à +20%
      previousPeriodData.value[key] = Math.max(0, Math.round(current * (1 + variation)))
    })
    
    // Générer les comparaisons
    if (compareMode.value) {
      comparisons.value = periodComparison.compare(period.value, kpiData.value, previousPeriodData.value)
    }
  }
  
  /**
   * Changer la période et recharger
   * @param {string} newPeriod - Nouvelle période
   */
  async function changePeriod(newPeriod) {
    period.value = newPeriod
    await refresh()
  }
  
  /**
   * Toggle le mode comparaison
   */
  async function toggleCompareMode() {
    compareMode.value = !compareMode.value
    if (compareMode.value) {
      await loadPreviousPeriodData()
    }
  }
  
  // Recharger quand la période change
  watch(period, () => {
    refresh()
  })
  
  /**
   * Récupérer toutes les alertes actives
   */
  function getActiveAlerts() {
    return intelligentAlerts.getActiveAlerts()
  }
  
  /**
   * Résoudre une alerte
   */
  function resolveAlert(alertId) {
    intelligentAlerts.resolveAlert(alertId)
    alerts.value = alerts.value.filter(a => a.timestamp !== alertId)
  }
  
  /**
   * Récupérer les statistiques d'alertes
   */
  function getAlertStats() {
    return intelligentAlerts.getAlertStats()
  }

  return {
    // État
    kpisWithData,
    availableKpis,
    loading,
    refreshing,
    period,
    compareMode,
    kpiData,
    alerts,
    comparisons,
    
    // Méthodes
    loadKpis,
    refresh,
    changePeriod,
    toggleCompareMode,
    getActiveAlerts,
    resolveAlert,
    getAlertStats
  }
}
