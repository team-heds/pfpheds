<template>
  <section class="th-card" aria-labelledby="treasure-hunt-title">
    <div class="th-card__preview" aria-hidden="true">
      <i class="pi pi-map"></i>
      <span class="th-card__dot th-card__dot--found"></span>
      <span class="th-card__dot th-card__dot--found"></span>
      <span class="th-card__dot"></span>
    </div>
    <div class="th-card__copy">
      <h2 id="treasure-hunt-title">Chasse au trésor</h2>
      <p>Des QR codes sont cachés dans l’école. Suivez les indices, scannez-les et faites gagner des points à votre maison.</p>
      <div class="th-card__tags" aria-label="Caractéristiques du jeu">
        <span>Sur le campus</span><span>5 à 50 XP par étape</span><span>+20 XP si tout est trouvé</span>
      </div>
    </div>
    <Button
      label="Voir les chasses"
      icon="pi pi-compass"
      class="th-card__play"
      @click="router.push('/chasse-au-tresor')"
    />
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
</script>

<style scoped>
.th-card {
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

.th-card__preview {
  position: relative;
  display: flex;
  gap: .55rem;
  align-items: flex-end;
  justify-content: center;
  height: 7rem;
  padding-bottom: 1.2rem;
  border-radius: 12px;
  background: var(--surface-ground, #132b47);
}

.th-card__preview i { position: absolute; top: .9rem; left: 50%; color: #f3c300; font-size: 2.1rem; transform: translateX(-50%); }
.th-card__dot { width: 1.35rem; height: 1.35rem; border: 2px solid #f3c300; border-radius: 50%; }
.th-card__dot--found { background: #f3c300; }

.th-card__copy h2 { margin: 0 0 .35rem; font-size: 1.45rem; }
.th-card__copy p { max-width: 60ch; margin: 0; color: var(--text-color-secondary, #b8c7d9); line-height: 1.5; }
.th-card__tags { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .85rem; }
.th-card__tags span { padding: .3rem .55rem; border-radius: 8px; background: var(--surface-ground, #132b47); color: var(--text-color-secondary, #d7e1ed); font-size: .875rem; }
.th-card__play { min-width: 8rem; min-height: 44px; background: #f3c300; border-color: #f3c300; color: #071426; }
.th-card__play:hover { background: #ffdb48; border-color: #ffdb48; color: #071426; }

@media (max-width: 700px) {
  .th-card { grid-template-columns: 1fr; }
  .th-card__preview { height: 5rem; padding-bottom: .9rem; }
  .th-card__preview i { top: .5rem; font-size: 1.6rem; }
  .th-card__play { width: 100%; }
}
</style>
