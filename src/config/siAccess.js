const freeze = permissions => Object.freeze([...permissions])

// Matrice d'accès unique pour l'administration Soins infirmiers.
// `super.all` n'est pas répété : le roleStore l'autorise globalement.
export const SI_SECRETARIAT_ACCESS = freeze([
  'admin',
  'page2.access',
  'AdminSoins'
])

export const SI_RM_ACCESS = freeze([
  ...SI_SECRETARIAT_ACCESS,
  'RMSoins'
])

export const SI_RM_DASHBOARD_ACCESS = freeze([
  ...SI_RM_ACCESS,
  'auth.redirect.dashboard_rm'
])

export const SI_TEACHER_ACCESS = freeze([
  ...SI_RM_ACCESS,
  'EnseignantSoins'
])

export const SI_PLANNING_ACCESS = freeze([
  ...SI_RM_ACCESS,
  'editor',
  'PlanificateurHoraires'
])

// La vue hebdomadaire est aussi le détail en lecture ouvert depuis une
// postulation. Elle reste distincte des écrans de gestion du planning.
export const SI_WEEKLY_PLANNING_ACCESS = freeze([
  ...SI_PLANNING_ACCESS,
  'EnseignantSoins',
  'planning.weekly.view'
])

export const SI_RESOURCE_ACCESS = freeze([
  ...SI_RM_ACCESS,
  'editor'
])

export const SI_POSTULATION_ACCESS = SI_TEACHER_ACCESS
