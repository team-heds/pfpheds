<template>
  <div class="capsules-ir-page-toc">
    <div class="capsules-ir-page-toc__inner">
      <div class="text-900 font-medium mb-2">Sur cette page</div>
      <ul class="m-0 pl-3 text-700">
        <li v-for="item in items" :key="item.id" class="mb-2">
          <a
            :href="`#${item.id}`"
            class="capsules-ir-page-toc__link"
            :class="{ 'capsules-ir-page-toc__link--active': item.id === activeId }"
            @click.prevent="onGo(item.id)"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const activeId = ref('')
let observer = null

function setupObserver(items) {
  if (!items || !items.length) return

  try {
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))
        if (visible[0]?.target?.id) activeId.value = visible[0].target.id
      },
      {
        root: null,
        threshold: [0.15, 0.25, 0.35, 0.5],
        rootMargin: '0px 0px -60% 0px',
      }
    )
  } catch (e) {
    observer = null
    return
  }

  items.forEach((it) => {
    const el = document.getElementById(it.id)
    if (el) observer.observe(el)
  })
}

function cleanupObserver() {
  if (!observer) return
  try {
    observer.disconnect()
  } catch (e) {
    // no-op
  }
  observer = null
}

function onGo(id) {
  const el = document.getElementById(id)
  if (!el) return

  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeId.value = id

  try {
    window.history.replaceState(null, '', `#${id}`)
  } catch (e) {
    // no-op
  }
}

onMounted(() => {
  setupObserver(props.items)
})

watch(
  () => props.items,
  (newItems) => {
    cleanupObserver()
    setupObserver(newItems)
  }
)

onBeforeUnmount(() => {
  cleanupObserver()
})
</script>

<style scoped>
.capsules-ir-page-toc {
  position: sticky;
  top: 0.75rem;
}

.capsules-ir-page-toc__inner {
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.capsules-ir-page-toc__link {
  color: var(--text-color);
  text-decoration: none;
}

.capsules-ir-page-toc__link--active {
  color: var(--primary-color);
  font-weight: 600;
}

.capsules-ir-page-toc__link:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.capsules-ir-page-toc__link:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  border-radius: 0.25rem;
}
</style>
