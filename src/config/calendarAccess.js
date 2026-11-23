// Permissions du profil autorisées à modifier le calendrier.
// Reprend la partie « profil » de la fonction SQL public.app_is_privileged(),
// qui protège les écritures sur calendar_cells, modules et courses.
export const CALENDAR_EDIT_NEED = Object.freeze([
  'admin',
  'super.all',
  'adminphysio',
  'adminsoins',
  'editor',
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
