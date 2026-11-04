import AppSpinner from './AppSpinner.vue'

export default {
  title: 'Composants/Feedback/Indicateur de chargement',
  component: AppSpinner,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="min-height:8rem;display:grid;place-items:center"><story /></div>' })],
  args: { inline: true, size: 'sm', label: 'Chargement…' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
}

export const Petit = {}
export const Moyen = { args: { size: 'md', label: 'Mise à jour des données…' } }
export const Grand = { args: { size: 'lg', inline: false, label: 'Préparation de votre espace…' } }
export const SansLibelleVisible = { args: { size: 'md', label: '' } }

