<!-- src/views/apps/chat/UserCard.vue -->
<template>
  <div class="flex flex-nowrap justify-content-between align-items-center border-1 surface-border border-round p-3 cursor-pointer select-none hover:surface-hover transition-colors transition-duration-150" tabindex="0">
    <div class="flex align-items-center">
      <div class="relative md:mr-3">
        <img :src="user.PhotoURL || 'src/assets/avatar/avatar1.jpg'"  :alt="userDisplayName" class="w-3rem h-3rem border-circle shadow-4" />
        <span
          class="w-1rem h-1rem border-circle border-2 surface-border absolute"
          :class="{ 'bg-green-400': user.status === 'active', 'bg-red-400': user.status === 'busy', 'bg-yellow-400': user.status === 'away' }"
          style="bottom: 2px; right: 2px"
        ></span>
      </div>



      <div class="flex-column hidden md:flex">
        <span class="text-900 font-semibold block">{{ userDisplayName }}</span>
        <span v-if="lastReceivedMessageAt" class="block text-600 text-overflow-ellipsis overflow-hidden white-space-nowrap w-10rem text-sm">
          {{ formatDate(lastReceivedMessageAt) }}
        </span>
      </div>

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
