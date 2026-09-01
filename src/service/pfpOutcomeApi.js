import { API_URL, authFetch } from '@/service/apiClient'
import { validatePfpOutcome } from '@/service/pfpOutcomeService'

export async function savePfpOutcome(assignmentId, outcome, comment = '') {
  if (!assignmentId) throw new TypeError("L'identifiant de l'affectation est obligatoire.")
  const validation = validatePfpOutcome(outcome, comment)
  if (!validation.valid) throw new TypeError(validation.message)

  const response = await authFetch(`${API_URL}/pfp-outcomes/${encodeURIComponent(assignmentId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome, comment })
  })
  const payload = await response.json()
  return payload.outcome
}

export default { savePfpOutcome }
