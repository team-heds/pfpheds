import Button from 'primevue/button'
import PageHeader from './PageHeader.vue'

export default {
  title: 'Composants/Mise en page/En-tête de page',
  component: PageHeader,
  tags: ['autodocs'],
  args: {
    eyebrow: 'Formation pratique',
    title: 'Offres de places',
    description: 'Consultez, filtrez et gérez les places disponibles pour la prochaine période.',
  },
}

export const Standard = {}

export const AvecActions = {
  render: (args) => ({
    components: { PageHeader, Button },
    setup: () => ({ args }),
    template: `
      <PageHeader v-bind="args">
        <template #actions>
          <Button label="Exporter" icon="pi pi-download" outlined />
          <Button label="Ajouter une offre" icon="pi pi-plus" />
        </template>
      </PageHeader>
    `,
  }),
}
