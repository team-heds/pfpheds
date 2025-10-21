<template>
  <div class="video-card" @click="$emit('play', video)">
    <!-- Thumbnail -->
    <div class="video-thumbnail">
      <img 
        :src="thumbnailUrl" 
        :alt="video.title"
        @error="handleThumbnailError"
        loading="lazy"
      />
      <div class="play-overlay">
        <i class="pi pi-play"></i>
      </div>
      <div v-if="video.duration" class="duration-badge">
        {{ formatDuration(video.duration) }}
      </div>
    </div>

    <!-- Infos -->
    <div class="video-info">
      <h3 class="video-title" v-tooltip.top="video.title">{{ video.title }}</h3>
      
      <div v-if="video.in_library" class="video-meta">
        <Tag 
          :value="video.matched_by_tag ? 'Auto-assignée' : 'Assignée'" 
          severity="success" 
          class="module-tag" 
        />
        <i 
          v-if="video.matched_by_tag" 
          class="pi pi-bolt" 
          v-tooltip.top="'Assignée automatiquement via les tags Vimeo'"
          style="color: var(--orange-500); font-size: 0.875rem;"
        ></i>
      </div>

      <p v-if="video.description" class="video-description">
        {{ truncateText(video.description, 100) }}
      </p>

      <!-- Tags Vimeo -->
      <div v-if="video.vimeo_tags && video.vimeo_tags.length > 0" class="video-tags">
        <Tag 
          v-for="tag in video.vimeo_tags.slice(0, 3)" 
          :key="tag" 
          :value="tag" 
          severity="info"
          class="tag-small"
        />
        <span v-if="video.vimeo_tags.length > 3" class="more-tags">
          +{{ video.vimeo_tags.length - 3 }}
        </span>
      </div>

      <!-- Actions -->
      <div class="video-actions" @click.stop>
        <Button 
          label="Visionner" 
          icon="pi pi-play" 
          @click="$emit('play', video)"
          class="action-btn"
          size="small"
        />
        <Button 
          label="Copier lien" 
          icon="pi pi-copy" 
          outlined
          @click="$emit('copy-link', video.vimeo_url)"
          class="action-btn"
          size="small"
        />
        <Button 
          icon="pi pi-ellipsis-v" 
          text
          @click="$emit('show-menu', $event, video)"
          class="action-btn"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const props = defineProps({
  video: {
    type: Object,
    required: true
  },
  getVimeoThumbnail: {
    type: Function,
    required: true
  }
})

defineEmits(['play', 'copy-link', 'show-menu'])

const thumbnailUrl = computed(() => {
  return props.video.thumbnail_url || props.getVimeoThumbnail(props.video.vimeo_id)
})

function handleThumbnailError(event) {
  event.target.src = '/placeholder-video.jpg'
}

function formatDuration(minutes) {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h${mins > 0 ? mins : ''}`
}

function truncateText(text, length) {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<style scoped>
.video-card {
  background: var(--surface-card);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.video-thumbnail {
  position: relative;
  padding-top: 56.25%; /* 16:9 */
  background: var(--surface-100);
  overflow: hidden;
}

.video-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity 0.3s;
}

.video-thumbnail:hover .play-overlay {
  opacity: 1;
}

.play-overlay i {
  font-size: 3rem;
  color: white;
}

.duration-badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.video-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.video-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.module-tag, .year-tag {
  font-size: 0.75rem;
}

.video-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.video-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-small {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.more-tags {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  font-weight: 600;
}

.video-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
}

.action-btn {
  flex: 1;
  font-size: 0.875rem;
}
</style>
