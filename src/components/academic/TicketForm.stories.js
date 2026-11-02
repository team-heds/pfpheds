import TicketForm from './TicketForm.vue'

const users = [
  { id: 'usr-camille', full_name: 'Camille Dubuis', email: 'camille.dubuis@hevs.ch' },
  { id: 'usr-nora', full_name: 'Nora Moret', email: 'nora.moret@hevs.ch' },
  { id: 'usr-lucas', full_name: 'Lucas Perrin', email: 'lucas.perrin@hevs.ch' },
]

const modules = [
  { id: '2c0e11a8-660d-44d4-b70e-3a9d983aac01', title: 'Soins aigus et urgences' },
  { id: '42b8236b-e7f8-4c04-b709-5179e438d2d4', title: 'Pratique professionnelle 3' },
  { id: 'ef922537-25bb-4c62-8974-027f538fb4f1', title: 'Simulation clinique avancée' },
]

const baseTicket = {
  id: '8f23c6a1-demo', status: 'in_progress', priority: 'high',
  title: 'Capsule sur la prise en charge respiratoire',
  description: 'Créer une capsule de **8 minutes** avec :\n\n- une mise en situation ;\n- trois gestes clés ;\n- un résumé final.',
  module_id: modules[0].id, assigned_to: 'usr-camille', due_date: '2026-10-12T12:00:00Z',
  notes: 'Prévoir une version sous-titrée en français.', has_assets: true,
}

const tickets = {
  video: {
    ...baseTicket, type: 'video',
    metadata: { person_filmed: 'Prof. Sophie Favre', filming_date: '2026-10-01T08:00:00Z', modality: 'tutorial', duration_minutes: 8, assets_url: 'https://drive.google.com/' },
  },
  development: {
    ...baseTicket, type: 'development', title: 'Améliorer le carnet de stage sur mobile', assigned_to: 'usr-lucas',
    metadata: { dev_type: 'web_app', technologies: 'Vue 3, PrimeVue, Supabase', repository_url: 'https://github.com/heds-vs/pfpheds' },
  },
  simulation: {
    ...baseTicket, type: 'simulation', title: 'Scénario de soins respiratoires', module_id: modules[2].id, assigned_to: 'usr-nora',
    metadata: { sim_type: 'high_fidelity', participants_count: 8, equipment: 'Mannequin haute fidélité, saturomètre, chariot d’urgence.' },
  },
  other: {
    ...baseTicket, type: 'other', title: 'Mise à jour du guide des terrains de stage', priority: 'normal', status: 'todo', metadata: {},
  },
}

export default {
  title: 'Composants/Suivi académique/Formulaire de ticket',
  component: TicketForm,
  tags: ['autodocs'],
  args: { modules, users },
  decorators: [() => ({ template: '<main style="width:min(100%,72rem);margin-inline:auto;padding:clamp(1rem,3vw,2rem);background:var(--surface-card);border:1px solid var(--surface-border);border-radius:1rem"><story /></main>' })],
}

export const NouveauTicket = {}
export const ProductionVideo = { args: { ticket: tickets.video } }
export const Developpement = { args: { ticket: tickets.development } }
export const Simulation = { args: { ticket: tickets.simulation } }
export const AutreContenu = { args: { ticket: tickets.other } }
export const Mobile = { args: { ticket: tickets.video }, parameters: { viewport: { defaultViewport: 'mobile1' } } }

