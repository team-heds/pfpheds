<template>
  <Navbar />
  <main class="chatbot-page" :aria-labelledby="titleId">
    <header class="chatbot-page__header">
      <span class="chatbot-page__icon" aria-hidden="true"><i class="pi pi-comments"></i></span>
      <h1 :id="titleId">{{ title }}</h1>
    </header>

    <section ref="log" class="chatbot-page__messages" role="log" aria-live="polite" aria-label="Conversation">
      <p v-if="!chat.messages.length" class="chatbot-page__empty">
        Posez votre première question. Les réponses s’affichent ici.
      </p>
      <p
        v-for="msg in chat.messages"
        :key="msg.id"
        class="chatbot-page__message"
        :class="{ 'chatbot-page__message--mine': msg.sender !== 'bot' }"
      >{{ msg.content }}</p>
    </section>

    <form class="chatbot-page__composer" @submit.prevent="sendMessage">
      <InputText v-model="input" aria-label="Votre question" placeholder="Votre question" class="flex-1" />
      <Button type="submit" icon="pi pi-send" label="Envoyer" :disabled="!input.trim()" />
    </form>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Navbar from '@/components/common/utils/Navbar.vue'

const route = useRoute()
const chat = useChatStore()
const input = ref('')
const log = ref(null)
const titleId = 'chatbot-title'
const title = computed(() => (route.name === 'ChatBotSI' ? 'Assistant soins infirmiers' : 'Assistant'))

const scrollToEnd = async () => {
  await nextTick()
  if (log.value) log.value.scrollTop = log.value.scrollHeight
}

onMounted(() => {
  chat.fetchMessages()
  chat.subscribeRealtime()
})

watch(() => chat.messages.length, scrollToEnd)

function sendMessage() {
  const question = input.value.trim()
  if (!question) return
  chat.sendMessage(question)
  input.value = ''
}
</script>

<style scoped>
/* Gabarit « focus » : la conversation occupe la hauteur, la saisie reste en bas. */
.chatbot-page {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  width: min(48rem, calc(100% - 2 * var(--app-page-gutter)));
  height: calc(100dvh - var(--app-navbar-height) - 2 * var(--app-space-6));
  min-height: 24rem;
  margin: var(--app-space-6) auto;
}

.chatbot-page__header {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
}

.chatbot-page__header h1 {
  margin: 0;
  font-size: var(--app-font-size-xl);
  font-weight: var(--app-font-weight-semibold);
}

.chatbot-page__icon {
  display: inline-grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: var(--app-radius-lg);
  background: var(--app-color-brand);
  color: var(--app-color-on-brand);
}

.chatbot-page__messages {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--app-space-2);
  min-height: 0;
  overflow-y: auto;
  padding: var(--app-space-4);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-xl);
  background: var(--app-color-surface);
}

.chatbot-page__empty {
  margin: auto;
  color: var(--app-color-text-muted);
  text-align: center;
}

.chatbot-page__message {
  max-width: min(36rem, 85%);
  margin: 0;
  padding: var(--app-space-2) var(--app-space-3);
  border-radius: var(--app-radius-lg);
  background: var(--app-color-section);
  color: var(--app-color-text);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.chatbot-page__message--mine {
  align-self: flex-end;
  background: var(--app-color-brand);
  color: var(--app-color-on-brand);
}

.chatbot-page__composer {
  display: flex;
  gap: var(--app-space-2);
  padding-bottom: env(safe-area-inset-bottom);
}

@media (max-width: 768px) {
  .chatbot-page {
    width: 100%;
    height: 100%;
    min-height: 0;
    margin: 0;
    padding: var(--app-space-3);
  }
}
</style>
