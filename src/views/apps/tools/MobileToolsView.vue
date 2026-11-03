<template>
  <div class="navigation-hub">
    <Navbar />

    <main class="navigation-hub__content" aria-labelledby="navigation-hub-title">
      <RouterLink to="/feed" class="navigation-hub__back">
        <i class="pi pi-arrow-left" aria-hidden="true"></i>
        Accueil
      </RouterLink>

      <header class="navigation-hub__header">
        <span class="navigation-hub__eyebrow">Plateforme HEdS</span>
        <h1 id="navigation-hub-title" tabindex="-1">Mon espace</h1>
        <p>Vos accès à la formation pratique et aux outils de la plateforme.</p>
      </header>

      <section v-for="group in groups" :key="group.key" class="navigation-hub__section" :aria-labelledby="`navigation-hub-${group.key}`">
        <h2 :id="`navigation-hub-${group.key}`">{{ group.title }}</h2>
        <div class="navigation-hub__grid">
          <RouterLink v-for="destination in group.items" :key="destination.key" :to="destination.to" class="navigation-hub__link">
            <span class="navigation-hub__icon"><i :class="destination.icon" aria-hidden="true"></i></span>
            <span class="navigation-hub__copy">
              <span class="navigation-hub__label">{{ destination.label }}</span>
              <span class="navigation-hub__description">{{ destination.description }}</span>
            </span>
            <i class="pi pi-arrow-right navigation-hub__arrow" aria-hidden="true"></i>
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/common/utils/Navbar.vue'
import { useNavigationDestinations } from '@/composables/useNavigationDestinations'

const { destinations } = useNavigationDestinations()
const sections = [
  { key: 'study', title: 'Formation pratique et vie étudiante' },
  { key: 'tools', title: 'Outils et activités' },
  { key: 'administration', title: 'Administration' },
]
const groups = computed(() => sections
  .map(section => ({ ...section, items: destinations.value.filter(item => item.section === section.key) }))
  .filter(section => section.items.length > 0))
</script>

<style scoped>
.navigation-hub { min-height: 100%; }
.navigation-hub__content { width: min(100%, 72rem); margin-inline: auto; padding: 1rem clamp(.25rem, 3vw, 2rem) 2rem; }
.navigation-hub__back { display: inline-flex; align-items: center; gap: .6rem; min-height: 44px; margin-bottom: .75rem; padding: .5rem .75rem; color: var(--text-color); border-radius: .65rem; }
.navigation-hub__back:hover { background: var(--surface-hover); }
.navigation-hub__header { max-width: 44rem; margin-bottom: 2rem; }
.navigation-hub__eyebrow { color: var(--primary-color, #f3c300); font-size: .8rem; font-weight: 600; }
.navigation-hub__header h1 { margin: .45rem 0 .65rem; font-size: clamp(1.8rem, 4vw, 2.5rem); letter-spacing: -.025em; line-height: 1.15; }
.navigation-hub__header p { margin: 0; color: var(--text-color-secondary); line-height: 1.6; }
.navigation-hub__section + .navigation-hub__section { margin-top: 2rem; }
.navigation-hub__section h2 { margin: 0 0 .85rem; font-size: 1rem; font-weight: 600; line-height: 1.4; }
.navigation-hub__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.navigation-hub__link { display: flex; align-items: center; gap: .9rem; min-width: 0; min-height: 100px; padding: 1rem; border: 1px solid var(--surface-border); border-radius: .9rem; background: var(--surface-card); color: var(--text-color); transition: border-color 150ms ease, background-color 150ms ease; }
.navigation-hub__link:hover { border-color: var(--primary-color, #f3c300); background: var(--surface-hover); }
.navigation-hub__link:active { border-color: var(--primary-color, #f3c300); }
.navigation-hub__link:focus-visible, .navigation-hub__back:focus-visible { outline: 3px solid var(--primary-color, #f3c300); outline-offset: 3px; }
.navigation-hub__icon { display: inline-flex; flex: 0 0 44px; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: .75rem; color: var(--primary-color, #f3c300); background: color-mix(in srgb, var(--primary-color, #f3c300) 12%, var(--surface-card)); font-size: 1.2rem; }
.navigation-hub__copy { display: flex; flex-direction: column; gap: .3rem; min-width: 0; }
.navigation-hub__label { font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.navigation-hub__description { color: var(--text-color-secondary); font-size: .85rem; line-height: 1.5; }
.navigation-hub__arrow { flex: 0 0 auto; margin-left: auto; color: var(--text-color-secondary); font-size: .8rem; }
@media (max-width: 40rem) {
  .navigation-hub__grid { grid-template-columns: 1fr; }
  .navigation-hub__link { min-height: 92px; padding: .9rem; }
  .navigation-hub__header { margin-bottom: 1.5rem; }
}
@media (prefers-reduced-motion: reduce) { .navigation-hub__link { transition: none; } }
@media (forced-colors: active) { .navigation-hub__link:focus-visible, .navigation-hub__back:focus-visible { outline-color: Highlight; } }
</style>
