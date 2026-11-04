import EventForm from './EventForm.vue'

const publicEvent = {
  id: 'event-urgences-2026',
  title: 'Atelier interprofessionnel : premiers gestes d’urgence',
  description: 'Séance pratique consacrée aux gestes essentiels et à la coordination d’équipe.',
  startDate: '2026-10-08T13:30:00+02:00',
  endDate: '2026-10-08T16:30:00+02:00',
  lieu: 'Campus de Sion · Salle de simulation 2',
  type: 'public',
  admin: 'usr-nora',
}

const privateEvent = {
  ...publicEvent,
  id: 'event-ba24-2026',
  title: 'Préparation au départ en stage BA24',
  description: 'Présentation des échéances et des documents requis avant le départ en stage.',
  startDate: '2026-10-15T09:00:00+02:00',
  endDate: '2026-10-15T10:30:00+02:00',
  lieu: 'Campus de Loèche · Auditoire 1',
  type: 'private',
  role: 'BA24',
}

const alpinEvent = {
  ...publicEvent,
  id: 'event-alpin-2026',
  title: "Rencontre Alp’in Physio",
  description: 'Échanges de pratiques autour de la mobilité et de la réadaptation en milieu alpin.',
  startDate: '2026-11-03T17:30:00+01:00',
  endDate: '2026-11-03T19:00:00+01:00',
  lieu: 'HES-SO Valais-Wallis · Sion',
  type: 'alpinphysio',
}

export default {
  title: 'Composants/Événements/Formulaire',
  component: EventForm,
  tags: ['autodocs'],
  args: { editMode: false, userId: 'usr-nora' },
  decorators: [() => ({ template: '<main style="width:min(100%,44rem);margin-inline:auto;padding:clamp(1rem,3vw,2rem);border:1px solid var(--surface-border);border-radius:1rem;background:var(--surface-card)"><story /></main>' })],
}

export const Creation = {}
export const Edition = { args: { event: publicEvent, editMode: true } }
export const EvenementPrive = { args: { event: privateEvent, editMode: true } }
export const AlpInPhysio = { args: { event: alpinEvent, editMode: true } }
export const LectureSeule = { args: { event: publicEvent, editMode: true, userId: 'usr-camille' } }
export const Mobile = { args: { event: privateEvent, editMode: true }, parameters: { viewport: { defaultViewport: 'mobile1' } } }

