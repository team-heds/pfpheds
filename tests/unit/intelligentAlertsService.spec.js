import { describe, it, expect, beforeEach } from 'vitest'
import { IntelligentAlertsService } from '@/service/intelligentAlertsService'

describe('IntelligentAlertsService', () => {
  let service

  beforeEach(() => {
    service = new IntelligentAlertsService()
  })

  describe('analyzeKPI – critical drop detection (>30%)', () => {
    it('detects a >30% drop as critical', () => {
      const kpi = { id: 'users', label: 'Utilisateurs' }
      const alerts = service.analyzeKPI(kpi, 60, 100)
      const critical = alerts.find(a => a.type === 'critical')
      expect(critical).toBeDefined()
      expect(critical.severity).toBe('error')
      expect(critical.kpiId).toBe('users')
    })

    it('does not trigger for a small drop (<30%)', () => {
      const kpi = { id: 'users', label: 'Utilisateurs' }
      const alerts = service.analyzeKPI(kpi, 80, 100)
      const critical = alerts.find(a => a.type === 'critical')
      expect(critical).toBeUndefined()
    })

    it('does not trigger when no previous value', () => {
      const kpi = { id: 'users', label: 'Utilisateurs' }
      const alerts = service.analyzeKPI(kpi, 10)
      const critical = alerts.find(a => a.type === 'critical')
      expect(critical).toBeUndefined()
    })
  })

  describe('analyzeKPI – abnormal growth detection (>50%)', () => {
    it('detects a >50% increase as warning', () => {
      const kpi = { id: 'users', label: 'Utilisateurs' }
      const alerts = service.analyzeKPI(kpi, 160, 100)
      const warning = alerts.find(a => a.type === 'warning')
      expect(warning).toBeDefined()
      expect(warning.severity).toBe('warn')
    })

    it('does not trigger for moderate growth', () => {
      const kpi = { id: 'users', label: 'Utilisateurs' }
      const alerts = service.analyzeKPI(kpi, 140, 100)
      const warning = alerts.find(a => a.type === 'warning')
      expect(warning).toBeUndefined()
    })
  })

  describe('analyzeKPI – zero value detection', () => {
    it('detects zero value as warning', () => {
      const kpi = { id: 'users', label: 'Utilisateurs' }
      const alerts = service.analyzeKPI(kpi, 0)
      const warning = alerts.find(a => a.title.includes('nulle'))
      expect(warning).toBeDefined()
    })

    it('does not trigger for excluded KPIs (places, pfpEnCours)', () => {
      expect(service.analyzeKPI({ id: 'places', label: 'Places' }, 0)).not.toContainEqual(
        expect.objectContaining({ title: expect.stringContaining('nulle') })
      )
      expect(service.analyzeKPI({ id: 'pfpEnCours', label: 'PFP' }, 0)).not.toContainEqual(
        expect.objectContaining({ title: expect.stringContaining('nulle') })
      )
    })
  })

  describe('analyzeKPI – custom thresholds', () => {
    it('detects value below min threshold', () => {
      const kpi = { id: 'total_users', label: 'Total Users' }
      const alerts = service.analyzeKPI(kpi, 3) // min is 5
      const threshold = alerts.find(a => a.type === 'threshold' && a.title.includes('minimum'))
      expect(threshold).toBeDefined()
      expect(threshold.threshold).toBe(5)
    })

    it('detects value above max threshold', () => {
      const kpi = { id: 'total_users', label: 'Total Users' }
      const alerts = service.analyzeKPI(kpi, 1500) // max is 1000
      const threshold = alerts.find(a => a.type === 'threshold' && a.title.includes('maximum'))
      expect(threshold).toBeDefined()
      expect(threshold.severity).toBe('error')
    })

    it('does not trigger for values within thresholds', () => {
      const kpi = { id: 'total_users', label: 'Total Users' }
      const alerts = service.analyzeKPI(kpi, 50)
      const threshold = alerts.filter(a => a.type === 'threshold')
      expect(threshold).toHaveLength(0)
    })

    it('returns null for KPI without custom thresholds', () => {
      expect(service.getCustomThresholds('unknown_kpi')).toBeNull()
    })
  })

  describe('updateHistory', () => {
    it('stores values in history', () => {
      service.updateHistory('kpi1', 100)
      service.updateHistory('kpi1', 200)
      expect(service.history.get('kpi1')).toHaveLength(2)
    })

    it('limits history to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        service.updateHistory('kpi1', i)
      }
      expect(service.history.get('kpi1')).toHaveLength(10)
      // First 5 should have been shifted out
      expect(service.history.get('kpi1')[0].value).toBe(5)
    })
  })

  describe('calculateTrend', () => {
    it('returns null with insufficient history', () => {
      expect(service.calculateTrend('kpi1', 100)).toBeNull()
      service.updateHistory('kpi1', 100)
      expect(service.calculateTrend('kpi1', 90)).toBeNull()
    })

    it('detects downward trend', () => {
      service.updateHistory('kpi1', 100)
      service.updateHistory('kpi1', 90)
      const trend = service.calculateTrend('kpi1', 80)
      expect(trend.direction).toBe('down')
      expect(trend.count).toBeGreaterThanOrEqual(2)
    })

    it('detects upward trend', () => {
      service.updateHistory('kpi1', 100)
      service.updateHistory('kpi1', 110)
      const trend = service.calculateTrend('kpi1', 120)
      expect(trend.direction).toBe('up')
      expect(trend.count).toBeGreaterThanOrEqual(2)
    })

    it('calculates percentage change', () => {
      service.updateHistory('kpi1', 100)
      service.updateHistory('kpi1', 150)
      const trend = service.calculateTrend('kpi1', 200)
      expect(trend.percentage).toBe(100) // 100 -> 200 = +100%
    })
  })

  describe('analyzeKPI – persistent negative trend', () => {
    it('detects 3+ consecutive drops', () => {
      const kpi = { id: 'custom', label: 'Custom KPI' }
      // Build history: 100, 95, 90
      service.updateHistory('custom', 100)
      service.updateHistory('custom', 95)
      service.updateHistory('custom', 90)
      // Now analyze with 85 (4th consecutive drop)
      const alerts = service.analyzeKPI(kpi, 85)
      const trend = alerts.find(a => a.type === 'trend')
      expect(trend).toBeDefined()
      expect(trend.severity).toBe('warn')
    })
  })

  describe('getActiveAlerts', () => {
    it('returns only alerts from last 24h', () => {
      const kpi = { id: 'users', label: 'Users' }
      service.analyzeKPI(kpi, 0) // generates a zero-value alert
      const active = service.getActiveAlerts()
      expect(active.length).toBeGreaterThan(0)
    })

    it('filters out old alerts', () => {
      service.alerts.push({
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        severity: 'error'
      })
      expect(service.getActiveAlerts()).toHaveLength(0)
    })
  })

  describe('resolveAlert', () => {
    it('marks alert as resolved', () => {
      const kpi = { id: 'users', label: 'Users' }
      service.analyzeKPI(kpi, 0)
      const alert = service.alerts[0]
      service.resolveAlert(alert.timestamp)
      expect(service.alerts[0].resolved).toBe(true)
      expect(service.alerts[0].resolvedAt).toBeDefined()
    })

    it('does nothing for non-existent alert', () => {
      service.resolveAlert('nonexistent')
      expect(service.alerts).toHaveLength(0)
    })
  })

  describe('getAlertStats', () => {
    it('computes stats correctly', () => {
      const kpi = { id: 'users', label: 'Users' }
      service.analyzeKPI(kpi, 0) // warning (zero value)
      service.analyzeKPI(kpi, 10, 100) // critical (>30% drop)

      const stats = service.getAlertStats()
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.critical).toBeGreaterThanOrEqual(0)
      expect(stats.warning).toBeGreaterThanOrEqual(0)
      expect(typeof stats.resolved).toBe('number')
    })
  })

  describe('clear', () => {
    it('clears history and alerts', () => {
      service.updateHistory('kpi1', 100)
      service.alerts.push({ type: 'test' })
      service.clear()
      expect(service.history.size).toBe(0)
      expect(service.alerts).toHaveLength(0)
    })
  })

  describe('getCustomThresholds', () => {
    it('returns thresholds for known KPIs', () => {
      const t = service.getCustomThresholds('total_users')
      expect(t).toEqual({ min: 5, max: 1000, action: 'Vérifier les inscriptions' })
    })

    it('returns thresholds for activeChallenges', () => {
      const t = service.getCustomThresholds('activeChallenges')
      expect(t.min).toBe(1)
      expect(t.max).toBe(50)
    })

    it('returns null for unknown KPI', () => {
      expect(service.getCustomThresholds('random')).toBeNull()
    })
  })
})
