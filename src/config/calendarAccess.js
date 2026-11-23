// Permissions autorisées à modifier le calendrier : la partie « profil » de la fonction
// SQL public.app_is_privileged(), qui protège les écritures sur calendar_cells, modules
// et courses, plus le rôle de filière ADMIN actif (chargé par le store des rôles).
export const CALENDAR_EDIT_NEED = Object.freeze([
  'admin',
  'super.all',
  'adminphysio',
  'adminsoins',
  'editor',
  'SI.ADMIN',
  'PHY.ADMIN',
])

export const CALENDAR_EDIT_ROUTE_NAMES = Object.freeze([
  'CalendrierFormationPleinEdit',
  'CalendarAdmin',
  'CalendrierModuleEdit',
])

export const calendarEditMeta = () => ({
  requiresAuth: true,
  need: [...CALENDAR_EDIT_NEED],
})
