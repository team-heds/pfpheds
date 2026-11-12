<template>
  <section ref="scrollerRef" class="m-profile" aria-label="Profil">
    <div v-if="store.failed" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Ton profil ne se charge pas</p>
      <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
      <button type="button" class="m-ghost-button" @click="reload(true)">Réessayer</button>
    </div>

    <template v-else>
      <!-- Identité et maison -->
      <div class="m-profile__identity" :style="house ? { '--house': house.color } : null" :class="{ 'has-house': house }">
        <!-- Image de la maison en bandeau, avec son blason -->
        <div v-if="house" class="m-profile__banner">
          <img :src="house.banner" :alt="`Blason de la maison ${house.name}`" class="m-profile__banner-img" />
          <span class="m-profile__banner-fade" aria-hidden="true"></span>
        </div>
        <div class="m-profile__who">
          <button type="button" class="m-profile__avatar" aria-label="Changer ma photo de profil" @click="shell.open('reglages')">
            <img v-if="avatarUrl && !avatarFailed" :src="avatarUrl" alt="" @error="avatarFailed = true" />
            <span v-else aria-hidden="true">{{ initialsOf(name) }}</span>
          </button>
          <div class="m-profile__names">
            <p v-if="!store.loaded" class="m-skeleton m-profile__name-skeleton" aria-hidden="true"></p>
            <p v-else class="m-profile__name">{{ name }}</p>
            <p class="m-profile__sub">{{ subtitle }}</p>
          </div>
        </div>

        <div v-if="level" class="m-profile__level">
          <div class="m-profile__level-line">
            <span>Niveau {{ level.level }}<template v-if="level.name"> · {{ level.name }}</template></span>
            <span class="m-profile__level-xp">{{ level.isMax ? 'Niveau maximum' : `encore ${formatNumber(level.toNext)} XP` }}</span>
          </div>
          <div class="m-profile__bar" role="progressbar" :aria-valuenow="level.percent" aria-valuemin="0" aria-valuemax="100" aria-label="Avancée vers le niveau suivant">
            <span :style="{ width: `${level.percent}%` }"></span>
          </div>
        </div>
      </div>

      <button v-if="showHouseQuiz" type="button" class="m-profile__quiz" @click="router.push('/hes-house-quiz')">
        <span>
          <strong>Découvre ta maison</strong>
          <small>Passe le quiz pour rejoindre Harmonis, Elaris, Doloris ou Solencia.</small>
        </span>
        <MIcon name="next" />
      </button>

      <!-- Chiffres -->
      <div v-if="journey" class="m-profile__stats">
        <div class="m-profile__stat">
          <strong>{{ level ? formatNumber(level.xp) : '–' }}</strong>
          <span>XP</span>
        </div>
        <div class="m-profile__stat m-profile__stat--accent">
          <strong>{{ store.streak ? store.streak.current : '–' }}</strong>
          <span>{{ store.streak?.current === 1 ? 'jour de suite' : 'jours de suite' }}</span>
        </div>
        <div class="m-profile__stat">
          <strong>{{ collections ? store.badges.length : '–' }}</strong>
          <span>{{ store.badges.length === 1 ? 'badge' : 'badges' }}</span>
        </div>
      </div>

      <p v-if="store.streak" class="m-profile__streak">
        <MIcon name="flame" />
        <span>{{ nextMilestoneLabel(store.streak) }}</span>
      </p>

      <!-- Défis -->
      <section v-if="collections" aria-labelledby="m-profile-challenges">
        <div class="m-profile__heading">
          <h2 id="m-profile-challenges">Mes défis</h2>
          <button type="button" class="m-profile__all" @click="router.push('/challenges')">Tout voir</button>
        </div>
        <p v-if="store.loaded && !challenges.length" class="m-profile__empty">Aucun défi en cours pour le moment.</p>
        <ul v-else class="m-profile__challenges">
          <li v-for="item in challenges" :key="item.challenge.id">
            <button type="button" class="m-profile__challenge" @click="router.push('/challenges')">
              <span class="m-profile__challenge-line">
                <span class="m-profile__challenge-name">{{ item.challenge.name || item.challenge.challengeName }}</span>
                <span class="m-profile__pill" :class="{ 'is-done': item.state.completed }">{{ item.state.completed ? 'Terminé' : item.state.label }}</span>
              </span>
              <span class="m-profile__bar m-profile__bar--thin" aria-hidden="true"><span :style="{ width: `${item.state.percent}%` }"></span></span>
              <span v-if="item.challenge.reward?.xp" class="m-profile__challenge-xp">+{{ item.challenge.reward.xp }} XP</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- Badges -->
      <section v-if="collections" aria-labelledby="m-profile-badges">
        <div class="m-profile__heading">
          <h2 id="m-profile-badges">Mes badges</h2>
          <button type="button" class="m-profile__all" @click="router.push('/achievements')">Tout voir</button>
        </div>
        <p v-if="store.loaded && !store.badges.length" class="m-profile__empty">Pas encore de badge : relève un défi pour gagner le premier.</p>
        <ul v-else class="m-profile__badges">
          <li v-for="badge in store.badges" :key="badge.id" class="m-profile__badge">
            <span class="m-profile__badge-icon" :style="{ color: badge.color }" aria-hidden="true">
              <i v-if="badgeIcon(badge).className" :class="badgeIcon(badge).className"></i>
              <template v-else>{{ badgeIcon(badge).text }}</template>
            </span>
            <span class="m-profile__badge-name">{{ badge.name }}</span>
          </li>
        </ul>
      </section>

      <!-- Mon espace -->
      <section aria-labelledby="m-profile-space">
        <div class="m-profile__heading"><h2 id="m-profile-space">Mon espace</h2></div>
        <div class="m-profile__links">
          <button v-for="link in links" :key="link.key" type="button" class="m-row-link" @click="link.run()">
            <span class="m-row-link__icon" aria-hidden="true"><MIcon :name="link.icon" /></span>
            <span class="m-row-link__text">
              <span>{{ link.label }}</span>
              <small v-if="link.detail">{{ link.detail }}</small>
            </span>
            <MIcon name="next" />
          </button>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import MIcon from '@/mobile/ui/MIcon.vue'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { gamificationFeatures } from '@/config/gamificationFeatures'
import { useHouseQuizStatus } from '@/composables/useHouseQuizStatus'
import { nextMilestoneLabel } from '@/utils/loginStreak'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'
import { useKeptScroll } from '@/mobile/shell/useKeptScroll'
import { useMobileStoriesStore } from '@/mobile/home/mobileStoriesStore'
import { initialsOf } from '@/mobile/home/postMedia'
import { useMobileInstitutionsStore } from '@/mobile/institutions/mobileInstitutionsStore'
import { useMobileProfileStore } from '@/mobile/profile/mobileProfileStore'
import { badgeIcon, displayNameOf, featuredChallenges, formatNumber, houseOf, levelSummary } from '@/mobile/profile/profileHelpers'

const props = defineProps({
  /** L'onglet reste en mémoire quand on en change : vrai quand il est affiché. */
  active: { type: Boolean, default: true },
})

const router = useRouter()
const shell = useMobileShell()
const authStore = useAuthStore()
const userStore = useUserStore()
const store = useMobileProfileStore()
const stories = useMobileStoriesStore()
const institutionsView = useMobileInstitutionsStore()
const { scrollTopSignal } = storeToRefs(useMobileShellStore())

const scrollerRef = ref(null)
const kept = useKeptScroll(scrollerRef, () => props.active)

const journey = gamificationFeatures.userJourney
const collections = journey && gamificationFeatures.badgesChallenges
const { quizOpen } = useHouseQuizStatus({ enabled: journey && gamificationFeatures.houseQuiz })

const userId = computed(() => {
  const id = authStore.user?.id
  return id && id !== 'guest-user' ? id : null
})
const name = computed(() => displayNameOf(store.profile, authStore.user?.email))
const avatarUrl = computed(() => store.profile?.avatar_url || stories.ownAvatarUrl || null)
const avatarFailed = ref(false)
watch(avatarUrl, () => {
  avatarFailed.value = false
})
const house = computed(() => houseOf(store.stats?.house))
const level = computed(() => (store.stats ? levelSummary(store.stats) : null))
const subtitle = computed(() => {
  const parts = []
  const cohort = userStore.profile?.pfp_cohort || userStore.profile?.cohort || userStore.profile?.classe
  if (cohort) parts.push(cohort)
  if (house.value) parts.unshift(`Maison ${house.value.name}`)
  return parts.join(' · ') || authStore.user?.email || ''
})
const showHouseQuiz = computed(() => journey && store.loaded && !house.value && quizOpen.value)
const challenges = computed(() => featuredChallenges(store.challenges))

const links = computed(() => [
  gamificationFeatures.mentoring && { key: 'mentoring', icon: 'users', label: 'Mes créneaux de mentorat', detail: 'Créneaux proposés ou réservés', run: () => router.push('/mentorat') },
  { key: 'stages', icon: 'building', label: 'Mes stages', detail: 'Places attribuées et résultats', run: () => { institutionsView.view = 'stages'; router.push('/institution') } },
  { key: 'record', icon: 'file', label: 'Mon dossier de formation', detail: 'Informations, critères et documents à déposer', run: () => shell.open('mon-dossier') },
  journey && { key: 'history', icon: 'star', label: 'Ma progression en détail', detail: 'Historique des points, quêtes et objectifs', run: () => router.push('/gamification-profile') },
  { key: 'settings', icon: 'settings', label: 'Réglages', detail: 'Photo, notifications, thème, déconnexion', run: () => shell.open('reglages') },
].filter(Boolean))

const reload = (force = false) => store.load(userId.value, { force })

watch(() => [props.active, userId.value], ([active]) => {
  if (active) void reload()
})
watch(scrollTopSignal, () => {
  if (props.active) kept.scrollToTop()
})
onMounted(() => reload())
</script>

<style scoped>
.m-profile {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 16px 28px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: var(--m-bg);
}
.m-profile::-webkit-scrollbar {
  display: none;
}
.m-profile > * {
  flex-shrink: 0;
}
.m-profile__identity {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--m-line);
  border-radius: 20px;
  background: var(--m-surface);
}
.m-profile__identity.has-house {
  padding-top: 0;
  overflow: hidden;
  border-color: var(--house);
}
/* Image de la maison en entier (blason compris), fondue vers la carte en bas. */
.m-profile__banner {
  position: relative;
  aspect-ratio: 3 / 2;
  max-height: 230px;
  margin: 0 -16px -44px;
}
.m-profile__banner-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.m-profile__banner-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 72%, var(--m-surface) 100%);
}
/* Avec une maison : la photo chevauche le bandeau à gauche, le nom passe dessous. */
.m-profile__identity.has-house .m-profile__who {
  position: relative;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.m-profile__identity.has-house .m-profile__avatar {
  width: 76px;
  height: 76px;
  border-width: 4px;
  box-shadow: 0 4px 14px rgba(2, 8, 18, 0.45);
}
.m-profile__who {
  position: relative;
  align-items: flex-end;
}
.m-profile__identity.has-house .m-profile__avatar {
  box-shadow: 0 4px 14px rgba(2, 8, 18, 0.45);
}
.m-profile__who {
  display: flex;
  align-items: center;
  gap: 14px;
}
.m-profile__avatar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  padding: 0;
  overflow: hidden;
  border: 3px solid var(--house, var(--m-line));
  border-radius: 50%;
  background: var(--m-raised);
  color: var(--m-fg);
  font: inherit;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
}
.m-profile__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.m-profile__avatar:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-profile__names {
  min-width: 0;
}
.m-profile__name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.m-profile__name-skeleton {
  width: 9rem;
  height: 20px;
  margin: 0 0 6px;
  border-radius: 6px;
}
.m-profile__sub {
  margin: 2px 0 0;
  font-weight: 500;
  color: var(--m-muted);
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}
.m-profile__level-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.8125rem;
  font-weight: 500;
}
.m-profile__level-xp {
  color: var(--m-muted);
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}
.m-profile__bar {
  display: block;
  height: 8px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 4px;
  background: var(--m-raised);
}
.m-profile__bar span {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--m-accent);
}
.m-profile__bar--thin {
  height: 6px;
}
.m-profile__quiz {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 0;
  border-radius: 18px;
  background: var(--m-accent);
  color: var(--m-on-accent);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.m-profile__quiz span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.m-profile__quiz strong {
  font-size: 0.9375rem;
}
.m-profile__quiz small {
  font-size: 0.8125rem;
}
.m-profile__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.m-profile__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 6px;
  border-radius: 16px;
  background: var(--m-surface);
  text-align: center;
}
.m-profile__stat strong {
  font-size: 1.25rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.m-profile__stat--accent strong {
  color: var(--m-accent-text);
}
.m-profile__stat span {
  color: var(--m-muted);
  font-size: 0.75rem;
}
.m-profile__streak {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -4px 0 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}
.m-profile__streak :deep(.m-icon) {
  width: 18px;
  height: 18px;
  color: var(--m-accent-text);
}
.m-profile__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
}
.m-profile__heading h2 {
  margin: 0;
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-profile__all {
  min-height: 44px;
  padding: 0 0 0 12px;
  border: 0;
  background: none;
  color: var(--m-accent-text);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
}
.m-profile__empty {
  margin: 0;
  padding: 14px;
  border-radius: 16px;
  background: var(--m-surface);
  color: var(--m-muted);
  font-size: 0.875rem;
}
.m-profile__challenges {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-profile__challenge {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border: 0;
  border-radius: 16px;
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.m-profile__challenge:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-profile__challenge-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.m-profile__challenge-name {
  min-width: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.3;
}
.m-profile__pill {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: 99px;
  background: var(--m-raised);
  color: var(--m-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}
.m-profile__pill.is-done {
  color: var(--m-ok);
}
.m-profile__challenge-xp {
  color: var(--m-muted);
  font-size: 0.75rem;
}
.m-profile__badges {
  display: flex;
  gap: 10px;
  margin: 0 -16px;
  padding: 0 16px 2px;
  overflow-x: auto;
  list-style: none;
  scrollbar-width: none;
}
.m-profile__badges::-webkit-scrollbar {
  display: none;
}
.m-profile__badge {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 76px;
}
.m-profile__badge-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--m-surface);
  font-size: 1.5rem;
}
.m-profile__badge-name {
  display: -webkit-box;
  overflow: hidden;
  color: var(--m-muted);
  font-size: 0.6875rem;
  line-height: 1.3;
  text-align: center;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.m-profile__links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
