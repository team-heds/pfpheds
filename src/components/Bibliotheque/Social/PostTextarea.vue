<template>
  <div class="post-textarea">
    <Textarea
      v-model="value"
      :placeholder="placeholder"
      class="form-control"
      @input="onInput"
    />
  </div>
</template>

<script>
export default {
  name: "PostTextarea",
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      default: "Exprimez-vous...",
    },
  },
  emits: ["update:modelValue"],
  methods: {
    onInput(event) {
      this.$emit("update:modelValue", event.target.value);
    },
  },
};
</script>

<style scoped>
.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
}
</style>
