import TicketDetails from './TicketDetails.vue'

const creator = { id: 'usr-nora', full_name: 'Nora Moret', email: 'nora.moret@hevs.ch' }
const assignee = { id: 'usr-camille', full_name: 'Camille Dubuis', email: 'camille.dubuis@hevs.ch' }

const baseTicket = {
  id: '8f23c6a1-7ed4-4e84-98cd-4c86e1f4572a', status: 'in_progress', priority: 'high',
  title: 'Capsule sur la prise en charge respiratoire',
  description: 'Créer une capsule de **8 minutes** pour consolider les gestes clés.\n\n## Objectifs\n\n- repérer les signes d’alerte ;\n- structurer la première intervention ;\n- préparer le débriefing.',
  module_id: 'Soins aigus et urgences', created_by: creator.id, assigned_to: assignee.id,
  created_at: '2026-09-14T08:30:00Z', updated_at: '2026-09-21T14:10:00Z', due_date: '2026-10-12T12:00:00Z',
  has_assets: true, notes: 'La validation médicale doit intervenir avant le sous-titrage.',
}

const tickets = {
  video: {
    ...baseTicket, type: 'video',
    metadata: {
      person_filmed: 'Prof. Sophie Favre', filming_date: '2026-10-01T08:00:00Z', modality: 'Tutoriel', duration_minutes: 8,
      video_links: [
        { title: 'Rushes du tournage', url: 'https://vimeo.com/123456' },
        { title: 'Montage de validation', url: 'https://vimeo.com/654321' },
      ],
    },
  },
  development: {
    ...baseTicket, type: 'development', priority: 'urgent', title: 'Améliorer le carnet de stage sur mobile', assigned_to: 'usr-lucas',
    description: 'Adapter les écrans de validation et garantir la navigation au clavier.',
    metadata: { dev_type: 'Application web', technologies: 'Vue 3 · PrimeVue · Supabase', repository_url: 'https://github.com/heds-vs/pfpheds', github_branch: 'feature/8f23c6a1-mobile-carnet' },
  },
  simulation: {
    ...baseTicket, type: 'simulation', status: 'validation', priority: 'normal', title: 'Scénario de soins respiratoires',
    module_id: 'Simulation clinique avancée', description: 'Valider le scénario et le guide de débriefing avant la répétition générale.',
    metadata: { sim_type: 'Simulation haute fidélité', participants_count: 8 },
  },
  other: {
    ...baseTicket, type: 'other', status: 'todo', priority: 'low', title: 'Mise à jour du guide des terrains de stage',
    description: 'Harmoniser les informations pratiques et les contacts pour la nouvelle cohorte.', metadata: {},
  },
  empty: {
    ...baseTicket, type: 'other', status: 'backlog', priority: 'normal', title: 'Contenu à préciser', description: '', notes: '', has_assets: false, metadata: {},
  },
}

export default {
  title: 'Composants/Suivi académique/Détail du ticket',
  component: TicketDetails,
  tags: ['autodocs'],
  args: { ticket: tickets.video, creator, assignee },
  decorators: [() => ({ template: '<main style="width:min(100%,76rem);margin-inline:auto;padding:clamp(.75rem,2vw,1.5rem);background:var(--surface-ground)"><story /></main>' })],
}

export const ProductionVideo = {}
export const Developpement = { args: { ticket: tickets.development, assignee: { id: 'usr-lucas', full_name: 'Lucas Perrin', email: 'lucas.perrin@hevs.ch' } } }
export const Simulation = { args: { ticket: tickets.simulation } }
export const AutreContenu = { args: { ticket: tickets.other } }
export const SansDescription = { args: { ticket: tickets.empty } }
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }

