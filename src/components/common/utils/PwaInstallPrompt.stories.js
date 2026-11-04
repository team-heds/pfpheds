import PwaInstallPrompt from './PwaInstallPrompt.vue'

export default {
  title: 'Composants/Navigation/Invitation PWA',
  component: PwaInstallPrompt,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { forceVisible: true },
  decorators: [() => ({ template: '<main style="min-height:28rem;background:var(--surface-ground)"><story /></main>' })],
}

export const Standard = {}
export const MessageCourt = { args: { message: 'Installez HEdS pour accéder rapidement à vos stages.' } }
export const TexteLong = { args: { message: 'Installez l’application HEdS sur votre écran d’accueil pour retrouver vos stages, vos échéances et vos ressources même lorsque vous êtes en déplacement.' } }
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }

