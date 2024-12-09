<!-- src/views/apps/chat/UserCard.vue -->
<template>
  <div 
    class="user-card flex items-center p-2 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
    @click="$emit('click')"
  >
    <img 
      :src="user.PhotoURL || '/demo/images/avatar/default.png'" 
      style="width: 40px; height:40px;" 
      :alt="userDisplayName"
      class="rounded-full object-cover shadow-md"
    />
    <div class="ml-4 flex-1">
      <div class="flex justify-between items-center">
        <span class="font-semibold text-gray-800">{{ userDisplayName }}</span>
        <span v-if="lastReceivedMessageAt" class="text-sm text-gray-500">
          {{ formatDate(lastReceivedMessageAt) }}
        </span>
      </div>
      <p class="text-sm text-gray-600">{{ user.Mail }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  lastReceivedMessageAt: {
    type: Number, // Timestamp en millisecondes
    default: 0
  }
});

// Computed property pour afficher le nom de l'utilisateur
const userDisplayName = computed(() => {
  return `${props.user.UserName || 'Utilisateur'}`;
});

/**
 * Formate l'horodatage en une chaîne de temps lisible.
 * @param {number} timestamp 
 * @returns {string}
 */
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.user-card:hover {
  background-color: #f0f0f0;
}
</style>
