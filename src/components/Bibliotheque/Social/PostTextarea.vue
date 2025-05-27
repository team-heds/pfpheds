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
  background-color: #f5f5f5;
  border-radius: 1.2rem;
}
</style>
