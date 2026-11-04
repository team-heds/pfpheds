import Error404 from './Error404.vue'

export default {
  title: 'Composants/États/Page introuvable',
  component: Error404,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export const Standard = {}
export const RessourceDeplacee = {
  args: {
    title: 'Ressource déplacée',
    description: 'Cette ressource pédagogique a changé d’adresse. Revenez à l’accueil pour poursuivre votre navigation.',
  },
}
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }

