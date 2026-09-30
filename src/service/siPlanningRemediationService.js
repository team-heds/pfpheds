import { supabase } from '@/supabase'
import { API_URL, authFetch } from '@/service/apiClient'
import { fetchPlanningSlotsPaginated } from '@/service/siPlanningQueryService'
import {
  buildPlanningRemediationFindings,
  summarizePlanningRemediation
} from '@/domain/si/planningRemediation'

async function fetchCatalogTable(table, select, client) {
  const rows = []
  for (let offset = 0; offset < 10000; offset += 1000) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .order('id')
      .range(offset, offset + 999)

    if (error) throw error
    const page = data || []
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

export async function loadSIPlanningRemediation({ classCodes, force = false, client = supabase } = {}) {
  const [slots, modules, courses] = await Promise.all([
    fetchPlanningSlotsPaginated({ classCodes, force, client }),
    fetchCatalogTable('modules', 'id,code,number', client),
    fetchCatalogTable('courses', 'id,name,module_id', client)
  ])

  const findings = buildPlanningRemediationFindings({ slots, modules, courses })
  return {
    slotsScanned: slots.length,
    findings,
    summary: summarizePlanningRemediation(findings),
    generatedAt: new Date().toISOString(),
    readOnly: false
  }
}

export async function applySIPlanningRemediation(finding, reason) {
  if (!finding?.slotId || !finding?.category || !finding?.expectedValue || !finding?.replacementValue) {
    throw new TypeError('La proposition de correction est incomplète.')
  }
  const response = await authFetch(`${API_URL}/si/planning-remediations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slotId: finding.slotId,
      category: finding.category,
      expectedValue: finding.expectedValue,
      replacementValue: finding.replacementValue,
      reason
    })
  })
  return (await response.json()).remediation
}

export async function loadSIPlanningRemediationHistory(limit = 20) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)
  const response = await authFetch(`${API_URL}/si/planning-remediations/history?limit=${safeLimit}`)
  return (await response.json()).history || []
}

export async function revertSIPlanningRemediation(historyId) {
  if (!historyId) throw new TypeError("L'identifiant de la correction est obligatoire.")
  const response = await authFetch(
    `${API_URL}/si/planning-remediations/${encodeURIComponent(historyId)}/revert`,
    { method: 'POST' }
  )
  return (await response.json()).remediation
}

export default {
  loadSIPlanningRemediation,
  applySIPlanningRemediation,
  loadSIPlanningRemediationHistory,
  revertSIPlanningRemediation
}
