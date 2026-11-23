const yearOf = (value) => Number(String(value ?? '').match(/\d{4}/)?.[0]) || 0

/** À partir d'août, les stages de l'année civile en cours sont déjà engagés. */
export function firstUpcomingStageYear(now = new Date()) {
  return now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear()
}

/** Affectations publiées, à venir, sans résultat et sans validation du répondant HES. */
export function stagesAwaitingRepondantGo(assignments, now = new Date()) {
  const firstYear = firstUpcomingStageYear(now)
  return (assignments || []).filter((assignment) =>
    assignment?.status === 'published' &&
    yearOf(assignment.year) >= firstYear &&
    !assignment.is_validated &&
    !assignment.pfp_validee &&
    !assignment.pfp_echec &&
    !assignment.pfp_arret
  )
}
