import avatarCamille from '@/assets/avatar/avatar1.jpg'
import avatarNora from '@/assets/avatar/avatar99.png'
import EventDetail from './EventDetail.vue'

const participants = [
  { uid: 'usr-camille', prenom: 'Camille', nom: 'Dubuis', photoURL: avatarCamille },
  { uid: 'usr-nora', prenom: 'Nora', nom: 'Moret', photoURL: avatarNora },
]

const publicEvent = {
  id: 'event-urgences-2026',
  title: 'Atelier interprofessionnel : premiers gestes d’urgence',
  description: 'Une séance pratique pour consolider les gestes essentiels, travailler la coordination d’équipe et préparer le débriefing clinique.',
  startDate: '2026-10-08T13:30:00+02:00',
  endDate: '2026-10-08T16:30:00+02:00',
  lieu: 'Campus de Sion · Salle de simulation 2',
  type: 'public',
  admin: 'usr-nora',
  registered: participants,
}

const privateEvent = {
  ...publicEvent,
  id: 'event-ba24-2026',
  title: 'Préparation au départ en stage BA24',
  description: 'Présentation des échéances, des documents requis et temps de questions avec l’équipe de coordination.',
  startDate: '2026-10-15T09:00:00+02:00',
  endDate: '2026-10-15T10:30:00+02:00',
  lieu: 'Campus de Loèche · Auditoire 1',
  type: 'private',
  role: 'BA24',
  registered: [participants[1]],
}

const alpinEvent = {
  ...publicEvent,
  id: 'event-alpin-2026',
  title: "Rencontre Alp’in Physio",
  description: 'Échanges de pratiques autour de la mobilité, de la prévention et de la réadaptation en milieu alpin.',
  startDate: '2026-11-03T17:30:00+01:00',
  endDate: '2026-11-03T19:00:00+01:00',
  lieu: 'HES-SO Valais-Wallis · Sion',
  type: 'alpinphysio',
  registered: [],
}

export default {
  title: 'Composants/Événements/Détail',
  component: EventDetail,
  tags: ['autodocs'],
  args: {
    event: publicEvent,
    userId: 'usr-lucas',
    userProfile: { prenom: 'Camille', nom: 'Dubuis', photoURL: avatarCamille },
  },
  decorators: [() => ({ template: '<main style="min-height:100vh;padding:clamp(1rem,4vw,3rem);background:var(--surface-ground)"><story /></main>' })],
}

export const Public = {}
export const DejaInscrit = { args: { userId: 'usr-camille' } }
export const Prive = { args: { event: privateEvent } }
export const AlpInPhysio = { args: { event: alpinEvent } }
export const Organisateur = { args: { userId: 'usr-nora' } }
export const SansParticipant = { args: { event: { ...publicEvent, registered: [] } } }
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }
