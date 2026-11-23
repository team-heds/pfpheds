const isSet = (value) => value !== null && value !== undefined && value !== ''

/** Identifiants des PF d'une affectation (principal puis second), sans doublon. */
export function assignedPraticienIds(assignment) {
  const ids = [assignment?.assigned_praticien_id, assignment?.assigned_praticien_2_id].filter(isSet)
  return ids.filter((id, index) => ids.findIndex((other) => String(other) === String(id)) === index)
}

/** Résout chaque PF puis joint les libellés non vides : « Ana Roy, Léo Blanc ». */
export function joinAssignedPraticiens(assignment, resolve) {
  return assignedPraticienIds(assignment).map(resolve).filter(Boolean).join(', ')
}
