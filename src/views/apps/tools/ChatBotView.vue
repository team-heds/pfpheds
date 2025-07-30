<template>
  <Navbar />
  <div class="p-card p-mt-5 p-p-4" style="max-width:480px;margin:auto;">
    <div class="p-text-center p-mb-3">
      <i class="pi pi-comments p-text-primary" style="font-size:2rem;"></i>
      <h2 class="p-mt-2">ChatBot SI</h2>
    </div>
    <div class="p-mb-3" style="min-height:180px;max-height:300px;overflow-y:auto;">
      <div v-for="(msg, idx) in chat.messages" :key="msg.id" class="p-d-flex p-mb-2">
        <div :class="msg.sender === 'bot' ? 'p-chip p-chip-info' : 'p-chip p-chip-success p-ml-auto'">
          <span class="p-chip-text">{{ msg.content }}</span>
        </div>
      </div>
    </div>
    <div class="p-inputgroup">
      <InputText v-model="input" @keyup.enter="sendMessage" placeholder="Votre question..." />
      <Button icon="pi pi-send" @click="sendMessage" label="Envoyer" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Navbar from '@/components/common/utils/Navbar.vue'

const chat = useChatStore()
const input = ref('')

onMounted(() => {
  chat.fetchMessages()
  chat.subscribeRealtime()
})

function sendMessage() {
  if (input.value) {
    chat.sendMessage(input.value)
    input.value = ''
  }
}
</script>

<style scoped>
.p-card { box-shadow: 0 2px 12px rgba(0,0,0,0.08); border-radius: 12px; }
</style>
