<template>
  <section class="wod-card" aria-labelledby="word-of-day-title">
    <div class="wod-card__preview" aria-hidden="true">
      <span class="is-correct">M</span>
      <span class="is-present">O</span>
      <span>T</span>
    </div>
    <div class="wod-card__copy">
      <h2 id="word-of-day-title">Mot de la semaine physio</h2>
      <p>Un terme de physiothérapie ou d’anatomie à trouver en 6 essais. Le même mot pour tout le monde, du lundi au dimanche soir.</p>
      <div class="wod-card__tags" aria-label="Caractéristiques du jeu">
        <span>1 mot par semaine</span><span>6 essais</span><span>Jusqu’à 45 XP</span>
      </div>
    </div>
    <Button
      label="Jouer"
      icon="pi pi-play"
      class="wod-card__play"
      aria-label="Jouer au mot de la semaine physio"
      @click="router.push('/mot-de-la-semaine')"
    />
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
</script>

<style scoped>
.wod-card {
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.25rem;
  border: 1px solid var(--surface-border, #294360);
  border-radius: 16px;
  background: var(--surface-card, #07182d);
  color: var(--text-color, #f7f9fc);
}

.wod-card__preview {
  display: flex;
  gap: .45rem;
  align-items: center;
  justify-content: center;
  height: 7rem;
  border-radius: 12px;
  background: var(--surface-ground, #132b47);
}

.wod-card__preview span {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  border: 2px solid var(--surface-border, #294360);
  border-radius: 10px;
  color: var(--text-color-secondary, #b8c7d9);
  font-weight: 800;
}

.wod-card__preview .is-correct { border-color: var(--brand-green, #3ecf8e); background: var(--brand-green, #3ecf8e); color: #071426; }
.wod-card__preview .is-present { border-style: dashed; border-color: var(--brand-yellow, #f3c300); color: var(--text-color, #f7f9fc); }

.wod-card__copy h2 { margin: 0 0 .35rem; font-size: 1.45rem; }
.wod-card__copy p { max-width: 60ch; margin: 0; color: var(--text-color-secondary, #b8c7d9); line-height: 1.5; }
.wod-card__tags { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .85rem; }
.wod-card__tags span { padding: .3rem .55rem; border-radius: 8px; background: var(--surface-ground, #132b47); color: var(--text-color-secondary, #d7e1ed); font-size: .875rem; }
.wod-card__play { min-width: 8rem; min-height: 44px; background: #f3c300; border-color: #f3c300; color: #071426; }
.wod-card__play:hover { background: #ffdb48; border-color: #ffdb48; color: #071426; }

@media (max-width: 700px) {
  .wod-card { grid-template-columns: 1fr; }
  .wod-card__preview { height: 5rem; }
  .wod-card__play { width: 100%; }
}
</style>
