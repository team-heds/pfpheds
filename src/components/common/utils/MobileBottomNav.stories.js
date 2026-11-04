import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MobileBottomNav from './MobileBottomNav.vue'

const renderAt = (path) => () => ({
  components: { MobileBottomNav },
  setup() {
    const router = useRouter()
    onMounted(() => router.replace(path))
  },
  template: `
    <div style="min-height:32rem; padding:1.5rem 1.25rem 7rem">
      <h2 style="margin:0 0 .5rem; color:var(--text-color)">Navigation mobile</h2>
      <p style="max-width:34ch; margin:0; color:var(--text-color-secondary)">
        La destination active est signalée par la couleur principale et l’attribut de page courante.
      </p>
      <MobileBottomNav />
    </div>
  `,
})

export default {
  title: 'Composants/Navigation/Navigation mobile',
  component: MobileBottomNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
}

export const AccueilActif = {
  render: renderAt('/feed'),
}

export const CommunautesActives = {
  render: renderAt('/communities'),
}
