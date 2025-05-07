<template>
  <div class="story-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <img :src="story.imageUrl" alt="story" class="story-image" />
      <div class="user-info">
        <img :src="story.userAvatar || defaultAvatar" class="avatar"/>
        <span>{{ story.userName }}</span>
      </div>
      <div class="timestamp">
        {{ formattedTime }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StoryModal',
  props: {
    story: { type: Object, required: true }
  },
  data() {
    return {
      defaultAvatar: 'https://ui-avatars.com/api/?name=User',
    };
  },
  computed: {
    formattedTime() {
      const date = new Date(this.story.timestamp);
      return date.toLocaleString();
    }
  }
};
</script>

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
