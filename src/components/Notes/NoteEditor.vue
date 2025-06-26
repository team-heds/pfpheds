<template>
  <Panel header="Éditeur de note" class="note-editor">
    <div class="p-fluid">
      <InputText v-model="title" placeholder="Titre de la feuille" class="note-title p-mb-3" />
      <div class="note-dates">
        <span v-if="page?.createdAt">Créée : {{ formatDate(page.createdAt) }}</span>
        <span v-if="page?.updatedAt">Dernière modif : {{ formatDate(page.updatedAt) }}</span>
      </div>
      <template v-if="editor">
        <div class="tiptap-toolbar">
          <Button icon="pi pi-bold" class="p-button-text" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" />
          <Button icon="pi pi-italic" class="p-button-text" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" />
          <Button icon="pi pi-underline" class="p-button-text" @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }" />
          <Button icon="pi pi-list-ul" class="p-button-text" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" />
          <Button icon="pi pi-list-ol" class="p-button-text" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" />
          <Button icon="pi pi-check-square" class="p-button-text" @click="editor.chain().focus().toggleTaskList().run()" :class="{ 'is-active': editor.isActive('taskList') }" />
          <Button icon="pi pi-quote-left" class="p-button-text" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }" />
          <Button icon="pi pi-table" class="p-button-text" @click="addTable" />
          <Button icon="pi pi-code" class="p-button-text" @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ 'is-active': editor.isActive('codeBlock') }" />
          <Button icon="pi pi-link" class="p-button-text" @click="setLink" />
          <Button icon="pi pi-image" class="p-button-text" @click="addImage" />
          <Button icon="pi pi-eraser" class="p-button-text" @click="editor.chain().focus().clearNodes().unsetAllMarks().run()" />
        </div>
        <EditorContent :editor="editor" class="tiptap-editor" />
      </template>
    </div>
  </Panel>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted, onBeforeUnmount } from 'vue'
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import MarkdownIt from 'markdown-it'

const props = defineProps({ page: Object })
const emit = defineEmits(['save'])
const title = ref(props.page?.title || '')
const editor = ref(null)
const md = new MarkdownIt()

let autosaveTimeout = null

function triggerAutosave() {
  if (autosaveTimeout) clearTimeout(autosaveTimeout)
  autosaveTimeout = setTimeout(() => {
    emit('save', {
      title: title.value,
      content: JSON.stringify(editor.value.getJSON())
    })
  }, 1000)
}

onMounted(() => {
  editor.value = new Editor({
    content: props.page?.content ? JSON.parse(props.page.content) : '',
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      TaskList,
      TaskItem,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    autofocus: false,
    editable: true,
    editorProps: {
      handlePaste(view, event) {
        const clipboardData = event.clipboardData || window.clipboardData
        if (!clipboardData) return false
        const text = clipboardData.getData('text/plain')
        if (/[*_#\-`\[\]]|\n/.test(text)) {
          const html = md.render(text)
          editor.value.commands.insertContent(html)
          event.preventDefault()
          triggerAutosave()
          return true
        }
        return false
      }
    },
    onUpdate: triggerAutosave,
  })
})
onBeforeUnmount(() => {
  if (editor.value) editor.value.destroy()
  if (autosaveTimeout) clearTimeout(autosaveTimeout)
})

watch(() => props.page, (newPage) => {
  title.value = newPage?.title || ''
  if (editor.value) {
    editor.value.commands.setContent(newPage?.content ? JSON.parse(newPage.content) : '')
  }
})

watch(title, () => {
  triggerAutosave()
})

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
}

function addTable() {
  editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}
function setLink() {
  const url = prompt('URL du lien :')
  if (url) editor.value.chain().focus().setLink({ href: url }).run()
}
function addImage() {
  const url = prompt('URL de l\'image :')
  if (url) editor.value.chain().focus().setImage({ src: url }).run()
}
</script>

<style scoped>
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: var(--surface-card) !important;
  color: var(--text-color, #f5f6fa);
  box-shadow: none;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 32px; /* Marge basse */
}
.note-editor::-webkit-scrollbar {
  display: none;
}
.note-title {
  font-size: 1.2rem;
  width: 100%;
  background: var(--surface-card) !important;
  color: var(--text-color, #f5f6fa);
}
.note-title::placeholder {
  color: #888a;
}
.note-dates {
  display: flex;
  gap: 1.5em;
  color: #aaa;
  font-size: 0.9em;
  margin-bottom: 0.5em;
}
.tiptap-toolbar {
  display: flex;
  gap: 0.25em;
  margin-bottom: 0.5em;
  flex-wrap: wrap;
  background: var(--surface-card) !important;
  border-radius: 5px;
  padding: 0.4em 0.3em;
}
.tiptap-toolbar .p-button {
  color: #f5f6fa;
  background: var(--surface-card) !important;
  border: none;
}
.tiptap-toolbar .p-button.is-active {
  background: var(--surface-card) !important;
  color: #ffd700;
}
.tiptap-editor {
  min-height: 400px;
  height: 100%;
  max-height: none;
  overflow-y: auto;
  padding-bottom: 40px;
  background: var(--surface-card) !important;
  border-radius: 4px;
  border: 1px solid #333;
  padding: 1em;
  font-family: inherit;
  font-size: 1.05em;
  margin-bottom: 1.5em;
  color: #f5f6fa;
  caret-color: #ffd700;
  box-sizing: border-box;
}
.tiptap-editor ::selection {
  background: var(--surface-card) !important;
}
.tiptap-editor p,
.tiptap-editor ul,
.tiptap-editor ol,
.tiptap-editor blockquote,
.tiptap-editor table {
  color: #f5f6fa;
}
.tiptap-editor a {
  color: #80bfff;
}
.tiptap-editor pre {
  background: var(--surface-card) !important;
  color: #ffd700;
  border-radius: 4px;
  padding: 0.5em 0.8em;
}
.tiptap-editor th, .tiptap-editor td {
  border: 1px solid #444;
}
.is-active {
  background: var(--surface-card) !important;
  color: #ffd700 !important;
}
.p-panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
}
.p-panel.note-editor {
  height: 100%;
  min-height: 0;
}
</style>
