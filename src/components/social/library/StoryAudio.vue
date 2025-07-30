<template>
  <div class="story-audio">
    <audio :src="src" controls class="audio-player"></audio>
    <div v-if="caption" class="audio-caption">{{ caption }}</div>
  </div>
</template>

<script>
export default {
  name: 'StoryAudio',
  props: {
    src: { type: String, required: true },
    caption: { type: String, default: '' }
  }
}
</script>

<style scoped>
.story-audio {
  background: #f8faff;
  border-radius: 1.2rem;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 12px 0 rgba(80,180,255,0.08);
  text-align: center;
  margin-top: 1rem;
}
.audio-player {
  width: 90%;
  outline: none;
  margin-bottom: 0.5rem;
}
.audio-caption {
  font-size: 0.98rem;
  color: #3b3b3b;
  margin-top: 0.2rem;
}
</style>
