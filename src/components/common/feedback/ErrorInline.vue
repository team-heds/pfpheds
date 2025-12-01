<template>
  <small
    v-if="message"
    :id="id"
    class="p-error error-inline"
    role="alert"
    aria-live="polite"
    aria-atomic="true"
  >
    {{ message }}
  </small>
</template>

<script setup>
const props = defineProps({
  id: { type: String, default: undefined },
  message: { type: String, default: '' }
})
</script>

<style scoped>
.error-inline {
  display: inline-block;
}
</style>
