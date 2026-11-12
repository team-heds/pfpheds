<template>
  <button type="button" class="m-inst-card" @click="emit('open', institution)">
    <span class="m-inst-card__photo">
      <img :src="image" alt="" loading="lazy" decoding="async" @error="showInstitutionPlaceholder" />
      <span v-if="institution.Canton" class="m-inst-card__canton">{{ institution.Canton }}</span>
    </span>
    <span class="m-inst-card__body">
      <span class="m-inst-card__name">{{ institution.Name }}</span>
      <span class="m-inst-card__place">
        <MIcon name="pin" />
        <span>{{ placeLine }}</span>
      </span>
      <span v-if="tags.length" class="m-inst-card__tags">
        <span v-for="tag in tags" :key="tag" class="m-inst-card__tag">{{ tag }}</span>
        <span v-if="moreTags" class="m-inst-card__tag m-inst-card__tag--more">+{{ moreTags }}</span>
      </span>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import MIcon from '@/mobile/ui/MIcon.vue'
import { institutionImageOf, showInstitutionPlaceholder } from '@/utils/institutionImage'
import { languageLabel } from '@/mobile/institutions/institutionHelpers'

const MAX_TAGS = 4

const props = defineProps({
  institution: { type: Object, required: true },
  /** Ce que propose l'institution : { criteria, languages, pfp }. */
  offer: { type: Object, default: null },
})
const emit = defineEmits(['open'])

const image = computed(() => institutionImageOf(props.institution))
const placeLine = computed(() => [props.institution.Locality, languageLabel(props.institution.Language)].filter(Boolean).join(' · ') || 'Lieu non précisé')
const allTags = computed(() => [...(props.offer?.pfp || []), ...(props.offer?.criteria || [])])
const tags = computed(() => allTags.value.slice(0, MAX_TAGS))
const moreTags = computed(() => Math.max(0, allTags.value.length - MAX_TAGS))
</script>

<style scoped>
.m-inst-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  background: var(--m-surface);
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 120ms ease;
}
.m-inst-card:active {
  transform: scale(0.985);
}
.m-inst-card:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-inst-card__photo {
  position: relative;
  display: block;
  height: 136px;
  background: var(--m-raised);
}
.m-inst-card__photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.m-inst-card__canton {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--m-accent);
  color: var(--m-on-accent);
  font-size: 0.75rem;
  font-weight: 600;
}
.m-inst-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px 14px;
}
.m-inst-card__name {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}
.m-inst-card__place {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--m-muted);
  font-size: 0.8125rem;
}
.m-inst-card__place :deep(.m-icon) {
  width: 15px;
  height: 15px;
}
.m-inst-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}
.m-inst-card__tag {
  padding: 2px 9px;
  border-radius: 99px;
  background: var(--m-raised);
  color: var(--m-muted);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.m-inst-card__tag--more {
  color: var(--m-fg);
}
@media (prefers-reduced-motion: reduce) {
  .m-inst-card {
    transition: none;
  }
}
</style>
