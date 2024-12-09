<script setup>
import { ref } from 'vue';

defineProps({
  user: {
    type: Object,
    required: true
  }
});

const defaultUserId = ref(123);
const emit = defineEmits(['send:message']);
const op = ref(null);
const textContent = ref('');

const emojis = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '😂',
  '🤣',
  '😇',
  '😉',
  '😊',
  '🙂',
  '🙃',
  '😋',
  '😌',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😙',
  '😚',
  '🤪',
  '😜',
  '😝',
  '😛',
  '🤑',
  '😎',
  '🤓',
  '🧐',
  '🤠',
  '🥳',
  '🤗',
  '🤡',
  '😏',
  '😶',
  '😐',
  '😑',
  '😒',
  '🙄',
  '🤨',
  '🤔',
  '🤫',
  '🤭',
  '🤥',
  '😳',
  '😞',
  '😟',
  '😠',
  '😡',
  '🤬',
  '😔',
  '😟',
  '😠',
  '😡',
  '🤬',
  '😔',
  '😕',
  '🙁',
  '😬',
  '🥺',
  '😣',
  '😖',
  '😫',
  '😩',
  '🥱',
  '😤',
  '😮',
  '😱',
  '😨',
  '😰',
  '😯',
  '😦',
  '😧',
  '😢',
  '😥',
  '😪',
  '🤤'
];

const parseDate = (timestamp) => {
  return new Date(timestamp).toTimeString().split(':').slice(0, 2).join(':');
};

const sendMessage = () => {
  if (textContent.value == '' || textContent.value === ' ') {
    return;
  }
  let message = {
    text: textContent.value,
    ownerId: 123,
    createdAt: new Date().getTime()
  };

  emit('send:message', message);
  textContent.value = '';
};

const addEmoji = (emoji) => {
  textContent.value = textContent.value + emoji;
  op.value.hide();
};
</script>

<template>
  <div class="flex flex-column h-full">
    <div class="flex align-items-center border-bottom-1 surface-border p-3 lg:p-6">
      <div class="relative flex align-items-center mr-3">
        <img :src="'/demo/images/avatar/' + user.image" :alt="user.name" class="w-4rem h-4rem border-circle shadow-4" />
        <span class="w-1rem h-1rem border-circle border-2 surface-border absolute bottom-0 right-0" :class="{ 'bg-green-400': user.status === 'active', 'bg-red-400': user.status === 'busy', 'bg-yellow-400': user.status === 'away' }"></span>
      </div>
      <div class="mr-2">
        <span class="text-900 font-semibold block">{{ user.name }}</span>
        <span class="text-700">Last active 1 hour ago</span>
      </div>
      <div class="flex align-items-center ml-auto">
        <Button type="button" icon="pi pi-ellipsis-v" outlined severity="secondary" rounded></Button>
      </div>
    </div>
    <div class="user-message-container p-3 md:px-4 lg:px-6 lg:py-4 mt-2 overflow-y-auto" style="max-height: 53vh">
      <div v-for="message in user.messages" :key="message">
        <div v-if="message.ownerId !== 123" class="grid grid-nogutter mb-4">
          <div class="mr-3 mt-1">
            <img :src="'/demo/images/avatar/' + user.image" :alt="user.name" class="w-3rem h-3rem border-circle shadow-4" />
          </div>
          <div class="col mt-3">
            <p class="text-900 font-semibold mb-3">{{ user.name }}</p>
            <span class="text-700 inline-block font-medium border-1 surface-border p-3 white-space-normal border-round" style="word-break: break-word; max-width: 80%">{{ message.text }}</span>
            <p class="text-700 mt-3">{{ parseDate(message.createdAt) }}<i class="pi pi-check ml-2 text-green-400"></i></p>
          </div>
        </div>

        <div v-if="message.ownerId === defaultUserId" class="grid grid-nogutter mb-4">
          <div class="col mt-3 text-right">
            <span class="inline-block text-left font-medium border-1 surface-border bg-primary-100 text-primary-900 p-3 white-space-normal border-round" style="word-break: break-word; max-width: 80%">{{ message.text }}</span>
            <p class="text-700 mt-3">{{ parseDate(message.createdAt) }} <i class="pi pi-check ml-2 text-green-400"></i></p>
          </div>
        </div>
      </div>
    </div>
    <div class="p-3 md:p-4 lg:p-6 flex flex-column sm:flex-row align-items-center mt-auto border-top-1 surface-border gap-3">
      <InputText id="message" type="text" placeholder="Type a message" class="flex-1 w-full sm:w-auto border-round" v-model="textContent" @keydown.enter="sendMessage()" />
      <div class="flex w-full sm:w-auto gap-3">
        <Button class="p-button w-full sm:w-auto justify-content-center text-xl" severity="secondary" @click="(event) => $refs.op.toggle(event)">😀</Button>
        <Button label="Send" icon="pi pi-send" class="w-full sm:w-auto" @click="sendMessage()"></Button>
      </div>
    </div>
  </div>

  <OverlayPanel ref="op" class="w-full sm:w-30rem">
    <Button v-for="emoji in emojis" :key="emoji" @click="addEmoji(emoji)" type="button" :label="emoji" class="p-2 text-2xl" text></Button>
  </OverlayPanel>
</template>
