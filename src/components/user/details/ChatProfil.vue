<script setup>
import { ref, nextTick, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import ChatBox from '@/views/apps/chat/ChatBox.vue'
import ChatSidebar from '@/views/apps/chat/ChatSidebar.vue';

const activeUserId = ref(1);
const users = ref([]);
const currentUser = ref({});
const route = useRoute();

const getUserData = async () => {
  const response = await fetch('/demo/data/chat.json');
  const { data } = await response.json();

  return data;
};

const selectUserFromRoute = () => {
  const userIdFromUrl = route.query.user;
  if (userIdFromUrl && users.value.length > 0) {
    const match = users.value.find(u => String(u.id) === String(userIdFromUrl));
    if (match) {
      activeUserId.value = match.id;
      currentUser.value = match;
      return;
    }
  }
  // Si pas trouvé, sélectionne le premier utilisateur par défaut
  activeUserId.value = users.value[0]?.id || 1;
  currentUser.value = users.value[0] || {};
};

const changeActiveUser = (user) => {
  activeUserId.value = user.id;
  currentUser.value = user;
  scrollToLastMessage();
};

const sendMessage = (message) => {
  const activeUser = findActiveUser();
  activeUser.messages.push(message);
  scrollToLastMessage();
};

const findActiveUser = () => {
  return users.value.find((user) => user.id === activeUserId.value) || {};
};

const scrollToLastMessage = async () => {
  await nextTick(() => {
    const element = document.querySelector('.user-message-container');
    if (element) {
      element.scroll({ top: element.scrollHeight, behavior: 'smooth' });
    }
  });
};

onMounted(async () => {
  users.value = await getUserData();
  selectUserFromRoute();
  scrollToLastMessage();
});

watch(() => route.query.user, () => {
  selectUserFromRoute();
});

watch(users, () => {
  selectUserFromRoute();
});
</script>

<template>
  <div class="grid">
    <div class="col-12 md:col-8 lg:col-12">
      <div class="flex flex-column md:flex-row gap-5">
        <div class="md:w-25rem card p-0">
          <ChatSidebar @change:active:user="changeActiveUser" :users="users"></ChatSidebar>
        </div>
        <div class="flex-1 card p-0">
          <ChatBox @send:message="sendMessage" :user="findActiveUser()"></ChatBox>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your custom styles here */
</style>