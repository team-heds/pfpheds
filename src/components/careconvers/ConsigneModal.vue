<template>
  <Transition name="modal-fade">
  <div v-if="modelValue" class="modal-overlay" @click.self="close" @keydown.esc="close" role="dialog" aria-labelledby="consigne-title" aria-modal="true">
    <div class="modal">
      <header class="modal-header">
        <h2 id="consigne-title">📝 {{ title }}</h2>
      </header>
      <section class="modal-content">
        <p class="consigne-text">{{ text }}</p>
      </section>
      <footer class="modal-actions">
        <button class="btn btn-primary" @click="acknowledge" @keydown.enter="acknowledge">▶️ Commencer la conversation</button>
      </footer>
    </div>
  </div>
  </Transition>
</template>


<script>
export default {
  name: 'ConsigneModal',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: 'Consigne' },
    text: { type: String, default: 'fd' },
  },
  emits: ['update:modelValue', 'acknowledged'],
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    acknowledge() {
      this.$emit('acknowledged');
      this.$emit('update:modelValue', false);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  width: min(720px, 92vw);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  overflow: hidden;
}
.modal-header { padding: 16px 20px; border-bottom: 1px solid #eee; }
.modal-header h2 { margin: 0; font-size: 20px; color: #222; }
.modal-content { padding: 16px 20px; }
.consigne-text { color: #111827; line-height: 1.6; font-size: 15px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px 18px 20px; border-top: 1px solid #eee; }
.btn { cursor: pointer; border-radius: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; color: #111827; font-weight: 600; }
.btn-primary { background: #0ea5e9; color: white; border-color: #0ea5e9; }
.btn-primary:hover { background: #0284c7; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); transition: all 0.2s; }

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal {
  animation: modal-slide-in 0.3s ease;
}
.modal-fade-leave-active .modal {
  animation: modal-slide-out 0.3s ease;
}
@keyframes modal-slide-in {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes modal-slide-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-50px); opacity: 0; }
}
</style>
