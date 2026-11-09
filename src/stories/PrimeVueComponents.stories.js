import { ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'

export default {
  title: 'Composants/PrimeVue',
  tags: ['autodocs'],
}

export const Boutons = {
  render: () => ({
    components: { Button },
    template: `
      <div class="storybook-stack">
        <section class="storybook-section storybook-surface">
          <h2>Actions</h2>
          <div class="storybook-component-row">
            <Button label="Enregistrer" icon="pi pi-check" />
            <Button label="Continuer" icon="pi pi-arrow-right" icon-pos="right" />
            <Button label="Annuler" severity="secondary" outlined />
            <Button label="Supprimer" severity="danger" icon="pi pi-trash" />
          </div>
        </section>
        <section class="storybook-section storybook-surface">
          <h2>États</h2>
          <div class="storybook-component-row">
            <Button label="Chargement" loading />
            <Button label="Indisponible" disabled />
            <Button aria-label="Ajouter" icon="pi pi-plus" rounded />
            <Button label="Action secondaire" text />
          </div>
        </section>
      </div>
    `,
  }),
}

export const ChampsDeSaisie = {
  render: () => ({
    components: { Checkbox, Dropdown, InputText, Textarea },
    setup() {
      const email = ref('prenom.nom@hevs.ch')
      const filiere = ref({ name: 'Physiothérapie', code: 'PHY' })
      const filieres = [
        { name: 'Physiothérapie', code: 'PHY' },
        { name: 'Soins infirmiers', code: 'SI' },
        { name: 'Ergothérapie', code: 'ERGO' },
      ]
      const commentaire = ref('')
      const accepted = ref(true)
      return { accepted, commentaire, email, filiere, filieres }
    },
    template: `
      <form class="storybook-surface" style="display:grid;gap:1.25rem;max-width:42rem" @submit.prevent>
        <div style="display:grid;gap:.45rem">
          <label for="catalog-email" style="font-weight:600">Adresse e-mail</label>
          <InputText id="catalog-email" v-model="email" type="email" />
          <small style="color:var(--text-color-secondary)">Utilisez votre adresse institutionnelle.</small>
        </div>
        <div style="display:grid;gap:.45rem">
          <label for="catalog-track" style="font-weight:600">Filière</label>
          <Dropdown id="catalog-track" v-model="filiere" :options="filieres" option-label="name" />
        </div>
        <div style="display:grid;gap:.45rem">
          <label for="catalog-comment" style="font-weight:600">Commentaire</label>
          <Textarea id="catalog-comment" v-model="commentaire" rows="4" placeholder="Ajouter une précision…" />
        </div>
        <div style="display:flex;align-items:center;gap:.65rem">
          <Checkbox v-model="accepted" input-id="catalog-terms" binary />
          <label for="catalog-terms">J’ai vérifié les informations</label>
        </div>
      </form>
    `,
  }),
}

export const ContenusEtStatuts = {
  render: () => ({
    components: { Button, Card, Tag },
    template: `
      <div class="storybook-grid">
        <Card>
          <template #title>Offre de place</template>
          <template #subtitle>Physiothérapie · PFP 2</template>
          <template #content>
            <p>Hôpital du Valais, site de Sion. Une place disponible pour la période d’automne.</p>
            <div class="storybook-component-row">
              <Tag value="Disponible" severity="success" />
              <Tag value="À valider" severity="warning" />
            </div>
          </template>
          <template #footer><Button label="Voir l’offre" icon="pi pi-arrow-right" icon-pos="right" /></template>
        </Card>
        <Card>
          <template #title>États métier</template>
          <template #content>
            <div style="display:flex;gap:.75rem;flex-wrap:wrap">
              <Tag value="Brouillon" severity="secondary" />
              <Tag value="Publié" severity="info" />
              <Tag value="Validé" severity="success" />
              <Tag value="Action requise" severity="danger" />
            </div>
          </template>
        </Card>
      </div>
    `,
  }),
}
