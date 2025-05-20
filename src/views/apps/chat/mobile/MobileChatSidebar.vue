<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center py-6">
      <span>Chargement...</span>
    </div>
    <ChatSidebar v-else :users="users" :currentUser="currentUser" @change:active:user="goToChat" />
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import ChatSidebar from '../ChatSidebar.vue';
import { useRouter } from 'vue-router';
const props = defineProps({ users: Array, currentUser: Object });
const router = useRouter();
const loading = ref(true);

watch(
  () => props.users,
  (val) => { loading.value = !val || val.length === 0; },
  { immediate: true }
);

function goToChat(user) {
  router.push({ name: 'MobileChatBox', params: { userId: user.id } });
}
</script>
