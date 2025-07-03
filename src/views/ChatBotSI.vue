<template>
  <Navbar />
  <div class="p-card p-mt-5 p-p-4" style="max-width:480px;margin:auto;">
    <div class="p-text-center p-mb-3">
      <i class="pi pi-comments p-text-primary" style="font-size:2rem;"></i>
      <h2 class="p-mt-2">ChatBot SI</h2>
    </div>
    <div class="p-mb-3" style="min-height:180px;max-height:300px;overflow-y:auto;">
      <div v-for="(msg, idx) in chatbotMessages" :key="idx" class="p-d-flex p-mb-2">
        <div :class="msg.sender === 'bot' ? 'p-chip p-chip-info' : 'p-chip p-chip-success p-ml-auto'">
          <span class="p-chip-text">{{ msg.text }}</span>
        </div>
      </div>
    </div>
    <div class="p-inputgroup">
      <InputText v-model="userInput" @keyup.enter="sendMessage" placeholder="Votre question..." />
      <Button icon="pi pi-send" @click="sendMessage" label="Envoyer" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Navbar from '@/components/Utils/Navbar.vue'

const chatbotMessages = ref([
  { sender: 'bot', text: 'Bonjour, je suis le ChatBot SI. Posez-moi une question !' }
]);
const userInput = ref('');

function sendMessage() {
  if (!userInput.value.trim()) return;
  chatbotMessages.value.push({ sender: 'user', text: userInput.value });
  setTimeout(() => {
    chatbotMessages.value.push({ sender: 'bot', text: '(Réponse automatique du ChatBot SI)' });
  }, 400);
  userInput.value = '';
}
</script>

<style scoped>
.p-card { box-shadow: 0 2px 12px rgba(0,0,0,0.08); border-radius: 12px; }
</style>
