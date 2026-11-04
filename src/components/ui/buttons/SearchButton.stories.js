import SearchButton from './SearchButton.vue'

export default {
  title: 'Composants/Boutons/Recherche',
  component: SearchButton,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div class="storybook-surface" style="display:inline-flex"><story /></div>' })],
  args: { title: 'Rechercher' },
}

export const ParDefaut = {}
export const RechercheGlobale = { args: { title: 'Ouvrir la recherche globale' } }

