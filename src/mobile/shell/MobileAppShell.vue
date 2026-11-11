<template>
  <div ref="rootRef" class="m-shell" :class="{ 'm-shell--light': lightTheme }">
    <MobileHeader
      v-if="chrome"
      :title="title"
      :can-go-back="canGoBack"
      :heading="Boolean(nativeScreen)"
      :actions="headerActions"
      @back="goBack"
      @action="onHeaderAction"
    />

    <div class="m-shell__views">
      <!-- Onglets conçus pour le téléphone : montés à la première visite, puis gardés. -->
      <Transition
        v-for="tab in nativeTabs"
        :key="tab.key"
        :name="pageTransition"
        @before-leave="markLeaving"
        @before-enter="unmarkLeaving"
      >
        <component :is="tab.component" v-if="visited.has(tab.key)" v-show="nativeScreen === tab.key" :active="nativeScreen === tab.key" />
      </Transition>

      <router-view v-slot="{ Component, route: viewRoute }">
        <Transition :name="pageTransition" @before-leave="markLeaving" @before-enter="unmarkLeaving">
          <KeepAlive :max="8">
            <MobilePage
              v-if="!nativeScreen && Component"
              :key="pageKey(viewRoute.fullPath)"
              :component="NATIVE_PAGES[viewRoute.name]?.component || Component"
              :bare="!chrome || Boolean(NATIVE_PAGES[viewRoute.name])"
            />
          </KeepAlive>
        </Transition>
      </router-view>
    </div>

    <MobileTabBar v-if="chrome" :tabs="tabs" :active="store.activeTab" :avatar-url="stories.ownAvatarUrl" @select="selectTab" />

    <TransitionGroup name="m-overlay" tag="div" class="m-shell__overlays" :duration="300">
      <component
        :is="overlay.definition.component"
        v-for="overlay in overlays"
        :key="overlay.id"
        v-bind="{ ...overlay.definition.props, ...overlay.props }"
        @close="closeOverlay"
      />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import MobileHeader from '@/mobile/shell/MobileHeader.vue'
import MobileTabBar from '@/mobile/shell/MobileTabBar.vue'
import MobilePage from '@/mobile/shell/MobilePage.vue'
import HomeTab from '@/mobile/home/HomeTab.vue'
import InstitutionsTab from '@/mobile/institutions/InstitutionsTab.vue'
import InstitutionDetailScreen from '@/mobile/institutions/InstitutionDetailScreen.vue'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'
import { useMobileNotificationsStore } from '@/mobile/home/mobileNotificationsStore'
import { useMobileStoriesStore } from '@/mobile/home/mobileStoriesStore'
import { MOBILE_SHELL_KEY } from '@/mobile/shell/useMobileShell'
import { OVERLAYS, canRestoreOverlay } from '@/mobile/shell/overlayRegistry'
import { buildTabs, pageKey } from '@/mobile/shell/tabs'
import { useKeyboardInset } from '@/mobile/shell/useKeyboardInset'

// Écrans conçus pour le téléphone, par nom de route. Une adresse absente de
// ces tables affiche la page existante dans le cadre de la coque.
// Onglets (gardés en mémoire) :
const NATIVE_SCREENS = { FeedView: 'home', Institution: 'institutions' }
const nativeTabs = [
  { key: 'home', component: HomeTab },
  { key: 'institutions', component: InstitutionsTab },
]
// Écrans empilés qui remplacent une page existante (titre fixe dans l'en-tête,
// le nom de la page étant affiché dans l'écran lui-même) :
const NATIVE_PAGES = {
  InstitutionView: { component: InstitutionDetailScreen, title: 'Institution' },
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const store = useMobileShellStore()
const notifications = useMobileNotificationsStore()
const stories = useMobileStoriesStore()
const rootRef = ref(null)

useKeyboardInset(rootRef)

const userId = computed(() => {
  const id = authStore.user?.id
  return id && id !== 'guest-user' ? id : null
})
const tabs = computed(() => buildTabs(userId.value))
const nativeScreen = computed(() => NATIVE_SCREENS[route.name] || null)
const chrome = computed(() => route.meta?.mobileChrome !== 'none')
const canGoBack = computed(() => store.canGoBack)

// Un onglet mobile reste monté une fois visité : on y revient sans rechargement.
const visited = ref(new Set())
watch(nativeScreen, (screen) => {
  if (screen && !visited.value.has(screen)) visited.value = new Set([...visited.value, screen])
}, { immediate: true })

const overlays = computed(() => store.overlays
  .map((overlay) => ({ ...overlay, definition: OVERLAYS[overlay.name] }))
  .filter((overlay) => overlay.definition))

const pageTransition = computed(() => {
  if (store.direction === 'forward') return 'm-page-forward'
  if (store.direction === 'back') return 'm-page-back'
  return 'm-page-fade'
})

// Pendant le glissement, l'écran qui s'en va reste un instant dans la page :
// on le retire de la lecture d'écran et du service qui cherche le titre de la
// page, sinon c'est l'ancien titre qui serait annoncé.
const markLeaving = (el) => {
  el.setAttribute?.('aria-hidden', 'true')
  el.setAttribute?.('inert', '')
}
const unmarkLeaving = (el) => {
  el.removeAttribute?.('aria-hidden')
  el.removeAttribute?.('inert')
}

// --- Synchronisation avec le routeur -------------------------------------
watch(userId, (id) => {
  store.setUser(id)
  // Photo de profil de l'onglet Profil.
  if (id) void stories.loadOwnAvatar(id)
}, { immediate: true })
watch(
  () => [route.fullPath, userId.value],
  () => {
    const { redirect } = store.syncRoute(route, { canRestore: canRestoreOverlay })
    if (redirect) router.replace(redirect)
  },
  { immediate: true },
)

// Le routeur note l'adresse précédente dans l'historique : si c'est bien celle
// qu'on veut retrouver, on recule (le retour du téléphone fait pareil) ;
// sinon on remplace l'adresse, pour ne pas sortir de l'onglet.
function navigateBackTo(target) {
  if (window.history.state?.back === target) router.back()
  else router.replace(target)
}

function openOverlay(name, props = {}) {
  if (!OVERLAYS[name]) return
  const { id, hash } = store.openOverlay(name, props)
  router.push({ path: route.path, query: route.query, hash })
    .then((failure) => { if (failure) store.dropOverlay(id) })
    .catch(() => store.dropOverlay(id))
}

function closeOverlay() {
  if (store.overlays.length) navigateBackTo(store.overlayParent())
}

function goBack() {
  if (store.overlays.length) return closeOverlay()
  const target = store.backTarget()
  if (target) navigateBackTo(target)
}

function selectTab(key) {
  const target = store.tabTarget(key)
  if (target) router.push(target)
}

provide(MOBILE_SHELL_KEY, { open: openOverlay, close: closeOverlay, goBack })

// --- En-tête ---------------------------------------------------------------
// Les pages existantes annoncent leur titre dans l'onglet du navigateur une
// fois affichées : on le reprend dans l'en-tête.
const liveTitle = ref('')
let titleObserver = null
const readDocumentTitle = () => {
  const value = document.title.replace(/\s+—\s+HEdS$/, '').trim()
  liveTitle.value = /^(Plateforme|HEdS)?$/.test(value) ? '' : value
}
watch(() => route.path, () => { liveTitle.value = '' })

const title = computed(() => {
  const tab = tabs.value.find((item) => item.key === store.activeTab)
  if (nativeScreen.value || !store.canGoBack) return tab?.label || 'HEdS'
  return NATIVE_PAGES[route.name]?.title || route.meta?.title || liveTitle.value || tab?.label || 'HEdS'
})

const headerActions = computed(() => {
  if (nativeScreen.value === 'home') {
    return [
      { key: 'compose', icon: 'plus', label: 'Créer une publication', side: 'start' },
      { key: 'notifications', icon: 'bell', label: 'Notifications', badge: notifications.hasUnread },
    ]
  }
  if (store.canGoBack) return []
  if (store.activeTab === 'search') return [{ key: 'space', icon: 'grid', label: 'Mon espace' }]
  if (store.activeTab === 'profile') return [{ key: 'settings', icon: 'settings', label: 'Réglages' }]
  return []
})

function onHeaderAction(key) {
  if (key === 'compose') openOverlay('publier')
  else if (key === 'notifications') openOverlay('notifications')
  else if (key === 'space') router.push('/mobile-outils')
  else if (key === 'settings') router.push('/settings')
}

// --- Thème -----------------------------------------------------------------
// Le thème clair est une feuille de style activée à la demande : on regarde
// laquelle est en service pour ajuster les couleurs d'accent du texte.
const lightTheme = ref(false)
const detectTheme = () => {
  const light = document.querySelector('link[data-theme-link="heds"][data-theme-scheme="light"]')
  lightTheme.value = Boolean(light && !light.disabled && light.media !== 'not all')
}
watch(() => route.fullPath, detectTheme)

onMounted(() => {
  detectTheme()
  readDocumentTitle()
  const titleElement = document.querySelector('title')
  if (titleElement && window.MutationObserver) {
    titleObserver = new MutationObserver(readDocumentTitle)
    titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true })
  }
})
onBeforeUnmount(() => titleObserver?.disconnect())
</script>

<style>
/* Styles de la coque : non « scoped » car ils habillent aussi les pages
   existantes affichées dans son cadre. Tout est limité à .m-shell. */
.m-shell {
  --m-bg: var(--surface-ground, #0b213f);
  --m-surface: var(--surface-card, #071426);
  --m-raised: rgba(127, 140, 160, 0.16);
  --m-line: var(--surface-border, rgba(255, 255, 255, 0.1));
  --m-fg: var(--text-color, #f2f5fa);
  --m-muted: var(--text-color-secondary, #93a4bd);
  --m-accent: #f3c300;
  --m-on-accent: #172033;
  --m-accent-text: #f3c300;
  --m-like: #ff4d6d;
  --m-ok: #34d399;
  --m-danger: #f87171;
  --m-radius: 16px;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--m-bg);
  color: var(--m-fg);
  font-family: var(--font-family, 'Poppins', system-ui, sans-serif);
  -webkit-tap-highlight-color: transparent;
}
.m-shell--light {
  --m-accent-text: #775f00;
  --m-like: #e11d48;
  --m-ok: #15803d;
  --m-danger: #dc2626;
}
.m-shell__views {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
.m-shell__overlays {
  display: contents;
}

/* Bouton rond de 44 px : cible tactile minimale. */
.m-shell .m-icon-button {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  cursor: pointer;
  touch-action: manipulation;
}
.m-shell .m-icon-button:active {
  background: var(--m-raised);
}
.m-shell .m-icon-button:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: -2px;
}
.m-shell .m-icon-button:disabled {
  opacity: 0.45;
}

/* Éléments communs aux écrans mobiles. */
.m-shell .m-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.m-shell .m-cta,
.m-shell .m-ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
}
.m-shell .m-cta {
  width: 100%;
  border: 0;
  background: var(--m-accent);
  color: var(--m-on-accent);
}
.m-shell .m-cta:disabled {
  opacity: 0.5;
  cursor: default;
}
.m-shell .m-ghost-button {
  border: 1px solid var(--m-line);
  background: none;
  color: var(--m-fg);
  font-weight: 500;
}
.m-shell .m-cta:focus-visible,
.m-shell .m-ghost-button:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-shell .m-cta:active:not(:disabled),
.m-shell .m-ghost-button:active {
  transform: scale(0.98);
}
.m-shell .m-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: m-shell-spin 0.7s linear infinite;
}
@keyframes m-shell-spin {
  to { transform: rotate(360deg); }
}
.m-shell .m-skeleton {
  background: linear-gradient(90deg, var(--m-raised) 25%, rgba(127, 140, 160, 0.28) 37%, var(--m-raised) 63%);
  background-size: 400% 100%;
  animation: m-shell-shimmer 1.4s ease infinite;
}
@keyframes m-shell-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
.m-shell .m-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  text-align: center;
}
.m-shell .m-state__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
  border-radius: 50%;
  background: var(--m-surface);
  color: var(--m-accent-text);
}
.m-shell .m-state__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
.m-shell .m-state__text {
  margin: 0 0 8px;
  max-width: 28ch;
  font-size: 0.875rem;
  color: var(--m-muted);
}
.m-shell .m-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--m-accent) 40%, transparent);
  border-radius: 12px;
  background: rgba(243, 195, 0, 0.1);
  font-size: 0.8125rem;
  line-height: 1.4;
}
.m-shell .m-banner__action {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  background: none;
  color: var(--m-accent-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  .m-shell .m-skeleton,
  .m-shell .m-spinner {
    animation-duration: 3s;
  }
}

/* Ligne d'action : pictogramme, libellé et détail, flèche. */
.m-shell .m-row-link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 10px 12px;
  border: 0;
  border-radius: 16px;
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
}
.m-shell .m-row-link:active {
  background: var(--m-raised);
}
.m-shell .m-row-link:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-shell .m-row-link > .m-icon:last-child {
  width: 18px;
  height: 18px;
  color: var(--m-muted);
}
.m-shell .m-row-link__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--m-raised);
  color: var(--m-accent-text);
}
.m-shell .m-fiche .m-row-link__icon {
  background: var(--m-surface);
}
.m-shell .m-row-link__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.m-shell .m-row-link__text small {
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 400;
}

/* Pas de zoom d'iOS à la saisie : 16 px au minimum dans tous les champs. */
.m-shell input:not([type='checkbox']):not([type='radio']):not([type='range']),
.m-shell select,
.m-shell textarea,
.m-shell [contenteditable='true'],
.m-shell .ProseMirror {
  font-size: max(16px, 1rem);
}

/* Pages existantes : la navigation d'ordinateur n'a pas sa place dans la coque. */
.m-shell .navbar-shell,
.m-shell .mobile-bottom-nav,
.m-shell .header-bar-mobile {
  display: none !important;
}
.m-shell .m-page > * {
  max-width: 100%;
}

/* Transitions entre écrans d'un même onglet (glissement) ou entre onglets (fondu). */
.m-page-forward-enter-active,
.m-page-forward-leave-active,
.m-page-back-enter-active,
.m-page-back-leave-active {
  transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 280ms ease;
}
.m-page-forward-enter-from,
.m-page-back-leave-to {
  transform: translateX(100%);
}
.m-page-forward-leave-to,
.m-page-back-enter-from {
  transform: translateX(-24%);
  opacity: 0.4;
}
.m-page-back-leave-active,
.m-page-forward-enter-active {
  z-index: 2;
}
.m-page-fade-enter-active {
  transition: opacity 140ms ease;
}
.m-page-fade-enter-from {
  opacity: 0;
}
.m-page-fade-leave-active {
  display: none;
}
@media (prefers-reduced-motion: reduce) {
  .m-page-forward-enter-active,
  .m-page-forward-leave-active,
  .m-page-back-enter-active,
  .m-page-back-leave-active,
  .m-page-fade-enter-active {
    transition: none;
  }
}
</style>
