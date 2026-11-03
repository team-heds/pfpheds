<template>
  <label class="content-field" :class="{ 'content-field--wide': wide }">
    <span>{{ label }}</span>
    <textarea v-if="type === 'textarea'" :value="modelValue" rows="3" @input="$emit('update:modelValue', $event.target.value)" />
    <input v-else :value="modelValue" :type="type" @input="$emit('update:modelValue', $event.target.value)" />
  </label>
</template>

<script setup>
defineProps({ modelValue: { type: [String, Number], default: '' }, label: { type: String, required: true }, type: { type: String, default: 'text' }, wide: Boolean })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.content-field{display:flex;flex-direction:column;gap:.4rem;color:#f7f9fc}.content-field--wide{grid-column:1/-1}.content-field span{font-size:.72rem;font-weight:700}.content-field input,.content-field textarea{width:100%;min-height:44px;padding:.68rem .72rem;border:1px solid #294866;border-radius:.55rem;color:#f7f9fc;background:#071426;font:inherit;font-size:16px;color-scheme:dark}.content-field input::placeholder,.content-field textarea::placeholder{color:#8294aa}.content-field textarea{resize:vertical;line-height:1.5}.content-field input:focus-visible,.content-field textarea:focus-visible{outline:3px solid #f3c300;outline-offset:1px}@media(max-width:720px){.content-field--wide{grid-column:1}}
</style>
