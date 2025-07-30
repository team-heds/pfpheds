<template>
  <div class="story-carousel">
    <div class="carousel-wrapper">
      <button class="carousel-arrow left" @click="prev" :disabled="currentIdx === 0">&#60;</button>
      <div class="carousel-content">
        <img v-if="isImage(currentMedia)" :src="currentMedia" class="carousel-media" />
        <video v-else controls class="carousel-media">
          <source :src="currentMedia" type="video/mp4" />
        </video>
      </div>
      <button class="carousel-arrow right" @click="next" :disabled="currentIdx === media.length - 1">&#62;</button>
    </div>
    <div class="carousel-indicators">
      <span v-for="(item, idx) in media" :key="idx" :class="{ active: idx === currentIdx }"></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StoryCarousel',
  props: {
    media: { 
      type: Array, 
      required: true 
    }
  },
  data() {
    return {
      currentIdx: 0
    }
  },
  computed: {
    currentMedia() {
      return this.media[this.currentIdx];
    }
  },
  methods: {
    isImage(url) {
      return url && url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    },
    next() {
      if (this.currentIdx < this.media.length - 1) {
        this.currentIdx++;
      }
    },
    prev() {
      if (this.currentIdx > 0) {
        this.currentIdx--;
      }
    }
  }
}
</script>

<style scoped>
.story-carousel {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  text-align: center;
}

.carousel-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-arrow {
  background: #fff;
  border: none;
  font-size: 2rem;
  color: var(--primary-700);
  cursor: pointer;
  border-radius: 50%;
  width: 2.4rem;
  height: 2.4rem;
  box-shadow: 0 2px 8px 0 rgba(80, 120, 200, 0.07);
  margin: 0 0.8rem;
  transition: background 0.15s;
}

.carousel-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.carousel-arrow:hover:not(:disabled) {
  background: var(--surface-hover);
}

.carousel-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-media {
  max-width: 350px;
  max-height: 500px;
  border-radius: 1.1rem;
  box-shadow: 0 4px 24px 0 rgba(80, 120, 200, 0.09);
  background: #f4f7fa;
  object-fit: cover;
}

.carousel-indicators {
  margin-top: 0.7rem;
}

.carousel-indicators span {
  display: inline-block;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: #dbeafe;
  margin: 0 0.2rem;
  transition: background 0.2s;
  cursor: pointer;
}

.carousel-indicators span.active {
  background: var(--primary-600);
}

.carousel-indicators span:hover {
  background: var(--primary-400);
}

/* Responsive */
@media (max-width: 768px) {
  .story-carousel {
    max-width: 100%;
  }
  
  .carousel-media {
    max-width: 280px;
    max-height: 400px;
  }
  
  .carousel-arrow {
    width: 2rem;
    height: 2rem;
    font-size: 1.5rem;
    margin: 0 0.5rem;
  }
}
</style>
