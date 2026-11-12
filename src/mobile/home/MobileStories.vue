<template>
  <section class="m-stories" aria-label="Stories">
    <div class="m-strip">
      <button type="button" class="m-story m-story--add" @click="shell.open('nouvelle-story')">
        <span class="m-story__ring" aria-hidden="true">
          <img v-if="stories.ownAvatarUrl" :src="stories.ownAvatarUrl" alt="" class="m-story__avatar" />
          <span class="m-story__plus"><MIcon name="plus" /></span>
        </span>
        <span class="m-story__name">Ta story</span>
      </button>

      <button
        v-for="group in stories.groups"
        :key="group.userId"
        type="button"
        class="m-story"
        :class="{ 'is-unseen': group.hasUnseen, 'is-own': group.isOwn }"
        :aria-label="storyLabel(group)"
        @click="openGroup(group)"
      >
        <span class="m-story__ring" aria-hidden="true">
          <img v-if="group.avatarUrl" :src="group.avatarUrl" alt="" class="m-story__avatar" loading="lazy" />
          <span v-else class="m-story__initials">{{ initialsOf(group.displayName) }}</span>
        </span>
        <span class="m-story__name">{{ group.isOwn ? 'Toi' : firstName(group.displayName) }}</span>
      </button>
    </div>
    <p v-if="stories.error" class="m-stories__error" role="status">{{ stories.error }}</p>
  </section>
</template>

<script setup>
import MIcon from '@/mobile/ui/MIcon.vue'
import { firstUnseenIndex } from '@/service/storiesService'
import { useMobileStoriesStore } from '@/mobile/home/mobileStoriesStore'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import { initialsOf } from '@/mobile/home/postMedia'

const stories = useMobileStoriesStore()
const shell = useMobileShell()

const firstName = (name) => String(name || '').split('@')[0].trim().split(/\s+/)[0] || 'Utilisateur'

const storyLabel = (group) => {
  const count = group.stories.length > 1 ? `les ${group.stories.length} stories` : 'la story'
  const who = group.isOwn ? 'toi' : group.displayName
  return `Voir ${count} de ${who}${group.hasUnseen ? ', non vue' : ''}`
}

function openGroup(group) {
  shell.open('story', { userId: group.userId, startIndex: firstUnseenIndex(group) })
}
</script>

<style scoped>
.m-stories {
  min-width: 0;
}
.m-strip {
  display: flex;
  gap: 10px;
  margin: 0 -16px;
  padding: 2px 16px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.m-strip::-webkit-scrollbar {
  display: none;
}
.m-story {
  flex: 0 0 auto;
  width: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--m-muted);
  font: inherit;
  font-size: 0.6875rem;
  line-height: 1.3;
  cursor: pointer;
  touch-action: manipulation;
}
.m-story__ring {
  position: relative;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border: 2px solid var(--m-line);
  border-radius: 50%;
  background: var(--m-raised);
}
.m-story.is-unseen .m-story__ring {
  border-color: var(--m-accent);
}
.m-story--add .m-story__ring {
  border-style: dashed;
  color: var(--m-accent-text);
}
.m-story__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
}
.m-story__initials {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--m-fg);
}
.m-story--add .m-story__avatar + .m-story__plus {
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 2px solid var(--m-bg);
  border-radius: 50%;
  background: var(--m-accent);
  color: var(--m-on-accent);
}
.m-story--add .m-story__avatar + .m-story__plus :deep(.m-icon) {
  width: 14px;
  height: 14px;
  stroke-width: 2.4;
}
.m-story__name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-story:focus-visible {
  outline: none;
}
.m-story:focus-visible .m-story__ring {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-story:active .m-story__ring {
  transform: scale(0.96);
}
.m-stories__error {
  margin: 6px 0 0;
  font-size: 0.75rem;
  color: var(--m-muted);
}
</style>
