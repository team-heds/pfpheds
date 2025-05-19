<!-- src/components/Social/InfiniteScroll.vue -->
<template>
    <div>
      <slot></slot> <!-- Affiche les posts passés à ce composant -->
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
      }
    },
    mounted() {
      // Scroll sur le parent direct (ex: .posts-container)
      if (this.$el.parentNode) {
        this.$el.parentNode.addEventListener('scroll', this.onScroll);
      }
    },
    beforeUnmount() {
      if (this.$el.parentNode) {
        this.$el.parentNode.removeEventListener('scroll', this.onScroll);
      }
    },
    methods: {
      onScroll(e) {
        const el = e.target;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50 && !this.loading) {
          this.$emit('load-more');
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .loading-spinner {
    text-align: center;
    padding: 20px;
    font-size: 16px;
    color: #f3c300;
  }
  </style>