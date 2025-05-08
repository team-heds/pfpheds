<template>
  <div class="story-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <img :src="currentStory.imageUrl" alt="story" class="story-image" />
      <div class="user-info">
        <img :src="currentStory.userAvatar || defaultAvatar" class="avatar"/>
        <span>{{ currentStory.userName }}</span>
      </div>
      <div class="timestamp">
        {{ formattedTime }}
      </div>
      <div v-if="isMultiple" class="story-nav">
        <button @click="prevStory" :disabled="currentIndex === 0">&lt;</button>
        <span>{{ currentIndex + 1 }}/{{ story.length }}</span>
        <button @click="nextStory" :disabled="currentIndex === story.length - 1">&gt;</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StoryModal',
  props: {
    story: { type: [Object, Array], required: true }
  },
  data() {
    return {
      defaultAvatar: 'https://ui-avatars.com/api/?name=User',
      currentIndex: 0,
    };
  },
  computed: {
    isMultiple() {
      return Array.isArray(this.story);
    },
    currentStory() {
      return this.isMultiple ? this.story[this.currentIndex] : this.story;
    },
    formattedTime() {
      const date = new Date(this.currentStory.timestamp);
      return date.toLocaleString();
    }
  },
  methods: {
    nextStory() {
      if (this.currentIndex < this.story.length - 1) {
        this.currentIndex++;
      }
    },
    prevStory() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    }
  }
};
</script>

<style scoped>
.story-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  justify-content: center;
}
.story-nav button {
  background: #2196f3;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  cursor: pointer;
}
.story-nav button:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}
</style>

<style scoped>
.story-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.close-btn {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 1.7rem;
  border: none;
  background: none;
  color: #333;
  cursor: pointer;
}
.story-image {
  max-width: 70vw;
  max-height: 60vh;
  border-radius: 10px;
  margin-bottom: 12px;
  object-fit: contain;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
.timestamp {
  color: #888;
  font-size: 0.85rem;
  margin-top: 4px;
}
</style>
