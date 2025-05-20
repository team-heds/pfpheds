<template>
  <div class="mobile-chat-layout">
    <div class="mobile-chat-header">
      <router-link v-if="$route.name === 'MobileChatBox'" :to="{ name: 'MobileChatSidebar' }" class="back-btn">
        <i class="pi pi-arrow-left"></i>
      </router-link>
      <span>{{ headerTitle }}</span>
    </div>
    <router-view :users="users" :currentUser="currentUser" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '../../../../../firebase';
import { ref as dbRef, get } from 'firebase/database';

const users = ref([]);
const currentUser = ref(null);

onMounted(async () => {
  // Récupère tous les users
  const snap = await get(dbRef(db, 'Users'));
  if (snap.exists()) {
    users.value = Object.entries(snap.val()).map(([id, u]) => ({ id, ...u }));
  }
  // TODO: Récupère le user courant si besoin (auth)
});

const route = useRoute();
const headerTitle = computed(() => {
  if (route.name === 'MobileChatSidebar') return 'Messagerie';
  if (route.name === 'MobileChatBox') return 'Discussion';
  return '';
});
</script>

<style scoped>
.mobile-chat-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-ground, #fafbfc);
}
.mobile-chat-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  font-weight: bold;
  border-bottom: 1px solid #eee;
  background: var(--surface-card, #fff);
  min-height: 56px;
  font-size: 1.1rem;
}
.back-btn {
  margin-right: 1rem;
  color: var(--primary-color, #1976d2);
  font-size: 1.3rem;
  text-decoration: none;
}
</style>
