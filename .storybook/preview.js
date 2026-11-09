import { setup } from '@storybook/vue3-vite'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import BadgeDirective from 'primevue/badgedirective'
import Ripple from 'primevue/ripple'
import StyleClass from 'primevue/styleclass'

import '@/assets/theme/theme-dim/heds/theme.css'
import '@/assets/styles/styles.scss'
import '@/assets/styles/platform-foundations.scss'
import './storybook.css'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/feed', component: { template: '<div />' } },
    { path: '/mobile-search', component: { template: '<div />' } },
    { path: '/mobile-outils', component: { template: '<div />' } },
    { path: '/communities', component: { template: '<div />' } },
    { path: '/profile/:id?', component: { template: '<div />' } },
    { path: '/create-quest', component: { template: '<div />' } },
    { path: '/create-challenge', component: { template: '<div />' } },
  ],
})

setup((app) => {
  app.use(createPinia())
  app.use(router)
  app.use(PrimeVue, { ripple: true })
  app.use(ConfirmationService)
  app.use(DialogService)
  app.use(ToastService)
  app.directive('tooltip', Tooltip)
  app.directive('badge', BadgeDirective)
  app.directive('ripple', Ripple)
  app.directive('styleclass', StyleClass)
})

const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    a11y: {
      test: 'todo',
    },
    backgrounds: {
      default: 'HEdS — sombre',
      values: [
        { name: 'HEdS — sombre', value: '#0B213F' },
        { name: 'Surface sombre', value: '#071426' },
        { name: 'HEdS — clair', value: '#EFF3F8' },
      ],
    },
    options: {
      storySort: {
        order: ['Fondations', 'Aperçus', 'Composants', 'Gamification'],
      },
    },
  },
  decorators: [
    () => ({
      template: '<main class="storybook-canvas"><story /></main>',
    }),
  ],
}

export default preview
