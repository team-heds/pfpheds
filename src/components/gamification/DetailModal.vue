<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissable-mask
    :header="title"
    :style="{ width: 'min(92vw, 560px)' }"
    class="gamification-detail-dialog"
  >
    <div v-if="item" class="detail" :style="{ '--accent': accent }">
      <!-- En-tête : icône et étiquette (rareté ou difficulté) -->
      <div class="detail__hero">
        <span class="detail__icon" aria-hidden="true">
          <i v-if="isPrimeIcon(icon)" :class="icon"></i>
          <template v-else>{{ icon }}</template>
        </span>
        <span class="detail__tag">{{ tagLabel }}</span>
      </div>

      <p v-if="item.description" class="detail__description">{{ item.description }}</p>

      <!-- Progression d'un défi -->
      <div v-if="type === 'challenge'" class="detail__progress">
        <div class="detail__progress-head">
          <span>Progression</span>
          <strong>{{ challengeProgress.value }}/{{ challengeProgress.target }}</strong>
        </div>
        <div
          class="detail__bar"
          role="progressbar"
          :aria-valuenow="challengeProgress.percent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Progression du défi ${title}`"
        >
          <span :style="{ transform: `scaleX(${challengeProgress.percent / 100})` }"></span>
        </div>
      </div>

      <ul class="detail__facts">
        <li><i class="pi pi-star-fill" aria-hidden="true"></i>+{{ xp }} XP</li>
        <li v-if="type === 'challenge' && actionInfo"><i :class="actionInfo.icon" aria-hidden="true"></i>{{ actionInfo.label }}</li>
        <li v-if="type === 'badge' && categoryLabel"><i class="pi pi-tag" aria-hidden="true"></i>{{ categoryLabel }}</li>
        <li v-if="type === 'challenge' && endDate"><i class="pi pi-calendar" aria-hidden="true"></i>Jusqu’au {{ formatDate(endDate) }}</li>
      </ul>

      <p v-if="type === 'challenge' && actionInfo?.hint && !item.completed" class="detail__hint">
        <i class="pi pi-info-circle" aria-hidden="true"></i>{{ actionInfo.hint }}
      </p>

      <p v-if="type === 'badge' && unlockedAt" class="detail__success">
        <i class="pi pi-check-circle" aria-hidden="true"></i>Débloqué le {{ formatDate(unlockedAt) }}
      </p>
      <p v-else-if="type === 'challenge' && item.completed" class="detail__success">
        <i class="pi pi-check-circle" aria-hidden="true"></i>Défi réussi{{ item.completedAt ? ` le ${formatDate(item.completedAt)}` : '' }}
      </p>

      <div v-if="cta" class="detail__actions">
        <button type="button" class="detail__cta" @click="go(cta.to)">
          {{ cta.label }} <i class="pi pi-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import { useAuthStore } from '@/stores/authStore'
import { BADGE_RARITY, BADGE_CATEGORIES } from '@/service/badgesService'

const props = defineProps({
  modelValue: Boolean,
  type: String, // 'badge', 'challenge', 'quest'
  item: Object,
  // Consultation d'un autre profil : aucune action personnelle proposée.
  readOnly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const authStore = useAuthStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const DIFFICULTY = {
  easy: { label: 'Facile', color: '#22C55E' },
  medium: { label: 'Moyen', color: '#F59E0B' },
  hard: { label: 'Difficile', color: '#EF4444' },
  legendary: { label: 'Légendaire', color: '#8B5CF6' },
  expert: { label: 'Expert', color: '#8B5CF6' }
}

// Actions réellement comptées par le moteur, avec un libellé et une aide lisibles.
const ACTIONS = {
  update_profile: { label: 'Mise à jour du profil', icon: 'pi pi-user-edit', hint: 'Enregistre une modification de ton profil : le défi se valide tout seul.', cta: { label: 'Mettre à jour mon profil', to: 'profile' } },
  daily_login: { label: 'Connexion quotidienne', icon: 'pi pi-sign-in', hint: 'Chaque jour où tu te connectes compte une fois, automatiquement.' },
  create_post: { label: 'Publication dans le feed', icon: 'pi pi-pencil', hint: 'Publie un message dans le feed : le défi se valide tout seul.', cta: { label: 'Publier dans le feed', to: '/feed' } }
}

const title = computed(() => props.item?.name || props.item?.title || '')

const icon = computed(() => props.item?.icon || (props.type === 'badge' ? '🏅' : props.type === 'quest' ? 'pi pi-compass' : 'pi pi-flag'))
const isPrimeIcon = (value) => typeof value === 'string' && value.startsWith('pi ')

const difficulty = computed(() => DIFFICULTY[String(props.item?.difficulty || '').toLowerCase()] || null)
const rarity = computed(() => BADGE_RARITY[props.item?.rarity] || null)

const tagLabel = computed(() => {
  if (props.type === 'badge') return rarity.value?.name || 'Badge'
  return difficulty.value?.label || (props.type === 'quest' ? 'Quête' : 'Défi')
})
const accent = computed(() => (props.type === 'badge' ? rarity.value?.color : difficulty.value?.color) || 'var(--primary-color)')

const xp = computed(() => {
  const item = props.item || {}
  if (props.type === 'badge') return Number(item.xpBonus ?? item.xp_bonus ?? 0)
  return Number(item.reward?.xp ?? item.xp_reward ?? item.points ?? 0)
})

const categoryLabel = computed(() => {
  const category = props.item?.category
  if (!category || category === 'general') return null
  return BADGE_CATEGORIES[category]?.name || null
})

const actionInfo = computed(() => ACTIONS[String(props.item?.type || props.item?.action_type || '').toLowerCase()] || null)
const endDate = computed(() => props.item?.endDate || props.item?.end_date || null)
const unlockedAt = computed(() => props.item?.unlockedAt || props.item?.unlocked_at || null)

const challengeProgress = computed(() => {
  const target = Math.max(1, Number(props.item?.target || props.item?.target_value || 1))
  const value = Math.min(target, Number(props.item?.progress || 0))
  return { value, target, percent: Math.round((value / target) * 100) }
})

const cta = computed(() => {
  if (props.readOnly || !props.item) return null
  if (props.type === 'challenge' && !props.item.completed && actionInfo.value?.cta) return actionInfo.value.cta
  if (props.type === 'quest') return { label: 'Voir mes quêtes', to: '/quests' }
  return null
})

const go = (to) => {
  visible.value = false
  router.push(to === 'profile' ? `/profile/${authStore.user?.id}` : to)
}

const formatDate = (date) => {
  if (!date) return ''
  const value = /^\d{4}-\d{2}-\d{2}$/.test(String(date)) ? `${date}T12:00:00` : date
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.detail {
  display: grid;
  gap: 1.1rem;
  color: var(--text-color);
}

.detail__hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--surface-border));
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 12%, var(--surface-card));
}

.detail__icon {
  display: grid;
  flex: 0 0 3.25rem;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  border-radius: 12px;
  background: var(--surface-card);
  font-size: 1.8rem;
  line-height: 1;
}

.detail__icon .pi {
  font-size: 1.4rem;
  color: var(--accent);
}

.detail__tag {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  color: var(--text-color);
  background: color-mix(in srgb, var(--accent) 28%, transparent);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detail__description {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.55;
}

.detail__progress-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.detail__bar {
  overflow: hidden;
  height: 8px;
  border-radius: 999px;
  background: var(--surface-section);
}

.detail__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transform-origin: left center;
}

.detail__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.detail__facts li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  background: var(--surface-section);
  font-size: 0.85rem;
}

.detail__facts .pi-star-fill {
  color: #f3c300;
}

.detail__hint,
.detail__success {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.45;
}

.detail__hint {
  color: var(--text-color-secondary);
  background: var(--surface-section);
}

.detail__success {
  color: #22c55e;
  background: color-mix(in srgb, #22c55e 12%, transparent);
}

.detail__actions {
  display: flex;
  justify-content: flex-end;
}

.detail__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.1rem;
  border: 0;
  border-radius: 10px;
  color: #071426;
  background: #f3c300;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.detail__cta:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style>
