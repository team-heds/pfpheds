import KanbanBoard from './KanbanBoard.vue'

const users = [
  { id: 'usr-camille', full_name: 'Camille Dubuis', email: 'camille.dubuis@hevs.ch' },
  { id: 'usr-nora', full_name: 'Nora Moret', email: 'nora.moret@hevs.ch' },
  { id: 'usr-lucas', full_name: 'Lucas Perrin', email: 'lucas.perrin@hevs.ch' },
]

const tickets = [
  {
    id: '8f23c6a1-video', type: 'video', status: 'backlog', priority: 'normal',
    title: 'Capsule d’introduction aux soins aigus',
    description: 'Préparer une capsule de **5 minutes** pour introduire le module.',
    module_id: 'M-SOI-201', created_at: '2026-09-19T08:30:00Z', assigned_to: 'usr-camille',
    due_date: '2026-10-12T12:00:00Z', has_assets: true,
    metadata: { person_filmed: 'Prof. Sophie Favre', duration_minutes: 5 },
  },
  {
    id: '1ba74d82-dev', type: 'development', status: 'todo', priority: 'urgent',
    title: 'Corriger l’accès mobile au carnet de stage',
    description: 'Le bouton de validation est masqué sur les petits écrans.',
    module_id: 'PFP-2026', created_at: '2026-09-18T13:15:00Z', assigned_to: 'usr-lucas',
    due_date: '2026-09-20T12:00:00Z', metadata: { technologies: 'Vue 3 · PrimeVue' },
  },
  {
    id: 'd395ac10-sim', type: 'simulation', status: 'in_progress', priority: 'high',
    title: 'Scénario de prise en charge respiratoire',
    description: 'Finaliser les rôles et le déroulé du débriefing.',
    module_id: 'SIM-310', created_at: '2026-09-16T09:00:00Z', assigned_to: 'usr-nora',
    due_date: '2026-10-03T12:00:00Z', metadata: { participants_count: 8 },
  },
  {
    id: '73fd6e29-review', type: 'other', status: 'validation', priority: 'normal',
    title: 'Relire le guide des terrains de stage',
    description: 'Validation éditoriale avant publication dans l’espace étudiant.',
    created_at: '2026-09-15T15:40:00Z', assigned_to: 'usr-camille', due_date: '2026-09-28T12:00:00Z',
  },
  {
    id: '0f6b52a9-problem', type: 'development', status: 'problems', priority: 'high',
    title: 'Synchronisation des évaluations bloquée',
    description: 'Analyser le retour API et documenter le cas de reprise.',
    module_id: 'PFP-2026', created_at: '2026-09-14T10:20:00Z', assigned_to: 'usr-lucas',
    due_date: '2026-09-18T12:00:00Z', metadata: { technologies: 'Supabase · Vue 3' },
  },
  {
    id: '6ad0c44e-done', type: 'video', status: 'done', priority: 'low',
    title: 'Interview métier : soins communautaires',
    description: 'Montage, sous-titres et vignette terminés.',
    module_id: 'M-SOI-105', created_at: '2026-09-02T07:45:00Z', assigned_to: 'usr-nora',
    due_date: '2026-09-15T12:00:00Z', has_assets: true,
    metadata: { person_filmed: 'Dr Léa Berset', duration_minutes: 12 },
  },
]

export default {
  title: 'Composants/Suivi académique/Tableau Kanban',
  component: KanbanBoard,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { tickets, users },
  decorators: [() => ({ template: '<main style="min-height:100vh;padding:1.5rem;background:var(--surface-ground)"><story /></main>' })],
}

export const FluxComplet = {}
export const Demarrage = { args: { tickets: tickets.slice(0, 2) } }
export const TableauVide = { args: { tickets: [] } }
export const Priorites = { args: { tickets: tickets.filter((ticket) => ['urgent', 'high'].includes(ticket.priority)) } }
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }

