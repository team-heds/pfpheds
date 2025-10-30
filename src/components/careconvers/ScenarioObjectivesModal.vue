<template>
  <Transition name="modal-fade">
  <div v-if="modelValue" class="modal-overlay" @click.self="close" role="dialog" aria-labelledby="objectives-title" aria-modal="true">
    <div class="modal">
      <header class="modal-header">
        <h2 id="objectives-title">🎯 Objectifs du scénario</h2>
      </header>
      <section class="modal-content">
        <p class="intro">Il est attendu que l’étudiant·e :</p>
        <ul class="objectives">
          <li>1. Se présente à la résident·e</li>
          <li>2. Explique sa présence en chambre (apporter le petit-déjeuner)</li>
          <li>3. Dépose le plateau repas à table</li>
          <li>4. Repère les signes de douleur (gémissements, refus de manger – comportement inhabituel)</li>
          <li>5. Évalue la douleur (OPQRSTUI, échelle de la douleur)</li>
          <li>6. Adapte son mode de communication à la résidente (troubles sensoriels et cognitifs)</li>
          <li>7. Transmet l’information à son·sa référent·e (ISBAR).</li>
        </ul>
        <p class="note">Veuillez lire ces objectifs puis cliquer sur « J’ai lu, démarrer » pour commencer.</p>
      </section>
      <footer class="modal-actions">
        <button class="btn btn-secondary" @click="close">Fermer</button>
        <button class="btn btn-primary" @click="confirm">J’ai lu, démarrer</button>
      </footer>
    </div>
  </div>
  </Transition>
</template>

<script>
export default {
  name: 'ScenarioObjectivesModal',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'confirmed'],
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    confirm() {
      this.$emit('confirmed');
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
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}
.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #222;
}
.modal-content {
  padding: 16px 20px 0 20px;
  max-height: 60vh;
  overflow-y: auto;
}
.intro { font-weight: 600; margin-bottom: 8px; }
.objectives { margin: 0 0 12px 18px; padding: 0; color:black }
.objectives li { margin-bottom: 6px; line-height: 1.4; }
.note { color: #555; font-size: 14px; }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px 18px 20px;
  border-top: 1px solid #eee;
}
.btn { cursor: pointer; border-radius: 8px; padding: 10px 14px; border: 1px solid transparent; font-weight: 600; }
.btn-primary { background: #0ea5e9; color: white; }
.btn-primary:hover { background: #0284c7; }
.btn-secondary { background: #f3f4f6; color: #111827; border-color: #e5e7eb; }
.btn-secondary:hover { background: #e5e7eb; }

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
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes modal-slide-out {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-50px);
    opacity: 0;
  }
}
</style>