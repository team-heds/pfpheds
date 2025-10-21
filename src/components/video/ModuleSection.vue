<template>
  <div class="module-section">
    <div class="module-header" @click="toggleExpanded">
      <div class="module-info">
        <div class="module-title-row">
          <h2>
            <i class="pi pi-folder"></i>
            {{ moduleGroup.module_name }}
          </h2>
          <i :class="['pi', expanded ? 'pi-chevron-up' : 'pi-chevron-down']" class="toggle-icon"></i>
        </div>
        <p v-if="moduleGroup.module_description" class="module-description">
          {{ moduleGroup.module_description }}
        </p>
        <div class="module-stats">
          <Tag :value="`${moduleGroup.videos.length} vidéo${moduleGroup.videos.length > 1 ? 's' : ''}`" severity="info" />
          <Tag 
            v-if="autoMatchedCount > 0" 
            :value="`${autoMatchedCount} auto`" 
            severity="warning" 
            icon="pi pi-bolt"
            v-tooltip.top="`${autoMatchedCount} vidéo(s) assignée(s) automatiquement via les tags Vimeo`"
          />
          <span v-if="totalDuration" class="stat-item">
            <i class="pi pi-clock"></i>
            {{ totalDuration }}
          </span>
        </div>
      </div>
    </div>
    
    <transition name="expand">
      <div v-if="expanded" class="module-content">
        <div class="module-videos-grid">
          <VideoCard
            v-for="video in moduleGroup.videos" 
            :key="video.vimeo_id"
            :video="video"
            :get-vimeo-thumbnail="getVimeoThumbnail"
            @play="(v) => $emit('play', v)"
            @copy-link="(url) => $emit('copy-link', url)"
            @show-menu="(e, v) => $emit('show-menu', e, v)"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import VideoCard from './VideoCard.vue'
import Tag from 'primevue/tag'

const props = defineProps({
  moduleGroup: {
    type: Object,
    required: true
  },
  getVimeoThumbnail: {
    type: Function,
    required: true
  },
  initialExpanded: {
    type: Boolean,
    default: true
  }
})

defineEmits(['play', 'copy-link', 'show-menu'])

const expanded = ref(props.initialExpanded)

// Observer les changements de initialExpanded
watch(() => props.initialExpanded, (newValue) => {
  expanded.value = newValue
})

const totalDuration = computed(() => {
  const total = props.moduleGroup.videos.reduce((sum, v) => sum + (v.duration || 0), 0)
  if (total < 60) return `${total}min`
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return `${hours}h${mins > 0 ? mins : ''}`
})

const autoMatchedCount = computed(() => {
  return props.moduleGroup.videos.filter(v => v.matched_by_tag).length
})

function toggleExpanded() {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.module-section {
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.module-header {
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
}

.module-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary-color);
  opacity: 0;
  transition: opacity 0.2s;
}

.module-header:hover {
  background: var(--surface-100);
}

.module-header:hover::before {
  opacity: 1;
}

.module-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.module-title-row h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.module-title-row h2 i {
  color: var(--primary-color);
  font-size: 1.25rem;
}

.toggle-icon {
  color: var(--text-color-secondary);
  font-size: 1.25rem;
  transition: transform 0.3s;
}

.module-description {
  margin: 0.75rem 0 0 0;
  color: var(--text-color-secondary);
  line-height: 1.6;
  font-size: 0.938rem;
}

.module-stats {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-item i {
  color: var(--primary-color);
}

.module-content {
  border-top: 1px solid var(--surface-border);
}

.module-videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Animations */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}

@media (max-width: 768px) {
  .module-videos-grid {
    grid-template-columns: 1fr;
  }
  
  .module-title-row h2 {
    font-size: 1.25rem;
  }
}
</style>
