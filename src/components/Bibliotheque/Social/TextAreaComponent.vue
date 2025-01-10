<template>
  <div class="textarea-component ">
    <div class="editor-container">
      <Editor
        v-model="localValue"
        editorStyle="height: 320px"
        placeholder="Commencer un post..."
        @text-change="onTextChange"
        class="custom-editor"
      />
      <!-- Compteur de caractères -->
      <div class="char-counter" v-if="showCharCounter">
        {{ characterCount }}/500
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed } from 'vue';
import Editor from 'primevue/editor';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  maxLength: {
    type: Number,
    default: 500
  },
  showCharCounter: {
    type: Boolean,
    default: true
  }
});

const emits = defineEmits(['update:modelValue', 'input']);

const localValue = ref(props.modelValue);

/**
 * Compteur de caractères
 */
const characterCount = computed(() => {
  const text = localValue.value.replace(/<[^>]+>/g, '').trim(); // Supprimer les balises HTML
  return text.length;
});

/**
 * Événement déclenché à chaque changement de texte dans l’éditeur.
 */
function onTextChange(e) {
  const text = e.htmlValue.replace(/<[^>]+>/g, '').trim();
  if (text.length <= props.maxLength) {
    localValue.value = e.htmlValue;
    emits('update:modelValue', e.htmlValue);
    emits('input', e.htmlValue); // Pour la détection des tags
  } else {
    // Limiter la saisie au maximum de caractères
    const quill = e.editor;
    quill.deleteText(props.maxLength, quill.getLength());
  }
}

/**
 * Synchronise la valeur locale avec la prop parent.
 */
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localValue.value) {
      localValue.value = newValue;
    }
  }
);
</script>

<style scoped>
.textarea-component {
  width: 100%;
  max-width: 10000px;


}

.editor-container {
  position: relative;
  border-radius: 0.5rem;

}

.custom-editor {
  border: none; /* Suppression des bordures rigides */
  border-radius: 0.5rem;
  background-color : var(--surface-card);
  overflow: hidden;
  color: #fff; /* Texte blanc */
}

.custom-editor .ql-container {
  min-height: 200px; /* Espace plus grand */
  padding: 1rem; /* Marges internes */
  font-family: 'Inter', sans-serif; /* Typographie moderne */
  font-size: 1rem;
  background-color : var(--surface-card);
  color: #fff; /* Texte blanc */
}

/* Placeholder (texte par défaut dans l’éditeur) */
.custom-editor .ql-container .ql-editor::before {
  color: #aaa; /* Couleur claire pour le placeholder */
}

/* Compteur de caractères */
.char-counter {
  position: absolute;
  bottom: -25px;
  right: 0;
  font-size: 0.875rem;
  color: #999; /* Couleur secondaire */
}

/* Styles responsives */
@media (max-width: 768px) {
  .textarea-component {
    padding: 0.5rem;
  }

  .char-counter {
    font-size: 0.75rem;
    bottom: -20px;
  }
}
</style>
