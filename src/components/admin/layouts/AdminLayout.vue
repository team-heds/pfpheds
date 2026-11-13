<template>
  <div>
    <a href="#admin-content" class="skip-link">Aller au contenu</a>
    <Navbar />
    <div class="admin-layout" :class="{ 'has-feed': hasFeed, 'no-sidebar': noSidebar, 'is-wide': wide }">
      <template v-if="hasFeed">
        <div class="feed-left">
          <slot name="left" />
        </div>
        <main id="admin-content" class="admin-content" role="main">
          <div class="admin-header">
            <slot name="header" />
          </div>
          <slot />
        </main>
        <div class="feed-right">
          <slot name="right" />
        </div>
      </template>
      <template v-else-if="noSidebar">
        <main id="admin-content" class="admin-content" role="main">
          <div class="admin-header">
            <slot name="header" />
          </div>
          <slot />
        </main>
      </template>
      <template v-else>
        <button
          ref="mobileMenuButton"
          type="button"
          class="mobile-admin-menu"
          :aria-expanded="mobileNavigationOpen"
          aria-controls="admin-sidebar-navigation"
          @click="mobileNavigationOpen ? closeMobileNavigation({ restoreFocus: true }) : (mobileNavigationOpen = true)"
        >
          <i class="pi" :class="mobileNavigationOpen ? 'pi-times' : 'pi-bars'" aria-hidden="true" />
          <span>{{ mobileNavigationOpen ? 'Fermer le menu' : 'Menu administration' }}</span>
        </button>
        <button
          v-if="mobileNavigationOpen"
          type="button"
          class="mobile-admin-backdrop"
          aria-label="Fermer le menu administration"
          @click="closeMobileNavigation({ restoreFocus: true })"
        />
        <aside
          ref="adminSidebarContainer"
          id="admin-sidebar-navigation"
          :class="{ 'is-mobile-open': mobileNavigationOpen }"
          aria-label="Navigation admin"
        >
          <AdminSidebar />
        </aside>
        <main id="admin-content" class="admin-content" role="main">
          <div class="admin-header">
            <slot name="header" />
          </div>
          <slot />
        </main>
      </template>
    </div>
  </div>
  </template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/common/utils/Navbar.vue';
import AdminSidebar from '../lists/AdminSidebar.vue';

const { noSidebar, wide } = defineProps({
  noSidebar: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
})
const slots = useSlots()
const route = useRoute()
const mobileNavigationOpen = ref(false)
const mobileMenuButton = ref(null)
const adminSidebarContainer = ref(null)
const hasFeed = computed(() => !!slots.left || !!slots.right)

function closeMobileNavigation({ restoreFocus = false } = {}) {
  mobileNavigationOpen.value = false
  if (restoreFocus) nextTick(() => mobileMenuButton.value?.focus())
}

function focusPageTitle() {
  const title = document.querySelector('#admin-content h1')
  if (!title) return
  if (!title.hasAttribute('tabindex')) title.setAttribute('tabindex', '-1')
  title.focus()
}

function handleEscape(event) {
  if (event.key === 'Escape' && mobileNavigationOpen.value) {
    event.preventDefault()
    closeMobileNavigation({ restoreFocus: true })
  }

  if (event.key !== 'Tab' || !mobileNavigationOpen.value) return
  const focusable = Array.from(adminSidebarContainer.value?.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'
  ) || []).filter(element => element.offsetParent !== null)
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(mobileNavigationOpen, async isOpen => {
  if (!isOpen) return
  await nextTick()
  adminSidebarContainer.value
    ?.querySelector('button:not([disabled]), input:not([disabled]), a[href]')
    ?.focus()
})

watch(() => route.path, async () => {
  closeMobileNavigation()
  await nextTick()
  focusPageTitle()
})

onMounted(async () => {
  document.addEventListener('keydown', handleEscape)
  await nextTick()
  focusPageTitle()
})
onBeforeUnmount(() => document.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.skip-link:focus {
  left: var(--space-4, 1rem);
  top: var(--space-4, 1rem);
  width: auto;
  height: auto;
  background: #fff;
  color: #111;
  padding: var(--space-2, .5rem) var(--space-3, .75rem);
  border-radius: var(--radius-sm, 8px);
  box-shadow: 0 0 0 2px #111;
  z-index: 1000;
}

.admin-layout {
  width: min(100%, 120rem);
  box-sizing: border-box;
  margin-inline: auto;
  display: grid;
  grid-template-columns: minmax(16rem, 18.75rem) minmax(0, 1fr);
  gap: var(--space-6, 1.5rem);
  padding: var(--space-6, 1.5rem);
  height: calc(100dvh - var(--navbar-h, 64px) - (2 * var(--space-6, 1.5rem)));
  overflow: hidden;
}

.mobile-admin-menu,
.mobile-admin-backdrop {
  display: none;
}

.admin-layout.has-feed {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: var(--space-6, 1.5rem);
}

.admin-layout.no-sidebar {
  grid-template-columns: minmax(0, 1fr);
}

.admin-layout.is-wide:not(.has-feed):not(.no-sidebar) {
  grid-template-columns: minmax(14rem, 16rem) minmax(0, 1fr);
  gap: var(--space-4, 1rem);
  padding-inline: var(--space-4, 1rem);
}

@media (max-width: 1279px) {
  .admin-layout.has-feed {
    grid-template-columns: 280px 1fr;
  }
  .feed-right { display: none; }
}
@media (max-width: 959px) {
  .admin-layout.has-feed {
    display: block;
  }
  .feed-left, .feed-right { display: none; }
}

.admin-content {
  min-width: 0;
  /* Centralise le scroll pour toutes les pages admin */
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE et Edge */
}

.admin-content :deep(a:focus-visible),
.admin-content :deep(button:focus-visible),
.admin-content :deep(input:focus-visible),
.admin-content :deep([tabindex="0"]:focus-visible) {
  outline: 3px solid #ffcc00 !important;
  outline-offset: 3px !important;
}

@media (forced-colors: active) {
  .admin-content :deep(a:focus-visible),
  .admin-content :deep(button:focus-visible),
  .admin-content :deep(input:focus-visible),
  .admin-content :deep([tabindex="0"]:focus-visible) {
    outline-color: Highlight;
  }
}

@media (max-width: 1100px) {
  .admin-layout {
    gap: var(--space-4, 1rem);
    padding: var(--space-4, 1rem);
    height: calc(100dvh - var(--navbar-h, 64px) - (2 * var(--space-4, 1rem)));
  }
}

@media (max-width: 56rem) {
  .admin-layout:not(.has-feed):not(.no-sidebar),
  .admin-layout.is-wide:not(.has-feed):not(.no-sidebar) {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
    min-height: calc(100dvh - var(--navbar-h, 64px));
    overflow: visible;
  }

  .admin-layout:not(.has-feed):not(.no-sidebar),
  .admin-layout.is-wide:not(.has-feed):not(.no-sidebar) {
    padding: var(--space-3, .75rem);
    gap: var(--space-3, .75rem);
  }

  .mobile-admin-menu {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .65rem;
    width: fit-content;
    min-height: 44px;
    padding: .65rem .9rem;
    border: 1px solid var(--surface-border);
    border-radius: .75rem;
    background: var(--surface-card);
    color: var(--text-color);
    font: inherit;
    font-weight: 700;
    box-shadow: 0 4px 14px rgba(15, 23, 42, .08);
    cursor: pointer;
    position: sticky;
    top: .5rem;
    z-index: 70;
  }

  .mobile-admin-menu:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .mobile-admin-backdrop {
    display: block;
    position: fixed;
    inset: var(--navbar-h, 64px) 0 0;
    z-index: 79;
    border: 0;
    background: rgba(2, 8, 23, .58);
    cursor: pointer;
  }

  .admin-layout:not(.has-feed):not(.no-sidebar) > aside {
    position: fixed;
    top: calc(var(--navbar-h, 64px) + .75rem);
    bottom: .75rem;
    left: .75rem;
    z-index: 80;
    width: min(88vw, 22rem);
    min-width: 0;
    transform: translateX(calc(-100% - 1.5rem));
    visibility: hidden;
    pointer-events: none;
    transition: transform .22s cubic-bezier(.2, .8, .2, 1), visibility 0s linear .22s;
  }

  .admin-layout:not(.has-feed):not(.no-sidebar) > aside.is-mobile-open {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
    transition-delay: 0s;
  }

  .admin-layout:not(.has-feed):not(.no-sidebar) > aside :deep(.admin-sidebar) {
    width: 100%;
    min-width: 0;
    max-width: none;
    height: 100%;
    max-height: none;
  }

  .admin-content { height: auto; overflow: visible; }
  .admin-header { position: static; }
}

.admin-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 5;
  padding-bottom: var(--space-3, .75rem);
  margin-bottom: var(--space-3, .75rem);
}

.feed-left,
.feed-right {
  height: 100%;
  overflow-y: hidden;
}
</style>
