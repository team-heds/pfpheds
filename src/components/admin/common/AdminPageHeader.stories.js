import Button from 'primevue/button'
import AdminPageHeader from './AdminPageHeader.vue'

export default {
  title: 'Composants/Administration/En-tête de page',
  component: AdminPageHeader,
  tags: ['autodocs'],
  args: {
    title: 'Gestion des institutions',
    subtitle: 'Consultez et mettez à jour les partenaires de formation pratique.',
  },
}

export const Standard = {}

export const AvecActions = {
  render: (args) => ({
    components: { AdminPageHeader, Button },
    setup: () => ({ args }),
    template: `
      <AdminPageHeader v-bind="args">
        <template #breadcrumbs><a href="#">Administration</a> / Institutions</template>
        <template #actions>
          <Button label="Exporter" icon="pi pi-download" severity="secondary" outlined />
          <Button label="Ajouter une institution" icon="pi pi-plus" />
        </template>
      </AdminPageHeader>
    `,
  }),
}
