<template>
  <div class="game-root">
    <Navbar />
    <div class="game-content">
      <div class="game-header">
        <i class="pi pi-star text-3xl text-primary mr-3" />
        <h2 class="game-title">Espace Jeux</h2>
      </div>
      <div class="game-placeholder">
        <p>Bienvenue dans l'espace jeux !<br>Des jeux pédagogiques et ludiques seront bientôt disponibles ici.</p>
        <i class="pi pi-spin pi-spinner text-4xl text-primary mt-4" />
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from '@/components/common/utils/Navbar.vue';
</script>

<style scoped>
.game-root {
  min-height: 100vh;
  background: none;
  overflow-y: auto;
  padding-top: 20px;
}
.game-content {
  max-width: 700px;
  margin: 0 auto;
  padding: 2.5rem 1.2rem 2.5rem 1.2rem;
  border-radius: 1.5rem;
}
.game-header {
  display: flex;
  align-items: center;
  margin-bottom: 2.2rem;
}
.game-title {
  font-size: 2.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color, #222);
}
.game-placeholder {
  background: var(--surface-card, #fff);
  border-radius: 1.1rem;
  box-shadow: 0 2px 14px rgba(60,60,60,0.10);
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: var(--text-color, #444);
  font-size: 1.13em;
}
</style>
