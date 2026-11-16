<template>
  <div class="m-story-viewer">
    <StoryModal
      v-if="group"
      :stories="group.stories"
      :start-index="startIndex"
      :author-name="group.isOwn ? 'Toi' : group.displayName"
      :author-avatar="group.avatarUrl || defaultAvatar"
      :is-own="group.isOwn"
      @viewed="stories.markViewed($event)"
      @deleted="onDeleted"
      @close="emit('close')"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import StoryModal from '@/components/social/library/StoryModal.vue'
import { useMobileStoriesStore } from '@/mobile/home/mobileStoriesStore'

// Lecteur de stories existant, ouvert comme un écran de la coque : le retour
// du téléphone le referme.
const props = defineProps({
  userId: { type: String, default: null },
  startIndex: { type: Number, default: 0 },
})
const emit = defineEmits(['close'])

const defaultAvatar = new URL('@/assets/avatar/avatar1.jpg', import.meta.url).href
const stories = useMobileStoriesStore()
const group = computed(() => stories.groups.find((item) => item.userId === props.userId) || null)

function onDeleted(storyId) {
  stories.remove(storyId)
  if (!group.value) emit('close')
}

onMounted(() => {
  if (!group.value) emit('close')
})
</script>

<style scoped>
.m-story-viewer {
  display: contents;
}
</style>
