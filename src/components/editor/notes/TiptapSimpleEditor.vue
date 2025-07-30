<template>
  <div class="tiptap-simple-editor">
    <div class="toolbar" v-if="editor">
      <button @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }" :disabled="!editor" title="Gras"><b>B</b></button>
      <button @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }" :disabled="!editor" title="Italique"><i>I</i></button>
      <button @click="editor.chain().focus().toggleStrike().run()" :class="{ active: editor.isActive('strike') }" :disabled="!editor" title="Barré"><s>S</s></button>
      <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ active: editor.isActive('heading', { level: 1 }) }" :disabled="!editor" title="Titre 1">H1</button>
      <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ active: editor.isActive('heading', { level: 2 }) }" :disabled="!editor" title="Titre 2">H2</button>
      <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ active: editor.isActive('bulletList') }" :disabled="!editor" title="Liste à puces">• List</button>
      <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ active: editor.isActive('orderedList') }" :disabled="!editor" title="Liste numérotée">1. List</button>
      <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ active: editor.isActive('blockquote') }" :disabled="!editor" title="Citation">❝</button>
      <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ active: editor.isActive('codeBlock') }" :disabled="!editor" title="Bloc code">{ }</button>
      <button @click="editor.chain().focus().undo().run()" :disabled="!editor" title="Annuler">↺</button>
      <button @click="editor.chain().focus().redo().run()" :disabled="!editor" title="Rétablir">↻</button>
    </div>
    <EditorContent v-if="editor" :editor="editor" class="tiptap-editor" />
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'

const props = defineProps({ page: Object })
const emit = defineEmits(['save'])
const editor = ref(null)
let lastPageId = ref(props.page?.id)

function getInitialContent(page) {
  if (!page || !page.content) return '<h1>Commence à écrire…</h1>'
  try {
    return JSON.parse(page.content)
  } catch (e) {
    return page.content
  }
}

function createEditor(page) {
  if (editor.value) {
    editor.value.destroy()
    editor.value = null
  }
  editor.value = new Editor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: getInitialContent(page),
    onUpdate: () => {
      if (props.page) {
        emit('save', {
          ...props.page,
          content: JSON.stringify(editor.value.getJSON())
        })
      }
    }
  })
}

onMounted(() => {
  if (props.page) {
    createEditor(props.page)
    lastPageId.value = props.page?.id
  }
})

watch(() => props.page?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    nextTick(() => {
      createEditor(props.page)
      lastPageId.value = newId
    })
  }
})

onBeforeUnmount(() => {
  if (editor.value) editor.value.destroy()
})
</script>

<style scoped>
.tiptap-simple-editor {
  background: var(--surface-card);
  border-radius: 18px;
  box-shadow: 0 4px 32px 0 #0005;
  border: 1.5px solid #23242a;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  gap: 0.5em;
  justify-content: flex-start;
  align-items: center;
  background: var(--surface-c);
  border-radius: 12px;
  box-shadow: 0 2px 16px #0008;
  padding: 0.6em 1.2em;
  margin: 0 auto 1.2em auto;
  width: fit-content;
  position: sticky;
  top: 16px;
  left: 0;
  right: 0;
  z-index: 10;
}
.toolbar button {
  background: none;
  border: none;
  border-radius: 7px;
  padding: 0.35em 0.9em;
  font-size: 1.13em;
  cursor: pointer;
  color: #e0c36d;
  background: transparent;
  transition: background 0.15s, color 0.15s;
  outline: none;
}
.toolbar button.active,
.toolbar button:hover {
  background: #ffd70022;
  color: #ffd700;
}
.tiptap-editor,
.tiptap-editor:focus,
.tiptap-editor [contenteditable]:focus,
.tiptap-editor [contenteditable="true"]:focus,
.tiptap-editor [tabindex]:focus,
.tiptap-editor:focus-visible,
.tiptap-editor [contenteditable="true"]:focus-visible,
.tiptap-editor *:focus,
[contenteditable]:focus,
[contenteditable="true"]:focus,
[contenteditable]:focus-visible {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}
.tiptap-editor [contenteditable="true"] {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}
.tiptap-editor {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 2.5rem 2.2rem 4.5rem 2.2rem; /* Ajoute une grosse marge en bas */
  min-height: 0;
  /* Pour éviter que le contenu soit caché par la toolbar sticky ou le bord */
  box-sizing: border-box;
}
.tiptap-editor h1 {
  font-size: 2.1em;
  font-weight: bold;
  margin: 1.1em 0 0.5em 0;
  color: #fff;
  letter-spacing: -1px;
}
.tiptap-editor h2 {
  font-size: 1.45em;
  font-weight: bold;
  margin: 1.2em 0 0.7em 0;
  color: #ffd700;
}
.tiptap-editor p {
  margin: 0 0 1.2em 0;
}
.tiptap-editor ul,
.tiptap-editor ol {
  margin: 0 0 1.2em 2em;
}
.tiptap-editor li {
  margin-bottom: 0.35em;
}
.tiptap-editor blockquote {
  background: #23242a;
  border-left: 4px solid #ffd700;
  color: #b8b8b8;
  margin: 1.2em 0;
  padding: 0.8em 1.2em;
  border-radius: 8px;
  font-style: italic;
}
.tiptap-editor code {
  background: #23242a;
  color: #ffd700;
  border-radius: 4px;
  padding: 0.18em 0.5em;
  font-size: 0.97em;
}
.tiptap-editor pre {
  background: #18181b;
  color: #ffd700;
  border-radius: 8px;
  padding: 1.1em 1.3em;
  margin: 1.2em 0;
  font-size: 1em;
  overflow-x: auto;
}
.tiptap-editor a {
  color: #87bfff;
  text-decoration: underline;
}
.tiptap-editor strong {
  color: #fff;
}
.tiptap-editor em {
  color: #ffd700;
}
</style>