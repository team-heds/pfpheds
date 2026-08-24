<!-- src/components/Social/InfiniteScroll.vue -->
<template>
  <div>
    <slot></slot>
    <div v-if="loading" class="loading-spinner">Chargement...</div>
  </div>
</template>

<script>
export default {
  name: 'InfiniteScroll',
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    scrollTarget: {
      type: String,
      default: 'parent',
      validator: (value) => ['parent', 'window'].includes(value)
    }
  },
  mounted() {
    this.getScrollTarget()?.addEventListener('scroll', this.onScroll)
  },
  beforeUnmount() {
    this.getScrollTarget()?.removeEventListener('scroll', this.onScroll)
  },
  methods: {
    getScrollTarget() {
      return this.scrollTarget === 'window' ? window : this.$el.parentNode
    },
    onScroll(e) {
      let scrollTop
      let clientHeight
      let scrollHeight

      if (this.scrollTarget === 'window') {
        const documentElement = document.documentElement
        scrollTop = window.scrollY || documentElement.scrollTop || 0
        clientHeight = window.innerHeight || documentElement.clientHeight
        scrollHeight = documentElement.scrollHeight
      } else {
        const el = e.target
        scrollTop = el.scrollTop
        clientHeight = el.clientHeight
        scrollHeight = el.scrollHeight
      }

      if (scrollTop + clientHeight >= scrollHeight - 50 && !this.loading) {
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
