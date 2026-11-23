<template>
  <div class="header-bar-mobile">
    <router-link to="/feed" aria-label="HEdS — Accueil" class="school-logo-link">
      <img :src="hedsIcon" alt="" class="school-logo" />
    </router-link>
  </div>
</template>

<script>
import hedsIcon from '@/assets/images/hespicto.png'
export default {
  name: "HeaderIcons",
  setup() {
    return { hedsIcon };
  }
}
</script>

<style scoped>
.header-bar-mobile {
  /* Défile avec la page : une barre collante transparente passait par-dessus les publications. */
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  height: 56px;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  background-color: transparent;
}
.school-logo {
  height: 40px;
  width: 40px;
  object-fit: contain;
  border-radius: 12px;
}
.school-logo-link {
  width: 50px;
  height: 50px;
  font-size: 24px;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: var(--primary-text-color, var(--primary-color));
  text-decoration: none;
}
.school-logo-link:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
}
@media (min-width: 769px) {
  .header-bar-mobile { display: none; }
}
</style>
