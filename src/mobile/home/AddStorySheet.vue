<template>
  <BottomSheet title="Nouvelle story" tall @close="emit('close')">
    <AddStoryCore @uploaded="onUploaded" />
  </BottomSheet>
</template>

<script setup>
import BottomSheet from '@/mobile/ui/BottomSheet.vue'
import AddStoryCore from '@/components/social/library/AddStoryCore.vue'
import { useAuthStore } from '@/stores/authStore'
import { useMobileStoriesStore } from '@/mobile/home/mobileStoriesStore'

const emit = defineEmits(['close'])
const authStore = useAuthStore()
const stories = useMobileStoriesStore()

function onUploaded() {
  void stories.load(authStore.user?.id)
  emit('close')
}
</script>
