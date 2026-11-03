import EventCard from './EventCard.vue'
import eventImage from '../../../public/assets/images/about/09.jpg'

const event = {
  id: 'event-interprofessional-day',
  title: 'Journée interprofessionnelle',
  description: 'Ateliers collaboratifs autour d’une prise en charge coordonnée entre les professions de santé.',
  startDate: '2026-10-15T09:00:00+02:00',
  lieu: 'Campus de Sion',
  type: 'public',
  image: eventImage,
  registered: [],
}

export default {
  title: 'Composants/Événements/Carte événement',
  component: EventCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 22rem)"><story /></div>' })],
  args: { event, userId: 'user-storybook' },
}

export const Public = {}
export const SansImage = { args: { event: { ...event, image: '' } } }
export const Prive = { args: { event: { ...event, type: 'private', title: 'Atelier clinique encadré' } } }
export const DejaInscrit = { args: { event: { ...event, registered: ['user-storybook'] } } }
