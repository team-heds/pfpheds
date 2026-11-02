import AdminDashboardFilters from './AdminDashboardFilters.vue'

const catalog = {
  options: {
    tracks: [
      { label: 'Physiothérapie', value: 'PHY' },
      { label: 'Soins infirmiers', value: 'SI' },
    ],
    roles: [
      { label: 'Étudiant·e', value: 'student' },
      { label: 'Enseignant·e', value: 'teacher' },
    ],
    classes: [
      { label: 'BA24', value: 'BA24' },
      { label: 'BA25', value: 'BA25' },
    ],
    pfpTypes: [
      { label: 'PFP2', value: 'PFP2' },
      { label: 'PFP3', value: 'PFP3' },
    ],
    institutions: [
      { label: 'Hôpital du Valais', value: 'hvs' },
      { label: 'CHUV', value: 'chuv' },
    ],
    statuses: [
      { label: 'En cours', value: 'active' },
      { label: 'Terminé', value: 'completed' },
    ],
  },
}

export default {
  title: 'Composants/Administration/Filtres du dashboard',
  component: AdminDashboardFilters,
  tags: ['autodocs'],
  args: { activeFilters: [], catalog, error: null, loading: false, modelValue: {} },
}

export const SansFiltre = {}

export const FiltresActifs = {
  args: {
    activeFilters: [
      { id: 'track-PHY', key: 'track', value: 'PHY', label: 'Physiothérapie' },
      { id: 'class-BA24', key: 'class', value: 'BA24', label: 'BA24' },
    ],
    modelValue: { track: ['PHY'], class: ['BA24'] },
  },
}

export const Chargement = { args: { loading: true } }
export const Erreur = { args: { error: new Error('Catalogue indisponible') } }
