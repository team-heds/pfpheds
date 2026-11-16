<template>
  <section class="duel-card" aria-labelledby="quiz-duel-title">
    <div class="duel-card__preview" aria-hidden="true">
      <span class="is-me">5</span>
      <i class="pi pi-bolt"></i>
      <span>4</span>
    </div>
    <div class="duel-card__copy">
      <h2 id="quiz-duel-title">Duel de quiz</h2>
      <p>Défiez un joueur d’une autre maison sur 5 questions des quiz publiés. Chacun joue quand il veut, dans les 48 heures.</p>
      <div class="duel-card__tags" aria-label="Caractéristiques du jeu">
        <span>5 questions</span><span>20 s par question</span><span>15 XP pour la victoire</span>
      </div>
      <p v-if="toPlay > 0" class="duel-card__pending" role="status">
        <i class="pi pi-bell" aria-hidden="true"></i>
        {{ toPlay }} duel{{ toPlay > 1 ? 's' : '' }} à jouer
      </p>
    </div>
    <Button
      :label="toPlay > 0 ? 'Mes duels' : 'Jouer'"
      icon="pi pi-bolt"
      class="duel-card__play"
      aria-label="Ouvrir les duels de quiz"
      @click="router.push('/duels')"
    />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { quizDuelService, groupDuels } from '@/service/quizDuelService'

const router = useRouter()
const toPlay = ref(0)

onMounted(async () => {
  try {
    const overview = await quizDuelService.getOverview()
    toPlay.value = groupDuels(overview?.duels || []).toPlay.length
  } catch {
    // Pas joueur ou serveur sans duels : la carte reste affichée sans compteur.
    toPlay.value = 0
  }
})
</script>

<style scoped>
.duel-card {
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

.duel-card__preview {
  display: flex;
  gap: .7rem;
  align-items: center;
  justify-content: center;
  height: 7rem;
  border-radius: 12px;
  background: var(--surface-ground, #132b47);
}

.duel-card__preview span {
  display: grid;
  width: 2.6rem;
  height: 2.6rem;
  place-items: center;
  border: 2px solid var(--surface-border, #294360);
  border-radius: 50%;
  color: var(--text-color, #f7f9fc);
  font-weight: 800;
}

.duel-card__preview .is-me { border-color: #f3c300; background: #f3c300; color: #071426; }
.duel-card__preview i { color: #f3c300; font-size: 1.3rem; }

.duel-card__copy h2 { margin: 0 0 .35rem; font-size: 1.45rem; }
.duel-card__copy p { max-width: 60ch; margin: 0; color: var(--text-color-secondary, #b8c7d9); line-height: 1.5; }
.duel-card__tags { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .85rem; }
.duel-card__tags span { padding: .3rem .55rem; border-radius: 8px; background: var(--surface-ground, #132b47); color: var(--text-color-secondary, #d7e1ed); font-size: .875rem; }
.duel-card__copy .duel-card__pending { display: flex; align-items: center; gap: .4rem; margin-top: .75rem; color: var(--text-color, #f7f9fc); font-weight: 700; }
.duel-card__pending i { color: #f3c300; }
.duel-card__play { min-width: 8rem; min-height: 44px; background: #f3c300; border-color: #f3c300; color: #071426; }
.duel-card__play:hover { background: #ffdb48; border-color: #ffdb48; color: #071426; }

@media (max-width: 700px) {
  .duel-card { grid-template-columns: 1fr; }
  .duel-card__preview { height: 5rem; }
  .duel-card__play { width: 100%; }
}
</style>
