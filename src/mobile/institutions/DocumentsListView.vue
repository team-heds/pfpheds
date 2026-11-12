<template>
  <div ref="scrollerRef" class="m-inst-view">
    <div v-if="loading && !folders.length" class="m-docs" role="status" aria-label="Chargement des documents">
      <div v-for="n in 4" :key="n" class="m-docs__skeleton m-skeleton" aria-hidden="true"></div>
    </div>

    <div v-else-if="failed && !folders.length" class="m-state" role="alert">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="alert" /></span>
      <p class="m-state__title">Les documents ne se chargent pas</p>
      <p class="m-state__text">Vérifie ta connexion, puis réessaie.</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>

    <div v-else-if="!folders.length" class="m-state">
      <span class="m-state__icon" aria-hidden="true"><MIcon name="folder" /></span>
      <p class="m-state__title">Aucun document</p>
      <p class="m-state__text">Les documents de formation pratique apparaîtront ici.</p>
    </div>

    <div v-else class="m-docs">
      <section v-for="folder in folders" :key="folder.id" class="m-docs__folder">
        <h3 class="m-docs__heading">
          <button
            type="button"
            class="m-docs__toggle"
            :aria-expanded="isOpen(folder.id) ? 'true' : 'false'"
            :aria-controls="`m-docs-${folder.id}`"
            @click="toggle(folder.id)"
          >
            <span class="m-docs__icon" aria-hidden="true"><MIcon name="folder" /></span>
            <span class="m-docs__name">{{ folder.name }}</span>
            <span class="m-docs__count">{{ folder.count }}</span>
            <MIcon name="chevron" class="m-docs__chevron" :class="{ 'is-open': isOpen(folder.id) }" />
          </button>
        </h3>
        <div v-show="isOpen(folder.id)" :id="`m-docs-${folder.id}`" class="m-docs__content">
          <p v-if="!folder.count" class="m-docs__empty">Ce dossier est vide.</p>
          <template v-for="group in folder.groups" :key="group.id">
            <p v-if="group.name" class="m-docs__sub">{{ group.name }}</p>
            <ul class="m-docs__files">
              <li v-for="file in group.files" :key="file.id">
                <button type="button" class="m-docs__file" :disabled="opening === file.id" @click="open(file)">
                  <MIcon name="file" />
                  <span>{{ file.name }}</span>
                  <span v-if="opening === file.id" class="m-spinner" aria-hidden="true"></span>
                  <MIcon v-else name="next" />
                </button>
              </li>
            </ul>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import MIcon from '@/mobile/ui/MIcon.vue'
import { useDocumentStore } from '@/stores/documentStore'
import { openFilePhysioDocument } from '@/service/filePhysioMediaService'
import { useKeptScroll } from '@/mobile/shell/useKeptScroll'

const props = defineProps({ active: { type: Boolean, default: false } })

const documentStore = useDocumentStore()
const toast = useToast()
const scrollerRef = ref(null)
useKeptScroll(scrollerRef, () => props.active)

const loading = ref(false)
const failed = ref(false)
const loaded = ref(false)
const openFolders = ref(new Set())
const opening = ref(null)

// Dossiers prêts à afficher : fichiers du dossier, puis ceux de chaque sous-dossier.
const folders = computed(() => (documentStore.folders || []).map((folder) => {
  const groups = [
    { id: `${folder.id}:racine`, name: '', files: folder.files || [] },
    ...(folder.subFolders || []).map((sub) => ({ id: sub.id, name: sub.name, files: sub.files || [] })),
  ].filter((group) => group.files.length)
  return { id: folder.id, name: folder.name, groups, count: groups.reduce((total, group) => total + group.files.length, 0) }
}))

const isOpen = (id) => openFolders.value.has(id)
function toggle(id) {
  const next = new Set(openFolders.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openFolders.value = next
}

async function load() {
  if (loading.value) return
  loading.value = true
  failed.value = false
  try {
    await documentStore.loadFoldersTree()
    loaded.value = true
    // Le premier dossier non vide est ouvert d'office.
    const first = folders.value.find((folder) => folder.count)
    if (first && !openFolders.value.size) openFolders.value = new Set([first.id])
  } catch (error) {
    console.error('[Documents] Chargement impossible:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
}

async function open(file) {
  opening.value = file.id
  try {
    await openFilePhysioDocument(file)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Document indisponible', detail: error?.message || 'Le document n’a pas pu être ouvert.', life: 4000 })
  } finally {
    opening.value = null
  }
}

watch(() => props.active, (active) => {
  if (active && !loaded.value) void load()
}, { immediate: true })
</script>

<style scoped>
.m-docs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}
.m-docs__skeleton {
  height: 60px;
  border-radius: 16px;
}
.m-docs__folder {
  overflow: hidden;
  border-radius: 16px;
  background: var(--m-surface);
}
.m-docs__heading {
  margin: 0;
}
.m-docs__toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 8px 14px;
  border: 0;
  background: none;
  color: var(--m-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
}
.m-docs__toggle:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: -2px;
  border-radius: 16px;
}
.m-docs__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--m-raised);
  color: var(--m-accent-text);
}
.m-docs__name {
  flex: 1;
  min-width: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
}
.m-docs__count {
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.m-docs__chevron {
  width: 18px;
  height: 18px;
  color: var(--m-muted);
  transition: transform 160ms ease;
}
.m-docs__chevron.is-open {
  transform: rotate(180deg);
}
.m-docs__content {
  padding: 0 14px 10px;
}
.m-docs__sub {
  margin: 10px 0 2px;
  color: var(--m-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.m-docs__empty {
  margin: 0;
  padding: 6px 0;
  color: var(--m-muted);
  font-size: 0.875rem;
}
.m-docs__files {
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-docs__files li + li {
  border-top: 1px solid var(--m-line);
}
.m-docs__file {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 8px 0;
  border: 0;
  background: none;
  color: var(--m-fg);
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
}
.m-docs__file span:not(.m-spinner) {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.m-docs__file :deep(.m-icon) {
  width: 18px;
  height: 18px;
  color: var(--m-muted);
}
.m-docs__file :deep(.m-icon:first-child) {
  color: var(--m-accent-text);
}
.m-docs__file:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
  border-radius: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .m-docs__chevron {
    transition: none;
  }
}
</style>
