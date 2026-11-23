import { API_URL, authFetch } from '@/service/apiClient'

const ALERT_PERIODS = new Set(['day', 'week', 'month', 'quarter', 'year'])

function alertPeriod(period) {
  return ALERT_PERIODS.has(period) ? period : 'month'
}

function alertsBaseUrl() {
  return `${String(API_URL).replace(/\/+$/, '')}/admin-dashboard/v1/alerts`
}

export function validateAdminAlertsResponse(payload) {
  if (payload?.version !== '1' || !Array.isArray(payload.alerts) || !payload.stats) {
    throw new TypeError('Le contrat des alertes admin est invalide.')
  }
  return payload
}

export async function fetchAdminAlerts({ period, signal } = {}) {
  const params = new URLSearchParams({ period: alertPeriod(period) })
  const response = await authFetch(`${alertsBaseUrl()}?${params}`, { method: 'GET', signal })
  return validateAdminAlertsResponse(await response.json())
}

export async function resolveAdminAlert(key, { period } = {}) {
  const params = new URLSearchParams({ period: alertPeriod(period) })
  const response = await authFetch(
    `${alertsBaseUrl()}/${encodeURIComponent(key)}/resolve?${params}`,
    { method: 'POST' },
  )
  return validateAdminAlertsResponse(await response.json())
}

export function alertTagSeverity(severity) {
  if (severity === 'error') return 'danger'
  if (severity === 'warn') return 'warning'
  return 'info'
}

export function alertSeverityLabel(severity) {
  if (severity === 'error') return 'Critique'
  if (severity === 'warn') return 'Avertissement'
  return 'Info'
}

// Évalue un seuil personnel sur la valeur réelle du KPI.
// Renvoie null quand la donnée nécessaire n'existe pas : ni déclenché, ni normal.
export function evaluateKpiAlert(alert, kpi) {
  if (!alert?.enabled || kpi?.status !== 'ok') return null
  const threshold = Number(alert.threshold)
  if (!Number.isFinite(threshold)) return null

  let measured = null
  if (alert.type === 'value') measured = kpi.value
  else if (alert.type === 'percentage') measured = kpi.comparisonData?.percentChange
  else if (alert.type === 'trend') measured = kpi.comparisonData?.absoluteChange
  if (!Number.isFinite(measured)) return null

  if (alert.condition === 'above') return measured > threshold
  if (alert.condition === 'below') return measured < threshold
  if (alert.condition === 'equal') return measured === threshold
  return null
}

export function toCsv(headers, rows) {
  const escapeCell = (value) => {
    let text = value === null || value === undefined ? '' : String(value)
    // Empêche un tableur d'interpréter une cellule comme une formule.
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return `"${text.replace(/"/g, '""')}"`
  }
  return [headers, ...rows].map((row) => row.map(escapeCell).join(';')).join('\r\n')
}
