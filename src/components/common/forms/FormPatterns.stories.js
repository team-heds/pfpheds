import { ref } from 'vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import FormActions from './FormActions.vue'
import FormField from './FormField.vue'
import FormSection from './FormSection.vue'
import FormShell from './FormShell.vue'
import FormStatus from './FormStatus.vue'

export default {
  title: 'Composants/Formulaires/Composition',
  tags: ['autodocs'],
}

const roles = [
  { label: 'Étudiant', value: 'student' },
  { label: 'Enseignant', value: 'teacher' },
  { label: 'Administrateur', value: 'admin' },
  { label: 'Praticien formateur', value: 'practitioner' },
]

export const FormulaireComplet = {
  render: () => ({
    components: { Button, Dropdown, FormField, FormSection, FormShell, InputText, Password },
    setup() {
      const email = ref('')
      const firstName = ref('')
      const lastName = ref('')
      const password = ref('')
      const role = ref('student')
      return { email, firstName, lastName, password, role, roles }
    },
    template: `
      <FormShell title="Nouvel utilisateur" description="Créez un compte et attribuez-lui son rôle initial.">
        <form id="storybook-user-form" class="app-form p-fluid" @submit.prevent>
          <FormSection title="Identité et accès" description="Renseignez les informations nécessaires à la création du compte." icon="pi pi-user-plus">
            <FormField for-id="story-email" label="Adresse e-mail" required hint="Utilisez de préférence une adresse institutionnelle." v-slot="field">
              <InputText v-bind="field.controlAttrs" v-model="email" type="email" placeholder="prenom.nom@hevs.ch" />
            </FormField>
            <FormField for-id="story-password" label="Mot de passe" required hint="Au moins 8 caractères." v-slot="field">
              <Password v-bind="field.controlAttrs" v-model="password" :feedback="true" toggle-mask input-class="w-full" />
            </FormField>
            <FormField for-id="story-first-name" label="Prénom" optional-label="Facultatif" v-slot="field">
              <InputText v-bind="field.controlAttrs" v-model="firstName" autocomplete="given-name" />
            </FormField>
            <FormField for-id="story-last-name" label="Nom de famille" optional-label="Facultatif" v-slot="field">
              <InputText v-bind="field.controlAttrs" v-model="lastName" autocomplete="family-name" />
            </FormField>
            <FormField for-id="story-role" label="Rôle initial" required hint="Les permissions détaillées pourront être ajustées ensuite." span="12" v-slot="field">
              <Dropdown v-bind="field.controlAttrs" v-model="role" :options="roles" option-label="label" option-value="value" />
            </FormField>
          </FormSection>
        </form>
        <template #actions>
          <Button label="Annuler" icon="pi pi-times" outlined severity="secondary" />
          <Button form="storybook-user-form" type="submit" label="Créer l’utilisateur" icon="pi pi-check" />
        </template>
      </FormShell>
    `,
  }),
}

export const ValidationEtStatut = {
  render: () => ({
    components: { Button, FormActions, FormField, FormStatus, InputText },
    setup() {
      const email = ref('adresse-invalide')
      return { email }
    },
    template: `
      <div class="storybook-stack storybook-surface">
        <div style="display:grid;grid-template-columns:repeat(12,minmax(0,1fr))">
          <FormField for-id="invalid-email" label="Adresse e-mail" required error="Saisissez une adresse e-mail valide." span="12" v-slot="field">
            <InputText v-bind="field.controlAttrs" v-model="email" class="p-invalid" />
          </FormField>
        </div>
        <FormStatus status="error" title="Création impossible" message="Corrigez le champ signalé puis réessayez." />
        <FormActions status="error" status-message="Une modification reste nécessaire.">
          <template #secondary><Button label="Annuler" text severity="secondary" /></template>
          <Button label="Réessayer" icon="pi pi-refresh" />
        </FormActions>
      </div>
    `,
  }),
}

export const EnregistrementEnCours = {
  render: () => ({
    components: { Button, FormActions },
    template: `
      <div class="storybook-surface" style="max-width:52rem">
        <FormActions busy status="loading" status-message="Enregistrement des modifications…">
          <Button label="Enregistrement" loading />
        </FormActions>
      </div>
    `,
  }),
}
