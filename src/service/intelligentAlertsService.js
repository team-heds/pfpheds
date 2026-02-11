/**
 * Service d'Alertes Intelligentes pour les KPI
 * Analyse automatique et détection d'anomalies
 */

export class IntelligentAlertsService {
  constructor() {
    this.history = new Map() // Historique des valeurs par KPI
    this.alerts = []
  }

  /**
   * Analyser un KPI et détecter des anomalies
   */
  analyzeKPI(kpi, value, previousValue = null) {
    const alerts = []

    // 1. Détection de chute brutale (>30%)
    if (previousValue && value < previousValue * 0.7) {
      alerts.push({
        type: 'critical',
        kpiId: kpi.id,
        title: `📉 Chute critique détectée`,
        message: `${kpi.label} a chuté de ${Math.abs(((value - previousValue) / previousValue * 100)).toFixed(1)}%`,
        value,
        previousValue,
        severity: 'error',
        action: 'Analyser la cause',
        timestamp: new Date().toISOString()
      })
    }

    // 2. Détection de hausse anormale (>50%)
    if (previousValue && value > previousValue * 1.5) {
      alerts.push({
        type: 'warning',
        kpiId: kpi.id,
        title: `📈 Croissance anormale`,
        message: `${kpi.label} a augmenté de ${((value - previousValue) / previousValue * 100).toFixed(1)}%`,
        value,
        previousValue,
        severity: 'warn',
        action: 'Vérifier les données',
        timestamp: new Date().toISOString()
      })
    }

    // 3. Valeur à zéro (potentiellement anormal)
    if (value === 0 && kpi.id !== 'places' && kpi.id !== 'pfpEnCours') {
      alerts.push({
        type: 'warning',
        kpiId: kpi.id,
        title: `⚠️ Valeur nulle`,
        message: `${kpi.label} est à zéro`,
        value,
        severity: 'warn',
        action: 'Vérifier la connexion aux données',
        timestamp: new Date().toISOString()
      })
    }

    // 4. Seuils personnalisés
    const customThresholds = this.getCustomThresholds(kpi.id)
    if (customThresholds) {
      if (customThresholds.min && value < customThresholds.min) {
        alerts.push({
          type: 'threshold',
          kpiId: kpi.id,
          title: `🔻 Seuil minimum atteint`,
          message: `${kpi.label} (${value}) est sous le seuil de ${customThresholds.min}`,
          value,
          threshold: customThresholds.min,
          severity: 'warn',
          action: customThresholds.action || 'Action requise',
          timestamp: new Date().toISOString()
        })
      }

      if (customThresholds.max && value > customThresholds.max) {
        alerts.push({
          type: 'threshold',
          kpiId: kpi.id,
          title: `🔺 Seuil maximum dépassé`,
          message: `${kpi.label} (${value}) dépasse le seuil de ${customThresholds.max}`,
          value,
          threshold: customThresholds.max,
          severity: 'error',
          action: customThresholds.action || 'Action immédiate requise',
          timestamp: new Date().toISOString()
        })
      }
    }

    // 5. Tendance négative sur 3 mesures
    const trend = this.calculateTrend(kpi.id, value)
    if (trend && trend.direction === 'down' && trend.count >= 3) {
      alerts.push({
        type: 'trend',
        kpiId: kpi.id,
        title: `📉 Tendance négative persistante`,
        message: `${kpi.label} baisse depuis ${trend.count} mesures`,
        value,
        trend: trend.percentage,
        severity: 'warn',
        action: 'Analyser la tendance',
        timestamp: new Date().toISOString()
      })
    }

    // Sauvegarder dans l'historique
    this.updateHistory(kpi.id, value)

    // Stocker les alertes
    if (alerts.length > 0) {
      this.alerts.push(...alerts)
      this.notifyAlerts(alerts)
    }

    return alerts
  }

  /**
   * Mettre à jour l'historique d'un KPI
   */
  updateHistory(kpiId, value) {
    if (!this.history.has(kpiId)) {
      this.history.set(kpiId, [])
    }
    
    const history = this.history.get(kpiId)
    history.push({
      value,
      timestamp: new Date().toISOString()
    })

    // Garder seulement les 10 dernières valeurs
    if (history.length > 10) {
      history.shift()
    }
  }

  /**
   * Calculer la tendance d'un KPI
   */
  calculateTrend(kpiId, currentValue) {
    const history = this.history.get(kpiId)
    if (!history || history.length < 2) return null

    const values = [...history.map(h => h.value), currentValue]
    let consecutiveDown = 0
    let consecutiveUp = 0

    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        consecutiveDown++
        consecutiveUp = 0
      } else if (values[i] > values[i - 1]) {
        consecutiveUp++
        consecutiveDown = 0
      }
    }

    const direction = consecutiveDown >= consecutiveUp ? 'down' : 'up'
    const count = Math.max(consecutiveDown, consecutiveUp)
    
    const firstValue = values[0]
    const lastValue = values[values.length - 1]
    const percentage = ((lastValue - firstValue) / firstValue * 100).toFixed(1)

    return {
      direction,
      count,
      percentage: parseFloat(percentage)
    }
  }

  /**
   * Récupérer les seuils personnalisés d'un KPI
   */
  getCustomThresholds(kpiId) {
    const thresholds = {
      total_users: { min: 5, max: 1000, action: 'Vérifier les inscriptions' },
      activeChallenges: { min: 1, max: 50, action: 'Gérer les défis' },
      places: { min: 0, max: 500, action: 'Vérifier les places' },
      institutions: { min: 10, max: 200, action: 'Audit institutions' },
      // Ajouter d'autres seuils selon les besoins
    }

    return thresholds[kpiId] || null
  }

  /**
   * Notifier les alertes (toast, email, etc.)
   */
  notifyAlerts(alerts) {
    alerts.forEach(alert => {
      // Alert notification handled by toast if available
      
      // Ici, intégrer avec PrimeVue Toast si disponible
      if (typeof window !== 'undefined' && window.$toast) {
        window.$toast.add({
          severity: alert.severity,
          summary: alert.title,
          detail: alert.message,
          life: 5000
        })
      }
    })
  }

  /**
   * Récupérer toutes les alertes actives
   */
  getActiveAlerts() {
    // Filtrer les alertes des dernières 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    return this.alerts.filter(alert => alert.timestamp > yesterday)
  }

  /**
   * Marquer une alerte comme résolue
   */
  resolveAlert(alertId) {
    const index = this.alerts.findIndex(a => a.timestamp === alertId)
    if (index !== -1) {
      this.alerts[index].resolved = true
      this.alerts[index].resolvedAt = new Date().toISOString()
    }
  }

  /**
   * Récupérer les statistiques d'alertes
   */
  getAlertStats() {
    const active = this.getActiveAlerts()
    return {
      total: active.length,
      critical: active.filter(a => a.severity === 'error').length,
      warning: active.filter(a => a.severity === 'warn').length,
      info: active.filter(a => a.severity === 'info').length,
      resolved: this.alerts.filter(a => a.resolved).length
    }
  }

  /**
   * Vider l'historique et les alertes
   */
  clear() {
    this.history.clear()
    this.alerts = []
  }
}

// Instance singleton
export const intelligentAlerts = new IntelligentAlertsService()

// Export par défaut
export default intelligentAlerts
