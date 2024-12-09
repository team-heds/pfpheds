<script setup>
import { ref, nextTick, onMounted } from 'vue';
import ChatBox from './ChatBox.vue';
import ChatSidebar from './ChatSidebar.vue';
import Navbar from '@/components/Utils/Navbar.vue'

const activeUserId = ref(1);
const users = ref([]);

onMounted(async () => {
  users.value = await getUserData();
  scrollToLastMessage();
});

const getUserData = async () => {
  const response = await fetch('/demo/data/chat.json');
  const { data } = await response.json();

  return data;
};

const changeActiveUser = (user) => {
  activeUserId.value = user.id;
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
  const element = document.querySelector('.user-message-container');

  await nextTick(() => {
    element.scroll({ top: element.scrollHeight });
  });
};
</script>

<template>
  <Navbar title="Chat"></Navbar>
  <div class="flex flex-column md:flex-row gap-5" style="min-height: 81vh">
    <div class="md:w-25rem card p-0">
      <ChatSidebar @change:active:user="changeActiveUser" :users="users"></ChatSidebar>
    </div>
    <div class="flex-1 card p-0">
      <ChatBox @send:message="sendMessage" :user="findActiveUser()"></ChatBox>
    </div>
  </div>
</template>
