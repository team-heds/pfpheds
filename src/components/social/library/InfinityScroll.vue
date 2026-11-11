<!-- src/components/Social/InfiniteScroll.vue -->
<template>
  <div>
    <slot></slot>
    <div v-if="loading" class="loading-spinner">Chargement...</div>
  </div>
</template>

<script>
import { findPageScroller, getScrollMetrics } from '@/utils/pageScroller'

// Charge la suite un peu avant d'atteindre le bas, pour un défilement sans arrêt.
const LOAD_MORE_MARGIN = 400

export default {
  name: 'InfiniteScroll',
  emits: ['load-more'],
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    scrollTarget: {
      type: String,
      default: 'parent',
      validator: (value) => ['parent', 'window', 'page'].includes(value)
    }
  },
  mounted() {
    // « page » : le bloc qui défile réellement autour du fil (sur téléphone,
    // ce n'est pas la fenêtre). La cible est mémorisée pour être retirée ensuite.
    this.scrollElement = this.getScrollTarget()
    this.scrollElement?.addEventListener('scroll', this.onScroll, { passive: true })
  },
  beforeUnmount() {
    this.scrollElement?.removeEventListener('scroll', this.onScroll)
    this.scrollElement = null
  },
  methods: {
    getScrollTarget() {
      if (this.scrollTarget === 'window') return window
      if (this.scrollTarget === 'page') return findPageScroller(this.$el)
      return this.$el.parentNode
    },
    onScroll() {
      const { scrollTop, clientHeight, scrollHeight } = getScrollMetrics(this.scrollElement)
      if (scrollTop + clientHeight >= scrollHeight - LOAD_MORE_MARGIN && !this.loading) {
        this.$emit('load-more')
      }
    }
  }
}
</script>

<style scoped>
.loading-spinner {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  color: #f3c300;
}
</style>
