<template>
  <div>
    <ChatBox v-if="user" :user="user" @send:message="$emit('send:message', $event)" />
    <div v-else class="flex items-center justify-center h-full">Chargement...</div>
  </div>
</template>
<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ChatBox from '../ChatBox.vue';
import { db } from '../../../../../firebase';
import { ref as dbRef, get } from 'firebase/database';
const props = defineProps({ users: Array, currentUser: Object });
const route = useRoute();
const user = ref(null);

watch(
  () => [props.users, route.params.userId],
  async ([users, userId]) => {
    if (users && userId) {
      user.value = users.find(u => u.id === userId);
      if (!user.value) {
        // Fallback fetch
        const snap = await get(dbRef(db, `Users/${userId}`));
        if (snap.exists()) user.value = { id: userId, ...snap.val() };
      }
    }
  },
  { immediate: true }
);
</script>
