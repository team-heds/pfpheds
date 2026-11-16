<template>
  <BottomSheet :title="challenge.name" @close="emit('close')">
    <div class="m-defi">
      <div class="m-defi__head">
        <span class="m-defi__icon" aria-hidden="true">{{ challenge.icon }}</span>
        <p v-if="challenge.description" class="m-defi__desc">{{ challenge.description }}</p>
      </div>

      <div class="m-defi__chips">
        <span v-if="challenge.difficulty">{{ difficultyLabel(challenge.difficulty) }}</span>
        <span v-if="challenge.category">{{ categoryLabel(challenge.category) }}</span>
      </div>

      <section class="m-defi__block" aria-labelledby="m-defi-progression">
        <h3 id="m-defi-progression">Progression</h3>
        <p class="m-defi__value">
          <template v-if="challenge.completed">Réussi</template>
          <template v-else>{{ progressLabel(challenge) }}</template>
        </p>
        <div
          class="m-defi__bar"
          :class="{ 'is-done': challenge.completed }"
          role="progressbar"
          :aria-valuenow="progressPercent(challenge)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`Progression : ${progressPercent(challenge)} %`"
        >
          <span :style="{ width: `${progressPercent(challenge)}%` }"></span>
        </div>
      </section>

      <section class="m-defi__block" aria-labelledby="m-defi-recompenses">
        <h3 id="m-defi-recompenses">Récompenses</h3>
        <ul class="m-defi__rewards">
          <li v-if="challenge.reward?.xp > 0"><MIcon name="star" /> {{ challenge.reward.xp }} XP pour toi et ta maison</li>
          <li v-if="challenge.reward?.badge"><MIcon name="trophy" /> {{ challenge.reward.badgeName || 'Badge associé' }}</li>
        </ul>
      </section>
    </div>

    <template v-if="target" #footer>
      <button type="button" class="m-cta" @click="go">Relever le défi</button>
    </template>
  </BottomSheet>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BottomSheet from '@/mobile/ui/BottomSheet.vue'
import MIcon from '@/mobile/ui/MIcon.vue'
import {
  categoryLabel,
  challengeTarget,
  difficultyLabel,
  progressLabel,
  progressPercent,
} from '@/mobile/challenges/challengeHelpers'

const props = defineProps({ challenge: { type: Object, required: true } })
const emit = defineEmits(['close'])
const router = useRouter()

const target = computed(() => challengeTarget(props.challenge))

function go() {
  // Le panneau se ferme par l'adresse de destination (son ancre disparaît).
  router.push(target.value)
}
</script>

<style scoped>
.m-defi {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 8px;
}
.m-defi__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.m-defi__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--m-raised);
  font-size: 1.5rem;
}
.m-defi__desc {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.45;
}
.m-defi__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.m-defi__chips span {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--m-raised);
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-defi__block h3 {
  margin: 0 0 8px;
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-defi__value {
  margin: 0 0 8px;
  font-size: 1.0625rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.m-defi__bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--m-raised);
}
.m-defi__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--m-accent);
}
.m-defi__bar.is-done span {
  background: var(--m-ok);
}
.m-defi__rewards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-defi__rewards li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
}
.m-defi__rewards :deep(.m-icon) {
  width: 18px;
  height: 18px;
  color: var(--m-accent-text);
}
</style>
