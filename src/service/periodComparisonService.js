/**
 * Service de Comparaison de Périodes pour les KPI
 * Compare les données actuelles avec des périodes précédentes
 */

export class PeriodComparisonService {
  constructor() {
    this.cache = new Map()
  }

  /**
   * Comparer avec la période précédente
   * @param {string} period - 'day', 'week', 'month', 'quarter', 'year'
   * @param {Object} currentData - Données actuelles
   * @param {Object} previousData - Données de la période précédente
   */
  compare(period, currentData, previousData) {
    const comparison = {}

    for (const key in currentData) {
      const current = currentData[key] || 0
      const previous = previousData?.[key] || 0

      comparison[key] = {
        current,
        previous,
        difference: current - previous,
        percentageChange: this.calculatePercentageChange(current, previous),
        trend: this.getTrend(current, previous),
        status: this.getStatus(current, previous),
        emoji: this.getEmoji(current, previous)
      }
    }

    return comparison
  }

  /**
   * Calculer le pourcentage de changement
   */
  calculatePercentageChange(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0
    }
    return parseFloat((((current - previous) / previous) * 100).toFixed(1))
  }

  /**
   * Déterminer la tendance
   */
  getTrend(current, previous) {
    if (current > previous) return 'up'
    if (current < previous) return 'down'
    return 'stable'
  }

  /**
   * Déterminer le statut (bon/moyen/mauvais)
   */
  getStatus(current, previous) {
    const change = this.calculatePercentageChange(current, previous)
    
    if (Math.abs(change) < 5) return 'stable'
    if (change > 0) return change > 20 ? 'excellent' : 'good'
    return change < -20 ? 'critical' : 'warning'
  }

  /**
   * Obtenir l'emoji approprié
   */
  getEmoji(current, previous) {
    const trend = this.getTrend(current, previous)
    const change = Math.abs(this.calculatePercentageChange(current, previous))

    if (trend === 'stable') return '➡️'
    if (trend === 'up') {
      if (change > 50) return '🚀'
      if (change > 20) return '📈'
      return '↗️'
    }
    if (change > 50) return '🔻'
    if (change > 20) return '📉'
    return '↘️'
  }

  /**
   * Générer un rapport de comparaison textuel
   */
  generateReport(kpiLabel, comparison) {
    const { current, previous, percentageChange, trend, emoji } = comparison

    if (trend === 'stable') {
      return `${kpiLabel} est stable à ${current}`
    }

    const direction = trend === 'up' ? 'augmenté' : 'diminué'
    const change = Math.abs(percentageChange)

    return `${emoji} ${kpiLabel} a ${direction} de ${change}% (${previous} → ${current})`
  }

  /**
   * Comparer avec plusieurs périodes
   */
  compareMultiplePeriods(currentData, historicalData) {
    return {
      vsYesterday: historicalData.yesterday ? this.compare('day', currentData, historicalData.yesterday) : null,
      vsLastWeek: historicalData.lastWeek ? this.compare('week', currentData, historicalData.lastWeek) : null,
      vsLastMonth: historicalData.lastMonth ? this.compare('month', currentData, historicalData.lastMonth) : null,
      vsLastYear: historicalData.lastYear ? this.compare('year', currentData, historicalData.lastYear) : null
    }
  }

  /**
   * Obtenir les dates de référence pour les périodes
   */
  getPeriodDates(period = 'month') {
    const now = new Date()
    const dates = {
      current: {
        start: new Date(now),
        end: new Date(now)
      },
      previous: {
        start: null,
        end: null
      }
    }

    switch (period) {
      case 'day':
        dates.current.start.setHours(0, 0, 0, 0)
        dates.previous.start = new Date(dates.current.start)
        dates.previous.start.setDate(dates.previous.start.getDate() - 1)
        dates.previous.end = new Date(dates.previous.start)
        dates.previous.end.setHours(23, 59, 59, 999)
        break

      case 'week':
        const dayOfWeek = now.getDay()
        dates.current.start.setDate(now.getDate() - dayOfWeek)
        dates.current.start.setHours(0, 0, 0, 0)
        dates.previous.start = new Date(dates.current.start)
        dates.previous.start.setDate(dates.previous.start.getDate() - 7)
        dates.previous.end = new Date(dates.previous.start)
        dates.previous.end.setDate(dates.previous.end.getDate() + 6)
        dates.previous.end.setHours(23, 59, 59, 999)
        break

      case 'month':
        dates.current.start.setDate(1)
        dates.current.start.setHours(0, 0, 0, 0)
        dates.previous.start = new Date(dates.current.start)
        dates.previous.start.setMonth(dates.previous.start.getMonth() - 1)
        dates.previous.end = new Date(dates.current.start)
        dates.previous.end.setDate(0)
        dates.previous.end.setHours(23, 59, 59, 999)
        break

      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        dates.current.start.setMonth(quarter * 3, 1)
        dates.current.start.setHours(0, 0, 0, 0)
        dates.previous.start = new Date(dates.current.start)
        dates.previous.start.setMonth(dates.previous.start.getMonth() - 3)
        dates.previous.end = new Date(dates.current.start)
        dates.previous.end.setDate(0)
        dates.previous.end.setHours(23, 59, 59, 999)
        break

      case 'year':
        dates.current.start.setMonth(0, 1)
        dates.current.start.setHours(0, 0, 0, 0)
        dates.previous.start = new Date(dates.current.start)
        dates.previous.start.setFullYear(dates.previous.start.getFullYear() - 1)
        dates.previous.end = new Date(dates.current.start)
        dates.previous.end.setDate(0)
        dates.previous.end.setHours(23, 59, 59, 999)
        break
    }

    return dates
  }

  /**
   * Formater un rapport de comparaison pour l'affichage
   */
  formatComparison(comparison) {
    return {
      value: comparison.difference,
      percentage: comparison.percentageChange,
      trend: comparison.trend,
      label: this.getComparisonLabel(comparison),
      color: this.getComparisonColor(comparison),
      icon: this.getComparisonIcon(comparison)
    }
  }

  getComparisonLabel(comparison) {
    const { percentageChange, trend } = comparison
    const sign = percentageChange > 0 ? '+' : ''
    return `${sign}${percentageChange}%`
  }

  getComparisonColor(comparison) {
    switch (comparison.status) {
      case 'excellent': return 'success'
      case 'good': return 'success'
      case 'stable': return 'info'
      case 'warning': return 'warning'
      case 'critical': return 'danger'
      default: return 'secondary'
    }
  }

  getComparisonIcon(comparison) {
    switch (comparison.trend) {
      case 'up': return 'pi pi-arrow-up'
      case 'down': return 'pi pi-arrow-down'
      case 'stable': return 'pi pi-minus'
      default: return 'pi pi-circle'
    }
  }

  /**
   * Mettre en cache les comparaisons
   */
  cacheComparison(kpiId, period, comparison) {
    const key = `${kpiId}_${period}`
    this.cache.set(key, {
      data: comparison,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Récupérer depuis le cache
   */
  getCachedComparison(kpiId, period, maxAge = 300000) { // 5 min par défaut
    const key = `${kpiId}_${period}`
    const cached = this.cache.get(key)
    
    if (!cached) return null

    const age = Date.now() - new Date(cached.timestamp).getTime()
    if (age > maxAge) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Vider le cache
   */
  clearCache() {
    this.cache.clear()
  }
}

// Instance singleton
export const periodComparison = new PeriodComparisonService()

// Export par défaut
export default periodComparison
