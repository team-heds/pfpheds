import { ref } from 'vue'
import AuthForm from './AuthForm.vue'
import hedsLogo from '@/assets/images/FR-DE_HEdS_rvb_neg.png'

export default {
  title: 'Aperçus/Connexion HEdS',
  component: AuthForm,
  parameters: { layout: 'fullscreen' },
}

export const EcranDeConnexion = {
  render: () => ({
    components: { AuthForm },
    setup() {
      const email = ref('')
      const password = ref('')
      const remember = ref(false)
      return { email, hedsLogo, password, remember }
    },
    template: `
      <main style="min-height:100vh;display:grid;place-items:center;padding:clamp(1rem,4vw,4rem);background:var(--surface-ground)">
        <div style="width:min(100%,72rem);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr));align-items:center;gap:clamp(2rem,6vw,6rem)">
          <div style="display:grid;place-items:center;min-height:20rem;padding:2rem">
            <img :src="hedsLogo" alt="HES-SO Valais-Wallis — Haute École de Santé" style="width:min(100%,28rem)" />
          </div>
          <section style="display:grid;gap:2rem">
            <h1 style="margin:0;max-width:12ch;font-size:clamp(2rem,5vw,4rem);font-weight:700;letter-spacing:-.025em;line-height:1.08">Veuillez vous connecter</h1>
            <AuthForm
              :email="email"
              :password="password"
              :remember="remember"
              @update:email="email = $event"
              @update:password="password = $event"
              @update:remember="remember = $event"
            />
          </section>
        </div>
      </main>
    `,
  }),
}

export const ErreursDeValidation = {
  args: {
    email: 'adresse-invalide',
    password: '',
    emailError: true,
    passwordError: true,
  },
  decorators: [() => ({ template: '<div class="storybook-surface" style="max-width:32rem"><story /></div>' })],
}

export const Chargement = {
  args: {
    email: 'prenom.nom@hevs.ch',
    password: 'motdepasse',
    loading: true,
  },
  decorators: [() => ({ template: '<div class="storybook-surface" style="max-width:32rem"><story /></div>' })],
}
