<template>
  <div class="textarea-component">
    <div
      class="editor-container"
      :class="{ 'is-disabled': disabled }"
      :style="{ '--editor-min-height': minHeight }"
    >
      <div
        v-if="editor"
        class="editor-toolbar"
        role="toolbar"
        aria-label="Mise en forme du texte"
      >
        <button
          v-for="action in toolbarActions"
          :key="action.label"
          type="button"
          class="toolbar-button"
          :class="{ active: action.isActive() }"
          :aria-label="action.label"
          :aria-pressed="action.isActive()"
          :disabled="disabled || !action.canRun()"
          @click="action.run"
        >
          <span aria-hidden="true">{{ action.icon }}</span>
        </button>
      </div>

      <EditorContent
        :editor="editor"
        class="custom-editor"
        :aria-label="placeholder"
      />

      <div v-if="showCharCounter" class="char-counter" aria-live="polite">
        {{ characterCount }}/{{ maxLength }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Plugin } from '@tiptap/pm/state'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  maxLength: {
    type: Number,
    default: 1000
  },
  showCharCounter: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: 'Commencer un post...'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  minHeight: {
    type: String,
    default: '320px'
  }
})

const emit = defineEmits(['update:modelValue', 'input'])
const characterCount = ref(0)
const editorRevision = ref(0)

const CharacterLimit = Extension.create({
  name: 'characterLimit',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction(transaction, state) {
          if (!transaction.docChanged) return true

          const currentLength = state.doc.textContent.trim().length
          const nextLength = transaction.doc.textContent.trim().length
          return nextLength <= props.maxLength || nextLength < currentLength
        }
      })
    ]
  }
})

const editor = new Editor({
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: props.placeholder }),
    CharacterLimit
  ],
  content: props.modelValue || '',
  editable: !props.disabled,
  editorProps: {
    attributes: {
      'aria-label': props.placeholder,
      class: 'social-rich-text-input'
    }
  },
  onUpdate: ({ editor: currentEditor }) => {
    const html = currentEditor.getHTML()
    characterCount.value = currentEditor.state.doc.textContent.trim().length
    emit('update:modelValue', html)
    emit('input', html)
  },
  onTransaction: () => {
    editorRevision.value += 1
  }
})

characterCount.value = editor.state.doc.textContent.trim().length

const toolbarActions = computed(() => {
  void editorRevision.value
  return [
  {
    label: 'Gras',
    icon: 'B',
    isActive: () => editor.isActive('bold'),
    canRun: () => editor.can().chain().focus().toggleBold().run(),
    run: () => editor.chain().focus().toggleBold().run()
  },
  {
    label: 'Italique',
    icon: 'I',
    isActive: () => editor.isActive('italic'),
    canRun: () => editor.can().chain().focus().toggleItalic().run(),
    run: () => editor.chain().focus().toggleItalic().run()
  },
  {
    label: 'Liste à puces',
    icon: '•',
    isActive: () => editor.isActive('bulletList'),
    canRun: () => editor.can().chain().focus().toggleBulletList().run(),
    run: () => editor.chain().focus().toggleBulletList().run()
  },
  {
    label: 'Liste numérotée',
    icon: '1.',
    isActive: () => editor.isActive('orderedList'),
    canRun: () => editor.can().chain().focus().toggleOrderedList().run(),
    run: () => editor.chain().focus().toggleOrderedList().run()
  },
  {
    label: 'Citation',
    icon: '“”',
    isActive: () => editor.isActive('blockquote'),
    canRun: () => editor.can().chain().focus().toggleBlockquote().run(),
    run: () => editor.chain().focus().toggleBlockquote().run()
  },
  {
    label: 'Annuler',
    icon: '↶',
    isActive: () => false,
    canRun: () => editor.can().chain().focus().undo().run(),
    run: () => editor.chain().focus().undo().run()
  },
  {
    label: 'Rétablir',
    icon: '↷',
    isActive: () => false,
    canRun: () => editor.can().chain().focus().redo().run(),
    run: () => editor.chain().focus().redo().run()
  }
  ]
})

watch(
  () => props.modelValue,
  (newValue) => {
    const nextValue = newValue || ''
    if (nextValue !== editor.getHTML()) {
      editor.commands.setContent(nextValue, false)
      characterCount.value = editor.state.doc.textContent.trim().length
    }
  }
)

watch(
  () => props.disabled,
  (disabled) => editor.setEditable(!disabled)
)

onBeforeUnmount(() => editor.destroy())

defineExpose({ editor })
</script>

<style scoped>
.textarea-component,
.editor-container {
  width: 100%;
  max-width: 880px;
}

.editor-container {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--surface-border, #334155);
  border-radius: 0.75rem;
  background: var(--surface-card);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.editor-container:focus-within {
  border-color: var(--primary-color, #ffcc00);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color, #ffcc00) 22%, transparent);
}

.editor-container.is-disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--surface-border, #334155);
  background: color-mix(in srgb, var(--surface-card) 90%, white 10%);
}

.toolbar-button {
  display: inline-flex;
  min-width: 2.25rem;
  min-height: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text-color, #fff);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.toolbar-button:hover:not(:disabled),
.toolbar-button.active {
  border-color: color-mix(in srgb, var(--primary-color, #ffcc00) 45%, transparent);
  background: color-mix(in srgb, var(--primary-color, #ffcc00) 15%, transparent);
  color: var(--primary-color, #ffcc00);
}

.toolbar-button:focus-visible {
  outline: 2px solid var(--primary-color, #ffcc00);
  outline-offset: 2px;
}

.toolbar-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.custom-editor :deep(.ProseMirror) {
  min-height: var(--editor-min-height);
  padding: 1rem 1rem 2.5rem;
  color: var(--text-color, #fff);
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  outline: none;
}

.custom-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  float: left;
  height: 0;
  color: var(--text-color-secondary, #94a3b8);
  content: attr(data-placeholder);
  pointer-events: none;
}

.char-counter {
  position: absolute;
  right: 0.75rem;
  bottom: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary, #94a3b8);
}

@media (max-width: 768px) {
  .editor-toolbar {
    gap: 0.125rem;
  }

  .toolbar-button {
    min-width: 2.75rem;
    min-height: 2.75rem;
  }

  .custom-editor :deep(.ProseMirror) {
    min-height: 160px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .editor-container {
    transition: none;
  }
}
</style>
