<!-- src/views/apps/chat/UserCard.vue -->
<template>
  <div 
    class="user-card flex items-center p-2 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
    @click="$emit('click')"
  >
    <img 
      :src="user.PhotoURL || '/demo/images/avatar/default.png'" 
      class="w-12 h-12 rounded-full object-cover shadow-md mr-3"
      :alt="userDisplayName"
    />
    <div>
      <span class="font-semibold text-gray-800">{{ userDisplayName }}</span>
      <br />
      <span class="text-sm text-gray-600">{{ user.Mail }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

// Computed property pour afficher le nom de l'utilisateur
const userDisplayName = computed(() => {
  return `${props.user.UserName || 'Utilisateur'}`;
});
</script>

<style scoped>
.user-card:hover {
  background-color: #f0f0f0;
}
</style>
