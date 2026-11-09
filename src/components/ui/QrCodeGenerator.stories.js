import QrCodeGenerator from './QrCodeGenerator.vue'

export default {
  title: 'Composants/Outils/Générateur de QR code',
  component: QrCodeGenerator,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { showNavbar: false },
}

export const Standard = {}
export const CouleursHEdS = { args: { initialForeground: '#ffc700', initialBackground: '#071426' } }
export const FondTransparent = { args: { initialForeground: '#071426', initialTransparent: true } }
export const HauteDefinition = { args: { initialSize: 800 } }
export const CouleurInvalide = { args: { initialForeground: '#oops' } }
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }

