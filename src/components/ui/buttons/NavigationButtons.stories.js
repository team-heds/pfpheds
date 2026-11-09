import ButtonNavbar from './ButtonNavbar.vue'
import SearchButton from './SearchButton.vue'

export default {
  title: 'Composants/Boutons/Contrôles de navigation',
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="display:flex;align-items:center;gap:1rem"><story /></div>' })],
}

export const BoutonDeNavigation = {
  render: (args) => ({
    components: { ButtonNavbar },
    setup: () => ({ args }),
    template: '<ButtonNavbar v-bind="args" />',
  }),
  args: {
    icon: 'pi pi-home',
    title: 'Accueil',
    ariaLabel: 'Ouvrir l’accueil',
    active: false,
  },
}

export const NavigationActive = {
  render: (args) => ({
    components: { ButtonNavbar },
    setup: () => ({ args }),
    template: '<ButtonNavbar v-bind="args" />',
  }),
  args: {
    icon: 'pi pi-users',
    title: 'Communautés',
    ariaLabel: 'Communautés, page actuelle',
    active: true,
  },
}

export const Recherche = {
  render: (args) => ({
    components: { SearchButton },
    setup: () => ({ args }),
    template: '<SearchButton v-bind="args" />',
  }),
  args: { title: 'Rechercher dans la plateforme' },
}

export const BarreDeControles = {
  render: () => ({
    components: { ButtonNavbar, SearchButton },
    template: `
      <div style="display:flex;gap:.625rem;padding:.75rem;border-radius:1rem;background:var(--surface-card)">
        <ButtonNavbar icon="pi pi-home" title="Accueil" aria-label="Accueil" active />
        <ButtonNavbar icon="pi pi-comments" title="Communautés" aria-label="Communautés" />
        <ButtonNavbar icon="pi pi-bell" title="Notifications" aria-label="Notifications" />
        <SearchButton title="Rechercher" />
      </div>
    `,
  }),
}
