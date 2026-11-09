import { onMounted, ref } from 'vue'
import AchievementNotification from './AchievementNotification.vue'

const renderNotification = (badge) => () => ({
  components: { AchievementNotification },
  setup() {
    const notification = ref(null)
    onMounted(() => notification.value?.showAchievementNotification(badge, 120000))
    return { notification }
  },
  template: '<div style="min-height:16rem"><AchievementNotification ref="notification" /></div>',
})

export default {
  title: 'Gamification/Notifications/Badge débloqué',
  component: AchievementNotification,
  tags: ['autodocs'],
}

export const Commun = {
  render: renderNotification({ name: 'Premier pas', description: 'Vous avez terminé votre première quête.', rarity: 'common', color: '#94a3b8', iconClass: 'pi pi-flag', xpBonus: 50 }),
}
export const PeuCommun = {
  render: renderNotification({ name: 'Esprit d’équipe', description: 'Vous avez contribué à un défi collectif.', rarity: 'uncommon', color: '#34d399', iconClass: 'pi pi-users', xpBonus: 120 }),
}
export const Rare = {
  render: renderNotification({ name: 'Explorateur clinique', description: 'Vous avez découvert dix terrains de stage.', rarity: 'rare', color: '#fb923c', iconClass: 'pi pi-compass', xpBonus: 250 }),
}
export const Legendaire = {
  render: renderNotification({ name: 'Maître de cohorte', description: 'Vous avez accompli toutes les quêtes du semestre.', rarity: 'legendary', color: '#a78bfa', iconClass: 'pi pi-star-fill', xpBonus: 800 }),
}
