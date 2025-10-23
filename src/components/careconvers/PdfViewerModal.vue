<template>
  <Transition name="modal-fade">
  <div v-if="modelValue" class="modal-overlay" @click.self="close" @keydown.esc="close" role="dialog" aria-labelledby="pdf-title" aria-modal="true">
    <div class="modal">
      <header class="modal-header">
        <h2 id="pdf-title">📄 {{ title }}</h2>
      </header>
      <section class="modal-content">
        <div v-if="pdfUrl" class="pdf-container">
          <!-- Using iframe for broad browser support; fallbacks provided -->
          <iframe :src="computedSrc" title="PDF Viewer" class="pdf-frame"></iframe>
        </div>
        <div v-else class="empty">
          <p>Aucun document PDF spécifié.</p>
        </div>
      </section>
      <footer class="modal-actions">
        <a v-if="pdfUrl" class="btn" :href="pdfUrl" target="_blank" rel="noopener">🔗 Ouvrir dans un nouvel onglet</a>
        <button class="btn btn-primary" @click="close">✕ Fermer</button>
      </footer>
    </div>
  </div>
  </Transition>
</template>

<script>
export default {
  name: 'PdfViewerModal',
  props: {
    modelValue: { type: Boolean, default: false },
    pdfUrl: { type: String, default: '' },
    title: { type: String, default: 'Document PDF' },
  },
  emits: ['update:modelValue'],
  computed: {
    computedSrc() {
      // Add #toolbar=1 and allow default PDF viewer UI in browsers that support it
      // If the URL already has a hash, append with &
      if (!this.pdfUrl) return '';
      return this.pdfUrl.includes('#') ? `${this.pdfUrl}&toolbar=1` : `${this.pdfUrl}#toolbar=1`;
    },
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  width: min(1000px, 96vw);
  height: min(90vh, 920px);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header { padding: 12px 16px; border-bottom: 1px solid #eee; }
.modal-header h2 { margin: 0; font-size: 18px; color: #111827; }
.modal-content { flex: 1; background: #f9fafb; }
.pdf-container { position: relative; width: 100%; height: 100%; }
.pdf-frame { width: 100%; height: 100%; border: none; background: #fff; }
.empty { padding: 20px; color: #374151; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 10px 16px; border-top: 1px solid #eee; background: #fff; }
.btn { cursor: pointer; border-radius: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; color: #111827; font-weight: 600; text-decoration: none; }
.btn-primary { background: #0ea5e9; color: white; border-color: #0ea5e9; }
.btn-primary:hover { background: #0284c7; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); transition: all 0.2s; }
.btn:hover { background: #e5e7eb; transition: all 0.2s; }

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
  from { transform: scale(0.95) translateY(-20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes modal-slide-out {
  from { transform: scale(1) translateY(0); opacity: 1; }
  to { transform: scale(0.95) translateY(-20px); opacity: 0; }
}
</style>
