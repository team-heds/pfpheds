import PlanningLegend from './PlanningLegend.vue'

export default {
  title: 'Composants/Planning/Légende',
  component: PlanningLegend,
  tags: ['autodocs'],
  args: {
    items: [
      { label: 'Planifié', color: '#3b82f6' },
      { label: 'Confirmé', color: '#10b981' },
      { label: 'À valider', color: '#f59e0b' },
      { label: 'Annulé', color: '#ef4444' },
    ],
  },
}

export const Standard = {}

export const CampagnePFP = {
  args: {
    items: [
      { label: 'Offre publiée', color: '#3b82f6' },
      { label: 'Étudiant attribué', color: '#10b981' },
      { label: 'Validation requise', color: '#f59e0b' },
      { label: 'Place indisponible', color: '#ef4444' },
    ],
  },
}
